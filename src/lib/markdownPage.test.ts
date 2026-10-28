import type { Nodes } from 'mdast';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

import { renderMarkdown } from './markdownPage.ts';
import { type Block, type Run, literal, lowered } from './textPage.ts';
import { homePage } from './textPages.ts';

process.chdir(fileURLToPath(new URL('../..', import.meta.url)));
const { getNotes } = await import('./notes.ts');
const { pageBlocks, parseRequest } = await import('./pageRequest.ts');

const linked = (run: Run, href: string): Run => ({ ...run, href });
const paragraph = (...runs: Run[]): Block => ({ kind: 'paragraph', runs });

const page: Block[] = [
  { kind: 'header', current: 'notes' },
  { kind: 'title', runs: [lowered('Words as Numbers')] },
  paragraph(
    lowered('Some '),
    lowered('strong words', 'strong'),
    lowered(', '),
    lowered('emphasis', 'em'),
    lowered(', '),
    literal('code', 'code'),
    lowered(', and '),
    linked(lowered('a link'), 'https://example.com'),
    literal('\n'),
    lowered('on a second line.'),
  ),
  { kind: 'heading', runs: [lowered('A Heading')] },
  { kind: 'quote', blocks: [paragraph(lowered('A quote.'))] },
  {
    kind: 'list',
    ordered: true,
    items: [
      [paragraph(lowered('First'))],
      [paragraph(lowered('Second')), { kind: 'code', text: 'const x = 1;' }],
    ],
  },
  {
    kind: 'section',
    label: 'notes',
    more: [lowered('all 2', 'faint'), literal('  /notes', 'faint')],
    rows: [
      {
        lead: [lowered('2024.01.01', 'faint')],
        main: [lowered('Short')],
        trail: [literal('/notes/short', 'faint')],
        href: '/notes/short',
      },
      {
        lead: [lowered('Monito')],
        main: [lowered('AI QA engineer', 'body')],
        trail: [literal('monito.dev', 'faint')],
        href: 'https://monito.dev',
      },
      { lead: [lowered('Motion')], main: [lowered('Engineer')], trail: [lowered('2025', 'faint')] },
    ],
  },
  {
    kind: 'art',
    label: 'github',
    more: [literal('github.com/x', 'faint')],
    lines: [[literal('█ ')], [literal('▄█')]],
  },
  {
    kind: 'table',
    caption: [lowered('Sizes', 'faint')],
    columns: [[lowered('Model', 'faint')], [lowered('Parameters', 'faint')]],
    rows: [
      { header: [lowered('Ours')], cells: [[linked(lowered('30,055'), '/models/x.json')]] },
      { header: [lowered('A|B')], cells: [[lowered('Not reported')]] },
    ],
  },
  {
    kind: 'demo',
    label: 'Train a model',
    blocks: [paragraph(lowered('The loss falls.', 'body'))],
    href: 'https://jarocki.me/notes/x',
  },
  { kind: 'links' },
  { kind: 'curl', runs: [lowered('read a note: curl https://jarocki.me/notes/x', 'faint')] },
  { kind: 'section', rows: [{ lead: [], main: [lowered('← home', 'faint')], href: '/' }] },
  { kind: 'rule' },
];

const markdown = `[Bartosz Jarocki](https://jarocki.me/index.md) · [notes](https://jarocki.me/notes.md) · [work](https://jarocki.me/work.md) · [about](https://jarocki.me/about.md)

# Words as Numbers

Some **strong words**, *emphasis*, \`code\`, and [a link](https://example.com)\\
on a second line.

## A Heading

> A quote.

1. First
2. Second

   \`\`\`
   const x = 1;
   \`\`\`

## notes

all 2 /notes

- 2024.01.01 · [Short](https://jarocki.me/notes/short.md)
- Monito · [AI QA engineer](https://monito.dev)
- Motion · Engineer · 2025

## github

github.com/x

\`\`\`
█
▄█
\`\`\`

Sizes

| Model | Parameters |
| --- | --- |
| Ours | [30,055](https://jarocki.me/models/x.json) |
| A\\|B | Not reported |

> **Interactive demo: Train a model.** The loss falls.
>
> Try it at https://jarocki.me/notes/x

---

- [← home](https://jarocki.me/index.md)

---
`;

test('every block kind renders as markdown in its own case, and links and curl print nothing', () => {
  assert.equal(renderMarkdown(page), markdown);
});

const plain = (node: Nodes): string =>
  'value' in node ? node.value : 'children' in node ? node.children.map(plain).join('') : '';

test('text with markdown syntax in it parses back as written', () => {
  const written = [
    'Use *stars*, _underscores_, `ticks`, [brackets], <tags>, and a \\ backslash.',
    '404. Not a list.',
    '- Not a list either.',
    '# Not a heading.',
    '> Not a quote.',
  ];
  const output = renderMarkdown(written.map((text) => paragraph(lowered(text))));
  assert.equal(
    output,
    `Use \\*stars\\*, \\_underscores\\_, \\\`ticks\\\`, \\[brackets\\], \\<tags>, and a \\\\ backslash.

404\\. Not a list.

\\- Not a list either.

\\# Not a heading.

\\> Not a quote.
`,
  );
  const tree = unified().use(remarkParse).parse(output);
  assert.deepEqual(
    tree.children.map((node) => [node.type, plain(node)]),
    written.map((text) => ['paragraph', text]),
  );
});

test('a line break parses back as a break, and a table cell joins its lines', () => {
  const output = renderMarkdown([
    {
      kind: 'quote',
      blocks: [paragraph(lowered('A quote.', 'em'), literal('\n'), lowered('— Someone'))],
    },
    {
      kind: 'table',
      caption: [],
      columns: [[lowered('A')]],
      rows: [{ header: [lowered('one'), literal('\n'), lowered('two')], cells: [] }],
    },
  ]);
  assert.equal(output, '> *A quote.*\\\n> — Someone\n\n| A |\n| --- |\n| one two |\n');
  const [quote] = unified().use(remarkParse).parse(output).children;
  assert.deepEqual(
    quote.type === 'blockquote' && quote.children[0].type === 'paragraph'
      ? quote.children[0].children.map((node) => node.type)
      : [],
    ['emphasis', 'break', 'text'],
  );
});

test("every page renders the site's data as markdown, with titles as written and no curl hint", async () => {
  const notes = getNotes();
  const header =
    '[Bartosz Jarocki](https://jarocki.me/index.md) · [notes](https://jarocki.me/notes.md) · [work](https://jarocki.me/work.md) · [about](https://jarocki.me/about.md)';
  const check = (output: string, name: string) => {
    assert.equal(output.split('\n')[0], header, name);
    assert.match(output, /[^\n]\n$/, name);
    assert.doesNotMatch(output, /<[A-Z]|\{\/\*|\n\n\n/, name);
  };

  const days = Array.from({ length: 371 }, (_, i) => ({
    date: new Date(Date.UTC(2025, 9, 26 + i)).toISOString().slice(0, 10),
    count: i % 9,
  }));
  const home = renderMarkdown(homePage(notes, days));
  check(home, 'home');
  assert.doesNotMatch(home, /curl/);

  for (const path of ['/notes', '/work', '/about', '/notes/nope']) {
    check(renderMarkdown(await pageBlocks(parseRequest(path, notes), notes)), path);
  }
  for (const note of notes) {
    const route = parseRequest(`/notes/${note.slug}.md`, notes);
    const output = renderMarkdown(await pageBlocks(route, notes));
    check(output, note.slug);
    assert.ok(output.split('\n').includes(`# ${note.title}`), note.slug);
  }
});
