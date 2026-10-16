"""Cabecera y pie compartidos, con navegación temática y enlaces relativos."""
from pathlib import Path
from html import escape
import re
import json
from datetime import date

ROOT = Path(__file__).resolve().parents[1]
PAGES = {
    'flora.html': ('index.html#biodiversidad', 'Volver a Biodiversidad'),
    'territorio.html': ('index.html#conoce-madre-de-dios', 'Volver a Conoce Madre de Dios'),
    'historia.html': ('index.html#conoce-madre-de-dios', 'Volver a Conoce Madre de Dios'),
    'areas-protegidas.html': ('index.html#conoce-madre-de-dios', 'Volver a Conoce Madre de Dios'),
    'biblioteca.html': ('index.html#seguir-explorando', 'Volver a explorar'),
    'fuentes-metodologia.html': ('territorio.html', 'Volver a Territorio'),
    'fichas/castana.html': ('flora.html', 'Volver a Flora'),
}

REGION_LINKS = (
    ('index.html#conoce-madre-de-dios', 'Ubicación y provincias', 'Mapa localizador, capitales y distritos.', 'mapas'),
    ('territorio.html', 'Territorio y atlas', 'Bosques, ríos, humedales y cartografía.', 'bosques'),
    ('historia.html', 'Historia regional', 'Pueblos, procesos y memoria del territorio.', 'documentos'),
    ('areas-protegidas.html', 'Áreas protegidas', 'Espacios de conservación y gestión.', 'conservacion'),
)
BIODIVERSITY_LINKS = (
    ('index.html#biodiversidad', 'Biodiversidad', 'Flora y fauna de Madre de Dios.', 'biodiversidad'),
    ('flora.html', 'Flora', 'Plantas, productos y usos del bosque.', 'flora'),
    ('index.html#ambiente', 'Ambiente', 'Cambios, presiones y conservación.', 'conservacion'),
)
ECOSYSTEM_LINKS = (
    ('index.html#quienes-somos', 'Sobre EcoSelva', 'Propósito, misión y visión.', 'educacion'),
    ('index.html#colabora', 'Colabora', 'Formas de participar y aportar.', 'colabora-acordar'),
    ('biblioteca.html', 'Biblioteca', 'Fuentes y documentos para explorar.', 'biblioteca'),
    ('fuentes-metodologia.html', 'Fuentes y metodología', 'Criterios, alcances y referencias.', 'datos'),
)


def _target(href, prefix, home):
    if home and href == 'index.html':
        return '#inicio'
    if home and href.startswith('index.html#'):
        return href[len('index.html'):]
    return prefix + href


def _is_current(page, href):
    if page == 'index.html':
        return href == 'index.html'
    return href.split('#', 1)[0] == page


def _item(prefix, page, home, href, title, description, icon):
    current = ' aria-current="page"' if _is_current(page, href) else ''
    target = escape(_target(href, prefix, home), quote=True)
    return (
        '<li><a class="selva-nav-mega-link" href="' + target + '"' + current + '>'
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="' + prefix
        + 'images/ecoselva-iconos.svg#' + icon + '"></use></svg>'
        '<span><strong>' + escape(title) + '</strong><small>' + escape(description) + '</small></span>'
        '<b aria-hidden="true">→</b></a></li>'
    )


def _dropdown(prefix, page, home, label, eyebrow, links, modifier):
    items = ''.join(_item(prefix, page, home, *item) for item in links)
    active = ' aria-current="page"' if any(_is_current(page, item[0]) for item in links) else ''
    return (
        f'<li class="selva-nav-desplegable selva-nav-desplegable--{modifier}"><details>'
        f'<summary{active}><span class="selva-nav-label">{escape(label)}</span></summary>'
        '<div class="selva-nav-mega-panel"><p class="selva-nav-mega-eyebrow">' + escape(eyebrow)
        + '</p><ul>' + items + '</ul></div></details></li>'
    )


def navigation(prefix='', page='index.html', home=False):
    home_current = ' aria-current="page"' if page == 'index.html' else ''
    menu = (
        '<ul class="selva-nav-principal">'
        '<li><a href="' + escape(_target('index.html', prefix, home), quote=True) + '"' + home_current + '>Inicio</a></li>'
        + _dropdown(prefix, page, home, 'Región y territorio', 'Geografía regional', REGION_LINKS, 'region')
        + _dropdown(prefix, page, home, 'Selva y biodiversidad', 'Nuestra selva', BIODIVERSITY_LINKS, 'biodiversidad')
        + '<li><a href="' + escape(_target('index.html#investigaciones', prefix, home), quote=True) + '">Ciencia y datos</a></li>'
        + _dropdown(prefix, page, home, 'EcoSelva', 'Conócenos y únete', ECOSYSTEM_LINKS, 'ecoselva')
        + '<li><a href="' + escape(_target('index.html#contacto', prefix, home), quote=True) + '">Contacto</a></li>'
        '</ul>'
    )
    logo_href = '#inicio' if home else prefix + 'index.html'
    logo_loading = ' fetchpriority="high"' if home else ''
    wrapper = 'div' if home else 'header'
    classes = 'menu container eco-home-header' if home else 'menu container eco-global-header'
    return (
        f'<{wrapper} class="{classes}">'
        f'<a href="{logo_href}" class="logo" aria-label="EcoSelva Madre de Dios · inicio">'
        f'<img width="256" height="256" src="{prefix}images/logo-ecoselva-educacion-256.webp" '
        f'alt="EcoSelva Madre de Dios" decoding="async"{logo_loading}></a>'
        '<input class="selva-menu-toggle" type="checkbox" id="menu" hidden>'
        '<label class="selva-menu-control" for="menu" role="button" tabindex="0" '
        'aria-label="Abrir o cerrar menú" aria-controls="selva-menu-navegacion" aria-expanded="false">'
        '<span class="selva-menu-control-lineas" aria-hidden="true"></span><span>Menú</span></label>'
        '<nav class="navbar" id="selva-menu-navegacion" aria-label="Navegación principal">' + menu + '</nav>'
        f'</{wrapper}>'
    )


def fragments(page):
    prefix = '../' if '/' in page else ''
    review = json.loads((ROOT / 'datos/fuentes.json').read_text())['revision_editorial']
    if page == 'fichas/castana.html':
        review = json.loads((ROOT / 'datos/fichas/castana.json').read_text())['fecha_revisión']
    elif page == 'areas-protegidas.html':
        model = re.search(r'<script type="application/json" id="anp-datos">(.*?)</script>', (ROOT / page).read_text(), re.S)
        review = json.loads(model[1])['revision']
    day = date.fromisoformat(review)
    months = ('enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre')
    review_text = f'{day.day} de {months[day.month-1]} de {day.year}'
    header = '<!-- sitio:cabecera -->\n' + navigation(prefix, page) + '\n<!-- /sitio:cabecera -->'
    footer = f'''<!-- sitio:pie -->
<footer class="eco-global-footer eco-wide"><span>EcoSelva Madre de Dios</span><span class="eco-footer-review">Revisión de fuentes: <time datetime="{review}">{review_text}</time></span><nav aria-label="Enlaces del sitio"><a href="{prefix}index.html">Inicio</a><a href="{prefix}biblioteca.html">Biblioteca</a><a href="{prefix}fuentes-metodologia.html">Fuentes y metodología</a><a href="mailto:ecoselvamadrededios@gmail.com">Contacto</a><a href="#contenido">Volver al comienzo ↑</a></nav></footer>
<!-- /sitio:pie -->'''
    return header, footer


def update():
    index = ROOT / 'index.html'
    html = index.read_text()
    home_header = '<!-- sitio:menu-principal -->\n' + navigation(home=True) + '\n<!-- /sitio:menu-principal -->'
    if '<!-- sitio:menu-principal -->' in html:
        html = re.sub(r'<!-- sitio:menu-principal -->.*?<!-- /sitio:menu-principal -->', lambda _: home_header, html, flags=re.S)
    else:
        html, count = re.subn(r'<div class="menu container">.*?</div>\s*<main id="contenido"', lambda _: home_header + '\n    <main id="contenido"', html, count=1, flags=re.S)
        if count != 1:
            raise ValueError('Menú principal no encontrado en index.html')
    index.write_text(html)

    for page in PAGES:
        path = ROOT / page
        html = path.read_text()
        header, footer = fragments(page)
        if '<!-- sitio:cabecera -->' in html:
            html = re.sub(r'<!-- sitio:cabecera -->.*?<!-- /sitio:cabecera -->', lambda _: header, html, flags=re.S)
        else:
            raise ValueError('Cabecera no encontrada: ' + page)
        if '<!-- sitio:pie -->' in html:
            html = re.sub(r'<!-- sitio:pie -->.*?<!-- /sitio:pie -->', lambda _: footer, html, flags=re.S)
        elif page == 'fichas/castana.html':
            html = html.replace('</main>', '</main>\n' + footer, 1)
        else:
            raise ValueError('Pie no encontrado: ' + page)
        path.write_text(html)


def check_generated():
    index = (ROOT / 'index.html').read_text()
    if navigation(home=True) not in index:
        raise ValueError('Menú principal desincronizado: index.html')
    for page in PAGES:
        html = (ROOT / page).read_text()
        if not all(fragment in html for fragment in fragments(page)):
            raise ValueError('Navegación desincronizada: ' + page)


if __name__ == '__main__':
    update()
    print('Cabeceras y pies comunes actualizados.')
