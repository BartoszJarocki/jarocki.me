const puppeteer = require('puppeteer-core');
import { getOptions } from './chrome-options';

async function getPage() {
  const options = await getOptions();
  const browser = await puppeteer.launch(options);

  return {
    browser,
    page: await browser.newPage(),
  };
}

export async function getScreenshot({
  html,
  width,
  height,
  type = 'png',
}: {
  html: string;
  width: number;
  height: number;
  type?: string;
}) {
  const { page, browser } = await getPage();
  await page.setViewport({ width, height });
  await page.setContent(html, { waitUntil: 'networkidle2' });

  const screenshot = await page.screenshot({ type });

  await browser.close();

  return screenshot;
}
