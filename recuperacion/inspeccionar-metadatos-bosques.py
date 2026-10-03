from pathlib import Path
import os,json,pyogrio,xml.etree.ElementTree as ET
p=Path(os.environ['TEMP'])/'ecoselva-cobertura/mapa_cobertura_vegetal_2015/CobVeg_180615.shp'
m,f,g,a=pyogrio.raw.read(p,columns=['CobVeg2013','Simbolo'],read_geometry=False,encoding='CP1252')
print(sorted(set(zip(a[0],a[1]))))
x=ET.parse(str(p)+'.xml')
for el in x.iter():
 if el.text and el.text.strip() and (el.tag in ['resTitle','idAbs','idCredit','rpOrgName','pubDate','rfDate','denominator','createDate','idPurp']):print(el.tag,el.text[:1000])
