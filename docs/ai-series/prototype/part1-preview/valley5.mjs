const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const km = [0.3, 0.5, 0.8, 1.1, 1.4, 1.8, 2.1, 2.4];
const paid = [6.25, 5.35, 6.6, 6.15, 8.2, 7.5, 7.85, 9.2];
const loss = (b, w) => mean(km.map((x, i) => (b + w * x - paid[i]) ** 2));
const grad = (b, w) => { let gb = 0, gw = 0; km.forEach((x, i) => { const r = b + w * x - paid[i]; gb += r; gw += r * x; }); return [2 * gb / 8, 2 * gw / 8]; };
const L = 0.327869;
const [CR, GD, ZZ, TB] = [0.03, 0.2, 0.31, 0.38];
for (const box of [{ F: 10, P: 4 }, { F: 10, P: 5 }]) {
  const inBox = (p) => p.b >= 0 && p.b <= box.F && p.w >= 0 && p.w <= box.P;
  const walk = (s, lr) => {
    let p = { ...s }, k = 0;
    for (; k < 2000; k++) {
      if (loss(p.b, p.w) <= L * 1.01) return k;
      const [gb, gw] = grad(p.b, p.w);
      p = { b: p.b - lr * gb, w: p.w - lr * gw };
      if (!inBox(p)) return null;
    }
    return null;
  };
  const tooBig = (s) => {
    let p = { ...s }, k = 0;
    for (; k < 100; k++) {
      const [gb, gw] = grad(p.b, p.w);
      const n = { b: p.b - TB * gb, w: p.w - TB * gw };
      if (!inBox(n)) return k;
      if (loss(n.b, n.w) <= loss(p.b, p.w)) return -1;
      p = n;
    }
    return k;
  };
  const rows = [];
  for (let b = 0.5; b < box.F; b += 0.5)
    for (let w = 0.25; w < box.P; w += 0.25) {
      const s = { b, w };
      const l0 = loss(b, w);
      if (l0 < 4 || l0 > 30) continue;
      const g = walk(s, GD), z = walk(s, ZZ), c = walk(s, CR), t = tooBig(s);
      if (g === null || z === null || c === null || t < 4) continue;
      rows.push({ b, w, l0: l0.toFixed(2), crawl: c, good: g, zigzag: z, tooBigStepsInBox: t });
    }
  rows.sort((a, b) => b.zigzag - b.good - (a.zigzag - a.good));
  console.log(`box fee 0-${box.F} price 0-${box.P}: ${rows.length} starts pass`);
  console.table(rows.slice(0, 14));
}
