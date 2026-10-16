// Training for every model kind: the contract a model meets, one run of it, and the worker's
// message handler. train.worker.ts only wires this to the worker, so Node tests drive the real
// handler.
import { oneLetter, threeLetter } from './letters.ts';
import { type Adam, type FloatType, type Params, type Tensor, adamw } from './params.ts';

/** What a model kind is, as the trainer sees it. One object per kind, holding its calibrated settings. */
export type Kind = {
  /** The text it trains on, a path under public/, such as /data/names.txt. */
  readonly data: string;
  readonly adam: Adam;
  /** Training stops by itself after this many steps. Infinity trains until paused. */
  readonly until: number;
  /** A model with fresh numbers from `seed`, in float32 unless `float` says otherwise. */
  create(text: string, options?: { seed?: number; float?: FloatType }): Model;
};

export type Model = {
  readonly params: Params;
  /** The alphabet, one character per token id. */
  readonly symbols: string;
  /** One row per symbol, the numbers the letter map draws. */
  readonly letters: Tensor;
  /** Draws the next batch, writes every slope into params.grad, and returns the batch's average loss. */
  practice(): number;
  /** Writes text with the current numbers, such as ten names. */
  write(): string;
};

/** One model training: its numbers, its optimizer, and how far it got. */
export type Run = {
  readonly model: Model;
  /** Steps taken since the numbers were made. */
  readonly steps: number;
  /** One training step, a batch and one turn of adamw. Returns the batch's average loss. */
  step(): number;
};

/** The only way a model trains, in the worker, in tests, and in scripts. */
export function startRun(
  kind: Kind,
  text: string,
  options: { seed?: number; float?: FloatType } = {},
): Run {
  const model = kind.create(text, options);
  const turn = adamw(model.params, kind.adam);
  let steps = 0;
  return {
    model,
    get steps() {
      return steps;
    },
    step() {
      const loss = model.practice();
      turn();
      steps++;
      return loss;
    },
  };
}

/** The window of every "100-step average loss" the gates use. */
export const averageOver = 100;

const kinds = { oneLetter, threeLetter } satisfies Record<string, Kind>;
export type ModelKind = keyof typeof kinds;

export type Progress = {
  /** Steps taken since the numbers were made. */
  readonly step: number;
  /** The loss of each step since the previous progress, oldest first. */
  readonly losses: Float32Array<ArrayBuffer>;
  /** The average of the last averageOver step losses, or null before the first step. */
  readonly average: number | null;
  /** Steps this worker ran on these numbers and the milliseconds spent inside them, without reporting. */
  readonly timing: { readonly steps: number; readonly ms: number };
  /** The worker is stepping this model. */
  readonly running: boolean;
  /** The model reached its kind's last step, so start does nothing until reset. */
  readonly done: boolean;
};

export type Snapshot = {
  readonly step: number;
  readonly running: boolean;
  readonly symbols: string;
  /** Numbers per symbol. */
  readonly width: number;
  /** symbols.length rows of width numbers, a copy. */
  readonly vectors: Float32Array<ArrayBuffer>;
};

export type Sample = { readonly step: number; readonly text: string };

/** What the worker reports. Out is derived from this list, and so are the page's listeners. */
export type Updates = { progress: Progress; snapshot: Snapshot; sample: Sample };

/** Every message names its model, which is also its session in the worker. */
export type In = {
  /**
   * start trains until pause or done, making the model first if this worker has none. pause stops
   * stepping. reset makes fresh numbers from the seed, at step 0, paused. sample writes text with
   * the current numbers. snapshot reports now, making the model first if this worker has none.
   * Every one but sample posts a progress and a snapshot.
   */
  readonly type: 'start' | 'pause' | 'reset' | 'sample' | 'snapshot';
  readonly model: ModelKind;
};

export type Out =
  | { [T in keyof Updates]: { readonly type: T; readonly model: ModelKind } & Updates[T] }[keyof Updates]
  | { readonly type: 'error'; readonly model: ModelKind; readonly message: string };

/** What the handler needs from where it runs: a worker's postMessage and fetch, or a test's fakes. */
export type Io = {
  post(message: Out, transfer: Transferable[]): void;
  /** Reads a file under public/ by its path. */
  read(path: string): Promise<Response>;
};

/** Training stops this often to read messages. */
export const sliceMs = 50;
export const progressEvery = 100;
export const snapshotEvery = 250;

type Session = {
  readonly model: ModelKind;
  readonly kind: Kind;
  run: Run | null;
  want: boolean;
  losses: number[];
  recent: number[];
  timing: { steps: number; ms: number };
  lastProgress: number;
  lastSnapshot: number;
  queue: Promise<void>;
};

/**
 * The worker's message handler. The function it returns handles one message and resolves once the
 * message has taken effect, so after `await receive(pause)` no step runs. It never rejects: a
 * failure posts an error instead.
 */
export function trainingHandler(io: Io): (message: In) => Promise<void> {
  const sessions = new Map<ModelKind, Session>();
  const texts = new Map<string, Promise<string>>();
  let looping = false;

  const read = (path: string) => {
    let text = texts.get(path);
    if (!text) {
      text = io.read(path).then((response) => {
        if (!response.ok) throw new Error(`${path} answered ${response.status}`);
        return response.text();
      });
      text.catch(() => texts.delete(path));
      texts.set(path, text);
    }
    return text;
  };

  const done = (s: Session) => s.run !== null && s.run.steps >= s.kind.until;

  const postProgress = (s: Session) => {
    const run = s.run!;
    const losses = Float32Array.from(s.losses);
    s.losses = [];
    s.lastProgress = performance.now();
    io.post(
      {
        type: 'progress',
        model: s.model,
        step: run.steps,
        losses,
        average: s.recent.length ? s.recent.reduce((a, b) => a + b) / s.recent.length : null,
        timing: { ...s.timing },
        running: s.want,
        done: done(s),
      },
      [losses.buffer],
    );
  };

  const postSnapshot = (s: Session) => {
    const { model, steps } = s.run!;
    const vectors = Float32Array.from(model.letters.data);
    s.lastSnapshot = performance.now();
    io.post(
      {
        type: 'snapshot',
        model: s.model,
        step: steps,
        running: s.want,
        symbols: model.symbols,
        width: model.letters.shape[1],
        vectors,
      },
      [vectors.buffer],
    );
  };

  const report = (s: Session) => {
    postSnapshot(s);
    postProgress(s);
  };

  const fresh = async (s: Session) => {
    s.run = startRun(s.kind, await read(s.kind.data));
    s.losses = [];
    s.recent = [];
    s.timing = { steps: 0, ms: 0 };
  };

  function slice(s: Session) {
    const run = s.run!;
    const end = performance.now() + sliceMs;
    do {
      const before = performance.now();
      const loss = run.step();
      const after = performance.now();
      s.timing.steps++;
      s.timing.ms += after - before;
      if (!Number.isFinite(loss)) {
        s.want = false;
        throw new Error(`The ${s.model} model's loss became ${loss} at step ${run.steps}`);
      }
      s.losses.push(loss);
      s.recent.push(loss);
      if (s.recent.length > averageOver) s.recent.shift();
      if (done(s)) {
        s.want = false;
        report(s);
        return;
      }
      if (after - s.lastProgress >= progressEvery) postProgress(s);
      if (after - s.lastSnapshot >= snapshotEvery) postSnapshot(s);
    } while (performance.now() < end);
  }

  async function loop() {
    if (looping) return;
    looping = true;
    try {
      for (;;) {
        const active = [...sessions.values()].filter((s) => s.want);
        if (active.length === 0) return;
        for (const s of active) {
          try {
            slice(s);
          } catch (error) {
            fail(s, error);
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    } finally {
      looping = false;
    }
  }

  const fail = (s: Session, error: unknown) => {
    s.want = false;
    s.run = null;
    io.post({ type: 'error', model: s.model, message: error instanceof Error ? error.message : String(error) }, []);
  };

  async function apply(s: Session, type: In['type']) {
    if (!s.run || type === 'reset') await fresh(s);
    switch (type) {
      case 'start':
        if (!done(s)) {
          s.want = true;
          void loop();
        }
        return report(s);
      case 'pause':
      case 'reset':
        s.want = false;
        return report(s);
      case 'snapshot':
        return report(s);
      case 'sample':
        io.post({ type: 'sample', model: s.model, step: s.run!.steps, text: s.run!.model.write() }, []);
        return;
      default:
        throw new Error(`Unknown message ${type satisfies never}`);
    }
  }

  return function receive({ type, model }) {
    let s = sessions.get(model);
    if (!s) {
      const kind = kinds[model];
      s = {
        model,
        kind,
        run: null,
        want: false,
        losses: [],
        recent: [],
        timing: { steps: 0, ms: 0 },
        lastProgress: 0,
        lastSnapshot: 0,
        queue: Promise.resolve(),
      };
      sessions.set(model, s);
    }
    const session = s;
    session.queue = session.queue.then(() => apply(session, type)).catch((error) => fail(session, error));
    return session.queue;
  };
}
