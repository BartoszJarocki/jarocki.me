import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

import { encode, readCorpus } from '../ml/corpus.ts';
import { forward, gpt, readCheckpoint } from '../ml/gpt.ts';
import { headWeights, trainedGpt } from '../ml/heads.ts';
import { load } from '../ml/params.ts';
import { headsStill } from './headsStill.ts';
import { largestReads, letterName, readingOf, stillNumbers, text } from './sentenceHeads.ts';

const read = async (path: string) => new Response(fs.readFileSync(`public${path}`));
const corpus = fs.readFileSync('public/data/shakespeare.txt', 'utf8');
const found = headWeights(await trainedGpt(read), text);

test("the worker's model reads the 39 symbols the corpus gives, the count the checkpoint stores", async () => {
  const net = await trainedGpt(read);
  const stored = JSON.parse((await readCheckpoint(read)).json).config.vocabulary;
  assert.equal(net.config.symbols, readCorpus(corpus).symbols);
  assert.equal(net.config.symbols.length, stored);
  assert.equal(stored, 39);
});

test("the worker's weights match the model gpt.create checks against the corpus", async () => {
  const model = gpt.create(corpus);
  load(model.params, await readCheckpoint(read));
  const { blocks } = forward(model.net, encode(model.symbols, text));
  const n = text.length;
  blocks.forEach(({ weights }, b) => {
    assert.deepEqual(found.weights.subarray(b * 4 * n * n, (b + 1) * 4 * n * n), weights);
  });
});

test('every row of every head adds up to 1 and reads no letter after its own', () => {
  const n = text.length;
  assert.equal(n, 54);
  for (let b = 0; b < 2; b++) {
    for (let h = 0; h < 4; h++) {
      for (let t = 0; t < n; t++) {
        const row = readingOf(found, b, h, t);
        assert.ok(
          Math.abs(row.reduce((x, y) => x + y, 0) - 1) < 1e-5,
          `block ${b} head ${h} row ${t}`,
        );
        const start = ((b * 4 + h) * n + t) * n;
        assert.ok(found.weights.subarray(start + t + 1, start + n).every((w) => w === 0));
      }
    }
  }
});

test('block 0 head 1 reads the letter just before most at 39 of 53 letters, more than any head', () => {
  const before = [0, 1].flatMap((b) =>
    [0, 1, 2, 3].map((h) => largestReads(found, b, h).filter((s, i) => s === i).length),
  );
  assert.deepEqual(before, [29, 39, 23, 25, 13, 11, 16, 9]);
});

test('block 1 head 3 reads the space before its word most at 20 of the 29 letters inside a word', () => {
  const inside = [...text].flatMap((letter, t) =>
    t > 0 && letter !== ' ' && text[t - 1] !== ' ' && text.lastIndexOf(' ', t) !== -1 ? [t] : [],
  );
  const reads = largestReads(found, 1, 3);
  const hits = inside.filter((t) => reads[t - 1] === text.lastIndexOf(' ', t));
  assert.equal(inside.length, 29);
  assert.equal(hits.length, 20);
});

test("the first block's heads read close by, and the second block's reach further", () => {
  const heads = [0, 1].flatMap((b) => [0, 1, 2, 3].map((h) => ({ b, h })));
  const perLetter = (measure: (row: Float32Array, t: number) => number) =>
    heads.map(({ b, h }) => {
      let total = 0;
      for (let t = 1; t < text.length; t++) total += measure(readingOf(found, b, h, t), t);
      return total / (text.length - 1);
    });
  const near = perLetter((row, t) => row.reduce((sum, w, s) => (t - s <= 2 ? sum + w : sum), 0));
  const back = perLetter((row, t) => row.reduce((sum, w, s) => sum + w * (t - s), 0));
  assert.deepEqual(
    near.slice(0, 4).map((share) => Math.round(share * 100)),
    [85, 82, 81, 80],
  );
  assert.deepEqual(
    back.slice(4).map((letters) => letters.toFixed(1)),
    ['3.6', '5.1', '5.5', '6.6'],
  );
});

test('the committed stills are what the checkpoint gives', () => {
  assert.deepEqual(
    headsStill,
    stillNumbers(found),
    'Run `node src/lib/demos/writeData.ts` and commit src/lib/demos/headsStill.ts.',
  );
});

test('the sentence puts 20 letters and spaces between car and small', () => {
  assert.equal(text.indexOf('small') - (text.indexOf('car') + 'car'.length), 20);
});

test('letterName names a letter by its word', () => {
  assert.equal(letterName(53), 'l in small');
  assert.equal(letterName(12), "' in didn't");
  assert.equal(letterName(3), 'the space after the');
});
