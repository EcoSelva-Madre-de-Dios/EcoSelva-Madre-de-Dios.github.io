"""Inspección de solo lectura. No convierte, repara ni simplifica las capas.

Uso: python inventariar_capas.py [archivo.shp ...] --salida /tmp/inventario
Requiere shapely, pyproj y pyshp; el sitio publicado no necesita estas librerías.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path

from pyproj import CRS
from shapely.geometry import shape
from shapely.validation import explain_validity

ROOT = Path(__file__).resolve().parents[1]


def load(name):
    return json.loads((ROOT / name).read_text())


def provenance(path):
    territory = load('datos/territorio/metadatos.json')
    forest = load('datos/territorio/cobertura-metadatos.json')
    conservation = load('datos/conservacion/metadatos.json')
    name = path.name
    if name == 'anp.geojson':
        m = conservation['capas']['anp']
        return {'fuente': m['institucion'], 'fecha': m['fecha_version'],
                'consulta': m['consulta_utc'], 'crs_origen': m['crs_descarga'],
                'escala': None, 'metadatos': 'datos/conservacion/metadatos.json'}
    if name == 'cobertura-vegetal.geojson':
        return {'fuente': forest['institucion'], 'fecha': forest['publicacion'],
                'fecha_observacion': forest['fecha_observacion'],
                'crs_origen': forest['crs_original'], 'escala': forest['escala_publicacion'],
                'metadatos': 'datos/territorio/cobertura-metadatos.json',
                'limitaciones': [forest['nota_temporal'], forest['nota_coberturas']]}
    if name == 'masas-agua.geojson':
        m = territory['capas']['MasaAgua']
        return {'fuente': m['fuente'], 'fecha': m['fecha_registro'],
                'crs_origen': m['crs'], 'escala': None,
                'metadatos': 'datos/territorio/metadatos.json',
                'limitaciones': ['MasaAgua no es un inventario exhaustivo de humedales.']}
    return {'fuente': 'Base cartográfica cuya entidad generadora, fecha y escala no están documentadas',
            'fecha': None, 'escala': None, 'crs_origen': territory['crs_origen'],
            'metadatos': 'datos/territorio/metadatos.json',
            'limitaciones': territory['limitaciones'],
            'nota_fecha': '2021-10-07 procede del nombre del archivo, no fecha de observación.'}


def audit(path):
    path = path.resolve()
    warnings = []
    if path.suffix.lower() == '.shp':
        import shapefile
        reader = shapefile.Reader(str(path))
        fields = [f[0] for f in reader.fields[1:]]
        features = [{'geometry': s.shape.__geo_interface__ if s.shape.shapeType else None, 'properties': dict(zip(fields, s.record))}
                    for s in reader.iterShapeRecords()]
        prj = path.with_suffix('.prj')
        try:
            crs = CRS.from_wkt(prj.read_text()) if prj.exists() else None
        except Exception:
            crs = None
            warnings.append('PRJ ilegible o CRS inválido: no se asumió un sistema de coordenadas.')
        meta = {'fuente': None, 'fecha': None, 'escala': None,
                'nota': 'Completar fuente, fecha y escala con documentación del proveedor.'}
        companions = {suffix: path.with_suffix(suffix).exists() for suffix in ['.shx', '.dbf', '.prj', '.cpg']}
    else:
        doc = json.loads(path.read_text())
        features = doc.get('features', [])
        declared = doc.get('crs', {}).get('properties', {}).get('name')
        crs = CRS.from_user_input(declared or 'EPSG:4326')
        known = path.is_relative_to(ROOT / 'datos')
        meta = provenance(path) if known else {'fuente': None, 'fecha': None, 'escala': None}
        meta['crs_web'] = 'EPSG:4326 según metadatos existentes; lon/lat GeoJSON' if known else 'CRS declarado en GeoJSON o convención lon/lat; confirmar documentación del proveedor.'
        companions = None
    nulls, duplicates = Counter(), Counter()
    invalid, empty, multipart = [], [], []
    bounds = None
    signatures = {}
    for i, feature in enumerate(features):
        properties = feature.get('properties') or {}
        for key, value in properties.items():
            if value is None: nulls[key] += 1
        geom = feature.get('geometry')
        if not geom:
            empty.append(i); continue
        g = shape(geom)
        if g.is_empty:
            empty.append(i); continue
        if not g.is_valid: invalid.append({'indice': i, 'problema': explain_validity(g)})
        if g.geom_type.startswith('Multi') or g.geom_type == 'GeometryCollection': multipart.append(i)
        if bounds is None: bounds = list(g.bounds)
        else: bounds = [min(bounds[0], g.bounds[0]), min(bounds[1], g.bounds[1]), max(bounds[2], g.bounds[2]), max(bounds[3], g.bounds[3])]
        signature = hashlib.sha256(g.normalize().wkb).hexdigest()
        if signature in signatures: duplicates[i] = signatures[signature]
        else: signatures[signature] = i
    fields = {}
    for f in features:
        for key, value in (f.get('properties') or {}).items():
            fields.setdefault(key, set()).add(type(value).__name__)
    geometry_types = Counter((f.get('geometry') or {}).get('type', 'nula') for f in features)
    if crs is None: warnings.append('Falta PRJ: CRS sin confirmar; no convertir ni calcular áreas.')
    elif crs.is_geographic and bounds and (bounds[0] < -180 or bounds[2] > 180 or bounds[1] < -90 or bounds[3] > 90):
        warnings.append('Coordenadas incompatibles con el rango geográfico del CRS declarado.')
    if invalid: warnings.append('Geometrías inválidas detectadas en la copia inspeccionada; no se repararon.')
    if not meta.get('fecha'): warnings.append('Fecha de observación/versión no documentada.')
    if not meta.get('escala'): warnings.append('Escala de origen no documentada.')
    return {'archivo': str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else str(path),
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'elementos': len(features),
            'geometrias': dict(geometry_types), 'crs': crs.to_string() if crs else None,
            'unidades': [a.unit_name for a in crs.axis_info] if crs else None,
            'extension': bounds, 'campos': {k: sorted(v) for k, v in fields.items()},
            'nulos': dict(nulls), 'vacias': empty, 'invalidas': invalid,
            'multipartes': len(multipart), 'duplicados_geometricos': dict(duplicates),
            'archivos_complementarios': companions, 'procedencia': meta, 'problemas': warnings}


def markdown(records):
    scope = ('Inspección de solo lectura de los archivos originales indicados.' if any(r['archivo'].lower().endswith('.shp') for r in records)
             else 'Inspección de solo lectura de las copias web disponibles. No hay shapefiles originales en el repositorio: la validez de los originales no puede certificarse con estas copias.')
    lines = ['# Inventario cartográfico previo al refinamiento', '',
             scope + ' No se reproyectó, reparó, simplificó ni sustituyó ninguna geometría.', '',
             '| Capa web | Elementos | Geometría | CRS web | CRS de origen documentado | Fecha |',
             '|---|---:|---|---|---|---|']
    for r in records:
        m = r['procedencia']
        lines.append(f"| {r['archivo']} | {r['elementos']} | {', '.join(r['geometrias'])} | {r['crs'] or 'Sin confirmar'} | {m.get('crs_origen') or 'Sin documentar'} | {m.get('fecha') or 'Sin documentar'} |")
    for r in records:
        m = r['procedencia']
        lines += ['', '## ' + r['archivo'], '',
                  f"Fuente: {m.get('fuente') or 'Sin documentar'}. Escala: {m.get('escala') or 'Sin documentar'}.",
                  f"Extensión (orden x/y): `{r['extension']}`. Unidades: {r['unidades']}.",
                  f"Campos: `{', '.join(r['campos'])}`.",
                  f"Nulos por campo: `{r['nulos']}`. Multipartes: {r['multipartes']}; vacías: {len(r['vacias'])}; inválidas: {len(r['invalidas'])}; duplicados geométricos: {len(r['duplicados_geometricos'])}.",
                  f"SHA-256: `{r['sha256']}`."]
        for issue in r['problemas'] + m.get('limitaciones', []): lines.append('- ' + issue)
        for issue in r['invalidas']: lines.append(f"- Índice {issue['indice']}: {issue['problema']}.")
    if not any(r['archivo'].lower().endswith('.shp') for r in records):
        lines += ['', '## Archivos auxiliares disponibles', '',
                  'Los SVG son derivados de visualización, no fuentes nuevas. Su CRS y transformación constan en los metadatos. Los JSON de fichas y categorías conservan atributos y textos; no son capas adicionales. El XML de MINAM documenta el shapefile cuyo original no está presente.', '',
                  '| Archivo | Bytes | Papel |', '|---|---:|---|']
        for directory in ['datos/territorio', 'datos/conservacion']:
            for p in sorted((ROOT / directory).iterdir()):
                if p.is_file() and p.suffix != '.geojson':
                    role = 'Visualización SVG' if p.suffix == '.svg' else 'Metadatos de proveedor' if p.suffix == '.xml' else 'Metadatos / atributos / contenido del visor'
                    lines.append(f'| {p.relative_to(ROOT)} | {p.stat().st_size} | {role} |')
    lines += ['', '## Decisión de presentación', '',
              'Conservar SVG: admite capas, zoom, desplazamiento, etiquetas por escala y detección de colisiones sin incorporar un motor externo. La presentación puede refinarse sin editar coordenadas ni valores oficiales.', '',
              'Los errores encontrados se informan; no se corrigen silenciosamente. Las fechas de consulta e incorporación no son fechas de observación. MINAM 2015 es una publicación histórica; los límites distritales tienen limitaciones documentales. La capa de ANP usa otra base departamental IGN: no fusionar bases como si fueran equivalentes.', '',
              '## Recepción de shapefiles nuevos', '',
              '1. Guardar original y componentes sin cambios, con hash y documentación del proveedor.',
              '2. Ejecutar este inventario y devolver CRS/EPSG, campos, geometrías, cantidad, fecha, fuente, escala, unidades y problemas antes de convertir o diseñar.',
              '3. Comparar en un informe: **capa actual / capa nueva / diferencia / recomendación**. Registrar diferencias de fuente, fecha, CRS, atributos, resolución y geometría; no reemplazar automáticamente.',
              '4. Después de la revisión, procesar una copia en CRS métrico apropiado y exportar una copia web. Documentar cada paso. Preservar atributos oficiales; rotular cualquier medida derivada como cálculo EcoSelva.',
              '5. Si se simplifica, elegir tolerancias por capa y tamaño de entidad, medir cambio de área, forma y topología, y conservar el original. El inventario por sí solo nunca inicia este procesamiento.', '']
    return '\n'.join(lines)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archivos', nargs='*', type=Path)
    parser.add_argument('--salida', type=Path, default=ROOT / 'documentacion/inventario-cartografico')
    args = parser.parse_args()
    paths = args.archivos or sorted((ROOT / 'datos').rglob('*.geojson'))
    records = [audit(p) for p in paths]
    args.salida.parent.mkdir(parents=True, exist_ok=True)
    args.salida.with_suffix('.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
    args.salida.with_suffix('.md').write_text(markdown(records))
    for r in records:
        print(r['archivo'], r['elementos'], r['geometrias'], 'invalidas:', len(r['invalidas']), 'duplicados:', len(r['duplicados_geometricos']))
