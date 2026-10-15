// gradient descent on mean squared error of fare = fee + price * km, for candidate ride sets
const traffic = [0.0, 1.4, 0.3, 2.1, 0.0, 0.9, 2.6, 0.5];
const sets = {
  'km 1-10': [1.3, 2.4, 3.1, 4.6, 5.2, 6.9, 8.0, 9.6],
  'km 1-6': [1.1, 1.8, 2.4, 3.2, 3.9, 4.6, 5.3, 6.0],
  'km 0.5-4': [0.6, 1.0, 1.5, 2.1, 2.5, 3.0, 3.5, 4.0],
  'km 0.4-2.6': [0.4, 0.7, 1.0, 1.3, 1.6, 2.0, 2.3, 2.6],
};
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
function analyse(name, xs, start) {
  const ys = xs.map((x, i) => 4.6 + 1.5 * x + traffic[i]);
  const loss = (b, w) => mean(xs.map((x, i) => (b + w * x - ys[i]) ** 2));
  const grad = (b, w) => {
    let gb = 0, gw = 0;
    xs.forEach((x, i) => { const r = b + w * x - ys[i]; gb += r; gw += r * x; });
    return [(2 * gb) / xs.length, (2 * gw) / xs.length];
  };
  const mx = mean(xs), my = mean(ys);
  const w = (mean(xs.map((x, i) => x * ys[i])) - mx * my) / (mean(xs.map((x) => x * x)) - mx * mx);
  const b = my - w * mx;
  const L = loss(b, w);
  // Hessian of the loss: 2 * [[1, mx], [mx, mean x^2]]
  const a = 2, c = 2 * mx, d = 2 * mean(xs.map((x) => x * x));
  const tr = a + d, det = a * d - c * c;
  const disc = Math.sqrt(tr * tr - 4 * det);
  const lmax = (tr + disc) / 2, lmin = (tr - disc) / 2;
  const limit = 2 / lmax;
  console.log(`\n${name}  ls fee ${b.toFixed(3)} price ${w.toFixed(3)} loss ${L.toFixed(4)}  ratio ${(lmax / lmin).toFixed(1)}  limit ${limit.toFixed(4)}  start loss ${loss(start.b, start.w).toFixed(2)}`);
  for (const f of [0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 1.05]) {
    const lr = f * limit;
    let p = { ...start }, k = 0, up = 0;
    for (; k < 20000; k++) {
      if (loss(p.b, p.w) <= L * 1.01) break;
      const before = loss(p.b, p.w);
      const [gb, gw] = grad(p.b, p.w);
      p = { b: p.b - lr * gb, w: p.w - lr * gw };
      if (loss(p.b, p.w) > before) up++;
      if (!Number.isFinite(p.b) || Math.abs(p.b) > 1e6) { k = Infinity; break; }
    }
    console.log(`  rate ${lr.toFixed(4)} (${f} x limit)  steps to 1%: ${k}  steps that went up: ${up}`);
  }
}
for (const [name, xs] of Object.entries(sets)) {
  analyse(name, xs, { b: 2, w: 0.5 });
  analyse(name + ' from 0,0', xs, { b: 0, w: 0 });
}
