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
    fields = [field('Indicador', 'indicador'), field('Definición', 'definición'),
              field('Valor', 'valor', number(record['valor'])), field('Unidad', 'unidad'),
              field('Periodo del dato', 'año'), field('Cobertura espacial', 'ámbito'),
              field('Fuente', 'fuente'),
              field('Documento', 'publicación', f'{escape(record["publicación"])} · publicado en {record["año_publicación"]} · {escape(record["localizador"])}'),
              field('Enlace original', 'URL', link(record['URL'], 'Repositorio institucional ↗') + ' · ' + link(record['URL_PDF'], 'Tabla en el PDF ↗')),
              field('Metodología conocida', 'metodología'),
              field('Autoridades informantes', 'fuente_registro'), field('Limitaciones', 'notas'),
              field('Fecha de revisión EcoSelva', 'fecha_revisión', f'<time datetime="{record["fecha_revisión"]}">{reviewed(record["fecha_revisión"])}</time>')]
    return f'<details class="ficha-registro" id="{record["id"]}" data-registro="{record["id"]}"><summary>Ver ficha del dato <span>· {escape(record["ámbito"])} · {record["año"]} · {"pelada" if "pelada" in record["indicador"] else "con cáscara"}</span></summary><dl>{"".join(fields)}</dl></details>'


def fragments(model):
    records = {r['id']: r for r in model['indicadores']}
    review = model['fecha_revisión']
    result = {}
    result['metadatos'] = f'<dl class="ficha-metadatos"><div><dt>Ámbito</dt><dd>Madre de Dios</dd></div><div><dt>Tipo de ficha</dt><dd>Flora</dd></div><div><dt>Última revisión</dt><dd><time datetime="{review}">{reviewed(review)}</time></dd></div></dl>'
    r = records[model['destacado']]
    million = (Decimal(r['valor']) / Decimal(1000000)).quantize(Decimal('.1'), rounding=ROUND_HALF_UP)
    result['destacado'] = f'<div class="ficha-destacado"><p class="ficha-etiqueta">Dato destacado</p><strong>{str(million).replace(".", ",")} millones de {escape(r["unidad"])}</strong><p>Castaña con cáscara registrada · {escape(r["ámbito"])} · {r["año"]}</p><p class="ficha-nota">{escape(r["fuente"])} · dato preliminar, redondeado. {link("#" + r["id"], "Ver cifra exacta y fuente")}</p></div>'
    cards = []
    for id in model['tarjetas']:
        r = records[id]
        cards.append(f'<article class="ficha-indicador" data-eco-card="data" aria-labelledby="tarjeta-{id}"><p class="ficha-etiqueta">Producción registrada</p><h4 id="tarjeta-{id}">Castaña {"pelada" if "pelada" in r["indicador"] else "con cáscara"}</h4><p class="ficha-indicador-valor">{number(r["valor"])} <span>{escape(r["unidad"])}</span></p><p>{escape(r["ámbito"])} · año del dato: <strong>{r["año"]}</strong></p><p class="ficha-nota">{escape(r["fuente"])} · {escape(r["localizador"])} · documento publicado en {r["año_publicación"]}. Información preliminar.</p>{link("#" + id, "Ver ficha del dato ↓")}</article>')
    result['tarjetas'] = '<div class="ficha-indicadores">' + ''.join(cards) + '</div>'
    rows = []
    for id in model['serie']['registros']:
        r = records[id]
        rows.append(f'<tr><th scope="row">{r["año"]}</th><td>{number(r["valor"])}</td><td>{escape(r["fuente"])} · {escape(r["localizador"])} · publicación {r["año_publicación"]}<br>{link("#" + id, "Ver ficha del dato")}</td></tr>')
    result['tabla'] = '<div class="ficha-tabla-marco"><table class="ficha-tabla"><caption>Castaña con cáscara · Madre de Dios · kg registrados</caption><thead><tr><th scope="col">Año del dato</th><th scope="col">Valor (kg)</th><th scope="col">Fuente original</th></tr></thead><tbody>' + ''.join(rows) + '</tbody></table></div>'
    comparison = []
    for id in ('registro-2021', 'registro-peru-2021'):
        r = records[id]
        note = 'Tabla regional; precisión original conservada.' if r['serie_regional'] else 'Tabla nacional; se mantiene fuera de la serie regional.'
        comparison.append(f'<div><h4>{escape(r["ámbito"])}</h4><dl><dt>Fuente</dt><dd>{escape(r["fuente"])} · {escape(r["localizador"])} · publicación {r["año_publicación"]}</dd><dt>Año del dato</dt><dd>{r["año"]}</dd><dt>Valor</dt><dd>{number(r["valor"])} {escape(r["unidad"])}</dd><dt>Ámbito</dt><dd>{escape(r["ámbito"])}</dd><dt>Nota</dt><dd>{note} {link("#" + id, "Consultar registro")}</dd></dl></div>')
    result['comparacion'] = '<div class="ficha-comparacion">' + ''.join(comparison) + '</div>'
    result['registros'] = '<div class="ficha-registros">' + ''.join(record_detail(r) for r in model['indicadores']) + '</div>'
    preview_ids = {doc["id"] for doc in json.loads((ROOT / "datos/biblioteca/documentos.json").read_text())["documentos"]}
    groups = []
    for group, title, intro in [('primaria', 'Fuentes primarias · Madre de Dios', 'Documentos oficiales y estudios originales que sostienen el contenido regional.'), ('complementaria', 'Lectura complementaria · Brasil', 'Estudios originales para entender procesos biológicos. Su ámbito no es Madre de Dios.')]:
        cards = []
        for doc in model['documentos']:
            if doc['jerarquía'] != group:
                continue
            doc_title = escape(doc['título']).replace('Bertholletia excelsa', '<em>Bertholletia excelsa</em>')
            preview = f'<button class="eco-button eco-button-outline" type="button" data-eco-document="{doc["id"]}" aria-haspopup="dialog">{"Previsualizar" if doc.get("URL_PDF") else "Contexto y fuente"}</button>' if doc["id"] in preview_ids else ""
            cards.append(f'<li class="eco-card" data-eco-card="{"document" if doc.get("URL_PDF") else "article"}" id="{doc["id"]}"><p class="ficha-etiqueta">{escape(doc["tipo"])}</p><p class="ficha-doc-autor">{escape(doc["autor"])}</p><h5>{doc_title}</h5><p class="ficha-nota">Publicación: {doc["año"]} · {escape(doc["ámbito"])}</p><p><strong>Por qué lo usamos:</strong> {escape(doc["uso"])}</p><div class="ficha-doc-enlaces">{link(doc["URL"], "Abrir documento ↗")}{(" · " + link(doc["URL_PDF"], "PDF original ↗")) if doc.get("URL_PDF") else ""}</div>{preview}</li>')
        groups.append(f'<div class="ficha-documental ficha-documental--{group}"><h4>{title}</h4><p class="ficha-nota">{intro}</p><ul class="ficha-documentos">{"".join(cards)}</ul></div>')
    result['documentos'] = ''.join(groups)
    owner = escape(model['responsabilidad_editorial'])
    result['editorial'] = f'<dl class="ficha-editorial"><div><dt>Última revisión</dt><dd><time datetime="{review}">{reviewed(review)}</time></dd></div><div><dt>Responsabilidad editorial</dt><dd>{owner}</dd></div></dl><p>{link("../fuentes-metodologia.html", "Cómo seleccionamos y revisamos fuentes →")}</p><h2>Cómo citar esta ficha</h2><p class="ficha-cita">{owner}. ({date.fromisoformat(review).year}). «Castaña amazónica (<em>Bertholletia excelsa</em>)». {link(model["URL"], model["URL"])}. Consultado el: [fecha de consulta del lector].</p>'
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
