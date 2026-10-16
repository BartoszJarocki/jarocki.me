import fs from 'node:fs';
import prettier from 'prettier';

import { headWeights, trainedGpt } from '../ml/heads.ts';
import { demoData } from './demoData.ts';
import { stillNumbers, text } from './sentenceHeads.ts';

const { menus, sentence, example, nameCounts } = demoData();
const trained = await trainedGpt(async (path) => new Response(fs.readFileSync(`public${path}`)));
const files = {
  'src/lib/demos/tokenizerMenus.ts': [
    `import type { Menus } from '../ml/tokenizers.ts';`,
    `export const menus: Menus = ${JSON.stringify(menus)};`,
  ],
  'src/lib/demos/tokenizerExample.ts': [
    `import type { Cuts } from '../ml/tokenizers.ts';`,
    `export const sentence = ${JSON.stringify(sentence)};`,
    `export const example: Cuts = ${JSON.stringify(example)};`,
  ],
  'src/lib/demos/nameCounts.ts': [`export const nameCounts = ${JSON.stringify(nameCounts)};`],
  'src/lib/demos/headsStill.ts': [
    `export const headsStill = ${JSON.stringify(stillNumbers(headWeights(trained, text)))};`,
  ],
};
for (const [file, statements] of Object.entries(files)) {
  const options = await prettier.resolveConfig(file);
  const source = await prettier.format(statements.join('\n\n'), { ...options, filepath: file });
  fs.writeFileSync(file, source);
}
