import { Value } from './value.ts';

export class Neuron {
  weights: Value[];
  bias = new Value(0);
  squash: boolean;

  constructor(inputs: number, normal: () => number, squash: boolean) {
    this.weights = Array.from(
      { length: inputs },
      () => new Value(normal() * Math.sqrt(1 / inputs)),
    );
    this.squash = squash;
  }

  call(x: Value[]) {
    const sum = this.weights.reduce((total, w, i) => total.add(w.mul(x[i])), this.bias);
    return this.squash ? sum.tanh() : sum;
  }
}

export class Layer {
  neurons: Neuron[];

  constructor(inputs: number, outputs: number, normal: () => number, squash: boolean) {
    this.neurons = Array.from({ length: outputs }, () => new Neuron(inputs, normal, squash));
  }

  call(x: Value[]) {
    return this.neurons.map((neuron) => neuron.call(x));
  }
}

export class MLP {
  layers: Layer[];

  constructor(sizes: number[], normal: () => number) {
    const last = sizes.length - 2;
    this.layers = sizes.slice(1).map((size, i) => new Layer(sizes[i], size, normal, i < last));
  }

  call(x: number[]) {
    let values = x.map((input) => new Value(input));
    for (const layer of this.layers) values = layer.call(values);
    return values[0];
  }

  parameters() {
    return this.layers.flatMap((layer) => layer.neurons.flatMap((n) => [...n.weights, n.bias]));
  }
}

export type Point = { x: number; y: number; label: 0 | 1 };

export const sigmoid = (s: number) => 1 / (1 + Math.exp(-s));

export function crossEntropy(score: Value, label: number) {
  const s = score.data;
  const loss = Math.max(s, 0) - label * s + Math.log(1 + Math.exp(-Math.abs(s)));
  return new Value(loss, [[score, sigmoid(s) - label]]);
}

export function adam(parameters: Value[], rate = 0.01) {
  const m = parameters.map(() => 0);
  const v = parameters.map(() => 0);
  let t = 0;
  return () => {
    t++;
    parameters.forEach((p, i) => {
      m[i] = 0.9 * m[i] + 0.1 * p.grad;
      v[i] = 0.999 * v[i] + 0.001 * p.grad * p.grad;
      p.data -= (rate * (m[i] / (1 - 0.9 ** t))) / (Math.sqrt(v[i] / (1 - 0.999 ** t)) + 1e-8);
    });
  };
}

export function trainStep(model: MLP, points: Point[], step: () => void) {
  const losses = points.map((p) => crossEntropy(model.call([p.x, p.y]), p.label));
  const loss = losses.reduce((sum, each) => sum.add(each)).mul(1 / points.length);
  loss.backward();
  step();
  return loss.data;
}
