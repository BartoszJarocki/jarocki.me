import fs from 'node:fs';
import prettier from 'prettier';

import { demoData } from './demoData.ts';

const { menus, sentence, example, nameCounts } = demoData();
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
};
for (const [file, statements] of Object.entries(files)) {
  const options = await prettier.resolveConfig(file);
  const source = await prettier.format(statements.join('\n\n'), { ...options, filepath: file });
  fs.writeFileSync(file, source);
}
