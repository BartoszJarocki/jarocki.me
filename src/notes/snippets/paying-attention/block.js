function level(row) {
  const mean = row.reduce((sum, x) => sum + x, 0) / row.length;
  const variance = row.reduce((sum, x) => sum + (x - mean) ** 2, 0) / row.length;
  return row.map((x) => (x - mean) / Math.sqrt(variance + 1e-5));
}
function gelu(x) {
  return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
}
function attention(rows) {
  return rows.map((query, t) => {
    const seen = rows.slice(0, t + 1);
    const scores = seen.map(
      (key) => query.reduce((sum, q, i) => sum + q * key[i] * 0.5, 0) / Math.sqrt(query.length),
    );
    const sides = scores.map((score) => Math.exp(score - Math.max(...scores)));
    const total = sides.reduce((sum, x) => sum + x, 0);
    return query.map((_, i) =>
      seen.reduce((sum, row, s) => sum + (sides[s] / total) * row[i] * 0.25, 0),
    );
  });
}
function block(notebooks) {
  const found = attention(notebooks.map(level));
  const middle = notebooks.map((row, t) => row.map((x, i) => x + found[t][i] * 0.5));
  const out = middle.map((row) => {
    const change = level(row).map((x) => gelu(x * 0.7) * 0.5);
    return row.map((x, i) => x + change[i]);
  });
  return { middle, out };
}
// Fixed knobs keep both additions visible. Training would adjust them.
const result = block([
  [1, 2],
  [3, 1],
  [2, 4],
]);
console.log('After attention:', result.middle[2].map((x) => x.toFixed(6)).join(', '));
console.log('After network:', result.out[2].map((x) => x.toFixed(6)).join(', '));
