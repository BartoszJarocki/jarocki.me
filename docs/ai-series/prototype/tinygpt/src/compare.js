// Alternates matmul kernel and allocation variants, one process per run, rotating the order each round.
// node src/compare.js <core> <rounds> <warmup> <steps> -- <train.js config args>
import { execFileSync } from 'node:child_process';

const [core, rounds, warmup, steps] = process.argv.slice(2, 6);
const configArgs = process.argv.slice(process.argv.indexOf('--') + 1);
const variants = [
  { kernel: 'naive', fresh: true },
  { kernel: 'naive', fresh: false },
  { kernel: 'ikj', fresh: true },
  { kernel: 'ikj', fresh: false },
  { kernel: 'ikj4', fresh: false },
];
const results = new Map(variants.map((v) => [`${v.kernel}${v.fresh ? '+fresh' : '+prealloc'}`, []]));
for (let r = 0; r < Number(rounds); r++) {
  for (let i = 0; i < variants.length; i++) {
    const v = variants[(i + r) % variants.length];
    const out = execFileSync('taskset', ['-c', core, 'node', 'src/train.js', '--mode=bench', `--warmup=${warmup}`, `--steps=${steps}`,
      `--kernel=${v.kernel}`, `--fresh=${v.fresh}`, ...configArgs], { encoding: 'utf8' });
    const res = JSON.parse(out.trim().split('\n').at(-1));
    results.get(`${v.kernel}${v.fresh ? '+fresh' : '+prealloc'}`).push(res);
    process.stderr.write('.');
  }
}
const first = [...results.values()][0][0];
console.log(`\n${first.label}, params ${first.params}, ${rounds} runs per variant x ${steps} steps after ${warmup} warmup`);
const base = (xs) => [...xs].sort((a, b) => a - b)[xs.length >> 1];
const baseline = base(results.get('naive+fresh').map((r) => r.medianMs));
for (const [name, runs] of results) {
  const meds = runs.map((r) => r.medianMs);
  const med = base(meds);
  console.log(
    `${name.padEnd(15)} median of run medians ${med.toFixed(1)} ms (run medians ${Math.min(...meds).toFixed(1)} to ${Math.max(...meds).toFixed(1)}), ` +
      `all steps ${Math.min(...runs.map((r) => r.minMs)).toFixed(1)} to ${Math.max(...runs.map((r) => r.maxMs)).toFixed(1)} ms, ` +
      `${((first.B * first.config.ctx * 1000) / med).toFixed(0)} tok/s, speedup vs naive+fresh ${(baseline / med).toFixed(2)}x, ` +
      `loss ${runs[0].firstLoss.toFixed(3)} -> ${runs[0].lastLoss.toFixed(3)}`,
  );
}
