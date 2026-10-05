"""Genera el mapa educativo desde cuatro descargas oficiales de GeoSERNANP.

Uso: python preparar_mapa_conservacion.py CARPETA_DESCARGAS
Dependencias solo para regenerar: shapely 2.1.2, pyproj 3.8.0.
Las consultas originales, hashes y condiciones se conservan en metadatos.json.
La publicación utiliza los archivos preparados; no necesita estas dependencias.
"""
import hashlib
import json
import sys
import unicodedata
from html import escape
from pathlib import Path
from urllib.parse import urlencode

from pyproj import Transformer
from shapely import make_valid, get_num_coordinates
from shapely.geometry import shape, mapping, Polygon, MultiPolygon
from shapely.ops import transform, unary_union

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'datos/conservacion'
SERVICES = {
    'anp': 'https://geoservicios.sernanp.gob.pe/arcgis/rest/services/sernanp_visor/servicio_descarga/MapServer/1',
    'departamento': 'https://geospatial.sernanp.gob.pe/arcgis_server/rest/services/sernanp_peru/peru_ign_002000/MapServer/0',
    'provincias': 'https://geospatial.sernanp.gob.pe/arcgis_server/rest/services/sernanp_peru/peru_ign_002000/MapServer/1',
    'rios': 'https://geospatial.sernanp.gob.pe/arcgis_server/rest/services/sernanp_peru/peru_hidrografia_001700/MapServer/0',
}
WHERES = {
    'anp': "anp_codi IN ('PN03','PN08','PN11','RN09','RC03','RC06')",
    'departamento': "UPPER(departamen)='MADRE DE DIOS'",
    'provincias': "UPPER(departamen)='MADRE DE DIOS'",
    'rios': "id_dpto='17' AND UPPER(nom_hpl) IN ('MADRE DE DIOS','TAMBOPATA','MANU','RÍO MANU','TAHUAMANU','LAS PIEDRAS','HEATH','INAMBARI')",
}


def polygons(g):
    if isinstance(g, (Polygon, MultiPolygon)):
        return g
    parts = [polygons(p) for p in getattr(g, 'geoms', ())]
    return unary_union([p for p in parts if not p.is_empty])


def run(folder):
    DEST.mkdir(parents=True, exist_ok=True)
    model = json.loads((DEST / 'areas.json').read_text())
    records = {r['codigo']: r for r in model['areas']}
    forward = Transformer.from_crs(4326, 32719, always_xy=True).transform
    backward = Transformer.from_crs(32719, 4326, always_xy=True).transform
    layers, metadata = {}, {}
    for name, service in SERVICES.items():
        raw = (folder / f'{name}-original.geojson').read_bytes()
        data = json.loads(raw)
        layers[name] = data['features']
        metadata[name] = {
            'institucion': 'SERNANP' if name in ('anp', 'rios') else 'IGN · Proyecto Atlas Digital del Perú, servido por GeoSERNANP',
            'url_servicio': service,
            'consulta': service + '/query?' + urlencode(dict(f='geojson', outFields='*', returnGeometry='true', outSR=4326, where=WHERES[name])),
            'crs_descarga': 'EPSG:4326',
            'fecha_version': 'No expuesta por el servicio' if name in ('anp', 'rios') else 'Registro de referencia: 2018-09-18; no fecha de demarcación legal',
            'consulta_utc': '2026-10-05',
            'sha256_descarga': hashlib.sha256(raw).hexdigest(),
            'bytes_descarga': len(raw), 'elementos_descarga': len(data['features']),
        }
    dept = polygons(make_valid(transform(forward, shape(layers['departamento'][0]['geometry']))))
    xmin, ymin, xmax, ymax = dept.bounds
    scale = 820 / (xmax - xmin)
    height = round((ymax - ymin) * scale + 90)
    def xy(x, y):
        return f'{(x-xmin)*scale+40:.1f},{(ymax-y)*scale+40:.1f}'
    def path(g):
        if g.is_empty:
            return ''
        if g.geom_type == 'Polygon':
            rings = [g.exterior, *g.interiors]
            return ''.join('M' + 'L'.join(xy(x, y) for x, y, *_ in ring.coords) + 'Z' for ring in rings)
        if g.geom_type in ('LineString', 'LinearRing'):
            return 'M' + 'L'.join(xy(x, y) for x, y, *_ in g.coords)
        return ''.join(path(part) for part in g.geoms)
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 {height}" role="group" aria-labelledby="anp-svg-titulo anp-svg-desc">',
           '<title id="anp-svg-titulo">Áreas protegidas nacionales en Madre de Dios</title>',
           '<desc id="anp-svg-desc">Seis geometrías oficiales recortadas al departamento. Los números identifican áreas, no puntos de ingreso. Límites provinciales y ríos de referencia. Fuente: SERNANP e IGN.</desc>',
           '<defs><pattern id="anp-rn" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#d8ecec"/><path d="M-1,1L9,11M4,-4L14,6" stroke="#39757a" stroke-width="1"/></pattern><pattern id="anp-rc" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#eddfd1"/><circle cx="3" cy="3" r="1.4" fill="#81512f"/></pattern></defs>',
           '<style>.anp-poligono{stroke:#284f42;stroke-width:1.5;fill-rule:evenodd}.anp-PN .anp-poligono{fill:#90b59b}.anp-RN .anp-poligono{fill:url(#anp-rn)}.anp-RC .anp-poligono{fill:url(#anp-rc)}.anp-numero{font:bold 17px sans-serif;fill:#173c2d;text-anchor:middle;pointer-events:none}.anp-numero-fondo{fill:#fff;stroke:#173c2d;stroke-width:1.5;pointer-events:none}.anp-provincia{font:16px sans-serif;fill:#4b5850;text-anchor:middle;paint-order:stroke;stroke:#f8f7ee;stroke-width:4px;pointer-events:none}.anp-zona:focus .anp-poligono{stroke:#121f1b;stroke-width:4}.anp-zona:focus{outline:none}@media(max-width:700px){.anp-numero{font-size:34px}.anp-numero-fondo{r:23px}.anp-provincia{font-size:32px}}</style>',
           f'<path d="{path(dept.simplify(250, preserve_topology=True))}" fill="#f0efe4" stroke="#63716a" stroke-width="2"/>']
    features, controls, original_points, result_points = [], [], 0, 0
    for r in model['areas']:
        feature = next(f for f in layers['anp'] if f['properties']['anp_codi'] == r['codigo'])
        full = polygons(make_valid(transform(forward, shape(feature['geometry']))))
        clipped = polygons(make_valid(full.intersection(dept)))
        tolerance = 300
        simplified = polygons(make_valid(clipped.simplify(tolerance, preserve_topology=True)))
        while abs(simplified.area - clipped.area) / clipped.area > .005 and tolerance > 10:
            tolerance /= 2
            simplified = polygons(make_valid(clipped.simplify(tolerance, preserve_topology=True)))
        if simplified.is_empty or not simplified.is_valid:
            raise ValueError(f'Geometría inválida: {r["codigo"]}')
        error = abs(simplified.area - clipped.area) / clipped.area * 100
        if error > 1:
            raise ValueError(f'Simplificación altera más del 1%: {r["codigo"]}')
        original_points += get_num_coordinates(full)
        result_points += get_num_coordinates(simplified)
        controls.append({'codigo': r['codigo'], 'tipo': simplified.geom_type, 'valida': True, 'tolerancia_metros': tolerance, 'puntos_originales': int(get_num_coordinates(full)), 'puntos_finales': int(get_num_coordinates(simplified)), 'variacion_area_recortada_pct': round(error, 5)})
        # Round coordinates only after valid metric processing; six decimals ≈ 0.1 m.
        rounded = json.loads(json.dumps(mapping(transform(backward, simplified)), default=float), parse_float=lambda n: round(float(n), 6))
        features.append({'type': 'Feature', 'properties': {k: r[k] for k in ('id', 'codigo', 'nombre', 'categoria', 'departamentos', 'total_ha', 'mdd_ha')}, 'geometry': rounded})
        point = max(getattr(simplified, 'geoms', (simplified,)), key=lambda p: p.area).representative_point()
        sx, sy = xy(point.x, point.y).split(',')
        svg.append(f'<a class="anp-zona anp-{r["tipo"]}" href="../../areas-protegidas.html#ficha-{r["id"]}-contenido" data-anp="{r["id"]}" data-categoria="{r["tipo"]}" aria-label="{escape(r["nombre"])} · {r["categoria"]}"><title>{escape(r["nombre"])} · {r["categoria"]}</title><path class="anp-poligono" d="{path(simplified)}"/><circle class="anp-numero-fondo" cx="{sx}" cy="{sy}" r="13"/><text class="anp-numero" x="{sx}" y="{float(sy)+6:.1f}">{r["numero"]}</text></a>')
    for f in layers['provincias']:
        g = polygons(make_valid(transform(forward, shape(f['geometry'])))).intersection(dept)
        svg.append(f'<path d="{path(g.simplify(250, preserve_topology=True).boundary)}" fill="none" stroke="#6b766d" stroke-width="1.3" stroke-dasharray="5 5" pointer-events="none"/>')
    rivers = unary_union([transform(forward, shape(f['geometry'])) for f in layers['rios']]).intersection(dept).simplify(100, preserve_topology=True)
    svg.append(f'<path d="{path(rivers)}" fill="none" stroke="#34787f" stroke-width="1.8" opacity=".85" pointer-events="none"/>')
    for f in layers['provincias']:
        g = transform(forward, shape(f['geometry']));p = g.representative_point()
        sx, sy = xy(p.x, p.y).split(',')
        sy = float(sy) + 48
        svg.append(f'<text class="anp-provincia" x="{sx}" y="{sy:.1f}">{escape(f["properties"]["provincia"].title())}</text>')
    svg += ['<g fill="#344b40" font-family="sans-serif" font-size="16"><text x="855" y="34">N</text><path d="M860,42L855,63L865,63Z"/>', f'<path d="M40,{height-26}h{100000*scale:.1f}" fill="none" stroke="#344b40" stroke-width="3"/><text x="40" y="{height-6}">0</text><text x="{40+100000*scale:.1f}" y="{height-6}" text-anchor="end">100 km</text></g></svg>']
    (DEST / 'mapa.svg').write_text(''.join(svg))
    (DEST / 'anp.geojson').write_text(json.dumps({'type': 'FeatureCollection', 'features': features}, ensure_ascii=False, separators=(',', ':')))
    meta = {
        'titulo': 'Mapa educativo de conservación · EcoSelva Madre de Dios',
        'revision_ecoselva': '2026-10-04', 'capas': metadata,
        'crs_procesamiento': 'EPSG:32719 · WGS 84 / UTM 19S', 'crs_geojson': 'EPSG:4326',
        'recorte': 'ANP y ríos contra geometría IGN departamental sin simplificar; límite referencial de registro 2018',
        'simplificacion_metros': {'anp': '300 m máximo; adaptativa hasta variación de área ≤0,5 %, tolerancia por ANP en control_geometria', 'departamento': 250, 'provincias': 250, 'rios': 100},
        'metodo': 'Shapely make_valid → intersección métrica → simplificación preserve_topology → validación → GeoJSON (6 decimales) y SVG (0.1 unidades). Escala lineal en UTM 19S.',
        'versiones': {'shapely': '2.1.2', 'pyproj': '3.8.0'}, 'control_geometria': controls,
        'puntos_anp_originales': int(original_points), 'puntos_anp_finales': int(result_points),
        'dimensiones_svg': [900, height],
        'atributos_publicados': ['id', 'codigo', 'nombre', 'categoria', 'departamentos', 'total_ha', 'mdd_ha'],
        'condiciones': {'url': 'https://geo.sernanp.gob.pe/visorsernanp/', 'lectura': 'El visor autoriza la utilización y creación de mapas derivados pertenecientes al SERNANP cuando se referencia al SERNANP como fuente. No se atribuye una licencia Creative Commons a las capas. IGN identificado como fuente de límites referenciales.'},
        'limitaciones': ['Educativo: no define demarcación legal, rutas ni accesos.', 'Los valores legales y departamentales proceden de documentos oficiales, nunca del área calculada del dibujo recortado.', 'No contiene posiciones de comunidades ni PIACI, carreteras, minería o incendios.', 'ACP excluidas: el listado 2026 contiene plazos vencidos y no permite confirmar un total vigente.', 'Los números identifican polígonos; no indican lugares de visita.'],
    }
    (DEST / 'metadatos.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n')
    print(f'Mapa: {original_points} → {result_points} puntos ANP; SVG {len((DEST / "mapa.svg").read_bytes())} bytes. Seis geometrías válidas.')


if __name__ == '__main__':
    run(Path(sys.argv[1]))
