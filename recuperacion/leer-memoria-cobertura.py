from pypdf import PdfReader
from pathlib import Path
import os
r=PdfReader(Path(os.environ['TEMP'])/'ecoselva-memoria-2015.pdf')
p=Path(os.environ['TEMP'])/'ecoselva-memoria-2015.txt'
p.write_text('\n'.join(f'\n=== PDF {i+1} ===\n'+page.extract_text() for i,page in enumerate(r.pages)),encoding='utf8')
print('Páginas:',len(r.pages))
for i,page in enumerate(r.pages):
 if i>12:
  t=page.extract_text()
  if any(s in t for s in ['Bosque de colina','Bosque de terraza','Bosque de montaña','Sabana hidrof','Pacal (','Pajonal andino','Vegetación de isla','no bosque amaz']):print(i+1,t[:250].replace('\n',' '))
