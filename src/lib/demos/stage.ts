import { release, teardown } from '../teardown.ts';

export type PartTags = Record<string, keyof HTMLElementTagNameMap>;
export type PartsOf<T extends PartTags> = { [K in keyof T]: HTMLElementTagNameMap[T[K]] };

const tokenNames = ['bg', 'ink', 'body', 'faint', 'rule', 'wash'] as const;

export type Rgb = readonly [number, number, number];
export type Tokens = { readonly [N in (typeof tokenNames)[number]]: Rgb };

/** Draws the stage and writes every output. Return true to get another frame while the stage is live. */
export type Frame = (now: number, live: boolean) => boolean | void;

export type Scene<P> = {
  start(root: HTMLElement, parts: Partial<P>, signal: AbortSignal): Promise<void>;
};

type FittedContext = CanvasRenderingContext2D & { width: number; height: number };

export interface Stage {
  /** Aborts when the demo unmounts or its mount fails. Pass it to every listener. */
  readonly signal: AbortSignal;
  /** Runs at teardown, last added first, or at once after teardown. */
  defer(step: () => void): void;
  /** Asks for one frame. The first frame draws at mount; later ones wait until the stage is live. */
  wake(): void;
  /** In the viewport, and the tab is visible. */
  readonly live: boolean;
  onLive(listener: (live: boolean) => void): void;
  readonly reducedMotion: boolean;
  /** The six color tokens as sRGB bytes, read again when the color scheme changes. */
  readonly tokens: Tokens;
  /** The canvas's 2D context, its backing store fitted to its CSS box at up to 2x. */
  canvas(element: HTMLCanvasElement): FittedContext;
  /** A canvas font in the page's Geist Mono, loaded before the first frame. */
  font(px: number): string;
}

export const css = (color: Rgb, alpha?: number) =>
  `rgb(${color.join(' ')}${alpha === undefined ? '' : ` / ${alpha}`})`;

// A 1x1 canvas resolves the oklch tokens to the sRGB bytes the page paints.
function tokenReader() {
  const swatch = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
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
    async start(root, collected, signal) {
      if (signal.aborted) throw signal.reason;
      for (const key in spec.parts) {
        const tag = spec.parts[key];
        if ((collected[key] as Element | undefined)?.localName !== tag) {
          throw new Error(`The demo part ${key} is not a <${tag}>`);
        }
      }

      const cleanup = teardown();
      const own = new AbortController();
      cleanup.add(() => own.abort());
      let destroyed = false;
      const destroy = () => {
        if (destroyed) return;
        destroyed = true;
        release({ destroy: cleanup.run });
      };
      signal.addEventListener('abort', destroy, { once: true });
      const on = { signal: own.signal };

      try {
        let frame: Frame | null = null;
        let raf = 0;
        let first = true;
        let woken = false;
        let running = false;
        let seen = false;
        let wasLive = false;
        const isLive = () => seen && !document.hidden;
        const liveListeners: ((live: boolean) => void)[] = [];
        cleanup.add(() => cancelAnimationFrame(raf));

        const schedule = () => {
          if (raf || !frame || destroyed) return;
          if (first || ((woken || running) && isLive())) raf = requestAnimationFrame(tick);
        };
        const tick = (now: number) => {
          raf = 0;
          const live = isLive();
          if (!first && !live) return;
          first = woken = false;
          running = frame!(now, live) === true;
          schedule();
        };
        const wake = () => {
          woken = true;
          schedule();
        };
        const liveChanged = () => {
          const live = isLive();
          if (live !== wasLive) {
            wasLive = live;
            for (const listener of liveListeners) listener(live);
          }
          schedule();
        };

        const viewport = new IntersectionObserver((entries) => {
          seen = entries[entries.length - 1].isIntersecting;
          liveChanged();
        });
        viewport.observe(root);
        cleanup.add(() => viewport.disconnect());
        document.addEventListener('visibilitychange', liveChanged, on);

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
        cleanup.add(() => resizes.disconnect());
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
          defer: (step) => (destroyed ? step() : cleanup.add(step)),
          wake,
          get live() {
            return isLive();
          },
          onLive(listener) {
            liveListeners.push(listener);
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
              context = Object.assign(element.getContext('2d')!, { width, height });
              canvases.set(element, context);
              resizes.observe(element);
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

        await document.fonts.load(stage.font(11));
        if (signal.aborted) throw signal.reason;
        frame = await spec.mount(stage, collected as PartsOf<T>);
        if (signal.aborted) throw signal.reason;
        schedule();
      } catch (error) {
        destroy();
        throw error;
      }
    },
  };
}
