function value(data, inputs = []) {
  return { data, grad: 0, inputs };
}

function add(left, right) {
  return value(left.data + right.data, [
    [left, 1],
    [right, 1],
  ]);
}

function multiply(left, right) {
  return value(left.data * right.data, [
    [left, right.data],
    [right, left.data],
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
    for (const [input, slope] of node.inputs) {
      input.grad += slope * node.grad;
    }
  }
}

const fee = value(2);
const price = value(2.5);
const charge = multiply(value(0.3), price);
const guess = add(fee, charge);
const miss = add(guess, value(-6.25));
const loss = multiply(miss, miss);
backward(loss);
console.log('Loss:', loss.data);
console.log('Fee slope:', fee.grad);
console.log('Price slope:', price.grad);
