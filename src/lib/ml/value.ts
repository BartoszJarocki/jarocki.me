// #region backward
export class Value {
  data: number;
  grad = 0;
  inputs: [Value, number][];

  constructor(data: number, inputs: [Value, number][] = []) {
    this.data = data;
    this.inputs = inputs;
  }

  add(other: Value | number) {
    const that = other instanceof Value ? other : new Value(other);
    return new Value(this.data + that.data, [
      [this, 1],
      [that, 1],
    ]);
  }

  mul(other: Value | number) {
    const that = other instanceof Value ? other : new Value(other);
    return new Value(this.data * that.data, [
      [this, that.data],
      [that, this.data],
    ]);
  }

  pow(n: number) {
    const slope = n === 0 ? 0 : n * this.data ** (n - 1);
    return new Value(this.data ** n, [[this, slope]]);
  }

  exp() {
    const e = Math.exp(this.data);
    return new Value(e, [[this, e]]);
  }

  log() {
    return new Value(Math.log(this.data), [[this, 1 / this.data]]);
  }

  tanh() {
    const t = Math.tanh(this.data);
    return new Value(t, [[this, 1 - t * t]]);
  }

  relu() {
    const slope = this.data > 0 ? 1 : 0;
    return new Value(Math.max(this.data, 0), [[this, slope]]);
  }

  backward() {
    const order: Value[] = [];
    const seen = new Set<Value>();
    const visit = (node: Value) => {
      if (seen.has(node)) return;
      seen.add(node);
      for (const [input] of node.inputs) visit(input);
      order.push(node);
    };
    visit(this);
    for (const node of order) node.grad = 0;
    this.grad = 1;
    for (const node of order.reverse()) {
      for (const [input, slope] of node.inputs) {
        input.grad += slope * node.grad;
      }
    }
  }
}
// #endregion
