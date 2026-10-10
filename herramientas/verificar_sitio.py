"""Comprueba las páginas y sus recursos antes de publicar, sin dependencias externas."""
from collections import Counter
from datetime import date
from decimal import Decimal, InvalidOperation
from html.parser import HTMLParser
from pathlib import Path
from hashlib import sha256
from urllib.parse import unquote, urlsplit
from xml.etree import ElementTree as ET
import json
import csv
import re
import sys
from actualizar_ficha_castana import COLUMNS, check_generated
import actualizar_biblioteca
import actualizar_flora
import actualizar_assets
import actualizar_navegacion

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://ecoselva-madre-de-dios.github.io'
PAGES = ('index.html', 'fuentes-metodologia.html', 'fichas/castana.html', 'historia.html', 'areas-protegidas.html', 'biblioteca.html', 'flora.html', 'territorio.html')
ENTRYPOINTS = PAGES + ('google46599e54e679b03a.html', 'robots.txt', 'sitemap.xml')


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids, self.anchors, self.resources, self.images, self.scripts = [], [], [], [], []
        self.errors, self.main_count = [], 0
        self.json_blocks, self.current_json = [], None
        self.lang, self.in_head = '', False
        self.metadata, self.links = {}, {}

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'html':
            self.lang = attrs.get('lang', '')
        if tag == 'head':
            self.in_head = True
        if self.in_head and tag == 'meta':
            self.metadata[attrs.get('property') or attrs.get('name')] = attrs.get('content', '')
        if self.in_head and tag == 'link':
            for rel in attrs.get('rel', '').split():
                self.links.setdefault(rel, []).append(attrs.get('href', ''))
        if attrs.get('id'):
            self.ids.append(attrs['id'])
        if tag == 'main':
            self.main_count += 1
        if tag == 'button' and attrs.get('type') not in ('button', 'submit', 'reset'):
            self.errors.append('Botón sin tipo explícito.')
        if tag == 'img':
            self.images.append(attrs)
            if 'alt' not in attrs or not all(attrs.get(key, '').isdigit() and int(attrs[key]) > 0 for key in ('width', 'height')):
                self.errors.append(f'Imagen sin alt o dimensiones: {attrs.get("src")}')
        if tag == 'a' and attrs.get('href'):
            self.anchors.append(attrs['href'])
            if attrs.get('target') == '_blank' and 'noopener' not in attrs.get('rel', '').split():
                self.errors.append(f'Enlace externo sin noopener: {attrs["href"]}')
        if tag == 'script':
            self.scripts.append(attrs)
            if attrs.get('type') in ('application/json', 'application/ld+json'):
                self.current_json = ''
        for key in ('src', 'href', 'poster', 'data-src', 'data-territorio-map-src'):
            if attrs.get(key):
                self.resources.append(attrs[key])
        if attrs.get('srcset'):
            self.resources.extend(item.strip().split()[0] for item in attrs['srcset'].split(','))

    def handle_data(self, data):
        if self.current_json is not None:
            self.current_json += data

    def handle_endtag(self, tag):
        if tag == 'head':
            self.in_head = False
        if tag == 'script' and self.current_json is not None:
            self.json_blocks.append(self.current_json)
            self.current_json = None


def local_path(reference, parent):
    url = urlsplit(reference)
    if url.scheme or url.netloc or not url.path:
        return None
    candidate = (ROOT / unquote(url.path.lstrip('/'))) if url.path.startswith('/') else (parent / unquote(url.path))
    candidate = candidate.resolve()
    if not candidate.is_relative_to(ROOT):
        raise ValueError(f'Ruta fuera del sitio: {reference}')
    return candidate


def source_sha256(path):
    data = path.read_bytes()
    if path.suffix.lower() == '.svg':
        data = data.replace(b'\r\n', b'\n')
    return sha256(data).hexdigest()


def verify_atlas_presentation():
    model = json.loads((ROOT / 'datos/presentacion/etiquetas.json').read_text())
    for name, digest in model['fuentes_sha256'].items():
        if source_sha256(ROOT / name) != digest:
            raise ValueError('Fuente de presentación modificada: ' + name)
    source = ET.parse(ROOT / 'datos/territorio/mapa.svg').getroot()
    base = ET.parse(ROOT / 'datos/presentacion/mapa-base.svg').getroot()
    forest = ET.parse(ROOT / 'datos/presentacion/bosques.svg').getroot()
    group = next(el for el in source.iter() if el.get('id') == 'territorio-bosques-capa')
    forest_paths = [el.attrib for el in group.iter() if el.tag.endswith('path')]
    if forest_paths != [el.attrib for el in forest.iter() if el.tag.endswith('path')]:
        raise ValueError('La copia de cobertura no conserva sus coordenadas y atributos.')
    for parent in group.iter():
        for child in list(parent):
            if child.tag.endswith('path'): parent.remove(child)
    if [el.attrib for el in source.iter() if el.tag.endswith('path')] != [el.attrib for el in base.iter() if el.tag.endswith('path')]:
        raise ValueError('La base ligera ha alterado geometrías.')
    original = ET.parse(ROOT / 'datos/territorio/capas-adicionales.svg').getroot()
    for kind in ['anp', 'distritos', 'provincias']:
        layer = next(el for el in original if el.get('data-territorio-overlay') == kind)
        copy = ET.parse(ROOT / ('datos/presentacion/' + kind + '.svg')).getroot()
        if [el.attrib for el in layer.iter() if el.tag.endswith('path')] != [el.attrib for el in copy.iter() if el.tag.endswith('path')]:
            raise ValueError('Coordenadas de capa adicional modificadas: ' + kind)


def published_files():
    verify_atlas_presentation()
    pending = [ROOT / entry for entry in ENTRYPOINTS]
    found = set()
    while pending:
        path = pending.pop()
        if path in found:
            continue
        if not path.is_file():
            raise ValueError(f'Recurso inexistente: {path.relative_to(ROOT)}')
        found.add(path)
        references = []
        if path.suffix == '.html':
            page = Page()
            page.feed(path.read_text())
            references = page.resources
        elif path.suffix in ('.css', '.js'):
            text = path.read_text()
            if path.suffix == '.css':
                references = re.findall(r'url\(\s*[\"\']?([^\)\"\']+)', text)
            else:
                references = re.findall(r'''["']([^"'\n]+\.(?:png|jpe?g|svg|webp|gif|mp4|webm|css|js|json)(?:[?#][^"'\n]*)?)["']''', text)
        if path.suffix == '.json':
            def collect(value):
                if isinstance(value, dict):
                    for item in value.values(): yield from collect(item)
                elif isinstance(value, list):
                    for item in value: yield from collect(item)
                elif isinstance(value, str) and value.startswith(('images/', 'datos/')) and local_path(value, ROOT) and local_path(value, ROOT).is_file():
                    yield value
            references = list(collect(json.loads(path.read_text())))
        for reference in references:
            base = ROOT if path.suffix == '.json' or (path.suffix == '.js' and path.parent == ROOT / 'assets') else path.parent
            target = local_path(reference.strip(), base)
            if target is not None:
                pending.append(target)
    return found


class IndicatorPage(HTMLParser):
    """Recoge la procedencia y el texto visible de cada indicador de la ficha."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.records, self.record, self.field = {}, None, None
        self.detail_ids, self.row_ids = set(), set()

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'tr' and attrs.get('data-registro-resumen'):
            self.record = attrs['data-registro-resumen']
            if self.record in self.row_ids: raise ValueError('Valor de indicador repetido: ' + self.record)
            self.row_ids.add(self.record); self.records.setdefault(self.record, {})
        if tag == 'details' and attrs.get('data-registro'):
            self.record = attrs['data-registro']
            if self.record in self.detail_ids: raise ValueError('Contexto de indicador repetido: ' + self.record)
            self.detail_ids.add(self.record); self.records.setdefault(self.record, {})
            if attrs.get('data-revision'):
                self.records[self.record]['fecha_revisión'] = {'valor': attrs['data-revision'], 'texto': attrs['data-revision']}
        if tag in ('dd', 'td') and self.record and attrs.get('data-campo'):
            self.field = attrs['data-campo']
            self.records[self.record][self.field] = {'valor': attrs.get('data-valor'), 'texto': ''}

    def handle_data(self, text):
        if self.record and self.field:
            self.records[self.record][self.field]['texto'] += text

    def handle_endtag(self, tag):
        if tag in ('dd', 'td'):
            self.field = None
        if tag in ('details', 'tr'):
            self.record, self.field = None, None


class AtlasPage(HTMLParser):
    """Verifica la ubicación de los módulos y de la implementación única del mapa."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.parents, self.sequence, self.map_hosts = [], {}, [], []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        id = attrs.get('id')
        if id:
            self.parents[id] = tuple(self.stack)
        if tag in ('header', 'section', 'footer') and id and not self.stack:
            self.sequence.append(id)
        if attrs.get('data-territorio-map-src'):
            self.map_hosts.append((attrs['data-territorio-map-src'], tuple(self.stack)))
        if tag == 'section':
            self.stack.append(id)

    def handle_endtag(self, tag):
        if tag == 'section':
            self.stack.pop()


def verify_conoce():
    page = AtlasPage()
    homepage = (ROOT / 'index.html').read_text()
    page.feed(homepage)
    if page.sequence[:2] != ['inicio', 'conoce-madre-de-dios']:
        raise ValueError('Conoce Madre de Dios debe aparecer inmediatamente después del Hero.')
    for id in ('conoce-ubicacion', 'conoce-provincias', 'explora-madre-de-dios',
               'conoce-geografia', 'conoce-historia', 'conoce-personas'):
        if page.parents.get(id) != ('conoce-madre-de-dios',):
            raise ValueError('Conoce: resumen mal integrado: ' + id)
    for id in ('biodiversidad', 'ambiente', 'investigaciones', 'quienes-somos', 'colabora'):
        if page.parents.get(id) != ():
            raise ValueError('Conoce: sección no independiente: ' + id)
    if page.map_hosts or 'type="application/json"' in homepage:
        raise ValueError('Inicio: el mapa y sus JSON deben cargar en Territorio, por intención del visitante.')
    for id in ('conoce-provincia-tambopata', 'conoce-provincia-manu', 'conoce-provincia-tahuamanu'):
        if page.parents.get(id) != ('conoce-madre-de-dios', 'conoce-provincias'):
            raise ValueError('Conoce: falta una ficha provincial: ' + id)
    if 'href="mailto:ecoselvamadrededios@gmail.com"' not in homepage or 'selva-formulario-contacto' in homepage:
        raise ValueError('Contacto: debe ofrecer un canal real, sin formulario simulado.')
    for name in ('conoce-peru.svg', 'conoce-limites.svg', 'conoce-relieve.svg'):
        ET.parse(ROOT / 'images' / name)


class HistoryPage(Page):
    def __init__(self):
        super().__init__()
        self.milestones, self.citations = [], []

    def handle_starttag(self, tag, attributes):
        super().handle_starttag(tag, attributes)
        attrs = dict(attributes)
        if 'data-historia-categoria' in attrs:
            self.milestones.append(attrs)
        if 'data-historia-fuente' in attrs:
            self.citations.append(attrs.get('href', ''))


def verify_historia():
    html = (ROOT / 'historia.html').read_text()
    structure, page = AtlasPage(), HistoryPage()
    structure.feed(html)
    page.feed(html)
    chapters = ['territorio', 'contactos', 'organizacion', 'transformaciones', 'conservacion', 'memoria']
    if structure.sequence != chapters + ['fuentes']:
        raise ValueError('Historia: se requieren seis capítulos ordenados y referencias al final.')
    if any(structure.parents.get(chapter) != () for chapter in chapters):
        raise ValueError('Historia: los capítulos deben ser independientes entre sí.')
    categories = {'pueblos', 'contacto', 'economia', 'politica', 'infraestructura', 'conservacion'}
    if {item['data-historia-categoria'] for item in page.milestones} != categories:
        raise ValueError('Historia: faltan categorías de la línea de tiempo.')
    if len(page.milestones) < 6:
        raise ValueError('Historia: línea de tiempo incompleta.')
    for item in page.milestones:
        sources = item.get('data-historia-fuentes', '').split(',')
        if item.get('data-historia-estado') != 'VERIFICADO' or not all('fuente-' + source in page.ids for source in sources):
            raise ValueError('Historia: hito sin verificación o sin referencias existentes.')
    if any(not reference.startswith('#fuente-') or reference[1:] not in page.ids for reference in page.citations):
        raise ValueError('Historia: enlace a fuente inexistente.')
    homepage = (ROOT / 'index.html').read_text().split('id="conoce-historia"', 1)[1].split('</section>', 1)[0]
    if 'href="historia.html"' not in homepage:
        raise ValueError('Historia: falta el acceso desde el resumen de Conoce.')


def verify_conservacion():
    model = json.loads((ROOT / 'datos/conservacion/areas.json').read_text())
    areas = model['areas']
    codes = {'PN03', 'PN08', 'PN11', 'RN09', 'RC03', 'RC06'}
    if len(areas) != 6 or {a['codigo'] for a in areas} != codes:
        raise ValueError('Conservación: se requieren las seis ANP nacionales, sin duplicados.')
    if sum(Decimal(str(a['mdd_ha'])) for a in areas) != Decimal('3849456.00'):
        raise ValueError('Conservación: la suma departamental debe conservar las cifras del mapa oficial.')
    if model['cobertura']['acp_vigentes'] is not None or model['cobertura']['porcentaje_nacional'] != 45.24:
        raise ValueError('Conservación: no confundir cobertura nacional con ACP ni publicar un conteo de vigencia no confirmado.')
    sources = {source['id']: source for source in model['fuentes']}
    for area in areas:
        if area['estado'] != 'VERIFICADO' or not 0 < area['mdd_ha'] <= area['total_ha']:
            raise ValueError('Conservación: superficie o estado inválido.')
        date.fromisoformat(area['fecha_creacion'])
        for key in ('protege', 'ecosistemas', 'destacados', 'personas', 'amenaza', 'nota_fecha', 'departamentos'):
            if not area[key]:
                raise ValueError(f'Conservación: ficha incompleta: {area["id"]}, {key}')
        if not all(id in sources for id in area['fuentes']):
            raise ValueError('Conservación: falta la procedencia específica de una ficha.')
    for source in sources.values():
        if not all(source[key] for key in ('titulo', 'fecha', 'url', 'alcance', 'institucion', 'tipo', 'revision')) or urlsplit(source['url']).scheme != 'https':
            raise ValueError('Conservación: fuente sin metadatos completos.')
    html = (ROOT / 'areas-protegidas.html').read_text()
    page, structure = Page(), AtlasPage()
    page.feed(html)
    structure.feed(html)
    if structure.sequence[:5] != ['comprender', 'explorar', 'naturaleza-personas', 'conectados', 'conservar']:
        raise ValueError('Conservación: cinco módulos en orden.')
    if json.loads(page.json_blocks[-1]) != model:
        raise ValueError('Conservación: datos interactivos distintos del modelo público.')
    if any('ficha-' + area['id'] not in page.ids for area in areas) or any('fuente-' + id not in page.ids for id in sources):
        raise ValueError('Conservación: fichas o fuentes inaccesibles sin JavaScript.')
    for area in areas:
        if area['nombre'] not in html or any(area[key] not in html for key in ('protege', 'ecosistemas', 'destacados', 'personas', 'amenaza')):
            raise ValueError('Conservación: contenido esencial debe existir en HTML.')
    geo = json.loads((ROOT / 'datos/conservacion/anp.geojson').read_text())
    if len(geo['features']) != 6 or {f['properties']['codigo'] for f in geo['features']} != codes:
        raise ValueError('Conservación: GeoJSON incompleto.')
    for f in geo['features']:
        area = next(a for a in areas if a['codigo'] == f['properties']['codigo'])
        if f['geometry']['type'] not in ('Polygon', 'MultiPolygon') or f['properties']['mdd_ha'] != area['mdd_ha'] or f['properties']['total_ha'] != area['total_ha']:
            raise ValueError('Conservación: geometría o métricas cartográficas distintas de la ficha.')
    svg = ET.parse(ROOT / 'datos/conservacion/mapa.svg').getroot()
    zones = [node for node in svg.iter() if node.get('data-anp')]
    if len(zones) != 6 or {node.get('data-anp') for node in zones} != {a['id'] for a in areas}:
        raise ValueError('Conservación: SVG no corresponde a las seis geometrías oficiales.')
    metadata = json.loads((ROOT / 'datos/conservacion/metadatos.json').read_text())
    if metadata['crs_procesamiento'].split(' · ')[0] != 'EPSG:32719' or metadata['crs_geojson'] != 'EPSG:4326':
        raise ValueError('Conservación: CRS desconocido.')
    if len(metadata['control_geometria']) != 6 or any(not c['valida'] or c['variacion_area_recortada_pct'] > .5 for c in metadata['control_geometria']):
        raise ValueError('Conservación: falta validación o hay simplificación excesiva.')
    if not re.search(r'<a[^>]+href="areas-protegidas.html"', (ROOT / 'index.html').read_text()) or 'Conoce las áreas protegidas actuales →' not in (ROOT / 'historia.html').read_text():
        raise ValueError('Conservación: faltan accesos desde Conoce o Historia.')


def verify_castana():
    check_generated()
    model = json.loads((ROOT / 'datos/fichas/castana.json').read_text())
    date.fromisoformat(model['fecha_revisión'])
    records = model['indicadores']
    with (ROOT / 'datos/fichas/castana-indicadores.csv').open(encoding='utf-8-sig', newline='') as source:
        reader = csv.DictReader(source)
        required_columns = set(COLUMNS)
        if set(reader.fieldnames or ()) != required_columns:
            raise ValueError('Castaña: faltan columnas de procedencia en el CSV.')
        csv_records = list(reader)
    html = IndicatorPage()
    html.feed((ROOT / 'fichas/castana.html').read_text())
    ids = [record['id'] for record in records]
    if not records or len(ids) != len(set(ids)) or set(ids) != set(html.records) or set(ids) != html.row_ids or set(ids) != html.detail_ids or len(records) != len(csv_records):
        raise ValueError('Castaña: los registros HTML, JSON y CSV deben coincidir y tener IDs únicos.')
    fields = ('indicador', 'valor', 'unidad', 'año', 'ámbito', 'fuente', 'publicación', 'URL', 'fecha_revisión', 'notas', 'definición', 'metodología', 'fuente_registro')
    for record, csv_record in zip(records, csv_records):
        if Decimal(record['valor']) < 0 or record['unidad'] != 'kg' or record['ámbito'] not in ('Madre de Dios', 'Perú'):
            raise ValueError(f'Castaña: valor, unidad o ámbito inválido: {record["id"]}')
        if not isinstance(record['año'], int) or not isinstance(record['año_publicación'], int) or record['año'] > record['año_publicación']:
            raise ValueError(f'Castaña: deben distinguirse año del dato y año de publicación: {record["id"]}')
        if record['fecha_revisión'] != model['fecha_revisión'] or date.fromisoformat(record['fecha_revisión']) > date.today():
            raise ValueError('Castaña: fecha de revisión inválida.')
        for key in ('URL', 'URL_PDF'):
            if urlsplit(record[key]).scheme != 'https' or not urlsplit(record[key]).netloc:
                raise ValueError(f'Castaña: falta una fuente original HTTPS: {record["id"]}')
        for key, value in csv_record.items():
            if str(record.get(key, '')) != value:
                raise ValueError(f'Castaña: CSV y modelo difieren: {record["id"]}, {key}')
        for field in fields:
            entry = html.records[record['id']].get(field, {})
            if entry.get('valor') != str(record[field]) or not entry.get('texto', '').strip():
                raise ValueError(f'Castaña: metadato ausente o distinto en HTML: {record["id"]}, {field}')
        visible_value = html.records[record['id']]['valor']['texto'].replace('\u202f', '').replace('\xa0', '').replace(',', '.').strip()
        if visible_value != record['valor']:
            raise ValueError(f'Castaña: el valor visible no conserva la precisión original: {record["id"]}')
        for field in ('año', 'ámbito', 'unidad'):
            if html.records[record['id']][field]['texto'].strip() != str(record[field]):
                raise ValueError(f'Castaña: ámbito, año o unidad visible incorrectos: {record["id"]}')
        publication = html.records[record['id']]['publicación']['texto']
        if record['publicación'] not in (ROOT / 'fichas/castana.html').read_text() or str(record['año_publicación']) not in publication:
            raise ValueError(f'Castaña: publicación sin título o fecha: {record["id"]}')
    series = [record for record in records if record['serie_regional']]
    if not series or [r['id'] for r in series] != model['serie']['registros']:
        raise ValueError('Castaña: serie vacía o registros mal identificados.')
    if any(any(r[key] != model['serie'][key] for key in ('indicador', 'unidad', 'ámbito')) for r in series):
        raise ValueError('Castaña: la serie mezcla productos, unidades o ámbitos.')
    if [r['año'] for r in series] != sorted({r['año'] for r in series}):
        raise ValueError('Castaña: la serie debe tener años únicos y ordenados.')
    page = (ROOT / 'fichas/castana.html').read_text()
    for section in ('lo-esencial', 'para-entender', 'datos-evidencia'):
        if not re.search(r'<section\b[^>]*\bid="' + section + '"', page):
            raise ValueError('Castaña: las profundidades deben ser secciones continuas en el HTML.')
    if 'ficha-grafico' in page and len(series) < 4:
        raise ValueError('Castaña: un gráfico exige al menos cuatro observaciones comparables.')
    if not 2 <= len(model['tarjetas']) <= 4 or len(set(model['tarjetas'])) != len(model['tarjetas']) or not set(model['tarjetas']).issubset(ids):
        raise ValueError('Castaña: deben existir entre dos y cuatro tarjetas de indicadores únicos.')
    documents = model['documentos']
    if len({document['id'] for document in documents}) != len(documents):
        raise ValueError('Castaña: hay documentos repetidos.')
    for document in documents:
        if any(not document.get(field) for field in ('id', 'tipo', 'autor', 'título', 'año', 'ámbito', 'uso', 'URL')) or document['jerarquía'] not in ('primaria', 'complementaria'):
            raise ValueError('Castaña: documento sin procedencia editorial completa.')
        if urlsplit(document['URL']).scheme != 'https':
            raise ValueError('Castaña: el documento debe tener enlace original HTTPS.')
    ET.parse(ROOT / 'fichas/castana-ciclo.svg')
    ET.parse(ROOT / 'fichas/castana-patron.svg')


def verify_biblioteca():
    actualizar_biblioteca.check_generated()
    model = json.loads((ROOT / 'datos/biblioteca/documentos.json').read_text())
    documents = model['documentos']
    if not documents or len({doc['id'] for doc in documents}) != len(documents):
        raise ValueError('Biblioteca: catálogo vacío o documentos duplicados.')
    date.fromisoformat(model['revision'])
    originals = '\n'.join((ROOT / page).read_text() for page in PAGES if page != 'biblioteca.html')
    for doc in documents:
        if any(not doc.get(key) for key in ('id', 'titulo', 'autor', 'tipo', 'tema', 'alcance', 'uso', 'url', 'contexto')):
            raise ValueError('Biblioteca: falta procedencia o contexto del documento.')
        if (doc['anio'] is not None and not isinstance(doc['anio'], int)) or doc['tema'] not in ('bosques', 'mapas', 'conservacion', 'historia', 'ciencia'):
            raise ValueError('Biblioteca: año o tema inválido.')
        for key in ('url', 'pdf'):
            if doc.get(key) and (urlsplit(doc[key]).scheme != 'https' or doc[key].replace('&', '&amp;') not in originals):
                raise ValueError(f'Biblioteca: {doc["id"]} no remite a una fuente original de EcoSelva.')
        for reference in doc.get('contextos', []):
            target = local_path(reference, ROOT)
            fragment = unquote(urlsplit(reference).fragment)
            context_page = Page()
            if target is None or not target.is_file():
                raise ValueError('Biblioteca: falta un contexto de la fuente compartida.')
            context_page.feed(target.read_text())
            if fragment and fragment not in context_page.ids:
                raise ValueError('Biblioteca: ancla inexistente en un contexto de la fuente compartida.')
        context = urlsplit(doc['contexto'])
        target = local_path(doc['contexto'], ROOT)
        if target is None or not target.is_file() or target.suffix != '.html':
            raise ValueError('Biblioteca: falta la página de contexto.')
        page = Page()
        page.feed(target.read_text())
        if not context.fragment or context.fragment not in page.ids:
            raise ValueError('Biblioteca: el contexto no enlaza a una fuente existente.')
        if doc.get('pdf'):
            if not all(isinstance(doc.get(key), int) and doc[key] > 0 for key in ('bytes', 'paginas', 'ancho', 'alto')) or not re.fullmatch(r'[0-9a-f]{64}', doc.get('sha256', '')):
                raise ValueError('Biblioteca: metadatos comprobados del PDF incompletos.')
            date.fromisoformat(doc['fecha_comprobacion'])
            cover = local_path(doc['portada'], ROOT)
            if cover is None or not cover.is_file() or cover.suffix != '.webp':
                raise ValueError('Biblioteca: portada original inexistente.')
        elif any(key in doc for key in ('portada', 'paginas', 'bytes', 'sha256')):
            raise ValueError('Biblioteca: un artículo sin PDF no debe mostrar metadatos inventados.')
    icons = ET.parse(ROOT / 'images/ecoselva-iconos.svg').getroot()
    expected = {'bosques', 'biodiversidad', 'flora', 'fauna', 'mapas', 'satelite', 'datos', 'documentos', 'biblioteca', 'conservacion', 'educacion', 'ciencia'}
    if not expected.issubset({element.get('id') for element in icons.iter()}):
        raise ValueError('Iconos: falta una categoría del sistema compartido.')


def verify_territorio_educativo():
    """Comprueba integración y procedencia de las fichas y capas adicionales."""
    html = (ROOT / 'territorio.html').read_text()
    page = AtlasPage()
    page.feed(html)
    modules = ('territorio-bosques', 'territorio-castanales', 'territorio-rios',
               'territorio-humedales', 'territorio-aguajales', 'territorio-conexiones',
               'territorio-beneficios', 'territorio-cambios', 'territorio-ciencia',
               'territorio-actividades', 'territorio-metodologia')
    if any(page.parents.get(id) != ('explora-madre-de-dios',) for id in modules):
        raise ValueError('Territorio: capítulos fuera de su página de lectura.')
    if page.map_hosts != [('datos/presentacion/mapa-base.svg', ('explora-madre-de-dios',))]:
        raise ValueError('Territorio: debe existir un único visor del mapa original.')
    model = json.loads((ROOT / 'datos/territorio/lectura.json').read_text())
    date.fromisoformat(model['revision'])
    if 'type="application/json"' in html or 'territorio-retorno' not in html or 'role="tablist"' in html:
        raise ValueError('Territorio: carga bajo demanda, regreso al origen y control único de capas obligatorios.')
    topics = json.loads((ROOT / 'datos/territorio/registros-visor.json').read_text())
    river_ids = {id for id, topic in topics.items() if topic.get('mode') == 'rios'}
    if set(model['rios']) != river_ids:
        raise ValueError('Territorio: no asignar fichas a ríos sin trazado ni omitir los existentes.')
    for record in model['rios'].values():
        if any(not record.get(key) for key in ('importancia', 'ambientes', 'biodiversidad', 'anp', 'fuentes')) or not set(record['fuentes']).issubset(model['fuentes']):
            raise ValueError('Territorio: ficha sin explicación o fuente comprobable.')
    coverage = json.loads((ROOT / 'datos/territorio/cobertura-categorias.json').read_text())
    # El archivo de categorías conserva su esquema original.
    forest_ids = {item['id'] for item in coverage}
    selected_ids = re.findall(r'data-territorio-explorar="([^"]+)"', html)
    if not set(selected_ids).issubset(river_ids | forest_ids):
        raise ValueError('Territorio: acceso educativo a una geometría inexistente.')
    metadata = json.loads((ROOT / 'datos/territorio/capas-adicionales-metadatos.json').read_text())
    svg_file = ROOT / 'datos/territorio/capas-adicionales.svg'
    if metadata['sha256_svg'] != source_sha256(svg_file):
        raise ValueError('Territorio: los contornos no coinciden con sus metadatos.')
    svg = ET.parse(svg_file).getroot()
    if svg.get('viewBox') != '0 0 600 510' or metadata['crs_visualizacion'] != 'EPSG:32719':
        raise ValueError('Territorio: las capas adicionales deben usar el encuadre y CRS originales.')
    for key, count in (('provincias', 3), ('distritos', 11), ('anp', 6)):
        record = metadata[key]
        if record['cantidad'] != count or sha256((ROOT / record['archivo']).read_bytes()).hexdigest() != record['sha256']:
            raise ValueError('Territorio: origen de contornos modificado sin regenerar: ' + key)
        group = next((node for node in svg if node.get('data-territorio-overlay') == key), None)
        if group is None or len(group) != count or group.get('fill') != 'none':
            raise ValueError('Territorio: capa adicional incompleta o con relleno que oculta el mapa.')
    for name in ('territorio-rio.svg', 'territorio-observa.svg'):
        ET.parse(ROOT / 'images' / name)


class FloraPage(Page):
    """Comprueba que la ampliación y sus recursos permanezcan en la pestaña Flora."""
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
            'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def __init__(self):
        super().__init__()
        self.stack, self.parents, self.cases, self.choices, self.species = [], {}, [], [], []

    def handle_starttag(self, tag, attributes):
        super().handle_starttag(tag, attributes)
        attrs = dict(attributes)
        if attrs.get('id'):
            self.parents[attrs['id']] = tuple(id for _, id in self.stack if id)
        for key, records in (('data-flora-caso', self.cases), ('data-flora-recurso', self.choices),
                             ('data-flora-especie', self.species)):
            if key in attrs:
                records.append(attrs[key])
        if tag not in self.VOID:
            self.stack.append((tag, attrs.get('id')))

    def handle_endtag(self, tag):
        super().handle_endtag(tag)
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break


def verify_flora():
    model = json.loads((ROOT / 'datos/flora/lectura.json').read_text())
    html = (ROOT / 'flora.html').read_text()
    page = FloraPage()
    page.feed(html)
    modules = ('flora-productos-usos', 'flora-maderables', 'flora-no-maderables',
               'flora-medicinales', 'flora-alimentos', 'flora-cultura', 'flora-recorrido',
               'flora-relaciones', 'flora-manejo', 'flora-economia', 'flora-seguir', 'flora-fuentes')
    if any('selva-biodiversidad-panel-flora' not in page.parents.get(id, ()) for id in modules):
        raise ValueError('Flora: el contenido debe conservarse en su página completa.')
    expected = ['castana', 'madera', 'aguaje', 'paca', 'medicinal']
    if page.cases != expected or page.choices != expected or [item['id'] for item in model['recursos']] != expected:
        raise ValueError('Flora: se requieren cinco recorridos accesibles, sin duplicados.')
    stages = ['Bosque', 'Recurso', 'Aprovechamiento', 'Transformación', 'Producto', 'Uso', 'Manejo y conservación']
    date.fromisoformat(model['revision'])
    for item in model['recursos']:
        if [step['etapa'] for step in item['pasos']] != stages or any(not step['texto'] for step in item['pasos']):
            raise ValueError('Flora: recorrido incompleto o sin manejo y conservación.')
        if not item['alcance'] or not item['fuentes'] or not set(item['fuentes']).issubset(model['fuentes']):
            raise ValueError('Flora: recurso sin alcance o referencias.')
    sources = model['fuentes']
    registry = json.loads((ROOT / 'datos/fuentes.json').read_text())
    documents = {doc['id']: doc for doc in registry['documentos']}
    if set(registry['flora']) != set(sources):
        raise ValueError('Flora: registro principal sin correspondencia completa con las fuentes del modelo.')
    for id, source in sources.items():
        document = documents[registry['flora'][id]]
        if urlsplit(document['url'])._replace(fragment='') != urlsplit(source['url'])._replace(fragment='') or document['anio'] != source['anio']:
            raise ValueError('Flora: la referencia del registro difiere de la fuente científica original: ' + id)
        if any(not source.get(key) for key in ('institucion', 'documento', 'alcance', 'url', 'localizador', 'revision')):
            raise ValueError('Flora: referencia incompleta: ' + id)
        date.fromisoformat(source['revision'])
        if urlsplit(source['url']).scheme != 'https' or 'flora-fuente-' + id not in page.ids:
            raise ValueError('Flora: referencia original inexistente: ' + id)
        if 'anio' not in source or (source['anio'] is not None and not isinstance(source['anio'], int)):
            raise ValueError('Flora: año de fuente inventado o inválido: ' + id)
    figures = {item['categoria']: item for item in model['cifras']}
    for category, value, year, source in (('maderables', 486, 2022, 'catalogo'), ('no-maderables', 69, 2019, 'pfnm')):
        item = figures[category]
        if (item['valor'], item['anio'], item['fuente'], item['unidad']) != (value, year, source, 'especies'):
            raise ValueError('Flora: no cambiar ni confundir los conteos originales y sus ámbitos.')
        if not item['ambito'] or not item['metodologia'] or f'data-flora-count="{value}"' not in html:
            raise ValueError('Flora: contador sin procedencia o método.')
    if any(figures[key]['valor'] is not None or figures[key]['estado'] != 'En revisión'
           for key in ('medicinales', 'alimenticias')):
        raise ValueError('Flora: no publicar totales regionales sin inventario comparable.')
    names = ['shihuahuaco', 'cedro', 'capirona', 'castana', 'aguaje', 'huasai']
    if page.species != names or [item['id'] for item in model['especies_destacadas']] != names:
        raise ValueError('Flora: conservar las seis especies destacadas y sus fuentes.')
    for species in model['especies_destacadas']:
        if not species['localizador'] or not species['fuentes'] or not set(species['fuentes']).issubset(sources):
            raise ValueError('Flora: especie sin procedencia.')
    actualizar_flora.check_generated()


def verify():
    errors = []
    pages = {}
    for entry in PAGES:
        html = (ROOT / entry).read_text()
        page = Page()
        page.feed(html)
        pages[entry] = page
        errors.extend(f'{entry}: {message}' for message in page.errors)
        expected_url = ORIGIN + ('/' if entry == 'index.html' else '/' + entry)
        if page.lang != 'es-PE' or page.links.get('canonical') != [expected_url]:
            errors.append(f'{entry}: idioma o URL canónica incorrectos.')
        if not page.links.get('icon'):
            errors.append(f'{entry}: falta el favicon.')
        if entry in PAGES:
            if not page.metadata.get('description'):
                errors.append(f'{entry}: falta la descripción de la página.')
            if page.metadata.get('og:url') != expected_url:
                errors.append(f'{entry}: og:url debe coincidir con la URL canónica.')
            social_image = page.metadata.get('og:image', '')
            if not social_image.startswith(ORIGIN + '/') or not (ROOT / unquote(urlsplit(social_image).path.lstrip('/'))).is_file():
                errors.append(f'{entry}: og:image debe apuntar a una imagen existente del sitio.')
        if page.main_count != 1:
            errors.append(f'{entry}: debe existir un único main.')
        duplicate_ids = [key for key, count in Counter(page.ids).items() if count > 1]
        if duplicate_ids:
            errors.append(f'{entry}: IDs repetidos: {duplicate_ids}')
        for reference in page.anchors:
            if reference.startswith('#') and reference[1:] and reference[1:] not in page.ids:
                errors.append(f'{entry}: enlace interno roto: {reference}')
        for block in page.json_blocks:
            try:
                json.loads(block)
            except json.JSONDecodeError as error:
                errors.append(f'{entry}: JSON inválido: {error}')
        if re.search(r'^\s*(?:<<<<<<<|=======|>>>>>>>)', html, re.M):
            errors.append(f'{entry}: conflicto de Git sin resolver.')
    for entry in PAGES:
        html = (ROOT / entry).read_text()
        head = html.split('<head>', 1)[1].split('</head>', 1)[0]
        if html.count('gtag/js?') != 1 or "gtag('config', 'G-0KG7JC82NV');" not in head or 'GTM-' in head:
            errors.append(f'{entry}: Analytics debe tener una sola instalación con ID G-0KG7JC82NV dentro de head.')
    try:
        actualizar_assets.check_generated()
        actualizar_navegacion.check_generated()
        registry = json.loads((ROOT / 'datos/fuentes.json').read_text())
        urls = [urlsplit(doc['url'])._replace(fragment='').geturl() for doc in registry['documentos']]
        if len(urls) != len(set(urls)):
            raise ValueError('Fuentes: documentos duplicados en el registro principal.')
        verify_castana()
        verify_conoce()
        verify_historia()
        verify_conservacion()
        verify_biblioteca()
        verify_territorio_educativo()
        verify_flora()
        for entry, page in pages.items():
            for reference in page.anchors:
                fragment = unquote(urlsplit(reference).fragment)
                target = local_path(reference, (ROOT / entry).parent)
                if target and target.suffix == '.html' and fragment and target.is_file():
                    destination = pages.get(str(target.relative_to(ROOT)))
                    if destination is None:
                        destination = Page()
                        destination.feed(target.read_text())
                    if fragment not in destination.ids:
                        errors.append(f'{entry}: enlace entre páginas roto: {reference}')
        files = published_files()
        robots = (ROOT / 'robots.txt').read_text().splitlines()
        if any(line not in robots for line in ('User-agent: *', 'Allow: /', 'Sitemap: ' + ORIGIN + '/sitemap.xml')):
            errors.append('robots.txt: faltan las instrucciones públicas o el sitemap.')
        sitemap = ET.parse(ROOT / 'sitemap.xml').getroot()
        locations = [element.text for element in sitemap.findall('{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
        expected_locations = {ORIGIN + ('/' if page == 'index.html' else '/' + page) for page in PAGES}
        if len(locations) != len(set(locations)) or not expected_locations.issubset(locations):
            errors.append('sitemap.xml: faltan páginas públicas o hay URLs duplicadas.')
        for location in locations:
            route = urlsplit(location or '')
            target = ROOT / (unquote(route.path.lstrip('/')) or 'index.html')
            if route.scheme + '://' + route.netloc != ORIGIN or route.query or route.fragment or not target.is_file() or target.suffix != '.html' or target.resolve() not in files:
                errors.append(f'sitemap.xml: URL no publicada: {location}')
        svg = ET.parse(ROOT / 'datos/territorio/mapa.svg').getroot()
        ids = {element.get('id') for element in svg.iter() if element.get('id')}
        for element in svg.iter():
            reference = element.get('href', '')
            if reference.startswith('#') and reference[1:] not in ids:
                errors.append(f'SVG: referencia inexistente: {reference}')
        for path in files:
            if path.suffix == '.css' and re.search(r'font-size:\s*(?:[0-9]|1[01])px', path.read_text()):
                errors.append(f'{path.relative_to(ROOT)}: tamaño de letra menor de 12 px.')
    except (ValueError, KeyError, InvalidOperation, ET.ParseError) as error:
        errors.append(str(error))
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    print(f'Correcto: páginas, enlaces, indicadores/CSV, Analytics, mapa y {len(files)} archivos necesarios para publicar.')
    return 0


if __name__ == '__main__':
    sys.exit(verify())
