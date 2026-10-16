function merge(parts, [left, right]) {
  const joined = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === left && parts[i + 1] === right) joined.push(left + parts[++i]);
    else joined.push(parts[i]);
  }
  return joined;
}
function tokenize(text, merges) {
  const words = text.toLowerCase().match(/[a-z]+|[0-9]+|[^\s\w]/g) ?? [];
  return {
    letters: words.flatMap((word) => Array.from(word)),
    words,
    pieces: words.flatMap((word) => merges.reduce(merge, Array.from(word))),
  };
}
// A tiny menu of merges, already learned from repeated words.
const merges = [
  ['t', 'h'],
  ['th', 'e'],
];
const cuts = tokenize('the thin cat', merges);
console.log('Letters:', cuts.letters.join(' | '));
console.log('Words:', cuts.words.join(' | '));
console.log('Pieces:', cuts.pieces.join(' | '));
