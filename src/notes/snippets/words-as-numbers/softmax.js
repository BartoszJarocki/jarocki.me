function softmax(scores) {
  const biggest = Math.max(...scores);
  const sides = [];
  let total = 0;
  for (const score of scores) {
    const share = Math.exp(score - biggest);
    sides.push(share);
    total += share;
  }
  return sides.map((share) => share / total);
}

const chances = softmax([-1, 0, 1]);
const shifted = softmax([999, 1000, 1001]);
const percentages = chances.map((chance) =>
  Math.round(chance * 100),
);
const same = shifted.map((chance) =>
  Math.round(chance * 100),
);
console.log('Chances in %:', percentages.join(', '));
console.log('After adding 1000:', same.join(', '));
