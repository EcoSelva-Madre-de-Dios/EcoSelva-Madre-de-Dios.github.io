from zipfile import ZipFile
from pathlib import Path
import os,pyogrio,json
z=ZipFile(r'C:\Users\USUARIO\Downloads\mapa_cobertura_vegetal_2015.zip')
print(z.namelist())
p=Path(os.environ['TEMP'])/'ecoselva-cobertura';p.mkdir(exist_ok=True);z.extractall(p)
for f in p.rglob('*.shp'):
 print(str(f)); print(json.dumps(pyogrio.read_info(f),default=str,ensure_ascii=False))
 meta,fids,g,fields=pyogrio.raw.read(f,read_geometry=False,return_fids=True)
 for name,col in zip(meta['fields'],fields):
  vals=sorted(set(str(v) for v in col));print(name,len(vals),vals[:100])
