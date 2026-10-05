"""Genera la biblioteca desde el catálogo revisado; --check detecta desincronización."""
import sys
from pathlib import Path
from html import escape as e
import json
root=Path(__file__).resolve().parents[1];registry=json.loads((root/'datos/fuentes.json').read_text());docs=registry['documentos']
def icon(name):return f'<svg class="eco-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="images/ecoselva-iconos.svg#{name}"></use></svg>'
def button(doc):return f'<button class="eco-button" type="button" data-eco-document="{doc["id"]}" aria-haspopup="dialog">{"Previsualizar" if doc.get("pdf") else "Contexto y fuente"} <span class="eco-arrow" aria-hidden="true">↗</span></button>'
def card(d):
 cover=f'<img src="{d["portada"]}" width="{d["ancho"]}" height="{d["alto"]}" loading="lazy" decoding="async" alt="Primera página de {e(d["titulo"])}">' if d.get('portada') else icon('documentos')
 size=f'{d["bytes"]/1000000:.1f}'.replace('.',',')+' MB' if d.get('bytes') else ''
 meta=f'<span>{d["paginas"]} {"página" if d["paginas"] == 1 else "páginas"}</span><span>{size}</span>' if d.get('paginas') else '<span>Fuente original</span>'
 download=f'<a class="eco-text-link" href="{e(d["pdf"])}" target="_blank" rel="noopener noreferrer">PDF / descarga ↗</a>' if d.get('pdf') else f'<a class="eco-text-link" href="{e(d["url"])}" target="_blank" rel="noopener noreferrer">Consultar original ↗</a>'
 return f'''<article class="eco-card eco-doc-card" data-eco-card="{'document' if d.get('pdf') else 'article'}" data-eco-library-item data-tema="{d['tema']}" data-document-id="{d['id']}" aria-labelledby="titulo-{d['id']}">
<div class="eco-doc-cover">{cover}<span>{'PDF' if d.get('pdf') else 'FUENTE'}</span></div><div class="eco-card-content"><p class="eco-eyebrow">{e(d['tipo'])} · {d['anio'] or 'Sin fecha indicada'}</p><h3 id="titulo-{d['id']}">{e(d['titulo'])}</h3><p class="eco-card-secondary">{e(d['autor'])}</p><p class="eco-card-scope">{e(d['alcance'])}</p><div class="eco-doc-meta">{meta}</div><div class="eco-card-actions">{button(d)}{download}</div><a class="eco-card-context" href="{e(d['contexto'])}">Cómo lo usamos en EcoSelva →</a></div></article>'''
analytics=(root/'index.html').read_text().split('<head>',1)[1].split('<meta',1)[0]
feature=next(d for d in docs if d['id']=='doc-osinfor')
html=f'''<!DOCTYPE html>
<html lang="es-PE"><head>{analytics}<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Biblioteca para explorar | EcoSelva Madre de Dios</title><meta name="description" content="Explora documentos forestales, mapas oficiales y estudios científicos que EcoSelva utiliza para explicar Madre de Dios. Consulta el contexto, previsualiza los PDF y accede a sus fuentes originales.">
<link rel="canonical" href="https://ecoselva-madre-de-dios.github.io/biblioteca.html"><meta property="og:url" content="https://ecoselva-madre-de-dios.github.io/biblioteca.html"><meta property="og:type" content="website"><meta property="og:title" content="Biblioteca para explorar | EcoSelva"><meta property="og:description" content="Documentos, mapas y ciencia para seguir explorando Madre de Dios."><meta property="og:image" content="https://ecoselva-madre-de-dios.github.io/images/bg-hero.jpg"><meta property="og:locale" content="es_PE"><link rel="icon" href="images/logo-ecoselva-educacion.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Manrope:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet"><link rel="stylesheet" href="assets/eco-tokens.css"><link rel="stylesheet" href="assets/eco-base.css"><script src="assets/eco-base.js" defer></script></head>
<body class="eco-site eco-library-page"><a class="eco-saltar" href="#contenido">Saltar al contenido</a>
<header class="eco-barra"><div class="eco-wide"><a class="eco-marca" href="index.html" aria-label="EcoSelva · inicio"><img src="images/logo-ecoselva-educacion.png" width="768" height="768" alt=""><span>EcoSelva<small>Madre de Dios</small></span></a><a href="index.html#seguir-explorando">← Volver a explorar</a></div></header>
<main id="contenido" tabindex="-1"><nav class="eco-migas eco-wide" aria-label="Ruta de navegación"><ol><li><a href="index.html">EcoSelva</a></li><li aria-current="page">Biblioteca</li></ol></nav>
<header class="eco-library-hero eco-wide"><div><p class="eco-eyebrow">Bosques · cartografía · ciencia</p><h1>Conocimiento para<br>seguir explorando</h1><p class="eco-library-intro">Los documentos detrás de las historias, las cifras y los mapas de EcoSelva. Una biblioteca de fuentes para aprender sobre Madre de Dios y su contexto peruano.</p><a class="eco-button" href="#catalogo">Explorar la biblioteca {icon('flecha')}</a></div></header>
<section class="eco-library-catalog eco-wide" id="catalogo" aria-labelledby="catalogo-titulo" data-eco-library><div class="eco-library-heading"><div><p class="eco-eyebrow">Una fuente, una puerta de entrada</p><h2 id="catalogo-titulo">Documentos para consultar</h2></div><details class="eco-popover" data-eco-popover><summary>{icon('documentos')} Cómo leer estas fuentes</summary><div><p>El año corresponde a la publicación, no necesariamente al año de cada dato. Los mapas y estudios conservan su ámbito y sus límites.</p><p>Las miniaturas muestran la primera página del original. Los PDF completos se consultan y descargan desde la institución que los publica.</p><a href="fuentes-metodologia.html">Ver nuestros criterios editoriales →</a></div></details></div>
<div class="eco-library-tools" data-eco-library-tools hidden><label for="biblioteca-busqueda">Buscar en la biblioteca</label><div class="eco-library-search"><input type="search" id="biblioteca-busqueda" placeholder="Título, institución o año" autocomplete="off"><button class="eco-button eco-button-outline" type="button" data-eco-clear>Limpiar</button></div><div class="eco-library-filters" role="group" aria-label="Filtrar por tema">{''.join(f'<button type="button" data-eco-filter="{key}" aria-pressed="{str(key=="todos").lower()}">{label}</button>' for key,label in [('todos','Todo'),('bosques','Bosques'),('mapas','Mapas'),('conservacion','Conservación'),('historia','Historia'),('ciencia','Ciencia')])}</div><p class="eco-library-count" role="status" aria-live="polite">{len(docs)} recursos</p></div>
<div class="eco-library-grid">{''.join(card(d) for d in docs)}</div><p class="eco-library-empty" data-eco-library-empty hidden>No hay resultados con esa búsqueda. Prueba otro título o tema.</p><p class="eco-library-credit">Miniaturas de la primera página de los documentos originales, acreditadas a la institución indicada en cada tarjeta. Las miniaturas y los metadatos de los PDF conservan su fecha de comprobación en el registro. Las copias del proveedor pueden cambiar. <a href="datos/fuentes.json">Descargar el registro de fuentes →</a></p></section>
<section class="eco-library-paths eco-wide" aria-labelledby="rutas-titulo"><p class="eco-eyebrow">Continúa la exploración</p><h2 id="rutas-titulo">De la fuente al territorio</h2><div class="eco-resource-grid"><a class="eco-card eco-resource-card" data-eco-card="resource" href="fichas/castana.html">{icon('flora')}<span><strong>Castaña amazónica</strong>Una ficha para leer en tres profundidades.</span>{icon('flecha')}</a><a class="eco-card eco-resource-card" data-eco-card="protected-area" href="areas-protegidas.html">{icon('conservacion')}<span><strong>Áreas protegidas</strong>Explora el mapa y sus fichas.</span>{icon('flecha')}</a><a class="eco-card eco-resource-card" data-eco-card="map" href="territorio.html">{icon('mapas')}<span><strong>Explora el territorio</strong>Bosques, ríos y humedales en el mapa.</span>{icon('flecha')}</a></div></section></main>
<footer class="eco-pie eco-wide"><a href="index.html">← EcoSelva Madre de Dios</a><a href="fuentes-metodologia.html">Fuentes y metodología</a><a href="#contenido">Volver al comienzo ↑</a><a href="mailto:ecoselvamadrededios@gmail.com">ecoselvamadrededios@gmail.com</a><span>Revisión editorial · 5 de octubre de 2026</span></footer></body></html>'''

pagina=root/'biblioteca.html'
def check_generated():
 if json.loads((root/'datos/biblioteca/documentos.json').read_text()) != {'revision':registry['revision_editorial'],'documentos':docs}:
  raise ValueError('Biblioteca: catálogo derivado desincronizado del registro único.')
 if pagina.read_text()!=html:
  raise ValueError('Biblioteca desincronizada: ejecuta herramientas/actualizar_biblioteca.py.')

if __name__=='__main__':
 if sys.argv[1:]==['--check']:
  check_generated()
  print('Biblioteca sincronizada con el catálogo.')
 elif not sys.argv[1:]:
  pagina.write_text(html)
  (root/'datos/biblioteca/documentos.json').write_text(json.dumps({'revision':registry['revision_editorial'],'documentos':docs},ensure_ascii=False,indent=2)+'\n')
  print('Biblioteca actualizada; revisa verificar_sitio.py antes de publicar.')
 else:sys.exit('Uso: python herramientas/actualizar_biblioteca.py [--check]')
