import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

import { demoData, note } from './demoData.ts';
import { nameCounts } from './nameCounts.ts';
import { example, sentence } from './tokenizerExample.ts';
import { menus } from './tokenizerMenus.ts';

const stale = (file: string) =>
  `${file} does not match the note and names.txt. ` +
  'Run `node src/lib/demos/writeData.ts` and commit what it writes.';

test('the committed demo data is what writeData.ts makes from the note and names.txt', () => {
  const fresh = demoData();
  assert.deepEqual(menus, fresh.menus, stale('src/lib/demos/tokenizerMenus.ts'));
  assert.deepEqual(
    { sentence, example },
    { sentence: fresh.sentence, example: fresh.example },
    stale('src/lib/demos/tokenizerExample.ts'),
  );
  assert.deepEqual(nameCounts, fresh.nameCounts, stale('src/lib/demos/nameCounts.ts'));
});

test('the note gives the sizes the menus have', () => {
  const text = fs.readFileSync(note, 'utf8');
  assert.deepEqual(menus.letters, Array.from('abcdefghijklmnopqrstuvwxyz'));
  assert.equal(menus.merges.length, 200);
  assert.equal(example.pieces.menu, 226);
  assert.ok(example.words.menu > example.pieces.menu, 'the note says words outnumber pieces');
  for (const claim of ['the 26 letters', 'It does that 200 times', '226 pieces']) {
    assert.ok(text.includes(claim), `${note} no longer says "${claim}"`);
  }
});

test('the example sentence keeps words the note never uses, and pieces cover them', () => {
  const offMenu = (row: keyof typeof example) =>
    example[row].pieces.filter((piece) => !piece.known).map((piece) => piece.text);
  assert.deepEqual(offMenu('words'), ['guessed', 'unbelievable', 'ending']);
  assert.deepEqual(offMenu('pieces'), []);
});
