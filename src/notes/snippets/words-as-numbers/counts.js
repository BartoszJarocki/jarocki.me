const symbols = '.abcdefghijklmnopqrstuvwxyz';
function countPairs(names) {
  const counts = Array.from({ length: 27 }, () => Array(27).fill(1));
  counts[0][0] = 0;
  for (const name of names) {
    if (!name) continue;
    const ids = Array.from('.' + name + '.', (letter) => symbols.indexOf(letter));
    for (let i = 1; i < ids.length; i++) counts[ids[i - 1]][ids[i]] += 1;
  }
  return counts;
}
const counts = countPairs(['emma', 'ella', 'anna']);
console.log('Start then e:', counts[0][5]);
console.log('m then m:', counts[13][13]);
console.log('a then end:', counts[1][0]);
