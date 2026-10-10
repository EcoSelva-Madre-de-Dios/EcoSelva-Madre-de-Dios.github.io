"""Prepara puntos de etiqueta y separa copias SVG, sin cambiar las capas existentes.

Ejecutar únicamente después de devolver el inventario. Requiere pyproj y shapely.
No simplifica, no repara, no calcula superficies y no sustituye datos oficiales.
"""
from hashlib import sha256
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'datos/presentacion'
OUT.mkdir(exist_ok=True)
forward = Transformer.from_crs(4326, 32719, always_xy=True).transform
boundary = transform(forward, shape(json.loads((ROOT / 'datos/territorio/limite.geojson').read_text())['features'][0]['geometry']))
xmin, ymin, xmax, ymax = boundary.bounds
scale = min(480 / (xmax - xmin), 430 / (ymax - ymin))
xoff = (600 - (xmax - xmin) * scale) / 2
labels = []
inputs = ['datos/territorio/limite.geojson', 'datos/territorio/provincias.geojson', 'datos/territorio/distritos.geojson', 'datos/conservacion/anp.geojson']
inputs += ['datos/territorio/masas-agua.geojson', 'datos/territorio/cobertura-vegetal.geojson']
for source, kind, key in [(inputs[1], 'provincias', 'provincia'), (inputs[2], 'distritos', 'distrito_'), (inputs[3], 'anp', 'nombre'),
                          (inputs[4], 'humedales', 'nombre'), (inputs[5], 'bosques', 'categoria_original')]:
    for f in json.loads((ROOT / source).read_text())['features']:
        g = transform(forward, shape(f['geometry']))
        # Punto interior de la componente más grande; nunca un centroide externo.
        if hasattr(g, 'geoms'): g = max(g.geoms, key=lambda part: part.area)
        p = g.representative_point()
        labels.append({'capa': kind, 'nombre': f['properties'][key],
                       'id': f['properties'].get('id'),
                       'x': round(xoff + (p.x - xmin) * scale, 3),
                       'y': round(35 + (ymax - p.y) * scale, 3),
                       'categoria': f['properties'].get('categoria')})
original = ROOT / 'datos/territorio/capas-adicionales.svg'
svg = original.read_text()
for kind in ['provincias', 'distritos', 'anp']:
    group = re.search(r'<g data-territorio-overlay="' + kind + r'".*?</g>', svg).group()
    (OUT / (kind + '.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 510">' + group + '</svg>\n')
inputs.append(str(original.relative_to(ROOT)))
base = ROOT / 'datos/territorio/mapa.svg'
inputs.append(str(base.relative_to(ROOT)))
ET.register_namespace('', 'http://www.w3.org/2000/svg')
tree = ET.fromstring(base.read_text())
coverage = next(node for node in tree.iter() if node.get('id') == 'territorio-bosques-capa')
forest = ET.Element('{http://www.w3.org/2000/svg}svg', {'viewBox': '0 0 600 510'})
forest.append(ET.fromstring(ET.tostring(coverage)))
(OUT / 'bosques.svg').write_bytes(ET.tostring(forest))
for group in coverage:
    for child in list(group):
        if child.tag.endswith('path'): group.remove(child)
(OUT / 'mapa-base.svg').write_bytes(ET.tostring(tree))
metadata = {'metodo': 'Puntos interiores calculados sobre copias proyectadas a EPSG:32719. Las copias SVG contienen exactamente los grupos existentes, sin modificar coordenadas.',
            'crs_visualizacion': 'EPSG:32719', 'metros_por_unidad_svg': 1 / scale,
            'fuentes_sha256': {name: sha256((ROOT / name).read_bytes()).hexdigest() for name in inputs},
            'etiquetas': labels}
(OUT / 'etiquetas.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
print('Puntos interiores de etiqueta y copias SVG separadas; fuentes intactas.')
