"""Genera fragmentos estáticos y CSV desde los datos revisados de la ficha piloto.

Uso: python herramientas/actualizar_ficha_castana.py [--check]
No descarga fuentes ni modifica textos educativos, estilos o páginas ajenas.
"""
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from html import escape
from pathlib import Path
import csv
import io
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / 'datos/fichas/castana.json'
HTML = ROOT / 'fichas/castana.html'
CSV = ROOT / 'datos/fichas/castana-indicadores.csv'
COLUMNS = ('indicador', 'valor', 'unidad', 'año', 'ámbito', 'fuente', 'URL',
           'notas', 'publicación', 'año_publicación', 'fecha_revisión',
           'localizador', 'URL_PDF', 'definición', 'metodología', 'fuente_registro')


def number(value):
    whole, *fraction = str(value).split('.')
    # Agrupar desde la derecha, conservando todos los decimales originales.
    grouped = f'{int(whole):,}'.replace(',', '\u202f')
    return grouped + (',' + fraction[0] if fraction else '')


def reviewed(value):
    day = date.fromisoformat(value)
    months = ('enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
              'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre')
    return f'{day.day} de {months[day.month - 1]} de {day.year}'


def link(url, label):
    return f'<a href="{escape(url, quote=True)}">{escape(str(label))}</a>'


def record_detail(record):
    def field(label, key, content=None):
        value = str(record[key])
        return f'<dt>{label}</dt><dd data-campo="{key}" data-valor="{escape(value, quote=True)}">{content if content is not None else escape(value)}</dd>'
    doc_id = next(doc['id'] for doc in json.loads(MODEL.read_text())['documentos'] if doc['título'] == record['publicación'])
    methodology = '../fuentes-metodologia.html#metodo-castana-' + record['id']
    fields = [field('Definición', 'definición', link(methodology, 'Consultar la definición del indicador →')),
              field('Fuente', 'fuente', f'<a href="#{doc_id}" data-eco-context="#{doc_id}">Referencia del documento original</a>'),
              field('Documento y localizador', 'publicación', f'<a href="#{doc_id}" data-eco-context="#{doc_id}">Documento original</a> · publicación {record["año_publicación"]} · {escape(record["localizador"])}'),
              field('Enlace original', 'URL', f'<a href="#{doc_id}" data-eco-context="#{doc_id}">Consultar la referencia y sus enlaces ↗</a>'),
              field('Metodología conocida', 'metodología', link(methodology, 'Consultar el método documentado →')),
              field('Autoridades informantes', 'fuente_registro'),
              field('Limitaciones', 'notas', link(methodology, 'Leer las limitaciones del registro →'))]
    return f'<details class="ficha-registro" id="{record["id"]}" data-registro="{record["id"]}" data-revision="{record["fecha_revisión"]}"><summary>Contexto del registro <span>· {escape(record["ámbito"])} · {record["año"]} · {"pelada" if "pelada" in record["indicador"] else "con cáscara"}</span></summary><dl>{"".join(fields)}</dl></details>'


def fragments(model):
    records = {r['id']: r for r in model['indicadores']}
    review = model['fecha_revisión']
    result = {}
    result['metadatos'] = f'<dl class="ficha-metadatos"><div><dt>Ámbito</dt><dd>Madre de Dios</dd></div><div><dt>Tipo de ficha</dt><dd>Flora</dd></div></dl>'
    result['destacado'] = '<div class="ficha-destacado"><p class="ficha-etiqueta">Del bosque al registro</p><p>Los anuarios distinguen la castaña con cáscara de la castaña pelada.</p><a class="eco-text-link" href="#serie-produccion">Consultar la producción documentada →</a></div>'
    cards = []
    for id in model['tarjetas']:
        r = records[id]
        category = 'pelada' if 'pelada' in r['indicador'] else 'con cáscara'
        cards.append(f'<article class="ficha-indicador" data-eco-card="data" aria-labelledby="tarjeta-{id}"><h4 id="tarjeta-{id}">Castaña {category}</h4><a href="#{id}">Consultar el registro de castaña {category} →</a></article>')
    result['tarjetas'] = '<div class="ficha-indicadores">' + ''.join(cards) + '</div>'
    def cell(record, key, content=None):
        return f'<td data-campo="{key}" data-valor="{escape(str(record[key]), quote=True)}">{content if content is not None else escape(str(record[key]))}</td>'
    def row(record):
        doc_id = next(doc['id'] for doc in model['documentos'] if doc['título'] == record['publicación'])
        number_ref = next(i+1 for i, doc in enumerate(model['documentos']) if doc['id'] == doc_id)
        return f'<tr data-registro-resumen="{record["id"]}">{cell(record,"indicador", "Pelada" if "pelada" in record["indicador"] else "Con cáscara")}{cell(record,"ámbito")}{cell(record,"año")}{cell(record,"valor",number(record["valor"]))}{cell(record,"unidad")}<td><a href="#{record["id"]}" data-eco-record="#{record["id"]}" aria-label="Consultar contexto de castaña {"pelada" if "pelada" in record["indicador"] else "con cáscara"}, {escape(record["ámbito"])} {record["año"]}">[{number_ref}]</a></td></tr>'
    regional = ''.join(row(record) for record in model['indicadores'] if record['serie_regional'])
    separate = ''.join(row(record) for record in model['indicadores'] if not record['serie_regional'])
    result['tabla'] = '<div class="ficha-tabla-marco" role="region" tabindex="0" aria-label="Tabla de registros de castaña, desplazable horizontalmente"><table class="ficha-tabla"><caption>Producción registrada: cada valor conserva su categoría y ámbito</caption><thead><tr><th scope="col">Categoría</th><th scope="col">Ámbito</th><th scope="col">Año</th><th scope="col">Valor</th><th scope="col">Unidad</th><th scope="col">Referencia</th></tr></thead><tbody aria-label="Serie regional con cáscara">' + regional + '</tbody><tbody class="ficha-serie-separada" aria-label="Registros fuera de la serie regional con cáscara">' + separate + '</tbody></table></div>'
    result['comparacion'] = '<div class="ficha-comparacion"><div><h4>Registro regional</h4><p>Su ámbito es Madre de Dios.</p><a href="#registro-2021" data-eco-record="#registro-2021">Consultar el respaldo regional →</a></div><div><h4>Registro nacional</h4><p>Su ámbito es Perú; permanece fuera de la serie regional.</p><a href="#registro-peru-2021" data-eco-record="#registro-peru-2021">Consultar el respaldo nacional →</a></div></div>'
    result['registros'] = '<div class="ficha-registros">' + ''.join(record_detail(r) for r in model['indicadores']) + '</div>'
    preview_ids = {doc["id"] for doc in json.loads((ROOT / "datos/fuentes.json").read_text())["documentos"]}
    groups = []
    for group, title, intro in [('primaria', 'Fuentes primarias · Madre de Dios', 'Documentos oficiales y estudios originales que sostienen el contenido regional.'), ('complementaria', 'Lectura complementaria · Brasil', 'Estudios originales para entender procesos biológicos. Su ámbito no es Madre de Dios.')]:
        cards = []
        for reference_number, doc in enumerate(model['documentos'], 1):
            if doc['jerarquía'] != group:
                continue
            doc_title = escape(doc['título']).replace('Bertholletia excelsa', '<em>Bertholletia excelsa</em>')
            title_lang = f' lang="{escape(doc["lang"])}"' if doc.get('lang') else ''
            preview = f'<button class="eco-button eco-button-outline" type="button" data-eco-document="{doc["id"]}" aria-haspopup="dialog">{"Previsualizar" if doc.get("URL_PDF") else "Contexto y fuente"}</button>' if doc["id"] in preview_ids else ""
            cards.append(f'<li value="{reference_number}" class="eco-card" data-eco-card="{"document" if doc.get("URL_PDF") else "article"}" id="{doc["id"]}"><p class="ficha-etiqueta">{escape(doc["tipo"])}</p><p class="ficha-doc-autor">{escape(doc["autor"])}</p><h5{title_lang}>{doc_title}</h5><p class="ficha-nota">Publicación: {doc["año"]} · {escape(doc["ámbito"])}</p><p><strong>Por qué lo usamos:</strong> {escape(doc["uso"])}</p><div class="ficha-doc-enlaces">{link(doc["URL"], "Abrir documento ↗")}{(" · " + link(doc["URL_PDF"], "PDF original ↗")) if doc.get("URL_PDF") else ""}</div>{preview}</li>')
        groups.append(f'<div class="ficha-documental ficha-documental--{group}"><h4>{title}</h4><p class="ficha-nota">{intro}</p><ol class="ficha-documentos">{"".join(cards)}</ol></div>')
    result['documentos'] = ''.join(groups)
    owner = escape(model['responsabilidad_editorial'])
    result['editorial'] = f'<dl class="ficha-editorial"><div><dt>Responsabilidad editorial</dt><dd>{owner}</dd></div></dl><p>{link("../fuentes-metodologia.html", "Cómo seleccionamos y revisamos fuentes →")}</p><h2>Cómo citar esta ficha</h2><p class="ficha-cita">{owner}. ({date.fromisoformat(review).year}). «Castaña amazónica (<em>Bertholletia excelsa</em>)». {link(model["URL"], model["URL"])}. Consultado el: [fecha de consulta del lector].</p>'
    result['schema'] = '<script type="application/ld+json">' + json.dumps({'@context': 'https://schema.org', '@type': 'Article', 'headline': 'Castaña amazónica en Madre de Dios', 'inLanguage': 'es-PE', 'mainEntityOfPage': model['URL'], 'image': 'https://ecoselva-madre-de-dios.github.io/images/castana-commons-745.jpg', 'author': {'@type': 'Organization', 'name': model['responsabilidad_editorial']}, 'dateModified': review}, ensure_ascii=False).replace('<', '\\u003c') + '</script>'
    return result


def render_html(model, source):
    for name, content in fragments(model).items():
        pattern = re.compile(r'(<!-- ficha:' + name + r' -->).*?(<!-- /ficha:' + name + r' -->)', re.S)
        if len(pattern.findall(source)) != 1:
            raise ValueError(f'Debe existir un único bloque ficha:{name}.')
        source = pattern.sub(lambda match: match[1] + '\n' + content + '\n' + match[2], source)
    return source


def render_csv(model):
    output = io.StringIO(newline='')
    writer = csv.DictWriter(output, fieldnames=COLUMNS, lineterminator='\n')
    writer.writeheader()
    for record in model['indicadores']:
        writer.writerow({key: record[key] for key in COLUMNS})
    return ('\ufeff' + output.getvalue()).encode('utf-8')


def check_generated():
    model = json.loads(MODEL.read_text())
    if render_html(model, HTML.read_text()) != HTML.read_text() or render_csv(model) != CSV.read_bytes():
        raise ValueError('Ficha desincronizada: ejecuta python herramientas/actualizar_ficha_castana.py después de revisar los datos.')


if __name__ == '__main__':
    if sys.argv[1:] == ['--check']:
        check_generated()
        print('Ficha y CSV sincronizados con los datos revisados.')
    elif not sys.argv[1:]:
        model = json.loads(MODEL.read_text())
        content = render_html(model, HTML.read_text())
        csv_content = render_csv(model)
        HTML.write_text(content)
        CSV.write_bytes(csv_content)
        print('Fragmentos de la ficha y CSV actualizados. Ejecuta verificar_sitio.py antes de publicar.')
    else:
        sys.exit('Uso: python herramientas/actualizar_ficha_castana.py [--check]')
