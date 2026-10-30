const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.argv[2] || 'http://127.0.0.1:8765/';
const pages = [
  'index.html',
  'territorio.html',
  'ambiente.html',
  'flora.html',
  'historia.html',
  'areas-protegidas.html',
  'biblioteca.html',
  'fuentes-metodologia.html',
  'fichas/castana.html'
];

const assertStaticResources = async () => {
  for (const name of pages) {
    const response = await fetch(new URL(name, base));
    assert.equal(response.ok, true, `No responde ${name}`);
    const html = await response.text();
    assert.match(html, /<link\s+rel="manifest"\s+href="(?:\.\.\/)?manifest\.json">/, `Falta manifiesto estático en ${name}`);
    assert.match(html, /class="eco-search-trigger"/, `Falta disparador de búsqueda estático en ${name}`);

    const references = [...html.matchAll(/(?:href|src)="([^"]+\.(?:css|js)(?:\?[^"]*)?)"/g)].map(match => match[1]);
    for (const reference of references) {
      const target = new URL(reference, new URL(name, base));
      if (target.origin !== new URL(base).origin) continue;
      assert.equal(target.searchParams.getAll('v').length, 1, `Versionado de asset inválido en ${name}: ${reference}`);
    }
  }
};

(async () => {
  await assertStaticResources();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await page.goto(new URL('index.html', base).href, { waitUntil: 'domcontentloaded' });
  const searchTrigger = page.locator('.eco-search-trigger');
  await searchTrigger.waitFor();
  assert.equal(await searchTrigger.getAttribute('aria-controls'), 'eco-search-dialog', 'La búsqueda debe relacionar botón y diálogo');
  assert.equal(await searchTrigger.getAttribute('aria-expanded'), 'false', 'La búsqueda debe iniciar cerrada');
  assert.equal(await page.locator('link[rel="manifest"]').count(), 1, 'Falta el manifiesto PWA');
  assert.equal(await page.evaluate(async () => (await fetch('/manifest.json')).ok), true, 'manifest.json no responde');
  assert.equal(await page.evaluate(async () => (await fetch('/service-worker.js')).ok), true, 'service-worker.js no responde');

  await searchTrigger.click();
  const dialog = page.locator('.eco-search-dialog');
  assert.equal(await dialog.evaluate(node => node.open), true, 'La búsqueda global no abre');
  assert.equal(await searchTrigger.getAttribute('aria-expanded'), 'true', 'El botón no refleja la búsqueda abierta');
  const searchInput = dialog.locator('input[type="search"]');
  assert.equal(await searchInput.getAttribute('role'), 'combobox', 'El campo de búsqueda debe exponer semántica combobox');
  await searchInput.fill('aguaje');
  await page.waitForTimeout(120);
  assert((await dialog.locator('.eco-search-result').count()) > 0, 'La búsqueda no encuentra aguaje');
  assert(await searchInput.getAttribute('aria-activedescendant'), 'La búsqueda debe anunciar el resultado activo');
  await page.keyboard.press('Escape');
  assert.equal(await dialog.evaluate(node => node.open), false, 'Escape no cierra la búsqueda');
  assert.equal(await searchTrigger.getAttribute('aria-expanded'), 'false', 'El botón no refleja la búsqueda cerrada');

  const faunaTab = page.getByRole('tab', { name: /fauna/i });
  await faunaTab.click();
  const chart = page.locator('.selva-fauna-comparacion');
  await chart.waitFor();
  assert.equal(await chart.locator('.selva-fauna-comparacion-fila').count(), 4, 'La comparación de fauna debe mostrar cuatro grupos');
  assert((await chart.textContent()).includes('no abundancia'), 'La comparación debe aclarar su alcance');

  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), true, 'El service worker no controla la página de prueba');

  const offlineResources = [
    '/historia.html',
    '/historia.css',
    '/areas-protegidas.html',
    '/areas-protegidas.css',
    '/fichas/castana.html',
    '/fichas/ficha.css'
  ];
  await context.setOffline(true);
  for (const resource of offlineResources) {
    const ok = await page.evaluate(async path => {
      try { return (await fetch(path)).ok; } catch { return false; }
    }, resource);
    assert.equal(ok, true, `Recurso esencial no disponible offline: ${resource}`);
  }
  await context.setOffline(false);
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
  console.log('Correcto: recursos globales, búsqueda, PWA offline, comparación de fauna y gestos móviles.');
})().catch(async error => {
  console.error(error);
  process.exitCode = 1;
});
