import { type MLP, type Point, adam, mlp, parameters, sigmoid, trainStep } from '../ml/mlp.ts';

export const sizes = [2, 8, 8, 1];
export const dataSeed = 11;
export const firstNetworkSeed = 3;
export const reducedMotionSteps = 300;
export const stillSteps = 150;

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
  const model = mlp(sizes, normal(seeded(seed)));
  return { model, step: adam(parameters(model)) };
}

export type Network = ReturnType<typeof network>;

export function chanceOfYes(model: MLP) {
  const layers = model.layers.map((layer) =>
    layer.neurons.map((neuron) => ({
      weights: Float64Array.from(neuron.weights, (w) => w.data),
      bias: neuron.bias.data,
      squash: neuron.squash,
    })),
  );
  const widest = Math.max(2, ...layers.map((layer) => layer.length));
  let values = new Float64Array(widest);
  let next = new Float64Array(widest);
  return (x: number, y: number) => {
    values[0] = x;
    values[1] = y;
    for (const layer of layers) {
      for (let o = 0; o < layer.length; o++) {
        const { weights, bias, squash } = layer[o];
        let sum = bias;
        for (let i = 0; i < weights.length; i++) sum += weights[i] * values[i];
        next[o] = squash ? Math.tanh(sum) : sum;
      }
      [values, next] = [next, values];
    }
    return sigmoid(values[0]);
  };
}

export function score(model: MLP, data: Point[]) {
  const chance = chanceOfYes(model);
  let loss = 0;
  let right = 0;
  for (const point of data) {
    const p = Math.min(Math.max(chance(point.x, point.y), 1e-7), 1 - 1e-7);
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

export type Picture = {
  chanceAt: (column: number, row: number) => number;
  firstLayer: (readonly [weightX: number, weightY: number, bias: number])[];
};

export function picture(model: MLP): Picture {
  const chance = chanceOfYes(model);
  const corners = new Float64Array((grid + 1) ** 2);
  const spacing = (2 * reach) / grid;
  for (let row = 0; row <= grid; row++) {
    for (let column = 0; column <= grid; column++) {
      corners[row * (grid + 1) + column] = chance(-reach + column * spacing, reach - row * spacing);
    }
  }
  return {
    chanceAt: (column, row) => corners[row * (grid + 1) + column],
    firstLayer: model.layers[0].neurons.map(
      ({ weights, bias }) => [weights[0].data, weights[1].data, bias.data] as const,
    ),
  };
}

export const stillKnobs = [
  1.8060945896069136, 1.9057745272941538, 1.1235736140909673, -2.2246058874951276,
  1.517691199193959, -1.1738228919870892, 0.24470604209124638, 1.8098819962350763,
  -1.012273633907872, -2.077111586146797, 1.3185173718181797, 1.2537343310555045,
  0.04507458931428096, -0.13435997956430998, 1.0173686088201306, 1.4292634247968892,
  1.3688191507331933, -0.9929479757386293, -0.2294573169780807, 0.11496298478322459,
  -1.0623278583088964, 0.013526944451177386, 0.11046659280601394, -1.104811064854284,
  1.6860039204359183, -1.0821278432709036, -1.2561392693802227, 1.4772893525249542,
  -1.2638328156047227, -1.007552798270804, 1.008940368726517, 0.818052515665049,
  -1.1607967987626457, -1.5636813749018768, 0.8562708109784366, -0.8090769548298085,
  -1.3231871231051382, 1.128526960589818, -0.9526506559057537, 0.7189950376425088,
  0.8384157471367845, 0.12009553019873687, -1.5952991704407786, 0.8992908569274592,
  0.8684979536885636, -1.2550631365273357, 0.5437004174088267, 1.165807244084557,
  -1.051759877389729, -1.018957976160428, 1.088135727904603, 1.0169563118016431,
  -0.9692589909468636, -1.351066657094845, 1.6362815409545668, -1.6337361936194406,
  -0.47293847324765426, -0.2510183738601663, 1.4678381139595902, -0.7559930509007282,
  -0.3711087281857877, -0.12380595653573837, -0.18941765651069348, 0.34031678747269517,
  0.9737241646398016, 0.6250735973439198, -0.5705553979002195, -0.7149646392960415,
  0.7584703528844048, -2.177208081029502, 1.2297107942090824, 0.371031429902186,
  -0.07960351104709756, 0.48766426857114786, -0.5524558667571521, 0.3473285217138009,
  -0.5094764784424773, 0.05021956775909724, -1.596325987761744, 1.588909541277541,
  1.0164908076936798, -1.7979841702891972, 0.963040258543549, 1.0697997723033144,
  -1.2060444910771175, -1.4043799045935452, 1.0784973735986791, -0.8731854154749523,
  1.6111421305730877, 1.4659955242597955, 0.6180573291590048, 1.1112039614935676,
  1.2209623492053483, 0.13970711645422101, -0.2642071698987194, 0.27829680951111674,
  1.4073712590133156, -1.0665122586315345, -1.3887385342404384, 1.7914626423074445,
  -0.9164050017618967, -0.9270910258516337, -1.3842945328999754, -0.9049151917685352,
  -0.7359387796602213,
];
