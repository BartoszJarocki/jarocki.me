function neuron(inputs, knobs, squash) {
  const sum = knobs.weights.reduce((total, w, i) => total + w * inputs[i], knobs.bias);
  return squash ? Math.tanh(sum) : sum;
}
function forward(inputs, layers) {
  return layers.reduce(
    (numbers, layer, i) => layer.map((knobs) => neuron(numbers, knobs, i < layers.length - 1)),
    inputs,
  );
}
const layers = [
  [
    { weights: [1, -1], bias: 0 },
    { weights: [0.5, 0.5], bias: -0.5 },
  ],
  [{ weights: [2, -1], bias: 0.1 }],
];
const [score] = forward([0.2, 0.8], layers);
console.log('Score:', score.toFixed(6));
console.log('Chance:', (1 / (1 + Math.exp(-score))).toFixed(6));
