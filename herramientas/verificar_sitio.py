"""Comprueba las páginas y sus recursos antes de publicar, sin dependencias externas."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from xml.etree import ElementTree as ET
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://ecoselva-madre-de-dios.github.io'
ENTRYPOINTS = ('index.html', 'fuentes-metodologia.html', 'google46599e54e679b03a.html', 'robots.txt', 'sitemap.xml')


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
            if attrs.get('type') == 'application/json':
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


def verify():
    errors = []
    for entry in ENTRYPOINTS[:2]:
        html = (ROOT / entry).read_text()
        page = Page()
        page.feed(html)
        errors.extend(f'{entry}: {message}' for message in page.errors)
        expected_url = ORIGIN + ('/' if entry == 'index.html' else '/' + entry)
        if page.lang != 'es-PE' or page.links.get('canonical') != [expected_url]:
            errors.append(f'{entry}: idioma o URL canónica incorrectos.')
        if not page.links.get('icon'):
            errors.append(f'{entry}: falta el favicon.')
        if entry == 'index.html':
            if page.metadata.get('og:url') != expected_url:
                errors.append('index.html: og:url debe coincidir con la URL canónica.')
            social_image = page.metadata.get('og:image', '')
            if not social_image.startswith(ORIGIN + '/') or not (ROOT / unquote(urlsplit(social_image).path.lstrip('/'))).is_file():
                errors.append('index.html: og:image debe apuntar a una imagen existente del sitio.')
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
    html = (ROOT / 'index.html').read_text()
    head = html.split('<head>', 1)[1].split('</head>', 1)[0]
    if html.count('gtag/js?') != 1 or "gtag('config', 'G-0KG7JC82NV');" not in head or 'GTM-' in head:
        errors.append('Google Analytics debe conservar una única instalación con ID G-0KG7JC82NV dentro de head.')
    try:
        files = published_files()
        robots = (ROOT / 'robots.txt').read_text().splitlines()
        if any(line not in robots for line in ('User-agent: *', 'Allow: /', 'Sitemap: ' + ORIGIN + '/sitemap.xml')):
            errors.append('robots.txt: faltan las instrucciones públicas o el sitemap.')
        sitemap = ET.parse(ROOT / 'sitemap.xml').getroot()
        locations = [element.text for element in sitemap.findall('{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
        if len(locations) != len(set(locations)) or not {ORIGIN + '/', ORIGIN + '/fuentes-metodologia.html'}.issubset(locations):
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
    except (ValueError, ET.ParseError) as error:
        errors.append(str(error))
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    print(f'Correcto: páginas, enlaces, Analytics, mapa y {len(files)} archivos necesarios para publicar.')
    return 0


if __name__ == '__main__':
    sys.exit(verify())
