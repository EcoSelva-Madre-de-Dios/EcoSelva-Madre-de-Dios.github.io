"""Comprime coordenadas SVG sin cambiar sus posiciones redondeadas."""
from pathlib import Path
from decimal import Decimal
import re,json
r=Path.cwd();p=r/'datos/territorio/cobertura-bosques.svg';old=p.read_text(encoding='utf8')
# Mantener subrutas y cierres exactamente; unidades de centésima de SVG.
def convert(match):
 d=match.group(1);tokens=[];x=y=0
 for token in re.findall(r'[ML][\d.-]+,[\d.-]+|Z',d):
  if token=='Z':tokens.append('Z');continue
  cmd=token[0];px,py=token[1:].split(',');nx=int(Decimal(px)*100);ny=int(Decimal(py)*100)
  if cmd=='M':tokens.append(f'M{nx} {ny}')
  else:
   dx,dy=nx-x,ny-y
   tokens.append(f'h{dx}' if dy==0 else f'v{dy}' if dx==0 else f'l{dx} {dy}')
  x,y=nx,ny
 return 'transform="scale(.01)" d="'+''.join(tokens)+'"'
new=re.sub(r'd="([ML][^"]+)"',convert,old)
assert old.count('<path')==new.count('<path')
p.write_text(new,encoding='utf8')
page=r/'index.html';s=page.read_bytes().decode('utf8');assert s.count(old)==1;s=s.replace(old,new,1);page.write_bytes(s.encode('utf8'))
meta=r/'datos/territorio/cobertura-metadatos.json';m=json.loads(meta.read_text(encoding='utf8'));m['optimizacion_svg']='Coordenadas relativas enteras en centésimas de unidad SVG, con transform scale(.01); conserva exactamente las posiciones redondeadas originales.';m['bytes_svg']=len(new.encode('utf8'));meta.write_text(json.dumps(m,ensure_ascii=False,separators=(',',':')),encoding='utf8')
print({'bytes_antes':len(old.encode('utf8')),'bytes_despues':len(new.encode('utf8'))})
