import assert from 'node:assert/strict';
import { test } from 'node:test';

import { example, sentence } from '../demos/tokenizerExample.ts';
import { menus } from '../demos/tokenizerMenus.ts';
import { cutThreeWays, trainMenus } from './tokenizers.ts';

const shown = (cut: { pieces: { text: string; known: boolean }[] }) =>
  cut.pieces.map(({ text, known }) => (known ? text : `?${text}`)).join(' ');

test('trainMenus glues the pair that sits side by side most often first', () => {
  const small = trainMenus('The cat sat on the mat.', 2);
  assert.deepEqual(small, {
    letters: ['.', 'a', 'c', 'e', 'h', 'm', 'n', 'o', 's', 't'],
    words: ['.', 'cat', 'mat', 'on', 'sat', 'the'],
    merges: [
      ['a', 't'],
      ['t', 'h'],
    ],
  });
});

test('cutThreeWays marks the pieces each menu does not have', () => {
  const cut = cutThreeWays('The bat!', trainMenus('The cat sat on the mat.', 2));
  assert.equal(shown(cut.letters), 't h e ?b a t ?!');
  assert.equal(shown(cut.words), 'the ?bat ?!');
  assert.equal(shown(cut.pieces), 'th e ?b at ?!');
  assert.deepEqual([cut.letters.menu, cut.words.menu, cut.pieces.menu], [10, 6, 12]);
});

test('cutThreeWays keeps Polish letters whole, however they were typed', () => {
  const typed = 'zażółć gęślą jaźń';
  for (const text of [typed, typed.normalize('NFD')]) {
    assert.equal(
      shown(cutThreeWays(text, menus).letters),
      'z a ?ż ?ó ?ł ?ć g ?ę ?ś l ?ą j a ?ź ?ń',
    );
  }
});

test('the example the shell prints is the cut of its sentence', () => {
  assert.deepEqual(example, cutThreeWays(sentence, menus));
});
