// node src/train.js --data=names --dim=32 --layers=2 --heads=4 --ctx=16 --batch=32 --mode=run|bench
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createModel, createState, forward, trainStep, generate, rng, paramCount } from './gpt.js';
import { datasets, prepare, getBatch, bigramLoss } from './data.js';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : 'true'];
  }),
);
const num = (k, d) => (args[k] === undefined ? d : Number(args[k]));
const name = args.data ?? 'names';
const source = datasets[name];
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const text = source.clean(readFileSync(join(root, 'data', source.file), 'utf8'));
const ds = prepare(source.kind, text, rng(123));

const config = { vocab: ds.vocab, ctx: num('ctx', 16), dim: num('dim', 32), layers: num('layers', 2), heads: num('heads', 4) };
const B = num('batch', 32);
const T = config.ctx;
const opt = { lr: num('lr', 3e-3), wd: num('wd', 0.01) };
const mode = args.mode ?? 'run';
const label = args.label ?? `${name} C${config.dim} L${config.layers} H${config.heads} T${T} B${B}`;

const model = createModel(config, { seed: num('seed', 1) });
const s = createState(model, B, { kernel: args.kernel ?? 'ikj', fresh: args.fresh === 'true' });
const batchRand = rng(num('seed', 1) + 1000);

const baselines = { uniform: Math.log(ds.vocab), bigram: bigramLoss(ds.train, ds.val, ds.vocab) };
const header = {
  label, data: name, config, B, opt, kernel: args.kernel ?? 'ikj', fresh: args.fresh === 'true',
  params: paramCount(model), vocab: ds.vocab, trainTokens: ds.train.length, valTokens: ds.val.length, baselines,
};
console.log(JSON.stringify(header));

const median = (xs) => {
  const a = [...xs].sort((x, y) => x - y);
  return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
};

if (mode === 'bench') {
  const warmup = num('warmup', 10);
  const steps = num('steps', 60);
  const times = [];
  const losses = [];
  for (let i = 0; i < warmup + steps; i++) {
    const { inputs, targets } = getBatch(ds.train, B, T, batchRand);
    const t0 = performance.now();
    const loss = trainStep(model, s, inputs, targets, opt);
    const ms = performance.now() - t0;
    if (!Number.isFinite(loss)) throw new Error(`loss is ${loss} at step ${i}`);
    losses.push(loss);
    if (i >= warmup) times.push(ms);
  }
  const med = median(times);
  const result = {
    ...header, mode, warmup, steps,
    medianMs: med, minMs: Math.min(...times), maxMs: Math.max(...times),
    tokensPerSec: (B * T * 1000) / med, firstLoss: losses[0], lastLoss: losses.at(-1),
  };
  console.log(JSON.stringify(result));
  if (args.out) writeFileSync(args.out, JSON.stringify(result) + '\n', { flag: 'a' });
} else {
  const marks = (args.marks ?? '10,30,60,120,300').split(',').map(Number);
  const valRand = rng(99);
  const valBatches = Array.from({ length: 8 }, () => getBatch(ds.val, B, T, valRand));
  const valLoss = () => valBatches.reduce((sum, { inputs, targets }) => sum + forward(model, s, inputs, targets), 0) / valBatches.length;
  const sampler = createState(model, 1);
  const nl = ds.encode('\n')[0];

  const samples = () => {
    const rand = rng(7);
    if (source.kind === 'names') {
      const ids = generate(model, sampler, [nl], 300, { temperature: 1, rand, stop: (out) => out.filter((t) => t === nl).length > 10 });
      return [ds.decode(ids).split('\n').filter(Boolean).slice(0, 10).join(' ')];
    }
    return [0, 1, 2].map(() => ds.decode(generate(model, sampler, [nl], 200, { temperature: 0.8, rand })).slice(1));
  };

  const log = [];
  const points = [];
  let trainMs = 0;
  let step = 0;
  const wallStart = performance.now();
  for (const mark of marks) {
    while (trainMs < mark * 1000) {
      const { inputs, targets } = getBatch(ds.train, B, T, batchRand);
      const t0 = performance.now();
      const loss = trainStep(model, s, inputs, targets, opt);
      trainMs += performance.now() - t0;
      step++;
      if (!Number.isFinite(loss)) throw new Error(`loss is ${loss} at step ${step}`);
      log.push([Math.round(trainMs), Number(loss.toFixed(4))]);
    }
    const recent = log.filter(([ms]) => ms > trainMs - 5000).map(([, l]) => l);
    const point = {
      mark, trainSec: trainMs / 1000, wallSec: (performance.now() - wallStart) / 1000, step,
      tokensSeen: step * B * T, trainLoss5s: recent.reduce((a, b) => a + b, 0) / recent.length, valLoss: valLoss(), samples: samples(),
    };
    points.push(point);
    console.log(`\n=== ${label} at ${mark}s: step ${step}, train(last 5s) ${point.trainLoss5s.toFixed(3)}, val ${point.valLoss.toFixed(3)}`);
    for (const sample of point.samples) console.log(`--- sample\n${sample}`);
  }
  if (args.out) {
    mkdirSync(dirname(args.out), { recursive: true });
    writeFileSync(args.out, JSON.stringify({ ...header, mode, points, log }) + '\n');
  }
}
