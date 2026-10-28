import assert from 'node:assert/strict';
import { test } from 'node:test';

import { type Block, literal, lowered, renderText } from './textPage.ts';

const page: Block[] = [
  { kind: 'header', current: 'notes' },
  {
    kind: 'section',
    label: 'notes',
    more: [literal('/notes', 'faint')],
    rows: [
      {
        lead: [lowered('2024.01.01', 'faint')],
        main: [lowered('Short')],
        trail: [literal('/notes/short', 'faint')],
      },
      {
        lead: [lowered('2024.01.02', 'faint')],
        main: [lowered('A title long enough that it cannot share its line with the trail')],
        trail: [literal('/notes/long', 'faint')],
      },
    ],
  },
  {
    kind: 'paragraph',
    runs: [
      lowered('A paragraph with '),
      lowered('strong words', 'strong'),
      lowered(', '),
      lowered('emphasis', 'em'),
      lowered(', and a link'),
      literal('\u00a0[1]', 'faint'),
      lowered(' that runs past the seventy-two column measure.'),
    ],
  },
];

const text = `
  Bartosz Jarocki                                           notes  work  about
  ────────────────────────────────────────────────────────────────────────────

  notes                                                                 /notes
  2024.01.01   short                                              /notes/short
  2024.01.02   a title long enough that it cannot share its line with the
               trail
               /notes/long

  a paragraph with strong words, emphasis, and a link [1] that runs past
  the seventy-two column measure.

`;

test("a page renders as 80-column text, with styles that never change a line's width", () => {
  assert.equal(renderText(page).replace(/\x1b\[\d+m/g, ''), text);
});

test('tones become ANSI styles', () => {
  const ansi = renderText(page);
  assert.equal(
    ansi.split('\n')[1],
    `  \x1b[1mBartosz Jarocki\x1b[0m${' '.repeat(43)}\x1b[4mnotes\x1b[0m  \x1b[2mwork\x1b[0m  \x1b[2mabout\x1b[0m`,
  );
  assert.match(ansi, /with \x1b\[1mstrong words\x1b\[0m, \x1b\[3memphasis\x1b\[0m,/);
});

test('a row whose main wraps and whose trail is empty ends at its last word', () => {
  const blocks: Block[] = [
    {
      kind: 'section',
      rows: [
        {
          lead: [lowered('Title')],
          main: [lowered('A description long enough that it has to wrap onto a second line')],
          trail: [],
        },
        { lead: [lowered('Next')], main: [lowered('Row')] },
      ],
    },
  ];
  assert.equal(
    renderText(blocks).replace(/\x1b\[\d+m/g, ''),
    `
  title        a description long enough that it has to wrap onto a second
               line
  next         row

`,
  );
});

test('a demo shows its label and description in an index row, then where to try it', () => {
  const blocks: Block[] = [
    {
      kind: 'demo',
      label: 'Train a tiny GPT on Shakespeare',
      blocks: [
        {
          kind: 'paragraph',
          runs: [
            lowered(
              'The practice and exam losses fall as a small model learns from lowercase Shakespeare.',
              'body',
            ),
          ],
        },
      ],
      href: 'https://jarocki.me/notes/a-tiny-gpt',
    },
  ];
  assert.equal(
    renderText(blocks),
    `
  \x1b[2mdemo         \x1b[0mtrain a tiny gpt on shakespeare.
               the practice and exam losses fall as a small model learns from
               lowercase shakespeare.
               \x1b[2mtry it at https://jarocki.me/notes/a-tiny-gpt\x1b[0m

`,
  );
});
