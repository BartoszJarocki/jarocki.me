import { copyFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import subsetFont from 'subset-font';

const geist = 'node_modules/geist';
const outDir = 'src/fonts';
const sources = [
  'dist/fonts/geist-mono/GeistMono-Variable.woff2',
  'dist/fonts/geist-pixel/GeistPixel-Square.woff2',
  'dist/fonts/geist-sans/Geist-Variable.woff2',
];

const blocks = {
  'Basic Latin': [0x20, 0x7e],
  'Latin-1 Supplement': [0xa0, 0xff],
  'Latin Extended-A': [0x100, 0x17f],
  'General Punctuation': [0x2000, 0x206f],
  Arrows: [0x2190, 0x21ff],
};

// Every feature a browser applies without CSS asking for it, plus tnum for Tailwind's
// tabular-nums. Glyphs that only other features reach, such as the stylistic sets, are dropped.
const features = [
  'abvm',
  'blwm',
  'calt',
  'ccmp',
  'clig',
  'curs',
  'dist',
  'dnom',
  'frac',
  'kern',
  'liga',
  'locl',
  'ltra',
  'ltrm',
  'mark',
  'mkmk',
  'numr',
  'rand',
  'rclt',
  'rlig',
  'rvrn',
  'trak',
  'tnum',
];

const text = Object.values(blocks)
  .flatMap(([first, last]) => Array.from({ length: last - first + 1 }, (_, i) => first + i))
  .map((codepoint) => String.fromCodePoint(codepoint))
  .join('');

async function subset() {
  const { version } = JSON.parse(await readFile(path.join(geist, 'package.json'), 'utf8'));
  console.log(`geist ${version}`);
  for (const source of sources) {
    const input = await readFile(path.join(geist, source));
    const output = await subsetFont(input, text, {
      targetFormat: 'woff2',
      keepFeatures: features,
      // The OFL license description and URL, which the subsetter drops by default.
      preserveNameIds: [13, 14],
    });
    const file = path.join(outDir, path.basename(source));
    await writeFile(file, output);
    console.log(`${file} ${input.length} -> ${output.length} bytes`);
  }
  await copyFile(path.join(geist, 'LICENSE.txt'), path.join(outDir, 'LICENSE.txt'));
}

const commands = { subset };
const command = commands[process.argv[2]];
if (!command) throw new Error(`Usage: node scripts/fonts.mjs ${Object.keys(commands).join('|')}`);
await command();
