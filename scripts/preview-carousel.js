import puppeteer from 'puppeteer-core';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const landingHtml = path.resolve('landing/index.html');

async function renderCarousel() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const fileUrl = 'file:///' + landingHtml.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Get bounding rect of #caracteristicas
  const rect = await page.evaluate(() => {
    const el = document.getElementById('caracteristicas');
    const { top, left, width, height } = el.getBoundingClientRect();
    return { top: top + window.scrollY, left, width, height };
  });

  await page.screenshot({
    path: 'landing/assets/carousel-preview.png',
    clip: { x: 0, y: Math.max(0, rect.top - 20), width: 1440, height: rect.height + 40 },
  });

  await browser.close();
  console.log('Saved carousel-preview.png');
}

renderCarousel().catch(console.error);
