// Every learned model in the series keeps its numbers here: the letter models now, the gpt later.
// A model declares its tensors by name and shape. This module lays them out one after another in
// one flat array of numbers and one flat array of slopes, hands out named views into both, turns
// them with adamw, checks the slopes, and writes and reads them as a checkpoint.

/** Float32Array to train. Float64Array to check slopes, because float32 rejects correct ones. */
export type Floats = Float32Array | Float64Array;
export type FloatType<F extends Floats = Floats> = {
  new (length: number): F;
  readonly BYTES_PER_ELEMENT: number;
};

export type Shape = readonly number[];
/** How a tensor's numbers start: all one value, or random around 0 with this spread. */
export type Start = { readonly fill: number } | { readonly random: number };
/** One declared tensor. Build it with zeros, ones, or random. */
export type Knob = { readonly shape: Shape; readonly start: Start };
/** A model's tensors by name, in the order they sit in the flat arrays and in a checkpoint. */
export type Knobs = Readonly<Record<string, Knob>>;
/** Numbers that pick the model's shape, such as hidden: 32. A checkpoint records and checks them. */
export type Config = Readonly<Record<string, number>>;

export const zeros = (shape: Shape): Knob => ({ shape, start: { fill: 0 } });
export const ones = (shape: Shape): Knob => ({ shape, start: { fill: 1 } });
export const random = (shape: Shape, spread = 1): Knob => ({ shape, start: { random: spread } });

/** Where each tensor sits, derived from the declaration. */
export type Layout = {
  readonly model: string;
  readonly config: Config;
  /** Numbers in all, so a checkpoint's .bin is size * 4 bytes. */
  readonly size: number;
  readonly tensors: readonly { readonly name: string; readonly offset: number; readonly shape: Shape }[];
};

/** A named view. data and grad alias the flat arrays, so one loop over those moves every tensor. */
export type Tensor<F extends Floats = Floats> = {
  readonly shape: Shape;
  readonly data: F;
  readonly grad: F;
};

export type Params<K extends Knobs = Knobs, F extends Floats = Floats> = {
  readonly layout: Layout;
  readonly float: FloatType<F>;
  /** Every number of the model, tensor after tensor. */
  readonly data: F;
  /** Every slope, at the same index as its number. */
  readonly grad: F;
  readonly tensors: { readonly [N in keyof K]: Tensor<F> };
};

const normal = (roll: () => number) =>
  Math.sqrt(-2 * Math.log(1 - roll())) * Math.cos(2 * Math.PI * roll());

/**
 * Lays out `knobs`, makes both flat arrays in `float` (Float32Array unless given), and draws each
 * tensor's start in layout order from `roll`, so one seed gives one model.
 */
export function createParams<K extends Knobs, F extends Floats = Float32Array>(options: {
  model: string;
  config: Config;
  knobs: K;
  roll: () => number;
  float?: FloatType<F>;
}): Params<K, F> {
  const { model, config, knobs, roll } = options;
  const float = options.float ?? (Float32Array as unknown as FloatType<F>);
  const tensors: Layout['tensors'][number][] = [];
  let size = 0;
  for (const [name, { shape }] of Object.entries(knobs)) {
    // An object lists names made only of digits first, which would reorder the layout.
    if (/^\d+$/.test(name)) throw new Error(`The tensor name ${name} is only digits`);
    if (!shape.every((n) => Number.isInteger(n) && n > 0)) {
      throw new Error(`The tensor ${name} has the shape [${shape}]`);
    }
    tensors.push({ name, offset: size, shape });
    size += shape.reduce((a, b) => a * b, 1);
  }
  const data = new float(size);
  const grad = new float(size);
  const views: Record<string, Tensor<F>> = {};
  for (const { name, offset, shape } of tensors) {
    const end = offset + shape.reduce((a, b) => a * b, 1);
    const view = { shape, data: data.subarray(offset, end) as F, grad: grad.subarray(offset, end) as F };
    const { start } = knobs[name];
    if ('fill' in start) view.data.fill(start.fill);
    else for (let i = 0; i < view.data.length; i++) view.data[i] = start.random * normal(roll);
    views[name] = view;
  }
  return {
    layout: { model, config, size, tensors },
    float,
    data,
    grad,
    tensors: views as Params<K, F>['tensors'],
  };
}

export type Adam = {
  readonly rate: number;
  /** Pulls every number a little toward 0 on each step. 0 makes this plain adam. */
  readonly decay?: number;
  readonly beta1?: number;
  readonly beta2?: number;
};

// #region adamw
// Returns step(), which moves every number against its slope. Like part 1's adam, it remembers
// the recent slopes (m) and how big they have been (v), so its steps are smoother.
export function adamw(params: Params, settings: Adam) {
  const { rate, decay = 0, beta1 = 0.9, beta2 = 0.999 } = settings;
  const { data, grad } = params;
  const m = new params.float(data.length);
  const v = new params.float(data.length);
  let t = 0;
  return () => {
    t++;
    const c1 = 1 - beta1 ** t;
    const c2 = 1 - beta2 ** t;
    for (let i = 0; i < data.length; i++) {
      m[i] = beta1 * m[i] + (1 - beta1) * grad[i];
      v[i] = beta2 * v[i] + (1 - beta2) * grad[i] * grad[i];
      data[i] -= rate * (m[i] / c1 / (Math.sqrt(v[i] / c2) + 1e-8) + decay * data[i]);
    }
  };
}
// #endregion

export type SlopeCheck = {
  /** One line per element outside both bounds, as `hiddenWeights[12] analytic 0.0213 numeric 0.0198`. */
  readonly failures: readonly string[];
  readonly worstAbsolute: number;
  readonly worstRelative: number;
};

/**
 * Compares the slopes `loss` writes into params.grad with central differences, element by element.
 * An element passes with an absolute error under 1e-6 or a relative error under 1e-3. It takes
 * float64 numbers only, because float32 roundoff fails correct slopes.
 */
export function checkSlopes(
  params: Params<Knobs, Float64Array>,
  loss: () => number,
  nudge = 1e-5,
): SlopeCheck {
  loss();
  const analytic = Float64Array.from(params.grad);
  const failures: string[] = [];
  let worstAbsolute = 0;
  let worstRelative = 0;
  for (const { name, offset, shape } of params.layout.tensors) {
    const count = shape.reduce((a, b) => a * b, 1);
    for (let i = offset; i < offset + count; i++) {
      const kept = params.data[i];
      params.data[i] = kept + nudge;
      const up = loss();
      params.data[i] = kept - nudge;
      const down = loss();
      params.data[i] = kept;
      const numeric = (up - down) / (2 * nudge);
      const absolute = Math.abs(numeric - analytic[i]);
      const relative = absolute / Math.max(Math.abs(numeric), Math.abs(analytic[i]), 1e-300);
      worstAbsolute = Math.max(worstAbsolute, absolute);
      worstRelative = Math.max(worstRelative, absolute === 0 ? 0 : relative);
      if (absolute >= 1e-6 && relative >= 1e-3) {
        failures.push(`${name}[${i - offset}] analytic ${analytic[i]} numeric ${numeric}`);
      }
    }
  }
  loss();
  return { failures, worstAbsolute, worstRelative };
}

/** The two files of a checkpoint: the layout as JSON text, and every number as float32 bytes. */
export type Checkpoint = { readonly json: string; readonly bytes: ArrayBuffer };

export class CheckpointError extends Error {
  name = 'CheckpointError';
}

/**
 * The JSON for a layout, one field or one tensor per line, config keys sorted. Next to each line
 * it keeps the field that line holds, so a changed byte can be named.
 */
function describe(layout: Layout) {
  const lines: [string, string][] = [['{', 'the opening brace']];
  const field = (name: string, value: unknown) =>
    lines.push([`  ${JSON.stringify(name)}: ${JSON.stringify(value)},`, name]);
  field('checkpoint', 1);
  field('model', layout.model);
  const config = Object.keys(layout.config)
    .sort()
    .map((key) => `${JSON.stringify(key)}: ${layout.config[key]}`);
  lines.push([`  "config": {${config.join(', ')}},`, 'config']);
  field('float', 'float32, little-endian');
  field('size', layout.size);
  lines.push(['  "tensors": [', 'tensors']);
  layout.tensors.forEach(({ name, offset, shape }, i) => {
    const comma = i < layout.tensors.length - 1 ? ',' : '';
    const text = `    {"name": ${JSON.stringify(name)}, "offset": ${offset}, "shape": [${shape.join(', ')}]}`;
    lines.push([text + comma, `tensors[${i}] (${name})`]);
  });
  lines.push(['  ]', 'tensors'], ['}', 'the closing brace']);
  return { text: lines.map(([line]) => line).join('\n') + '\n', fields: lines.map(([, f]) => f) };
}

/** Names the field of the first line where the file leaves the expected JSON. */
function differs(actual: string, expected: ReturnType<typeof describe>) {
  const have = actual.split('\n');
  const want = expected.text.split('\n');
  const line = want.findIndex((text, i) => have[i] !== text);
  if (line >= expected.fields.length) return 'the file goes on after the closing brace';
  let field = expected.fields[line];
  if (line >= have.length) return `the file ends before ${field}`;
  let column = 0;
  while (have[line][column] === want[line][column]) column++;
  const key = [...want[line].matchAll(/"(\w+)":/g)].filter((match) => match.index <= column).pop();
  if (key && key[1] !== field) field += `.${key[1]}`;
  return `${field}, where the file has ${have[line].trim()} and the code expects ${want[line].trim()}`;
}

/** The checkpoint of these numbers. The JSON depends only on the layout. */
export function save(params: Params): Checkpoint {
  return { json: describe(params.layout).text, bytes: Float32Array.from(params.data).buffer };
}

/**
 * Copies a checkpoint's numbers into params.data. The JSON must be exactly what save writes for
 * params.layout, so a changed byte anywhere fails and names its field. Then the bytes must be
 * layout.size * 4 long, or the error gives both counts, and every number must be finite. Nothing
 * is copied unless all three hold.
 */
export function load(params: Params, file: Checkpoint) {
  const expected = describe(params.layout);
  if (file.json !== expected.text) {
    throw new CheckpointError(`The checkpoint's layout differs at ${differs(file.json, expected)}`);
  }
  const want = params.layout.size * 4;
  if (file.bytes.byteLength !== want) {
    throw new CheckpointError(
      `The checkpoint has ${file.bytes.byteLength} bytes, and the layout needs ${want}, ${params.layout.size} numbers of 4 bytes`,
    );
  }
  const numbers = new Float32Array(file.bytes);
  const broken = numbers.findIndex((n) => !Number.isFinite(n));
  if (broken !== -1) {
    const tensor = params.layout.tensors.findLast((t) => t.offset <= broken)!;
    throw new CheckpointError(
      `The checkpoint's number ${tensor.name}[${broken - tensor.offset}] is ${numbers[broken]}`,
    );
  }
  params.data.set(numbers);
}
