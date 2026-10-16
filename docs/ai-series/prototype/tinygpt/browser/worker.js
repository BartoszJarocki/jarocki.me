import { createModel, createState, trainStep, rng, paramCount } from '../src/gpt.js';
import { datasets, prepare, getBatch } from '../src/data.js';

onmessage = async ({ data: runs }) => {
  for (const run of runs) {
    const source = datasets[run.data];
    const text = source.clean(await (await fetch(`../data/${source.file}`)).text());
    const ds = prepare(source.kind, text, rng(123));
    const config = { vocab: ds.vocab, ctx: run.ctx, dim: run.dim, layers: run.layers, heads: run.heads };
    const model = createModel(config, { seed: 1 });
    const s = createState(model, run.batch, { kernel: run.kernel });
    const rand = rng(1001);
    const times = [];
    const losses = [];
    for (let i = 0; i < run.warmup + run.steps; i++) {
      const { inputs, targets } = getBatch(ds.train, run.batch, config.ctx, rand);
      const t0 = performance.now();
      losses.push(trainStep(model, s, inputs, targets, { lr: 3e-3 }));
      if (i >= run.warmup) times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    postMessage({ ...run, params: paramCount(model), medianMs: times[times.length >> 1], minMs: times[0], maxMs: times.at(-1), firstLoss: losses[0], lastLoss: losses.at(-1) });
  }
};
