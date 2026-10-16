// Run from the pw folder: node ../part1-preview/check.mjs ../part1-preview
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(path.resolve(process.cwd(), 'package.json'));
const { chromium } = require('playwright-core');
const dir = path.resolve(process.argv[2] ?? path.dirname(new URL(import.meta.url).pathname));
const out = path.join(dir, 'shots');
fs.mkdirSync(out, { recursive: true });
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const skeleton = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light;padding:env(safe-area-inset-top,0) 0 env(safe-area-inset-bottom,0)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${html}</body></html>`;
const server = http.createServer((_, res) => res.end(skeleton)).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({
  executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

const lines = [];
let failures = 0;
const log = (s) => {
  lines.push(s);
  console.log(s);
};
const check = (name, ok, detail) => {
  if (!ok) failures++;
  log(`${ok ? 'ok  ' : 'FAIL'} ${name}  ${detail}`);
};
const info = (s) => log(`     ${s}`);

// The expected numbers come from this copy of the rides, not from the page.
const RIDES = [[0.3, 6.25], [0.5, 5.35], [0.8, 6.6], [1.1, 6.15], [1.4, 8.2], [1.8, 7.5], [2.1, 7.85], [2.4, 9.2]];
const mean = (f) => RIDES.reduce((s, r) => s + f(r), 0) / RIDES.length;
const mse = (fee, price) => mean(([km, paid]) => (fee + price * km - paid) ** 2);
const grad = (fee, price) => [mean(([km, paid]) => 2 * (fee + price * km - paid)), mean(([km, paid]) => 2 * (fee + price * km - paid) * km)];
const mx = mean(([km]) => km);
const my = mean(([, p]) => p);
const s2 = mean(([km]) => km * km);
const lsPrice = (mean(([km, p]) => km * p) - mx * my) / (s2 - mx * mx);
const lsFee = my - lsPrice * mx;
const lsLoss = mse(lsFee, lsPrice);
const tr = 2 + 2 * s2;
const det = 4 * s2 - 4 * mx * mx;
const lmax = (tr + Math.sqrt(tr * tr - 4 * det)) / 2;
const lmin = (tr - Math.sqrt(tr * tr - 4 * det)) / 2;
const limit = 2 / lmax;
const RATES = { crawl: 0.03, good: 0.2, zigzag: 0.325, 'too big': 0.38 };
const START = [2, 2.5];

async function open({ width = 1440, height = 900, scheme = 'light', motion = 'no-preference', scale = 1 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, colorScheme: scheme, reducedMotion: motion });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    window.__raf = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => {
      window.__raf++;
      return raf(cb);
    };
  });
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await p.goto(url);
  await p.evaluate(() => document.fonts.ready);
  return { ctx, p, errors };
}
async function mountAll(p) {
  for (const id of ['#fare', '#valley', '#receipt', '#fences', '#glossary']) {
    await p.locator(id).scrollIntoViewIfNeeded();
    await p.waitForTimeout(250);
  }
  await p.waitForFunction(() => __debug.valley.ready(), null, { timeout: 30000 });
}
const valleyCaption = (p) => p.textContent('#valley-caption');
const fareNow = (p) => p.evaluate(() => [__debug.fare.fee, __debug.fare.price]);
const btn = (p, scope, label) => p.click(`${scope} button:text-is("${label}")`);

log(`data  least squares fee ${lsFee.toFixed(4)}  price ${lsPrice.toFixed(4)}  loss ${lsLoss.toFixed(4)}`);
log(`      curvature eigenvalues ${lmax.toFixed(4)} and ${lmin.toFixed(4)}, ratio ${(lmax / lmin).toFixed(2)}, rate limit 2/${lmax.toFixed(4)} = ${limit.toFixed(4)}`);

// ---------- layout, errors and section screenshots in four contexts
for (const [width, height, scheme, scale] of [[1440, 900, 'light', 1], [1440, 900, 'dark', 1], [390, 844, 'light', 2], [390, 844, 'dark', 2]]) {
  const { ctx, p, errors } = await open({ width, height, scheme, scale });
  await mountAll(p);
  await p.waitForTimeout(600);
  const scroll = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  check(`${width} ${scheme}: scroll width equals viewport`, scroll[0] === scroll[1], `scrollWidth ${scroll[0]}, viewport ${scroll[1]}`);
  check(`${width} ${scheme}: no console errors`, errors.length === 0, errors.join(' | ') || 'none');
  if (!(width === 390 && scheme === 'light')) {
    for (const [i, id] of ['#fare', '#valley', '#receipt', '#fences', '#glossary'].entries()) {
      const el = p.locator(id);
      if (i === 0) {
        const [top, bottom] = await p.evaluate(() => [
          document.querySelector('article').getBoundingClientRect().top + scrollY,
          document.querySelector('#fare').getBoundingClientRect().bottom + scrollY,
        ]);
        await p.screenshot({ path: path.join(out, `${i + 1}-${id.slice(1)}-${width}-${scheme}.png`), fullPage: true, clip: { x: 0, y: top - 24, width, height: bottom - top + 48 } });
      } else await el.screenshot({ path: path.join(out, `${i + 1}-${id.slice(1)}-${width}-${scheme}.png`) });
    }
  }
  await ctx.close();
}

// ---------- the fare chart: caption loss against the mean squared error at five slider positions
{
  const { ctx, p } = await open();
  await p.locator('#fare').scrollIntoViewIfNeeded();
  const positions = [[0.0, 0.0], [0.2, 0.5], [0.524, 0.293], [0.85, 0.15], [0.33, 0.84]];
  for (const [ff, pf] of positions) {
    for (const [id, f] of [['#fee', ff], ['#price', pf]]) {
      const box = await p.locator(id).boundingBox();
      await p.mouse.click(box.x + 6 + f * (box.width - 12), box.y + box.height / 2);
    }
    const fee = +(await p.inputValue('#fee'));
    const price = +(await p.inputValue('#price'));
    const cap = await p.textContent('#fare-caption span:first-child');
    const shown = +cap.match(/loss\s+([\d.]+)/)[1];
    const want = mse(fee, price);
    check(`fare caption at fee ${fee.toFixed(2)}, price ${price.toFixed(2)}`, shown.toFixed(2) === want.toFixed(2), `caption "${cap.trim()}", mean squared error ${want.toFixed(4)}`);
  }
  await ctx.close();
}

// ---------- the valley: steps per rate from the starting settings, by pressing step
const simulate = (rate) => {
  let [f, q] = START;
  let k = 0;
  for (; k < 5000; k++) {
    if (mse(f, q) <= lsLoss * 1.01) return k;
    const [gf, gq] = grad(f, q);
    [f, q] = [f - rate * gf, q - rate * gq];
  }
  return null;
};
{
  const { ctx, p } = await open({ motion: 'reduce' });
  await p.locator('#valley').scrollIntoViewIfNeeded();
  await p.waitForFunction(() => __debug.valley.ready(), null, { timeout: 30000 });
  for (const name of ['crawl', 'good', 'zigzag']) {
    await btn(p, '#valley-controls', name);
    await btn(p, '#valley-controls', 'reset');
    let k = 0;
    for (; k < 2000; k++) {
      const [f, q] = await fareNow(p);
      if (mse(f, q) <= lsLoss * 1.01) break;
      await btn(p, '#valley-controls', 'step');
    }
    const sim = simulate(RATES[name]);
    const cap = (await valleyCaption(p)).trim();
    check(`${name} (${RATES[name]}) reaches 1% of least squares by pressing step`, k === sim, `${k} presses, simulated ${sim}, caption "${cap}"`);
  }
  await btn(p, '#valley-controls', 'too big');
  await btn(p, '#valley-controls', 'reset');
  const losses = [];
  let [f, q] = await fareNow(p);
  losses.push(mse(f, q));
  for (let k = 0; k < 50; k++) {
    await btn(p, '#valley-controls', 'step');
    [f, q] = await fareNow(p);
    if (mse(f, q) === losses.at(-1)) break;
    losses.push(mse(f, q));
  }
  const rising = losses.every((l, i) => i === 0 || l > losses[i - 1]);
  const cap = (await valleyCaption(p)).trim();
  check('too big (0.38) raises the loss on every step', rising && losses.length > 2, `losses ${losses.map((l) => l.toFixed(2)).join(' -> ')}, then "${cap}"`);

  const unseen = async (when) => {
    const [text, nums] = await p.evaluate(() => {
      const el = document.querySelector('#unseen');
      return [el.textContent.replace(/\s+/g, ' ').trim(), [...el.querySelectorAll('.live')].map((s) => s.textContent)];
    });
    const [fee1, price1, fee2, price2, answer] = nums.map(Number);
    const sum = fee2 + 1.6 * price2;
    check(`1.6 km sentence ${when}: the shown parts add up to the shown answer`, nums.length === 5 && fee1 === fee2 && price1 === price2 && Math.abs(sum - answer) <= 0.005 + 1e-9, `${fee2.toFixed(2)} + 1.6 × ${price2.toFixed(2)} = ${sum.toFixed(4)}, shown "${nums[4]}"`);
    return text;
  };
  await btn(p, '#valley-controls', 'good');
  await btn(p, '#valley-controls', 'reset');
  await unseen('at the start');
  await btn(p, '#valley-controls', 'walk');
  info(`1.6 km sentence at the bottom: "${await unseen('at the bottom')}"`);
  const after = (await valleyCaption(p)).trim();
  const steps = +after.match(/·\s*([\d,]+)\s+steps/)[1].replace(',', '');
  [f, q] = await fareNow(p);
  check('reduced motion: walk jumps to the end in one press, stopping on flat ground within 0.1% of least squares', /the ground is flat here/.test(after) && mse(f, q) <= lsLoss * 1.001, `caption right after the press "${after}", loss ${mse(f, q).toFixed(5)} vs ${(lsLoss * 1.001).toFixed(5)}`);
  info(`walk stops when the two slopes together are under 0.01; at good that took ${steps} steps`);
  await ctx.close();
}

// ---------- walking with motion: seconds per rate
{
  const { ctx, p } = await open();
  await p.locator('#valley').scrollIntoViewIfNeeded();
  await p.waitForFunction(() => __debug.valley.ready(), null, { timeout: 30000 });
  for (const name of ['good', 'zigzag', 'crawl']) {
    await btn(p, '#valley-controls', name);
    await btn(p, '#valley-controls', 'reset');
    const t0 = Date.now();
    await btn(p, '#valley-controls', 'walk');
    await p.waitForFunction(() => /the ground is flat here/.test(document.querySelector('#valley-caption').textContent), null, { timeout: 60000, polling: 100 });
    const cap = (await valleyCaption(p)).trim();
    const want = { good: 69, zigzag: 195, crawl: 467 }[name];
    const got = +cap.match(/·\s*([\d,]+)\s+steps/)[1].replace(',', '');
    check(`walk at ${name} stops on flat ground after ${want} steps, the count the flat-slope rule gives in node`, got === want, `${got} steps`);
    info(`walk at ${name}: "${cap}" after ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  await ctx.close();
}

// ---------- fog: no wireframe pixel outside the cube's 5x5 cells
{
  const { ctx, p } = await open();
  await p.locator('#valley').scrollIntoViewIfNeeded();
  await p.waitForFunction(() => __debug.valley.ready(), null, { timeout: 30000 });
  await btn(p, '#valley-controls', 'good');
  await btn(p, '#valley-controls', 'reset');
  await btn(p, '#valley-controls', 'fog');
  const a1 = await p.evaluate(() => __debug.valley.fogAudit());
  check('fog at the start: nothing drawn outside the 5x5 cells', a1.fog && a1.drawnOutsideAllowedCells === 0, JSON.stringify(a1));
  for (let k = 0; k < 12; k++) await btn(p, '#valley-controls', 'step');
  await p.waitForTimeout(400);
  const a2 = await p.evaluate(() => __debug.valley.fogAudit());
  check('fog after 12 steps: nothing drawn outside the 5x5 cells', a2.fog && a2.drawnOutsideAllowedCells === 0, JSON.stringify(a2));
  await p.locator('#valley .split').screenshot({ path: path.join(out, 'x-fog-on.png') });
  await btn(p, '#valley-controls', 'fog');
  const a3 = await p.evaluate(() => __debug.valley.fogAudit());
  check('control, fog off: the same audit does count pixels outside', !a3.fog && a3.drawnOutsideAllowedCells > 1000, JSON.stringify(a3));
  await ctx.close();
}

// ---------- step size screenshots
for (const scheme of ['light', 'dark']) {
  const { ctx, p } = await open({ scheme });
  await p.locator('#valley').scrollIntoViewIfNeeded();
  await p.waitForFunction(() => __debug.valley.ready(), null, { timeout: 30000 });
  for (const [name, n] of [['zigzag', 14], ['too big', 20], ['good', 200]]) {
    await btn(p, '#valley-controls', name);
    await btn(p, '#valley-controls', 'reset');
    for (let k = 0; k < n; k++) await btn(p, '#valley-controls', 'step');
    await p.waitForTimeout(500);
    await p.locator('#valley figure').screenshot({ path: path.join(out, `x-rate-${name.replace(' ', '-')}-${scheme}.png`) });
  }
  await ctx.close();
}

// ---------- the receipt: nudge ratio against the backward slope at two settings
{
  const { ctx, p } = await open({ motion: 'reduce' });
  await p.locator('#receipt').scrollIntoViewIfNeeded();
  const settings = [];
  for (const [label, prep] of [
    ['the starting settings', async () => btn(p, '#valley-controls', 'reset')],
    ['sliders moved to fee ~6.5, price ~0.9', async () => {
      await p.locator('#fare').scrollIntoViewIfNeeded();
      for (const [id, f] of [['#fee', 0.65], ['#price', 0.18]]) {
        const box = await p.locator(id).boundingBox();
        await p.mouse.click(box.x + 6 + f * (box.width - 12), box.y + box.height / 2);
      }
      await p.locator('#receipt').scrollIntoViewIfNeeded();
    }],
  ]) {
    await prep();
    await btn(p, '#receipt-controls', 'clear');
    await btn(p, '#receipt-controls', 'nudge');
    await btn(p, '#receipt-controls', 'backward');
    const ratio = await p.textContent('#nudge [data-n="ratio"]');
    const slope = await p.textContent('#receipt-table tr[data-row="price"] td.slope');
    const [f, q] = await fareNow(p);
    const exact = 2 * (f + q * 0.3 - 6.25) * 0.3;
    const nudgeExact = (((f + (q + 0.01) * 0.3 - 6.25) ** 2) - ((f + q * 0.3 - 6.25) ** 2)) / 0.01;
    settings.push([f, q]);
    const bound = 0.3 * 0.3 * 0.01 + 1e-9;
    check(`receipt at ${label} (fee ${f.toFixed(2)}, price ${q.toFixed(2)}): the nudge is within km² × 0.01 of the slope`, Math.abs(nudgeExact - exact) <= bound && Math.abs(+ratio - +slope) <= 0.01 + 1e-9, `nudge ratio "${ratio}", backward slope "${slope}", unrounded ${nudgeExact.toFixed(5)} vs ${exact.toFixed(5)}, bound ${bound.toFixed(4)}, shown ${ratio === slope ? 'equal' : 'one cent apart'}`);
  }
  check('the two receipt settings differ', settings[0][0] !== settings[1][0], JSON.stringify(settings.map((s) => s.map((v) => +v.toFixed(2)))));
  const filled = await p.$$eval('#receipt-table td.slope', (tds) => tds.filter((t) => t.textContent).length);
  check('reduced motion: backward fills every slope at once', filled === 6, `${filled} of 6 filled right after the press`);
  await ctx.close();
}
{
  const { ctx, p } = await open();
  await p.locator('#receipt').scrollIntoViewIfNeeded();
  await btn(p, '#receipt-controls', 'nudge');
  await btn(p, '#receipt-controls', 'backward');
  const order = [];
  for (let k = 0; k < 8; k++) {
    order.push(await p.$$eval('#receipt-table tr[data-row]', (trs) => trs.filter((t) => t.querySelector('.slope').textContent).map((t) => t.dataset.row).join(',')));
    await p.waitForTimeout(420);
  }
  const firsts = order.map((o) => o.split(',').filter(Boolean)).map((o) => o.length);
  check('backward fills one row at a time from the bottom', order[0] === 'loss' && firsts.at(-1) === 6, `filled rows over time: ${order.map((o) => `[${o}]`).join(' ')}`);
  for (const scheme of ['light', 'dark']) {
    await p.emulateMedia({ colorScheme: scheme });
    await p.waitForTimeout(200);
    await p.locator('#receipt figure').screenshot({ path: path.join(out, `x-receipt-after-backward-${scheme}.png`) });
  }
  await ctx.close();
}

// ---------- the playground: time and steps to the target accuracy
{
  const { ctx, p } = await open();
  await p.locator('#fences').scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  for (const [name, target] of [['days', 1], ['switches', 1], ['groups', 1], ['spiral', 0.9]]) {
    await btn(p, '#net-controls', name);
    const t0 = Date.now();
    await btn(p, '#net-controls', 'train');
    let st = null;
    while (Date.now() - t0 < 90000) {
      st = await p.evaluate(() => ({ acc: __debug.playground.model.net.acc, steps: __debug.playground.model.net.steps, cap: document.querySelector('#net-caption').textContent }));
      if (st.acc >= target) break;
      await p.waitForTimeout(100);
    }
    const secs = (Date.now() - t0) / 1000;
    const fixed = /loss \d+\.\d{3} /.test(st.cap) && !/e-/.test(st.cap);
    check(`playground ${name} reaches ${target * 100}%`, st.acc >= target && fixed, `${(st.acc * 100).toFixed(0)}% after ${st.steps} steps, ${secs.toFixed(1)} s, caption "${st.cap.trim()}"`);
    await btn(p, '#net-controls', 'pause');
    if (name === 'days') {
      const box = await p.locator('#hinton').boundingBox();
      await p.mouse.move(box.x + 50, box.y + 20 + 36 * 2 + 18);
      await p.waitForTimeout(200);
      await p.locator('#fences figure').screenshot({ path: path.join(out, 'x-playground-row-hover-light.png') });
      await p.emulateMedia({ colorScheme: 'dark' });
      await p.waitForTimeout(200);
      await p.locator('#fences figure').screenshot({ path: path.join(out, 'x-playground-row-hover-dark.png') });
      await p.emulateMedia({ colorScheme: 'light' });
      await p.mouse.move(0, 0);
    }
    if (name === 'spiral') await p.locator('#fences figure').screenshot({ path: path.join(out, 'x-playground-spiral.png') });
  }
  await ctx.close();
}

// ---------- the first layer squares: a small negative weight still draws hollow
{
  const { ctx, p } = await open();
  await p.locator('#fences').scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  const px = await p.evaluate(() => {
    const ly = __debug.playground.model.net.L[0];
    const keep = [ly.W[0], ly.W[1]];
    ly.W[0] = -0.1;
    ly.W[1] = 0.1;
    __debug.playground.draw();
    const cv = document.querySelector('#hinton');
    const g = cv.getContext('2d');
    const dpr = cv.width / cv.getBoundingClientRect().width;
    const head = cv.getBoundingClientRect().height - 8 * 36;
    const at = (x, y) => [...g.getImageData(Math.round(x * dpr), Math.round(y * dpr), 1, 1).data].join(',');
    const cell = (c) => ({ corner: at(c * 36 + 2, head + 2), center: at(c * 36 + 17, head + 17), edge: at(c * 36 + 16, head + 17) });
    const out = { neg: cell(0), pos: cell(1) };
    [ly.W[0], ly.W[1]] = keep;
    __debug.playground.draw();
    return out;
  });
  const negHollow = px.neg.center === px.neg.corner && px.neg.edge !== px.neg.corner;
  const posFilled = px.pos.center !== px.pos.corner && px.pos.center === px.pos.edge;
  check('first layer: a weight of -0.1 draws a hollow square and +0.1 a filled one', negHollow && posFilled, JSON.stringify(px));
  const text = await p.evaluate(() => document.querySelector('article').textContent.replace(/\s+/g, ' '));
  const old = ['pushes toward yes', '7 km', 'both sides of it', 'every time, so the loss', 'size of each step is the learning rate', 'is the slope for this knob', 'darker where'].filter((t) => text.includes(t));
  check('none of the corrected wordings remain', old.length === 0, old.join(' | ') || 'none found');
  const terms = await p.$$eval('#glossary-rows li', (li) => li.length);
  check('glossary has 16 terms', terms === 16, `${terms} terms`);
  await ctx.close();
}

// ---------- reduced motion: nothing runs without input
{
  const { ctx, p, errors } = await open({ motion: 'reduce' });
  await mountAll(p);
  await p.waitForTimeout(1000);
  const before = await p.evaluate(() => ({ raf: window.__raf, net: __debug.playground.model.net.steps, valley: document.querySelector('#valley-caption').textContent }));
  await p.waitForTimeout(3000);
  const after = await p.evaluate(() => ({ raf: window.__raf, net: __debug.playground.model.net.steps, valley: document.querySelector('#valley-caption').textContent }));
  check('reduced motion: no animation frames and no training for 3 s without input', after.raf === before.raf && after.net === 0 && after.valley === before.valley, `frames ${before.raf} -> ${after.raf}, network steps ${after.net}, valley "${after.valley.trim()}"`);
  await btn(p, '#net-controls', 'train 300 steps');
  const net = await p.evaluate(() => __debug.playground.model.net.steps);
  check('reduced motion: train runs 300 steps in one press', net === 300, `${net} steps`);
  check('reduced motion: no console errors', errors.length === 0, errors.join(' | ') || 'none');
  await ctx.close();
}
{
  const { ctx, p } = await open();
  await mountAll(p);
  await p.waitForTimeout(1500);
  const r0 = await p.evaluate(() => window.__raf);
  await p.waitForTimeout(3000);
  const r1 = await p.evaluate(() => window.__raf);
  info(`with motion allowed and no input, the page asked for ${r1 - r0} animation frames in 3 s`);
  await ctx.close();
}

log(failures ? `${failures} check(s) failed` : 'all checks passed');
fs.writeFileSync(path.join(out, 'check-output.txt'), lines.join('\n') + '\n');
await browser.close();
server.close();
process.exit(failures ? 1 : 0);
