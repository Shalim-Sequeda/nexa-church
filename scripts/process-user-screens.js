import puppeteer from 'puppeteer-core';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const assetsDir = path.resolve('landing/assets');

async function processScreens() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox'],
  });

  const screens = [
    { src: 'hero-screen.png', webp: 'hero-screen.webp', png2x: 'hero-screen-2x.png', width: 1024, height: 576 },
    { src: 'sec2-screen.png', webp: 'sec2-screen.webp', png2x: 'sec2-screen-2x.png', width: 1024, height: 576 },
    { src: 'sec3-screen.png', webp: 'sec3-screen.webp', png2x: 'sec3-screen-2x.png', width: 1024, height: 536 },
  ];

  for (const s of screens) {
    const srcPath = path.join(assetsDir, s.src);
    const fileUrl = 'file:///' + srcPath.replace(/\\/g, '/');

    // 1. Generate WebP at native
    const page = await browser.newPage();
    await page.setViewport({ width: s.width, height: s.height, deviceScaleFactor: 1 });
    await page.goto(fileUrl);
    await page.screenshot({
      path: path.join(assetsDir, s.webp),
      type: 'webp',
      quality: 95,
    });

    // 2. Generate 2x WebP / PNG for Retina / Zoom
    await page.setViewport({ width: s.width, height: s.height, deviceScaleFactor: 2 });
    await page.screenshot({
      path: path.join(assetsDir, s.png2x),
      type: 'png',
    });
    await page.close();
  }

  await browser.close();
  console.log('Screens processed successfully.');
}

processScreens().catch(console.error);
