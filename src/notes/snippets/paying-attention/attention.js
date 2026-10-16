function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

function softmax(scores) {
  const biggest = Math.max(...scores);
  const sides = scores.map((s) => Math.exp(s - biggest));
  let total = 0;
  for (const side of sides) total += side;
  return sides.map((side) => side / total);
}

function attention(queries, keys, values) {
  const weights = [];
  const found = [];
  for (let t = 0; t < queries.length; t++) {
    const size = Math.sqrt(queries[t].length);
    const scores = [];
    for (let j = 0; j <= t; j++) {
      scores.push(dot(queries[t], keys[j]) / size);
    }
    const chances = softmax(scores);
    const mix = Array(values[0].length).fill(0);
    for (let j = 0; j <= t; j++) {
      for (let i = 0; i < mix.length; i++) {
        mix[i] += chances[j] * values[j][i];
      }
    }
    weights.push(chances);
    found.push(mix);
  }
  return { weights, found };
}

const queries = [
  [1, 0],
  [1, 1],
];
const values = [
  [2, 0],
  [1, 1],
];
const keys = queries;
const { weights, found } = attention(queries, keys, values);
const shares = weights[1].map((share) => share.toFixed(2));
const mix = found[1].map((number) => number.toFixed(2));
console.log('Last weights:', shares.join(', '));
console.log('Last mix:', mix.join(', '));
