import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'notes-test-'));
const notesDir = path.join(root, 'src/notes');
fs.mkdirSync(notesDir, { recursive: true });
process.chdir(root);
after(() => fs.rmSync(root, { recursive: true, force: true }));

const { getNotes } = await import('./notes.ts');

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
