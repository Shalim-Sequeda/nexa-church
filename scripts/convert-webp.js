import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const assetsDir = path.resolve('landing/assets');

async function convert() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox'],
  });

  const files = [
    { src: 'nexa-ui-4k.png', out4k: 'nexa-ui-4k.webp', out1080: 'nexa-ui-1080p.webp' },
    { src: 'sec3-screen-4k.png', out4k: 'sec3-screen-4k.webp', out1080: 'sec3-screen-1080p.webp' },
  ];

  for (const f of files) {
    const srcPath = path.join(assetsDir, f.src);
    const fileUrl = 'file:///' + srcPath.replace(/\\/g, '/');

    // 1. 4K WebP
    const page4k = await browser.newPage();
    await page4k.setViewport({ width: 3840, height: 2160, deviceScaleFactor: 1 });
    await page4k.goto(fileUrl);
    await page4k.screenshot({
      path: path.join(assetsDir, f.out4k),
      type: 'webp',
      quality: 95,
    });
    await page4k.close();

    // 2. 1080p WebP
    const page1080 = await browser.newPage();
    await page1080.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await page1080.goto(fileUrl);
    await page1080.screenshot({
      path: path.join(assetsDir, f.out1080),
      type: 'webp',
      quality: 90,
    });
    await page1080.close();
  }

  await browser.close();
  console.log('WebP conversions complete.');
}

convert().catch(console.error);
