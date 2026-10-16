import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { places } from '../demos/letterPlaces.ts';
import { seeded } from './bigram.ts';
import {
  crossEntropy,
  examples,
  oneLetter,
  oneLetterKnobs,
  oneLetterLoss,
  softmax,
  threeLetter,
  threeLetterKnobs,
  threeLetterLoss,
} from './letters.ts';
import { CheckpointError, checkSlopes, createParams, load, save } from './params.ts';
import { type Out, averageOver, startRun, trainingHandler } from './training.ts';

const text = fs.readFileSync('public/data/names.txt', 'utf8');
const someNames = ['emma', 'olivia', 'ava', 'quinn', 'zoe'];

test('every slope of the one-letter model matches a central difference in float64', () => {
  const params = createParams({
    model: 'oneLetter',
    config: {},
    knobs: oneLetterKnobs,
    roll: seeded(3),
    float: Float64Array,
  });
  const roll = seeded(4);
  for (let i = 0; i < params.data.length; i++) params.data[i] = roll() * 2 - 1;
  const batch = examples(someNames, 1);
  const check = checkSlopes(params, () => oneLetterLoss(params, batch));
  assert.deepEqual(check.failures, []);
  assert.ok(check.worstAbsolute < 1e-8, `worst absolute error ${check.worstAbsolute}`);
});

test('every slope of the three-letter model matches a central difference in float64', () => {
  const params = createParams({
    model: 'threeLetter',
    config: { hidden: 4 },
    knobs: threeLetterKnobs,
    roll: seeded(5),
    float: Float64Array,
  });
  const batch = examples(someNames, 3);
  const check = checkSlopes(params, () => threeLetterLoss(params, batch));
  assert.deepEqual(check.failures, []);
  assert.ok(check.worstAbsolute < 1e-8, `worst absolute error ${check.worstAbsolute}`);
});

test('a slope check fails a wrong slope and names the number', () => {
  const params = createParams({
    model: 'oneLetter',
    config: {},
    knobs: oneLetterKnobs,
    roll: seeded(3),
    float: Float64Array,
  });
  const batch = examples(['ab'], 1);
  const check = checkSlopes(params, () => {
    const loss = oneLetterLoss(params, batch);
    params.grad[1] *= 2;
    return loss;
  });
  assert.equal(check.failures.length, 1);
  assert.match(check.failures[0], /^scores\[1\] analytic -0\.64197\d+ numeric -0\.32098\d+$/);
});

test('softmax and the surprise give the numbers the note uses', () => {
  const chances = new Float64Array(3);
  softmax(Float64Array.from([-1, 0, 1]), chances);
  assert.deepEqual(
    Array.from(chances, (c) => `${Math.round(c * 100)}%`),
    ['9%', '24%', '67%'],
  );
  assert.equal(crossEntropy(Float64Array.from([0.5, 0.5]), 0).toFixed(2), '0.69');
  assert.equal(crossEntropy(Float64Array.from([0.99, 0.01]), 1).toFixed(1), '4.6');
});

test('the one-letter model starts at a surprise of 3.30, a 1 in 27 chance for every letter', () => {
  const run = startRun(oneLetter, text);
  assert.equal(run.step().toFixed(2), '3.30');
});

test('13,997 of the 19,683 runs of three tokens never come before a letter in the names', () => {
  const pairs = examples(text.split('\n'), 3);
  const seen = new Set<number>();
  for (let e = 0; e < pairs.count; e++) {
    seen.add(pairs.before[e * 3] * 729 + pairs.before[e * 3 + 1] * 27 + pairs.before[e * 3 + 2]);
  }
  assert.equal(27 ** 3 - seen.size, 13997);
});

test("the still's map has the vowels near one another, y next to i, and q far from everything", () => {
  const symbols = '.abcdefghijklmnopqrstuvwxyz';
  const id = (symbol: string) => symbols.indexOf(symbol);
  const distance = (a: number, b: number) =>
    Math.hypot(...[0, 1, 2].map((k) => places[a * 3 + k] - places[b * 3 + k]));
  const nearest = (symbol: string) =>
    [...symbols]
      .filter((other) => other !== symbol)
      .sort((x, y) => distance(id(symbol), id(x)) - distance(id(symbol), id(y)));
  for (const vowel of 'aeiou') {
    const toVowels = [...'aeiou'].filter((v) => v !== vowel).map((v) => distance(id(vowel), id(v)));
    const toAll = nearest(vowel).map((other) => distance(id(vowel), id(other)));
    const average = toVowels.reduce((a, b) => a + b) / toVowels.length;
    assert.ok(
      average < toAll[13],
      `${vowel} is ${average} from the other vowels, median ${toAll[13]}`,
    );
  }
  assert.equal(nearest('y')[0], 'i');
  const fromMiddle = (symbol: string) =>
    Math.hypot(...[0, 1, 2].map((k) => places[id(symbol) * 3 + k]));
  const radii = [...symbols].map(fromMiddle).sort((a, b) => a - b);
  assert.ok(fromMiddle('q') > 3 * radii[13], `q at ${fromMiddle('q')}, median ${radii[13]}`);
});

test('a slope check fails a loss that adds to the slopes without clearing them first', () => {
  const params = createParams({
    model: 'oneLetter',
    config: {},
    knobs: oneLetterKnobs,
    roll: seeded(3),
    float: Float64Array,
  });
  const batch = examples(['ab'], 1);
  const check = checkSlopes(params, () => {
    const kept = Float64Array.from(params.grad);
    const loss = oneLetterLoss(params, batch);
    for (let i = 0; i < kept.length; i++) params.grad[i] += kept[i];
    return loss;
  });
  assert.equal(check.failures.length, params.data.length);
});

test('a slope check fails a slope or a loss that is not a number', () => {
  const params = createParams({
    model: 'oneLetter',
    config: {},
    knobs: oneLetterKnobs,
    roll: seeded(3),
    float: Float64Array,
  });
  const batch = examples(['ab'], 1);
  const broken = checkSlopes(params, () => {
    const loss = oneLetterLoss(params, batch);
    params.grad[2] = NaN;
    return loss;
  });
  assert.equal(broken.failures.length, 1);
  assert.match(broken.failures[0], /^scores\[2\] analytic NaN numeric 0\.01234\d+$/);
  assert.equal(checkSlopes(params, () => NaN).failures.length, params.data.length);
});

test('examples pad each name with dots and end on the dot', () => {
  const pairs = examples(['ava'], 3);
  assert.equal(pairs.count, 4);
  assert.deepEqual([...pairs.before], [0, 0, 0, 0, 0, 1, 0, 1, 22, 1, 22, 1]);
  assert.deepEqual([...pairs.next], [1, 22, 1, 0]);
});

test('the three-letter model has the calibrated loss after 200 steps with seed 1', () => {
  const run = startRun(threeLetter, text, { seed: 1 });
  const losses: number[] = [];
  while (run.steps < 200) losses.push(run.step());
  const average = losses.slice(-averageOver).reduce((a, b) => a + b) / averageOver;
  assert.equal(average.toFixed(4), '2.4877');
});

test('a checkpoint loads back into the same numbers', () => {
  const trained = startRun(threeLetter, text, { seed: 1 });
  for (let i = 0; i < 5; i++) trained.step();
  const file = save(trained.model.params);
  const fresh = startRun(threeLetter, text, { seed: 2 });
  load(fresh.model.params, file);
  assert.deepEqual(fresh.model.params.data, trained.model.params.data);
  assert.equal(file.bytes.byteLength, 1292 * 4);
  assert.match(file.json, /\{"name": "places", "offset": 0, "shape": \[27, 3\]\},\n/);
});

test('a checkpoint with one changed byte in its layout fails and names the field', () => {
  const params = startRun(threeLetter, text).model.params;
  const file = save(params);
  const fails = (json: string, message: string) =>
    assert.throws(
      () => load(params, { ...file, json }),
      (error) =>
        error instanceof CheckpointError &&
        error.message === `The checkpoint's layout differs at ${message}`,
    );
  fails(
    file.json.replace('"offset": 81', '"offset": 82'),
    'tensors[1] (hiddenWeights).offset, where the file has "{\\"name\\": \\"hiddenWeights\\", \\"offset\\": 82, \\"shape\\": [9, 32]}," and the code expects "{\\"name\\": \\"hiddenWeights\\", \\"offset\\": 81, \\"shape\\": [9, 32]},"',
  );
  fails(
    file.json.replace('"hidden": 32', '"hidden": 31'),
    'config.hidden, where the file has "\\"config\\": {\\"hidden\\": 31}," and the code expects "\\"config\\": {\\"hidden\\": 32},"',
  );
  fails(
    file.json.replace('"size"', '"sizf"'),
    'size, where the file has "\\"sizf\\": 1292," and the code expects "\\"size\\": 1292,"',
  );
  fails(
    file.json.replace('{\n', '{\r\n'),
    'the opening brace, where the file has "{\\r" and the code expects "{"',
  );
  fails(file.json + '\n', 'the closing brace, where the file goes on after it');
  fails(file.json.slice(0, -1), 'the closing brace, where the file has no line break after it');
  fails(file.json.split('\n').slice(0, 3).join('\n'), 'config, where the file ends');
  fails(file.json + 'x', 'the closing brace, where the file goes on after it');
  fails(
    file.json.replace('  "size"', ' \t"size"'),
    'size, where the file has "\\t\\"size\\": 1292," and the code expects "\\"size\\": 1292,"',
  );
});

test('a checkpoint read back from files on disk loads, even from a small pooled buffer', () => {
  const trained = startRun(threeLetter, text, { seed: 1 });
  trained.step();
  const file = save(trained.model.params);
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'checkpoint-'));
  fs.writeFileSync(path.join(folder, 'letters.json'), file.json);
  fs.writeFileSync(path.join(folder, 'letters.bin'), file.bytes);
  const fresh = startRun(threeLetter, text, { seed: 2 });
  load(fresh.model.params, {
    json: fs.readFileSync(path.join(folder, 'letters.json'), 'utf8'),
    bytes: fs.readFileSync(path.join(folder, 'letters.bin')),
  });
  assert.deepEqual(fresh.model.params.data, trained.model.params.data);
  fs.rmSync(folder, { recursive: true });
});

test('a checkpoint with too few bytes or a number that is not finite fails', () => {
  const params = startRun(threeLetter, text).model.params;
  const file = save(params);
  assert.throws(
    () => load(params, { ...file, bytes: file.bytes.slice(0, 5000) }),
    /^CheckpointError: The checkpoint has 5000 bytes, and the layout needs 5168, 1292 numbers of 4 bytes$/,
  );
  const broken = new Float32Array(file.bytes.slice().buffer);
  broken[81 + 7] = NaN;
  assert.throws(
    () => load(params, { ...file, bytes: new Uint8Array(broken.buffer) }),
    /^CheckpointError: The checkpoint's number hiddenWeights\[7\] is NaN$/,
  );
});

const read = async (path: string) => new Response(fs.readFileSync(`public${path}`));
const settle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test('the worker handler stops stepping when it is paused', async () => {
  const posted: Out[] = [];
  const receive = trainingHandler({ post: (message) => posted.push(message), read });
  const lastStep = () => posted.findLast((m) => m.type === 'progress')?.step ?? 0;
  await receive({ type: 'start', model: 'threeLetter' });
  while (lastStep() < 50) await settle(10);
  await receive({ type: 'pause', model: 'threeLetter' });
  const stopped = lastStep();
  await settle(200);
  assert.equal(lastStep(), stopped);
  const last = posted.findLast((m) => m.type === 'progress');
  assert.equal(last?.type === 'progress' && last.running, false);
  const snapshot = posted.findLast((m) => m.type === 'snapshot');
  assert.equal(snapshot?.type === 'snapshot' && snapshot.vectors.length, 81);
});

test("the worker handler resets to step 0 and the seed's numbers", async () => {
  const posted: Out[] = [];
  const receive = trainingHandler({ post: (message) => posted.push(message), read });
  await receive({ type: 'snapshot', model: 'threeLetter' });
  const first = posted.findLast((m) => m.type === 'snapshot');
  await receive({ type: 'start', model: 'threeLetter' });
  await settle(100);
  await receive({ type: 'reset', model: 'threeLetter' });
  const progress = posted.findLast((m) => m.type === 'progress');
  const snapshot = posted.findLast((m) => m.type === 'snapshot');
  assert.equal(progress?.type === 'progress' && progress.step, 0);
  assert.deepEqual(
    snapshot?.type === 'snapshot' && [...snapshot.vectors],
    first?.type === 'snapshot' && [...first.vectors],
  );
});

test("the one-letter model stops by itself at its last step, near the counting model's loss", async () => {
  const posted: Out[] = [];
  const receive = trainingHandler({ post: (message) => posted.push(message), read });
  await receive({ type: 'start', model: 'oneLetter' });
  while (!posted.some((m) => m.type === 'progress' && m.done)) await settle(20);
  const last = posted.findLast((m) => m.type === 'progress');
  assert.equal(last?.type === 'progress' && last.step, oneLetter.until);
  assert.equal(last?.type === 'progress' && last.running, false);
  assert.ok(last?.type === 'progress' && Math.abs(last.average! - 2.45) < 0.02, `average ${last}`);
  await receive({ type: 'sample', model: 'oneLetter' });
  const sample = posted.findLast((m) => m.type === 'sample');
  assert.equal(sample?.type === 'sample' && sample.text.split(' ').length, 10);
});
