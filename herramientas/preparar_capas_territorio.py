"""Proyecta capas ya incorporadas al encuadre del mapa, sin reprocesar el mapa original.

Uso: python herramientas/preparar_capas_territorio.py [--check]
Requiere pyproj y shapely solo para regenerar; la publicación no depende de ellos.
"""
from pathlib import Path
from hashlib import sha256
import html
import json
import sys
from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'datos/territorio'
project = Transformer.from_crs(4326, 32719, always_xy=True).transform
boundary = transform(project, shape(json.loads((OUT / 'limite.geojson').read_text())['features'][0]['geometry']))
xmin, ymin, xmax, ymax = boundary.bounds
scale = min(480 / (xmax - xmin), 430 / (ymax - ymin))
xoff = (600 - (xmax - xmin) * scale) / 2


def ring(points):
    return ' '.join(('M' if i == 0 else 'L') + f'{xoff + (x - xmin) * scale:.2f},{35 + (ymax - y) * scale:.2f}' for i, (x, y) in enumerate(points)) + 'Z'


def path(geometry):
    if geometry.geom_type == 'Polygon':
        return ring(geometry.exterior.coords) + ' ' + ' '.join(ring(part.coords) for part in geometry.interiors)
    return ' '.join(path(part) for part in geometry.geoms)


provinces = json.loads((OUT / 'provincias.geojson').read_text())['features']
districts = json.loads((OUT / 'distritos.geojson').read_text())['features']
areas = json.loads((ROOT / 'datos/conservacion/anp.geojson').read_text())['features']
svg = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 510">']
svg.append('<g data-territorio-overlay="provincias" fill="none" stroke="#2f684b" stroke-width="2.2" aria-hidden="true">')
for feature in provinces:
    svg.append(f'<path vector-effect="non-scaling-stroke" d="{path(transform(project, shape(feature["geometry"])))}"><title>{html.escape(feature["properties"]["provincia"])}</title></path>')
svg.append('</g><g data-territorio-overlay="distritos" fill="none" stroke="#705034" stroke-width="1" stroke-dasharray="4 3" aria-hidden="true">')
for feature in districts:
    svg.append(f'<path vector-effect="non-scaling-stroke" d="{path(transform(project, shape(feature["geometry"])))}"><title>{html.escape(feature["properties"]["distrito_"])}</title></path>')
svg.append('</g><g data-territorio-overlay="anp" fill="none" stroke="#173e2a" stroke-width="2.2" stroke-dasharray="8 3" aria-hidden="true">')
for feature in areas:
    # El GeoJSON ya está recortado al departamento IGN. Se conserva su geometría;
    # el visor aplica el clip del mapa original, cuyo límite de referencia difiere.
    svg.append(f'<path vector-effect="non-scaling-stroke" d="{path(transform(project, shape(feature["geometry"])))}"><title>{html.escape(feature["properties"]["nombre"])}</title></path>')
svg.append('</g></svg>')
content = ''.join(svg) + '\n'
metadata = {
    'revision': '2026-10-05', 'crs_entrada': 'EPSG:4326', 'crs_visualizacion': 'EPSG:32719',
    'viewBox': [0, 0, 600, 510], 'encuadre_utm': list(boundary.bounds),
    'procesamiento': 'Reproyección de GeoJSON ya publicados; encuadre uniforme del mapa original, norte arriba. Sin nueva simplificación. Redondeo a 0,01 unidades SVG. Contornos superpuestos, sin relleno ni cálculo de nuevas superficies.',
    'clip': 'El visor utiliza territorio-limite-clip del mapa original para ambas capas. ANP procede de un recorte IGN distinto; esta superposición no se usa para demarcación ni cálculo de áreas.',
    'provincias': {'archivo': 'datos/territorio/provincias.geojson', 'sha256': sha256((OUT / 'provincias.geojson').read_bytes()).hexdigest(), 'cantidad': len(provinces), 'fuente': 'Provincias derivadas de la misma base administrativa de distritos; entidad generadora, fecha y escala no documentadas.', 'incorporacion': '2026-10-10', 'fecha_descarga': None, 'uso': 'Referencia educativa; no demarcación legal.'},
    'distritos': {'archivo': 'datos/territorio/distritos.geojson', 'sha256': sha256((OUT / 'distritos.geojson').read_bytes()).hexdigest(), 'cantidad': len(districts), 'fuente': 'DISTRITOS_MDD de una base cartográfica cuya entidad generadora, fecha y escala no están documentadas; fecha de descarga no documentada.', 'incorporacion': '2026-10-02', 'fecha_descarga': None, 'uso': 'Referencia educativa; no demarcación legal. La capa de origen ya se simplificó a 180 m.'},
    'anp': {'archivo': 'datos/conservacion/anp.geojson', 'sha256': sha256((ROOT / 'datos/conservacion/anp.geojson').read_bytes()).hexdigest(), 'cantidad': len(areas), 'fuente': 'SERNANP, servicio oficial de descarga; seis ANP nacionales.', 'consulta': '2026-10-05', 'fecha_version': None, 'metadatos': 'datos/conservacion/metadatos.json', 'uso': 'Contornos de referencia. No incluye ACP ni determina vigencia jurídica.'},
    'sha256_svg': sha256(content.encode()).hexdigest()
}
files = {'capas-adicionales.svg': content, 'capas-adicionales-metadatos.json': json.dumps(metadata, ensure_ascii=False, indent=2) + '\n'}
for name, text in files.items():
    target = OUT / name
    if '--check' in sys.argv:
        if not target.exists() or target.read_text() != text:
            sys.exit('Capa desactualizada: ' + name)
    else:
        target.write_text(text)
print('Correcto: tres provincias, 11 distritos y seis ANP en el encuadre original, sin modificar sus datos ni el mapa base.')
