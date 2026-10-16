// All variants in one process, taking turns step by step on the same batches, so machine noise hits them alike.
// node src/pairs.js <data> <dim> <layers> <ctx> <batch> <warmup> <steps>
import { readFileSync } from 'node:fs';
import { createModel, createState, trainStep, rng } from './gpt.js';
import { datasets, prepare, getBatch } from './data.js';

const [data, dim, layers, ctx, B, warmup, steps] = process.argv.slice(2).map((v, i) => (i ? Number(v) : v));
const source = datasets[data];
const ds = prepare(source.kind, source.clean(readFileSync(new URL(`../data/${source.file}`, import.meta.url), 'utf8')), rng(123));
const config = { vocab: ds.vocab, ctx, dim, layers, heads: 4 };
const variants = [
  ['naive+fresh', 'naive', true],
  ['naive+prealloc', 'naive', false],
  ['ikj+fresh', 'ikj', true],
  ['ikj+prealloc', 'ikj', false],
  ['ikj4+prealloc', 'ikj4', false],
].map(([name, kernel, fresh]) => {
  const model = createModel(config, { seed: 1 });
  return { name, model, s: createState(model, B, { kernel, fresh }), times: [], loss: 0 };
});
const rand = rng(1001);
for (let step = 0; step < warmup + steps; step++) {
  const { inputs, targets } = getBatch(ds.train, B, ctx, rand);
  for (let i = 0; i < variants.length; i++) {
    const v = variants[(i + step) % variants.length];
    const t0 = performance.now();
    v.loss = trainStep(v.model, v.s, inputs, targets, { lr: 3e-3 });
    if (step >= warmup) v.times.push(performance.now() - t0);
  }
}
const median = (xs) => [...xs].sort((a, b) => a - b)[xs.length >> 1];
const base = variants[0].times;
console.log(`${data} C${dim} L${layers} T${ctx} B${B}: ${steps} paired steps after ${warmup} warmup, variants rotate order every step`);
for (const v of variants) {
  const ratios = v.times.map((t, i) => base[i] / t).sort((a, b) => a - b);
  const q = (p) => ratios[Math.floor(p * (ratios.length - 1))];
  console.log(
    `${v.name.padEnd(15)} median ${median(v.times).toFixed(1).padStart(6)} ms (min ${Math.min(...v.times).toFixed(1)}, max ${Math.max(...v.times).toFixed(1)})` +
      `  speedup vs naive+fresh: median ${q(0.5).toFixed(2)}x, IQR ${q(0.25).toFixed(2)} to ${q(0.75).toFixed(2)}  final loss ${v.loss.toFixed(4)}`,
  );
}
