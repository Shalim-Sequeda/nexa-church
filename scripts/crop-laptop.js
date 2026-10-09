import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const refPath = 'C:/Users/Shalim/.gemini/antigravity/brain/4820bcd5-03ab-497f-967c-381e0b8cf465/.user_uploaded/media_1791479184256_a81e514b.jpg';

async function cropLaptop() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 2 });
  const fileUrl = 'file:///' + refPath.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // In the reference image:
  // The laptop starts around x=330, y=125, width=345, height=270
  await page.screenshot({
    path: 'landing/assets/ref-laptop-hd.png',
    clip: { x: 330, y: 125, width: 345, height: 270 },
  });

  console.log('Saved ref-laptop-hd.png');
  await browser.close();
}

cropLaptop().catch(console.error);
