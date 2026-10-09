import puppeteer from 'puppeteer-core';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const landingHtml = path.resolve('landing/index.html');

async function renderLanding() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const fileUrl = 'file:///' + landingHtml.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Take screenshot of Hero
  await page.screenshot({
    path: 'landing/assets/landing-hero-view.png',
    clip: { x: 0, y: 0, width: 1440, height: 850 },
  });

  // Take screenshot of Full Page
  await page.screenshot({
    path: 'landing/assets/landing-full-scroll.png',
    fullPage: true,
  });

  await browser.close();
  console.log('Saved landing-full-scroll.png');
}

renderLanding().catch(console.error);
