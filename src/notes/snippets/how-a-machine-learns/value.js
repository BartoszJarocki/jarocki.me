function value(data, inputs = []) {
  return { data, grad: 0, inputs };
}
function add(a, b) {
  return value(a.data + b.data, [
    [a, 1],
    [b, 1],
  ]);
}
function multiply(a, b) {
  return value(a.data * b.data, [
    [a, b.data],
    [b, a.data],
  ]);
}
function backward(loss) {
  const order = [];
  function visit(node) {
    if (order.includes(node)) return;
    for (const [input] of node.inputs) visit(input);
    order.push(node);
  }
  visit(loss);
  for (const node of order) node.grad = 0;
  loss.grad = 1;
  for (const node of order.reverse()) {
    for (const [input, slope] of node.inputs) input.grad += slope * node.grad;
  }
}
const fee = value(2);
const price = value(2.5);
const guess = add(fee, multiply(value(0.3), price));
const miss = add(guess, value(-6.25));
const loss = multiply(miss, miss);
backward(loss);
console.log('Loss:', loss.data);
console.log('Fee slope:', fee.grad);
console.log('Price slope:', price.grad);
