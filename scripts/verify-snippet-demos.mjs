import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const cache = path.join(os.homedir(), '.cache');
const evidence =
  process.env.SNIPPETS_EVIDENCE_DIR ?? path.join(cache, 'ai-series/snippets-evidence/round-2');
const playwright =
  process.env.PLAYWRIGHT_CORE_PATH ??
  path.join(cache, 'ai-series/pw/node_modules/playwright-core/index.mjs');
const executablePath =
  process.env.CHROMIUM_PATH ??
  path.join(cache, 'ms-playwright/chromium-1243/chrome-linux64/chrome');
const { chromium } = await import(pathToFileURL(playwright).href);
const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
const report = { receipt: [], playground: [], pageErrors: [] };
const phase = process.argv[2] ?? 'after';
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  page.on('pageerror', (error) => report.pageErrors.push(error.message));
  await page.goto('http://127.0.0.1:3293/notes/how-a-machine-learns', { waitUntil: 'networkidle' });
  const taxi = page.getByRole('figure', {
    name: 'Eight taxi rides and the fare line your two settings make',
    exact: true,
  });
  const receipt = page.getByRole('figure', {
    name: "One taxi ride's loss, worked out line by line like a receipt",
    exact: true,
  });
  const playground = page.getByRole('figure', {
    name: 'A small network learning to fence in the comfortable days',
    exact: true,
  });
  for (const rule of [
    { fee: 2, price: 2.5 },
    { fee: 4, price: 1.5 },
  ]) {
    await taxi.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('.demo')?.dataset.phase === 'ready');
    for (const [name, amount] of [
      ['Starting fee', rule.fee],
      ['Price per km', rule.price],
    ]) {
      await taxi.getByRole('slider', { name, exact: true }).fill(String(amount));
    }
    await receipt.scrollIntoViewIfNeeded();
    await receipt.locator('[data-amount]').first().waitFor();
    await receipt.getByRole('button', { name: 'Backward', exact: true }).click();
    await receipt.locator('[data-slope]').first().waitFor();
    await receipt.getByRole('button', { name: 'Nudge', exact: true }).click();
    report.receipt.push({
      rule,
      table: await receipt.locator('table.demo-receipt-live').innerText(),
      nudge: await receipt.locator('dl').innerText(),
      amounts: await receipt
        .locator('[data-amount]')
        .evaluateAll((rows) =>
          rows.map((row) => ({ amount: row.dataset.amount, slope: row.dataset.slope })),
        ),
    });
  }
  await playground.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => window.__playground?.state.name === 'days');
  for (const dataset of ['days', 'switches', 'groups', 'spiral']) {
    if (dataset !== 'days')
      await playground.getByRole('button', { name: dataset, exact: true }).click();
    for (let steps = 0; steps <= 10; steps++) {
      if (steps) await playground.getByRole('button', { name: 'Step', exact: true }).click();
      await page.waitForFunction((steps) => window.__playground.state.steps === steps, steps);
      if (steps === 0 || steps === 1 || steps === 10) {
        report.playground.push({
          dataset,
          steps,
          caption: await playground.locator('.demo-caption').innerText(),
          state: await page.evaluate(() => window.__playground.state),
        });
      }
    }
  }
  assert.deepEqual(report.pageErrors, []);
  if (phase === 'after') {
    const before = JSON.parse(await fs.readFile(path.join(evidence, 'demos-before.json'), 'utf8'));
    assert.deepEqual(report, before);
  }
  await fs.writeFile(
    path.join(evidence, `demos-${phase}.json`),
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
