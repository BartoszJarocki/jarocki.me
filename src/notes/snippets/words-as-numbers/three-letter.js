function layer(input, weights, bias) {
  const scores = [];
  for (let j = 0; j < bias.length; j++) {
    let sum = bias[j];
    for (let i = 0; i < input.length; i++) {
      sum += input[i] * weights[i][j];
    }
    scores.push(sum);
  }
  return scores;
}

function threeLetterScores(before, knobs) {
  const input = [];
  for (const letter of before) {
    input.push(...knobs.places[letter]);
  }
  const sums = layer(
    input,
    knobs.hiddenWeights,
    knobs.hiddenBias,
  );
  const hidden = sums.map(Math.tanh);
  return layer(hidden, knobs.scoreWeights, knobs.scoreBias);
}

const places = [];
const hiddenWeights = [];
const scoreWeights = [Array(27).fill(0.3), []];
for (let i = 0; i < 27; i++) {
  places.push([i / 27, 0.1, -i / 27]);
  scoreWeights[1].push(i / 27);
}
for (let i = 0; i < 9; i++) {
  hiddenWeights.push([(i + 1) / 10, -0.1]);
}
const knobs = {
  places,
  hiddenWeights,
  hiddenBias: [0, 0.1],
  scoreWeights,
  scoreBias: Array(27).fill(0),
};
const scores = threeLetterScores([1, 14, 14], knobs);
const letterScore = scores[1].toFixed(3);
const endScore = scores[0].toFixed(3);
console.log('After ann, score for a:', letterScore);
console.log('After ann, score for end:', endScore);
