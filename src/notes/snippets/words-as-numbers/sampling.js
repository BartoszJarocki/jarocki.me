const symbols = '.abcdefghijklmnopqrstuvwxyz';

function chances(counts, row, temperature = 1) {
  const sides = [];
  let total = 0;
  for (const count of counts[row]) {
    const share = count ** (1 / temperature);
    sides.push(share);
    total += share;
  }
  return sides.map((share) => share / total);
}

function sampleName(counts, temperature, random) {
  let name = '';
  let row = 0;
  while (true) {
    const shares = chances(counts, row, temperature);
    let roll = random();
    let next = 0;
    while (
      next < symbols.length - 1 &&
      roll >= shares[next]
    ) {
      roll -= shares[next];
      next++;
    }
    if (next === 0) return name;
    name += symbols[next];
    row = next;
  }
}

const counts = [];
for (let i = 0; i < symbols.length; i++) {
  counts.push(Array(symbols.length).fill(1));
}
counts[0][0] = 0;
const letters = '.anna.';
for (let i = 1; i < letters.length; i++) {
  const before = symbols.indexOf(letters[i - 1]);
  const next = symbols.indexOf(letters[i]);
  counts[before][next] += 1;
}
const rolls = [0.02, 0.5, 0.5, 0.05, 0];
let turn = 0;
const name = sampleName(counts, 1, () => rolls[turn++]);
const chance = chances(counts, 1)[14];
console.log('Name:', name);
console.log('Chance of n after a:', chance.toFixed(2));
