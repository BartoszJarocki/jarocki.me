function softmax(scores) {
  const biggest = Math.max(...scores);
  const sides = scores.map((score) => Math.exp(score - biggest));
  const total = sides.reduce((sum, side) => sum + side, 0);
  return sides.map((side) => side / total);
}
console.log(
  'Chances:',
  softmax([-1, 0, 1])
    .map((p) => p.toFixed(6))
    .join(', '),
);
console.log(
  'Same after adding 1000:',
  softmax([999, 1000, 1001])
    .map((p) => p.toFixed(6))
    .join(', '),
);
