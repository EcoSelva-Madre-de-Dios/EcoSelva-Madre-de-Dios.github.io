from pathlib import Path
import shutil,json
r=Path.cwd();b=r/'recuperacion/antes-de-referencias-cartograficas';b.mkdir(exist_ok=True)
for n in ['index.html','style.css','script.js']:shutil.copy2(r/n,b/n)
p=(r/'index.html').read_bytes().decode('utf8');a=p.index('    <section class="selva-explora reveal" id="explora-madre-de-dios">');z=p.index('<section class="selva-ambiente reveal" id="ambiente">');s=p[a:z]
labels='<g class="selva-territorio-colindantes" pointer-events="none" aria-label="Colindantes de Madre de Dios">'
for name,x,y in [('Ucayali',170,145),('Cusco',76,355),('Puno',325,478),('Brasil',420,145),('Bolivia',540,392)]:labels+=f'<text x="{x}" y="{y}" text-anchor="middle">{name}</text>'
labels+='</g>'
s=s.replace('<g class="selva-territorio-orientacion"',labels+'<g class="selva-territorio-orientacion"',1)
compass='''<svg class="selva-territorio-brujula" viewBox="0 0 64 64" role="img" aria-label="Orientación cartográfica: norte arriba, sur abajo, este a la derecha y oeste a la izquierda"><path class="selva-territorio-brujula-ejes" d="M32 16v32M16 32h32"/><path class="selva-territorio-brujula-norte" d="m32 17-5 15h10Z"/><path class="selva-territorio-brujula-sur" d="m32 47-4-15h8Z"/><circle cx="32" cy="32" r="2"/><text class="selva-territorio-brujula-n" x="32" y="11">N</text><text x="32" y="61">S</text><text x="58" y="36">E</text><text x="6" y="36">O</text></svg>'''
s=s.replace('<div class="selva-territorio-controles"',compass+'<div class="selva-territorio-controles"',1)
s=s.replace('<summary>Fuentes y metodología del mapa →</summary>','<summary>Fuentes y metodología del mapa →</summary><p>Colindantes: Ucayali, Cusco, Puno, Brasil y Bolivia, según la <a href="https://www.bcrp.gob.pe/docs/Sucursales/Cusco/madre-de-dios-caracterizacion.pdf" target="_blank" rel="noopener noreferrer">caracterización territorial del BCRP</a>. Los nombres son referencias externas; no representan polígonos ni fronteras adicionales.</p>',1)
(r/'index.html').write_bytes((p[:a]+s+p[z:]).encode('utf8'))
j=(r/'script.js').read_bytes().decode('utf8');anchor='            svg.querySelectorAll(".selva-territorio-provincias-nombres text").forEach(text => text.setAttribute("font-size", 11 / matrix.a));';assert anchor in j
j=j.replace(anchor,anchor+'\n            svg.querySelectorAll(".selva-territorio-colindantes text").forEach(text => text.setAttribute("font-size", (canvas.clientWidth < 450 ? 9 : 10) / matrix.a));',1)
(r/'script.js').write_bytes(j.encode('utf8'))
css='''
/* Referencia cartográfica: arcilla, orientación y colindantes. */
#explora-madre-de-dios .selva-territorio-provincias-limites path { stroke: #A86A3D; stroke-width: 1.4; stroke-opacity: .92; }
#explora-madre-de-dios .selva-territorio-provincias-limites { filter: drop-shadow(0 0 .8px rgba(255,250,237,.9)); }
#explora-madre-de-dios [data-territorio-activo='bosques'] .selva-territorio-provincias-limites { filter: drop-shadow(0 0 .8px rgba(255,250,237,.9)); }
#explora-madre-de-dios .selva-territorio-provincias-nombres text { fill: #895A38; font-weight: 600; stroke: #fcf8ec; stroke-opacity: .85; stroke-width: 2.4; vector-effect: non-scaling-stroke; }
#explora-madre-de-dios .selva-territorio-orientacion { display: none; }
#explora-madre-de-dios .selva-territorio-colindantes { pointer-events: none; }
#explora-madre-de-dios .selva-territorio-colindantes text { fill: #7a857a; font-family: Manrope,sans-serif; font-weight: 500; letter-spacing: .035em; }
#explora-madre-de-dios .selva-territorio-brujula { position: absolute; z-index: 2; top: 12px; right: 78px; width: 58px; height: 58px; overflow: visible; fill: #8f9b8c; pointer-events: none; }
#explora-madre-de-dios .selva-territorio-brujula-ejes { stroke: #95a08e; stroke-width: .8; fill: none; }
#explora-madre-de-dios .selva-territorio-brujula-norte { fill: #42664e; }
#explora-madre-de-dios .selva-territorio-brujula-sur { fill: #ced5c9; }
#explora-madre-de-dios .selva-territorio-brujula text { text-anchor: middle; font-family: Manrope,sans-serif; font-size: 10px; font-weight: 500; fill: #7b8878; }
#explora-madre-de-dios .selva-territorio-brujula .selva-territorio-brujula-n { font-weight: 700; fill: #42664e; }
@media (max-width: 760px) { #explora-madre-de-dios .selva-territorio-brujula { width: 48px; height: 48px; right: 74px; top: 13px; } }
'''
with (r/'style.css').open('ab') as f:f.write(css.encode('utf8'))
(r/'datos/territorio/referencia-contextual.json').write_text(json.dumps({'colindantes':['Ucayali','Cusco','Puno','Brasil','Bolivia'],'fuente':'Banco Central de Reserva del Perú, caracterización territorial de Madre de Dios','url':'https://www.bcrp.gob.pe/docs/Sucursales/Cusco/madre-de-dios-caracterizacion.pdf','alcance':'Etiquetas contextuales externas, sin nuevas geometrías ni coordenadas atribuidas a entidades. Provincias y sus trazados originales sin modificación.','orientacion':'Norte arriba en el espacio cartográfico existente.'},ensure_ascii=False,indent=2),encoding='utf8')
