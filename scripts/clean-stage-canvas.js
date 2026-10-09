import puppeteer from 'puppeteer-core';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const refPath = 'C:/Users/Shalim/.gemini/antigravity/brain/4820bcd5-03ab-497f-967c-381e0b8cf465/.user_uploaded/media_1791479184256_a81e514b.jpg';

async function makeCleanStage() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  const fileUrl = 'file:///' + refPath.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Use canvas to extract the stage lighting area (top-right of desktop mockup & top of mobile mockup)
  const base64Data = await page.evaluate(() => {
    const img = document.querySelector('img');
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');

    // Fill background with #050505
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Source coordinates from ref:
    // The clean stage is from x: 280, y: 0, width: 400, height: 230 (above the laptop)
    // And from x: 670, y: 0, width: 300, height: 230 (above the phone)
    // Let's draw the clean stage at the right of our canvas
    ctx.drawImage(img, 280, 0, 400, 230, 700, 0, 900, 520);

    // Fade to black on the left
    const gradLeft = ctx.createLinearGradient(0, 0, 1100, 0);
    gradLeft.addColorStop(0, '#050505');
    gradLeft.addColorStop(0.45, '#050505');
    gradLeft.addColorStop(0.75, 'rgba(5, 5, 5, 0.8)');
    gradLeft.addColorStop(1, 'rgba(5, 5, 5, 0)');
    ctx.fillStyle = gradLeft;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fade to black on the bottom
    const gradBottom = ctx.createLinearGradient(0, 300, 0, 700);
    gradBottom.addColorStop(0, 'rgba(5, 5, 5, 0)');
    gradBottom.addColorStop(0.6, 'rgba(5, 5, 5, 0.85)');
    gradBottom.addColorStop(1, '#050505');
    ctx.fillStyle = gradBottom;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.95);
  });

  const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
  fs.writeFileSync('landing/assets/clean-church-stage.jpg', buffer);
  console.log('Saved clean-church-stage.jpg using canvas');

  await browser.close();
}

makeCleanStage().catch(console.error);
