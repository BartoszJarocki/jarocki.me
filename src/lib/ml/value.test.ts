import assert from 'node:assert/strict';
import { test } from 'node:test';

import { type Value, add, backward, exp, log, multiply, pow, relu, tanh, value } from './value.ts';

const close = (actual: number, expected: number, within: number) =>
  assert.ok(
    Math.abs(actual - expected) <= within,
    `${actual} is not within ${within} of ${expected}`,
  );

test('backward through d = a * b + c gives each input its slope', () => {
  const a = value(2);
  const b = value(-3);
  const c = value(10);
  const d = add(multiply(a, b), c);
  backward(d);
  assert.equal(d.data, 4);
  assert.equal(a.grad, -3);
  assert.equal(b.grad, 2);
  assert.equal(c.grad, 1);
});

test('tanh at 0.8814 has a slope of about 0.49998', () => {
  const x = value(0.8814);
  backward(tanh(x));
  close(x.grad, 0.49998, 1e-4);
});

test('a value used twice collects the slopes from both uses', () => {
  const a = value(3);
  backward(add(multiply(a, a), a));
  assert.equal(a.grad, 7);
});

test('every operation gives its value and passes back its own slope', () => {
  const cases: [number, (x: Value) => Value, number, number][] = [
    [2, (x) => add(x, 3), 5, 1],
    [2, (x) => multiply(x, 3), 6, 3],
    [2, (x) => pow(x, 3), 8, 12],
    [2, (x) => exp(x), 7.38905609893065, 7.38905609893065],
    [2, (x) => log(x), 0.6931471805599453, 0.5],
    [1, (x) => tanh(x), 0.7615941559557649, 0.41997434161402614],
    [1.5, (x) => relu(x), 1.5, 1],
    [-1.5, (x) => relu(x), 0, 0],
  ];
  for (const [at, f, expected, slope] of cases) {
    const x = value(at);
    const y = f(x);
    backward(y);
    close(y.data, expected, 1e-9);
    close(x.grad, slope, 1e-9);
  }
});

test('pow(0) at 0 is 1 with a slope of 0', () => {
  const x = value(0);
  const y = pow(x, 0);
  backward(y);
  assert.equal(y.data, 1);
  assert.equal(x.grad, 0);
});

test('backward twice on the same graph gives the same slopes', () => {
  const a = value(2);
  const b = value(-3);
  const d = add(multiply(a, b), a);
  backward(d);
  backward(d);
  assert.equal(a.grad, -2);
  assert.equal(b.grad, 2);
});

test('an operation made with the factory passes back the slope it was given', () => {
  const s = value(0.5);
  const loss = multiply(value(1, [[s, 0.25]]), 2);
  backward(loss);
  assert.equal(s.grad, 0.5);
});
