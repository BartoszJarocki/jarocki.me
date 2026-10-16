function softmax(scores) {
  const biggest = Math.max(...scores);
  const sides = scores.map((score) =>
    Math.exp(score - biggest),
  );
  let total = 0;
  for (const share of sides) total += share;
  return sides.map((share) => share / total);
}

function oneLetterLoss(scores, pairs) {
  const grad = [];
  for (const row of scores)
    grad.push(Array(row.length).fill(0));
  let loss = 0;
  for (const [before, next] of pairs) {
    const chances = softmax(scores[before]);
    loss -= Math.log(chances[next]) / pairs.length;
    for (let j = 0; j < chances.length; j++) {
      let slope = chances[j];
      if (j === next) slope -= 1;
      grad[before][j] += slope / pairs.length;
    }
  }
  return { loss, grad };
}

const scores = [];
for (let i = 0; i < 27; i++) scores.push(Array(27).fill(0));
// The pairs in ".anna.": dot = 0, a = 1, n = 14.
const pairs = [
  [0, 1],
  [1, 14],
  [14, 14],
  [14, 1],
  [1, 0],
];
for (let i = 0; i <= 20; i++) {
  const { loss, grad } = oneLetterLoss(scores, pairs);
  if (i % 10 === 0) {
    console.log('Step', i, 'loss:', loss.toFixed(2));
  }
  for (let t = 0; t < scores.length; t++) {
    for (let j = 0; j < scores[t].length; j++) {
      scores[t][j] -= grad[t][j];
    }
  }
}
