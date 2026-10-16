// A micrograd-style scalar autograd (one object per number) next to the same MLP on Float64Arrays.
// node src/micrograd.js: steps per second for 2-H-H-1 MLPs on 100 two-moons points.
import { rng, randn } from './gpt.js';

class Value {
  constructor(data, prev = []) {
    this.data = data;
    this.grad = 0;
    this.prev = prev;
    this.backwardFn = null;
  }
  add(o) {
    o = o instanceof Value ? o : new Value(o);
    const out = new Value(this.data + o.data, [this, o]);
    out.backwardFn = () => {
      this.grad += out.grad;
      o.grad += out.grad;
    };
    return out;
  }
  mul(o) {
    o = o instanceof Value ? o : new Value(o);
    const out = new Value(this.data * o.data, [this, o]);
    out.backwardFn = () => {
      this.grad += o.data * out.grad;
      o.grad += this.data * out.grad;
    };
    return out;
  }
  relu() {
    const out = new Value(this.data > 0 ? this.data : 0, [this]);
    out.backwardFn = () => {
      this.grad += (out.data > 0 ? 1 : 0) * out.grad;
    };
    return out;
  }
  backward() {
    const order = [];
    const seen = new Set();
    const visit = (v) => {
      if (seen.has(v)) return;
      seen.add(v);
      for (const c of v.prev) visit(c);
      order.push(v);
    };
    visit(this);
    this.grad = 1;
    for (let i = order.length - 1; i >= 0; i--) order[i].backwardFn?.();
    return order.length;
  }
}

function moons(n, rand) {
  const xs = [];
  const ys = [];
  for (let i = 0; i < n; i++) {
    const top = i < n / 2;
    const t = Math.PI * rand();
    xs.push([(top ? Math.cos(t) : 1 - Math.cos(t)) + 0.1 * randn(rand), (top ? Math.sin(t) : 0.5 - Math.sin(t)) + 0.1 * randn(rand)]);
    ys.push(top ? -1 : 1);
  }
  return { xs, ys };
}

function scalarMLP(sizes, rand) {
  const layers = sizes.slice(1).map((nout, l) =>
    Array.from({ length: nout }, () => ({
      w: Array.from({ length: sizes[l] }, () => new Value(rand() * 2 - 1)),
      b: new Value(0),
    })),
  );
  const params = layers.flat().flatMap((n) => [...n.w, n.b]);
  const call = (x) => {
    let h = x;
    layers.forEach((layer, l) => {
      h = layer.map((n) => {
        const act = n.w.reduce((s, w, i) => s.add(w.mul(h[i])), n.b);
        return l < layers.length - 1 ? act.relu() : act;
      });
    });
    return h[0];
  };
  return { params, call };
}

// micrograd's demo loss: mean max-margin plus L2, plain SGD with a decaying learning rate.
function scalarStep(mlp, data, k) {
  const scores = data.xs.map((x) => mlp.call(x));
  let loss = new Value(0);
  scores.forEach((s, i) => (loss = loss.add(s.mul(-data.ys[i]).add(1).relu())));
  loss = loss.mul(1 / scores.length);
  let reg = new Value(0);
  for (const p of mlp.params) reg = reg.add(p.mul(p));
  loss = loss.add(reg.mul(1e-4));
  for (const p of mlp.params) p.grad = 0;
  const nodes = loss.backward();
  const lr = 1 - (0.9 * k) / 100;
  for (const p of mlp.params) p.data -= lr * p.grad;
  const acc = scores.filter((s, i) => s.data > 0 === data.ys[i] > 0).length / scores.length;
  return { loss: loss.data, acc, nodes };
}

// The same network and loss on Float64Arrays, with the backward pass written out.
function arrayMLP(sizes, scalar) {
  const W = [];
  const Bs = [];
  let idx = 0;
  for (let l = 1; l < sizes.length; l++) {
    const w = new Float64Array(sizes[l - 1] * sizes[l]);
    const b = new Float64Array(sizes[l]);
    for (let o = 0; o < sizes[l]; o++) {
      for (let i = 0; i < sizes[l - 1]; i++) w[i * sizes[l] + o] = scalar.params[idx++].data;
      b[o] = scalar.params[idx++].data;
    }
    W.push(w);
    Bs.push(b);
  }
  return { sizes, W, Bs, dW: W.map((w) => new Float64Array(w.length)), dB: Bs.map((b) => new Float64Array(b.length)) };
}

function arrayStep(m, data, k) {
  const { sizes, W, Bs, dW, dB } = m;
  const n = data.xs.length;
  const L = W.length;
  const acts = [Float64Array.from(data.xs.flat())];
  for (let l = 0; l < L; l++) {
    const [nin, nout] = [sizes[l], sizes[l + 1]];
    const x = acts[l];
    const y = new Float64Array(n * nout);
    for (let s = 0; s < n; s++)
      for (let o = 0; o < nout; o++) {
        let a = Bs[l][o];
        for (let i = 0; i < nin; i++) a += x[s * nin + i] * W[l][i * nout + o];
        y[s * nout + o] = l < L - 1 && a < 0 ? 0 : a;
      }
    acts.push(y);
  }
  const scores = acts[L];
  let loss = 0;
  let g = new Float64Array(n);
  for (let s = 0; s < n; s++) {
    const margin = 1 - data.ys[s] * scores[s];
    if (margin > 0) {
      loss += margin / n;
      g[s] = -data.ys[s] / n;
    }
  }
  let reg = 0;
  for (let l = 0; l < L; l++) {
    for (const v of W[l]) reg += v * v;
    for (const v of Bs[l]) reg += v * v;
  }
  loss += 1e-4 * reg;
  for (let l = L - 1; l >= 0; l--) {
    const [nin, nout] = [sizes[l], sizes[l + 1]];
    const x = acts[l];
    const dx = new Float64Array(n * nin);
    for (let i = 0; i < W[l].length; i++) dW[l][i] = 2e-4 * W[l][i];
    for (let o = 0; o < nout; o++) dB[l][o] = 2e-4 * Bs[l][o];
    for (let s = 0; s < n; s++)
      for (let o = 0; o < nout; o++) {
        const d = g[s * nout + o];
        if (d === 0) continue;
        dB[l][o] += d;
        for (let i = 0; i < nin; i++) {
          dW[l][i * nout + o] += x[s * nin + i] * d;
          dx[s * nin + i] += W[l][i * nout + o] * d;
        }
      }
    if (l > 0) for (let i = 0; i < dx.length; i++) if (x[i] === 0) dx[i] = 0;
    g = dx;
  }
  const lr = 1 - (0.9 * k) / 100;
  for (let l = 0; l < L; l++) {
    for (let i = 0; i < W[l].length; i++) W[l][i] -= lr * dW[l][i];
    for (let o = 0; o < Bs[l].length; o++) Bs[l][o] -= lr * dB[l][o];
  }
  let acc = 0;
  for (let s = 0; s < n; s++) if (scores[s] > 0 === data.ys[s] > 0) acc++;
  return { loss, acc: acc / n };
}

function time(fn, steps) {
  const times = [];
  let last;
  for (let k = 0; k < steps; k++) {
    const t0 = performance.now();
    last = fn(k);
    times.push(performance.now() - t0);
  }
  const warm = times.slice(10).sort((a, b) => a - b);
  return { med: warm[warm.length >> 1], min: warm[0], max: warm.at(-1), last, first: times[0] };
}

const data = moons(100, rng(5));
console.log('2-H-H-1 MLP, 100 two-moons points, full batch, 100 SGD steps (median of steps 10-99)');
for (const H of (process.argv[2] ?? "8,16,32,64").split(",").map(Number)) {
  const sizes = [2, H, H, 1];
  const scalar = scalarMLP(sizes, rng(1));
  const arr = arrayMLP(sizes, scalar);
  const nParams = scalar.params.length;
  const st = time((k) => scalarStep(scalar, data, k), 100);
  const at = time((k) => arrayStep(arr, data, k), 100);
  const finalCheck = Math.abs(st.last.loss - at.last.loss);
  console.log(
    `H=${String(H).padStart(2)} params ${String(nParams).padStart(5)} | Value: ${st.med.toFixed(2)} ms/step (${st.min.toFixed(2)} to ${st.max.toFixed(2)}), ` +
      `${(1000 / st.med).toFixed(0)} steps/s, ${st.last.nodes} graph nodes, ${((st.med * 1e6) / (nParams * 100)).toFixed(0)} ns per param-example, ` +
      `final loss ${st.last.loss.toFixed(4)} acc ${st.last.acc} | Float64Array: ${at.med.toFixed(3)} ms/step, ${(1000 / at.med).toFixed(0)} steps/s, ` +
      `${((at.med * 1e6) / (nParams * 100)).toFixed(1)} ns per param-example | Value is ${(st.med / at.med).toFixed(0)}x slower | |loss diff| ${finalCheck.toExponential(1)}`,
  );
}
