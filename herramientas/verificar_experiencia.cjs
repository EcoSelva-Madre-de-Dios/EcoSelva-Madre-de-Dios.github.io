const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.argv[2] || 'http://127.0.0.1:8765/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await page.goto(new URL('index.html', base).href, { waitUntil: 'domcontentloaded' });
  await page.locator('.eco-search-trigger').waitFor();
  assert.equal(await page.locator('link[rel="manifest"]').count(), 1, 'Falta el manifiesto PWA');
  assert.equal(await page.evaluate(async () => (await fetch('/manifest.json')).ok), true, 'manifest.json no responde');
  assert.equal(await page.evaluate(async () => (await fetch('/service-worker.js')).ok), true, 'service-worker.js no responde');

  await page.locator('.eco-search-trigger').click();
  const dialog = page.locator('.eco-search-dialog');
  assert.equal(await dialog.evaluate(node => node.open), true, 'La búsqueda global no abre');
  await dialog.locator('input[type="search"]').fill('aguaje');
  await page.waitForTimeout(120);
  assert((await dialog.locator('.eco-search-result').count()) > 0, 'La búsqueda no encuentra aguaje');
  await page.keyboard.press('Escape');
  assert.equal(await dialog.evaluate(node => node.open), false, 'Escape no cierra la búsqueda');

  const faunaTab = page.getByRole('tab', { name: /fauna/i });
  await faunaTab.click();
  const chart = page.locator('.selva-fauna-comparacion');
  await chart.waitFor();
  assert.equal(await chart.locator('.selva-fauna-comparacion-fila').count(), 4, 'La comparación de fauna debe mostrar cuatro grupos');
  assert((await chart.textContent()).includes('no abundancia'), 'La comparación debe aclarar su alcance');

  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(new URL('territorio.html', base).href, { waitUntil: 'domcontentloaded' });
  const canvas = mobilePage.locator('.selva-territorio-canvas');
  await canvas.scrollIntoViewIfNeeded();
  await mobilePage.locator('.selva-territorio-svg').waitFor({ timeout: 10000 });
  const toggle = mobilePage.locator('.territorio-gesto-toggle');
  await toggle.waitFor();
  const before = await canvas.evaluate(node => getComputedStyle(node).touchAction);
  assert(before.includes('pan-y'), 'El mapa móvil debe permitir scroll vertical por defecto');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-pressed'), 'true', 'El modo mover mapa no se activa');
  const after = await canvas.evaluate(node => getComputedStyle(node).touchAction);
  assert.equal(after, 'none', 'El modo mover mapa debe reservar el gesto al atlas');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-pressed'), 'false', 'El usuario debe poder volver al scroll de página');

  const layers = mobilePage.locator('.territorio-capas-opciones');
  const layerBox = await layers.boundingBox();
  assert(layerBox && layerBox.height < 320, 'Las capas móviles ocupan demasiado alto');

  await mobile.close();
  await browser.close();
  console.log('Correcto: búsqueda global, PWA, comparación de fauna y gestos móviles.');
})().catch(async error => {
  console.error(error);
  process.exitCode = 1;
});
