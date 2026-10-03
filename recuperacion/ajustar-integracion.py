from pathlib import Path
p=Path('recuperacion/integrar-cobertura-real.py');s=p.read_text(encoding='utf-8-sig');anchor="source='''<div class=\"selva-territorio-fuente-cobertura\""
insert='''# Mantener las fuentes educativas anteriores como documentación histórica.
old=re.search(r'<p>La escena forestal reutiliza.*?</p><p>Esta vista no representa.*?</p>',s,re.S)
if old:
 s=s[:old.start()]+'<details class="selva-territorio-documentacion-previa"><summary>Documentación de la experiencia educativa anterior</summary><p>Estas notas describen la versión previa, sin la cobertura vegetal de 2015. Sus fuentes se conservan como documentación educativa y no clasifican los polígonos actuales.</p>'+old.group()+'</details>'+s[old.end():]
s=s.replace('contorno, sin límites internos en la vista.', 'contorno, sin límites distritales internos en la vista.',1)
s=s.replace('<summary>Fuentes y metodología del mapa →</summary>','<summary>Fuentes y metodología del mapa →</summary><p>Referencia provincial: disolución de DISTRITOS_MDD por el campo provincia; etiquetas calculadas en puntos interiores de Manu, Tahuamanu y Tambopata. No se utilizan como categorías de cobertura vegetal.</p>',1)
'''
assert anchor in s;s=s.replace(anchor,insert+anchor,1);p.write_text(s,encoding='utf8')
