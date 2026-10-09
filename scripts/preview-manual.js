import puppeteer from 'puppeteer-core';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const manualHtml = path.resolve('landing/manual.html');

async function renderManual() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const fileUrl = 'file:///' + manualHtml.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Take screenshot of manual top
  await page.screenshot({
    path: 'landing/assets/manual-preview.png',
    clip: { x: 0, y: 0, width: 1440, height: 1000 },
  });

  await browser.close();
  console.log('Saved manual-preview.png');
}

renderManual().catch(console.error);
