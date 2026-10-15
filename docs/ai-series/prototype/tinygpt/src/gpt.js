// A tiny character-level GPT in plain JavaScript.
// No libraries: Float32Arrays and hand-written forward and backward passes.
// Every activation is a flat array of rows, so a (B, T, C) tensor is B*T rows of C numbers.

export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randn(rand) {
  return Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
}

// All parameters live in one array. Each tensor is a named view into it,
// so zeroing the gradients or running the optimizer is a single loop.
export function createModel(config, { seed = 1, F = Float32Array } = {}) {
  const { vocab: V, ctx: T, dim: C, layers: L } = config;
  const layout = [
    ['wte', [V, C], 'normal'],
    ['wpe', [T, C], 'normal'],
  ];
  for (let l = 0; l < L; l++) {
    layout.push(
      [`${l}.ln1.g`, [C], 'one'], [`${l}.ln1.b`, [C], 'zero'],
      [`${l}.qkv.w`, [C, 3 * C], 'normal'], [`${l}.qkv.b`, [3 * C], 'zero'],
      [`${l}.proj.w`, [C, C], 'normal'], [`${l}.proj.b`, [C], 'zero'],
      [`${l}.ln2.g`, [C], 'one'], [`${l}.ln2.b`, [C], 'zero'],
      [`${l}.fc.w`, [C, 4 * C], 'normal'], [`${l}.fc.b`, [4 * C], 'zero'],
      [`${l}.out.w`, [4 * C, C], 'normal'], [`${l}.out.b`, [C], 'zero'],
    );
  }
  layout.push(
    ['lnf.g', [C], 'one'], ['lnf.b', [C], 'zero'],
    ['head.w', [C, V], 'normal'], ['head.b', [V], 'zero'],
  );

  const count = (shape) => shape.reduce((a, b) => a * b, 1);
  const size = layout.reduce((n, [, shape]) => n + count(shape), 0);
  const data = new F(size);
  const grad = new F(size);
  const rand = rng(seed);
  const p = {};
  let offset = 0;
  for (const [name, shape, init] of layout) {
    const n = count(shape);
    const w = data.subarray(offset, offset + n);
    if (init === 'one') w.fill(1);
    if (init === 'normal') for (let i = 0; i < n; i++) w[i] = 0.02 * randn(rand);
    p[name] = { shape, w, g: grad.subarray(offset, offset + n) };
    offset += n;
  }
  return { config, p, data, grad, m: new F(size), v: new F(size), t: 0, F };
}

// Activation buffers for one batch size. `fresh` allocates new arrays on every call,
// the way a first draft would; otherwise each buffer is allocated once and reused.
export function createState(model, B, { fresh = false, kernel = 'ikj' } = {}) {
  const F = model.F;
  const cache = new Map();
  const buf = fresh
    ? (key, n) => new F(n)
    : (key, n) => {
        const id = `${key}:${n}`;
        let a = cache.get(id);
        if (a) a.fill(0);
        else cache.set(id, (a = new F(n)));
        return a;
      };
  return { B, buf, mm: kernels[kernel], acts: null };
}

// ---------- matmul: out (N, OC) = x (N, C) @ w (C, OC) + b ----------

const kernels = {
  // Textbook loops: every output is a dot product. Reads w down a column (stride OC).
  naive: {
    forward(out, x, w, b, N, C, OC) {
      for (let i = 0; i < N; i++)
        for (let j = 0; j < OC; j++) {
          let s = b[j];
          for (let k = 0; k < C; k++) s += x[i * C + k] * w[k * OC + j];
          out[i * OC + j] = s;
        }
    },
    backward(dx, dw, db, dout, x, w, N, C, OC) {
      for (let i = 0; i < N; i++)
        for (let k = 0; k < C; k++) {
          let s = 0;
          for (let j = 0; j < OC; j++) s += dout[i * OC + j] * w[k * OC + j];
          dx[i * C + k] += s;
        }
      for (let k = 0; k < C; k++)
        for (let j = 0; j < OC; j++) {
          let s = 0;
          for (let i = 0; i < N; i++) s += x[i * C + k] * dout[i * OC + j];
          dw[k * OC + j] += s;
        }
      for (let j = 0; j < OC; j++) {
        let s = 0;
        for (let i = 0; i < N; i++) s += dout[i * OC + j];
        db[j] += s;
      }
    },
  },
  // Same math, loops ordered i-k-j so the innermost loop walks memory in order.
  ikj: {
    forward(out, x, w, b, N, C, OC) {
      for (let i = 0; i < N; i++) {
        const o = i * OC;
        for (let j = 0; j < OC; j++) out[o + j] = b[j];
        for (let k = 0; k < C; k++) {
          const a = x[i * C + k];
          const r = k * OC;
          for (let j = 0; j < OC; j++) out[o + j] += a * w[r + j];
        }
      }
    },
    backward(dx, dw, db, dout, x, w, N, C, OC) {
      for (let i = 0; i < N; i++) {
        const o = i * OC;
        for (let k = 0; k < C; k++) {
          const r = k * OC;
          const a = x[i * C + k];
          let s = 0;
          for (let j = 0; j < OC; j++) {
            s += dout[o + j] * w[r + j];
            dw[r + j] += a * dout[o + j];
          }
          dx[i * C + k] += s;
        }
        for (let j = 0; j < OC; j++) db[j] += dout[o + j];
      }
    },
  },
  // ikj over four rows at a time: each weight loaded from memory is used four times.
  // Leftover rows (N not a multiple of 4, as when sampling) go through ikj.
  ikj4: {
    forward(out, x, w, b, N, C, OC) {
      const N4 = N - (N % 4);
      for (let i = 0; i < N4; i += 4) {
        const o0 = i * OC, o1 = o0 + OC, o2 = o1 + OC, o3 = o2 + OC;
        for (let j = 0; j < OC; j++) out[o0 + j] = out[o1 + j] = out[o2 + j] = out[o3 + j] = b[j];
        for (let k = 0; k < C; k++) {
          const a0 = x[i * C + k], a1 = x[(i + 1) * C + k], a2 = x[(i + 2) * C + k], a3 = x[(i + 3) * C + k];
          const r = k * OC;
          for (let j = 0; j < OC; j++) {
            const wv = w[r + j];
            out[o0 + j] += a0 * wv;
            out[o1 + j] += a1 * wv;
            out[o2 + j] += a2 * wv;
            out[o3 + j] += a3 * wv;
          }
        }
      }
      if (N4 < N) kernels.ikj.forward(out.subarray(N4 * OC), x.subarray(N4 * C), w, b, N - N4, C, OC);
    },
    backward(dx, dw, db, dout, x, w, N, C, OC) {
      const N4 = N - (N % 4);
      for (let i = 0; i < N4; i += 4) {
        const o0 = i * OC, o1 = o0 + OC, o2 = o1 + OC, o3 = o2 + OC;
        for (let k = 0; k < C; k++) {
          const r = k * OC;
          const a0 = x[i * C + k], a1 = x[(i + 1) * C + k], a2 = x[(i + 2) * C + k], a3 = x[(i + 3) * C + k];
          let s0 = 0, s1 = 0, s2 = 0, s3 = 0;
          for (let j = 0; j < OC; j++) {
            const wv = w[r + j];
            const d0 = dout[o0 + j], d1 = dout[o1 + j], d2 = dout[o2 + j], d3 = dout[o3 + j];
            s0 += d0 * wv;
            s1 += d1 * wv;
            s2 += d2 * wv;
            s3 += d3 * wv;
            dw[r + j] += a0 * d0 + a1 * d1 + a2 * d2 + a3 * d3;
          }
          dx[i * C + k] += s0;
          dx[(i + 1) * C + k] += s1;
          dx[(i + 2) * C + k] += s2;
          dx[(i + 3) * C + k] += s3;
        }
        for (let j = 0; j < OC; j++) db[j] += dout[o0 + j] + dout[o1 + j] + dout[o2 + j] + dout[o3 + j];
      }
      if (N4 < N)
        kernels.ikj.backward(dx.subarray(N4 * C), dw, db, dout.subarray(N4 * OC), x.subarray(N4 * C), w, N - N4, C, OC);
    },
  },
};

// ---------- layer norm ----------

function layernormForward(out, mean, rstd, x, g, b, N, C) {
  for (let i = 0; i < N; i++) {
    const r = i * C;
    let m = 0;
    for (let c = 0; c < C; c++) m += x[r + c];
    m /= C;
    let v = 0;
    for (let c = 0; c < C; c++) v += (x[r + c] - m) ** 2;
    const s = 1 / Math.sqrt(v / C + 1e-5);
    for (let c = 0; c < C; c++) out[r + c] = (x[r + c] - m) * s * g[c] + b[c];
    mean[i] = m;
    rstd[i] = s;
  }
}

function layernormBackward(dx, dg, db, dout, x, mean, rstd, g, N, C) {
  for (let i = 0; i < N; i++) {
    const r = i * C;
    const m = mean[i];
    const s = rstd[i];
    let dnMean = 0;
    let dnDotN = 0;
    for (let c = 0; c < C; c++) {
      const dn = g[c] * dout[r + c];
      dnMean += dn;
      dnDotN += dn * (x[r + c] - m) * s;
    }
    dnMean /= C;
    dnDotN /= C;
    for (let c = 0; c < C; c++) {
      const n = (x[r + c] - m) * s;
      db[c] += dout[r + c];
      dg[c] += n * dout[r + c];
      dx[r + c] += (g[c] * dout[r + c] - dnMean - n * dnDotN) * s;
    }
  }
}

// ---------- causal self-attention ----------
// qkv is (B, T, 3C): queries, then keys, then values. att is (B, NH, T, T).

function attentionForward(out, att, qkv, B, T, C, NH) {
  const hs = C / NH;
  const scale = 1 / Math.sqrt(hs);
  for (let b = 0; b < B; b++)
    for (let t = 0; t < T; t++)
      for (let h = 0; h < NH; h++) {
        const q = (b * T + t) * 3 * C + h * hs;
        const a = ((b * NH + h) * T + t) * T;
        let max = -Infinity;
        for (let t2 = 0; t2 <= t; t2++) {
          const k = (b * T + t2) * 3 * C + C + h * hs;
          let dot = 0;
          for (let i = 0; i < hs; i++) dot += qkv[q + i] * qkv[k + i];
          att[a + t2] = dot * scale;
          if (att[a + t2] > max) max = att[a + t2];
        }
        let sum = 0;
        for (let t2 = 0; t2 <= t; t2++) {
          att[a + t2] = Math.exp(att[a + t2] - max);
          sum += att[a + t2];
        }
        const o = (b * T + t) * C + h * hs;
        for (let t2 = 0; t2 <= t; t2++) {
          att[a + t2] /= sum;
          const v = (b * T + t2) * 3 * C + 2 * C + h * hs;
          for (let i = 0; i < hs; i++) out[o + i] += att[a + t2] * qkv[v + i];
        }
      }
}

function attentionBackward(dqkv, dout, qkv, att, datt, B, T, C, NH) {
  const hs = C / NH;
  const scale = 1 / Math.sqrt(hs);
  for (let b = 0; b < B; b++)
    for (let t = 0; t < T; t++)
      for (let h = 0; h < NH; h++) {
        const q = (b * T + t) * 3 * C + h * hs;
        const a = ((b * NH + h) * T + t) * T;
        const o = (b * T + t) * C + h * hs;
        // out = sum over t2 of att[t2] * v[t2]
        let attDotDatt = 0;
        for (let t2 = 0; t2 <= t; t2++) {
          const v = (b * T + t2) * 3 * C + 2 * C + h * hs;
          let d = 0;
          for (let i = 0; i < hs; i++) {
            d += dout[o + i] * qkv[v + i];
            dqkv[v + i] += att[a + t2] * dout[o + i];
          }
          datt[t2] = d;
          attDotDatt += att[a + t2] * d;
        }
        // through the softmax, then the scaled q.k dot product
        for (let t2 = 0; t2 <= t; t2++) {
          const k = (b * T + t2) * 3 * C + C + h * hs;
          const ds = att[a + t2] * (datt[t2] - attDotDatt) * scale;
          for (let i = 0; i < hs; i++) {
            dqkv[q + i] += ds * qkv[k + i];
            dqkv[k + i] += ds * qkv[q + i];
          }
        }
      }
}

// ---------- GELU (tanh approximation) ----------

const GELU_K = Math.sqrt(2 / Math.PI);

function geluForward(out, x, n) {
  for (let i = 0; i < n; i++) {
    const u = x[i];
    out[i] = 0.5 * u * (1 + Math.tanh(GELU_K * (u + 0.044715 * u * u * u)));
  }
}

function geluBackward(dx, x, dout, n) {
  for (let i = 0; i < n; i++) {
    const u = x[i];
    const th = Math.tanh(GELU_K * (u + 0.044715 * u * u * u));
    const local = 0.5 * (1 + th) + 0.5 * u * (1 - th * th) * GELU_K * (1 + 3 * 0.044715 * u * u);
    dx[i] += local * dout[i];
  }
}

function add(out, a, b, n) {
  for (let i = 0; i < n; i++) out[i] = a[i] + b[i];
}

// ---------- the model ----------

// inputs and targets are Int32Arrays of B*T token ids. Returns the mean loss when targets are given.
export function forward(model, s, inputs, targets) {
  const { vocab: V, dim: C, layers: L, heads: NH } = model.config;
  const { B, buf, mm } = s;
  const T = inputs.length / B;
  const N = B * T;
  const p = model.p;

  let x = buf('emb', N * C);
  for (let i = 0; i < N; i++) {
    const tok = inputs[i] * C;
    const pos = (i % T) * C;
    for (let c = 0; c < C; c++) x[i * C + c] = p.wte.w[tok + c] + p.wpe.w[pos + c];
  }

  const layers = [];
  for (let l = 0; l < L; l++) {
    const a = { x };
    a.ln1 = buf(`${l}.ln1`, N * C); a.ln1m = buf(`${l}.ln1m`, N); a.ln1r = buf(`${l}.ln1r`, N);
    layernormForward(a.ln1, a.ln1m, a.ln1r, x, p[`${l}.ln1.g`].w, p[`${l}.ln1.b`].w, N, C);
    a.qkv = buf(`${l}.qkv`, N * 3 * C);
    mm.forward(a.qkv, a.ln1, p[`${l}.qkv.w`].w, p[`${l}.qkv.b`].w, N, C, 3 * C);
    a.att = buf(`${l}.att`, B * NH * T * T);
    a.y = buf(`${l}.y`, N * C);
    attentionForward(a.y, a.att, a.qkv, B, T, C, NH);
    const proj = buf(`${l}.proj`, N * C);
    mm.forward(proj, a.y, p[`${l}.proj.w`].w, p[`${l}.proj.b`].w, N, C, C);
    a.x2 = buf(`${l}.x2`, N * C);
    add(a.x2, x, proj, N * C);

    a.ln2 = buf(`${l}.ln2`, N * C); a.ln2m = buf(`${l}.ln2m`, N); a.ln2r = buf(`${l}.ln2r`, N);
    layernormForward(a.ln2, a.ln2m, a.ln2r, a.x2, p[`${l}.ln2.g`].w, p[`${l}.ln2.b`].w, N, C);
    a.h = buf(`${l}.h`, N * 4 * C);
    mm.forward(a.h, a.ln2, p[`${l}.fc.w`].w, p[`${l}.fc.b`].w, N, C, 4 * C);
    a.hg = buf(`${l}.hg`, N * 4 * C);
    geluForward(a.hg, a.h, N * 4 * C);
    const mlp = buf(`${l}.mlp`, N * C);
    mm.forward(mlp, a.hg, p[`${l}.out.w`].w, p[`${l}.out.b`].w, N, 4 * C, C);
    x = buf(`${l}.x3`, N * C);
    add(x, a.x2, mlp, N * C);
    layers.push(a);
  }

  const lnf = buf('lnf', N * C), lnfm = buf('lnfm', N), lnfr = buf('lnfr', N);
  layernormForward(lnf, lnfm, lnfr, x, p['lnf.g'].w, p['lnf.b'].w, N, C);
  const logits = buf('logits', N * V);
  mm.forward(logits, lnf, p['head.w'].w, p['head.b'].w, N, C, V);
  s.acts = { inputs, targets, B, T, layers, x, lnf, lnfm, lnfr, logits };
  if (!targets) return undefined;

  // softmax and cross-entropy
  const probs = buf('probs', N * V);
  let loss = 0;
  for (let i = 0; i < N; i++) {
    const r = i * V;
    let max = -Infinity;
    for (let j = 0; j < V; j++) if (logits[r + j] > max) max = logits[r + j];
    let sum = 0;
    for (let j = 0; j < V; j++) sum += (probs[r + j] = Math.exp(logits[r + j] - max));
    for (let j = 0; j < V; j++) probs[r + j] /= sum;
    loss -= Math.log(probs[r + targets[i]]);
  }
  s.acts.probs = probs;
  return loss / N;
}

// Adds the gradient of the mean loss into model.grad. Call forward with targets first.
export function backward(model, s) {
  const { vocab: V, dim: C, layers: L, heads: NH } = model.config;
  const { buf, mm } = s;
  const { inputs, targets, B, T, layers, x, lnf, lnfm, lnfr, probs } = s.acts;
  const N = B * T;
  const p = model.p;

  const dlogits = buf('dlogits', N * V);
  for (let i = 0; i < N; i++)
    for (let j = 0; j < V; j++) dlogits[i * V + j] = (probs[i * V + j] - (j === targets[i] ? 1 : 0)) / N;

  const dlnf = buf('dlnf', N * C);
  mm.backward(dlnf, p['head.w'].g, p['head.b'].g, dlogits, lnf, p['head.w'].w, N, C, V);
  // dx is the gradient flowing down the residual stream. Each block adds its share into it.
  const dx = buf('dx', N * C);
  layernormBackward(dx, p['lnf.g'].g, p['lnf.b'].g, dlnf, x, lnfm, lnfr, p['lnf.g'].w, N, C);

  const datt = buf('datt', T);
  for (let l = L - 1; l >= 0; l--) {
    const a = layers[l];
    // x3 = x2 + mlp(ln2(x2))
    const dhg = buf('dhg', N * 4 * C);
    mm.backward(dhg, p[`${l}.out.w`].g, p[`${l}.out.b`].g, dx, a.hg, p[`${l}.out.w`].w, N, 4 * C, C);
    const dh = buf('dh', N * 4 * C);
    geluBackward(dh, a.h, dhg, N * 4 * C);
    const dln2 = buf('dln2', N * C);
    mm.backward(dln2, p[`${l}.fc.w`].g, p[`${l}.fc.b`].g, dh, a.ln2, p[`${l}.fc.w`].w, N, C, 4 * C);
    layernormBackward(dx, p[`${l}.ln2.g`].g, p[`${l}.ln2.b`].g, dln2, a.x2, a.ln2m, a.ln2r, p[`${l}.ln2.g`].w, N, C);

    // x2 = x + proj(attention(ln1(x)))
    const dy = buf('dy', N * C);
    mm.backward(dy, p[`${l}.proj.w`].g, p[`${l}.proj.b`].g, dx, a.y, p[`${l}.proj.w`].w, N, C, C);
    const dqkv = buf('dqkv', N * 3 * C);
    attentionBackward(dqkv, dy, a.qkv, a.att, datt, B, T, C, NH);
    const dln1 = buf('dln1', N * C);
    mm.backward(dln1, p[`${l}.qkv.w`].g, p[`${l}.qkv.b`].g, dqkv, a.ln1, p[`${l}.qkv.w`].w, N, C, 3 * C);
    layernormBackward(dx, p[`${l}.ln1.g`].g, p[`${l}.ln1.b`].g, dln1, a.x, a.ln1m, a.ln1r, p[`${l}.ln1.g`].w, N, C);
  }

  for (let i = 0; i < N; i++) {
    const tok = inputs[i] * C;
    const pos = (i % T) * C;
    for (let c = 0; c < C; c++) {
      p.wte.g[tok + c] += dx[i * C + c];
      p.wpe.g[pos + c] += dx[i * C + c];
    }
  }
}

export function adamw(model, { lr = 1e-3, beta1 = 0.9, beta2 = 0.99, eps = 1e-8, wd = 0.01 } = {}) {
  const { data, grad, m, v } = model;
  const t = ++model.t;
  const c1 = 1 - beta1 ** t;
  const c2 = 1 - beta2 ** t;
  for (let i = 0; i < data.length; i++) {
    m[i] = beta1 * m[i] + (1 - beta1) * grad[i];
    v[i] = beta2 * v[i] + (1 - beta2) * grad[i] * grad[i];
    data[i] -= lr * (m[i] / c1 / (Math.sqrt(v[i] / c2) + eps) + wd * data[i]);
  }
}

export function trainStep(model, s, inputs, targets, opt) {
  const loss = forward(model, s, inputs, targets);
  model.grad.fill(0);
  backward(model, s);
  adamw(model, opt);
  return loss;
}

// Appends n tokens to the prompt, one at a time, feeding at most ctx tokens back in.
export function generate(model, s, prompt, n, { temperature = 1, rand, stop = () => false }) {
  const { vocab: V, ctx } = model.config;
  const out = [...prompt];
  for (let step = 0; step < n && !stop(out); step++) {
    const window = Int32Array.from(out.slice(-ctx));
    forward(model, s, window);
    const logits = s.acts.logits.subarray((window.length - 1) * V, window.length * V);
    let max = -Infinity;
    for (let j = 0; j < V; j++) max = Math.max(max, logits[j] / temperature);
    const weights = Array.from(logits, (z) => Math.exp(z / temperature - max));
    let r = rand() * weights.reduce((a, b) => a + b, 0);
    let next = 0;
    while (next < V - 1 && (r -= weights[next]) > 0) next++;
    out.push(next);
  }
  return out;
}

export const paramCount = (model) => model.data.length;
