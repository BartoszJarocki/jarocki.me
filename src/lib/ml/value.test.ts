import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Value } from './value.ts';

const close = (actual: number, expected: number, within: number) =>
  assert.ok(
    Math.abs(actual - expected) <= within,
    `${actual} is not within ${within} of ${expected}`,
  );

test('backward through d = a * b + c gives each input its slope', () => {
  const a = new Value(2);
  const b = new Value(-3);
  const c = new Value(10);
  const d = a.mul(b).add(c);
  d.backward();
  assert.equal(d.data, 4);
  assert.equal(a.grad, -3);
  assert.equal(b.grad, 2);
  assert.equal(c.grad, 1);
});

test('tanh at 0.8814 has a slope of about 0.49998', () => {
  const x = new Value(0.8814);
  x.tanh().backward();
  close(x.grad, 0.49998, 1e-4);
});

test('a value used twice collects the slopes from both uses', () => {
  const a = new Value(3);
  a.mul(a).add(a).backward();
  assert.equal(a.grad, 7);
});

test('pow, exp, log, and relu each pass back their own slope', () => {
  const cases: [number, (x: Value) => Value, number][] = [
    [2, (x) => x.pow(3), 12],
    [2, (x) => x.exp(), 7.38905609893065],
    [2, (x) => x.log(), 0.5],
    [1.5, (x) => x.relu(), 1],
    [-1.5, (x) => x.relu(), 0],
  ];
  for (const [at, f, slope] of cases) {
    const x = new Value(at);
    f(x).backward();
    close(x.grad, slope, 1e-9);
  }
});

test('pow(0) at 0 is 1 with a slope of 0', () => {
  const x = new Value(0);
  const y = x.pow(0);
  y.backward();
  assert.equal(y.data, 1);
  assert.equal(x.grad, 0);
});

test('backward twice on the same graph gives the same slopes', () => {
  const a = new Value(2);
  const b = new Value(-3);
  const d = a.mul(b).add(a);
  d.backward();
  d.backward();
  assert.equal(a.grad, -2);
  assert.equal(b.grad, 2);
});

test('an operation made with the constructor passes back the slope it was given', () => {
  const s = new Value(0.5);
  const loss = new Value(1, [[s, 0.25]]).mul(2);
  loss.backward();
  assert.equal(s.grad, 0.5);
});
