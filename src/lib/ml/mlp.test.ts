import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  chanceOfYes,
  firstNetworkSeed,
  network,
  normal,
  points,
  score,
  seeded,
  stillKnobs,
  stillSteps,
  train,
} from '../demos/playground.ts';
import { MLP, adam, crossEntropy, sigmoid } from './mlp.ts';
import { Value } from './value.ts';

const close = (actual: number, expected: number, within: number) =>
  assert.ok(
    Math.abs(actual - expected) <= within,
    `${actual} is not within ${within} of ${expected}`,
  );

test('a 2-8-8-1 network has 105 knobs', () => {
  const model = new MLP([2, 8, 8, 1], normal(seeded(3)));
  assert.equal(model.parameters().length, 105);
});

test('the same seed gives the same first weights', () => {
  const first = network(3).model.layers[0].neurons[0].weights.map((w) => w.data);
  const again = network(3).model.layers[0].neurons[0].weights.map((w) => w.data);
  assert.deepEqual(first, again);
  assert.notDeepEqual(
    first,
    network(4).model.layers[0].neurons[0].weights.map((w) => w.data),
  );
});

test('500 steps on switches get every point right', () => {
  const data = points('switches');
  const net = network(3);
  assert.equal(score(net.model, data).accuracy, 0.5);
  train(net, data, 500);
  assert.equal(score(net.model, data).accuracy, 1);
});

test('switches gets its loss under 0.05 in 86 steps from seed 3', () => {
  const data = points('switches');
  const net = network(3);
  train(net, data, 85);
  assert.ok(score(net.model, data).loss >= 0.05);
  train(net, data, 1);
  assert.ok(score(net.model, data).loss < 0.05);
});

test('the still shows days after its training steps from the first seed', () => {
  const net = network(firstNetworkSeed);
  const data = points('days');
  train(net, data, stillSteps);
  const knobs = net.model.parameters().map((knob) => knob.data);
  // Node 22 rounds ** in the last bit differently from Node 24, and adam's bias correction uses it.
  assert.ok(
    knobs.length === stillKnobs.length &&
      knobs.every((knob, i) => Math.abs(knob - stillKnobs[i]) < 1e-9),
    `Replace stillKnobs with ${JSON.stringify(knobs)}`,
  );
  const { loss, accuracy } = score(net.model, data);
  assert.equal(accuracy, 1);
  close(loss, 0.027, 0.001);
});

test('the field reads the same answer as the network, before and after training', () => {
  const net = network(5);
  const spots = [-1.15, -0.4, 0, 0.7, 1.15].flatMap((x) => [-1.15, -0.2, 0.9].map((y) => [x, y]));
  const same = () => {
    const chance = chanceOfYes(net.model);
    for (const [x, y] of spots) {
      assert.equal(chance(x, y), sigmoid(net.model.call([x, y]).data));
    }
  };
  same();
  train(net, points('spiral'), 50);
  same();
});

test('cross-entropy gives a fifty-fifty guess a loss of log 2 and a slope of the miss', () => {
  const score = new Value(0);
  const loss = crossEntropy(score, 1);
  loss.backward();
  assert.equal(loss.data, Math.LN2);
  assert.equal(score.grad, -0.5);
});

test('cross-entropy stays finite for a very sure wrong guess', () => {
  const score = new Value(1000);
  const loss = crossEntropy(score, 0);
  loss.backward();
  assert.equal(loss.data, 1000);
  assert.equal(score.grad, 1);
});

test('the first adam step moves each knob by the learning rate, against its slope', () => {
  const up = new Value(1);
  const down = new Value(1);
  const step = adam([up, down]);
  up.grad = -0.5;
  down.grad = 2;
  step();
  close(up.data, 1.01, 1e-9);
  close(down.data, 0.99, 1e-9);
});
