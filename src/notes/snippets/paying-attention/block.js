function level(notebook) {
  let total = 0;
  for (const number of notebook) total += number;
  const mean = total / notebook.length;
  let spread = 0;
  for (const number of notebook) {
    spread += (number - mean) ** 2;
  }
  const variance = spread / notebook.length;
  const scale = Math.sqrt(variance + 1e-5);
  return notebook.map((number) => (number - mean) / scale);
}

function gelu(number) {
  const bend = number + 0.044715 * number ** 3;
  const squash = Math.tanh(Math.sqrt(2 / Math.PI) * bend);
  return 0.5 * number * (1 + squash);
}

function block(notebook) {
  const copy = level(notebook);
  // The first token reads only itself, with weight 1.
  const value = copy.map((number) => number * 0.25);
  const middle = [];
  for (let i = 0; i < notebook.length; i++) {
    const change = value[i] * 0.5;
    middle.push(notebook[i] + change);
  }
  const leveled = level(middle);
  const out = [];
  for (let i = 0; i < middle.length; i++) {
    const hidden = gelu(leveled[i] * 0.7);
    const change = hidden * 0.5;
    out.push(middle[i] + change);
  }
  return { middle, out };
}

const result = block([1, 2]);
const middle = result.middle.map((number) =>
  number.toFixed(2),
);
const out = result.out.map((number) => number.toFixed(2));
console.log('After attention:', middle.join(', '));
console.log('After network:', out.join(', '));
