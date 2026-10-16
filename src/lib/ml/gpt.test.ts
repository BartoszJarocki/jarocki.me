import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

import { seeded } from './bigram.ts';
import { encode, readCorpus, wordShare } from './corpus.ts';
import { createTransformer, forward, gpt, practice, shakespeare } from './gpt.ts';
import { checkSlopes, save } from './params.ts';
import { startRun } from './training.ts';

const text = fs.readFileSync('public/data/shakespeare.txt', 'utf8');

test('every slope of a one-block transformer matches a central difference in float64', () => {
  const tiny = { symbols: 'abcde', context: 4, width: 8, blocks: 1, heads: 2 };
  const net = createTransformer(tiny, { seed: 7, float: Float64Array });
  const roll = seeded(3);
  for (let i = 0; i < net.params.data.length; i++) net.params.data[i] = roll() * 2 - 1;
  for (const length of [4, 3]) {
    const ids = () => Int32Array.from({ length: 3 * length }, () => Math.floor(roll() * 5));
    const batch = { tokens: ids(), targets: ids(), length };
    const check = checkSlopes(net.params, () => practice(net, batch));
    assert.deepEqual(check.failures, []);
    assert.ok(check.worstAbsolute < 1e-8, `worst absolute error ${check.worstAbsolute}`);
  }
});

test('the shipped model has 30,055 knobs, 120,220 bytes of float32', () => {
  const net = createTransformer(shakespeare);
  assert.equal(net.params.layout.size, 30_055);
  assert.equal(save(net.params).bytes.byteLength, 120_220);
});

test('changing a later letter leaves the scores of every earlier letter as they were', () => {
  const net = createTransformer(shakespeare, { seed: 2 });
  const symbols = shakespeare.symbols.length;
  const line = encode(shakespeare.symbols, 'to be, or not to be');
  const changed = encode(shakespeare.symbols, 'to be, or xot to be');
  const before = forward(net, line);
  const after = forward(net, changed);
  assert.deepEqual(after.scores.subarray(0, 10 * symbols), before.scores.subarray(0, 10 * symbols));
  assert.notDeepEqual(
    after.scores.subarray(10 * symbols, 11 * symbols),
    before.scores.subarray(10 * symbols, 11 * symbols),
  );
  const n = line.length;
  for (const { weights } of before.blocks) {
    for (let row = 0; row < weights.length / n; row++) {
      const t = row % n;
      const ahead = weights.subarray(row * n + t + 1, (row + 1) * n);
      assert.ok(
        ahead.every((w) => w === 0),
        `head row ${row} reads ahead`,
      );
    }
  }
});

test("seed 1 takes the prototype's first ten steps, to a loss of 3.1366722466101202", () => {
  const run = startRun(gpt, text, { seed: 1 });
  const losses = Array.from({ length: 10 }, () => run.step());
  assert.equal(losses[0], 3.6536311176321363);
  assert.equal(losses[9], 3.1366722466101202);
});

test("the fixture gives the prototype's losses for seed 1's first knobs", () => {
  assert.deepEqual(gpt.create(text).exam(), {
    training: 3.6553541085267898,
    validation: 3.6570688113354253,
  });
});

test('the corpus is lowercase tiny shakespeare, 39 symbols, cut 90% to 10%', () => {
  const corpus = readCorpus(text);
  assert.equal(corpus.symbols, shakespeare.symbols);
  assert.equal(corpus.symbols.length, 39);
  assert.equal(corpus.training.length, 1_003_854);
  assert.equal(corpus.validation.length, 111_540);
});

test("the word share counts a sample's words that the corpus has", () => {
  const corpus = readCorpus(text);
  assert.equal(wordShare(corpus, "To be, or NOT to bee: o'er thou'rt 3 zqxv!"), 7 / 9);
  assert.equal(wordShare(corpus, '3 ! :'), 0);
});
