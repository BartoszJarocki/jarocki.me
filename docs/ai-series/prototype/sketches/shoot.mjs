import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
const out = path.join(dir, 'shots');
fs.mkdirSync(out, { recursive: true });
const page = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const skeleton = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light;padding:env(safe-area-inset-top,0) 0 env(safe-area-inset-bottom,0)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${page}</body></html>`;
const server = http.createServer((_, res) => res.end(skeleton)).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({
  executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const only = process.argv[3];
const results = [];
const report = (name, ok, detail = '') => results.push(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `  ${detail}` : ''}`);

async function open(sketch, { width, height, scheme, motion = 'no-preference', scale = 1 }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
    colorScheme: scheme,
    reducedMotion: motion,
  });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await p.goto(`${url}#${sketch}`);
  await p.evaluate(() => document.fonts.ready);
  return { ctx, p, errors };
}
const steps = (p) => p.evaluate(() => window.__debug.model.net.steps);

// Every element that paints its own text, checked against every drawing surface.
const overlaps = (p) =>
  p.evaluate(() => {
    const draws = [...document.querySelectorAll('canvas, .stage3d')].filter((e) => e.offsetParent);
    const texts = [...document.querySelectorAll('body *')].filter(
      (e) =>
        e.offsetParent &&
        !draws.includes(e) &&
        [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()),
    );
    const hits = [];
    for (const t of texts)
      for (const d of draws) {
        const a = t.getBoundingClientRect();
        const b = d.getBoundingClientRect();
        if (a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom)
          hits.push(`${t.tagName}.${t.className}: "${t.textContent.trim().slice(0, 30)}" over ${d.id || d.className}`);
      }
    return hits;
  });

if (only === 'extras') {
  const shot = (p, name) => p.locator('figure.demo:visible').screenshot({ path: path.join(out, `${name}.png`) });
  for (const scheme of ['light', 'dark']) {
    const { ctx, p, errors } = await open('a', { width: 1440, height: 900, scheme });
    await p.waitForTimeout(4000);
    await shot(p, `a-terraces-${scheme}`);
    for (const lr of ['0.38', '0.43']) {
      await p.click(`#a-controls button:text-is("${lr}")`);
      await p.click('#a-controls button:text-is("restart")');
      await p.waitForTimeout(4500);
      await shot(p, `a-lr-${lr}-${scheme}`);
    }
    await p.click('#a-controls button:text-is("0.12")');
    for (const mode of ['columns', 'wire']) {
      await p.click(`#a-controls button:text-is("${mode}")`);
      await p.click('#a-controls button:text-is("restart")');
      await p.waitForTimeout(3000);
      await shot(p, `a-${mode}-${scheme}`);
    }
    report(`extras a ${scheme} no errors`, errors.length === 0, errors.join('; '));
    await ctx.close();
  }
  {
    const { ctx, p, errors } = await open('b', { width: 1440, height: 900, scheme: 'light' });
    await p.waitForTimeout(3000);
    const box = await p.locator('#b-hinton').boundingBox();
    await p.mouse.move(box.x + 40, box.y + 18 + 28 * 2 + 14);
    await p.waitForTimeout(200);
    await shot(p, 'b-hover-row');
    await p.click('#b-controls button:text-is("spiral")');
    await p.waitForTimeout(12000);
    await shot(p, 'b-spiral-12s');
    report('extras b no errors', errors.length === 0, errors.join('; '));
    await ctx.close();
  }
  {
    const { ctx, p, errors } = await open('c', { width: 1440, height: 900, scheme: 'light' });
    await p.waitForTimeout(4000);
    await p.click('#c-controls button:text-is("pause")');
    const box = await p.locator('#c-inset').boundingBox();
    await p.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.25);
    await p.waitForTimeout(300);
    await shot(p, 'c-hollow-input');
    const stage = await p.locator('#c-stage').boundingBox();
    await p.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 2);
    await p.mouse.down();
    await p.mouse.move(stage.x + stage.width / 2 - 120, stage.y + stage.height / 2 + 60, { steps: 8 });
    await p.mouse.up();
    await p.waitForTimeout(800);
    await shot(p, 'c-turned');
    report('extras c no errors', errors.length === 0, errors.join('; '));
    await ctx.close();
  }
  console.log(results.join('\n'));
  await browser.close();
  server.close();
  process.exit(0);
}

for (const sketch of ['a', 'b', 'c']) {
  if (only && !only.includes(sketch)) continue;
  for (const [w, h, scale] of [
    [1440, 900, 1],
    [390, 844, 2],
  ])
    for (const scheme of ['light', 'dark']) {
      const name = `${sketch}-${w}-${scheme}`;
      const { ctx, p, errors } = await open(sketch, { width: w, height: h, scheme, scale });
      await p.evaluate(() => document.querySelector('.demo:not([hidden] *)')?.scrollIntoView({ block: 'center' }));
      await p.waitForTimeout(5000);
      await p.evaluate(() => scrollTo(0, 0));
      await p.waitForTimeout(300);
      await p.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
      const scroll = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      report(`${name} no horizontal scroll`, scroll <= 0, `overflow ${scroll}px`);
      const hits = await overlaps(p);
      report(`${name} no text over drawings`, hits.length === 0, hits.join('; '));
      report(`${name} no errors`, errors.length === 0, errors.join('; '));
      if (sketch !== 'a') report(`${name} trained`, (await steps(p)) > 50, `${await steps(p)} steps`);
      await ctx.close();
    }
}

if (!only) {
  for (const sketch of ['a', 'b', 'c']) {
    const { ctx, p } = await open(sketch, { width: 1440, height: 900, scheme: 'light', motion: 'reduce' });
    await p.waitForTimeout(3000);
    const cap = await p.textContent(`#${sketch}-caption`);
    report(`reduced ${sketch}: idle after 3s`, sketch === 'a' ? /step 0\b/.test(cap) : (await steps(p)) === 0, cap.trim());
    if (sketch === 'b') {
      await p.click('#b-controls button:text("+300 steps")');
      await p.waitForTimeout(200);
      report('reduced b: button trains 300 at once', (await steps(p)) === 300, `${await steps(p)} steps`);
      await p.screenshot({ path: path.join(out, 'b-reduced-after-300.png'), fullPage: true });
    }
    if (sketch === 'a') {
      await p.waitForTimeout(500);
      await p.click('#a-controls button:text("+25 steps")');
      await p.waitForTimeout(300);
      report('reduced a: button steps 25 at once', /step 25\b/.test(await p.textContent('#a-caption')), (await p.textContent('#a-caption')).trim());
    }
    await ctx.close();
  }

  {
    const { ctx, p } = await open('b', { width: 1440, height: 900, scheme: 'light' });
    await p.waitForTimeout(2000);
    await p.click('button[data-show="a"]');
    const s1 = await steps(p);
    await p.waitForTimeout(1500);
    const s2 = await steps(p);
    report('b pauses while sketch a is shown', s1 === s2, `${s1} -> ${s2}`);
    await p.click('button[data-show="b"]');
    await p.waitForTimeout(1000);
    const s3 = await steps(p);
    report('b resumes when shown again', s3 > s2, `${s2} -> ${s3}`);
    await p.setViewportSize({ width: 1440, height: 300 });
    await p.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(500);
    const s4 = await steps(p);
    await p.waitForTimeout(1500);
    const s5 = await steps(p);
    report('b pauses while scrolled off screen', s4 === s5, `${s4} -> ${s5}`);
    await ctx.close();
  }

  for (const sketch of ['a', 'c']) {
    const { ctx, p } = await open(sketch, { width: 1440, height: 900, scheme: 'light' });
    await p.waitForTimeout(3000);
    await p.emulateMedia({ colorScheme: 'dark' });
    await p.waitForTimeout(800);
    await p.screenshot({ path: path.join(out, `${sketch}-switched-to-dark.png`) });
    await ctx.close();
  }
}

console.log(results.join('\n'));
await browser.close();
server.close();
