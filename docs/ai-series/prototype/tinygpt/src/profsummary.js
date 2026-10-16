// node src/profsummary.js file.cpuprofile: self time per function, sorted.
import { readFileSync } from 'node:fs';

const prof = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const byId = new Map(prof.nodes.map((n) => [n.id, n]));
const self = new Map();
for (let i = 0; i < prof.samples.length; i++) {
  const node = byId.get(prof.samples[i]);
  const { functionName, url, lineNumber } = node.callFrame;
  const key = `${functionName || '(anonymous)'} ${url.split('/').pop()}:${lineNumber + 1}`;
  self.set(key, (self.get(key) ?? 0) + (prof.timeDeltas[i] ?? 0));
}
const total = [...self.values()].reduce((a, b) => a + b, 0);
console.log(`total sampled ${(total / 1e6).toFixed(2)} s`);
for (const [key, us] of [...self].sort((a, b) => b[1] - a[1]).slice(0, Number(process.argv[3] ?? 15)))
  console.log(`${((100 * us) / total).toFixed(1).padStart(5)}%  ${(us / 1e6).toFixed(2).padStart(6)} s  ${key}`);
