import puppeteer from 'puppeteer-core';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const landingHtml = path.resolve('landing/index.html');

async function fullView() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const fileUrl = 'file:///' + landingHtml.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Full page screenshot
  await page.screenshot({
    path: 'landing/assets/landing-full-scroll.png',
    fullPage: true,
  });

  await browser.close();
  console.log('Saved landing-full-scroll.png');
}

fullView().catch(console.error);
