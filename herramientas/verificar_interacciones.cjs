/* Prueba de navegador opcional: requiere playwright y @axe-core/playwright. */
const { chromium } = require('playwright');
const { default: AxeBuilder } = require('@axe-core/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.argv[2] || 'http://127.0.0.1:8765/';
const pages = ['index.html', 'flora.html', 'territorio.html', 'biblioteca.html', 'historia.html', 'areas-protegidas.html', 'fichas/castana.html', 'fuentes-metodologia.html'];
const results = [];
async function accessible(page, selector) {
    let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']);
    if (selector) builder = builder.include(selector);
    const result = await builder.analyze();
    assert.equal(result.violations.length, 0, JSON.stringify(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))));
}
(async () => {
    const browser = await chromium.launch();
    for (const width of [320, 390, 820, 1440]) {
        const context = await browser.newContext({ viewport: { width, height: 920 }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', response => {
            if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
        });
        for (const file of pages) {
            await page.goto(new URL(file, base).href);
            await page.evaluate(() => document.fonts.ready);
            assert.equal(await page.locator('h1').count(), 1, file + ': un título principal');
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, file + ': desborde horizontal a ' + width);
            if ([390, 1440].includes(width)) await accessible(page);
            if (file !== 'index.html') {
                const menu = page.locator('.eco-global-menu');
                await menu.locator('summary').click();
                assert(await menu.getByRole('link', { name: 'Historia', exact: true }).isVisible());
                assert(await menu.getByRole('link', { name: 'Áreas protegidas', exact: true }).isVisible());
                assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
                await page.keyboard.press('Escape');
                assert.equal(await menu.getAttribute('open'), null);
                assert(await menu.locator('summary').evaluate(e => document.activeElement === e));
            }
        }
        await page.goto(new URL('index.html', base).href);
        assert(await page.locator('a[href="mailto:ecoselvamadrededios@gmail.com"]').isVisible());
        const province = page.locator('.conoce-provincia').first();
        await province.locator('summary').click();
        assert.equal(await province.getAttribute('open'), '');
        assert(await province.locator('.conoce-detalle').isVisible());
        assert.equal(await page.locator('dialog[open]').count(), 0);
        await province.locator('summary').click();
        const menu = page.locator('label[for="menu"]');
        if (await menu.isVisible()) {
            await menu.click();
            await page.locator('.navbar summary').first().click();
            assert(await page.locator('.navbar a[href="historia.html"]').isVisible());
            assert(await page.locator('.navbar a[href="areas-protegidas.html"]').isVisible());
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#menu').isChecked(), false);
        }
        await page.locator('#selva-biodiversidad-tab-fauna').click();
        for (const group of ['mamiferos', 'aves', 'reptiles', 'anfibios']) {
            const trigger = page.locator(`[data-fauna-explorar="${group}"]`);
            await trigger.click();
            await page.locator('#selva-fauna-modal[open]').waitFor();
            assert.equal(await page.locator('.selva-fauna-especies li').count(), 3);
            await page.locator('.selva-fauna-conocer').first().click();
            assert(await page.locator('.selva-fauna-ficha').isVisible());
            await page.locator('.selva-fauna-volver').click();
            if ([390, 1440].includes(width)) await accessible(page, '#selva-fauna-modal');
            await page.keyboard.press('Escape');
            assert(await trigger.evaluate(e => e === document.activeElement));
        }
        await page.goto(new URL('flora.html', base).href);
        assert.equal(await page.locator('[data-flora-especie]').count(), 6);
        if (width === 1440) {
            const grid = page.locator('.flora-grid').filter({ has: page.locator('details') }).first();
            const cards = grid.locator(':scope > details');
            const heights = await cards.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
            await cards.first().locator('summary').click();
            const after = await cards.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
            assert(after[0] > heights[0]);
            for (let i = 1; i < heights.length; i++) assert(Math.abs(after[i] - heights[i]) < 1, 'Tarjeta vecina de Flora estirada');
        }
        for (const id of ['castana', 'madera', 'aguaje', 'paca', 'medicinal']) {
            await page.locator(`[data-flora-recurso="${id}"]`).click();
            assert(await page.locator(`#flora-caso-${id}`).isVisible());
            assert.equal(await page.locator(`#flora-caso-${id} .flora-pasos>li`).count(), 7);
        }
        await page.goto(new URL('index.html#flora-caso-aguaje', base).href);
        await page.waitForURL('**/flora.html#flora-caso-aguaje');
        assert(await page.locator('#flora-caso-aguaje').isVisible());
        await page.goto(new URL('territorio.html', base).href);
        await page.locator('.selva-territorio-svg').waitFor({ timeout: 20000 });
        assert.equal(await page.locator('[data-territorio-capa]').count(), 3);
        assert.equal(await page.locator('.selva-territorio-tabs').count(), 0);
        assert.equal(await page.locator('[data-mapa-modo="humedales"]').count(), 174);
        assert.equal(await page.locator('.selva-territorio-opciones [data-territorio-tema]').count(), 6);
        for (const mode of ['bosques', 'humedales']) {
            await page.locator(`[data-territorio-capa="${mode}"]`).check();
            assert.equal(await page.locator('.selva-territorio-layout').getAttribute('data-territorio-activo'), mode);
        }
        assert(await page.locator('[data-territorio-capa="rios"]').isChecked());
        assert(await page.locator('[data-territorio-capa="bosques"]').isChecked());
        await page.locator('[data-territorio-overlay-toggle="distritos"]').check();
        await page.locator('[data-territorio-overlay="distritos"]').waitFor();
        assert.equal(await page.locator('[data-territorio-overlay="distritos"]>path').count(), 11);
        await page.locator('[data-territorio-overlay-toggle="anp"]').check();
        await page.locator('[data-territorio-overlay="anp"]').waitFor();
        assert.equal(await page.locator('[data-territorio-overlay="anp"]>path').count(), 6);
        const origin = page.locator('[data-territorio-explorar]').first();
        await origin.locator('xpath=ancestor::details[1]').locator('summary').click();
        await origin.scrollIntoViewIfNeeded();
        const y = await page.evaluate(() => scrollY);
        await origin.click();
        await page.locator('.territorio-retorno').waitFor({ state: 'visible' });
        await page.locator('.territorio-retorno').click();
        assert(await origin.evaluate(e => document.activeElement === e));
        assert(Math.abs(await page.evaluate(() => scrollY) - y) < 6);
        if ([390, 1440].includes(width)) await accessible(page);
        if (width === 1440) {
            for (const selector of ['.conoce-geografia-grid', '.conoce-personas-grid']) {
                const cards = page.locator(selector).locator(':scope > details');
                const heights = await cards.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
                await cards.first().locator('summary').click();
                const after = await cards.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
                assert(after[0] > heights[0]);
                for (let i = 1; i < heights.length; i++) assert(Math.abs(after[i] - heights[i]) < 1, 'Tarjeta vecina de Territorio estirada');
            }
        }
        await page.goto(new URL('areas-protegidas.html#%', base).href);
        await page.locator('[data-anp-seleccionar="manu"]').click();
        if (width > 700) await page.locator('.anp-panel [data-anp-ficha]').click();
        const fiche = page.locator('.anp-dialogo-ficha');
        await fiche.waitFor({ state: 'visible' });
        const source = fiche.locator('[data-anp-fuente]').first();
        await source.click();
        await page.locator('.anp-dialogo-fuente[open]').waitFor();
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflow), 'hidden');
        await page.keyboard.press('Escape');
        assert(await source.evaluate(e => document.activeElement === e));
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflow), 'hidden');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('dialog[open]').count(), 0);
        assert.notEqual(await page.evaluate(() => getComputedStyle(document.documentElement).overflow), 'hidden');
        await page.goto(new URL('biblioteca.html', base).href);
        await page.locator('[data-eco-document="doc-osinfor"]').click();
        await page.locator('#eco-document-viewer[open]').waitFor();
        assert.equal(await page.locator('#eco-document-viewer iframe').count(), 0);
        if ([390, 1440].includes(width)) await accessible(page, '#eco-document-viewer');
        await page.keyboard.press('Escape');
        assert(await page.locator('[data-eco-document="doc-osinfor"]').evaluate(e => document.activeElement === e));
        assert.equal(errors.length, 0, errors.join('\n'));
        results.push({ width, pages: pages.length, fauna: 4, flora: 5, humedales: 174, distritos: 11, anp: 6, retorno: true });
        console.log('Correcto: ocho páginas y recorridos a ' + width + ' px.');
        await context.close();
    }
    const delayed = await browser.newContext({ viewport: { width: 390, height: 920 }, reducedMotion: 'reduce' });
    const pendingPage = await delayed.newPage();
    let releaseMap;
    const gate = new Promise(resolve => { releaseMap = resolve; });
    await pendingPage.route('**/datos/presentacion/mapa-base.svg*', async route => { await gate; await route.continue(); });
    await pendingPage.goto(new URL('territorio.html', base).href);
    await pendingPage.locator('[data-territorio-capa="humedales"]').check();
    await pendingPage.locator('[data-territorio-capa="bosques"]').check();
    await pendingPage.locator('[data-territorio-capa="rios"]').uncheck();
    releaseMap();
    await pendingPage.locator('.selva-territorio-svg').waitFor({ timeout: 20000 });
    assert.equal(await pendingPage.locator('.selva-territorio-layout').getAttribute('data-territorio-activo'), 'bosques');
    assert(await pendingPage.locator('[data-territorio-capa="humedales"]').isChecked());
    assert(await pendingPage.locator('[data-territorio-capa="bosques"]').isChecked());
    assert.equal(await pendingPage.locator('[data-territorio-capa="rios"]').isChecked(), false);
    await pendingPage.unroute('**/datos/presentacion/mapa-base.svg*');
    await pendingPage.route('**/datos/presentacion/mapa-base.svg*', route => route.abort());
    await pendingPage.goto(new URL('territorio.html', base).href);
    await pendingPage.locator('[data-territorio-map-src] button').waitFor({ state: 'visible' });
    await pendingPage.locator('.selva-territorio-fuentes-abrir').click();
    await pendingPage.locator('#selva-territorio-fuentes-modal[open]').waitFor();
    await pendingPage.keyboard.press('Escape');
    await pendingPage.locator('[data-territorio-capa="bosques"]').check();
    await pendingPage.locator('[data-territorio-map-src] button').waitFor({ state: 'visible' });
    await pendingPage.unroute('**/datos/presentacion/mapa-base.svg*');
    await pendingPage.locator('[data-territorio-map-src] button').click();
    await pendingPage.locator('.selva-territorio-svg').waitFor({ timeout: 20000 });
    assert(await pendingPage.locator('[data-territorio-capa="bosques"]').isChecked());
    await delayed.close();
    console.log('Correcto: selección antes de la descarga, fuentes con fallo de red y reintento.');
    const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await noJS.newPage();
    for (const file of ['index.html', 'flora.html', 'territorio.html']) {
        await page.goto(new URL(file, base).href);
        assert(await page.locator('main').isVisible());
        if (file === 'flora.html') assert.equal(await page.locator('[data-flora-caso]:visible').count(), 5);
        if (file === 'territorio.html') assert(await page.getByRole('link', { name: 'Ver el mapa', exact: true }).isVisible());
    }
    await noJS.close();
    await browser.close();
    if (process.env.ECOSELVA_QA_RESULT) fs.writeFileSync(process.env.ECOSELVA_QA_RESULT, JSON.stringify(results, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
