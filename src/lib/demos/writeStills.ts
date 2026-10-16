import fs from 'node:fs';
import prettier from 'prettier';

import { oneLetter, threeLetter } from '../ml/letters.ts';
import { startRun } from '../ml/training.ts';

const text = fs.readFileSync('public/data/names.txt', 'utf8');

async function write(file: string, statements: string[]) {
  const options = await prettier.resolveConfig(file);
  fs.writeFileSync(
    file,
    await prettier.format(statements.join('\n'), { ...options, filepath: file }),
  );
}

const counting = startRun(oneLetter, text, { seed: 1 });
const losses: number[] = [];
while (counting.steps < oneLetter.until) losses.push(counting.step());
const every = 10;
const averages = [];
for (let i = 0; i < losses.length; i += every) {
  const group = losses.slice(i, i + every);
  averages.push(Number((group.reduce((a, b) => a + b) / group.length).toFixed(3)));
}
await write('src/lib/demos/oneLetterCurve.ts', [
  `// The one-letter model's average loss over each ${every} steps of its run with seed 1, from writeStills.ts.`,
  `export const curveEvery = ${every};`,
  `export const curve = ${JSON.stringify(averages)};`,
]);

const steps = 20_000;
const map = startRun(threeLetter, text, { seed: 1 });
while (map.steps < steps) map.step();
await write('src/lib/demos/letterPlaces.ts', [
  `// The three-letter model's places after ${steps.toLocaleString('en-US')} steps with seed 1, from writeStills.ts.`,
  `export const placesStep = ${steps};`,
  `export const places = ${JSON.stringify(Array.from(map.model.letters.data, (n) => Number(n.toFixed(3))))};`,
]);
