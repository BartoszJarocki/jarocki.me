export type Value = {
  data: number;
  grad: number;
  inputs: [Value, number][];
};

export function value(data: number, inputs: [Value, number][] = []): Value {
  return { data, grad: 0, inputs };
}

export function add(left: Value, right: Value | number) {
  if (typeof right === 'number') right = value(right);
  return value(left.data + right.data, [
    [left, 1],
    [right, 1],
  ]);
}

export function multiply(left: Value, right: Value | number) {
  if (typeof right === 'number') right = value(right);
  return value(left.data * right.data, [
    [left, right.data],
    [right, left.data],
  ]);
}

export function pow(input: Value, exponent: number) {
  let slope = 0;
  if (exponent !== 0) slope = exponent * input.data ** (exponent - 1);
  return value(input.data ** exponent, [[input, slope]]);
}

export function exp(input: Value) {
  const result = Math.exp(input.data);
  return value(result, [[input, result]]);
}

export function log(input: Value) {
  return value(Math.log(input.data), [[input, 1 / input.data]]);
}

export function tanh(input: Value) {
  const result = Math.tanh(input.data);
  return value(result, [[input, 1 - result * result]]);
}

export function relu(input: Value) {
  let slope = 0;
  if (input.data > 0) slope = 1;
  return value(Math.max(input.data, 0), [[input, slope]]);
}

export function backward(loss: Value) {
  const order: Value[] = [];
  const seen = new Set<Value>();
  function visit(node: Value) {
    if (seen.has(node)) return;
    seen.add(node);
    for (const [input] of node.inputs) visit(input);
    order.push(node);
  }

  visit(loss);
  for (const node of order) node.grad = 0;
  loss.grad = 1;
  for (const node of order.reverse()) {
    for (const [input, slope] of node.inputs) {
      input.grad += slope * node.grad;
    }
  }
}
