import { type Exam, gpt } from './gpt.ts';
import { oneLetter, threeLetter } from './letters.ts';
import {
  type Adam,
  type Checkpoint,
  type FloatType,
  type Params,
  type Tensor,
  adamw,
  load,
  save,
} from './params.ts';

export type Kind<M extends Model = Model> = {
  readonly textPath: string;
  readonly adam: Adam;
  readonly until: number;
  create(text: string, options?: { seed?: number; float?: FloatType }): M;
};

export type Model = {
  readonly params: Params;
  readonly symbols: string;
  readonly letters: Tensor;
  /** Draws the next batch, writes every slope into params.grad, and returns the batch's average loss. */
  practice(): number;
  write(settings?: { temperature?: number }): string;
  exam?(): Exam;
  wordShare?(text: string): number;
};

export type Run<M extends Model = Model> = {
  readonly model: M;
  readonly steps: number;
  step(): number;
};

export function startRun<M extends Model>(
  kind: Kind<M>,
  text: string,
  options: { seed?: number; float?: FloatType; step?: number } = {},
): Run<M> {
  const model = kind.create(text, options);
  const turn = adamw(model.params, kind.adam);
  let steps = options.step ?? 0;
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

export const averageOver = 100;

const kinds = { oneLetter, threeLetter, gpt } satisfies Record<string, Kind>;
export type ModelKind = keyof typeof kinds;

export type Evaluation = Exam & {
  readonly step: number;
  readonly text: string;
  readonly wordShare: number;
};

export type Progress = {
  readonly step: number;
  readonly replaced: boolean;
  readonly newLosses: Float32Array<ArrayBuffer>;
  readonly stepTimes: Float32Array<ArrayBuffer>;
  readonly evaluation: Evaluation | null;
  readonly average: number | null;
  readonly timing: { readonly steps: number; readonly ms: number };
  readonly running: boolean;
  readonly done: boolean;
};

export type Snapshot = {
  readonly step: number;
  readonly running: boolean;
  readonly symbols: string;
  readonly width: number;
  readonly vectors: Float32Array<ArrayBuffer>;
};

export type Sample = { readonly requestId: number; readonly step: number; readonly text: string };
export type Weights = {
  readonly requestId: number;
  readonly step: number;
  readonly symbols: string;
  readonly checkpoint: Checkpoint;
};

export type Updates = { progress: Progress; snapshot: Snapshot; sample: Sample; weights: Weights };

export type In = { readonly model: ModelKind } & (
  | { readonly type: 'start' | 'pause' | 'reset' | 'snapshot' }
  | { readonly type: 'sample'; readonly requestId: number; readonly temperature?: number }
  | { readonly type: 'weights'; readonly requestId: number }
  | {
      readonly type: 'load';
      readonly checkpoint: Checkpoint;
      readonly symbols: string;
      readonly step: number;
    }
);

export type Out =
  | {
      [T in keyof Updates]: { readonly type: T; readonly model: ModelKind } & Updates[T];
    }[keyof Updates]
  | { readonly type: 'error'; readonly model: ModelKind; readonly message: string };

export type Io = {
  post(message: Out, transfer: Transferable[]): void;
  read(path: string): Promise<Response>;
};

export const sliceMs = 50;
export const progressEvery = 100;
export const snapshotEvery = 250;

type Session = {
  readonly model: ModelKind;
  readonly kind: Kind;
  run: Run | null;
  want: boolean;
  losses: number[];
  stepTimes: number[];
  evaluation: Evaluation | null;
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

  const postProgress = (s: Session, replaced = false) => {
    const run = s.run!;
    const newLosses = Float32Array.from(s.losses);
    const stepTimes = Float32Array.from(s.stepTimes);
    s.losses = [];
    s.stepTimes = [];
    s.lastProgress = performance.now();
    io.post(
      {
        type: 'progress',
        model: s.model,
        step: run.steps,
        replaced,
        newLosses,
        stepTimes,
        evaluation: s.evaluation,
        average: s.recent.length ? s.recent.reduce((a, b) => a + b) / s.recent.length : null,
        timing: { ...s.timing },
        running: s.want,
        done: done(s),
      },
      [newLosses.buffer, stepTimes.buffer],
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

  const report = (s: Session, replaced = false) => {
    postSnapshot(s);
    postProgress(s, replaced);
  };

  const evaluate = (s: Session) => {
    const { model, steps } = s.run!;
    if (!model.exam || !model.wordShare) return;
    const exam = model.exam();
    const text = model.write();
    s.evaluation = { ...exam, step: steps, text, wordShare: model.wordShare(text) };
  };

  const fresh = async (s: Session) => {
    s.run = startRun(s.kind, await read(s.kind.textPath));
    s.losses = [];
    s.stepTimes = [];
    s.evaluation = null;
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
      s.stepTimes.push(after - before);
      if (!Number.isFinite(loss)) {
        s.want = false;
        throw new Error(`The ${s.model} model's loss became ${loss} at step ${run.steps}`);
      }
      s.losses.push(loss);
      s.recent.push(loss);
      if (s.recent.length > averageOver) s.recent.shift();
      if (run.steps % 150 === 0) evaluate(s);
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
    io.post(
      {
        type: 'error',
        model: s.model,
        message: error instanceof Error ? error.message : String(error),
      },
      [],
    );
  };

  async function apply(s: Session, message: In) {
    const { type } = message;
    if (!s.run || type === 'reset') {
      await fresh(s);
      evaluate(s);
    }
    switch (message.type) {
      case 'start':
        if (!done(s)) {
          s.want = true;
          void loop();
        }
        return report(s);
      case 'pause':
        s.want = false;
        return report(s);
      case 'reset':
        s.want = false;
        return report(s, true);
      case 'snapshot':
        return report(s);
      case 'sample': {
        const temperature = message.temperature ?? 0.8;
        if (!Number.isFinite(temperature) || temperature <= 0)
          throw new Error('Temperature must be above zero');
        io.post(
          {
            type: 'sample',
            model: s.model,
            requestId: message.requestId,
            step: s.run!.steps,
            text: s.run!.model.write({ temperature }),
          },
          [],
        );
        return;
      }
      case 'weights': {
        const checkpoint = save(s.run!.model.params);
        io.post(
          {
            type: 'weights',
            model: s.model,
            requestId: message.requestId,
            step: s.run!.steps,
            symbols: s.run!.model.symbols,
            checkpoint,
          },
          [],
        );
        return;
      }
      case 'load': {
        if (message.symbols !== s.run!.model.symbols)
          throw new Error('Checkpoint symbols do not match the model');
        if (!Number.isSafeInteger(message.step) || message.step < 0 || message.step > s.kind.until)
          throw new Error('Invalid checkpoint step');
        s.want = false;
        const run = startRun(s.kind, await read(s.kind.textPath), { step: message.step });
        load(run.model.params, message.checkpoint);
        s.run = run;
        s.losses = [];
        s.stepTimes = [];
        s.recent = [];
        s.timing = { steps: 0, ms: 0 };
        evaluate(s);
        return report(s, true);
      }
      default:
        throw new Error(`Unknown message ${message satisfies never}`);
    }
  }

  return function receive(message) {
    const { model } = message;
    let s = sessions.get(model);
    if (!s) {
      const kind = kinds[model];
      s = {
        model,
        kind,
        run: null,
        want: false,
        losses: [],
        stepTimes: [],
        evaluation: null,
        recent: [],
        timing: { steps: 0, ms: 0 },
        lastProgress: 0,
        lastSnapshot: 0,
        queue: Promise.resolve(),
      };
      sessions.set(model, s);
    }
    const session = s;
    session.queue = session.queue
      .then(() => apply(session, message))
      .catch((error) => fail(session, error));
    return session.queue;
  };
}
