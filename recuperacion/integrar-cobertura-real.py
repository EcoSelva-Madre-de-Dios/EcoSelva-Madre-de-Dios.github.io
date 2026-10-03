"""Integra únicamente la cobertura procesada en Territorio; conserva los datos anteriores."""
from pathlib import Path
import json,re,shutil
r=Path.cwd();out=r/'datos/territorio';b=r/'recuperacion/antes-de-cobertura-real'
b.mkdir(exist_ok=True)
for n in ['index.html','style.css','script.js']:
 if (b/n).exists():raise RuntimeError('Integración ya respaldada; no repetir')
 shutil.copy2(r/n,b/n)
categories=json.loads((out/'cobertura-categorias.json').read_text(encoding='utf8'))
newtopics={c['id']:{'name':c['categoria_original'],'mode':'bosques','text':'Categoría original del Mapa Nacional de Cobertura Vegetal, publicado en 2015. No describe el estado actual del territorio.','micro':'Código '+c['codigo_original'],'icon':c['icon'],'color':c['color'],'source':'https://www.gob.pe/institucion/minam/informes-publicaciones/2674-mapa','reference':'MINAM · Mapa Nacional de Cobertura Vegetal (2015)','metadata':[['Nombre oficial',c['categoria_original']],['Código original',c['codigo_original']],['Fuente cartográfica',c['fuente']],['Año de publicación','2015'],['Fecha de observación','No indicada uniformemente; CobVeg2013 es el campo original'],['Campo de clasificación','CobVeg2013'],['CRS original','EPSG:32718'],['Escala de publicación','1:100 000 (memoria descriptiva)'],['Procesamiento',c['procesamiento']],['Incorporación a EcoSelva','2 de octubre de 2026']]} for c in categories}
p=(r/'index.html').read_bytes().decode('utf8');start=p.index('    <section class="selva-explora reveal" id="explora-madre-de-dios">');end=p.index('<section class="selva-ambiente reveal" id="ambiente">');s=p[start:end]
s=s.replace('<g id="territorio-bosques-capa" aria-label="Distribución forestal pendiente"></g>','<g id="territorio-bosques-capa" aria-label="Cobertura vegetal de 2015">'+(out/'cobertura-bosques.svg').read_text(encoding='utf8')+'</g>',1)
# Referencia administrativa encima de los rellenos reales, sin alterar sus trazados.
match=re.search(r'<g class="selva-territorio-provincias-limites".*?</g>',s,re.S); provincial=match.group();s=s[:match.start()]+s[match.end():]
s=s.replace('<g class="selva-territorio-provincias-nombres"',provincial+'<g class="selva-territorio-provincias-nombres"',1)
s=s.replace('Tres escenas exclusivas: representación forestal educativa sin ubicaciones, ríos cartográficos y selección de masas de agua verificadas.','Tres escenas exclusivas: cobertura vegetal derivada de CobVeg_180615, publicada por MINAM en 2015 y recortada a Madre de Dios; ríos cartográficos y selección de masas de agua verificadas.',1)
paths={'montana':'M2 20 9 4l5 10 3-5 5 11ZM6 10l3 2 3-2M15 20v-5','colina':'M2 20q10-11 20 0M9 15V7m-3 3 3-6 3 6ZM16 16V9m-3 3 3-6 3 6Z','terraza':'M2 20h6v-3h7v-3h7M8 17V6m-4 4 4-8 4 8Z','paca':'M8 22V2M16 22V5M6 7h4M6 13h4M6 19h4M14 10h4M14 16h4M8 10Q1 9 2 4M16 13q7-2 6-7','herbazal':'M2 21h20M7 21Q8 8 3 4M12 21V3m0 9 4-5M17 21q-1-9 4-14','cobertura-no-bosque':'M3 21h18M4 17h16M5 13h14M7 9h10M9 5h6'}
for key,d in paths.items():
 symbol=f'<symbol id="territorio-icono-{key}" viewBox="0 0 24 24"><path d="{d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>'
 s=s.replace('</defs>',symbol+'</defs>',1)
# Mantener las fuentes educativas anteriores como documentación histórica.
old=re.search(r'<p>La escena forestal reutiliza.*?</p><p>Esta vista no representa.*?</p>',s,re.S)
if old:
 s=s[:old.start()]+'<details class="selva-territorio-documentacion-previa"><summary>Documentación de la experiencia educativa anterior</summary><p>Estas notas describen la versión previa, sin la cobertura vegetal de 2015. Sus fuentes se conservan como documentación educativa y no clasifican los polígonos actuales.</p>'+old.group()+'</details>'+s[old.end():]
s=s.replace('contorno, sin límites internos en la vista.', 'contorno, sin límites distritales internos en la vista.',1)
s=s.replace('<summary>Fuentes y metodología del mapa →</summary>','<summary>Fuentes y metodología del mapa →</summary><p>Referencia provincial: disolución de DISTRITOS_MDD por el campo provincia; etiquetas calculadas en puntos interiores de Manu, Tahuamanu y Tambopata. No se utilizan como categorías de cobertura vegetal.</p>',1)
source='''<div class="selva-territorio-fuente-cobertura"><h4>Cobertura vegetal · MINAM, 2015</h4><p>Mapa Nacional de Cobertura Vegetal. Archivo aportado: <code>mapa_cobertura_vegetal_2015.zip</code>; capa <code>CobVeg_180615</code>. Clasificación original: <code>CobVeg2013</code>; código: <code>Simbolo</code>. Se conservan los nombres oficiales, incluidas clases no forestales, sin equivalencias a los cuatro ambientes educativos.</p><p>CRS original EPSG:32718. Procesamiento EcoSelva: reproyección a EPSG:32719, recorte al límite departamental actual, disolución por categoría y simplificación topológica de 65 m para la vista web; GeoJSON en EPSG:4326. Escala de la publicación: 1:100 000 según su memoria descriptiva; no indicada en el XML del shapefile. Incorporación: 2 de octubre de 2026. La publicación de 2015 no representa el estado de 2026.</p><p><a href="https://www.gob.pe/institucion/minam/informes-publicaciones/2674-mapa" target="_blank" rel="noopener noreferrer">Publicación y memoria descriptiva · MINAM</a> · <a href="https://geoservidorperu.minam.gob.pe/arcgis/rest/services/ServicioDegradacion/MapServer/12" target="_blank" rel="noopener noreferrer">Servicio oficial y clasificación</a> · <a href="datos/territorio/cobertura-metadatos.json" target="_blank" rel="noopener noreferrer">Metadatos del procesamiento</a></p></div>'''
# Insertar dentro del bloque de fuentes actual, antes de los templates archivados.
pos=s.index('<details class="selva-territorio-fuentes"'); close=s.index('</details>',pos)
s=s[:close]+source+s[close:]
data='<script type="application/json" id="selva-territorio-cobertura-datos">'+json.dumps({'categories':categories,'topics':newtopics},ensure_ascii=False,separators=(',',':'))+'</script>'
s=s+data+'\n'
(r/'index.html').write_bytes((p[:start]+s+p[end:]).encode('utf8'))
j=(r/'script.js').read_bytes().decode('utf8')
j=j.replace('        const svg = territory.querySelector(".selva-territorio-svg");','''        const forestData = JSON.parse(document.getElementById("selva-territorio-cobertura-datos")?.textContent || '{"categories":[],"topics":{}}');
        Object.assign(topics, forestData.topics);
        const svg = territory.querySelector(".selva-territorio-svg");''',1)
anchor='        let activeMode = "bosques",'
j=j.replace(anchor,'''        if (forestData.categories.length) {
            modes.bosques.keys = forestData.categories.map(category => category.id);
            modes.bosques.phrase = "Cobertura vegetal · MINAM, 2015.";
            modes.bosques.intro = "Explora las categorías originales de la cobertura vegetal.";
            modes.bosques.note = "Cartografía de 2015 recortada a Madre de Dios. Incluye clases no forestales de la fuente; no representa el estado actual.";
        }
'''+anchor,1)
anchor='        const forestPolygons = () =>'
j=j.replace(anchor,'        Object.assign(forestColors, Object.fromEntries(forestData.categories.map(category => [category.id, category.color])));\n'+anchor,1)
j=j.replace('scaleElement.hidden = activeMode === "bosques";','scaleElement.hidden = activeMode === "bosques" && !forestData.categories.length;',1)
j=j.replace('item.append(swatch, icon(key),','item.classList.toggle("is-muted", !!selectedKey && key !== selectedKey);\n                    item.setAttribute("aria-current", selectedKey === key ? "true" : "false");\n                    item.append(swatch, icon(topics[key].icon || key),',1)
j=j.replace('"Colores educativos. La distribución espacial detallada está en preparación."','forestData.categories.length ? "Categorías originales · MINAM, 2015. Colores de visualización EcoSelva; incluye coberturas no forestales." : "Colores educativos. La distribución espacial detallada está en preparación."',1)
j=j.replace('activeMode === "bosques" ? key : activeMode === "humedales"','activeMode === "bosques" ? (topics[key].icon || key) : activeMode === "humedales"',1)
j=j.replace('            const hint = node("div", "selva-territorio-ficha-ayuda");','            const hint = node("div", "selva-territorio-ficha-ayuda");',1)
j=j.replace('node("p", "", "Pulsa una geometría o utiliza las opciones del panel.")','node("p", "", activeMode === "bosques" && forestData.categories.length ? "Vista completa de las " + forestData.categories.length + " categorías presentes en el recorte. Selecciona una categoría en el mapa o en la lista. Fuente: MINAM, publicación de 2015." : "Pulsa una geometría o utiliza las opciones del panel.")',1)
j=j.replace('topic.mode === "bosques" ? "Ambiente forestal · ficha educativa"','topic.mode === "bosques" ? (forestData.categories.length ? "Cobertura vegetal · categoría oficial" : "Ambiente forestal · ficha educativa")',1)
j=j.replace('if (feature && interact) zoomFeature(feature);','if (feature && interact && activeMode !== "bosques") zoomFeature(feature);',1)
j=j.replace('button.append(icon(key));','button.append(icon(topics[key].icon || key));',1)
j=j.replace('"selva-territorio-todos", "Ver todos"','"selva-territorio-todos", forestData.categories.length ? "Todos" : "Ver todos"',1)
j=j.replace('all.setAttribute("aria-pressed", "true"); showCard(null); updateLegend();','all.setAttribute("aria-pressed", "true"); updateFeatures(); showCard(null); updateLegend(); tooltip.hidden = true;',1)
j=j.replace('                    options.append(all);','                    options.prepend(all);',1)
j=j.replace('if (mode === "bosques") select("tierra", false);','if (mode === "bosques") {\n                if (forestData.categories.length) { filterForest(null); territory.dataset.forest = "todos"; }\n                else select("tierra", false);\n            }',1)
j=j.replace('(activeMode === "rios" || selectedKey === key)','(activeMode === "rios" || selectedKey === key || (activeMode === "bosques" && !selectedKey && key === modes.bosques.keys[0]))',1)
(r/'script.js').write_bytes(j.encode('utf8'))
print('Integración completada:',len(categories),'categorías oficiales')
