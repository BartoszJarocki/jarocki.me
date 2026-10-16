const symbols = '.abcdefghijklmnopqrstuvwxyz';
function countPairs(names) {
  const counts = Array.from({ length: 27 }, () => Array(27).fill(1));
  counts[0][0] = 0;
  for (const name of names) {
    if (!name) continue;
    const ids = Array.from('.' + name + '.', (letter) => symbols.indexOf(letter));
    for (let i = 1; i < ids.length; i++) counts[ids[i - 1]][ids[i]]++;
  }
  return counts;
}
function sampleName(counts, random) {
  let name = '',
    row = 0;
  while (true) {
    const total = counts[row].reduce((sum, n) => sum + n, 0);
    let roll = random(),
      next = 0;
    while (next < 26 && roll >= counts[row][next] / total) {
      roll -= counts[row][next++] / total;
    }
    if (next === 0) return name;
    name += symbols[next];
    row = next;
  }
}
const counts = countPairs(['emma', 'ella', 'anna']);
// Each three rolls pick two letters and an end dot.
const rolls = [0.1, 0.2, 0, 0.3, 0.4, 0, 0.5, 0.6, 0, 0.7, 0.8, 0, 0.9, 0.1, 0];
let turn = 0;
for (let i = 0; i < 10; i++) {
  console.log(sampleName(counts, () => rolls[turn++ % rolls.length]));
}
