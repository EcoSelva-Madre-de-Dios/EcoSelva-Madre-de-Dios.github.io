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
    numbers = {id: i + 1 for i, id in enumerate(model['fuentes'])}
    links = ''.join(f'<a href="#flora-fuente-{e(id)}" data-eco-context="#flora-fuente-{e(id)}" aria-label="Consultar referencia {numbers[id]}">[{numbers[id]}]</a>' for id in dict.fromkeys(ids))
    return '<div class="flora-cita eco-numbered-citations" aria-label="Fuentes de este contenido">' + links + '</div>'



def fragments(model):
    buttons = ''.join(f'<button type="button" data-flora-recurso="{e(item["id"])}" aria-pressed="false" aria-controls="flora-caso-{e(item["id"])}">{e(item["nombre"])}</button>' for item in model['recursos'])
    flow = '<div class="flora-selector" role="group" aria-label="Elige un recurso del bosque" hidden>' + buttons + '</div>\n'
    flow += '<p class="flora-estado" role="status" aria-live="polite" aria-atomic="true"></p>\n'
    for item in model['recursos']:
        id = e(item['id'])
        steps = ''.join(f'<li><h4>{e(step["etapa"])}</h4><p>{e(step["texto"])}</p></li>' for step in item['pasos'])
        flow += f'<article class="flora-caso" id="flora-caso-{id}" data-flora-caso="{id}" aria-labelledby="flora-caso-{id}-titulo"><h3 id="flora-caso-{id}-titulo">{e(item["nombre"])}</h3><p><em>{e(item["nombre_cientifico"])}</em></p><p class="eco-card-scope">{e(item["alcance"])}</p><ol class="flora-pasos" aria-label="Del bosque al producto: {e(item["nombre"])}">{steps}</ol>{citations(item["fuentes"], model)}</article>\n'
    sources = '<ol class="flora-references">'
    registry = json.loads((ROOT / 'datos/fuentes.json').read_text())
    documents = {doc['id']: doc for doc in registry['documentos']}
    for id, source in model['fuentes'].items():
        document = documents[registry['flora'][id]]
        source = {**source, 'institucion': document['autor'], 'documento': document['titulo'], 'anio': document['anio'], 'url': document['url']}
        year = source['anio'] or 'Sin fecha de publicación indicada'
        title_lang = f' lang="{e(document["lang"])}"' if document.get('lang') else ''
        sources += f'<li><details class="flora-tarjeta flora-fuente eco-card" id="flora-fuente-{e(id)}" data-eco-card="document"><summary><span class="flora-fuente-titulo"{title_lang}>{e(source["documento"])}</span></summary><p class="flora-pista">{e(source["institucion"])} · {e(year)}</p><a class="eco-text-link" href="{e(source["url"])}" target="_blank" rel="noopener noreferrer">Consultar documento original ↗</a><p><a href="fuentes-metodologia.html#metodologia-flora-{e(id)}">Leer el alcance y el método de esta referencia →</a></p></details></li>\n'
    sources += '</ol>'
    result = {'recorridos': flow, 'fuentes': sources}
    for item in model['especies_destacadas']:
        unknown = [field['campo'] for field in item['campos'] if field['texto'] == 'Información no verificada para Madre de Dios en las fuentes consultadas.']
        fields = ''.join(f'<div><dt>{e(field["campo"])}</dt><dd>{e(field["texto"])}</dd></div>' for field in item['campos'] if field['campo'] not in unknown)
        pending = f'<p class="flora-pista">Sin documentación regional verificada: {e(", ".join(unknown))}.</p>' if unknown else ''
        result['especie-' + item['id']] = '<dl class="flora-especie-datos">' + fields + '</dl>' + pending + f'<p class="flora-especie-localizador">{e(item["localizador"])}</p>' + citations(item['fuentes'], model)
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
