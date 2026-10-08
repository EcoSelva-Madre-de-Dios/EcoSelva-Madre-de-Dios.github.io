/* Verificación del refinamiento: colisiones, escala, carga por intención y tamaños. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.argv[2] || 'http://127.0.0.1:8765/';
const sizes = [[1366,768],[1440,900],[1536,864],[1920,1080],[2560,1440],[768,1024],[390,844],[412,915]];
const pages = ['index.html','flora.html','territorio.html','historia.html','areas-protegidas.html','biblioteca.html','fuentes-metodologia.html','fichas/castana.html'];
async function labels(page, selector) {
  const items = await page.locator(selector + ' .eco-atlas-label').evaluateAll(elements => elements.filter(e => e.dataset.atlasVisible === 'true').map(e => {
    const r = e.getBoundingClientRect(), m = e.getScreenCTM();
    return {name:e.textContent,x:r.x,y:r.y,w:r.width,h:r.height,font:parseFloat(getComputedStyle(e).fontSize) * m.a};
  }));
  assert(items.length >= 2, 'Debe haber etiquetas legibles');
  items.forEach((a,i) => {
    assert(a.font >= 9.5 && a.font <= 14, a.name + ': tipografía fuera de jerarquía');
    for (const b of items.slice(i+1)) assert(!(a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y), 'Colisión: '+a.name+' / '+b.name);
  });
  return items.length;
}
async function scale(page, svgSelector, scaleSelector) {
  const values = await page.evaluate(({svgSelector,scaleSelector}) => {
    const svg = document.querySelector(svgSelector), el = document.querySelector(scaleSelector);
    return {width:el.querySelector('i').getBoundingClientRect().width,km:Number(el.dataset.km),unit:Number(el.dataset.metresPerUnit),matrix:svg.getScreenCTM().a};
  }, {svgSelector,scaleSelector});
  assert(Math.abs(values.width - values.km*1000/values.unit*values.matrix) < 1, 'Escala sin correspondencia con la matriz');
  assert(values.width > 10 && values.width <= 151);
  return values.km;
}
let browser;
(async () => {
  browser = await chromium.launch();
  const report = [];
  for (const [width,height] of sizes) {
    const context = await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
    const page = await context.newPage(), errors = [], requests = [];
    await page.route(/googletagmanager|google-analytics/,route => route.abort());
    page.on('pageerror',e => errors.push(e.message));
    page.on('request',r => requests.push(r.url()));
    page.on('response',r => {if(r.url().startsWith(base) && r.status()>=400) errors.push(r.status()+' '+r.url());});
    for (const file of pages) {
      await page.goto(new URL(file,base).href,{waitUntil:'domcontentloaded'});
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,file+': desborde a '+width);
      const gutters = await page.locator('.container,.anp-ancho,.ficha-contenedor').evaluateAll(elements => elements.filter(e => e.offsetWidth>0).map(e => {const r=e.getBoundingClientRect();const css=getComputedStyle(e);return Math.min(r.left+parseFloat(css.paddingLeft),innerWidth-r.right+parseFloat(css.paddingRight));}));
      assert(gutters.every(g=>g>=17),file+': margen exterior insuficiente');
    }
    requests.length=0;
    await page.goto(new URL('territorio.html',base).href,{waitUntil:'domcontentloaded'});
    await page.locator('.selva-territorio-svg').waitFor();
    await page.locator('.selva-territorio-canvas').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('.selva-territorio-escala').dataset.km);
    assert(!requests.some(url => /presentacion\/(bosques|anp|distritos)\.svg/.test(url)), 'Capas adicionales descargadas sin activación');
    const n = await labels(page,'.selva-territorio-svg');
    const before = await scale(page,'.selva-territorio-svg','.selva-territorio-escala');
    await page.locator('[data-territorio-zoom=in]').click();
    await page.waitForFunction(() => Number(document.querySelector('.selva-territorio-svg').viewBox.baseVal.width)<599);
    await scale(page,'.selva-territorio-svg','.selva-territorio-escala');
    await labels(page,'.selva-territorio-svg');
    await page.locator('[data-territorio-zoom=reset]').click();
    await page.locator('[data-territorio-overlay-toggle=distritos]').check();
    await page.locator('[data-territorio-overlay=distritos]').waitFor();
    assert(!requests.some(url=>/presentacion\/anp\.svg/.test(url)), 'ANP descargada al activar solo distritos');
    await page.locator('[data-territorio-overlay-toggle=anp]').check();
    await page.locator('[data-territorio-overlay=anp]').waitFor();
    await page.locator('[data-territorio-capa=bosques]').check();
    await page.locator('#territorio-bosques-capa path').first().waitFor();
    assert.equal(await page.locator('#territorio-bosques-capa [data-mapa-feature]').count(),27,'Clases oficiales perdidas');
    await page.locator('[data-territorio-capa=bosques]').uncheck();
    assert.equal(await page.locator('.eco-atlas-legend-heading').filter({hasText:'Cobertura'}).count(),0);
    await page.locator('[data-territorio-capa=rios]').check();
    await page.locator('[data-territorio-tema=madre]').click();
    await page.waitForTimeout(100);
    await labels(page,'.selva-territorio-svg');
    await page.locator('.selva-territorio-canvas').screenshot({path:'/tmp/ecoselva-atlas-territorio-'+width+'.png'});
    await page.goto(new URL('areas-protegidas.html',base).href,{waitUntil:'domcontentloaded'});
    await page.locator('.anp-mapa').scrollIntoViewIfNeeded();
    await page.locator('.anp-mapa svg').waitFor();
    await page.waitForFunction(() => document.querySelector('.eco-atlas-scale')?.dataset.km);
    assert.equal(await page.locator('.anp-mapa [data-anp]').count(),6);
    await labels(page,'.anp-mapa svg');
    await scale(page,'.anp-mapa svg','.eco-atlas-scale');
    await page.locator('[data-eco-zoom=in]').click();
    await labels(page,'.anp-mapa svg');
    await scale(page,'.anp-mapa svg','.eco-atlas-scale');
    await page.locator('[data-eco-zoom=reset]').click();
    await page.locator('[data-anp-filtro=RN]').click();
    assert.equal(await page.locator('.anp-leyenda [data-anp-leyenda]:visible').count(),1);
    await page.locator('[data-anp-filtro=todos]').click();
    await page.locator('.anp-mapa').screenshot({path:'/tmp/ecoselva-atlas-anp-'+width+'.png'});
    assert.deepEqual(errors,[]);
    report.push({width,height,pages:8,territoryLabels:n,initialScaleKm:before});
    console.log('Correcto:',width+'×'+height,'ocho páginas, capas por intención, etiquetas sin colisiones y escala dinámica.');
    await context.close();
  }
  await browser.close();
  fs.writeFileSync('/tmp/ecoselva-atlas-resultados.json',JSON.stringify(report,null,2));
})().catch(async error=>{console.error(error);await browser?.close();process.exitCode=1;});
