const symbols = '.abcdefghijklmnopqrstuvwxyz';
function chances(counts, row, temperature = 1) {
  const sides = counts[row].map((count) => count ** (1 / temperature));
  const total = sides.reduce((sum, side) => sum + side, 0);
  return sides.map((side) => side / total);
}
function sampleName(counts, temperature, random) {
  let name = '',
    row = 0;
  while (true) {
    const odds = chances(counts, row, temperature);
    let roll = random(),
      next = 0;
    while (next < symbols.length - 1 && roll >= odds[next]) roll -= odds[next++];
    if (next === 0) return name;
    name += symbols[next];
    row = next;
  }
}
// Start with one count per pair, then count the name "anna".
const counts = Array.from({ length: 27 }, () => Array(27).fill(1));
counts[0][0] = 0;
for (const [a, b] of [
  [0, 1],
  [1, 14],
  [14, 14],
  [14, 1],
  [1, 0],
])
  counts[a][b]++;
// Fixed rolls make the result repeatable. Try changing one.
const rolls = [0.02, 0.5, 0.5, 0.05, 0];
let turn = 0;
console.log(
  'Name:',
  sampleName(counts, 1, () => rolls[turn++]),
);
console.log('Chance of n after a:', chances(counts, 1)[14].toFixed(6));
