const symbols = '.abcdefghijklmnopqrstuvwxyz';

function countPairs(names) {
  const counts = [];
  for (let i = 0; i < symbols.length; i++) {
    counts.push(Array(symbols.length).fill(1));
  }
  counts[0][0] = 0;
  for (const name of names) {
    if (!name) continue;
    const letters = '.' + name + '.';
    for (let i = 1; i < letters.length; i++) {
      const before = symbols.indexOf(letters[i - 1]);
      const next = symbols.indexOf(letters[i]);
      counts[before][next] += 1;
    }
  }
  return counts;
}

const counts = countPairs(['emma', 'ella', 'anna']);
console.log('Start then e:', counts[0][5]);
console.log('m then m:', counts[13][13]);
console.log('a then end:', counts[1][0]);
