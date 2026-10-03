from pathlib import Path
import os,json,pyogrio
p=Path(os.environ['TEMP'])/'ecoselva-cobertura/mapa_cobertura_vegetal_2015/CobVeg_180615.shp'
for enc in ['UTF-8','CP1252','ISO-8859-1']:
 m,f,g,a=pyogrio.raw.read(p,columns=['CobVeg2013'],read_geometry=False,encoding=enc)
 print(enc,json.dumps(sorted(set(a[0]))[5:15],ensure_ascii=True))
