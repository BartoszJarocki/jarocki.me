// Repeats a bench of every config in rotating order, one process per run, to get run-to-run spread.
// node src/benchtable.js <core> <rounds>
import { execFileSync } from 'node:child_process';

const [core = '4', rounds = '3'] = process.argv.slice(2);
const common = ['--mode=bench', '--heads=4', '--kernel=ikj4', '--steps=50'];
const configs = [
  ['names-C32-L2', ['--data=names', '--ctx=16', '--batch=32', '--dim=32', '--layers=2', '--warmup=20']],
  ['names-C48-L2', ['--data=names', '--ctx=16', '--batch=32', '--dim=48', '--layers=2', '--warmup=20']],
  ['names-C64-L2', ['--data=names', '--ctx=16', '--batch=32', '--dim=64', '--layers=2', '--warmup=20']],
  ['shakespeare-C32-L2', ['--data=shakespeare', '--ctx=64', '--batch=16', '--dim=32', '--layers=2', '--warmup=20']],
  ['shakespeare-C64-L2', ['--data=shakespeare', '--ctx=64', '--batch=16', '--dim=64', '--layers=2', '--warmup=10']],
  ['shakespeare-C64-L4', ['--data=shakespeare', '--ctx=64', '--batch=16', '--dim=64', '--layers=4', '--warmup=10']],
  ['shakespeare-lower-C32-L2', ['--data=shakespeare-lower', '--ctx=64', '--batch=16', '--dim=32', '--layers=2', '--warmup=20']],
  ['pan-C32-L2', ['--data=pan', '--ctx=64', '--batch=16', '--dim=32', '--layers=2', '--warmup=20']],
];
const results = new Map(configs.map(([id]) => [id, []]));
for (let r = 0; r < Number(rounds); r++)
  for (let i = 0; i < configs.length; i++) {
    const [id, args] = configs[(i + r) % configs.length];
    const out = execFileSync('taskset', ['-c', core, 'node', 'src/train.js', ...common, ...args], { encoding: 'utf8' });
    results.get(id).push(JSON.parse(out.trim().split('\n').at(-1)));
    process.stderr.write('.');
  }
console.log(`\n${rounds} runs per config, 50 timed steps per run after warmup, core ${core}`);
console.log('config                   params  tok/step  median of run medians  run medians      all steps min-max   tok/s');
for (const [id, runs] of results) {
  const meds = runs.map((r) => r.medianMs).sort((a, b) => a - b);
  const med = meds[meds.length >> 1];
  const tokens = runs[0].B * runs[0].config.ctx;
  console.log(
    `${id.padEnd(24)} ${String(runs[0].params).padStart(6)} ${String(tokens).padStart(9)} ${med.toFixed(1).padStart(16)} ms` +
      `   ${meds.map((m) => m.toFixed(0)).join('/').padEnd(16)} ${Math.min(...runs.map((r) => r.minMs)).toFixed(0).padStart(6)}-${Math.max(...runs.map((r) => r.maxMs)).toFixed(0).padEnd(8)} ${((tokens * 1000) / med).toFixed(0).padStart(7)}`,
  );
}
