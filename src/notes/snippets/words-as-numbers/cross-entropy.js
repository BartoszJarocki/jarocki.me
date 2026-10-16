function crossEntropy(chances, next) {
  return -Math.log(chances[next]);
}
function surpriseSlopes(chances, next) {
  return chances.map((chance, i) => chance - (i === next ? 1 : 0));
}
const chances = [0.1, 0.3, 0.6];
console.log('Surprise:', crossEntropy(chances, 2).toFixed(6));
console.log('Score slopes:', surpriseSlopes(chances, 2).join(', '));
