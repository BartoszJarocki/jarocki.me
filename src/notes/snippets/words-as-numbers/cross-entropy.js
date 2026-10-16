function crossEntropy(chances, next) {
  return -Math.log(chances[next]);
}

function surpriseSlopes(chances, next) {
  const slopes = [...chances];
  slopes[next] -= 1;
  return slopes;
}

const chances = [0.1, 0.3, 0.6];
const surprise = crossEntropy(chances, 2);
const slopes = surpriseSlopes(chances, 2);
console.log('Surprise:', surprise.toFixed(2));
console.log('Score slopes:', slopes.join(', '));
