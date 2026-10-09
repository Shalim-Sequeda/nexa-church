import puppeteer from 'puppeteer-core';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const refPath = 'C:/Users/Shalim/.gemini/antigravity/brain/4820bcd5-03ab-497f-967c-381e0b8cf465/.user_uploaded/media_1791479184256_a81e514b.jpg';

async function cropCleanStage() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1200, deviceScaleFactor: 2 });
  const fileUrl = 'file:///' + refPath.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // In the reference image:
  // Above the desktop laptop (y: 0 to 140, x: 260 to 680)
  // And behind the mobile phone top (y: 0 to 200, x: 680 to 973)
  // Let's create an HTML canvas that stitches the clean stage lighting and hands seamlessly into a wide banner!
  const bannerPage = await browser.newPage();
  await bannerPage.setViewport({ width: 1920, height: 750, deviceScaleFactor: 1 });

  await bannerPage.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; background: #050505; overflow: hidden; }
        .wrapper {
          position: relative;
          width: 1920px;
          height: 750px;
          background: #050505;
        }
        /* Crop clean stage region from ref */
        .stage-crop {
          position: absolute;
          top: 0;
          right: 0;
          width: 1400px;
          height: 750px;
          overflow: hidden;
        }
        .stage-img {
          position: absolute;
          top: 0;
          right: 0;
          width: 1700px;
          height: auto;
          /* Filter to give deep blacks and rich vibrant reds */
          filter: contrast(1.15) brightness(1.05);
        }
        /* Fade to pure black on the left and bottom */
        .fade-left {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, #050505 0%, #050505 35%, rgba(5,5,5,0.85) 55%, transparent 80%);
        }
        .fade-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 250px;
          background: linear-gradient(to top, #050505 0%, rgba(5,5,5,0.7) 50%, transparent 100%);
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="stage-crop">
          <img class="stage-img" src="${fileUrl}" />
          <div class="fade-left"></div>
          <div class="fade-bottom"></div>
        </div>
      </div>
    </body>
    </html>
  `);

  await new Promise(r => setTimeout(r, 600));

  await bannerPage.screenshot({
    path: 'landing/assets/clean-church-stage.jpg',
    type: 'jpeg',
    quality: 95,
  });

  console.log('Saved clean-church-stage.jpg');
  await browser.close();
}

cropCleanStage().catch(console.error);
