function layer(input, weights, bias) {
  return bias.map((b, j) => input.reduce((sum, x, i) => sum + x * weights[i][j], b));
}
function threeLetterScores(before, knobs) {
  const input = before.flatMap((id) => knobs.places[id]);
  const hidden = layer(input, knobs.hiddenWeights, knobs.hiddenBias).map(Math.tanh);
  return layer(hidden, knobs.scoreWeights, knobs.scoreBias);
}
// Three numbers per letter, two hidden neurons, and 27 possible next letters.
const knobs = {
  places: Array.from({ length: 27 }, (_, i) => [i / 27, 0.1, -i / 27]),
  hiddenWeights: Array.from({ length: 9 }, () => [0.2, -0.1]),
  hiddenBias: [0, 0.1],
  scoreWeights: [Array(27).fill(0.3), Array.from({ length: 27 }, (_, i) => i / 27)],
  scoreBias: Array(27).fill(0),
};
const scores = threeLetterScores([1, 14, 14], knobs);
console.log('After ann, score for a:', scores[1].toFixed(6));
console.log('After ann, score for end:', scores[0].toFixed(6));
