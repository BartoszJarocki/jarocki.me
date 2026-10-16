import { MLP, type Point, adam, sigmoid, trainStep } from '../ml/mlp.ts';

export const sizes = [2, 8, 8, 1];
export const dataSeed = 11;
export const firstNetworkSeed = 3;
export const reducedMotionSteps = 300;

export function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const normal = (random: () => number) => () =>
  Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());

const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));

function sample(count: number, make: (index: number) => Point | null) {
  const points: Point[] = [];
  while (points.length < count) {
    const point = make(points.length);
    if (point) points.push(point);
  }
  return points;
}

type Axis = readonly [low: string, name: string, high: string];

export type Dataset = {
  axes: { x: Axis; y: Axis };
  inputs: readonly [string, string];
  make: (random: () => number) => Point[];
};

export const datasets = {
  days: {
    axes: { x: ['colder', 'temperature', 'warmer'], y: ['drier', 'humidity', 'damper'] },
    inputs: ['temp', 'humid'],
    make: (random) =>
      sample(100, () => {
        const x = random() * 2 - 1;
        const y = random() * 2 - 1;
        const d = Math.abs((x - 0.04) / 0.58) ** 4 + Math.abs((y + 0.02) / 0.56) ** 4;
        if (Math.abs(d - 1) < 0.15) return null;
        return { x, y, label: d < 1 ? 1 : 0 };
      }),
  },
  switches: {
    axes: { x: ['down', 'switch one', 'up'], y: ['down', 'switch two', 'up'] },
    inputs: ['one', 'two'],
    make: (random) => {
      const gauss = normal(random);
      return sample(100, (i) => {
        const x = clamp1((i % 2 ? 1 : -1) * 0.62 + gauss() * 0.15);
        const y = clamp1(((i >> 1) % 2 ? 1 : -1) * 0.62 + gauss() * 0.15);
        if (Math.abs(x) < 0.12 || Math.abs(y) < 0.12) return null;
        return { x, y, label: x * y < 0 ? 1 : 0 };
      });
    },
  },
  groups: {
    axes: { x: ['colder', 'temperature', 'warmer'], y: ['calm', 'wind', 'windy'] },
    inputs: ['temp', 'wind'],
    make: (random) => {
      const gauss = normal(random);
      return sample(100, (i) => {
        const label = i % 2 ? 1 : 0;
        const x = clamp1((label ? 0.4 : -0.42) + gauss() * 0.24);
        const y = clamp1((label ? -0.38 : 0.4) + gauss() * 0.24);
        if ((label ? 1 : -1) * (x - y) < 0.25) return null;
        return { x, y, label };
      });
    },
  },
  spiral: {
    axes: { x: ['left', '', 'right'], y: ['down', '', 'up'] },
    inputs: ['right', 'up'],
    make: (random) => {
      const gauss = normal(random);
      return sample(100, (i) => {
        const label = i % 2 ? 1 : 0;
        const t = Math.floor(i / 2) / 50;
        const radius = 0.1 + t * 0.85;
        const angle = t * 1.5 * Math.PI * 2 + label * Math.PI;
        const x = Math.cos(angle) * radius + gauss() * 0.025;
        const y = Math.sin(angle) * radius + gauss() * 0.025;
        return { x, y, label };
      });
    },
  },
} satisfies Record<string, Dataset>;

export type DatasetName = keyof typeof datasets;

export const points = (name: DatasetName) => datasets[name].make(seeded(dataSeed));

export function network(seed: number) {
  const model = new MLP(sizes, normal(seeded(seed)));
  return { model, step: adam(model.parameters()) };
}

export type Network = ReturnType<typeof network>;

/** The same sum as MLP.call, on plain numbers, so the field can ask for thousands of spots a frame. */
export function predict(model: MLP, x: number, y: number) {
  let values = [x, y];
  for (const layer of model.layers) {
    values = layer.neurons.map((neuron) => {
      const sum = neuron.weights.reduce(
        (total, w, i) => total + w.data * values[i],
        neuron.bias.data,
      );
      return neuron.squash ? Math.tanh(sum) : sum;
    });
  }
  return sigmoid(values[0]);
}

export function score(model: MLP, data: Point[]) {
  let loss = 0;
  let right = 0;
  for (const point of data) {
    const p = Math.min(Math.max(predict(model, point.x, point.y), 1e-7), 1 - 1e-7);
    loss -= Math.log(point.label ? p : 1 - p);
    if (p > 0.5 === (point.label === 1)) right++;
  }
  return { loss: loss / data.length, accuracy: right / data.length };
}

export function train(net: Network, data: Point[], steps: number) {
  for (let k = 0; k < steps; k++) trainStep(net.model, data, net.step);
}

export const grid = 40;
export const reach = 1.15;

/** What the playground draws of a network: its answer at every grid corner, and the first layer's knobs. */
export type Picture = {
  answers: Float64Array;
  first: (readonly [number, number, number])[];
};

export function picture(model: MLP): Picture {
  const answers = new Float64Array((grid + 1) ** 2);
  const spacing = (2 * reach) / grid;
  for (let j = 0; j <= grid; j++) {
    for (let i = 0; i <= grid; i++) {
      answers[j * (grid + 1) + i] = predict(model, -reach + i * spacing, reach - j * spacing);
    }
  }
  const first = model.layers[0].neurons.map(
    ({ weights, bias }) => [weights[0].data, weights[1].data, bias.data] as const,
  );
  return { answers, first };
}
