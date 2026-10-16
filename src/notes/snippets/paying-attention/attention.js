function dot(a, b) {
  return a.reduce((sum, x, i) => sum + x * b[i], 0);
}
function softmax(scores) {
  const sides = scores.map((s) => Math.exp(s - Math.max(...scores)));
  return sides.map((s) => s / sides.reduce((sum, x) => sum + x, 0));
}
function attention(queries, keys, values) {
  const weights = queries.map((query, t) =>
    softmax(keys.slice(0, t + 1).map((key) => dot(query, key) / Math.sqrt(query.length))),
  );
  const found = weights.map((row) =>
    values[0].map((_, i) => row.reduce((sum, weight, s) => sum + weight * values[s][i], 0)),
  );
  return { weights, found };
}
const queries = [
  [1, 0],
  [0, 1],
  [1, 1],
];
const keys = [
  [1, 0],
  [0, 1],
  [1, -1],
];
const values = [
  [2, 0],
  [0, 4],
  [1, 1],
];
const result = attention(queries, keys, values);
console.log('Last weights:', result.weights[2].map((x) => x.toFixed(6)).join(', '));
console.log('Last mix:', result.found[2].map((x) => x.toFixed(6)).join(', '));
