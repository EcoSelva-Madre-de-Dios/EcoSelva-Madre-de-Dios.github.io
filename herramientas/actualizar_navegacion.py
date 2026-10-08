"""Cabecera y pie compartidos de las lecturas, con enlaces relativos correctos."""
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
LINKS = (
    ('index.html', 'Inicio'), ('index.html#conoce-madre-de-dios', 'Conoce Madre de Dios'),
    ('territorio.html', 'Territorio'), ('historia.html', 'Historia'),
    ('areas-protegidas.html', 'Áreas protegidas'), ('index.html#biodiversidad', 'Biodiversidad'),
    ('index.html#ambiente', 'Ambiente'), ('index.html#investigaciones', 'Ciencia'),
    ('biblioteca.html', 'Biblioteca'), ('index.html#quienes-somos', 'EcoSelva'),
    ('index.html#colabora', 'Colabora'), ('index.html#contacto', 'Contacto'),
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
    target, label = PAGES[page]
    links = ''.join(f'<li><a href="{prefix}{href}"' + (' aria-current="page"' if href == page else '') + f'>{text}</a></li>' for href, text in LINKS)
    header = f'''<!-- sitio:cabecera -->
<header class="eco-barra eco-global-header"><div class="eco-wide"><a class="eco-marca" href="{prefix}index.html" aria-label="EcoSelva · inicio"><img src="{prefix}images/logo-ecoselva-educacion.png" width="768" height="768" alt="" loading="lazy" decoding="async"><span>EcoSelva<small>Madre de Dios</small></span></a><a class="eco-global-return" href="{prefix}{target}">← {escape(label)}</a><details class="eco-global-menu"><summary>Menú</summary><nav class="eco-global-nav" aria-label="Navegación principal"><ul>{links}</ul></nav></details></div></header>
<!-- /sitio:cabecera -->'''
    footer = f'''<!-- sitio:pie -->
<footer class="eco-global-footer eco-wide"><span>EcoSelva Madre de Dios</span><span class="eco-footer-review">Revisión de fuentes: <time datetime="{review}">{review_text}</time></span><nav aria-label="Enlaces del sitio"><a href="{prefix}index.html">Inicio</a><a href="{prefix}biblioteca.html">Biblioteca</a><a href="{prefix}fuentes-metodologia.html">Fuentes y metodología</a><a href="mailto:ecoselvamadrededios@gmail.com">Contacto</a><a href="#contenido">Volver al comienzo ↑</a></nav></footer>
<!-- /sitio:pie -->'''
    return header, footer

def update():
    for page in PAGES:
        path = ROOT / page
        html = path.read_text()
        header, footer = fragments(page)
        if '<!-- sitio:cabecera -->' in html:
            html = re.sub(r'<!-- sitio:cabecera -->.*?<!-- /sitio:cabecera -->', lambda _: header, html, flags=re.S)
        else:
            html, count = re.subn(r'<header class="(?:eco-barra|anp-barra|historia-barra|ficha-barra)[^"]*">.*?</header>', lambda _: header, html, count=1, flags=re.S)
            if count != 1: raise ValueError('Cabecera no encontrada: ' + page)
        if '<!-- sitio:pie -->' in html:
            html = re.sub(r'<!-- sitio:pie -->.*?<!-- /sitio:pie -->', lambda _: footer, html, flags=re.S)
        elif page == 'fichas/castana.html':
            html = html.replace('</main>', '</main>\n' + footer, 1)
        else:
            html, count = re.subn(r'<footer class="(?:eco-pie|anp-pie|historia-pie)[^"]*">.*?</footer>', lambda _: footer, html, count=1, flags=re.S)
            if count != 1: raise ValueError('Pie no encontrado: ' + page)
        path.write_text(html)

def check_generated():
    for page in PAGES:
        html = (ROOT / page).read_text()
        if not all(fragment in html for fragment in fragments(page)):
            raise ValueError('Navegación desincronizada: ' + page)

if __name__ == '__main__':
    update()
    print('Cabeceras y pies comunes actualizados.')
