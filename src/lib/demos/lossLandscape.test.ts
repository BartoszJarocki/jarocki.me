import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  type Walk,
  contour,
  descend,
  ended,
  fareFromRounded,
  lift,
  lossAtLift,
  rateLimit,
  rates,
  rounded,
  step,
  valley,
  walkFrom,
} from './lossLandscape.ts';
import { type FareRule, leastSquares, meanSquaredError, start } from './taxiFares.ts';

const best = meanSquaredError(leastSquares());

// step returns an ended walk unchanged, so a loop without a cap spins forever when a rate regresses.
const cap = 2000;

function walkToEnd(walk: Walk, rate: number) {
  for (let k = 0; k < cap && !ended(walk); k++) walk = step(walk, rate);
  return walk;
}

test('steps at the good rate reach 1% of the least-squares loss after 46 steps', () => {
  let walk = walkFrom(start);
  for (let k = 0; k < cap && meanSquaredError(walk.at) > best * 1.01; k++) {
    walk = step(walk, rates.good);
  }
  assert.equal(walk.steps, 46);
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
  const statuses: Walk['status'][] = [];
  const losses = [meanSquaredError(start)];
  for (let walk = walkFrom(start), k = 0; k < cap && walk.status !== 'off'; k++) {
    walk = step(walk, rates.tooBig);
    statuses.push(walk.status);
    if (walk.status !== 'off') losses.push(meanSquaredError(walk.at));
  }
  assert.deepEqual(statuses, ['up', 'up', 'up', 'up', 'off']);
  assert.deepEqual(
    losses.map((loss) => loss.toFixed(2)),
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

test('the 1.6 km fare adds up the fee and price rounded to cents', () => {
  const { at } = walkToEnd(walkFrom(start), rates.good);
  const ask = (rule: FareRule) => [rounded(rule), fareFromRounded(rule, 1.6)];
  assert.deepEqual(ask(start), [{ fee: '2.00', price: '2.50' }, '6.00']);
  assert.deepEqual(ask(at), [{ fee: '5.21', price: '1.48' }, '7.58']);
  assert.deepEqual(ask({ fee: 5.214, price: 1.484 }), [{ fee: '5.21', price: '1.48' }, '7.58']);
});
