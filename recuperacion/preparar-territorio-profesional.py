from pathlib import Path
import re
root=Path(__file__).resolve().parent.parent
p=root/'index.html';s=p.read_bytes().decode('utf8')
a=s.index('    <section class="selva-explora reveal" id="explora-madre-de-dios">')
b=s.index('<section class="selva-ambiente reveal" id="ambiente">',a)
part=s[a:b]
m=re.search(r'<svg\b[^>]*class="selva-territorio-svg".*?</svg>',part,re.S)
original=m.group()
updated=original[:-6]+'<g class="selva-territorio-etiquetas" data-territorio-label-mode="rios"></g></svg>'
updated=updated.replace('class="selva-territorio-svg"','class="selva-territorio-svg" tabindex="0"',1)
part=part[:m.start()]+updated+part[m.end():]
part=part.replace('<div class="selva-territorio-canvas">','<div class="selva-territorio-canvas"><div class="selva-territorio-ubicacion" aria-hidden="true"><strong>Madre de Dios</strong><span>Perú · vista regional</span></div><div class="selva-territorio-escala" aria-label="Escala gráfica aproximada"><div><span>0</span><span class="selva-territorio-escala-valor">100 km</span></div><i></i></div>',1)
part=part.replace('<p class="selva-territorio-panel-intro">','<p class="selva-territorio-panel-intro">',1)
part=part.replace('<summary>Fuentes y metodología →</summary>','<summary>Fuentes y metodología del mapa →</summary>',1)
p.write_bytes((s[:a]+part+s[b:]).encode('utf8'))
print('Presentación actualizada; SVG y fuentes conservados.')
