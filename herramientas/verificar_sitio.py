"""Comprueba las páginas y sus recursos antes de publicar, sin dependencias externas."""
from collections import Counter
from datetime import date
from decimal import Decimal, InvalidOperation
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from xml.etree import ElementTree as ET
import json
import csv
import re
import sys
from actualizar_ficha_castana import COLUMNS, check_generated

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://ecoselva-madre-de-dios.github.io'
PAGES = ('index.html', 'fuentes-metodologia.html', 'fichas/castana.html')
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


def published_files():
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
        for reference in references:
            target = local_path(reference.strip(), path.parent)
            if target is not None:
                pending.append(target)
    return found


class IndicatorPage(HTMLParser):
    """Recoge la procedencia y el texto visible de cada indicador de la ficha."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.records, self.record, self.field = {}, None, None

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'details' and attrs.get('data-registro'):
            self.record = attrs['data-registro']
            if self.record in self.records:
                raise ValueError(f'Indicador repetido: {self.record}')
            self.records[self.record] = {}
        if tag == 'dd' and self.record and attrs.get('data-campo'):
            self.field = attrs['data-campo']
            self.records[self.record][self.field] = {'valor': attrs.get('data-valor'), 'texto': ''}

    def handle_data(self, text):
        if self.record and self.field:
            self.records[self.record][self.field]['texto'] += text

    def handle_endtag(self, tag):
        if tag == 'dd':
            self.field = None
        if tag == 'details':
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
    page.feed((ROOT / 'index.html').read_text())
    if page.sequence[:2] != ['inicio', 'conoce-madre-de-dios']:
        raise ValueError('Conoce Madre de Dios debe aparecer inmediatamente después del Hero.')
    for id in ('conoce-ubicacion', 'conoce-provincias', 'explora-madre-de-dios',
               'conoce-geografia', 'conoce-historia', 'conoce-personas', 'selva-introduccion'):
        if page.parents.get(id) != ('conoce-madre-de-dios',):
            raise ValueError(f'Conoce: módulo sin integrar o mapa duplicado: {id}')
    for id in ('programas', 'ambiente', 'investigaciones', 'quienes-somos', 'colabora'):
        if page.parents.get(id) != ():
            raise ValueError(f'Conoce: la sección {id} debe continuar independiente.')
    if page.map_hosts != [('datos/territorio/mapa.svg', ('conoce-madre-de-dios', 'explora-madre-de-dios'))]:
        raise ValueError('Conoce: debe existir una sola carga del mapa original dentro del módulo 03.')
    for id in ('selva-territorio-datos', 'selva-territorio-descripciones', 'selva-territorio-cobertura-datos', 'selva-territorio-fuentes-modal'):
        if 'conoce-madre-de-dios' not in page.parents.get(id, ()):
            raise ValueError(f'Conoce: parte de la implementación cartográfica quedó fuera: {id}')
    for id in ('conoce-provincia-tambopata', 'conoce-provincia-manu', 'conoce-provincia-tahuamanu'):
        if page.parents.get(id) != ('conoce-madre-de-dios', 'conoce-provincias'):
            raise ValueError(f'Conoce: ficha provincial inexistente o mal ubicada: {id}')
    for name in ('conoce-peru.svg', 'conoce-limites.svg', 'conoce-relieve.svg'):
        ET.parse(ROOT / 'images' / name)


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
    if not records or len(ids) != len(set(ids)) or set(ids) != set(html.records) or len(records) != len(csv_records):
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
        if record['publicación'] not in publication or str(record['año_publicación']) not in publication:
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
        if entry in ('index.html', 'fichas/castana.html'):
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
    for entry in ('index.html', 'fichas/castana.html'):
        html = (ROOT / entry).read_text()
        head = html.split('<head>', 1)[1].split('</head>', 1)[0]
        if html.count('gtag/js?') != 1 or "gtag('config', 'G-0KG7JC82NV');" not in head or 'GTM-' in head:
            errors.append(f'{entry}: Analytics debe tener una sola instalación con ID G-0KG7JC82NV dentro de head.')
    try:
        verify_castana()
        verify_conoce()
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
