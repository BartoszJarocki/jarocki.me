import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { gpt, readCheckpoint, shakespeareFiles, write } from '../src/lib/ml/gpt.ts';
import { load, save } from '../src/lib/ml/params.ts';
import { startRun } from '../src/lib/ml/training.ts';

const usage = 'usage: node scripts/train.mjs [--bench <steps> | --sample <length>]';
const [flag, value, ...rest] = process.argv.slice(2);
const count = Number(value);
if (
  rest.length > 0 ||
  (flag !== undefined && !['--bench', '--sample'].includes(flag)) ||
  (flag !== undefined && !(Number.isInteger(count) && count > 0))
) {
  console.error(usage);
  process.exit(1);
}

const file = (path) => fileURLToPath(new URL(`../public${path}`, import.meta.url));
const run = startRun(gpt, readFileSync(file(gpt.textPath), 'utf8'), { seed: 1 });
const { model } = run;
const minutes = (ms) => {
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
};
const losses = () => {
  const { training, validation } = model.exam();
  return `training ${training.toFixed(3)}  validation ${validation.toFixed(3)}`;
};

if (flag === '--bench') {
  const warmup = 10;
  const times = [];
  const seen = [];
  while (run.steps < warmup + count) {
    const started = performance.now();
    seen.push(run.step());
    if (run.steps > warmup) times.push(performance.now() - started);
  }
  times.sort((a, b) => a - b);
  const middle = times.length / 2;
  const medianMs =
    times.length % 2 ? times[Math.floor(middle)] : (times[middle - 1] + times[middle]) / 2;
  console.log(
    JSON.stringify({
      steps: count,
      warmup,
      medianMs,
      minMs: times[0],
      maxMs: times.at(-1),
      firstLoss: seen[0],
      lastLoss: seen.at(-1),
    }),
  );
} else if (flag === '--sample') {
  load(model.params, await readCheckpoint(async (path) => new Response(readFileSync(file(path)))));
  const sample = write(model.net, { length: count });
  console.log(`the checkpoint in public/models: ${losses()}`);
  console.log(`${count} symbols at temperature 0.8 with seed 7:\n${sample}`);
  console.log(`words found in the corpus: ${(model.wordShare(sample) * 100).toFixed(1)}%`);
} else {
  const started = performance.now();
  console.log(
    `training on lowercase tiny shakespeare: ${model.params.data.length.toLocaleString('en')} knobs, ${gpt.until.toLocaleString('en')} steps, seed 1`,
  );
  while (run.steps < gpt.until) {
    run.step();
    if (run.steps % 100 === 0) {
      console.log(`step ${run.steps}  ${losses()}  ${minutes(performance.now() - started)}`);
    }
  }
  const { json, bytes } = save(model.params);
  for (const [path, contents] of [
    [shakespeareFiles.bytes, bytes],
    [shakespeareFiles.json, json],
  ]) {
    writeFileSync(file(path), contents);
    console.log(`wrote public${path}, ${Buffer.byteLength(contents).toLocaleString('en')} bytes`);
  }
  console.log(`time taken ${minutes(performance.now() - started)}`);
}
