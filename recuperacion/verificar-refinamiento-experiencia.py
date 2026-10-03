from pathlib import Path
import re,xml.etree.ElementTree as E,json
r=Path.cwd();b=r/'recuperacion/antes-de-refinamiento-experiencia';old=(b/'index.html').read_bytes().decode('utf8');new=(r/'index.html').read_bytes().decode('utf8')
def svg(s):return E.fromstring(re.search(r'<svg\b[^>]*class="selva-territorio-svg".*?</svg>',s,re.S).group())
a,c=svg(old),svg(new)
assert [(e.tag,dict(e.attrib),e.text) for e in a.iter()]==[(e.tag,dict(e.attrib),e.text) for e in c.iter()]
for id in ['selva-territorio-datos','selva-territorio-cobertura-datos','selva-territorio-descripciones']:
 def data(s):return json.loads(re.search(r'<script[^>]*id="'+id+r'">(.*?)</script>',s,re.S).group(1))
 assert data(old)==data(new),id
# Todos los href previos continúan en el HTML; solo cambia su visibilidad pública.
assert set(re.findall(r'href="([^"]+)"',old)).issubset(set(re.findall(r'href="([^"]+)"',new)))
assert (r/'style.css').read_bytes().startswith((b/'style.css').read_bytes())
for section in ['inicio','sabias-que','programas','investigaciones','quienes-somos','colabora']:
 pattern=r'<(?:section|header)\b[^>]*id="'+section+r'".*?</(?:section|header)>'
 assert re.search(pattern,old,re.S).group()==re.search(pattern,new,re.S).group(),section
print('SVG completo, datos originales, enlaces, CSS previo y secciones ajenas conservados.')
