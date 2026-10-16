// Runs every loss-vs-time config one after another on one core, then the lowercase and Pan Tadeusz runs
// with the Shakespeare config that has the lowest val loss at 120 s.
// node src/runall.js <core>
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';

const core = process.argv[2] ?? '4';
mkdirSync('out/runs', { recursive: true });
const common = ['--mode=run', '--heads=4', '--kernel=ikj4', '--lr=3e-3', '--marks=10,30,60,120,300'];
const run = (id, args) => {
  process.stderr.write(`${new Date().toISOString()} ${id}\n`);
  const out = execFileSync('taskset', ['-c', core, 'node', 'src/train.js', ...common, ...args, `--out=out/runs/${id}.json`], {
    encoding: 'utf8',
    maxBuffer: 1 << 26,
  });
  return JSON.parse(readFileSync(`out/runs/${id}.json`, 'utf8')) && out;
};
const save = (id, text) => execFileSync('tee', [`out/runs/${id}.txt`], { input: text, stdio: ['pipe', 'ignore', 'inherit'] });

const names = [
  ['names-C32-L2', ['--dim=32', '--layers=2']],
  ['names-C48-L2', ['--dim=48', '--layers=2']],
  ['names-C64-L2', ['--dim=64', '--layers=2']],
];
const shakespeare = [
  ['shakespeare-C32-L2', ['--dim=32', '--layers=2']],
  ['shakespeare-C64-L2', ['--dim=64', '--layers=2']],
  ['shakespeare-C64-L4', ['--dim=64', '--layers=4']],
];
for (const [id, args] of names) save(id, run(id, ['--data=names', '--ctx=16', '--batch=32', ...args]));
for (const [id, args] of shakespeare) save(id, run(id, ['--data=shakespeare', '--ctx=64', '--batch=16', ...args]));

const at120 = (id) => JSON.parse(readFileSync(`out/runs/${id}.json`, 'utf8')).points.find((p) => p.mark === 120).valLoss;
const [bestId, bestArgs] = shakespeare.reduce((a, b) => (at120(b[0]) < at120(a[0]) ? b : a));
process.stderr.write(`best shakespeare config at 120 s: ${bestId}\n`);
const suffix = bestId.replace('shakespeare-', '');
for (const data of ['shakespeare-lower', 'pan'])
  save(`${data}-${suffix}`, run(`${data}-${suffix}`, [`--data=${data}`, '--ctx=64', '--batch=16', ...bestArgs]));
process.stderr.write(`${new Date().toISOString()} done\n`);
