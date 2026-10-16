import type { In, ModelKind, Out, Updates } from '../ml/training';
import type { Stage } from './stage';

export type { ModelKind, Progress, Sample, Snapshot } from '../ml/training';

export type Listeners = { readonly [T in keyof Updates]?: (update: Updates[T]) => void };

export type Trainer = {
  /** The reader wants training. It runs while this demo is live, and stops by itself at the kind's last step. */
  train(): void;
  pause(): void;
  /** Fresh numbers from the seed, step 0, paused, for every demo on this model. */
  reset(): void;
  /** Asks for text from the current numbers. It arrives at listeners.sample. */
  sample(): void;
  /** The reader pressed train and hasn't paused or reset since, and the model isn't done. */
  readonly training: boolean;
};

type Handle = {
  readonly stage: Stage;
  readonly listeners: Listeners;
  wanted: boolean;
  live: boolean;
  readonly seen: Set<keyof Updates>;
  opened: (() => void) | null;
};

type Session = {
  readonly model: ModelKind;
  readonly handles: Set<Handle>;
  done: boolean;
  sent: 'start' | 'pause';
};

let page: { readonly worker: Worker; readonly sessions: Map<ModelKind, Session> } | null = null;

const post = (message: In) => page?.worker.postMessage(message);

const failAll = (handles: Iterable<Handle>, error: Error) => {
  for (const handle of [...handles]) handle.stage.fail(error);
};

function spawn() {
  const worker = new Worker(new URL('../ml/train.worker.ts', import.meta.url), { type: 'module' });
  const sessions = new Map<ModelKind, Session>();
  const everyHandle = () => [...sessions.values()].flatMap((session) => [...session.handles]);
  worker.addEventListener('message', (event: MessageEvent<Out>) => {
    const message = event.data;
    const session = sessions.get(message.model);
    if (!session) return;
    if (message.type === 'error') return failAll(session.handles, new Error(message.message));
    if (message.type === 'progress') session.done = message.done;
    for (const handle of [...session.handles]) {
      try {
        (handle.listeners[message.type] as ((update: typeof message) => void) | undefined)?.(
          message,
        );
      } catch (error) {
        handle.stage.fail(error);
        continue;
      }
      handle.seen.add(message.type);
      if (handle.opened && handle.seen.has('progress') && handle.seen.has('snapshot')) {
        handle.opened();
        handle.opened = null;
      }
    }
  });
  // A worker script that fails to load fires a plain Event, without a message.
  worker.addEventListener('error', (event) =>
    failAll(
      everyHandle(),
      new Error((event as ErrorEvent).message || 'The training worker failed to load'),
    ),
  );
  worker.addEventListener('messageerror', () =>
    failAll(everyHandle(), new Error('The page could not read a message from the training worker')),
  );
  return { worker, sessions };
}

function steer(session: Session) {
  const run = !session.done && [...session.handles].some((h) => h.wanted && h.live);
  if (run === (session.sent === 'start')) return;
  session.sent = run ? 'start' : 'pause';
  post({ type: session.sent, model: session.model });
}

function detach(session: Session, handle: Handle) {
  session.handles.delete(handle);
  steer(session);
  if (session.handles.size || !page) return;
  page.sessions.delete(session.model);
  if (page.sessions.size) return;
  page.worker.terminate();
  page = null;
}

/**
 * Opens the page's trainer for `model` on this stage. Resolves once the model exists in the worker
 * and the listeners have had its first progress and snapshot, so the scene's first frame has
 * something to draw. Two demos that open the same model share it.
 */
export function openTrainer(stage: Stage, model: ModelKind, listeners: Listeners = {}) {
  return new Promise<Trainer>((resolve, reject) => {
    page ??= spawn();
    let session = page.sessions.get(model);
    if (!session) {
      session = { model, handles: new Set(), done: false, sent: 'pause' };
      page.sessions.set(model, session);
    }
    const own = session;
    const handle: Handle = {
      stage,
      listeners,
      wanted: false,
      live: false,
      seen: new Set(),
      opened: null,
    };
    const trainer: Trainer = {
      train() {
        handle.wanted = true;
        steer(own);
      },
      pause() {
        handle.wanted = false;
        steer(own);
      },
      reset() {
        for (const each of own.handles) each.wanted = false;
        own.done = false;
        own.sent = 'pause';
        post({ type: 'reset', model });
      },
      sample: () => post({ type: 'sample', model }),
      get training() {
        return handle.wanted && !own.done;
      },
    };
    handle.opened = () => resolve(trainer);
    own.handles.add(handle);
    stage.defer(() => {
      reject(stage.signal.reason);
      detach(own, handle);
    });
    stage.onLive((live) => {
      handle.live = live;
      steer(own);
    });
    post({ type: 'snapshot', model });
  });
}
