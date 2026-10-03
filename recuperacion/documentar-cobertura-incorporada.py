from pathlib import Path
import json,shutil
r=Path.cwd();p=r/'datos/territorio/bosques-capa-config.json';shutil.copy2(p,r/'recuperacion/antes-de-cobertura-real/bosques-capa-config.json')
m=json.loads(p.read_text(encoding='utf8'));m.update({'estado':'incorporada','capa':'CobVeg_180615','fuente':'Ministerio del Ambiente (MINAM)','anio_fuente':2015,'escala':'1:100 000 según memoria descriptiva','procesamiento':'Recorte departamental y reproyección a EPSG:32719; disolución por categoría y simplificación de hasta 65 m, reducida en categorías pequeñas; GeoJSON EPSG:4326; SVG con coordenadas relativas optimizadas.','atributo_categoria_original':'data-bosque-categoria','categorias':'cobertura-categorias.json','metadatos':'cobertura-metadatos.json','geojson':'cobertura-vegetal.geojson','svg':'cobertura-bosques.svg','opacidad_seleccion':0.90,'opacidad_otras':0.14,'regla':'Categoría EcoSelva idéntica al nombre oficial de CobVeg2013; código original Simbolo. No agrupar arbitrariamente a los cuatro tipos educativos.'})
p.write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf8')
q=json.loads((r/'datos/territorio/cobertura-trazabilidad.json').read_text(encoding='utf8'))
assert len(q)==27 and all(x['diferencia_area_relativa']<.01 for x in q)
print('27 categorías documentadas; diferencia de área tras simplificación <1% por categoría.')
