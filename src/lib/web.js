const puppeteer = require("puppeteer-core");
import { getOptions } from "./options";

async function getPage(isDev) {
  const options = await getOptions(isDev);
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
  type = "png",
  isDev,
}) {
  const { page, browser } = await getPage(isDev);
  await page.setViewport({ width, height });
  await page.setContent(html, { waitUntil: "networkidle2" });

  const screenshot = await page.screenshot({ type });

  await browser.close();

  return screenshot;
}
