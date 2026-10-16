import { release, teardown } from '../teardown.ts';

export type PartTags = Record<string, keyof HTMLElementTagNameMap>;
export type PartsOf<T extends PartTags> = { [K in keyof T]: HTMLElementTagNameMap[T[K]] };

const tokenNames = ['bg', 'ink', 'body', 'faint', 'rule', 'wash'] as const;

export type Rgb = readonly [number, number, number];
export type Tokens = { readonly [N in (typeof tokenNames)[number]]: Rgb };

/** Draws the stage. Return true to get another frame while the stage is live. */
export type Frame = (now: number, live: boolean) => boolean | void;

/** Throw it when the scene can't run in this browser. The demo shows its still and logs nothing. */
export class Unsupported extends Error {
  name = 'Unsupported';
}

export type Scene<P> = {
  /** Runs the scene until signal aborts, then resolves. Calls ready after the first frame. Rejects when the mount, a frame, ready, or an onLive listener throws, or the scene calls fail. */
  start(
    root: HTMLElement,
    parts: Partial<P>,
    signal: AbortSignal,
    ready: () => void,
  ): Promise<void>;
};

type FittedContext = CanvasRenderingContext2D & { width: number; height: number };

export interface Stage {
  /** Aborts when the scene ends. Pass it to every listener. */
  readonly signal: AbortSignal;
  /** Runs at teardown, last added first, or at once after teardown. */
  defer(step: () => void): void;
  /** Ends the scene with this error, as a throwing frame does, so the demo shows its still. */
  fail(error: unknown): void;
  /** Asks for one frame. The first frame draws at mount; later ones wait until the stage is live. */
  wake(): void;
  /** In the viewport, and the tab is visible. */
  readonly live: boolean;
  /** Calls the listener with the current state at once, then on every change. */
  onLive(listener: (live: boolean) => void): void;
  /** The runtime never stops a frame that asks for more, so the scene reads this and decides. */
  readonly reducedMotion: boolean;
  /** The six color tokens as sRGB bytes, read again when the color scheme changes. */
  readonly tokens: Tokens;
  /** The canvas's 2D context, its backing store fitted to its CSS box at up to 2x. Throws Unsupported without one. */
  canvas(element: HTMLCanvasElement): FittedContext;
  /** A canvas font in the page's Geist Mono, loaded before the first frame. */
  font(px: number): string;
}

export const css = (color: Rgb, alpha?: number) =>
  `rgb(${color.join(' ')}${alpha === undefined ? '' : ` / ${alpha}`})`;

function context2d(canvas: HTMLCanvasElement, settings?: CanvasRenderingContext2DSettings) {
  const context = canvas.getContext('2d', settings);
  if (!context) throw new Unsupported('This browser has no 2D canvas');
  return context;
}

// A 1x1 canvas resolves the oklch tokens to the sRGB bytes the page paints.
function tokenReader() {
  const swatch = context2d(document.createElement('canvas'), { willReadFrequently: true });
  swatch.canvas.width = swatch.canvas.height = 1;
  return () => {
    const style = getComputedStyle(document.documentElement);
    const read = (name: string): Rgb => {
      swatch.clearRect(0, 0, 1, 1);
      swatch.fillStyle = '#000';
      swatch.fillStyle = style.getPropertyValue(`--${name}`).trim();
      swatch.fillRect(0, 0, 1, 1);
      const [r, g, b] = swatch.getImageData(0, 0, 1, 1).data;
      return [r, g, b];
    };
    return Object.fromEntries(tokenNames.map((name) => [name, read(name)])) as Tokens;
  };
}

export function defineScene<T extends PartTags>(spec: {
  parts: T;
  mount(stage: Stage, parts: PartsOf<T>): Frame | Promise<Frame>;
}): Scene<PartsOf<T>> {
  return {
    start: (root, collected, signal, ready) =>
      new Promise((resolve, reject) => {
        const cleanup = teardown();
        const own = new AbortController();
        const on = { signal: own.signal };
        const end = (settle: () => void) => {
          if (own.signal.aborted) return;
          own.abort();
          release({ destroy: cleanup.run });
          settle();
        };
        const fail = (error: unknown) => end(() => reject(error));
        const defer = (step: () => void) => (own.signal.aborted ? step() : cleanup.add(step));
        signal.addEventListener('abort', () => end(() => resolve()), on);
        if (signal.aborted) end(() => resolve());
        else setUp().catch(fail);

        async function setUp() {
          for (const key in spec.parts) {
            const tag = spec.parts[key];
            if ((collected[key] as Element | undefined)?.localName !== tag) {
              throw new Error(`The demo part ${key} is not a <${tag}>`);
            }
          }
          const parts = { ...collected } as PartsOf<T>;

          let frame: Frame | null = null;
          let raf = 0;
          let first = true;
          let woken = false;
          let running = false;
          let seen = false;
          let live = false;
          const liveListeners: ((live: boolean) => void)[] = [];
          cleanup.add(() => cancelAnimationFrame(raf));

          const schedule = () => {
            if (raf || !frame || own.signal.aborted) return;
            if (first || ((woken || running) && live)) raf = requestAnimationFrame(tick);
          };
          const tick = (now: number) => {
            raf = 0;
            if (!first && !live) return;
            const opening = first;
            first = woken = false;
            try {
              running = frame!(now, live) === true;
              if (opening && !own.signal.aborted) ready();
            } catch (error) {
              return fail(error);
            }
            schedule();
          };
          const wake = () => {
            woken = true;
            schedule();
          };
          const update = () => {
            const next = seen && !document.hidden;
            if (next !== live) {
              live = next;
              try {
                for (const listener of liveListeners) listener(live);
              } catch (error) {
                return fail(error);
              }
            }
            schedule();
          };

          let sighted = () => {};
          const sighting = new Promise<void>((resolve) => (sighted = resolve));
          const viewport = new IntersectionObserver((entries) => {
            seen = entries[entries.length - 1].isIntersecting;
            sighted();
            update();
          });
          viewport.observe(root);
          cleanup.add(() => viewport.disconnect());
          document.addEventListener('visibilitychange', update, on);

          const readTokens = tokenReader();
          let tokens = readTokens();
          matchMedia('(prefers-color-scheme: dark)').addEventListener(
            'change',
            () => {
              tokens = readTokens();
              wake();
            },
            on,
          );
          const motion = matchMedia('(prefers-reduced-motion: reduce)');
          motion.addEventListener('change', wake, on);

          const canvases = new Map<HTMLCanvasElement, FittedContext>();
          const resizes = new ResizeObserver((entries) => {
            let changed = false;
            for (const { target, contentRect } of entries) {
              const context = canvases.get(target as HTMLCanvasElement);
              if (!context) continue;
              if (context.width === contentRect.width && context.height === contentRect.height)
                continue;
              context.width = contentRect.width;
              context.height = contentRect.height;
              changed = true;
            }
            if (changed) wake();
          });
          // A zoom changes the pixel ratio without resizing the CSS box, so no ResizeObserver fires.
          const watchRatio = () =>
            matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener(
              'change',
              () => {
                watchRatio();
                wake();
              },
              { once: true, signal: own.signal },
            );
          watchRatio();

          const family = getComputedStyle(root).fontFamily;

          const stage: Stage = {
            signal: own.signal,
            defer,
            fail,
            wake,
            get live() {
              return live;
            },
            onLive(listener) {
              liveListeners.push(listener);
              try {
                listener(live);
              } catch (error) {
                fail(error);
              }
            },
            get reducedMotion() {
              return motion.matches;
            },
            get tokens() {
              return tokens;
            },
            canvas(element) {
              let context = canvases.get(element);
              if (!context) {
                const { width, height } = element.getBoundingClientRect();
                context = Object.assign(context2d(element), { width, height });
                canvases.set(element, context);
                resizes.observe(element);
                defer(() => resizes.unobserve(element));
              }
              const ratio = Math.min(devicePixelRatio, 2);
              const width = Math.round(context.width * ratio);
              const height = Math.round(context.height * ratio);
              if (element.width !== width || element.height !== height) {
                element.width = width;
                element.height = height;
              }
              context.setTransform(ratio, 0, 0, ratio, 0, 0);
              return context;
            },
            font: (px) => `${px}px ${family}`,
          };

          await Promise.all([document.fonts.load(stage.font(11)), sighting]);
          own.signal.throwIfAborted();
          const mounted = await spec.mount(stage, parts);
          own.signal.throwIfAborted();
          frame = mounted;
          schedule();
        }
      }),
  };
}
