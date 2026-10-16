import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fareRule, leastSquares, meanSquaredError, money, start } from './taxiFares.ts';

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

test('fareRule starts at the start rule, and a set notifies a subscriber', () => {
  const unsubscribe = new AbortController();
  let calls = 0;
  assert.deepEqual(fareRule.get(), { fee: 2, price: 2.5 });
  fareRule.subscribe(() => calls++, unsubscribe.signal);
  fareRule.set({ fee: 4, price: 1.5 });
  assert.equal(calls, 1);
  assert.deepEqual(fareRule.get(), { fee: 4, price: 1.5 });
  unsubscribe.abort();
});

test('fareRule.set with an equal rule notifies no one and keeps the rule it has', () => {
  const unsubscribe = new AbortController();
  let calls = 0;
  const first = { fee: 3, price: 1 };
  fareRule.set(first);
  fareRule.subscribe(() => calls++, unsubscribe.signal);
  fareRule.set({ fee: 3, price: 1 });
  assert.equal(calls, 0);
  assert.equal(fareRule.get(), first);
  unsubscribe.abort();
});

test('fareRule does not call a subscription after its signal aborts', () => {
  const unsubscribe = new AbortController();
  const aborted = new AbortController();
  aborted.abort();
  let calls = 0;
  fareRule.subscribe(() => calls++, unsubscribe.signal);
  fareRule.subscribe(() => calls++, aborted.signal);
  unsubscribe.abort();
  fareRule.set({ fee: 6, price: 0.5 });
  assert.equal(calls, 0);
  assert.deepEqual(fareRule.get(), { fee: 6, price: 0.5 });
});

test('the start rule loses 4.43 and its fee reads $2.00', () => {
  assert.equal(meanSquaredError(start).toFixed(2), '4.43');
  assert.equal(money(start.fee), '$2.00');
});

test('money puts the minus before the dollar sign, and a price that rounds to zero reads $0.00', () => {
  assert.equal(money(-0.953125), '-$0.95');
  assert.equal(money(-0.0014), '$0.00');
});
