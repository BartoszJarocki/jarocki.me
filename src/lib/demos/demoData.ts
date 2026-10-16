import fs from 'node:fs';

import { countPairs } from '../ml/bigram.ts';
import { cutThreeWays, trainMenus } from '../ml/tokenizers.ts';

export const note = 'src/notes/words-as-numbers.mdx';

const prose = (mdx: string) =>
  mdx
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .replace(/^```[\s\S]*?^```$/gm, '')
    .replace(/^<\/?[A-Z].*$/gm, '')
    .replace(/`[^`\n]*`/g, '')
    .replace(/\]\([^)]*\)/g, ']');

export function demoData() {
  const menus = trainMenus(prose(fs.readFileSync(note, 'utf8')), 200);
  const sentence = 'Your keyboard guessed the unbelievable ending';
  const names = fs.readFileSync('public/data/names.txt', 'utf8').split('\n');
  return {
    menus,
    sentence,
    example: cutThreeWays(sentence, menus),
    nameCounts: Array.from(countPairs(names)),
  };
}
