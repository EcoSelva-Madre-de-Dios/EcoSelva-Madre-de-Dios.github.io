/* Regresiones de lectura editorial: datos únicos, controles diferidos y regreso al origen. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.argv[2] || 'http://127.0.0.1:8765/';
const pages = ['index.html','flora.html','territorio.html','historia.html','areas-protegidas.html','biblioteca.html','fuentes-metodologia.html','fichas/castana.html'];
let browser;
async function position(page, trigger, dialog, close) {
  await trigger.scrollIntoViewIfNeeded();
  await trigger.evaluate(element => element.addEventListener('pointerdown', () => { window.ecoReadingOrigin = scrollY; }, {once:true}));
  await trigger.click();
  await page.locator(dialog + '[open]').waitFor();
  const before = await page.evaluate(() => window.ecoReadingOrigin);
  const text = await page.locator(dialog).innerText();
  assert(text.trim().length > 80, 'Panel vacío o incompleto: ' + dialog);
  await page.locator(dialog + ' ' + close).click();
  await page.waitForFunction(selector => !document.querySelector(selector).open, dialog);
  assert(Math.abs(await page.evaluate(() => scrollY) - before) < 2, 'Se pierde la posición al cerrar ' + dialog);
  assert(await trigger.evaluate(element => document.activeElement === element), 'No vuelve el foco al origen');
}
(async () => {
  browser = await chromium.launch();
  for (const [width,height] of [[320,844],[390,844],[1440,900]]) {
    const context = await browser.newContext({ viewport:{width,height}, reducedMotion:'reduce' });
    const page = await context.newPage(), errors = [], photos = new Map();
    await page.route(/googletagmanager|google-analytics/, route => route.abort());
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(r.status()+' '+r.url());});
    for (const file of pages) {
      await page.goto(new URL(file,base).href,{waitUntil:'domcontentloaded'});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Desborde: '+file);
      assert.equal(await page.locator('time').evaluateAll(items=>items.filter(e=>/revisión|revisado|revisada/i.test(e.parentElement.textContent+' '+(e.parentElement.previousElementSibling?.textContent||''))&&!e.closest('footer')).length),0,'Revisión fuera del pie: '+file);
      assert.equal(await page.locator('footer.eco-global-footer time,footer.selva-pie-final time').count(),1,'Debe haber una revisión única: '+file);
      assert.deepEqual(await page.locator('img').evaluateAll(items=>items.filter(e=>!e.hasAttribute('width')||!e.hasAttribute('height')||e.loading!=='lazy').map(e=>e.getAttribute('src'))),[],'Imágenes sin dimensiones/carga diferida: '+file);
      assert.equal(await page.locator('dialog:not([open]) button').count(),0,'Controles creados dentro de un diálogo cerrado: '+file);
      const images=await page.locator('img[src]').evaluateAll(items=>items.map(e=>new URL(e.src).pathname).filter(src=>/\.(jpg|jpeg|png|webp)$/i.test(src)&&!/logo/i.test(src)));
      for(const src of images){
        assert(!photos.has(src),'Fotografía repetida: '+src+' en '+photos.get(src)+' y '+file);
        photos.set(src,file);
      }
      const notes=await page.locator('.eco-block-sources,.ficha-nota,.eco-footer-review').evaluateAll(items=>items.filter(e=>e.getClientRects().length).map(e=>parseFloat(getComputedStyle(e).fontSize)));
      assert(notes.every(size=>size>=13),'Notas menores de 13px');
    }
    await page.goto(new URL('index.html',base).href,{waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('[data-fauna-explorar]').count(),0,'Fauna genera botones antes de abrir la pestaña');
    await position(page,page.locator('.selva-flip-toggle').first(),'#selva-historia-modal','.selva-historia-cerrar');
    await page.locator('#selva-biodiversidad-tab-fauna').click();
    assert.equal(await page.locator('[data-fauna-explorar]').count(),4);
    assert.equal(await page.locator('#inicio a[href="#conoce-madre-de-dios"]').count(),1,'Acceso del héroe duplicado');
    assert.equal(await page.locator('img[src="images/castana.jpg"]').count(),0,'Foto sin relación con uso sostenible');
    assert.deepEqual(await page.locator('.selva-fauna-stat').evaluateAll(cards=>cards.map(card=>[card.querySelector('h3').textContent.trim(),card.querySelector('[data-fauna-count]').textContent.trim()])),[['Mamíferos','214'],['Aves','755'],['Reptiles','132'],['Anfibios','124']]);
    assert(await page.locator('.selva-fauna-stat').evaluateAll(cards=>cards.every(card=>card.querySelector('[data-fauna-actions]').getBoundingClientRect().top>=card.querySelector('.selva-fauna-descripcion').getBoundingClientRect().bottom)),'Botón de Fauna antes de su descripción');
    for (const group of ['mamiferos','aves','reptiles','anfibios']) {
      const trigger=page.locator('[data-fauna-explorar="'+group+'"]');
      await trigger.scrollIntoViewIfNeeded();
      await trigger.evaluate(element=>element.addEventListener('pointerdown',()=>{window.ecoReadingOrigin=scrollY;},{once:true}));
      await trigger.click(); await page.locator('#selva-fauna-modal[open]').waitFor();
      const before=await page.evaluate(()=>window.ecoReadingOrigin);
      assert.equal(await page.locator('.selva-fauna-especies li').count(),3);
      const first=await page.locator('.selva-fauna-especies h4').first().boundingBox();
      assert(first&&first.y>=0&&first.y+first.height<=height,'La primera vista solo muestra la foto');
      assert(await page.locator('#selva-fauna-modal').evaluate(dialog=>dialog.querySelector('.selva-fauna-modal-contenido').getBoundingClientRect().top<dialog.querySelector('.selva-fauna-modal-imagen').getBoundingClientRect().top),'La fotografía precede a la lectura');
      assert.equal(await page.locator('#selva-fauna-modal img[src]').count(),1,'Foto repetida en Fauna');
      await page.locator('.selva-fauna-conocer').nth(1).click();
      assert(await page.locator('.selva-fauna-ficha').isVisible());
      await page.locator('.selva-fauna-volver').click();
      await page.locator('.selva-fauna-modal-cerrar').click();
      assert(Math.abs(await page.evaluate(()=>scrollY)-before)<2, `${width}px ${group}: posición ${before} → ${await page.evaluate(()=>scrollY)}`);
    }
    await page.goto(new URL('flora.html',base).href,{waitUntil:'domcontentloaded'});
    await position(page,page.locator('.flora-cita a:visible').first(),'#eco-context-viewer','.eco-overlay-close');
    await page.goto(new URL('fichas/castana.html',base).href,{waitUntil:'domcontentloaded'});
    const model=JSON.parse(fs.readFileSync('datos/fichas/castana.json','utf8'));
    assert.equal(await page.locator('[data-campo="valor"]').count(),model.indicadores.length);
    for (const record of model.indicadores) {
      const row=page.locator('[data-registro-resumen="'+record.id+'"]');
      assert.equal(await row.locator('[data-campo="valor"]').getAttribute('data-valor'),record.valor);
      await position(page,row.locator('a[data-eco-record]'),'#eco-context-viewer','.eco-overlay-close');
    }
    // Una respuesta válida de JSON con registros vacíos debe mostrar reintento, sin abrir una ventana.
    await page.route('**/datos/fauna/fichas.json*',r=>r.fulfill({contentType:'application/json',body:'{"mamiferos":{"name":"Mamíferos","species":[]}}'}));
    await page.goto(new URL('index.html',base).href,{waitUntil:'domcontentloaded'});
    await page.locator('#selva-biodiversidad-tab-fauna').click();
    await page.locator('[data-fauna-explorar="mamiferos"]').click();
    await page.locator('.eco-document-error').waitFor();
    assert.equal(await page.locator('dialog[open]').count(),0);
    assert.equal(await page.locator('[data-fauna-explorar="mamiferos"]').isEnabled(),true);
    await page.unroute('**/datos/fauna/fichas.json*');
    await page.locator('[data-fauna-explorar="mamiferos"]').click();
    await page.locator('#selva-fauna-modal[open]').waitFor();
    assert.equal(await page.locator('.selva-fauna-especies li').count(),3);
    assert.deepEqual(errors,[]);
    await context.close();
    console.log('Lectura correcta:',width+'×'+height,'datos únicos, revisión en el pie, controles diferidos, paneles completos, reintento y posición conservada.');
  }
  // Con animación habilitada, los cuatro valores deben conservarse desde el primer clic.
  const normal=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference'});
  const moving=await normal.newPage();
  await moving.route(/googletagmanager|google-analytics/,r=>r.abort());
  await moving.goto(new URL('index.html',base).href,{waitUntil:'domcontentloaded'});
  await moving.locator('#selva-biodiversidad-tab-fauna').click();
  for(let frame=0;frame<5;frame++){
    assert.deepEqual(await moving.locator('[data-fauna-count]').allTextContents(),['214','755','132','124'],'Cifra documental sustituida por un contador transitorio');
    await moving.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
  }
  await normal.close();
  assert(fs.statSync('images/ecoselva-planas.svg').size<10000);
  await browser.close();
})().catch(async error=>{console.error(error);await browser?.close();process.exitCode=1;});
