from pathlib import Path
import re,xml.etree.ElementTree as ET,json
root=Path(__file__).resolve().parent.parent
backup=root/'recuperacion/antes-de-cobertura-real'
for name,a,b in [('index.html','    <section class="selva-explora reveal" id="explora-madre-de-dios">','<section class="selva-ambiente reveal" id="ambiente">'),('script.js','    const territory = document.querySelector(".selva-territorio-layout");','    const ecosystemHotspots =')]:
    old=(backup/name).read_bytes().decode('utf8');new=(root/name).read_bytes().decode('utf8')
    assert old[:old.index(a)]==new[:new.index(a)]
    assert old[old.index(b):]==new[new.index(b):]
    print(name+': resto intacto')
assert (root/'style.css').read_bytes().startswith((backup/'style.css').read_bytes())
oldpage=(backup/'index.html').read_text(encoding='utf8');newpage=(root/'index.html').read_text(encoding='utf8')
oldsvg=ET.fromstring(re.search(r'<svg\b[^>]*class="selva-territorio-svg".*?</svg>',oldpage,re.S).group())
newsvg=ET.fromstring(re.search(r'<svg\b[^>]*class="selva-territorio-svg".*?</svg>',newpage,re.S).group())
for cls in ['selva-territorio-rio-linea','selva-territorio-rio-hit','selva-territorio-agua-forma','selva-territorio-limite']:
    original=[el.get('d') for el in oldsvg.iter() if el.get('class')==cls]
    current=[el.get('d') for el in newsvg.iter() if el.get('class')==cls]
    assert original==current,cls
    print(cls+': geometrías originales conservadas')
assert [el.get('data-mapa-feature') for el in oldsvg.iter() if el.get('data-mapa-feature')]==[el.get('data-mapa-feature') for el in newsvg.iter() if el.get('data-mapa-feature') and el.get('data-mapa-modo')!='bosques']
data=json.loads(re.search(r'<script type="application/json" id="selva-territorio-datos">(.*?)</script>',oldpage,re.S).group(1))
assert json.loads(re.search(r'<script type="application/json" id="selva-territorio-datos">(.*?)</script>',newpage,re.S).group(1))==data
for template in ['selva-territorio-version-anterior-gdb','selva-territorio-experiencia-anterior','selva-territorio-mapa-tecnico-futuro']:
    assert template in newpage
print('IDs, fichas anteriores, fuentes y templates conservados')
