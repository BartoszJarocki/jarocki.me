import assert from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import { test as nodeTest } from 'node:test';

import { type Frame, type Stage, defineScene } from './stage.ts';

type Entry = { isIntersecting: boolean };

function fakeBrowser() {
  const frames = new Map<number, (now: number) => void>();
  const observers = new Set<Observer>();
  const queries: EventTarget[] = [];
  const uncaught: unknown[] = [];
  const doc = Object.assign(new EventTarget(), {
    hidden: false,
    fonts: { load: () => Promise.resolve([]) },
    documentElement: {},
    createElement: () => ({
      getContext: () => ({
        canvas: {},
        clearRect() {},
        fillRect() {},
        getImageData: () => ({ data: [0, 0, 0, 255] }),
      }),
    }),
  });
  let onScreen = true;
  let nextFrame = 1;

  class Observer {
    callback: (entries: Entry[]) => void;
    targets = new Set<object>();
    due = false;
    constructor(callback: (entries: Entry[]) => void) {
      this.callback = callback;
      observers.add(this);
    }
    observe(target: object) {
      this.targets.add(target);
    }
    unobserve(target: object) {
      this.targets.delete(target);
    }
    disconnect() {
      this.targets.clear();
    }
  }
  class IntersectionObserver extends Observer {
    observe(target: object) {
      super.observe(target);
      this.due = true;
    }
  }

  Object.assign(globalThis, {
    document: doc,
    devicePixelRatio: 1,
    IntersectionObserver,
    ResizeObserver: Observer,
    getComputedStyle: () => ({ fontFamily: 'Geist Mono', getPropertyValue: () => '#000' }),
    matchMedia: () => {
      const query = Object.assign(new EventTarget(), { matches: false });
      queries.push(query);
      return query;
    },
    requestAnimationFrame: (callback: (now: number) => void) => {
      frames.set(nextFrame, callback);
      return nextFrame++;
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
  });

  const settle = () => new Promise((resolve) => setImmediate(resolve));
  const report = (callback: () => void) => {
    try {
      callback();
    } catch (error) {
      uncaught.push(error);
    }
  };

  return {
    uncaught,
    async render() {
      await settle();
      const due = [...frames.values()];
      frames.clear();
      for (const callback of due) report(() => callback(0));
      for (const observer of observers) {
        if (!observer.due || !observer.targets.size) continue;
        observer.due = false;
        report(() => observer.callback([{ isIntersecting: onScreen }]));
      }
      await settle();
    },
    scroll(to: 'on' | 'off') {
      onScreen = to === 'on';
      for (const observer of observers) observer.due = observer instanceof IntersectionObserver;
    },
    held: () => ({
      observing: [...observers].reduce((sum, observer) => sum + observer.targets.size, 0),
      listeners:
        getEventListeners(doc, 'visibilitychange').length +
        queries.reduce((sum, query) => sum + getEventListeners(query, 'change').length, 0),
      frames: frames.size,
    }),
  };
}

const released = { observing: 0, listeners: 0, frames: 0 };
const root = {} as HTMLElement;
const canvas = (context: object | null = { setTransform() {} }) =>
  ({
    localName: 'canvas',
    getBoundingClientRect: () => ({ width: 300, height: 150 }),
    getContext: () => context,
  }) as unknown as HTMLCanvasElement;
const sceneOf = (
  mount: (stage: Stage, parts: { chart: HTMLCanvasElement }) => Frame | Promise<Frame>,
) => defineScene({ parts: { chart: 'canvas' }, mount });
const ignore = () => {};
// A cleanup that never settles start would otherwise hang pnpm test instead of failing it.
const test = (name: string, body: () => Promise<void>) => nodeTest(name, { timeout: 2000 }, body);

test('a frame that throws rejects start and releases every observer, listener, and frame', async () => {
  const browser = fakeBrowser();
  let stage!: Stage;
  let frames = 0;
  const scene = sceneOf((given, { chart }) => {
    stage = given;
    return () => {
      stage.canvas(chart);
      if (++frames === 2) throw new Error('frame 2 broke');
    };
  });
  const rejected = assert.rejects(
    scene.start(root, { chart: canvas() }, new AbortController().signal, ignore),
    /frame 2 broke/,
  );
  await browser.render();
  await browser.render();
  assert.deepEqual(
    { frames, held: browser.held() },
    { frames: 1, held: { observing: 2, listeners: 4, frames: 0 } },
  );

  stage.wake();
  await browser.render();
  await rejected;
  assert.deepEqual(
    { held: browser.held(), uncaught: browser.uncaught },
    { held: released, uncaught: [] },
  );
});

test('an onLive listener that throws rejects start and releases the stage', async () => {
  const browser = fakeBrowser();
  const scene = sceneOf((stage) => {
    stage.onLive((live) => {
      if (!live) throw new Error('pause broke');
    });
    return ignore;
  });
  const rejected = assert.rejects(
    scene.start(root, { chart: canvas() }, new AbortController().signal, ignore),
    /pause broke/,
  );
  await browser.render();
  await browser.render();
  browser.scroll('off');
  await browser.render();
  await rejected;
  assert.deepEqual(
    { held: browser.held(), uncaught: browser.uncaught },
    { held: released, uncaught: [] },
  );
});

test('a mount that resumes after unmount leaves nothing observed', async () => {
  const browser = fakeBrowser();
  const unmount = new AbortController();
  let resume!: () => void;
  const scene = sceneOf(async (stage, { chart }) => {
    await new Promise<void>((resolve) => (resume = resolve));
    stage.canvas(chart);
    return ignore;
  });
  const running = scene.start(root, { chart: canvas() }, unmount.signal, ignore);
  await browser.render();
  unmount.abort();
  resume();
  await running.catch(ignore);
  assert.deepEqual(browser.held(), released);
});

test('a mount that throws rejects start and leaves no listener on the caller signal', async () => {
  const browser = fakeBrowser();
  const unmount = new AbortController();
  const scene = sceneOf(() => {
    throw new Error('mount broke');
  });
  const rejected = assert.rejects(
    scene.start(root, { chart: canvas() }, unmount.signal, ignore),
    /mount broke/,
  );
  await browser.render();
  await rejected;
  assert.deepEqual(
    { held: browser.held(), callerListeners: getEventListeners(unmount.signal, 'abort').length },
    { held: released, callerListeners: 0 },
  );
});

test('a stage on screen is live at mount, and onLive tells a late listener the current state', async () => {
  const browser = fakeBrowser();
  const unmount = new AbortController();
  let stage!: Stage;
  let liveAtMount: boolean | undefined;
  const scene = sceneOf((given) => {
    stage = given;
    liveAtMount = stage.live;
    return ignore;
  });
  const running = scene.start(root, { chart: canvas() }, unmount.signal, ignore);
  await browser.render();
  await browser.render();
  const heard: boolean[] = [];
  stage.onLive((live) => heard.push(live));
  browser.scroll('off');
  await browser.render();
  unmount.abort();
  await running;
  assert.deepEqual({ liveAtMount, heard }, { liveAtMount: true, heard: [true, false] });
});

test('a canvas without a 2D context rejects start with an Unsupported error', async () => {
  const browser = fakeBrowser();
  const scene = sceneOf((stage, { chart }) => {
    stage.canvas(chart);
    return ignore;
  });
  const rejected = assert.rejects(
    scene.start(root, { chart: canvas(null) }, new AbortController().signal, ignore),
    { name: 'Unsupported' },
  );
  await browser.render();
  await rejected;
  assert.deepEqual(browser.held(), released);
});

test('start calls ready after the first frame and resolves on unmount', async () => {
  const browser = fakeBrowser();
  const unmount = new AbortController();
  const order: string[] = [];
  const scene = sceneOf(() => () => {
    order.push('frame');
  });
  const running = scene.start(root, { chart: canvas() }, unmount.signal, () => order.push('ready'));
  await browser.render();
  await browser.render();
  unmount.abort();
  await running;
  assert.deepEqual({ order, held: browser.held() }, { order: ['frame', 'ready'], held: released });
});

test('an onLive listener added after mount that throws at once rejects start and releases the stage', async () => {
  const browser = fakeBrowser();
  let stage!: Stage;
  let outcome = 'pending';
  const scene = sceneOf((given) => {
    stage = given;
    return ignore;
  });
  scene.start(root, { chart: canvas() }, new AbortController().signal, ignore).then(
    () => (outcome = 'resolved'),
    (error: Error) => (outcome = error.message),
  );
  await browser.render();
  await browser.render();
  try {
    stage.onLive(() => {
      throw new Error('late listener broke');
    });
  } catch {}
  await browser.render();
  assert.deepEqual(
    { outcome, held: browser.held() },
    { outcome: 'late listener broke', held: released },
  );
});

test('a first frame that ends the scene never calls ready', async () => {
  const browser = fakeBrowser();
  const unmount = new AbortController();
  const order: string[] = [];
  const scene = sceneOf(() => () => {
    order.push('frame');
    unmount.abort();
  });
  const running = scene.start(root, { chart: canvas() }, unmount.signal, () => order.push('ready'));
  await browser.render();
  await browser.render();
  await running;
  assert.deepEqual({ order, held: browser.held() }, { order: ['frame'], held: released });
});

test('a scene keeps the parts it started with after the caller clears them', async () => {
  const browser = fakeBrowser();
  const unmount = new AbortController();
  const chart = canvas();
  const collected: { chart?: HTMLCanvasElement } = { chart };
  const drawnOn: (HTMLCanvasElement | undefined)[] = [];
  let stage!: Stage;
  const scene = sceneOf((given, parts) => {
    stage = given;
    return () => {
      drawnOn.push(parts.chart);
    };
  });
  const running = scene.start(root, collected, unmount.signal, ignore);
  await browser.render();
  await browser.render();
  collected.chart = undefined;
  stage.wake();
  await browser.render();
  unmount.abort();
  await running;
  assert.deepEqual(drawnOn, [chart, chart]);
});

test('fail after ready rejects start with that error and releases the stage', async () => {
  const browser = fakeBrowser();
  const order: string[] = [];
  let stage!: Stage;
  const scene = sceneOf((given) => {
    stage = given;
    return ignore;
  });
  const rejected = assert.rejects(
    scene.start(root, { chart: canvas() }, new AbortController().signal, () => order.push('ready')),
    /worker crashed/,
  );
  await browser.render();
  await browser.render();
  stage.fail(new Error('worker crashed'));
  await rejected;
  assert.deepEqual({ order, held: browser.held() }, { order: ['ready'], held: released });
});

test('a ready that throws rejects start and releases the stage', async () => {
  const browser = fakeBrowser();
  const scene = sceneOf(() => ignore);
  const rejected = assert.rejects(
    scene.start(root, { chart: canvas() }, new AbortController().signal, () => {
      throw new Error('ready broke');
    }),
    /ready broke/,
  );
  await browser.render();
  await browser.render();
  await rejected;
  assert.deepEqual(
    { held: browser.held(), uncaught: browser.uncaught },
    { held: released, uncaught: [] },
  );
});
