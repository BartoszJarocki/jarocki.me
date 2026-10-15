import fs from 'node:fs';
const [dir, run, corpusFile] = process.argv.slice(2);
const r = JSON.parse(fs.readFileSync(`${dir}/out/runs/${run}.json`, 'utf8'));
const corpus = fs.readFileSync(corpusFile, 'utf8').toLowerCase();
const words = new Set(corpus.split(/[^a-z']+/).filter(Boolean));
const p0 = r.points[0];
console.log('point keys', Object.keys(p0).join(','));
for (const p of r.points) {
  const samples = p.samples ?? p.text ?? [];
  const fr = samples.map((s) => {
    const ws = s.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z']/g, '')).filter(Boolean);
    return ws.length ? ws.filter((w) => words.has(w)).length / ws.length : 0;
  });
  console.log(p.t ?? p.sec ?? p.mark, 'val', (p.val ?? p.valLoss)?.toFixed?.(3), 'step', p.step, 'in-corpus', fr.map((x) => (x * 100).toFixed(0) + '%').join(' '));
}
