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

function sampleName(counts, random) {
  let name = '';
  let row = 0;
  while (true) {
    let total = 0;
    for (const count of counts[row]) total += count;
    let roll = random();
    let next = 0;
    while (next < 26 && roll >= counts[row][next] / total) {
      const chance = counts[row][next] / total;
      roll -= chance;
      next++;
    }
    if (next === 0) return name;
    name += symbols[next];
    row = next;
  }
}

const counts = countPairs(['emma', 'ella', 'anna']);
const rolls = [0.1, 0.2, 0];
let turn = 0;
const name = sampleName(counts, () => rolls[turn++]);
console.log('Name:', name);
