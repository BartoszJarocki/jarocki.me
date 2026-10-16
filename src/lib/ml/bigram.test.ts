import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

import { nameCounts } from '../demos/nameCounts.ts';
import { averageLoss, chances, countPairs, sampleName, seeded, size } from './bigram.ts';
import { encode, symbols } from './tokenizers.ts';

const names = fs.readFileSync('public/data/names.txt', 'utf8').split('\n');
const counts = countPairs(names);
const at = (pair: string) => counts[symbols.indexOf(pair[0]) * size + symbols.indexOf(pair[1])];

test('encode puts the dot around a name and gives each letter its place in the menu', () => {
  assert.deepEqual(encode('ava'), [0, 1, 22, 1, 0]);
});

test('countPairs counts every pair in names.txt on top of a starting one', () => {
  assert.equal(names.length, 32033);
  assert.equal(at('.e'), 1532);
  assert.equal(at('qu'), 207);
  assert.equal(at('n.'), 6764);
  assert.equal(at('..'), 0);
});

test('the counts the still draws are the counts of names.txt', () => {
  assert.deepEqual(nameCounts, Array.from(counts));
});

test('chances of a row add up to one, and temperature sharpens or flattens them', () => {
  const q = symbols.indexOf('q');
  const u = symbols.indexOf('u');
  const close = (actual: number, expected: number) =>
    assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} is not ${expected}`);
  close(
    chances(counts, q).reduce((sum, p) => sum + p),
    1,
  );
  close(chances(counts, q)[u], 207 / 299);
  close(chances(counts, q, 0.5)[u], 0.9704663329785066);
  close(chances(counts, q, 2)[u], 0.26305065896756713);
});

test('a name never ends before its first letter, even at temperature 2', () => {
  assert.equal(chances(counts, 0, 2)[0], 0);
});

test('averageLoss of the counts on all names is 2.4546', () => {
  assert.equal(averageLoss(counts, names), 2.4545724405809457);
});

test('sampleName at temperature 1 with seed 1 writes the same names every time', () => {
  const random = seeded(1);
  assert.deepEqual(
    Array.from({ length: 5 }, () => sampleName(counts, 1, random)),
    ['m', 'kyuginazelaia', 'k', 'ira', 'akerbendmanaryarahadaon'],
  );
});
