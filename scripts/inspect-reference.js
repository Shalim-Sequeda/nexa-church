import puppeteer from 'puppeteer-core';
import path from 'path';
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
  const fileUrl = 'file:///' + refPath.replace(/\\/g, '/');

  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  const dims = await page.evaluate(() => {
    const img = document.querySelector('img');
    return {
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    };
  });
  console.log('Reference dimensions:', dims);
  await browser.close();
}

main().catch(console.error);
