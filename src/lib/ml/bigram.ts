import { encode, symbols } from './tokenizers.ts';

// #region counts
export const size = symbols.length;

export function countPairs(names: string[]) {
  const counts = new Uint32Array(size * size).fill(1);
  // A name has at least one letter, so the end dot never comes right after the start dot.
  counts[0] = 0;
  for (const name of names) {
    const ids = encode(name);
    for (let i = 1; i < ids.length; i++) {
      counts[ids[i - 1] * size + ids[i]] += 1;
    }
  }
  return counts;
}
// #endregion

// #region sample
export function chances(counts: Uint32Array, row: number, temperature = 1) {
  const sides = Array.from(counts.subarray(row * size, (row + 1) * size), (count) =>
    Math.pow(count, 1 / temperature),
  );
  const total = sides.reduce((sum, side) => sum + side);
  return sides.map((side) => side / total);
}

export function sampleName(counts: Uint32Array, temperature: number, random = Math.random) {
  let name = '';
  let row = 0;
  while (true) {
    const odds = chances(counts, row, temperature);
    let roll = random();
    let next = 0;
    while (next < size - 1 && roll >= odds[next]) {
      roll -= odds[next];
      next += 1;
    }
    if (next === 0) return name;
    name += symbols[next];
    row = next;
  }
}
// #endregion

export function averageLoss(counts: Uint32Array, names: string[]) {
  const surprise = Array.from(symbols, (_, row) => chances(counts, row).map((p) => -Math.log(p)));
  let total = 0;
  let pairs = 0;
  for (const name of names) {
    const ids = encode(name);
    for (let i = 1; i < ids.length; i++) {
      total += surprise[ids[i - 1]][ids[i]];
      pairs += 1;
    }
  }
  return total / pairs;
}

export function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
