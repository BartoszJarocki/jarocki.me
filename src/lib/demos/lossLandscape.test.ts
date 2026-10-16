import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  type Walk,
  contour,
  descend,
  ended,
  lift,
  lossAtLift,
  rateLimit,
  rates,
  step,
  valley,
  walkFrom,
} from './lossLandscape.ts';
import {
  type FareRule,
  factor,
  fareRule,
  leastSquares,
  meanSquaredError,
  predict,
  show,
  start,
} from './taxiFares.ts';

const best = meanSquaredError(leastSquares());

const maxSteps = 2000;

function stepsUntil(walk: Walk, rate: number, done: (walk: Walk) => boolean) {
  const walks = [walk];
  while (walks.length <= maxSteps && !done(walks.at(-1)!)) walks.push(step(walks.at(-1)!, rate));
  return walks;
}

const walkToEnd = (walk: Walk, rate: number) => stepsUntil(walk, rate, ended).at(-1)!;

test('steps at the good rate reach 1% of the least-squares loss after 46 steps', () => {
  const near = (walk: Walk) => meanSquaredError(walk.at) <= best * 1.01;
  const walks = stepsUntil(walkFrom(start), rates.good, near);
  assert.equal(walks.at(-1)!.steps, 46);
});

test('the rate limit computed from the rides is 0.3302', () => {
  assert.ok(Math.abs(rateLimit - 0.3302252247324041) < 1e-12, `${rateLimit}`);
});

test('a contour is the ellipse where the loss equals its level', () => {
  const { across, along } = contour(2);
  const { bottom, angle } = valley;
  const ends = [
    { fee: bottom.fee + across * Math.cos(angle), price: bottom.price + across * Math.sin(angle) },
    { fee: bottom.fee - along * Math.sin(angle), price: bottom.price + along * Math.cos(angle) },
  ];
  for (const end of ends) assert.ok(Math.abs(meanSquaredError(end) - 2) < 1e-9);
  assert.deepEqual([across.toFixed(4), along.toFixed(4)], ['0.7431', '3.1665']);
});

test('lift is 1 at the highest corner of the map, and lossAtLift undoes it', () => {
  assert.equal(lift({ fee: 0, price: -2 }), 1);
  assert.equal(lift({ fee: 10, price: 5 }).toFixed(4), '0.9863');
  assert.ok(Math.abs(lossAtLift(1) - 101.2025) < 1e-9);
});

test('every step at too big from the start raises the loss, until the next one leaves the map', () => {
  const walks = stepsUntil(walkFrom(start), rates.tooBig, (walk) => walk.status === 'off');
  assert.deepEqual(
    walks.map((walk) => walk.status),
    ['ready', 'up', 'up', 'up', 'up', 'off'],
  );
  assert.deepEqual(
    walks.slice(0, -1).map((walk) => meanSquaredError(walk.at).toFixed(2)),
    ['4.43', '5.61', '7.99', '12.34', '19.93'],
  );
});

test('500 steps at 1.01 times the limit end with a larger loss than the start', () => {
  let rule = start;
  for (let k = 0; k < 500; k++) rule = descend(rule, rateLimit * 1.01);
  assert.equal(meanSquaredError(start), 4.433749999999999);
  assert.ok(meanSquaredError(rule) > 4.433749999999999, `${meanSquaredError(rule)}`);
});

test('just past the limit, 0.331 lowers the loss for 12 steps, then raises it', () => {
  const losses = [meanSquaredError(start)];
  let rule = start;
  for (let k = 0; k < 14; k++) losses.push(meanSquaredError((rule = descend(rule, 0.331))));
  const lower = losses.slice(1).map((loss, k) => loss < losses[k]);
  assert.deepEqual(lower, [...Array(12).fill(true), false, false]);
});

test('a walk stops on flat ground after 69 steps at good, 195 at zigzag, and 467 at crawl', () => {
  const ends = (['good', 'zigzag', 'crawl'] as const).map((rate) =>
    walkToEnd(walkFrom(start), rates[rate]),
  );
  assert.deepEqual(
    ends.map((walk) => [walk.status, walk.steps]),
    [
      ['flat', 69],
      ['flat', 195],
      ['flat', 467],
    ],
  );
  for (const walk of ends) assert.ok(meanSquaredError(walk.at) < best * 1.001);
});

test('from every spot from $0 to $10 and -$2 to $5 a km, crawl and good walk to flat ground', () => {
  const flat = { crawl: 0, good: 0 };
  for (let i = 0; i <= 100; i++)
    for (let j = 0; j <= 100; j++) {
      const at = { fee: i / 10, price: -2 + (j * 7) / 100 };
      for (const rate of ['crawl', 'good'] as const) {
        const end = walkToEnd(walkFrom(at), rates[rate]);
        if (end.status === 'flat' && meanSquaredError(end.at) < best * 1.001) flat[rate]++;
      }
    }
  assert.deepEqual(flat, { crawl: 10201, good: 10201 });
});

test('zigzag lands across the valley floor on each of its first 20 steps from the start', () => {
  const across = ({ fee, price }: FareRule) =>
    (fee - valley.bottom.fee) * Math.cos(valley.angle) +
    (price - valley.bottom.price) * Math.sin(valley.angle);
  let walk = walkFrom(start);
  const sides = [];
  for (let k = 0; k < 20; k++) {
    walk = step(walk, rates.zigzag);
    sides.push(Math.sign(across(walk.at)));
  }
  assert.deepEqual(
    sides,
    Array.from({ length: 20 }, (_, k) => (k % 2 ? -1 : 1)),
  );
  assert.equal(Math.abs(across(walk.at)).toFixed(2), '0.46');
});

function sentence(at: FareRule) {
  fareRule.set(at);
  const rule = fareRule.get();
  return [show(rule.fee), show(rule.price), factor(rule.price), show(predict(rule, 1.6))];
}

test('the 1.6 km sentence adds up the fee and price the sliders show', () => {
  const { at } = walkToEnd(walkFrom(start), rates.good);
  assert.deepEqual(sentence(start), ['2.00', '2.50', '2.50', '6.00']);
  assert.deepEqual(sentence(at), ['5.21', '1.48', '1.48', '7.58']);
  assert.deepEqual(sentence({ fee: 5.214, price: 1.484 }), ['5.21', '1.48', '1.48', '7.58']);
});

test('below $0 a km the sentence reads 4.63 + 1.6 × (−0.95), and a price that rounds to zero shows 0.00', () => {
  assert.deepEqual(sentence({ fee: 4.629, price: -0.953 }), ['4.63', '−0.95', '(−0.95)', '3.11']);
  assert.deepEqual(sentence({ fee: 5.688, price: -0.0014 }), ['5.69', '0.00', '0.00', '5.69']);
  assert.deepEqual(sentence({ fee: 0.3, price: -0.19 }), ['0.30', '−0.19', '(−0.19)', '0.00']);
});
