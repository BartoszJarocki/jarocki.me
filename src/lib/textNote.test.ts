import type { Nodes, Root } from 'mdast';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

import { lowercase } from './lowercase.ts';
import { noteBlocks } from './textNote.ts';
import { renderText } from './textPage.ts';
import { notePage } from './textPages.ts';

process.chdir(fileURLToPath(new URL('../..', import.meta.url)));
const { getNoteTree, getNotes, seriesParts } = await import('./notes.ts');

const source = `Read [the notes](/notes), [them again](/notes), and [more](https://example.com).

<Glossary>
<Term name="Loss">How far off a **guess** is</Term>
</Glossary>

<TaxiFares label="Fares">The chart.</TaxiFares>

{/* a note to self */}
`;

test('a note numbers its links once each and replaces glossaries and demos', () => {
  const tree = unified().use(remarkParse).use(remarkMdx).parse(source);
  assert.equal(
    renderText(noteBlocks(tree, 'x')).replace(/\x1b\[\d+m/g, ''),
    `
  read the notes [1], them again [1], and more [2].

  words from this note
  loss         how far off a guess is

  demo         fares.
               the chart.
               try it at https://jarocki.me/notes/x

  links
  [1]          https://jarocki.me/notes
  [2]          https://example.com

`,
  );
});

test('a note with syntax that has no text form names the file and line', () => {
  const tree: Root = {
    type: 'root',
    children: [
      { type: 'paragraph', children: [{ type: 'text', value: 'fine' }] },
      {
        type: 'definition',
        identifier: 'x',
        url: '/x',
        position: { start: { line: 3, column: 1 }, end: { line: 3, column: 8 } },
      },
    ],
  };
  assert.throws(() => noteBlocks(tree, 'x'), {
    message: 'src/notes/x.mdx: definition has no text form at line 3',
  });
});

const words = (node: Nodes): string[] =>
  node.type === 'text'
    ? node.value.split(/\s+/).filter(Boolean)
    : 'children' in node
      ? node.children.flatMap(words)
      : [];

const codeLines = (node: Nodes): string[] =>
  node.type === 'code'
    ? node.value.split('\n').map((line) => `      ${line}`.trimEnd())
    : 'children' in node
      ? node.children.flatMap(codeLines)
      : [];

test('every note renders within 78 columns outside code and links, with no MDX left', async () => {
  const notes = getNotes();
  assert.ok(notes.length > 0);
  for (const [i, note] of notes.entries()) {
    const tree = await getNoteTree(note.slug);
    const code = new Set(codeLines(tree));
    const blocks = notePage({
      note,
      prose: noteBlocks(tree, note.slug),
      older: notes[i + 1],
      parts: note.series ? seriesParts(note.series) : [],
    });
    const text = renderText(blocks).replace(/\x1b\[\d+m/g, '');
    const wide = text
      .split('\n')
      .filter((line) => [...line].length > 78)
      .filter((line) => !code.has(line) && !/^ {2}\[\d+\] +https?:\/\/\S+$/.test(line));
    assert.deepEqual(wide, [], note.slug);
    assert.ok(text.includes(`\n  ${lowercase(note.title)}\n`), note.slug);
    assert.ok(text.includes(lowercase(words(tree).slice(0, 3).join(' '))), note.slug);
    assert.doesNotMatch(text, /<[A-Z]|\{\/\*/, note.slug);
  }
});
