import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function run() {
  console.log('================================================================');
  console.log('   NEXA CHURCH — CAPTURAS NATIVAS CON FONDOS REALES Y 4K / 5K');
  console.log('================================================================');
  
  console.log('[1/5] Iniciando servidor Vite en puerto 1422...');
  const server = await createServer({
    root: projectRoot,
    server: {
      port: 1422,
      strictPort: true,
    },
    logLevel: 'error',
  });
  await server.listen();
  const serverUrl = 'http://localhost:1422';

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--force-color-profile=srgb',
      '--font-render-hinting=max',
    ],
  });

  const outputDir = path.join(projectRoot, 'landing', 'assets');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const captures = [
    {
      name: '4K',
      width: 1600,
      height: 900,
      deviceScaleFactor: 2.4, // 1600*2.4 = 3840, 900*2.4 = 2160
      targetWidth: 3840,
      targetHeight: 2160,
    },
    {
      name: '5K',
      width: 1600,
      height: 900,
      deviceScaleFactor: 3.2, // 1600*3.2 = 5120, 900*3.2 = 2880
      targetWidth: 5120,
      targetHeight: 2880,
    },
  ];

  for (const config of captures) {
    console.log(`\n[2/5] Renderizando ${config.name} (${config.targetWidth}x${config.targetHeight})...`);
    const page = await browser.newPage();
    await page.setViewport({
      width: config.width,
      height: config.height,
      deviceScaleFactor: config.deviceScaleFactor,
    });

    // Inyectar el fondo real de la iglesia antes de que cargue el store
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('nexa_bible_background_image', '/america.png');
    });

    await page.goto(serverUrl, { waitUntil: 'networkidle0' });

    await page.waitForFunction(() => {
      return document.querySelector('header') !== null || document.querySelector('button') !== null;
    }, { timeout: 15000 });

    await new Promise((r) => setTimeout(r, 1200));

    // ==========================================
    // ESCENA 1: MOTOR BÍBLICO (Salmos 23:1) CON FONDO REAL AMERICA.PNG
    // ==========================================
    console.log(`[3/5] Configurando Escena 1 (Motor Bíblico + Fondo Real América)...`);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const bibliaBtn = buttons.find((b) => b.innerText.includes('BIBLIA'));
      if (bibliaBtn) bibliaBtn.click();
    });

    await new Promise((r) => setTimeout(r, 500));

    // Asegurar que el fondo esté seleccionado y enviar a Preview
    await page.evaluate(() => {
      // Si la función bibleStore está accesible o mediante clic
      const buttons = Array.from(document.querySelectorAll('button'));
      const previewBtn = buttons.find((b) => b.innerText.includes('Preview') || b.innerText.includes('A Preview'));
      if (previewBtn) previewBtn.click();
    });

    await new Promise((r) => setTimeout(r, 800));

    const bibliaPath = path.join(outputDir, `nexa-ui-${config.name.toLowerCase()}.png`);
    console.log(`[3/5] Guardando captura ${config.name} -> ${bibliaPath}`);
    await page.screenshot({
      path: bibliaPath,
      type: 'png',
      omitBackground: false,
    });

    if (config.name === '4K') {
      fs.copyFileSync(bibliaPath, path.join(outputDir, 'nexa-ui.png'));
    }

    // ==========================================
    // ESCENA 2: CUES DE PRODUCCIÓN & EMISIÓN EN VIVO
    // ==========================================
    console.log(`[4/5] Configurando Escena 2 (Cues en Vivo con fondo)...`);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const cuesBtn = buttons.find((b) => b.innerText.includes('CUES'));
      if (cuesBtn) cuesBtn.click();
    });

    await new Promise((r) => setTimeout(r, 500));

    // Enviar a Live
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const takeBtn = buttons.find((b) => b.innerText.includes('TAKE') || b.innerText.includes('TAKE / LIVE'));
      if (takeBtn) takeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Seleccionar Salmos para Preview
    await page.evaluate(() => {
      const cueItems = Array.from(document.querySelectorAll('[data-cue-id], div[class*="cursor-pointer"]'));
      const salmoCue = cueItems.find((c) => c.innerText.includes('Salmos') || c.innerText.includes('04'));
      if (salmoCue) salmoCue.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const livePath = path.join(outputDir, `sec3-screen-${config.name.toLowerCase()}.png`);
    console.log(`[4/5] Guardando captura ${config.name} -> ${livePath}`);
    await page.screenshot({
      path: livePath,
      type: 'png',
      omitBackground: false,
    });

    if (config.name === '4K') {
      fs.copyFileSync(livePath, path.join(outputDir, 'sec3-screen.png'));
    }

    await page.close();
  }

  await browser.close();
  await server.close();
  console.log('\n[5/5] ¡Capturas completadas!');
}

run().catch((err) => {
  console.error('Error generando capturas:', err);
  process.exit(1);
});
