function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
const clamp1 = (v) => Math.max(-1, Math.min(1, v));
function sample(r, n, make) {
  const out = [];
  while (out.length < n) {
    const p = make(out.length);
    if (p) out.push(p);
  }
  return out;
}
const DATASETS = {
  days: {
    axes: { x: ['colder', 'temperature', 'warmer'], y: ['drier', 'humidity', 'damper'] },
    cols: ['temp', 'humid', 'bias'],
    about: 'made-up days indoors, with the comfortable ones in the middle.',
    make: (r) =>
      sample(r, 100, () => {
        const x = r() * 2 - 1;
        const y = r() * 2 - 1;
        const d = Math.abs((x - 0.04) / 0.58) ** 4 + Math.abs((y + 0.02) / 0.56) ** 4;
        if (Math.abs(d - 1) < 0.35) return null;
        return { x, y, c: d < 1 ? 1 : 0 };
      }),
  },
  switches: {
    axes: { x: ['down', 'switch one', 'up'], y: ['down', 'switch two', 'up'] },
    cols: ['one', 'two', 'bias'],
    about: 'a hallway light with a switch at each end is on when exactly one switch is up, and no single fence can split that.',
    make: (r) =>
      sample(r, 100, (i) => {
        const sx = i % 2 ? 1 : -1;
        const sy = (i >> 1) % 2 ? 1 : -1;
        const x = clamp1(sx * 0.62 + gauss(r) * 0.15);
        const y = clamp1(sy * 0.62 + gauss(r) * 0.15);
        if (Math.abs(x) < 0.12 || Math.abs(y) < 0.12) return null;
        return { x, y, c: x * y < 0 ? 1 : 0 };
      }),
  },
  groups: {
    axes: { x: ['colder', 'temperature', 'warmer'], y: ['calm', 'wind', 'windy'] },
    cols: ['temp', 'wind', 'bias'],
    about: 'warm calm beach days and cold windy ones sit in two separate groups, so one fence is enough.',
    make: (r) =>
      sample(r, 100, (i) => {
        const c = i % 2;
        const x = clamp1((c ? 0.4 : -0.42) + gauss(r) * 0.24);
        const y = clamp1((c ? -0.38 : 0.4) + gauss(r) * 0.24);
        if ((c ? 1 : -1) * (x - y) < 0.25) return null;
        return { x, y, c };
      }),
  },
  spiral: {
    axes: { x: ['left', '', 'right'], y: ['down', '', 'up'] },
    cols: ['right', 'up', 'bias'],
    about: 'two arms wound around each other. the hard one.',
    make: (r) =>
      sample(r, 100, (i) => {
        const c = i % 2;
        const t = Math.floor(i / 2) / 50;
        const rad = 0.1 + t * 0.85;
        const a = t * 1.5 * Math.PI * 2 + c * Math.PI;
        return { x: Math.cos(a) * rad + gauss(r) * 0.025, y: Math.sin(a) * rad + gauss(r) * 0.025, c };
      }),
  },
};

const SIZES = [2, 8, 8, 1];
const LAST = SIZES.length - 1;
function makeNet(seed) {
  const r = rng(seed);
  const zeros = (n) => new Float64Array(n);
  const L = [];
  for (let l = 1; l < SIZES.length; l++) {
    const nin = SIZES[l - 1];
    const nout = SIZES[l];
    L.push({
      nin,
      nout,
      W: zeros(nin * nout).map(() => gauss(r) * Math.sqrt(1 / nin)),
      b: zeros(nout),
      gW: zeros(nin * nout),
      gb: zeros(nout),
      mW: zeros(nin * nout),
      vW: zeros(nin * nout),
      mb: zeros(nout),
      vb: zeros(nout),
    });
  }
  return { L, t: 0, steps: 0, loss: NaN, acc: NaN };
}
const acts = SIZES.map((n) => new Float64Array(n));
const deltas = SIZES.map((n) => new Float64Array(n));
function forward(net, x, y) {
  acts[0][0] = x;
  acts[0][1] = y;
  net.L.forEach((ly, l) => {
    const a = acts[l];
    const z = acts[l + 1];
    for (let o = 0; o < ly.nout; o++) {
      let s = ly.b[o];
      for (let i = 0; i < ly.nin; i++) s += ly.W[o * ly.nin + i] * a[i];
      z[o] = l + 1 === LAST ? 1 / (1 + Math.exp(-s)) : Math.tanh(s);
    }
  });
  return acts[LAST][0];
}
function evaluate(net, data) {
  let loss = 0;
  let right = 0;
  for (const p of data) {
    const q = Math.min(Math.max(forward(net, p.x, p.y), 1e-7), 1 - 1e-7);
    loss += p.c ? -Math.log(q) : -Math.log(1 - q);
    if (q > 0.5 === (p.c === 1)) right++;
  }
  net.loss = loss / data.length;
  net.acc = right / data.length;
}
function trainStep(net, data, lr = 0.03) {
  for (const ly of net.L) {
    ly.gW.fill(0);
    ly.gb.fill(0);
  }
  for (const p of data) {
    const q = forward(net, p.x, p.y);
    deltas[LAST][0] = q - p.c;
    for (let l = net.L.length - 1; l >= 0; l--) {
      const ly = net.L[l];
      const a = acts[l];
      const d = deltas[l + 1];
      for (let o = 0; o < ly.nout; o++) {
        ly.gb[o] += d[o];
        for (let i = 0; i < ly.nin; i++) ly.gW[o * ly.nin + i] += d[o] * a[i];
      }
      if (l > 0) {
        const dp = deltas[l];
        for (let i = 0; i < ly.nin; i++) {
          let s = 0;
          for (let o = 0; o < ly.nout; o++) s += ly.W[o * ly.nin + i] * d[o];
          dp[i] = s * (1 - a[i] * a[i]);
        }
      }
    }
  }
  net.t++;
  const n = data.length;
  const c1 = 1 - 0.9 ** net.t;
  const c2 = 1 - 0.999 ** net.t;
  const adam = (P, G, Mo, V) => {
    for (let k = 0; k < P.length; k++) {
      const g = G[k] / n;
      Mo[k] = 0.9 * Mo[k] + 0.1 * g;
      V[k] = 0.999 * V[k] + 0.001 * g * g;
      P[k] -= (lr * (Mo[k] / c1)) / (Math.sqrt(V[k] / c2) + 1e-8);
    }
  };
  for (const ly of net.L) {
    adam(ly.W, ly.gW, ly.mW, ly.vW);
    adam(ly.b, ly.gb, ly.mb, ly.vb);
  }
  net.steps++;
}


const which = process.argv[2] ? process.argv[2].split(',') : Object.keys(DATASETS);
for (const name of which) {
  const data = DATASETS[name].make(rng(11));
  const filled = data.filter((p) => p.c).length;
  const rows = [];
  for (const lr of [0.03, 0.01, 0.005]) {
    const res = [];
    for (const seed of [3, 4, 5, 6, 7]) {
      const net = makeNet(seed);
      let k = 0;
      const target = name === 'spiral' ? 0.9 : 1;
      for (; k < 20000; k++) { evaluate(net, data); if (net.acc >= target) break; trainStep(net, data, lr); }
      res.push(k);
    }
    rows.push(`lr ${lr}: ${res.join(' ')}`);
  }
  const net0 = makeNet(3); evaluate(net0, data);
  console.log(`${name}: ${filled} filled of ${data.length}, untrained ${Math.round(net0.acc * 100)}% right | steps to target over seeds 3-7 | ${rows.join(' | ')}`);
}
