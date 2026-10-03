"""Referencia provincial derivada de DISTRITOS_MDD; no altera las capas existentes."""
from pathlib import Path
import sys, json, re, shutil, html
import pyogrio
from shapely import from_wkb, make_valid, union_all
from shapely.geometry import mapping
from shapely.ops import transform
from pyproj import Transformer

root=Path(__file__).resolve().parent.parent
backup=root/'recuperacion/antes-de-bosques-provincias'
backup.mkdir(exist_ok=True)
for name in ['index.html','style.css','script.js']:
    if (backup/name).exists(): raise RuntimeError('La recuperación ya existe; no repetir la integración.')
    shutil.copy2(root/name,backup/name)
meta,fids,wkbs,values=pyogrio.raw.read(sys.argv[1],layer='DISTRITOS_MDD',columns=['provincia'],return_fids=True)
assert meta['crs']=='EPSG:32719'
group={}
for fid,wkb,name in zip(fids,wkbs,values[0]):
    group.setdefault(str(name).strip(),[]).append((int(fid),make_valid(from_wkb(wkb))))
assert set(group)=={'Manu','Tahuamanu','Tambopata'},group.keys()
raw=union_all([g for rows in group.values() for _,g in rows])
boundary=raw.simplify(180,preserve_topology=True)
xmin,ymin,xmax,ymax=boundary.bounds
scale=min(480/(xmax-xmin),430/(ymax-ymin)); xoff=(600-(xmax-xmin)*scale)/2
def xy(x,y): return xoff+(x-xmin)*scale,35+(ymax-y)*scale
def path(g):
    if g.is_empty:return ''
    if g.geom_type in ('LineString','LinearRing'):
        return ' '.join(('M' if i==0 else 'L')+','.join(f'{v:.1f}' for v in xy(x,y)) for i,(x,y,*_) in enumerate(g.coords))
    return ' '.join(path(p) for p in g.geoms)
provinces={name:union_all([g for _,g in rows]) for name,rows in group.items()}
# Intersecciones reales de límites provinciales: ninguna línea trazada a mano.
names=sorted(provinces)
internal=union_all([provinces[a].boundary.intersection(provinces[b].boundary) for i,a in enumerate(names) for b in names[i+1:]]).simplify(180,preserve_topology=True)
assert not internal.is_empty
lines=f'<g class="selva-territorio-provincias-limites" aria-hidden="true" pointer-events="none"><path d="{path(internal)}"/></g>'
labels='<g class="selva-territorio-provincias-nombres" aria-hidden="true" pointer-events="none">'
to_geo=Transformer.from_crs(meta['crs'],'EPSG:4326',always_xy=True).transform
features=[]
for name,g in provinces.items():
    point=g.representative_point(); x,y=xy(point.x,point.y)
    labels+=f'<text x="{x:.2f}" y="{y:.2f}" text-anchor="middle">{html.escape(name.upper())}</text>'
    features.append({'type':'Feature','geometry':mapping(transform(to_geo,g.simplify(180,preserve_topology=True))),'properties':{'provincia':name,'distritos_fid':[fid for fid,_ in group[name]],'etiqueta_punto_utm':[point.x,point.y]}})
labels+='</g>'
out=root/'datos/territorio'
def write(name,value): (out/name).write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf8')
write('provincias.geojson',{'type':'FeatureCollection','features':features})
write('provincias-metadatos.json',{'archivo_original':Path(sys.argv[1]).name,'capa':'DISTRITOS_MDD','campo_agrupacion':'provincia','crs_original':meta['crs'],'crs_geojson':'EPSG:4326','fuente':'Geodatabase aportada; entidad generadora no indicada en los campos de DISTRITOS_MDD','fecha_fuente':None,'escala_original':None,'procesamiento':'Reparación de geometrías y disolución por provincia. Límites interiores obtenidos por intersección de bordes provinciales; simplificación topológica de 180 m. Etiquetas: punto interior de cada geometría disuelta, antes de simplificar. Misma transformación UTM del mapa existente.','provincias':names,'distritos':len(fids),'uso':'Referencia educativa, sin selección ni atribución de cobertura forestal.'})
write('bosques-capa-config.json',{'estado':'pendiente','capa':None,'fuente':None,'anio_fuente':None,'escala':None,'procesamiento':None,'campos_requeridos':['categoria_original','fuente','anio_fuente','escala','procesamiento'],'contenedor_svg':'territorio-bosques-capa','atributo_filtro':'data-forest-category','regla':'Solo cargar polígonos documentados y reproyectados al mismo espacio SVG. Mantener categoría original y metadatos por entidad. No equiparar categorías educativas a categorías oficiales sin correspondencia documentada.','opacidad_seleccion':0.85,'opacidad_otras':0.14,'leyenda':'Derivar únicamente de categorías presentes en polígonos cargados.'})
page=(root/'index.html').read_bytes().decode('utf8')
match=re.search(r'<svg\b[^>]*class="selva-territorio-svg".*?</svg>',page,re.S)
svg=match.group()
svg=svg.replace('<g clip-path="url(#territorio-limite-clip)">',lines+'<g clip-path="url(#territorio-limite-clip)">',1)
svg=svg.replace('<g data-territorio-scene="bosques"', '<g data-territorio-scene="bosques"',1)
scene=re.search(r'<g[^>]*data-territorio-scene="bosques"[^>]*>',svg).group()
svg=svg.replace(scene,scene+'<g id="territorio-bosques-capa" aria-label="Distribución forestal pendiente"></g>',1)
svg=svg.replace('<g class="selva-territorio-orientacion"',labels+'<g class="selva-territorio-orientacion"',1)
page=page[:match.start()]+svg+page[match.end():]
start=page.index('    <section class="selva-explora reveal" id="explora-madre-de-dios">'); end=page.index('<section class="selva-ambiente reveal" id="ambiente">')
section=page[start:end]
section=section.replace('<div class="selva-territorio-controles"','<label class="selva-territorio-provincias-control"><input type="checkbox" id="territorio-provincias" checked> Provincias</label><div class="selva-territorio-controles"',1)
section=section.replace('Representación educativa. La cobertura cartográfica detallada de bosques se incorporará con una fuente específica.','Distribución cartográfica de ambientes forestales en preparación.',1)
page=page[:start]+section+page[end:]
(root/'index.html').write_bytes(page.encode('utf8'))
js=(root/'script.js').read_bytes().decode('utf8')
anchor='        const updateScale = () => {'
js=js.replace(anchor,'''        const provinceToggle = territory.querySelector("#territorio-provincias");
        provinceToggle.addEventListener("change", () => {
            svg.querySelectorAll(".selva-territorio-provincias-limites, .selva-territorio-provincias-nombres").forEach(layer => {
                layer.style.display = provinceToggle.checked ? "" : "none";
            });
        });
        const forestPolygons = () => [...svg.querySelectorAll("#territorio-bosques-capa [data-forest-category]")];
        const filterForest = key => {
            forestPolygons().forEach(polygon => {
                const selected = !key || polygon.dataset.forestCategory === key;
                polygon.style.opacity = selected ? "0.85" : "0.14";
                polygon.classList.toggle("is-selected", !!key && selected);
            });
        };
'''+anchor,1)
js=js.replace('            let km = 100;', '            svg.querySelectorAll(".selva-territorio-provincias-nombres text").forEach(text => text.setAttribute("font-size", 11 / matrix.a));\n            let km = 100;',1)
js=js.replace('        const updateLegend = () => {','''        const updateLegend = () => {
            if (activeMode === "bosques") {
                const categories = [...new Set(forestPolygons().map(p => p.dataset.forestCategory))];
                legend.replaceChildren(...(categories.length ? categories.map(category => node("span", "selva-territorio-leyenda-item", category)) : [node("small", "", "Distribución cartográfica en preparación.")]));
                return;
            }''',1)
js=js.replace('                territory.style.setProperty("--territorio-forest-color", topics[key].color);\n                svg.querySelector("#territorio-arbol-conceptual").setAttribute("href", "#territorio-icono-" + key);','                filterForest(key);\n                options.querySelector("[data-territorio-bosques-todos]")?.setAttribute("aria-pressed", "false");',1)
# Insert reset after the four educational options, preserving their listeners.
anchor='                    button.addEventListener("blur", () => highlight(null)); options.append(button);\n                });'
assert anchor in js
js=js.replace(anchor,anchor+'''
                if (activeMode === "bosques") {
                    const all = node("button", "selva-territorio-todos", "Ver todos");
                    all.type = "button"; all.dataset.territorioBosquesTodos = "";
                    all.setAttribute("aria-pressed", String(!selectedKey));
                    all.addEventListener("click", () => {
                        selectedKey = null; territory.dataset.forest = "todos"; filterForest(null);
                        options.querySelectorAll("[data-territorio-tema]").forEach(button => button.setAttribute("aria-pressed", "false"));
                        all.setAttribute("aria-pressed", "true"); showCard(null); updateLegend();
                    });
                    options.append(all);
                }''',1)
js=js.replace('Representación educativa. La cobertura cartográfica detallada de bosques se incorporará con una fuente específica.','Distribución cartográfica de ambientes forestales en preparación.')
(root/'script.js').write_bytes(js.encode('utf8'))
css='''
/* Referencia provincial y Bosques: base neutral; cobertura pendiente. */
#explora-madre-de-dios .selva-territorio-dosel-fondo { display: none; }
#explora-madre-de-dios [data-territorio-scene="bosques"] rect[fill="url(#territorio-dosel)"] { opacity: .045; }
#explora-madre-de-dios .selva-territorio-provincias-limites,
#explora-madre-de-dios .selva-territorio-provincias-nombres { pointer-events: none; }
#explora-madre-de-dios .selva-territorio-provincias-limites path { fill: none; stroke: rgba(32,42,37,.30); stroke-width: 1; vector-effect: non-scaling-stroke; }
#explora-madre-de-dios .selva-territorio-provincias-nombres text { fill: rgba(32,42,37,.55); font-family: Manrope, sans-serif; font-weight: 600; letter-spacing: .08em; paint-order: stroke; stroke: var(--paper, #f8faf7); stroke-width: 2; stroke-opacity: .7; }
#explora-madre-de-dios .selva-territorio-provincias-control { position: absolute; z-index: 3; top: 66px; left: 24px; display: inline-flex; align-items: center; gap: 6px; padding: 5px 8px; border: 1px solid #dce4de; border-radius: 6px; background: rgba(255,255,255,.94); color: #56675d; font-size: 11px; cursor: pointer; }
#explora-madre-de-dios .selva-territorio-provincias-control input { width: 13px; height: 13px; margin: 0; accent-color: #31634b; }
#explora-madre-de-dios .selva-territorio-provincias-control:focus-within { outline: 2px solid #31634b; outline-offset: 3px; }
#territorio-bosques-capa [data-forest-category] { transition: opacity .2s ease; }
#territorio-bosques-capa .is-selected { stroke-width: 1.5; vector-effect: non-scaling-stroke; }
@media (max-width: 760px) { #explora-madre-de-dios .selva-territorio-provincias-control { left: 14px; } }
@media (prefers-reduced-motion: reduce) { #territorio-bosques-capa [data-forest-category] { transition: none; } }
'''
with (root/'style.css').open('ab') as f:f.write(css.encode('utf8'))
print(json.dumps({'provincias':names,'distritos':len(fids),'limite_interior_m':internal.length,'poligonos_forestales':0}))
