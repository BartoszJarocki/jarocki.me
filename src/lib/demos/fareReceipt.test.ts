import assert from 'node:assert/strict';
import { test } from 'node:test';

import { nudge, receipt, show } from './fareReceipt.ts';
import type { Line } from './receiptLines.ts';

const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) <= 1e-9, `${actual} is not ${expected}`);

test('the first ride at a fee of 2 and 2.50 per km, line by line', () => {
  const lines = receipt({ fee: 2, price: 2.5 });
  const expected: [Line, number, number][] = [
    ['price', 2.5, -2.1],
    ['fee', 2, -7],
    ['ride', 0.75, -7],
    ['fare', 2.75, -7],
    ['miss', -3.5, -7],
    ['loss', 12.25, 1],
  ];
  for (const [line, amount, slope] of expected) {
    close(lines[line].data, amount);
    close(lines[line].grad, slope);
  }
});

test('at the start, the nudge and the slope both show -2.10', () => {
  const rule = { fee: 2, price: 2.5 };
  const { ratio } = nudge(rule);
  close(ratio, -2.0991);
  assert.equal(show(ratio), '-2.10');
  assert.equal(show(receipt(rule).price.grad), '-2.10');
});

test('the nudge and the slope can round apart', () => {
  const rule = { fee: 5, price: 1.08 };
  assert.equal(show(nudge(rule).ratio), '-0.55');
  assert.equal(show(receipt(rule).price.grad), '-0.56');
});

test('the nudge is very close to the slope at every setting, and never equal', () => {
  for (let fee = 0; fee <= 10; fee += 0.5) {
    for (let price = 0; price <= 5; price += 0.25) {
      const rule = { fee, price };
      const { ratio } = nudge(rule);
      const slope = receipt(rule).price.grad;
      assert.ok(Math.abs(ratio - slope) <= 0.3 ** 2 * 0.01 + 1e-9, `${ratio} vs ${slope}`);
      assert.notEqual(ratio, slope);
    }
  }
});

test('show prints a tiny negative as zero', () => {
  assert.equal(show(-0.001), '0.00');
});
