import { seeded } from './bigram.ts';
import { type Batch, decode, drawBatch, readCorpus, wordShare } from './corpus.ts';
import {
  type Checkpoint,
  type FloatType,
  type Floats,
  type Knob,
  type Knobs,
  type Params,
  type Tensor,
  createParams,
  ones,
  random,
  zeros,
} from './params.ts';
import type { Kind, Model } from './training.ts';

export type TransformerConfig = {
  readonly symbols: string;
  readonly context: number;
  readonly width: number;
  readonly blocks: number;
  readonly heads: number;
};

export const shakespeare = {
  symbols: "\n !$&',-.3:;?abcdefghijklmnopqrstuvwxyz",
  context: 64,
  width: 32,
  blocks: 2,
  heads: 4,
} as const satisfies TransformerConfig;

export const shakespeareFiles = {
  text: '/data/shakespeare.txt',
  json: '/models/shakespeare.json',
  bytes: '/models/shakespeare.bin',
} as const;

const newLevel = (width: number) => ({ gain: ones([width]), bias: zeros([width]) });
const newLayer = (inputs: number, outputs: number) => ({
  weights: random([inputs, outputs], 0.02),
  bias: zeros([outputs]),
});

/** Every knob, in the order they sit in the flat arrays. A knob's name is its path, as blocks.0.attention.lookup.weights. */
const knobTree = ({ symbols, context, width, blocks }: TransformerConfig) => ({
  letters: random([symbols.length, width], 0.02),
  positions: random([context, width], 0.02),
  blocks: Array.from({ length: blocks }, () => ({
    attention: {
      level: newLevel(width),
      lookup: newLayer(width, 3 * width),
      write: newLayer(width, width),
    },
    network: {
      level: newLevel(width),
      hidden: newLayer(width, 4 * width),
      write: newLayer(4 * width, width),
    },
  })),
  level: newLevel(width),
  scores: newLayer(width, symbols.length),
});

type Grown<T, L> = T extends Knob ? L : { readonly [K in keyof T]: Grown<T[K], L> };
type KnobTree = ReturnType<typeof knobTree>;

function grow<L>(tree: unknown, leaf: (knob: Knob, name: string) => L, path = ''): unknown {
  const join = (key: string) => (path ? `${path}.${key}` : key);
  if (typeof tree === 'object' && tree !== null && 'start' in tree) return leaf(tree as Knob, path);
  if (Array.isArray(tree)) return tree.map((child, i) => grow(child, leaf, join(String(i))));
  return Object.fromEntries(
    Object.entries(tree as object).map(([key, child]) => [key, grow(child, leaf, join(key))]),
  );
}

export type Layer = { readonly weights: Tensor; readonly bias: Tensor };
export type Level = { readonly gain: Tensor; readonly bias: Tensor };
export type BlockKnobs = Grown<KnobTree, Tensor>['blocks'][number];

/** The knobs as a tree for the math, and as ai-08's flat Params for adamw, save, and load. Both hold the same numbers. */
export type Transformer<F extends Floats = Floats> = Grown<KnobTree, Tensor<F>> & {
  readonly config: TransformerConfig;
  readonly params: Params<Knobs, F>;
};

export function createTransformer<F extends Floats = Float32Array>(
  config: TransformerConfig,
  { seed = 1, float }: { seed?: number; float?: FloatType<F> } = {},
): Transformer<F> {
  const { symbols, context, width, blocks, heads } = config;
  if (width % heads !== 0)
    throw new Error(`A width of ${width} does not split into ${heads} heads`);
  const tree = knobTree(config);
  const knobs: Record<string, Knob> = {};
  grow(tree, (knob, name) => (knobs[name] = knob));
  const params = createParams({
    model: 'gpt',
    config: { vocabulary: symbols.length, context, width, blocks, heads },
    knobs: () => knobs,
    roll: seeded(seed),
    float,
  });
  const tensors = grow(tree, (_, name) => params.tensors[name]) as Grown<KnobTree, Tensor<F>>;
  return { ...tensors, config, params };
}

const like = (x: Floats, length: number) =>
  x instanceof Float64Array ? new Float64Array(length) : new Float32Array(length);

/** x holds rows of `inputs` numbers. Each row comes out as `outputs` numbers. */
function multiply(x: Floats, { weights, bias }: Layer) {
  const [inputs, outputs] = weights.shape;
  const rows = x.length / inputs;
  const out = like(x, rows * outputs);
  const w = weights.data;
  const b = bias.data;
  let i = 0;
  for (; i + 4 <= rows; i += 4) {
    const o0 = i * outputs;
    const o1 = o0 + outputs;
    const o2 = o1 + outputs;
    const o3 = o2 + outputs;
    for (let j = 0; j < outputs; j++) out[o0 + j] = out[o1 + j] = out[o2 + j] = out[o3 + j] = b[j];
    for (let k = 0; k < inputs; k++) {
      const a0 = x[i * inputs + k];
      const a1 = x[(i + 1) * inputs + k];
      const a2 = x[(i + 2) * inputs + k];
      const a3 = x[(i + 3) * inputs + k];
      const r = k * outputs;
      for (let j = 0; j < outputs; j++) {
        const wj = w[r + j];
        out[o0 + j] += a0 * wj;
        out[o1 + j] += a1 * wj;
        out[o2 + j] += a2 * wj;
        out[o3 + j] += a3 * wj;
      }
    }
  }
  for (; i < rows; i++) {
    const o = i * outputs;
    for (let j = 0; j < outputs; j++) out[o + j] = b[j];
    for (let k = 0; k < inputs; k++) {
      const a = x[i * inputs + k];
      const r = k * outputs;
      for (let j = 0; j < outputs; j++) out[o + j] += a * w[r + j];
    }
  }
  return out;
}

function multiplyBack(outSlopes: Floats, x: Floats, { weights, bias }: Layer) {
  const [inputs, outputs] = weights.shape;
  const rows = x.length / inputs;
  const slopes = like(x, x.length);
  const w = weights.data;
  const dw = weights.grad;
  const db = bias.grad;
  const d = outSlopes;
  let i = 0;
  for (; i + 4 <= rows; i += 4) {
    const o0 = i * outputs;
    const o1 = o0 + outputs;
    const o2 = o1 + outputs;
    const o3 = o2 + outputs;
    for (let k = 0; k < inputs; k++) {
      const a0 = x[i * inputs + k];
      const a1 = x[(i + 1) * inputs + k];
      const a2 = x[(i + 2) * inputs + k];
      const a3 = x[(i + 3) * inputs + k];
      const r = k * outputs;
      let s0 = 0;
      let s1 = 0;
      let s2 = 0;
      let s3 = 0;
      for (let j = 0; j < outputs; j++) {
        const wj = w[r + j];
        const d0 = d[o0 + j];
        const d1 = d[o1 + j];
        const d2 = d[o2 + j];
        const d3 = d[o3 + j];
        s0 += d0 * wj;
        s1 += d1 * wj;
        s2 += d2 * wj;
        s3 += d3 * wj;
        dw[r + j] += a0 * d0 + a1 * d1 + a2 * d2 + a3 * d3;
      }
      slopes[i * inputs + k] += s0;
      slopes[(i + 1) * inputs + k] += s1;
      slopes[(i + 2) * inputs + k] += s2;
      slopes[(i + 3) * inputs + k] += s3;
    }
    for (let j = 0; j < outputs; j++) db[j] += d[o0 + j] + d[o1 + j] + d[o2 + j] + d[o3 + j];
  }
  for (; i < rows; i++) {
    const o = i * outputs;
    for (let k = 0; k < inputs; k++) {
      const a = x[i * inputs + k];
      const r = k * outputs;
      let s = 0;
      for (let j = 0; j < outputs; j++) {
        s += d[o + j] * w[r + j];
        dw[r + j] += a * d[o + j];
      }
      slopes[i * inputs + k] += s;
    }
    for (let j = 0; j < outputs; j++) db[j] += d[o + j];
  }
  return slopes;
}

/** A copy of x with each row turned to a steady size. mean and scale are kept for the way back. */
type Leveled = {
  readonly x: Floats;
  readonly out: Floats;
  readonly mean: Floats;
  readonly scale: Floats;
};

function level(x: Floats, { gain, bias }: Level): Leveled {
  const width = gain.data.length;
  const rows = x.length / width;
  const out = like(x, x.length);
  const mean = like(x, rows);
  const scale = like(x, rows);
  const g = gain.data;
  const b = bias.data;
  for (let i = 0; i < rows; i++) {
    const r = i * width;
    let m = 0;
    for (let c = 0; c < width; c++) m += x[r + c];
    m /= width;
    let v = 0;
    for (let c = 0; c < width; c++) v += (x[r + c] - m) ** 2;
    const s = 1 / Math.sqrt(v / width + 1e-5);
    for (let c = 0; c < width; c++) out[r + c] = (x[r + c] - m) * s * g[c] + b[c];
    mean[i] = m;
    scale[i] = s;
  }
  return { x, out, mean, scale };
}

/** Adds the slopes of leveled.x into slopes. */
function levelBack(slopes: Floats, outSlopes: Floats, leveled: Leveled, { gain, bias }: Level) {
  const { x, mean, scale } = leveled;
  const width = gain.data.length;
  const g = gain.data;
  const d = outSlopes;
  for (let i = 0; i < mean.length; i++) {
    const r = i * width;
    const m = mean[i];
    const s = scale[i];
    let dMean = 0;
    let dDotN = 0;
    for (let c = 0; c < width; c++) {
      const dn = g[c] * d[r + c];
      dMean += dn;
      dDotN += dn * (x[r + c] - m) * s;
    }
    dMean /= width;
    dDotN /= width;
    for (let c = 0; c < width; c++) {
      const n = (x[r + c] - m) * s;
      bias.grad[c] += d[r + c];
      gain.grad[c] += n * d[r + c];
      slopes[r + c] += (g[c] * d[r + c] - dMean - n * dDotN) * s;
    }
  }
}

const geluK = Math.sqrt(2 / Math.PI);

function gelu(x: Floats) {
  const out = like(x, x.length);
  for (let i = 0; i < x.length; i++) {
    const u = x[i];
    out[i] = 0.5 * u * (1 + Math.tanh(geluK * (u + 0.044715 * u * u * u)));
  }
  return out;
}

function geluBack(outSlopes: Floats, x: Floats) {
  const slopes = like(x, x.length);
  for (let i = 0; i < x.length; i++) {
    const u = x[i];
    const th = Math.tanh(geluK * (u + 0.044715 * u * u * u));
    const local = 0.5 * (1 + th) + 0.5 * u * (1 - th * th) * geluK * (1 + 3 * 0.044715 * u * u);
    slopes[i] += local * outSlopes[i];
  }
  return slopes;
}

function add(a: Floats, b: Floats) {
  const out = like(a, a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] + b[i];
  return out;
}

/** How long each row of a pass is, and how its numbers split into heads. */
export type Sizes = { readonly length: number; readonly width: number; readonly heads: number };

/** One block's numbers from a forward pass. notebooks, middle, and out are a token's column before, between, and after the two notes. */
export type BlockTape = {
  readonly notebooks: Floats;
  readonly first: Leveled;
  /** Each token's query, key, and value, side by side. */
  readonly lookups: Floats;
  /** [rows, heads, length, length]. Row t of a head is how much token t reads tokens 0 to t. The rest is 0. */
  readonly weights: Floats;
  readonly found: Floats;
  readonly middle: Floats;
  readonly second: Leveled;
  readonly hidden: Floats;
  readonly fired: Floats;
  readonly out: Floats;
};

/** Everything a forward pass computed. Nothing writes to it afterwards, so it is safe to keep. */
export type Tape = {
  readonly tokens: Int32Array;
  readonly sizes: Sizes;
  readonly blocks: readonly BlockTape[];
  readonly leveled: Leveled;
  /** [tokens, symbols]. Each token's score for every next symbol. */
  readonly scores: Floats;
};

// #region attention
function attend(lookups: Floats, { length, width, heads }: Sizes) {
  const size = width / heads;
  const scale = 1 / Math.sqrt(size);
  const rows = lookups.length / (3 * width * length);
  const found = like(lookups, rows * length * width);
  const weights = like(lookups, rows * heads * length * length);
  for (let r = 0; r < rows; r++) {
    for (let t = 0; t < length; t++) {
      for (let h = 0; h < heads; h++) {
        const query = (r * length + t) * 3 * width + h * size;
        const row = ((r * heads + h) * length + t) * length;
        let biggest = -Infinity;
        for (let s = 0; s <= t; s++) {
          const key = (r * length + s) * 3 * width + width + h * size;
          let dot = 0;
          for (let i = 0; i < size; i++) dot += lookups[query + i] * lookups[key + i];
          weights[row + s] = dot * scale;
          if (weights[row + s] > biggest) biggest = weights[row + s];
        }
        let total = 0;
        for (let s = 0; s <= t; s++) {
          weights[row + s] = Math.exp(weights[row + s] - biggest);
          total += weights[row + s];
        }
        const out = (r * length + t) * width + h * size;
        for (let s = 0; s <= t; s++) {
          weights[row + s] /= total;
          const value = (r * length + s) * 3 * width + 2 * width + h * size;
          for (let i = 0; i < size; i++) found[out + i] += weights[row + s] * lookups[value + i];
        }
      }
    }
  }
  return { found, weights };
}
// #endregion

function attendBack(foundSlopes: Floats, lookups: Floats, weights: Floats, sizes: Sizes) {
  const { length, width, heads } = sizes;
  const size = width / heads;
  const scale = 1 / Math.sqrt(size);
  const rows = lookups.length / (3 * width * length);
  const slopes = like(lookups, lookups.length);
  const weightSlopes = like(lookups, length);
  for (let r = 0; r < rows; r++) {
    for (let t = 0; t < length; t++) {
      for (let h = 0; h < heads; h++) {
        const query = (r * length + t) * 3 * width + h * size;
        const row = ((r * heads + h) * length + t) * length;
        const out = (r * length + t) * width + h * size;
        let weightedSlopes = 0;
        for (let s = 0; s <= t; s++) {
          const value = (r * length + s) * 3 * width + 2 * width + h * size;
          let d = 0;
          for (let i = 0; i < size; i++) {
            d += foundSlopes[out + i] * lookups[value + i];
            slopes[value + i] += weights[row + s] * foundSlopes[out + i];
          }
          weightSlopes[s] = d;
          weightedSlopes += weights[row + s] * d;
        }
        for (let s = 0; s <= t; s++) {
          const key = (r * length + s) * 3 * width + width + h * size;
          const scoreSlope = weights[row + s] * (weightSlopes[s] - weightedSlopes) * scale;
          for (let i = 0; i < size; i++) {
            slopes[query + i] += scoreSlope * lookups[key + i];
            slopes[key + i] += scoreSlope * lookups[query + i];
          }
        }
      }
    }
  }
  return slopes;
}

// #region block
function block(knobs: BlockKnobs, notebooks: Floats, sizes: Sizes): BlockTape {
  const { attention, network } = knobs;
  const first = level(notebooks, attention.level);
  const lookups = multiply(first.out, attention.lookup);
  const { found, weights } = attend(lookups, sizes);
  const middle = add(notebooks, multiply(found, attention.write));
  const second = level(middle, network.level);
  const hidden = multiply(second.out, network.hidden);
  const fired = gelu(hidden);
  const out = add(middle, multiply(fired, network.write));
  return { notebooks, first, lookups, weights, found, middle, second, hidden, fired, out };
}
// #endregion

// #region forward
/** Runs rows of `length` tokens through the network, each row on its own. */
export function forward(net: Transformer, tokens: Int32Array, length = tokens.length): Tape {
  const { context, width, heads } = net.config;
  if (length > context || tokens.length % length !== 0) {
    throw new Error(`${tokens.length} tokens do not make rows of ${length}, at most ${context}`);
  }
  const sizes = { length, width, heads };
  let notebooks: Floats = like(net.letters.data, tokens.length * width);
  for (let i = 0; i < tokens.length; i++) {
    const letter = tokens[i] * width;
    const seat = (i % length) * width;
    for (let c = 0; c < width; c++) {
      notebooks[i * width + c] = net.letters.data[letter + c] + net.positions.data[seat + c];
    }
  }
  const blocks: BlockTape[] = [];
  for (const knobs of net.blocks) {
    const tape = block(knobs, notebooks, sizes);
    blocks.push(tape);
    notebooks = tape.out;
  }
  const leveled = level(notebooks, net.level);
  return { tokens, sizes, blocks, leveled, scores: multiply(leveled.out, net.scores) };
}

/** Softmax turns each token's scores into chances. The loss is the average surprise at the targets. */
function surprise(scores: Floats, targets: Int32Array) {
  const symbols = scores.length / targets.length;
  const chances = like(scores, scores.length);
  let total = 0;
  for (let i = 0; i < targets.length; i++) {
    const row = i * symbols;
    let biggest = -Infinity;
    for (let j = 0; j < symbols; j++) if (scores[row + j] > biggest) biggest = scores[row + j];
    let sum = 0;
    for (let j = 0; j < symbols; j++) sum += chances[row + j] = Math.exp(scores[row + j] - biggest);
    for (let j = 0; j < symbols; j++) chances[row + j] /= sum;
    total -= Math.log(chances[row + targets[i]]);
  }
  return { chances, loss: total / targets.length };
}
// #endregion

// #region backward
/** Adds the slope of the loss to every knob's grad, walking the tape from the scores back to the tokens. */
function backward(net: Transformer, tape: Tape, targets: Int32Array, chances: Floats) {
  const { tokens, sizes } = tape;
  const { length, width } = sizes;
  const symbols = chances.length / targets.length;
  const scoreSlopes = like(chances, chances.length);
  for (let i = 0; i < targets.length; i++) {
    for (let j = 0; j < symbols; j++) {
      const k = i * symbols + j;
      scoreSlopes[k] = (chances[k] - (j === targets[i] ? 1 : 0)) / targets.length;
    }
  }
  const slopes = like(chances, tokens.length * width);
  const leveledSlopes = multiplyBack(scoreSlopes, tape.leveled.out, net.scores);
  levelBack(slopes, leveledSlopes, tape.leveled, net.level);
  for (let b = net.blocks.length - 1; b >= 0; b--) {
    const { attention, network } = net.blocks[b];
    const t = tape.blocks[b];
    const firedSlopes = multiplyBack(slopes, t.fired, network.write);
    const hiddenSlopes = geluBack(firedSlopes, t.hidden);
    const secondSlopes = multiplyBack(hiddenSlopes, t.second.out, network.hidden);
    levelBack(slopes, secondSlopes, t.second, network.level);
    const foundSlopes = multiplyBack(slopes, t.found, attention.write);
    const lookupSlopes = attendBack(foundSlopes, t.lookups, t.weights, sizes);
    const firstSlopes = multiplyBack(lookupSlopes, t.first.out, attention.lookup);
    levelBack(slopes, firstSlopes, t.first, attention.level);
  }
  for (let i = 0; i < tokens.length; i++) {
    for (let c = 0; c < width; c++) {
      net.letters.grad[tokens[i] * width + c] += slopes[i * width + c];
      net.positions.grad[(i % length) * width + c] += slopes[i * width + c];
    }
  }
}

/** One batch forward and back. Returns the batch's loss and leaves every knob's slope in net.params.grad. */
export function practice(net: Transformer, { tokens, targets, length }: Batch) {
  const tape = forward(net, tokens, length);
  const { chances, loss } = surprise(tape.scores, targets);
  net.params.grad.fill(0);
  backward(net, tape, targets, chances);
  return loss;
}
// #endregion

/** Writes `length` symbols after a newline. Each call starts its roll again, so the same knobs write the same text. */
export function write(
  net: Transformer,
  {
    length = 200,
    temperature = 0.8,
    seed = 7,
  }: { length?: number; temperature?: number; seed?: number } = {},
) {
  const { symbols, context } = net.config;
  const roll = seeded(seed);
  const ids = [symbols.indexOf('\n')];
  while (ids.length <= length) {
    const window = Int32Array.from(ids.slice(-context));
    const { scores } = forward(net, window);
    const last = scores.subarray((window.length - 1) * symbols.length);
    let biggest = -Infinity;
    for (const score of last) biggest = Math.max(biggest, score / temperature);
    const sides = Array.from(last, (score) => Math.exp(score / temperature - biggest));
    let left = roll() * sides.reduce((a, b) => a + b, 0);
    let next = 0;
    while (next < sides.length - 1 && (left -= sides[next]) > 0) next++;
    ids.push(next);
  }
  return decode(symbols, ids.slice(1));
}

/** Reads the shipped checkpoint with fetch in a page or a worker, or with a file read in Node. */
export async function readCheckpoint(
  read: (path: string) => Promise<Response>,
): Promise<Checkpoint> {
  const [json, bytes] = await Promise.all(
    [shakespeareFiles.json, shakespeareFiles.bytes].map(async (path) => {
      const response = await read(path);
      if (!response.ok) throw new Error(`${path} answered ${response.status}`);
      return response;
    }),
  );
  return { json: await json.text(), bytes: new Uint8Array(await bytes.arrayBuffer()) };
}

/** The fixture's losses: the mean over 8 batches of 16 rows of 64, drawn once from the training text with seed 98 and the validation text with seed 99. */
export type Exam = { readonly training: number; readonly validation: number };

export type GptModel = Model & {
  readonly net: Transformer;
  exam(): Exam;
  wordShare(text: string): number;
};

const rows = 16;

export const gpt = {
  textPath: shakespeareFiles.text,
  adam: { rate: 3e-3, beta2: 0.99, decay: 0.01 },
  until: 12_000,
  create(text: string, { seed = 1, float }: { seed?: number; float?: FloatType } = {}): GptModel {
    const corpus = readCorpus(text);
    if (corpus.symbols !== shakespeare.symbols) {
      throw new Error(
        `The text has the symbols ${JSON.stringify(corpus.symbols)}, and the model reads ${JSON.stringify(shakespeare.symbols)}`,
      );
    }
    const net = createTransformer(shakespeare, { seed, float });
    const batchRoll = seeded(seed + 1000);
    const examBatches = (tokens: Int32Array, examSeed: number) => {
      const roll = seeded(examSeed);
      return Array.from({ length: 8 }, () => drawBatch(tokens, rows, shakespeare.context, roll));
    };
    const training = examBatches(corpus.training, 98);
    const validation = examBatches(corpus.validation, 99);
    const mean = (batches: Batch[]) => {
      let total = 0;
      for (const { tokens, targets, length } of batches) {
        total += surprise(forward(net, tokens, length).scores, targets).loss;
      }
      return total / batches.length;
    };
    return {
      params: net.params,
      symbols: shakespeare.symbols,
      letters: net.letters,
      net,
      practice: () =>
        practice(net, drawBatch(corpus.training, rows, shakespeare.context, batchRoll)),
      write: () => write(net),
      exam: () => ({ training: mean(training), validation: mean(validation) }),
      wordShare: (sample) => wordShare(corpus, sample),
    };
  },
} satisfies Kind;
