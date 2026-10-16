function merge(parts, [left, right]) {
  const joined = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === left && parts[i + 1] === right) {
      joined.push(left + right);
      i++;
    } else {
      joined.push(parts[i]);
    }
  }
  return joined;
}

function tokenize(text, merges) {
  const lowercase = text.toLowerCase();
  const words = lowercase.match(/[a-z]+|[0-9]+|[^\s\w]/g);
  const letters = [];
  const pieces = [];
  for (const word of words ?? []) {
    letters.push(...word);
    let parts = [...word];
    for (const pair of merges) {
      parts = merge(parts, pair);
    }
    pieces.push(...parts);
  }
  return { letters, words: words ?? [], pieces };
}

const merges = [
  ['t', 'h'],
  ['th', 'e'],
];
const cuts = tokenize('the thin cat', merges);
console.log('Letters:', cuts.letters.join(' | '));
console.log('Words:', cuts.words.join(' | '));
console.log('Pieces:', cuts.pieces.join(' | '));
