"""Sincroniza recorridos, referencias y campos de especies con el modelo público de Flora."""
from html import escape
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]


def e(value):
    return escape(str(value), quote=True)


def citations(ids, model):
    links = ''.join(f'<a href="#flora-fuente-{e(id)}">{e(model["fuentes"][id].get("etiqueta", model["fuentes"][id]["institucion"]))} · {e(model["fuentes"][id]["anio"] or "sin fecha")}</a>' for id in ids)
    return '<div class="flora-cita" aria-label="Fuentes de este contenido">' + links + '</div>'


def fragments(model):
    buttons = ''.join(f'<button type="button" data-flora-recurso="{e(item["id"])}" aria-pressed="false" aria-controls="flora-caso-{e(item["id"])}">{e(item["nombre"])}</button>' for item in model['recursos'])
    flow = '<div class="flora-selector" role="group" aria-label="Elige un recurso del bosque" hidden>' + buttons + '</div>\n'
    flow += '<p class="flora-estado" role="status" aria-live="polite" aria-atomic="true"></p>\n'
    for item in model['recursos']:
        id = e(item['id'])
        steps = ''.join(f'<li><h4>{e(step["etapa"])}</h4><p>{e(step["texto"])}</p></li>' for step in item['pasos'])
        flow += f'<article class="flora-caso" id="flora-caso-{id}" data-flora-caso="{id}" aria-labelledby="flora-caso-{id}-titulo"><h3 id="flora-caso-{id}-titulo">{e(item["nombre"])}</h3><p><em>{e(item["nombre_cientifico"])}</em></p><p class="eco-card-scope">{e(item["alcance"])}</p><ol class="flora-pasos" aria-label="Del bosque al producto: {e(item["nombre"])}">{steps}</ol>{citations(item["fuentes"], model)}</article>\n'
    sources = ''
    registry = json.loads((ROOT / 'datos/fuentes.json').read_text())
    documents = {doc['id']: doc for doc in registry['documentos']}
    for id, source in model['fuentes'].items():
        document = documents[registry['flora'][id]]
        source = {**source, 'institucion': document['autor'], 'documento': document['titulo'], 'anio': document['anio'], 'url': document['url']}
        year = source['anio'] or 'Sin fecha de publicación indicada'
        fields = [('Institución y autores', source['institucion']), ('Documento', source['documento']), ('Año', year), ('Alcance', source['alcance']), ('Dónde se documenta', source['localizador'])]
        metadata = ''.join(f'<div><dt>{e(label)}</dt><dd>{e(value)}</dd></div>' for label, value in fields)
        sources += f'<details class="flora-tarjeta flora-fuente eco-card" id="flora-fuente-{e(id)}" data-eco-card="document"><summary><span class="flora-fuente-titulo">{e(source["documento"])}<span class="selva-flora-solo-lectores"> · ampliar referencia</span></span></summary><span class="flora-pista">{e(source["institucion"])} · {e(year)}</span><dl>{metadata}</dl><a class="eco-text-link" href="{e(source["url"])}" target="_blank" rel="noopener noreferrer">Consultar fuente original <span aria-hidden="true">↗</span></a></details>\n'
    result = {'recorridos': flow, 'fuentes': sources}
    for item in model['especies_destacadas']:
        fields = ''.join(f'<div><dt>{e(field["campo"])}</dt><dd>{e('Sin documentación regional verificada en las fuentes consultadas.' if field['texto'] == 'Información no verificada para Madre de Dios en las fuentes consultadas.' else field['texto'])}</dd></div>' for field in item['campos'])
        result['especie-' + item['id']] = '<dl class="flora-especie-datos">' + fields + '</dl>' + f'<p class="flora-especie-localizador">{e(item["localizador"])}</p>' + citations(item['fuentes'], model)
    return result


def generated_html(html, model):
    for key, fragment in fragments(model).items():
        pattern = re.compile(r'(<!-- FLORA:' + re.escape(key) + r':INICIO -->).*?(<!-- FLORA:' + re.escape(key) + r':FIN -->)', re.S)
        if len(pattern.findall(html)) != 1:
            raise ValueError('Flora: falta o está repetido el bloque de contenido ' + key)
        html = pattern.sub(lambda match: match[1] + '\n' + fragment + '\n' + match[2], html)
    return html


def check_generated():
    html = (ROOT / 'flora.html').read_text()
    model = json.loads((ROOT / 'datos/flora/lectura.json').read_text())
    if generated_html(html, model) != html:
        raise ValueError('Flora: los recorridos, fuentes o especies difieren del modelo. Ejecuta herramientas/actualizar_flora.py.')


if __name__ == '__main__':
    if '--check' in sys.argv:
        check_generated()
        print('Flora: contenido y modelo sincronizados.')
    else:
        path = ROOT / 'flora.html'
        model = json.loads((ROOT / 'datos/flora/lectura.json').read_text())
        path.write_text(generated_html(path.read_text(), model))
        print('Flora: recorridos, fuentes y campos de especies actualizados.')
