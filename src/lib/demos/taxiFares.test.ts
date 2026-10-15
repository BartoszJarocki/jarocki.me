import assert from 'node:assert/strict';
import { test } from 'node:test';

import { leastSquares, meanSquaredError } from './taxiFares.ts';

const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not ${expected}`);

test('meanSquaredError with no fee and no price is the mean of the squared fares', () => {
  close(meanSquaredError({ fee: 0, price: 0 }), 52.3525);
});

test('leastSquares finds the fee, the price, and the lowest loss', () => {
  const fit = leastSquares();
  close(fit.fee, 5.235767326732674);
  close(fit.price, 1.4628712871287117);
  close(meanSquaredError(fit), 0.3278975866336632);
});
