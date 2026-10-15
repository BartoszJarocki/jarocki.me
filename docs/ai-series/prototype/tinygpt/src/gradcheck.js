import { createModel, createState, forward, backward, rng, randn } from './gpt.js';

const config = { vocab: 5, ctx: 3, dim: 8, heads: 2, layers: 2 };
const B = 3;
const eps = 1e-5;

function check(kernel, fresh) {
  const model = createModel(config, { seed: 7, F: Float64Array });
  const rand = rng(3);
  // Move every parameter off its init (unit gammas, zero biases) so no gradient is trivially zero.
  for (let i = 0; i < model.data.length; i++) model.data[i] = 0.5 * randn(rand);
  const n = B * config.ctx;
  const inputs = Int32Array.from({ length: n }, () => Math.floor(rand() * config.vocab));
  const targets = Int32Array.from({ length: n }, () => Math.floor(rand() * config.vocab));
  const s = createState(model, B, { kernel, fresh });

  forward(model, s, inputs, targets);
  model.grad.fill(0);
  backward(model, s);
  const analytic = Float64Array.from(model.grad);

  const rows = [];
  let offset = 0;
  for (const [name, t] of Object.entries(model.p)) {
    let maxRel = 0;
    let maxAbs = 0;
    let atWorst = 0;
    for (let i = 0; i < t.w.length; i++) {
      const old = t.w[i];
      t.w[i] = old + eps;
      const up = forward(model, s, inputs, targets);
      t.w[i] = old - eps;
      const down = forward(model, s, inputs, targets);
      t.w[i] = old;
      const numeric = (up - down) / (2 * eps);
      const a = analytic[offset + i];
      const abs = Math.abs(a - numeric);
      maxAbs = Math.max(maxAbs, abs);
      const rel = abs / Math.max(Math.abs(a) + Math.abs(numeric), 1e-8);
      if (rel > maxRel) [maxRel, atWorst] = [rel, a];
    }
    rows.push({ name, n: t.w.length, maxRel, maxAbs, atWorst });
    offset += t.w.length;
  }
  return { rows, analytic };
}

const runs = [
  ['ikj4', false],
  ['ikj', false],
  ['naive', false],
  ['ikj', true],
];
const results = runs.map(([k, f]) => ({ label: `${k}${f ? '+fresh' : ''}`, ...check(k, f) }));

const base = results[0];
console.log(`config ${JSON.stringify(config)} B=${B} float64 eps=${eps}, every element of every tensor`);
console.log('tensor'.padEnd(12), 'n'.padStart(5), ...results.map((r) => `maxRel(${r.label})`.padStart(20)), 'maxAbs(ikj)'.padStart(12), '|grad| at worst'.padStart(16));
base.rows.forEach((row, i) =>
  console.log(
    row.name.padEnd(12),
    String(row.n).padStart(5),
    ...results.map((r) => r.rows[i].maxRel.toExponential(2).padStart(20)),
    row.maxAbs.toExponential(2).padStart(12),
    Math.abs(row.atWorst).toExponential(2).padStart(16),
  ),
);
const worst = Math.max(...results.flatMap((r) => r.rows.map((x) => x.maxRel)));
const worstAbs = Math.max(...results.flatMap((r) => r.rows.map((x) => x.maxAbs)));
const kernelGap = Math.max(...results.slice(1).map((r) => Math.max(...r.analytic.map((g, i) => Math.abs(g - base.analytic[i])))));
console.log(`worst relative error across all tensors and variants: ${worst.toExponential(2)}`);
console.log(`max |grad difference| between variants: ${kernelGap.toExponential(2)}`);
console.log(`worst absolute error: ${worstAbs.toExponential(2)} (finite-difference roundoff is about 1e-16 * loss / eps = 1e-11)`);
// A relative error is only meaningful where the gradient is well above the roundoff floor.
console.log(worstAbs < 1e-9 ? 'GRADCHECK PASS' : 'GRADCHECK FAIL');
