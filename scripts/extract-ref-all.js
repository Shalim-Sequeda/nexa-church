import puppeteer from 'puppeteer-core';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const refPath = 'C:/Users/Shalim/.gemini/antigravity/brain/4820bcd5-03ab-497f-967c-381e0b8cf465/.user_uploaded/media_1791479184256_a81e514b.jpg';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1200 });
  const fileUrl = 'file:///' + refPath.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // 1. Full Desktop Column (left side)
  await page.screenshot({
    path: 'landing/assets/ref-desktop-full.png',
    clip: { x: 0, y: 0, width: 680, height: 1024 },
  });

  // 2. Desktop Hero full section
  await page.screenshot({
    path: 'landing/assets/ref-hero-full.png',
    clip: { x: 0, y: 0, width: 680, height: 460 },
  });

  // 3. Desktop Hero Laptop specifically
  await page.screenshot({
    path: 'landing/assets/ref-laptop-hero.png',
    clip: { x: 360, y: 130, width: 315, height: 275 },
  });

  console.log('Done extracting reference sections');
  await browser.close();
}

main().catch(console.error);
