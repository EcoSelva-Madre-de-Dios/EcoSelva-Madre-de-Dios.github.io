import pathlib,json,re,xml.etree.ElementTree as ET
from shapely.geometry import shape
from shapely.ops import transform
from pyproj import Transformer
ROOT=pathlib.Path(__file__).resolve().parent.parent
p=ROOT/'index.html';page=p.read_bytes().decode('utf8')
begin=page.index('    <section class="selva-explora reveal" id="explora-madre-de-dios">')
end=page.index('    <section class="info-1" id="quienes-somos">',begin)
section=page[begin:end]
olddata=re.search(r'<script type="application/json" id="selva-territorio-datos">(.*?)</script>',section,re.S).group(1)
topics=json.loads(olddata)
archive=(ROOT/'recuperacion/antes-de-territorio-gdb/modulo-territorio.js').read_text(encoding='utf8')
icons={
'tierra':'M12 21V5M5 13l7-11 7 11ZM3 18l9-13 9 13Z',
'inundable':'M7 16V6M2 12l5-9 5 9ZM1 21q4-3 8 0t8 0t6 0',
'aguajal':'M12 22V7M12 7Q4-2 1 9M12 7Q20-2 23 9M12 7Q3 5 3 15M12 7Q21 5 21 15',
'secundario':'M12 22V9M12 13Q0 14 3 3 12 3 12 13ZM12 9Q24 10 21 0 12 0 12 9Z',
'rios':'M2 2c15 1-7 8 8 10s-7 8 12 10M7 2c15 1-7 8 8 10s-7 8 7 10',
'humedales':'M1 17q4-3 8 0t8 0t6 0M1 22q4-3 8 0t8 0t6 0M7 13V2m0 5-4-4M17 13V1m0 6 4-4'}
micro={'tierra':'Fuera de las crecientes periódicas','inundable':'Bosque y ciclos del agua','aguajal':'Palmeras de ambientes húmedos','secundario':'Vegetación que vuelve a crecer'}
colors={'tierra':'#285A3B','inundable':'#417B62','aguajal':'#6D8F55','secundario':'#73A56E'}
for key in micro:
    match=re.search(r'\b'+key+r': \{ name: "(.*?)", text: "(.*?)", source: (.*?), reference: "(.*?)" \}',archive)
    name,text,source,reference=match.groups()
    if source=='minamEcosystems':source='https://sinia.minam.gob.pe/sites/default/files/sinia/archivos/public/docs/memoria_mapa_ecosistemas.pdf'
    else: source=source.strip('"')
    topics[key]={'name':name,'text':text,'mode':'bosques','source':source,'reference':reference,'micro':micro[key],'color':colors[key],'icon':icons[key],'metadata':[['Alcance','Ficha educativa; sin ubicación ni distribución cartográfica.']]}
for key,t in topics.items():
    if t['mode']=='humedales':
        f=next(f for f in json.loads((ROOT/'datos/territorio/masas-agua.geojson').read_text(encoding='utf8'))['features'] if f['properties']['id']==key)
        a=f['properties'];t['registeredName']=a['nombre'];t['waterType']=a['tipo']
        t['name']=a['tipo']+' '+a['nombre'].title() if a['nombre'] else a['tipo']+' · nombre no registrado'
    elif t['mode']=='rios': t['metadata']=[['Tipo','Río'],*t['metadata']]
water=json.loads((ROOT/'datos/territorio/masas-agua.geojson').read_text(encoding='utf8'))['features']
project=Transformer.from_crs(4326,32719,always_xy=True).transform
named=[f['properties']['id'] for f in water if f['properties']['nombre']]
largest=sorted(water,key=lambda f:transform(project,shape(f['geometry'])).area,reverse=True)
initial=list(dict.fromkeys(named+[f['properties']['id'] for f in largest[:6]]))
for key in initial:topics[key]['initial']=True
ns='http://www.w3.org/2000/svg';ET.register_namespace('',ns)
def elem(tag,attrs=None):return ET.Element('{'+ns+'}'+tag,attrs or {})
svgmatch=re.search(r'<svg class="selva-territorio-svg".*?</svg>',section,re.S)
svg=ET.fromstring(svgmatch.group(0));defs=svg.find('{'+ns+'}defs')
gradient=elem('linearGradient',{'id':'territorio-dosel-gradiente','x2':'1','y2':'1'})
gradient.extend([elem('stop',{'offset':'0','stop-color':'#285A3B'}),elem('stop',{'offset':'1','stop-color':'#73A56E'})]);defs.append(gradient)
for key,icon in icons.items():
    symbol=elem('symbol',{'id':'territorio-icono-'+key,'viewBox':'0 0 24 24'})
    symbol.append(elem('path',{'d':icon,'fill':'none','stroke':'currentColor','stroke-width':'1.5','stroke-linecap':'round','stroke-linejoin':'round'}));defs.append(symbol)
pattern=elem('pattern',{'id':'territorio-dosel','width':'66','height':'60','patternUnits':'userSpaceOnUse'})
pattern.append(elem('circle',{'cx':'32','cy':'28','r':'22','fill':'none','stroke':'#ffffff','stroke-width':'.5','opacity':'.13'}))
pattern.append(elem('use',{'id':'territorio-arbol-conceptual','href':'#territorio-icono-tierra','x':'22','y':'15','width':'22','height':'28','color':'#ffffff','opacity':'.25'}));defs.append(pattern)
clip=next(g for g in svg.findall('{'+ns+'}g') if g.get('clip-path'))
rivers=elem('g',{'data-territorio-scene':'rios','style':'display:none','aria-hidden':'true','inert':''})
wet=elem('g',{'data-territorio-scene':'humedales','style':'display:none','aria-hidden':'true','inert':''})
forest=elem('g',{'data-territorio-scene':'bosques','aria-hidden':'false'})
decor=elem('g',{'aria-hidden':'true','pointer-events':'none'})
decor.extend([elem('rect',{'x':'0','y':'0','width':'600','height':'510','class':'selva-territorio-dosel-fondo'}),elem('rect',{'x':'0','y':'0','width':'600','height':'510','fill':'url(#territorio-dosel)'})]);forest.append(decor)
for g in list(clip):
    key=g.get('data-mapa-feature');clip.remove(g)
    if g.get('data-mapa-modo')=='rios':
        line=g.find("{*}path[@class='selva-territorio-rio-linea']")
        halo=elem('path',{'class':'selva-territorio-rio-halo','d':line.get('d')});g.insert(0,halo);rivers.append(g)
    else:
        g.set('data-water-type',topics[key]['waterType'].lower());g.set('data-initial',str(key in initial).lower());wet.append(g)
    g.set('tabindex','-1');g.set('aria-hidden','true');g.set('style','pointer-events:none');g.attrib.pop('role',None);g.attrib.pop('aria-pressed',None)
clip.extend([forest,rivers,wet])
desc=svg.find('{'+ns+'}desc');desc.text='Trois scènes exclusives.' if False else 'Tres escenas exclusivas: representación forestal educativa sin ubicaciones, ríos cartográficos y selección de masas de agua verificadas.'
svgstr=ET.tostring(svg,encoding='unicode')
header='''<div class="selva-territorio-mapa-cabecera"><div><strong class="selva-territorio-escena-titulo">Bosques</strong><p class="selva-territorio-escena-frase">Ambientes forestales de la Amazonía sur.</p></div><svg class="selva-territorio-modo-icono" viewBox="0 0 24 24" aria-hidden="true"><use href="#territorio-icono-tierra"/></svg></div><div class="selva-territorio-canvas">'''
controls='''<div class="selva-territorio-controles" role="group" aria-label="Vista del mapa"><button type="button" data-territorio-zoom="in" aria-label="Acercar mapa">+</button><button type="button" data-territorio-zoom="out" aria-label="Alejar mapa">−</button><button type="button" data-territorio-zoom="reset" aria-label="Restablecer vista">⟳</button></div><span class="selva-territorio-tooltip" hidden></span><p class="selva-territorio-ayuda"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 2 14 10-7 1-3 7Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>Haz clic en el mapa para explorar</p></div><button type="button" class="selva-territorio-volver-vista" hidden>← Ver todo Madre de Dios</button><p class="selva-territorio-nota-escena">Representación educativa. La cobertura cartográfica detallada de bosques se incorporará con una fuente específica.</p>'''
section=section[:svgmatch.start()]+header+svgstr+controls+section[svgmatch.end():]
section=section.replace('<h3 class="selva-territorio-panel-titulo">','<svg class="selva-territorio-panel-icono" viewBox="0 0 24 24" aria-hidden="true"><use href="#territorio-icono-tierra"/></svg><h3 class="selva-territorio-panel-titulo">',1)
newdata=json.dumps(topics,ensure_ascii=False,separators=(',',':')).replace('</',r'<\/')
section=section.replace('<script type="application/json" id="selva-territorio-datos">'+olddata+'</script>','<script type="application/json" id="selva-territorio-datos">'+newdata+'</script><template id="selva-territorio-fichas-previas"><script type="application/json">'+olddata+'</script></template>',1)
section=section.replace('<p>Esta vista no representa cobertura forestal', '<p>La escena forestal reutiliza las fichas educativas documentadas en <a href="https://sinia.minam.gob.pe/sites/default/files/sinia/archivos/public/docs/memoria_mapa_ecosistemas.pdf" target="_blank" rel="noopener">MINAM · memoria de ecosistemas, 2019</a> y el <a href="https://www.minam.gob.pe/wp-content/uploads/2013/10/compendio_04_-_aprovechamiento_de_rrnn_2.pdf" target="_blank" rel="noopener">compendio de aprovechamiento de recursos naturales, definición 3.11</a>. No hay polígonos de tipos de bosque. Humedales presenta inicialmente los registros con nombre y los seis de mayor superficie geométrica, con coincidencias eliminadas; la selección no mide abundancia ni representatividad ecológica. El conjunto completo sigue disponible.</p><p>Esta vista no representa cobertura forestal',1)
p.write_bytes((page[:begin]+section+page[end:]).encode('utf8'))
(ROOT/'datos/territorio/fichas-escenas.json').write_text(newdata,encoding='utf8')
(ROOT/'datos/territorio/presentacion-escenas.json').write_text(json.dumps({'seleccion_inicial_humedales':initial,'criterio':'Todos los registros con nombre más los seis de mayor superficie geométrica proyectada EPSG:32719; unión sin duplicados. No es muestreo ecológico.','exclusividad':'Un solo grupo SVG visible e interactivo por escena.','bosques':'Representación conceptual y ornamental; no geometrías ambientales nuevas.'},ensure_ascii=False,indent=2),encoding='utf8')
print('Escenas preparadas; selección inicial:',len(initial),'de',len(water))
