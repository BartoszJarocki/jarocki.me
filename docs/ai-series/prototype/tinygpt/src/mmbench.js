// Isolated matmul forward kernels on the shapes the model uses. Prints GMAC/s per variant.
const [N, C, OC] = (process.argv[2] ?? '512,32,128').split(',').map(Number);
const rounds = Number(process.argv[3] ?? 200);

const variants = {
  naive(out, x, w, b) {
    for (let i = 0; i < N; i++)
      for (let j = 0; j < OC; j++) {
        let s = b[j];
        for (let k = 0; k < C; k++) s += x[i * C + k] * w[k * OC + j];
        out[i * OC + j] = s;
      }
  },
  ikj(out, x, w, b) {
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
  // w stored transposed (OC, C): each output is a contiguous dot product held in a register.
  dotT(out, x, wT, b) {
    for (let i = 0; i < N; i++) {
      const xr = i * C;
      for (let j = 0; j < OC; j++) {
        const wr = j * C;
        let s = b[j];
        for (let k = 0; k < C; k++) s += x[xr + k] * wT[wr + k];
        out[i * OC + j] = s;
      }
    }
  },
  // dotT with four independent accumulators.
  dotT4(out, x, wT, b) {
    for (let i = 0; i < N; i++) {
      const xr = i * C;
      for (let j = 0; j < OC; j++) {
        const wr = j * C;
        let s0 = 0, s1 = 0, s2 = 0, s3 = 0;
        for (let k = 0; k < C; k += 4) {
          s0 += x[xr + k] * wT[wr + k];
          s1 += x[xr + k + 1] * wT[wr + k + 1];
          s2 += x[xr + k + 2] * wT[wr + k + 2];
          s3 += x[xr + k + 3] * wT[wr + k + 3];
        }
        out[i * OC + j] = b[j] + s0 + s1 + s2 + s3;
      }
    }
  },
  // ikj over 4 rows at once, so each loaded weight is used 4 times.
  ikj4rows(out, x, w, b) {
    for (let i = 0; i < N; i += 4) {
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
  },
};

function run(F, name) {
  const x = new F(N * C).map(() => Math.random() - 0.5);
  const w = new F(C * OC).map(() => Math.random() - 0.5);
  const wT = new F(C * OC);
  for (let k = 0; k < C; k++) for (let j = 0; j < OC; j++) wT[j * C + k] = w[k * OC + j];
  const b = new F(OC).map(() => Math.random());
  const out = new F(N * OC);
  const ref = new Float64Array(N * OC);
  variants.naive(ref, Float64Array.from(x), Float64Array.from(w), Float64Array.from(b));
  const f = variants[name];
  const weights = name.startsWith('dotT') ? wT : w;
  for (let r = 0; r < 20; r++) f(out, x, weights, b);
  const times = [];
  for (let r = 0; r < rounds; r++) {
    const t0 = performance.now();
    f(out, x, weights, b);
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  let err = 0;
  for (let i = 0; i < out.length; i++) err = Math.max(err, Math.abs(out[i] - ref[i]));
  const med = times[times.length >> 1];
  return { med, gmacs: (N * C * OC) / med / 1e6, min: times[0], max: times.at(-1), err };
}

console.log(`N=${N} C=${C} OC=${OC}, ${rounds} timed calls each after 20 warmup, median`);
for (const F of [Float32Array, Float64Array])
  for (const name of Object.keys(variants)) {
    const r = run(F, name);
    console.log(
      `${F.name.padEnd(13)} ${name.padEnd(9)} ${r.med.toFixed(3)} ms  ${r.gmacs.toFixed(2)} GMAC/s  (min ${r.min.toFixed(3)} max ${r.max.toFixed(3)})  maxErr ${r.err.toExponential(1)}`,
    );
  }
