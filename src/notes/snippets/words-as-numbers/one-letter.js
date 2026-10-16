function softmax(scores) {
  const sides = scores.map((score) => Math.exp(score - Math.max(...scores)));
  const total = sides.reduce((sum, side) => sum + side, 0);
  return sides.map((side) => side / total);
}
function oneLetterLoss(scores, pairs) {
  const grad = scores.map((row) => row.map(() => 0));
  let loss = 0;
  for (const [before, next] of pairs) {
    const chances = softmax(scores[before]);
    loss -= Math.log(chances[next]) / pairs.length;
    for (let j = 0; j < chances.length; j++) {
      grad[before][j] += (chances[j] - (j === next ? 1 : 0)) / pairs.length;
    }
  }
  return { loss, grad };
}
const scores = Array.from({ length: 27 }, () => Array(27).fill(0));
// The pairs in ".anna.", with dot = 0, a = 1, n = 14.
const pairs = [
  [0, 1],
  [1, 14],
  [14, 14],
  [14, 1],
  [1, 0],
];
for (let turn = 0; turn <= 20; turn++) {
  const { loss, grad } = oneLetterLoss(scores, pairs);
  if (turn % 10 === 0) console.log('Step', turn, 'loss:', loss.toFixed(6));
  scores.forEach((row, i) => row.forEach((score, j) => (scores[i][j] = score - grad[i][j])));
}
