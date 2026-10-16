function attention(queries, keys, values) {
  const weights = [];
  const found = [];
  for (let t = 0; t < queries.length; t++) {
    const query = queries[t];
    const scores = [];
    for (let j = 0; j <= t; j++) {
      let match = 0;
      for (let i = 0; i < query.length; i++) {
        match += query[i] * keys[j][i];
      }
      scores.push(match / Math.sqrt(query.length));
    }
    const biggest = Math.max(...scores);
    const sides = [];
    let total = 0;
    for (const score of scores) {
      const share = Math.exp(score - biggest);
      sides.push(share);
      total += share;
    }
    const chances = sides.map((share) => share / total);
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
const keys = queries;
const values = [
  [2, 0],
  [1, 1],
];
const { weights, found } = attention(queries, keys, values);
const shares = weights[1].map((share) => share.toFixed(2));
const mix = found[1].map((number) => number.toFixed(2));
console.log('Last weights:', shares.join(', '));
console.log('Last mix:', mix.join(', '));
