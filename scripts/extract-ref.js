import puppeteer from 'puppeteer-core';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const refPath = 'C:/Users/Shalim/.gemini/antigravity/brain/4820bcd5-03ab-497f-967c-381e0b8cf465/.user_uploaded/media_1791479184256_a81e514b.jpg';

async function extract() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1200 });

  const fileUrl = 'file:///' + refPath.replace(/\\/g, '/');

  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // 1. Desktop hero area: x: 0, y: 0, width: 685, height: 430
  await page.screenshot({
    path: 'landing/assets/ref-hero.png',
    clip: { x: 0, y: 0, width: 685, height: 430 },
  });

  // 2. Desktop hero church atmosphere background behind laptop:
  // Let's inspect coordinates
  console.log('Saved ref-hero.png');

  await browser.close();
}

extract().catch(console.error);
