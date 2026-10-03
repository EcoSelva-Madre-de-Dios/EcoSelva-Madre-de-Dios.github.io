"""Convierte solo límite, seis ríos nominales y masas de agua de la GDB aportada.
Uso: python procesar-territorio-gdb.py RUTA_GDB
Requiere pyogrio, shapely, pyproj y numpy. No modifica la geodatabase.
"""
import collections
import hashlib
import html
import json
import pathlib
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET
import numpy as np
import pyogrio
from pyproj import Transformer
from shapely import from_wkb, make_valid, union_all, get_num_coordinates
from shapely.geometry import mapping
from shapely.ops import transform, linemerge

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'datos' / 'territorio'
OUT.mkdir(parents=True, exist_ok=True)
GDB = pathlib.Path(sys.argv[1])
INCORPORACION = '2026-10-02'

def clean(value):
    if value is None or str(value).strip() in ('', 'NaT', 'None'): return None
    if isinstance(value, np.datetime64): return str(value)[:10]
    if hasattr(value, 'item'): return value.item()
    return str(value).strip()

def read(layer, cols=None, where=None, fids=None):
    meta, fids, geom, arrays = pyogrio.raw.read(GDB, layer=layer, columns=cols, where=where, fids=fids, return_fids=True)
    if meta['crs'] != 'EPSG:32719': raise ValueError(f'CRS no esperado: {layer}: {meta["crs"]}')
    return [(int(fid), from_wkb(wkb), {str(k):clean(v[i]) for k,v in zip(meta['fields'],arrays)}) for i,(fid,wkb) in enumerate(zip(fids,geom))]

def canonical(name):
    s=''.join(c for c in unicodedata.normalize('NFD',name or '') if not unicodedata.combining(c)).upper().strip()
    return re.sub(r'^(RIO\s+|DE LAS\s+)', '', s)

targets={'MADRE DE DIOS':'madre','TAMBOPATA':'tambopata','INAMBARI':'inambari','LAS PIEDRAS':'piedras','MANU':'manu','HEATH':'heath'}
labels={'madre':'Río Madre de Dios','tambopata':'Río Tambopata','inambari':'Río Inambari','piedras':'Río Las Piedras','manu':'Río Manu','heath':'Río Heath'}
districts=read('DISTRITOS_MDD',['distrito_','provincia','region','situac_lim','validado'])
assert len(districts)==11
boundary=union_all([make_valid(g) for _,g,_ in districts])
boundary=boundary.simplify(180,preserve_topology=True)
selected={k:[] for k in labels}
attributes={k:[] for k in labels}
for fid,g,a in read('RIOS_PRINCIPALES',['nombre']):
    key=targets.get(canonical(a['nombre']))
    if key:
        selected[key].append(make_valid(g).intersection(boundary))
        attributes[key].append({'capa':'RIOS_PRINCIPALES','fid':fid,**a})
# Filtrar los atributos antes de cargar geometrías de Hidrografia_mdd.
meta, fids, _, fields = pyogrio.raw.read(GDB,layer='Hidrografia_mdd',columns=['nombre','text_tramo'],read_geometry=False,return_fids=True)
named_fids=[int(fid) for i,fid in enumerate(fids) if any(canonical(field[i]) in targets for field in fields)]
complement={k:[] for k in labels}
for fid,g,a in read('Hidrografia_mdd',['nombre','text_tramo','aaa'],fids=named_fids):
    key=targets.get(canonical(a['nombre'])) or targets.get(canonical(a['text_tramo']))
    if key:
        complement[key].append(make_valid(g).intersection(boundary))
        attributes[key].append({'capa':'Hidrografia_mdd','fid':fid,**a})
river_records=read('RioPrin',['NOMRIO','CUENCA','FUENTE','FECREG'])
topics={'bosque-pendiente':{'name':'Cobertura de bosque en preparación','text':'Estamos incorporando una cobertura cartográfica adecuada para representar los bosques de la región.','mode':'bosques','metadata':[['Alcance','Sin capa de cobertura forestal en esta vista. Los Bosques de Producción Permanente no se usan como sustituto.']]}}
rivers=[]
for key in labels:
    primary=union_all(selected[key])
    # Evitar superponer versiones cercanas del mismo cauce. Solo se añaden
    # tramos reales de la segunda capa fuera del corredor de 80 m de la primera.
    extra=union_all(complement[key]).difference(primary.buffer(80)) if not primary.is_empty else union_all(complement[key])
    geom=union_all([primary,extra])
    if geom.is_empty: raise ValueError(f'Río no encontrado: {key}')
    if geom.geom_type=='MultiLineString': geom=linemerge(geom)
    geom=geom.simplify(65,preserve_topology=True)
    records=[a for _,_,a in river_records if targets.get(canonical(a['NOMRIO']))==key]
    metadata=[['Capa del trazado','RIOS_PRINCIPALES + Hidrografia_mdd'],['Fecha del trazado','No indicada en estas capas']]
    for field,label in [('CUENCA','Cuenca (RioPrin)'),('FUENTE','Fuente (RioPrin)'),('FECREG','Fecha de registro (RioPrin)')]:
        values=sorted({a[field] for a in records if a[field]})
        if values: metadata.append([label,' · '.join(values)])
    topics[key]={'name':labels[key],'text':'Recorrido cartográfico simplificado. Los metadatos de RioPrin corresponden al registro del río en esa capa; no fechan las líneas hidrográficas.','mode':'rios','metadata':metadata}
    rivers.append((key,geom,{'nombre':labels[key],'registros_lineales':attributes[key],'registros_RioPrin':records}))

# Leer el dominio original; nunca inferir el significado de los códigos.
_,_,_,catalog=pyogrio.raw.read(GDB,sql='SELECT Name, Definition FROM GDB_Items',read_geometry=False)
domain_xml=next(definition for name,definition in zip(*catalog) if name=='CATTMA')
domain={int(x.findtext('Code')):x.findtext('Name') for x in ET.fromstring(domain_xml).findall('.//CodedValue')}
water=[]
for fid,g,a in read('MasaAgua',['NOMMAG','TIPMAG','FUENTE','FECREG']):
    geom=make_valid(g).intersection(boundary).simplify(12,preserve_topology=True)
    if geom.is_empty: continue
    key=f'agua-{fid}'
    tipo=domain.get(a['TIPMAG'],'Masa de agua')
    label=f'{tipo} {a["NOMMAG"].title()}' if a['NOMMAG'] else f'{tipo} sin nombre · registro {fid}'
    topics[key]={'name':label,'text':'Clasificación registrada en MasaAgua. Esta capa no constituye un inventario completo de humedales ni permite identificar aguajales.','mode':'humedales','metadata':[['Tipo registrado',tipo],['Capa','MasaAgua'],['Fuente',a['FUENTE'] or 'No indicada'],['Fecha del registro',a['FECREG'] or 'No indicada']]}
    water.append((key,geom,{'id':key,'nombre':a['NOMMAG'],'tipo':tipo,**a}))

to_geo=Transformer.from_crs('EPSG:32719','EPSG:4326',always_xy=True).transform
def feature(geom,props):
    # Seis decimales para GeoJSON compacto, manteniendo la geometría simplificada.
    geo=mapping(transform(to_geo,geom))
    def rounded(x):
        if isinstance(x,(list,tuple)): return [rounded(v) for v in x]
        return round(x,6) if isinstance(x,float) else x
    geo['coordinates']=rounded(geo['coordinates'])
    return {'type':'Feature','geometry':geo,'properties':props}
def write(name,data): (OUT/name).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf8')
write('limite.geojson',{'type':'FeatureCollection','features':[feature(boundary,{'capa':'DISTRITOS_MDD','distritos':11})]})
write('distritos.geojson',{'type':'FeatureCollection','features':[feature(g.simplify(180,preserve_topology=True),a) for _,g,a in districts]})
write('rios.geojson',{'type':'FeatureCollection','features':[feature(g,{'id':key,'nombre':a['nombre'],'capas_trazado':['RIOS_PRINCIPALES','Hidrografia_mdd'],'fecha_trazado':None,'metadatos_RioPrin':a['registros_RioPrin']}) for key,g,a in rivers]})
write('masas-agua.geojson',{'type':'FeatureCollection','features':[feature(g,a) for key,g,a in water]})
write('fichas.json',topics)

xmin,ymin,xmax,ymax=boundary.bounds
scale=min(480/(xmax-xmin),430/(ymax-ymin))
xoff=(600-(xmax-xmin)*scale)/2
yoff=35
def coords(points,closed=False):
    return ' '.join(('M' if i==0 else 'L')+f'{xoff+(p[0]-xmin)*scale:.1f},{yoff+(ymax-p[1])*scale:.1f}' for i,p in enumerate(points))+('Z' if closed else '')
def path(g):
    if g.is_empty:return ''
    if g.geom_type in ('Polygon',): return coords(g.exterior.coords,True)+' '+' '.join(coords(r.coords,True) for r in g.interiors)
    if g.geom_type in ('LineString','LinearRing'):return coords(g.coords)
    return ' '.join(path(part) for part in g.geoms)
bpath=path(boundary)
svg=f'<svg class="selva-territorio-svg" viewBox="0 0 600 510" xmlns="http://www.w3.org/2000/svg" aria-labelledby="territorio-mapa-titulo territorio-mapa-desc"><title id="territorio-mapa-titulo">Cartografía educativa de Madre de Dios</title><desc id="territorio-mapa-desc">Contorno obtenido de once distritos, seis ríos nominales y masas de agua de la geodatabase aportada. Sin cobertura de bosque ni límites distritales visibles.</desc><defs><clipPath id="territorio-limite-clip"><path d="{bpath}"/></clipPath><pattern id="territorio-trama-agua" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 5L5 0" stroke="currentColor" stroke-width=".5" opacity=".25"/></pattern></defs><path class="selva-territorio-limite" fill-rule="evenodd" d="{bpath}"/><g clip-path="url(#territorio-limite-clip)">'
for key,g,a in rivers:
    name=html.escape(labels[key]);d=path(g)
    svg+=f'<g class="selva-territorio-rio" data-mapa-feature="{key}" data-mapa-modo="rios" role="button" tabindex="0" aria-label="{name}" aria-pressed="false"><title>{name}</title><path class="selva-territorio-rio-hit" d="{d}"/><path class="selva-territorio-rio-linea" pathLength="1000" d="{d}"/></g>'
for key,g,a in water:
    name=html.escape(topics[key]['name']);d=path(g)
    svg+=f'<g class="selva-territorio-agua" data-mapa-feature="{key}" data-mapa-modo="humedales" role="button" tabindex="-1" aria-label="{name}" aria-pressed="false"><title>{name}</title><path class="selva-territorio-agua-forma" fill-rule="evenodd" d="{d}"/><path class="selva-territorio-agua-trama" d="{d}"/></g>'
svg+='</g><g class="selva-territorio-orientacion" aria-hidden="true"><path d="M554 64V36m-6 9 6-9 6 9"/><text x="554" y="26">N</text></g><text class="selva-territorio-region-label" x="300" y="495">MADRE DE DIOS</text></svg>'
(OUT/'mapa.svg').write_text(svg,encoding='utf8')
metadata={'archivo_original':GDB.name,'incorporacion':INCORPORACION,'fecha_archivo':'2021-10-07 (nombre del archivo; no sustituye fechas de las capas)','crs_origen':'EPSG:32719','crs_geojson':'EPSG:4326','proyeccion_svg':'EPSG:32719, transformación uniforme al viewBox y eje vertical invertido','capas':{},'dominios':{'MasaAgua.TIPMAG':domain},'procesamiento':{'limite':'Unión de los 11 distritos; reparación de geometrías cuando sea necesaria; simplificación topológica a 180 m. Distritos exportados separados, sin cargar sus límites en la vista.','rios':'Filtrado nominal exacto de seis ríos. Complemento de Hidrografia_mdd fuera del corredor de 80 m de RIos_Principales para evitar duplicación. Unión de tramos reales, recorte departamental, simplificación a 65 m. Sin unir huecos artificialmente.','agua':'Recorte al límite, simplificación topológica a 12 m, clasificación según dominio CATTMA de la GDB.'},'metadatos_rios':{key:a for key,g,a in rivers},'limitaciones':['No se usa Bosques_de_Producción_Permanente como cobertura forestal.','MasaAgua no equivale a una cobertura exhaustiva de humedales.','Las fechas de RioPrin no se atribuyen a los trazados de RIos_Principales o Hidrografia_mdd.','Contorno educativo referencial; atributos distritales conservan situaciones de límite definidas e indefinidas.']}
for layer in ['DISTRITOS_MDD','RIOS_PRINCIPALES','Hidrografia_mdd','RioPrin','MasaAgua']:
    info=pyogrio.read_info(GDB,layer=layer)
    metadata['capas'][layer]={'crs':info['crs'],'entidades_originales':info['features'],'fuente': 'Gobierno Regional Madre de Dios' if layer in ['RioPrin','MasaAgua'] else 'Geodatabase aportada por el usuario; entidad generadora no indicada en los campos de esta capa','fecha_registro':'2020-01-27' if layer in ['RioPrin','MasaAgua'] else None,'incorporacion':INCORPORACION}
write('metadatos.json',metadata)
print(json.dumps({'distritos':len(districts),'rios':{key:{'tramos':len(attributes[key]),'vertices':int(get_num_coordinates(g))} for key,g,a in rivers},'agua':len(water),'tipos':dict(collections.Counter(a['tipo'] for key,g,a in water)),'bytes_svg':len(svg.encode()),'bounds':boundary.bounds},ensure_ascii=True))
