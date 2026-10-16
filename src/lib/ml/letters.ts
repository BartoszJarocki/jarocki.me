// Part 2's two learned models. The regions are included in the note, so they read top to bottom
// for someone who knows JavaScript and no machine learning.
import { seeded } from './bigram.ts';
import { type Floats, type Params, createParams, random, zeros } from './params.ts';
import { encode, symbols } from './tokenizers.ts';
import type { Kind } from './training.ts';

const size = symbols.length;

// #region softmax
// Turns scores into chances that add up to 1. Raising e, about 2.72, to each score makes every
// score positive and makes the big ones count a lot more. Taking the biggest score away from each
// one first gives the same chances and keeps Math.exp from overflowing.
export function softmax(scores: Floats, chances: Float64Array) {
  let biggest = -Infinity;
  for (let i = 0; i < scores.length; i++) biggest = Math.max(biggest, scores[i]);
  let total = 0;
  for (let i = 0; i < scores.length; i++) {
    chances[i] = Math.exp(scores[i] - biggest);
    total += chances[i];
  }
  for (let i = 0; i < scores.length; i++) chances[i] /= total;
}
// #endregion

// #region crossEntropy
// How surprised the model was by the letter that really came next. A 50% chance is a small
// surprise, about 0.69. A 1% chance is a big one, about 4.6.
export function crossEntropy(chances: Float64Array, next: number) {
  return -Math.log(chances[next]);
}

// The slope of the surprise for each score is that letter's chance, less 1 for the letter that
// really came next. So stepping against the slopes raises the right score and lowers the rest.
export function surpriseSlopes(chances: Float64Array, next: number, slopes: Float64Array) {
  for (let i = 0; i < chances.length; i++) slopes[i] = chances[i] - (i === next ? 1 : 0);
}
// #endregion

/** Letters that follow `context` letters in the names, with dots before each name starts. */
export type Examples = {
  readonly context: number;
  readonly count: number;
  /** count rows of context letter ids, oldest first. */
  readonly before: Uint8Array;
  /** count letter ids. */
  readonly next: Uint8Array;
};

const emptyExamples = (context: number, count: number): Examples => ({
  context,
  count,
  before: new Uint8Array(context * count),
  next: new Uint8Array(count),
});

export function examples(names: readonly string[], context: number): Examples {
  const before: number[] = [];
  const next: number[] = [];
  for (const name of names) {
    if (name === '') continue;
    const ids = encode(name);
    const window = new Array<number>(context).fill(0);
    for (let i = 1; i < ids.length; i++) {
      before.push(...window);
      next.push(ids[i]);
      window.shift();
      window.push(ids[i]);
    }
  }
  return { context, count: next.length, before: Uint8Array.from(before), next: Uint8Array.from(next) };
}

// #region oneLetter
// A table of 27 rows of 27 scores. Row a holds a score for every letter that could follow a.
export const oneLetterKnobs = { scores: zeros([size, size]) };
export type OneLetter = Params<typeof oneLetterKnobs>;

// The average surprise over a batch of letter pairs. It also writes the slope of every score into
// p.grad. Only the rows of the letters that came before get one.
export function oneLetterLoss(p: OneLetter, batch: Examples) {
  const { scores } = p.tensors;
  const chances = new Float64Array(size);
  const slopes = new Float64Array(size);
  p.grad.fill(0);
  let total = 0;
  for (let e = 0; e < batch.count; e++) {
    const row = batch.before[e] * size;
    softmax(scores.data.subarray(row, row + size), chances);
    total += crossEntropy(chances, batch.next[e]);
    surpriseSlopes(chances, batch.next[e], slopes);
    for (let j = 0; j < size; j++) scores.grad[row + j] += slopes[j] / batch.count;
  }
  return total / batch.count;
}
// #endregion

// #region threeLetter
// Each letter gets three numbers, its place on the map, and training moves them. The places of
// the three letters before the next one make nine numbers. A layer of hidden neurons reads those
// nine and squashes its sums with tanh, and 27 more neurons turn them into a score for each letter.
export const threeLetterKnobs = (hidden: number) => ({
  places: random([size, 3], 0.1),
  hiddenWeights: random([9, hidden], 1 / 3),
  hiddenBias: zeros([hidden]),
  scoreWeights: random([hidden, size], 0.1 / Math.sqrt(hidden)),
  scoreBias: zeros([size]),
});
export type ThreeLetter = Params<ReturnType<typeof threeLetterKnobs>>;

// The 27 scores after three letters. It keeps the nine inputs and the hidden numbers, because
// the walk back needs them.
export function threeLetterScores(
  p: ThreeLetter,
  before: Uint8Array,
  input: Float64Array,
  hidden: Float64Array,
  scores: Float64Array,
) {
  const { places, hiddenWeights, hiddenBias, scoreWeights, scoreBias } = p.tensors;
  const width = hidden.length;
  for (let i = 0; i < 9; i++) input[i] = places.data[before[Math.floor(i / 3)] * 3 + (i % 3)];
  for (let h = 0; h < width; h++) {
    let sum = hiddenBias.data[h];
    for (let i = 0; i < 9; i++) sum += input[i] * hiddenWeights.data[i * width + h];
    hidden[h] = Math.tanh(sum);
  }
  for (let j = 0; j < size; j++) {
    let sum = scoreBias.data[j];
    for (let h = 0; h < width; h++) sum += hidden[h] * scoreWeights.data[h * size + j];
    scores[j] = sum;
  }
}

// The average surprise over a batch. It also writes the slope of every number into p.grad,
// walking back from the scores, through the hidden layer, to the three places.
export function threeLetterLoss(p: ThreeLetter, batch: Examples) {
  const { places, hiddenWeights, hiddenBias, scoreWeights, scoreBias } = p.tensors;
  const width = hiddenBias.data.length;
  const input = new Float64Array(9);
  const hidden = new Float64Array(width);
  const scores = new Float64Array(size);
  const chances = new Float64Array(size);
  const slopes = new Float64Array(size);
  const hiddenSlopes = new Float64Array(width);
  const share = 1 / batch.count;
  p.grad.fill(0);
  let total = 0;
  for (let e = 0; e < batch.count; e++) {
    const before = batch.before.subarray(e * 3, e * 3 + 3);
    threeLetterScores(p, before, input, hidden, scores);
    softmax(scores, chances);
    total += crossEntropy(chances, batch.next[e]);
    surpriseSlopes(chances, batch.next[e], slopes);
    for (let j = 0; j < size; j++) scoreBias.grad[j] += slopes[j] * share;
    for (let h = 0; h < width; h++) {
      let sum = 0;
      for (let j = 0; j < size; j++) {
        scoreWeights.grad[h * size + j] += hidden[h] * slopes[j] * share;
        sum += scoreWeights.data[h * size + j] * slopes[j];
      }
      // tanh's slope is 1 minus its output squared.
      hiddenSlopes[h] = sum * (1 - hidden[h] * hidden[h]);
      hiddenBias.grad[h] += hiddenSlopes[h] * share;
    }
    for (let i = 0; i < 9; i++) {
      let sum = 0;
      for (let h = 0; h < width; h++) {
        hiddenWeights.grad[i * width + h] += input[i] * hiddenSlopes[h] * share;
        sum += hiddenWeights.data[i * width + h] * hiddenSlopes[h];
      }
      places.grad[before[Math.floor(i / 3)] * 3 + (i % 3)] += sum * share;
    }
  }
  return total * share;
}
// #endregion

/** Fills `batch` with examples picked at random from `all`. */
function pick(all: Examples, batch: Examples, roll: () => number) {
  const { context } = all;
  for (let e = 0; e < batch.count; e++) {
    const k = Math.floor(roll() * all.count);
    batch.before.set(all.before.subarray(k * context, (k + 1) * context), e * context);
    batch.next[e] = all.next[k];
  }
}

/** Writes ten names, each rolled letter by letter from the scores `score` writes for the letters so far. */
function writeNames(
  context: number,
  score: (before: Uint8Array, scores: Float64Array) => void,
  roll: () => number,
) {
  const scores = new Float64Array(size);
  const chances = new Float64Array(size);
  const names: string[] = [];
  for (let tries = 0; names.length < 10 && tries < 100; tries++) {
    const before = new Uint8Array(context);
    let name = '';
    while (name.length < 30) {
      score(before, scores);
      softmax(scores, chances);
      let left = roll();
      let next = 0;
      while (next < size - 1 && left >= chances[next]) left -= chances[next++];
      if (next === 0) break;
      name += symbols[next];
      before.copyWithin(0, 1);
      before[context - 1] = next;
    }
    if (name) names.push(name);
  }
  return names.join(' ');
}

const names = (text: string) => text.split('\n').filter((name) => name !== '');

const oneLetterBatch = 4096;
/** Twice the slowest step, over seeds 1 to 5, at which the 100-step average came within 0.02 of 2.45. */
export const oneLetterSteps = 1762;

export const oneLetter: Kind = {
  data: '/data/names.txt',
  adam: { rate: 0.005 },
  until: oneLetterSteps,
  create(text, { seed = 1, float = Float32Array } = {}) {
    const all = examples(names(text), 1);
    const params = createParams({
      model: 'oneLetter',
      config: {},
      knobs: oneLetterKnobs,
      roll: seeded(seed),
      float,
    });
    const batch = emptyExamples(1, oneLetterBatch);
    const batchRoll = seeded(seed + 1000);
    const writeRoll = seeded(seed + 2000);
    const { scores } = params.tensors;
    return {
      params,
      symbols,
      letters: scores,
      practice() {
        pick(all, batch, batchRoll);
        return oneLetterLoss(params, batch);
      },
      write: () =>
        writeNames(1, (before, out) => out.set(scores.data.subarray(before[0] * size, (before[0] + 1) * size)), writeRoll),
    };
  },
};

const hiddenWidth = 32;
const threeLetterBatch = 128;

export const threeLetter: Kind = {
  data: '/data/names.txt',
  adam: { rate: 0.01 },
  until: Infinity,
  create(text, { seed = 1, float = Float32Array } = {}) {
    const all = examples(names(text), 3);
    const params = createParams({
      model: 'threeLetter',
      config: { hidden: hiddenWidth },
      knobs: threeLetterKnobs(hiddenWidth),
      roll: seeded(seed),
      float,
    });
    const batch = emptyExamples(3, threeLetterBatch);
    const batchRoll = seeded(seed + 1000);
    const writeRoll = seeded(seed + 2000);
    const input = new Float64Array(9);
    const hidden = new Float64Array(hiddenWidth);
    return {
      params,
      symbols,
      letters: params.tensors.places,
      practice() {
        pick(all, batch, batchRoll);
        return threeLetterLoss(params, batch);
      },
      write: () =>
        writeNames(3, (before, out) => threeLetterScores(params, before, input, hidden, out), writeRoll),
    };
  },
};
