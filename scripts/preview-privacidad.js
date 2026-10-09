import puppeteer from 'puppeteer-core';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const privacidadHtml = path.resolve('landing/privacidad.html');

async function renderPrivacidad() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const fileUrl = 'file:///' + privacidadHtml.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  await page.screenshot({
    path: 'landing/assets/privacidad-preview.png',
    clip: { x: 0, y: 0, width: 1440, height: 950 },
  });

  await browser.close();
  console.log('Saved privacidad-preview.png');
}

renderPrivacidad().catch(console.error);
