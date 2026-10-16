import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const cache = path.join(os.homedir(), '.cache');
const evidence =
  process.env.SNIPPETS_EVIDENCE_DIR ?? path.join(cache, 'ai-series/snippets-evidence');
const playwright =
  process.env.PLAYWRIGHT_CORE_PATH ??
  path.join(cache, 'ai-series/pw/node_modules/playwright-core/index.mjs');
const executablePath =
  process.env.CHROMIUM_PATH ??
  path.join(cache, 'ms-playwright/chromium-1243/chrome-linux64/chrome');
const { chromium } = await import(pathToFileURL(playwright).href);
const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
const slugs = ['how-a-machine-learns', 'words-as-numbers', 'paying-attention'];
const report = { notes: [], screenshots: [], pageErrors: [], horizontalOverflow: [] };
await fs.mkdir(evidence, { recursive: true });

async function visit(page, slug) {
  page.on('pageerror', (error) => report.pageErrors.push(`${slug}: ${error.message}`));
  await page.goto(`http://127.0.0.1:3293/notes/${slug}`, { waitUntil: 'networkidle' });
}

async function expectOutput(block, expected) {
  await block.getByRole('button', { name: /^run$/i }).waitFor();
  const output = await block.locator('.snippet-output').textContent();
  assert.equal(output, expected);
}

async function run(block, expected) {
  await block.getByRole('button', { name: /^run$/i }).click();
  await expectOutput(block, expected);
}

async function tabTo(page, predicate) {
  for (let i = 0; i < 250; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(predicate)) return;
  }
  throw new Error('Could not reach snippet with the keyboard');
}

async function noOverflow(page) {
  const overflow = await page.evaluate(() => {
    const found = [];
    if (document.documentElement.scrollWidth > innerWidth) found.push('page');
    for (const element of document.querySelectorAll('.snippet pre, .snippet textarea')) {
      if (element.scrollWidth > element.clientWidth + 1) found.push(element.tagName);
    }
    return found;
  });
  report.horizontalOverflow.push(...overflow);
  assert.deepEqual(overflow, []);
}

try {
  for (const slug of slugs) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      colorScheme: 'dark',
    });
    await visit(page, slug);
    const blocks = page.locator('.snippet');
    const note = { slug, snippets: [], keyboard: false, edit: false, timeoutMs: null };
    const expectedCount = slug === slugs[0] ? 3 : slug === slugs[1] ? 8 : 2;
    assert.equal(await blocks.count(), expectedCount);
    for (const block of await blocks.all()) {
      const file = await block.getAttribute('data-snippet');
      const source = await fs.readFile(file, 'utf8');
      const output = [];
      new Function('console', source)({ log: (...args) => output.push(args.join(' ')) });
      assert.equal(await block.locator('pre').first().textContent(), source.trimEnd());
      await run(block, output.join('\n'));
      note.snippets.push({ file, lines: source.trimEnd().split('\n').length, output });
    }
    const first = blocks.first();
    await first.getByRole('button', { name: /^edit$/i }).click();
    await first
      .getByRole('textbox', { name: 'Snippet source' })
      .fill("console.log('Edited snippet');");
    await run(first, 'Edited snippet');
    note.edit = true;
    if (slug === slugs[0]) {
      await first
        .getByRole('textbox', { name: 'Snippet source' })
        .fill("throw new Error('Example error');");
      await run(first, 'Error: Example error');
      await first
        .getByRole('textbox', { name: 'Snippet source' })
        .fill('for (let i = 0; i < 500; i++) console.log(i);');
      await run(
        first,
        [...Array.from({ length: 199 }, (_, i) => String(i)), 'Output stopped at 200 lines.'].join(
          '\n',
        ),
      );
    }
    await first.getByRole('textbox', { name: 'Snippet source' }).fill('while (true) {}');
    const before = Date.now();
    await run(first, 'Stopped after 5 seconds.');
    note.timeoutMs = Date.now() - before;
    assert.ok(note.timeoutMs >= 4900 && note.timeoutMs < 8000);
    await first.getByRole('button', { name: /^reset$/i }).click();
    assert.equal(
      await first.locator('pre').first().textContent(),
      (await fs.readFile(note.snippets[0].file, 'utf8')).trimEnd(),
    );

    // Start at the top of a fresh page, then use only the keyboard through Run, Edit, and Reset.
    await page.reload({ waitUntil: 'networkidle' });
    await tabTo(page, () => {
      const el = document.activeElement;
      return el?.tagName === 'BUTTON' && el.textContent === 'Run' && !!el.closest('.snippet');
    });
    await page.keyboard.press('Enter');
    await expectOutput(first, note.snippets[0].output.join('\n'));
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').textContent(), 'Edit');
    await page.keyboard.press('Space');
    assert.equal(await page.locator(':focus').getAttribute('aria-label'), 'Snippet source');
    await page.keyboard.press('Control+A');
    await page.keyboard.type("console.log('Keyboard edit');");
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').textContent(), 'Run');
    await page.keyboard.press('Enter');
    await expectOutput(first, 'Keyboard edit');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').textContent(), 'Reset');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator(':focus').textContent(), 'Edit');
    assert.equal(await first.getByRole('button', { name: /^reset$/i }).count(), 0);
    note.keyboard = true;
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: 'light' });
    await noOverflow(page);
    await first.getByRole('button', { name: /^edit$/i }).click();
    await noOverflow(page);
    report.notes.push(note);
    console.log(
      `${slug}: ${note.snippets.length} outputs, edit, timeout, keyboard, and mobile checks passed`,
    );
    await page.close();
  }

  for (const [width, colorScheme] of [
    [1440, 'dark'],
    [390, 'light'],
  ]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, colorScheme });
    await visit(page, slugs[0]);
    const block = page.locator('.snippet').nth(1);
    for (const state of ['before', 'after']) {
      if (state === 'after') await run(block, report.notes[0].snippets[1].output.join('\n'));
      await block.scrollIntoViewIfNeeded();
      const file = `network-${width}-${colorScheme}-${state}.png`;
      await block.screenshot({ path: path.join(evidence, file) });
      report.screenshots.push(file);
    }
    if (width === 390) await noOverflow(page);
    const colors = await block
      .locator('span[style]')
      .evaluateAll((spans) => [...new Set(spans.map((span) => getComputedStyle(span).color))]);
    assert.equal(colors.length, 3, 'Code uses three text tones');
    await page.close();
  }
  assert.deepEqual(report.pageErrors, []);
  await fs.writeFile(
    path.join(evidence, 'browser-proof.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
