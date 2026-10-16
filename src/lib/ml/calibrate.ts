// Calibrates part 2's learned models: node src/lib/ml/calibrate.ts [seconds]
// Trains each model with seeds 1 to 5, one run at a time, and prints one JSON line per run.
import fs from 'node:fs';

import { type Snapshot, averageOver, startRun } from './training.ts';
import { oneLetter, threeLetter } from './letters.ts';
import { symbols } from './tokenizers.ts';

const seconds = Number(process.argv[2] ?? 60);
const text = fs.readFileSync('public/data/names.txt', 'utf8');

/**
 * The vowel statistic: the average distance over the ten pairs of a, e, i, o, and u is below the
 * median distance over all 351 pairs of the 27 symbols.
 */
export function vowelStatistic({ vectors, width }: Pick<Snapshot, 'vectors' | 'width'>) {
  const distance = (a: number, b: number) => {
    let sum = 0;
    for (let k = 0; k < width; k++) sum += (vectors[a * width + k] - vectors[b * width + k]) ** 2;
    return Math.sqrt(sum);
  };
  const all: number[] = [];
  for (let a = 0; a < symbols.length; a++) {
    for (let b = a + 1; b < symbols.length; b++) all.push(distance(a, b));
  }
  all.sort((x, y) => x - y);
  const median = all[(all.length - 1) / 2];
  const vowels = Array.from('aeiou', (v) => symbols.indexOf(v));
  let total = 0;
  for (let i = 0; i < vowels.length; i++) {
    for (let j = i + 1; j < vowels.length; j++) total += distance(vowels[i], vowels[j]);
  }
  const average = total / 10;
  return { holds: average < median, average, median };
}

const round = (n: number, digits = 3) => Number(n.toFixed(digits));

function calibrateThreeLetter(seed: number) {
  const run = startRun(threeLetter, text, { seed });
  const recent: number[] = [];
  const record: Record<string, unknown> = { model: 'threeLetter', seed };
  let ms = 0;
  let marks = [30, 60].filter((s) => s <= seconds);
  while (ms < seconds * 1000) {
    const before = performance.now();
    const loss = run.step();
    ms += performance.now() - before;
    recent.push(loss);
    if (recent.length > averageOver) recent.shift();
    const average = recent.reduce((a, b) => a + b) / recent.length;
    if (run.steps === 200) record.averageAt200 = round(average, 4);
    if (run.steps % 10 === 0) {
      const { data, shape } = run.model.letters;
      const holds = vowelStatistic({ vectors: Float32Array.from(data), width: shape[1] }).holds;
      if (holds && !record.vowels) record.vowels = { step: run.steps, seconds: round(ms / 1000, 2) };
      if (!holds) record.vowelsMissedAt = { step: run.steps, seconds: round(ms / 1000, 2) };
    }
    if (!record.below2_3 && recent.length === averageOver && average < 2.3) {
      record.below2_3 = { step: run.steps, seconds: round(ms / 1000, 2) };
    }
    if (marks.length && ms >= marks[0] * 1000) {
      const { data, shape } = run.model.letters;
      const vowels = vowelStatistic({ vectors: Float32Array.from(data), width: shape[1] });
      record[`at${marks[0]}s`] = {
        step: run.steps,
        average: round(average),
        vowels: vowels.holds,
        vowelAverage: round(vowels.average),
        median: round(vowels.median),
      };
      marks = marks.slice(1);
    }
  }
  record.stepsPerSecond = Math.round(run.steps / (ms / 1000));
  return record;
}

function calibrateOneLetter(seed: number) {
  const run = startRun(oneLetter, text, { seed });
  const recent: number[] = [];
  let ms = 0;
  let close: number | null = null;
  while (close === null || run.steps < 2 * close) {
    const before = performance.now();
    recent.push(run.step());
    ms += performance.now() - before;
    if (recent.length > averageOver) recent.shift();
    const average = recent.reduce((a, b) => a + b) / recent.length;
    if (close === null && recent.length === averageOver && Math.abs(average - 2.45) <= 0.02) {
      close = run.steps;
    }
  }
  const average = recent.reduce((a, b) => a + b) / recent.length;
  return {
    model: 'oneLetter',
    seed,
    within0_02: close,
    averageAtTwice: round(average, 4),
    stepsPerSecond: Math.round(run.steps / (ms / 1000)),
  };
}

for (let seed = 1; seed <= 5; seed++) console.log(JSON.stringify(calibrateOneLetter(seed)));
for (let seed = 1; seed <= 5; seed++) console.log(JSON.stringify(calibrateThreeLetter(seed)));
