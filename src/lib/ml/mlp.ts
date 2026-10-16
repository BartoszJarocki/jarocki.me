import { type Value, add, backward, multiply, tanh, value } from './value.ts';

export type Neuron = { weights: Value[]; bias: Value; squash: boolean };
export type Layer = { neurons: Neuron[] };
export type MLP = { layers: Layer[] };

function neuron(inputs: number, normal: () => number, squash: boolean): Neuron {
  const weights: Value[] = [];
  for (let i = 0; i < inputs; i++) {
    weights.push(value(normal() * Math.sqrt(1 / inputs)));
  }
  return { weights, bias: value(0), squash };
}

function neuronOutput(knobs: Neuron, inputs: Value[]) {
  let sum = knobs.bias;
  for (let i = 0; i < knobs.weights.length; i++) {
    const weighted = multiply(knobs.weights[i], inputs[i]);
    sum = add(sum, weighted);
  }
  if (knobs.squash) return tanh(sum);
  return sum;
}

function layer(inputs: number, outputs: number, normal: () => number, squash: boolean): Layer {
  const neurons: Neuron[] = [];
  for (let i = 0; i < outputs; i++) {
    neurons.push(neuron(inputs, normal, squash));
  }
  return { neurons };
}

export function mlp(sizes: number[], normal: () => number): MLP {
  const layers: Layer[] = [];
  const last = sizes.length - 2;
  for (let i = 0; i < sizes.length - 1; i++) {
    layers.push(layer(sizes[i], sizes[i + 1], normal, i < last));
  }
  return { layers };
}

export function forward(model: MLP, inputs: number[]) {
  let values = inputs.map((input) => value(input));
  for (const layer of model.layers) {
    const next: Value[] = [];
    for (const knobs of layer.neurons) {
      next.push(neuronOutput(knobs, values));
    }
    values = next;
  }
  return values[0];
}

export function parameters(model: MLP) {
  const knobs: Value[] = [];
  for (const layer of model.layers) {
    for (const neuron of layer.neurons) {
      knobs.push(...neuron.weights, neuron.bias);
    }
  }
  return knobs;
}

export type Point = { x: number; y: number; label: 0 | 1 };

export function sigmoid(score: number) {
  return 1 / (1 + Math.exp(-score));
}

export function crossEntropy(score: Value, label: number) {
  const guess = score.data;
  const loss = Math.max(guess, 0) - label * guess + Math.log(1 + Math.exp(-Math.abs(guess)));
  return value(loss, [[score, sigmoid(guess) - label]]);
}

export function adam(knobs: Value[], rate = 0.01) {
  const averageSlope = knobs.map(() => 0);
  const averageSquare = knobs.map(() => 0);
  let steps = 0;
  return () => {
    steps++;
    for (let i = 0; i < knobs.length; i++) {
      const knob = knobs[i];
      averageSlope[i] = 0.9 * averageSlope[i] + 0.1 * knob.grad;
      averageSquare[i] = 0.999 * averageSquare[i] + 0.001 * knob.grad * knob.grad;
      const slope = averageSlope[i] / (1 - 0.9 ** steps);
      const square = averageSquare[i] / (1 - 0.999 ** steps);
      knob.data -= (rate * slope) / (Math.sqrt(square) + 1e-8);
    }
  };
}

export function trainStep(model: MLP, points: Point[], step: () => void) {
  const losses: Value[] = [];
  for (const point of points) {
    const guess = forward(model, [point.x, point.y]);
    losses.push(crossEntropy(guess, point.label));
  }
  let total = losses[0];
  for (let i = 1; i < losses.length; i++) total = add(total, losses[i]);
  const loss = multiply(total, 1 / points.length);
  backward(loss);
  step();
  return loss.data;
}
