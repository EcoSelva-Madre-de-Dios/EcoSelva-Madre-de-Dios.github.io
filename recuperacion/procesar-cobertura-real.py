"""Procesa solo CobVeg_180615: reproyección, recorte y exportación de cobertura real."""
from pathlib import Path
import os,json,html,hashlib,shutil
import pyogrio
from pyproj import Transformer
from shapely import from_wkb,make_valid,union_all,get_num_coordinates
from shapely.geometry import mapping
from shapely.ops import transform
r=Path.cwd();out=r/'datos/territorio';tmp=Path(os.environ['TEMP'])
p=tmp/'ecoselva-cobertura/mapa_cobertura_vegetal_2015/CobVeg_180615.shp'
gdb=tmp/'ecoselva-gis/GRFFS_Catastro_07_10_2021.gdb'
m,f,w,a=pyogrio.raw.read(gdb,layer='DISTRITOS_MDD',columns=[],return_fids=True)
boundary=union_all([make_valid(from_wkb(x)) for x in w]).simplify(180,preserve_topology=True)
back=Transformer.from_crs(32719,32718,always_xy=True).transform
forward=Transformer.from_crs(32718,32719,always_xy=True).transform
geo=Transformer.from_crs(32719,4326,always_xy=True).transform
m,f,w,cols=pyogrio.raw.read(p,columns=['CobVeg2013','Simbolo','Fisiogr','CV_Label'],bbox=transform(back,boundary).buffer(500).bounds,encoding='CP1252',return_fids=True)
records=[];groups={};raw_attrs=[]
def polygons(g):
 if g.geom_type=='Polygon':return [g]
 if hasattr(g,'geoms'):return [p for part in g.geoms for p in polygons(part)]
 return []
for i,(fid,wkb) in enumerate(zip(f,w)):
 g=make_valid(transform(forward,from_wkb(wkb)))
 if not g.intersects(boundary):continue
 clipped=union_all(polygons(g.intersection(boundary)))
 if clipped.is_empty or clipped.area==0:continue
 attrs={name:None if vals[i] is None else str(vals[i]) for name,vals in zip(m['fields'],cols)}
 key=(attrs['CobVeg2013'],attrs['Simbolo']);groups.setdefault(key,[]).append(clipped)
 records.append({'fid':int(fid),'geometry':clipped,'attributes':attrs})
raw=json.loads(json.dumps({'classification':'CobVeg2013','code':'Simbolo','categories':[{'name':name,'code':code,'records':len(gs)} for (name,code),gs in sorted(groups.items())]},ensure_ascii=False))
print(json.dumps(raw,ensure_ascii=True))
# Disolver únicamente entidades de la misma categoría, conservando polígonos e islas.
xmin,ymin,xmax,ymax=boundary.bounds;scale=min(480/(xmax-xmin),430/(ymax-ymin));xoff=(600-(xmax-xmin)*scale)/2


def coords(points,closed=False):
 return ' '.join(('M' if i==0 else 'L')+f'{xoff+(x-xmin)*scale:.2f},{35+(ymax-y)*scale:.2f}' for i,(x,y,*_) in enumerate(points))+('Z' if closed else '')
def path(g):
 if g.is_empty:return ''
 if g.geom_type=='Polygon':return coords(g.exterior.coords,True)+' '+' '.join(coords(h.coords,True) for h in g.interiors)
 return ' '.join(path(part) for part in g.geoms)
colors=['#B9B09A','#24563A','#748544','#376D50','#827649','#66934E','#386F65','#3E7763','#355447','#78958B','#517568','#A1AA63','#537B38','#496950','#6B9869','#9CA650','#7EAB70','#459D8D','#ABB972','#89A779','#768B49','#78B8C2','#C0AA61','#C9BE83','#408899','#B8C796','#A0B5A0']
forest_categories=[];svg='';web=[];quality=[]
for i,((name,code),parts) in enumerate(sorted(groups.items())):
 key='cobertura-'+code.replace('/','-').lower()
 original=union_all(parts); tolerance=65
 g=original.simplify(tolerance,preserve_topology=True).intersection(boundary)
 while abs(original.area-g.area)/original.area > .01 and tolerance > 1:
  tolerance/=2; g=original.simplify(tolerance,preserve_topology=True).intersection(boundary)
 g=union_all(polygons(make_valid(g)))
 assert g.is_valid and g.difference(boundary).area<.01
 icon='aguajal' if 'palmeras' in name else 'paca' if 'paca' in name.lower() else 'montana' if 'montaña' in name else 'colina' if 'colina' in name else 'terraza' if 'terraza' in name else 'laguna' if code=='L/Co' else 'rios' if code=='R' else 'herbazal' if code in ['Pj','Is'] else 'cobertura-no-bosque' if code=='Ano-ba' else 'bosques'
 props={'codigo_original':code,'categoria_original':name,'categoria_ecoselva':name,'fuente':'Ministerio del Ambiente (MINAM)','fecha':2015,'escala':'1:100 000 (memoria descriptiva)','clasificacion_campo':'CobVeg2013','codigo_campo':'Simbolo','procesamiento':'Reproyección EPSG:32718 → EPSG:32719; recorte al límite actual; disolución por categoría; simplificación topológica de hasta 65 m (menor en categorías pequeñas para limitar la diferencia de área al 1%); recorte final.','id':key,'color':colors[i],'icon':icon}
 forest_categories.append(props)
 attrs=[{'fid':row['fid'],**row['attributes']} for row in records if (row['attributes']['CobVeg2013'],row['attributes']['Simbolo'])==(name,code)]
 web.append({'type':'Feature','properties':{**props,'fid_originales':[a['fid'] for a in attrs]},'geometry':mapping(transform(geo,g))})
 d=path(g)
 svg+=f'<g data-bosque-categoria="{html.escape(code)}" data-forest-category="{key}" data-mapa-feature="{key}" data-mapa-modo="bosques" class="selva-territorio-bosque-real" tabindex="-1" aria-label="{html.escape(name)}" style="fill:{colors[i]}"><title>{html.escape(name)}</title><path fill-rule="evenodd" d="{d}"/></g>'
 quality.append({'codigo_original':code,'categoria_original':name,'registros_recortados':len(parts),'poligonos_web':len(polygons(g)),'vertices_originales':int(get_num_coordinates(original)),'vertices_web':int(get_num_coordinates(g)),'tolerancia_m':tolerance,'poligonos_originales':len(polygons(original)),'diferencia_area_relativa':abs(original.area-g.area)/original.area,'atributos_originales':attrs})
def write(n,v): (out/n).write_text(json.dumps(v,ensure_ascii=False,separators=(',',':')),encoding='utf8')
write('cobertura-vegetal.geojson',{'type':'FeatureCollection','features':web})
write('cobertura-categorias.json',forest_categories)
write('cobertura-trazabilidad.json',quality)
(out/'cobertura-bosques.svg').write_text(svg,encoding='utf8')
shutil.copy2(str(p)+'.xml',out/'CobVeg_180615.shp.xml')
metadata={'archivo_original':'mapa_cobertura_vegetal_2015.zip','shapefile':'CobVeg_180615.shp','sha256_zip':hashlib.sha256(Path(r'C:\Users\USUARIO\Downloads\mapa_cobertura_vegetal_2015.zip').read_bytes()).hexdigest(),'institucion':'Ministerio del Ambiente (MINAM)','publicacion':'Mapa Nacional de Cobertura Vegetal (2015)','anio_publicacion':2015,'fecha_observacion':None,'nota_temporal':'CobVeg2013 es el nombre original del campo; 2015 corresponde a la publicación y no a una fecha uniforme de observación. No representa el estado de 2026.','crs_original':'EPSG:32718','crs_svg':'EPSG:32719','crs_geojson':'EPSG:4326','codificacion_dbf':'CP1252 (verificada mediante lectura de acentos; el ZIP no incluye CPG)','geometria_original':'Polygon','entidades_nacionales':105354,'categorias_nacionales':75,'campos_originales':['CobVeg2013','Simbolo','Fisiogr','Shape_Leng','Shape_Area','CV_Label'],'campo_clasificacion':'CobVeg2013','campo_codigo':'Simbolo','categorias_recortadas':len(groups),'entidades_con_interseccion':len(records),'escala_publicacion':'1:100 000 según memoria descriptiva; escala del shapefile no indicada en XML','fecha_incorporacion':'2026-10-02','limite_recorte':'Límite actual derivado de DISTRITOS_MDD; no se reprocesaron ríos ni masas de agua.','procesamiento':forest_categories[0]['procesamiento'],'simplificacion_m':65,'redondeo_svg_decimales':2,'equivalencias':'Sin agrupación a cuatro tipos educativos. Categoria EcoSelva conserva exactamente la categoría original.','fuentes_verificacion':['https://geoservidorperu.minam.gob.pe/arcgis/rest/services/ServicioDegradacion/MapServer/12','https://www.gob.pe/institucion/minam/informes-publicaciones/2674-mapa','https://www.datosabiertos.gob.pe/dataset/cobertura-vegetal-ministerio-del-ambiente'],'nota_coberturas':'Se conservan las 27 clases que intersectan el departamento, incluidas las no forestales y clases de agua propias de esta cobertura de 2015; no sustituyen las capas de Ríos ni Humedales.'}
write('cobertura-metadatos.json',metadata)
print(json.dumps({'categorias':len(groups),'registros':len(records),'bytes_svg':len(svg.encode('utf8')),'vertices_web':sum(q['vertices_web'] for q in quality),'max_diferencia_area':max(q['diferencia_area_relativa'] for q in quality)},ensure_ascii=True))
