import { MDXRemote } from 'next-mdx-remote';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { type TestContext, after, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'notes-test-'));
const notesDir = path.join(root, 'src/notes');
fs.mkdirSync(notesDir, { recursive: true });
process.chdir(root);
after(() => fs.rmSync(root, { recursive: true, force: true }));

const { getNoteContent, getNotes, seriesParts } = await import('./notes.ts');

function writeNote(slug: string, publishedAt: string, extra = '') {
  const frontmatter = `title: ${slug}\ndescription: about ${slug}\npublishedAt: ${publishedAt}\ntags: [test]\n${extra}`;
  fs.writeFileSync(path.join(notesDir, `${slug}.mdx`), `---\n${frontmatter}---\n\nbody\n`);
}

function slugsWhen(vercelEnv: string | undefined) {
  if (vercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = vercelEnv;
  return getNotes().map((note) => note.slug);
}

test('getNotes hides a draft only in production', () => {
  writeNote('published', '2024-01-01');
  writeNote('not-draft', '2024-02-01', 'draft: false\n');
  writeNote('draft', '2024-03-01', 'draft: true\n');

  assert.deepEqual(slugsWhen(undefined), ['draft', 'not-draft', 'published']);
  assert.deepEqual(slugsWhen('preview'), ['draft', 'not-draft', 'published']);
  assert.deepEqual(slugsWhen('production'), ['not-draft', 'published']);
  delete process.env.VERCEL_ENV;
});

test('getNotes rejects a draft that YAML does not read as true or false', (t) => {
  writeNote('typo', '2024-04-01', 'draft: yes\n');
  t.after(() => fs.rmSync(path.join(notesDir, 'typo.mdx')));

  assert.throws(() => getNotes(), {
    message: 'src/notes/typo.mdx: frontmatter needs draft as true or false',
  });
});

test('getNotes rejects frontmatter that is not key: value fields', (t) => {
  const file = path.join(notesDir, 'not-fields.mdx');
  t.after(() => fs.rmSync(file));

  for (const frontmatter of ['title T', '- title: T']) {
    fs.writeFileSync(file, `---\n${frontmatter}\n---\n\nbody\n`);
    assert.throws(() => getNotes(), {
      message: 'src/notes/not-fields.mdx: frontmatter needs fields as key: value',
    });
  }
});

test('getNotes names the file and its line when the frontmatter is not valid YAML', (t) => {
  writeNote('duplicate', '2024-06-01', 'draft: true\ndraft: false\n');
  t.after(() => fs.rmSync(path.join(notesDir, 'duplicate.mdx')));

  assert.throws(() => getNotes(), {
    message: /^src\/notes\/duplicate\.mdx: duplicated mapping key \(7:1\)\n/,
  });
});

test('getNotes names the file when the frontmatter holds a second YAML document', (t) => {
  writeNote('two-documents', '2024-07-01', '--- # second\n');
  t.after(() => fs.rmSync(path.join(notesDir, 'two-documents.mdx')));

  assert.throws(() => getNotes(), {
    message:
      'src/notes/two-documents.mdx: expected a single document in the stream, but found more',
  });
});

test('getNotes rejects a misspelled draft field even in production', (t) => {
  process.env.VERCEL_ENV = 'production';
  t.after(() => {
    delete process.env.VERCEL_ENV;
    fs.rmSync(path.join(notesDir, 'misspelled.mdx'));
  });

  for (const field of ['Draft', 'drfat']) {
    writeNote('misspelled', '2024-05-01', `${field}: true\n`);
    assert.throws(() => getNotes(), {
      message: `src/notes/misspelled.mdx: frontmatter has an unknown field ${field}`,
    });
  }
});

const source = [
  'import { other } from "./other";',
  '// #region backward',
  'export class Value {',
  '  html = "<b>&</b>";',
  '',
  "  quote = 'it';",
  '}',
  '// #endregion',
  '// #region empty',
  '',
  '// #endregion',
  '// #region repeated',
  '// #endregion',
  '// #region repeated',
  '// #endregion',
  '// #region outer',
  '  // #region inner',
  '// #endregion',
  '// #region open',
  'export const open = 1;',
].join('\n');

function compileNote(t: TestContext, markdown: string) {
  const note = path.join(notesDir, 'x.mdx');
  const lib = path.join(root, 'src/lib');
  fs.mkdirSync(path.join(lib, 'ml'), { recursive: true });
  fs.writeFileSync(path.join(lib, 'ml/value.ts'), source);
  const frontmatter = 'title: x\ndescription: x\npublishedAt: 2024-01-01\ntags: [test]\n';
  fs.writeFileSync(note, `---\n${frontmatter}---\n\n${markdown}\n`);
  t.after(() => {
    fs.rmSync(note, { force: true });
    fs.rmSync(lib, { recursive: true, force: true });
  });
  return getNoteContent('x');
}

const fence = (meta: string, body = '') => `\`\`\`ts ${meta}\n${body}\`\`\``;

test('getNoteContent fails when an included region is missing', async (t) => {
  await assert.rejects(compileNote(t, fence('include=src/lib/ml/value.ts#nope')), {
    message: 'src/notes/x.mdx: src/lib/ml/value.ts has no region nope',
  });
});

async function codeText(t: TestContext, markdown: string) {
  const html = renderToStaticMarkup(createElement(MDXRemote, await compileNote(t, markdown)));
  const [, code = ''] = /<code[^>]*>([^<]*)<\/code>/.exec(html) ?? [];
  const entities: Record<string, string> = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#x27;': "'",
  };
  return code.replace(/&(lt|gt|amp|quot|#x27);/g, (entity) => entities[entity]);
}

const region = 'export class Value {\n  html = "<b>&</b>";\n\n  quote = \'it\';\n}\n';

test('an included block shows the lines of its region as they are in the file', async (t) => {
  assert.equal(await codeText(t, fence('include=src/lib/ml/value.ts#backward')), region);
});

test('an include takes any language, and a plain fence may mention includes', async (t) => {
  assert.equal(await codeText(t, '```c++ include=src/lib/ml/value.ts#backward\n```'), region);
  assert.equal(await codeText(t, '```ts title="includes.ts"\nconst x = 1;\n```'), 'const x = 1;\n');
});

test('getNoteContent names what is wrong with an include', async (t) => {
  const cases: [string, string][] = [
    [fence('include=src/lib/ml/gone.ts#backward'), 'src/lib/ml/gone.ts does not exist'],
    [fence('include=package.json#x'), 'package.json must be a file in src/'],
    [fence('include=../x.ts#x'), '../x.ts must be a file in src/'],
    [
      fence('include=src/lib/ml/value.ts#repeated'),
      'src/lib/ml/value.ts has region repeated twice',
    ],
    [
      fence('include=src/lib/ml/value.ts#outer'),
      'src/lib/ml/value.ts starts a region inside region outer',
    ],
    [fence('include=src/lib/ml/value.ts#open'), 'src/lib/ml/value.ts never ends region open'],
    [
      fence('include=src/lib/ml/value.ts#backward', 'copy\n'),
      'the include=src/lib/ml/value.ts#backward block must be empty, because the build fills it',
    ],
  ];
  for (const [markdown, message] of cases) {
    await assert.rejects(compileNote(t, markdown), { message: `src/notes/x.mdx: ${message}` });
  }
});

test('getNoteContent rejects a fence that mentions include in any other form', async (t) => {
  const fences = [
    'include=src/lib/ml/value.ts#backward',
    'ts title="value.ts" include=src/lib/ml/value.ts#backward',
    'ts Include=src/lib/ml/value.ts#backward',
    'ts include=src/lib/ml/value.ts',
  ];
  for (const info of fences) {
    await assert.rejects(compileNote(t, `\`\`\`${info}\n\`\`\``), {
      message: `src/notes/x.mdx: \`\`\`${info} needs a language and only include=<file>#<region> after it, as \`\`\`ts include=src/lib/ml/value.ts#backward`,
    });
  }
});

test('getNoteContent rejects a code block that is empty after the build fills it', async (t) => {
  const blocks = [fence('include=src/lib/ml/value.ts#empty'), '```ts\n```', '```\n\n```'];
  for (const markdown of blocks) {
    await assert.rejects(compileNote(t, markdown), {
      message: 'src/notes/x.mdx: the code block at line 8 is empty',
    });
  }
});

test('getNoteContent names the note and the line in it when the MDX does not parse', async (t) => {
  await assert.rejects(compileNote(t, 'first\n\n<div>\n\nlast'), {
    message: /^src\/notes\/x\.mdx: [\s\S]*Expected a closing tag for `<div>` \(10:1-10:6\)/,
  });
});

test('getNoteContent names an image that is not in public/', async (t) => {
  await assert.rejects(compileNote(t, '![a](/images/notes/x/missing.jpg)'), {
    message: 'src/notes/x.mdx: /images/notes/x/missing.jpg is not in public/',
  });
});

test("part 1's glossary holds exactly the terms the design doc lists for part 1", () => {
  const repo = new URL('../../', import.meta.url);
  const design = fs.readFileSync(new URL('docs/ai-series/design.md', repo), 'utf8');
  const part1 = design.slice(design.indexOf('### 1. how a machine learns'));
  const [, listed = ''] = /^Terms, in the order the note meets them: (.+)\.$/m.exec(part1) ?? [];
  const note = fs.readFileSync(new URL('src/notes/how-a-machine-learns.mdx', repo), 'utf8');
  const [glossary = ''] = /<Glossary>[\s\S]*<\/Glossary>/.exec(note) ?? [];
  const terms = [...glossary.matchAll(/<Term name="([^"]+)">/g)].map(([, name]) => name);

  assert.deepEqual(terms.toSorted(), listed.split(', ').toSorted());
});

test('seriesParts orders all four titles and links only published parts', (t) => {
  writeNote('first', '2024-08-01', 'series: ai\npart: 1\n');
  writeNote('second', '2024-08-02', 'series: ai\npart: 2\n');
  writeNote('third', '2024-08-03', 'series: ai\npart: 3\ndraft: true\n');
  t.after(() => {
    for (const slug of ['first', 'second', 'third']) fs.rmSync(path.join(notesDir, `${slug}.mdx`));
    delete process.env.VERCEL_ENV;
  });
  for (const env of ['preview', 'production']) {
    process.env.VERCEL_ENV = env;
    assert.deepEqual(seriesParts('ai'), [
      { part: 1, title: 'How a machine learns', slug: 'first' },
      { part: 2, title: 'Words as numbers', slug: 'second' },
      { part: 3, title: 'Paying attention', slug: null },
      { part: 4, title: 'A tiny GPT, trained in your browser', slug: null },
    ]);
  }
});

test('duplicate series parts name both files, including hidden drafts', (t) => {
  writeNote('duplicate-first', '2024-08-01', 'series: ai\npart: 1\n');
  writeNote('duplicate-second', '2024-08-02', 'series: ai\npart: 1\ndraft: true\n');
  process.env.VERCEL_ENV = 'production';
  t.after(() => {
    for (const slug of ['duplicate-first', 'duplicate-second'])
      fs.rmSync(path.join(notesDir, `${slug}.mdx`));
    delete process.env.VERCEL_ENV;
  });
  assert.throws(() => seriesParts('ai'), {
    message:
      'src/notes/duplicate-first.mdx and src/notes/duplicate-second.mdx: duplicate ai part 1',
  });
});

test('series membership requires a supported series and an in-range integer part', (t) => {
  t.after(() => fs.rmSync(path.join(notesDir, 'bad-series.mdx')));
  for (const extra of [
    'series: ai',
    'part: 1',
    'series: other\npart: 1',
    'series: ai\npart: 0',
    'series: ai\npart: 5',
    'series: ai\npart: 1.5',
    'series: ai\npart: "2"',
  ]) {
    writeNote('bad-series', '2024-08-01', `${extra}\n`);
    assert.throws(() => getNotes(), /src\/notes\/bad-series.mdx: frontmatter needs/);
  }
});
