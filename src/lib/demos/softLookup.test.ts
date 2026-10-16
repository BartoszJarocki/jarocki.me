import assert from 'node:assert/strict';
import { test } from 'node:test';

import { clampQuery, lookup, queryBox, words } from './softLookup.ts';

const close = (actual: readonly number[], expected: readonly number[]) =>
  actual.forEach((n, i) =>
    assert.ok(Math.abs(n - expected[i]) < 1e-12, `${actual} is not ${expected}`),
  );
const total = (weights: readonly number[]) => weights.reduce((a, b) => a + b, 0);

test('the starting query reads car most, and the four weights add up to 1', () => {
  const { scores, weights, found } = lookup(queryBox.start);
  close(scores, [0.75, -1.35, 1.71, -0.66]);
  close(
    weights,
    [0.2513638888460107, 0.030781124019862025, 0.6564861820450467, 0.061368805089080665],
  );
  assert.equal(total(weights).toFixed(12), '1.000000000000');
  close(found, [-0.43570997426825464, -0.8157001417821147]);
});

test('a query in the middle matches no key, so each word gets a quarter', () => {
  const { weights, found } = lookup([0, 0]);
  close(weights, [0.25, 0.25, 0.25, 0.25]);
  close(found, [0, 0]);
});

test("a query on a key's tip gives that key more than 0.9", () => {
  const winners = words.map(({ key }) => lookup(key).weights.map((w) => Number(w.toFixed(3))));
  assert.deepEqual(winners, [
    [0.963, 0.009, 0.028, 0],
    [0.004, 0.99, 0, 0.006],
    [0.001, 0, 0.999, 0],
    [0.001, 0.032, 0.012, 0.955],
  ]);
});

test('a dragged query stays inside the chart', () => {
  assert.deepEqual(clampQuery([4.2, -3.5]), [3, -3]);
  assert.deepEqual(clampQuery([1.5, -0.5]), [1.5, -0.5]);
});
