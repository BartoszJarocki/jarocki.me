import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  type Walk,
  contour,
  descend,
  lift,
  lossAtLift,
  rateLimit,
  rates,
  step,
  valley,
  walkFrom,
  walkToEnd,
} from './lossLandscape.ts';
import { leastSquares, meanSquaredError, start } from './taxiFares.ts';

const best = meanSquaredError(leastSquares());

test('steps at the good rate reach 1% of the least-squares loss after 46 steps', () => {
  let walk = walkFrom(start);
  while (meanSquaredError(walk.at) > best * 1.01) walk = step(walk, rates.good);
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
  assert.equal(lift({ fee: 10, price: 5 }), 1);
  assert.equal(lift({ fee: 0, price: 0 }).toFixed(4), '0.8848');
  assert.ok(Math.abs(lossAtLift(1) - 94.3025) < 1e-9);
});

test('every step at too big from the start raises the loss, until the next one leaves the map', () => {
  const statuses: Walk['status'][] = [];
  const losses = [meanSquaredError(start)];
  for (let walk = walkFrom(start); walk.status !== 'off'; ) {
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

test('the good walk ends at a fee of 5.21 and a price of 1.48', () => {
  const { at } = walkToEnd(walkFrom(start), rates.good);
  assert.deepEqual([at.fee.toFixed(2), at.price.toFixed(2)], ['5.21', '1.48']);
});
