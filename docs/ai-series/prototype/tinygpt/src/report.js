// node src/report.js [--samples=id,id]: tables from out/runs/*.json.
import { readFileSync, readdirSync } from 'node:fs';

const ids = readdirSync('out/runs').filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
const runs = ids.map((id) => ({ id, ...JSON.parse(readFileSync(`out/runs/${id}.json`, 'utf8')) }));
const sampleIds = (process.argv.find((a) => a.startsWith('--samples=')) ?? '--samples=').slice(10).split(',').filter(Boolean);
const median = (xs) => [...xs].sort((a, b) => a - b)[xs.length >> 1];

console.log('Step time measured inside each 300 s run (steps after the first 20), one process per config');
console.log('config                   params  vocab  tokens/step  steps  median ms  min  max   tok/s');
for (const r of runs) {
  const deltas = r.log.slice(21).map(([ms], i) => ms - r.log[20 + i][0]);
  const med = median(deltas);
  console.log(
    `${r.id.padEnd(24)} ${String(r.params).padStart(6)} ${String(r.vocab).padStart(6)} ${String(r.B * r.config.ctx).padStart(12)} ${String(r.log.length).padStart(6)}` +
      ` ${med.toFixed(0).padStart(10)} ${Math.min(...deltas).toFixed(0).padStart(4)} ${Math.max(...deltas).toFixed(0).padStart(4)} ${((r.B * r.config.ctx * 1000) / med).toFixed(0).padStart(7)}`,
  );
}

console.log('\nLoss vs training time: val loss (train loss, mean of the last 5 s). Baselines are val loss.');
console.log(`config                   uniform bigram |${[10, 30, 60, 120, 300].map((m) => `${m}s`.padStart(15)).join('')} | wall s at 300`);
for (const r of runs) {
  const cells = r.points.map((p) => `${p.valLoss.toFixed(2)} (${p.trainLoss5s.toFixed(2)})`.padStart(15)).join('');
  console.log(`${r.id.padEnd(24)} ${r.baselines.uniform.toFixed(2).padStart(7)} ${r.baselines.bigram.val.toFixed(2).padStart(6)} |${cells} | ${r.points.at(-1).wallSec.toFixed(0)}`);
}

console.log('\nTraining seconds until the 100-step moving average of train loss first drops below a level');
const levels = [2.48, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8];
console.log(`config                   ${levels.map((l) => `<${l}`.padStart(7)).join('')}`);
for (const r of runs) {
  const avg = [];
  let sum = 0;
  r.log.forEach(([, l], i) => {
    sum += l;
    if (i >= 100) sum -= r.log[i - 100][1];
    if (i >= 99) avg.push([r.log[i][0], sum / 100]);
  });
  const cells = levels.map((lv) => {
    const hit = avg.find(([, l]) => l < lv);
    return (hit ? (hit[0] / 1000).toFixed(0) : '-').padStart(7);
  });
  console.log(`${r.id.padEnd(24)} ${cells.join('')}`);
}

console.log('\n100-step moving average of train loss at fixed step counts (independent of machine speed and contention)');
const stepMarks = [100, 250, 500, 1000, 2000, 4000];
console.log(`config                   ${stepMarks.map((s) => `@${s}`.padStart(7)).join('')}`);
for (const r of runs) {
  const cells = stepMarks.map((s) => {
    if (r.log.length < s) return '-'.padStart(7);
    const window = r.log.slice(s - 100, s).map(([, l]) => l);
    return (window.reduce((a, b) => a + b, 0) / window.length).toFixed(2).padStart(7);
  });
  console.log(`${r.id.padEnd(24)} ${cells.join('')}`);
}

for (const id of sampleIds) {
  const r = runs.find((x) => x.id === id);
  console.log(`\n##### samples: ${id}`);
  for (const p of r.points) {
    console.log(`\n--- ${p.mark}s (step ${p.step}, val ${p.valLoss.toFixed(3)})`);
    for (const s of p.samples) console.log(s + '\n');
  }
}
