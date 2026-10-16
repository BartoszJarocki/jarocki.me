function neuron(inputs, knobs, squash) {
  let sum = knobs.bias;
  for (let i = 0; i < inputs.length; i++) {
    sum += knobs.weights[i] * inputs[i];
  }
  if (squash) return Math.tanh(sum);
  return sum;
}

function forward(inputs, layers) {
  let numbers = inputs;
  for (let i = 0; i < layers.length; i++) {
    const next = [];
    const squash = i < layers.length - 1;
    for (const knobs of layers[i]) {
      next.push(neuron(numbers, knobs, squash));
    }
    numbers = next;
  }
  return numbers;
}

const layers = [
  [
    { weights: [1, -1], bias: 0 },
    { weights: [0.5, 0.5], bias: -0.5 },
  ],
  [{ weights: [2, -1], bias: 0.1 }],
];
const [score] = forward([0.2, 0.8], layers);
const chance = 1 / (1 + Math.exp(-score));
console.log('Score:', score.toFixed(2));
console.log('Chance of yes:', chance.toFixed(2));
