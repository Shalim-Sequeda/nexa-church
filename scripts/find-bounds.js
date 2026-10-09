import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const refPath = 'C:/Users/Shalim/.gemini/antigravity/brain/4820bcd5-03ab-497f-967c-381e0b8cf465/.user_uploaded/media_1791479184256_a81e514b.jpg';

async function findBounds() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  const fileUrl = 'file:///' + refPath.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Let's test different x coordinates
  const crops = [
    { name: 'laptop-full-box', clip: { x: 410, y: 130, width: 270, height: 260 } },
    { name: 'laptop-with-bg', clip: { x: 350, y: 60, width: 330, height: 350 } },
  ];

  for (const c of crops) {
    await page.screenshot({
      path: `landing/assets/${c.name}.png`,
      clip: c.clip,
    });
  }

  await browser.close();
}

findBounds().catch(console.error);
