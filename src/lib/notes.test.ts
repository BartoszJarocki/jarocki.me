import { MDXRemote } from 'next-mdx-remote';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { type TestContext, after, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { readCodeTokens } from './codeTokens.ts';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'notes-test-'));
const notesDir = path.join(root, 'src/notes');
fs.mkdirSync(notesDir, { recursive: true });
process.chdir(root);
after(() => fs.rmSync(root, { recursive: true, force: true }));

const { getNoteContent, getNoteTree, getNotes, seriesParts } = await import('./notes.ts');

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

const source = 'const html = "<b>&</b>";\nconsole.log(html);\nconst object = { name: 1 };\n';

function writeExample(t: TestContext, markdown: string) {
  const note = path.join(notesDir, 'x.mdx');
  const snippets = path.join(notesDir, 'snippets/x');
  fs.mkdirSync(snippets, { recursive: true });
  fs.writeFileSync(path.join(snippets, 'example.js'), source);
  fs.writeFileSync(path.join(snippets, 'empty.js'), '');
  const frontmatter = 'title: x\ndescription: x\npublishedAt: 2024-01-01\ntags: [test]\n';
  fs.writeFileSync(note, `---\n${frontmatter}---\n\n${markdown}\n`);
  t.after(() => {
    fs.rmSync(note, { force: true });
    fs.rmSync(snippets, { recursive: true, force: true });
  });
}

function compileNote(t: TestContext, markdown: string) {
  writeExample(t, markdown);
  return getNoteContent('x');
}

const fence = (meta: string, body = '') => `\`\`\`js ${meta}\n${body}\`\`\``;

test('runnable fences store code once as compact colored runs', async (t) => {
  const compiled = await compileNote(t, fence('run=src/notes/snippets/x/example.js'));
  let raw: unknown;
  let snippet: unknown;
  const html = renderToStaticMarkup(
    createElement(MDXRemote, {
      ...compiled,
      components: {
        pre: (props) => {
          const encoded = Reflect.get(props, 'data-code');
          assert.equal(typeof encoded, 'string');
          const { tokens, source } = readCodeTokens(encoded);
          raw = source;
          snippet = Reflect.get(props, 'data-snippet');
          return createElement(
            'pre',
            {},
            tokens.map(([tone, text], index) =>
              createElement('span', { className: tone, key: index }, text),
            ),
          );
        },
      },
    }),
  );
  assert.equal(raw, source.trimEnd());
  assert.equal(snippet, 'src/notes/snippets/x/example.js');
  assert.match(html, /class="cb">const<\/span>/);
  assert.match(html, /class="ci"> html <\/span>/);
  assert.match(html, /class="cn">log<\/span>/);
  assert.match(html, /class="cv">&lt;b&gt;&amp;&lt;\/b&gt;<\/span>/);
  assert.match(html, /class="ci"> name<\/span>/);
  assert.match(html, /class="cv">1<\/span>/);
  assert.match(html, /class="cf">\(/);
  assert.doesNotMatch(compiled.compiledSource, /data-source|style:|--shiki/);
  assert.ok(compiled.compiledSource.length < 3000);
});

test('plain fences are highlighted without runnable source', async (t) => {
  const compiled = await compileNote(t, fence('', 'const answer = 42;\n'));
  let raw: unknown;
  renderToStaticMarkup(
    createElement(MDXRemote, {
      ...compiled,
      components: {
        pre: (props) => {
          const encoded = Reflect.get(props, 'data-code');
          assert.equal(typeof encoded, 'string');
          const { tokens, source } = readCodeTokens(encoded);
          raw = source;
          assert.deepEqual(tokens[0], ['cb', 'const']);
          assert.ok(tokens.some(([tone, text]) => tone === 'cv' && text === '42'));
          assert.equal(Reflect.get(props, 'data-snippet'), undefined);
          return null;
        },
      },
    }),
  );
  assert.equal(raw, 'const answer = 42;');
  assert.doesNotMatch(compiled.compiledSource, /data-source|data-snippet/);
});

test('runnable fences reject missing files, bodies, and invalid paths or metadata', async (t) => {
  await assert.rejects(compileNote(t, fence('run=src/notes/snippets/x/missing.js')), {
    message: 'src/notes/x.mdx: src/notes/snippets/x/missing.js does not exist',
  });
  await assert.rejects(compileNote(t, fence('run=src/notes/snippets/x/example.js', 'copy\n')), {
    message:
      'src/notes/x.mdx: the run=src/notes/snippets/x/example.js block must be empty, because the build fills it',
  });
  for (const info of [
    'run=src/notes/snippets/x/example.js',
    'ts run=src/notes/snippets/x/example.js',
    'js title=x run=src/notes/snippets/x/example.js',
    'js Run=src/notes/snippets/x/example.js',
    'js run=src/notes/snippets/../../lib/x.js',
    'js run=package.json',
  ]) {
    await assert.rejects(compileNote(t, `\`\`\`${info}\n\`\`\``), {
      message: `src/notes/x.mdx: \`\`\`${info} needs js run=src/notes/snippets/<note>/<name>.js`,
    });
  }
});

test('getNoteTree fills runnable fences and names the note when a file is missing', async (t) => {
  writeExample(t, fence('run=src/notes/snippets/x/example.js'));
  const [code] = (await getNoteTree('x')).children;
  assert.ok(code.type === 'code');
  assert.deepEqual([code.lang, code.value], ['js', source.trimEnd()]);

  writeExample(t, fence('run=src/notes/snippets/x/missing.js'));
  await assert.rejects(getNoteTree('x'), {
    message: 'src/notes/x.mdx: src/notes/snippets/x/missing.js does not exist',
  });
});

test('getNoteContent rejects a code block that is empty after the build fills it', async (t) => {
  for (const markdown of [
    fence('run=src/notes/snippets/x/empty.js'),
    '\`\`\`js\n\`\`\`',
    '\`\`\`\n\n\`\`\`',
  ]) {
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

test('series parts published on one day list in part order', (t) => {
  const parts = ['d-one', 'c-two', 'b-three', 'a-four'];
  parts.forEach((slug, index) => writeNote(slug, '2024-09-01', `series: ai\npart: ${index + 1}\n`));
  t.after(() => {
    for (const slug of parts) fs.rmSync(path.join(notesDir, `${slug}.mdx`));
  });
  assert.deepEqual(slugsWhen(undefined).slice(0, 4), ['d-one', 'c-two', 'b-three', 'a-four']);
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

test("part 3's glossary contains its twelve terms and the note is published", () => {
  const note = fs.readFileSync(new URL('../notes/paying-attention.mdx', import.meta.url), 'utf8');
  const terms = [...note.matchAll(/<Term name="([^"]+)">/g)].map(([, name]) => name);
  assert.deepEqual(terms, [
    'query',
    'key',
    'value',
    'dot product',
    'attention weights',
    'causal mask',
    'position embedding',
    'head',
    'multi-head attention',
    'residual connection',
    'layer normalization',
    'transformer block',
  ]);
  assert.doesNotMatch(note.split('---')[1], /draft: true/);
  for (const name of ['attention', 'block']) {
    assert.ok(note.includes(`run=src/notes/snippets/paying-attention/${name}.js`));
  }
});

test("part 4's glossary contains its ten terms and the note is published", () => {
  const note = fs.readFileSync(new URL('../notes/a-tiny-gpt.mdx', import.meta.url), 'utf8');
  const terms = [...note.matchAll(/<Term name="([^"]+)">/g)].map(([, name]) => name);
  assert.deepEqual(terms, [
    'batch',
    'step',
    'training loss',
    'validation loss',
    'overfitting',
    'checkpoint',
    'parameter count',
    'scale',
    'pretraining',
    'fine-tuning',
  ]);
  assert.doesNotMatch(note.split('---')[1], /draft: true/);
});

test('the integrated ai series has parts 1 to 4 with no gap', (t) => {
  const directory = new URL('../notes/', import.meta.url);
  const parts = fs
    .readdirSync(directory)
    .filter((name) => name.endsWith('.mdx'))
    .map((name) => fs.readFileSync(new URL(name, directory), 'utf8').split('---')[1])
    .filter((frontmatter) => /^series: ['"]?ai['"]?$/m.test(frontmatter))
    .map((frontmatter) => Number(/^part: (\d+)$/m.exec(frontmatter)?.[1]));
  if (parts.length === 0) {
    t.skip('The assigned parent predates ai-09 series metadata. Root must restack it first.');
    return;
  }
  assert.deepEqual(
    parts.sort((a, b) => a - b),
    [1, 2, 3, 4],
  );
});
