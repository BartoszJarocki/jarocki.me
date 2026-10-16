import assert from 'node:assert/strict';
import { test } from 'node:test';

import { menus } from '../demos/tokenizerMenus.ts';
import { cutThreeWays, trainMenus } from './tokenizers.ts';

const shown = (cut: { pieces: { text: string; known: boolean }[] }) =>
  cut.pieces.map(({ text, known }) => (known ? text : `?${text}`)).join(' ');

test('trainMenus learns from words of letters and glues the commonest pair first', () => {
  const small = trainMenus('The cat sat on the mat.', 2);
  assert.deepEqual(small, {
    letters: ['a', 'c', 'e', 'h', 'm', 'n', 'o', 's', 't'],
    words: ['cat', 'mat', 'on', 'sat', 'the'],
    merges: [
      ['a', 't'],
      ['t', 'h'],
    ],
  });
});

test('trainMenus keeps gluing until no pair sits side by side twice', () => {
  assert.deepEqual(trainMenus('banana banana bandana', 10).merges, [
    ['a', 'n'],
    ['b', 'an'],
    ['an', 'a'],
    ['ban', 'ana'],
  ]);
});

test('a character outside the basic plane stays one piece', () => {
  assert.deepEqual(trainMenus('𐐷𐐷 𐐷𐐷', 1), {
    letters: ['𐐷'],
    words: ['𐐷𐐷'],
    merges: [['𐐷', '𐐷']],
  });
  assert.equal(shown(cutThreeWays('a😀b 𐐷', trainMenus('ab 𐐷𐐷', 0)).letters), 'a ?😀 b 𐐷');
});

test('cutThreeWays marks the pieces each menu does not have', () => {
  const cut = cutThreeWays('The bat!', trainMenus('The cat sat on the mat.', 2));
  assert.equal(shown(cut.letters), 't h e ?b a t ?!');
  assert.equal(shown(cut.words), 'the ?bat ?!');
  assert.equal(shown(cut.pieces), 'th e ?b at ?!');
  assert.deepEqual([cut.letters.menu, cut.words.menu, cut.pieces.menu], [9, 5, 11]);
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
