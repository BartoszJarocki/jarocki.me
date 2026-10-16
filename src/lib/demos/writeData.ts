import fs from 'node:fs';

import { countPairs, size } from '../ml/bigram.ts';
import { cutThreeWays, trainMenus } from '../ml/tokenizers.ts';

const note = 'src/notes/words-as-numbers.mdx';
const prose = fs
  .readFileSync(note, 'utf8')
  .replace(/^---\n[\s\S]*?\n---\n/, '')
  .replace(/^```[\s\S]*?^```$/gm, '')
  .replace(/^<\/?[A-Z].*$/gm, '')
  .replace(/`[^`\n]*`/g, '')
  .replace(/[*#]/g, '');
const menus = trainMenus(prose, 200);
const sentence = 'Your keyboard guessed the unbelievable ending.';
fs.writeFileSync(
  'src/lib/demos/tokenizerMenus.ts',
  `import type { Menus } from '../ml/tokenizers.ts';\n\n` +
    `export const menus: Menus = ${JSON.stringify(menus)};\n`,
);

fs.writeFileSync(
  'src/lib/demos/tokenizerExample.ts',
  `import type { Cuts } from '../ml/tokenizers.ts';\n\n` +
    `export const sentence = ${JSON.stringify(sentence)};\n\n` +
    `export const example: Cuts = ${JSON.stringify(cutThreeWays(sentence, menus))};\n`,
);

const counts = countPairs(fs.readFileSync('public/data/names.txt', 'utf8').split('\n'));
const rows = Array.from({ length: size }, (_, row) =>
  Array.from(counts.subarray(row * size, (row + 1) * size)).join(', '),
);
fs.writeFileSync(
  'src/lib/demos/nameCounts.ts',
  `export const nameCounts = [\n${rows.map((row) => `  ${row},`).join('\n')}\n];\n`,
);
