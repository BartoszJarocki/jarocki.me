import core from 'puppeteer-core';
import { getOptions } from './chrome-options';

let cachedPage: core.Page | null;
async function getPage() {
  if (cachedPage) {
    return cachedPage;
  }
  const options = await getOptions();
  const browser = await core.launch(options);
  cachedPage = await browser.newPage();
  return cachedPage;
}

export async function renderScreenshot({
  html,
  width,
  height,
  type = 'png',
}: {
  html: string;
  width: number;
  height: number;
  type?: 'png' | 'jpeg' | 'webp';
}) {
  const page = await getPage();
  await page.setViewport({ width, height });
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    // Wait until all images and fonts have loaded
    const selectors = Array.from(document.querySelectorAll('img'));
    await Promise.all([
      document.fonts.ready,
      ...selectors.map((img) => {
        // Image has already finished loading, let’s see if it worked
        if (img.complete) {
          // Image loaded and has presence
          if (img.naturalHeight !== 0) return;
          // Image failed, so it has no height
          throw new Error('Image failed to load');
        }
        // Image hasn’t loaded yet, added an event listener to know when it does
        return new Promise((resolve, reject) => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', reject);
        });
      }),
    ]);
  });

  return page.screenshot({ type });
}
