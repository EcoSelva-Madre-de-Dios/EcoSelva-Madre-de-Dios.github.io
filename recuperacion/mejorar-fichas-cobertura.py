from pathlib import Path
import json,re,shutil,os,hashlib
r=Path.cwd(); b=r/'recuperacion/antes-de-fichas-educativas'; b.mkdir(exist_ok=True)
for n in ['index.html','style.css','script.js']:shutil.copy2(r/n,b/n)
entries={
'Ano-ba':('Superficies amazónicas que, en la cartografía de 2015, no presentaban bosque natural. Incluyen terrenos desboscados transformados en cultivos o pastos y áreas con vegetación secundaria, conocida como purma, que permanecían en descanso dentro del ciclo agropecuario.',87,'4.3'),
'Bca':('Bosque que crece sobre colinas de mayor elevación relativa y pendientes pronunciadas. Estas formas del terreno se originaron por la erosión de antiguas acumulaciones de sedimentos, y se distinguen de las colinas bajas por su relieve más elevado.',36,'3.1.11'),
'Bca-pa':('Cobertura de colinas altas donde los árboles se combinan con cañas de bambú conocidas como paca. Según la memoria descriptiva, la vegetación arbórea predomina sobre el bambú, por lo que esta unidad se diferencia de un pacal.',40,'3.1.15'),
'Bcb':('Bosque desarrollado sobre colinas bajas y lomadas de la Amazonía. La clasificación reúne ambas formas del terreno porque la escala y las imágenes utilizadas no permitían separarlas. Son relieves modelados por distintos grados de erosión de antiguos depósitos fluviales.',35,'3.1.10'),
'Bcb-cas':('Bosque de colinas bajas en el que destacan grandes árboles de castaña entre la vegetación arbórea. La memoria lo diferencia por esa composición vegetal y por el relieve donde se desarrolla, dentro del conjunto de bosques amazónicos con castaña.',40,'3.1.16'),
'Bcb-pa':('Bosque de colinas bajas que combina árboles con bambúes del género Guadua, llamados paca. En esta cobertura los árboles mantienen el predominio; la presencia de cañas la distingue del bosque de colina baja sin esa asociación cartográfica.',40,'3.1.15'),
'Bcb-Shi':('Bosque de colinas bajas caracterizado por árboles dominantes de shiringa, también llamados jebe o caucho. La memoria identifica especies del género Hevea como rasgo distintivo de esta cobertura, que conserva una vegetación boscosa asociada al relieve de colinas.',41,'3.1.17'),
'Bllm':('Bosque de las llanuras que rodean a los ríos amazónicos de recorrido sinuoso. Las crecidas transportan y depositan sedimentos, formando franjas más elevadas y depresiones entre ellas. Esa dinámica fluvial da lugar a diferentes etapas de desarrollo de la vegetación.',28,'3.1.3'),
'Bm':('Bosque que ocupa laderas montañosas de la Amazonía, hasta la transición con el bosque basimontano. La categoría distingue este relieve de las terrazas y colinas, y reúne comunidades de árboles que se distribuyen en terrenos con pendientes marcadas.',38,'3.1.12'),
'Bm-al':('Bosque situado en la parte superior de la Yunga, por encima del bosque montano. La memoria lo ubica sobre los tres mil metros de altitud y hasta el límite con las formaciones abiertas de pajonal, jalca o páramo.',49,'3.2.9'),
'Bm-ba':('Bosque de las laderas inferiores de la Yunga, en el flanco oriental de los Andes. Se desarrolla sobre terrenos inclinados atravesados por quebradas. Sus árboles disminuyen de altura hacia el límite superior de esta franja de montaña.',44,'3.2.4'),
'Bm-ba-pa':('Bosque de laderas montañosas de la franja basimontana donde los árboles se asocian notablemente con cañas de Guadua, conocidas como paca. La memoria describe pendientes de moderadas a muy pronunciadas y una combinación de vegetación arbórea y bambú.',46,'3.2.5'),
'Bm-pa':('Bosque de montaña con presencia de bambúes conocidos como paca. Forma parte del conjunto de bosques con Guadua que distingue la memoria descriptiva: predominan los árboles sobre las cañas, a diferencia de los pacales dominados por bambú.',40,'3.1.15'),
'Bm-mo':('Bosque de la franja intermedia de la Yunga, por encima del basimontano. Ocupa laderas empinadas del flanco oriental andino, donde las lluvias favorecen la formación de quebradas. La altura de los árboles disminuye al avanzar hacia su límite superior.',46,'3.2.6'),
'Bta':('Bosque sobre plataformas formadas por antiguas acumulaciones fluviales o por procesos tectónicos. Las terrazas altas pueden ser planas, onduladas o estar cortadas por cauces producidos por la erosión de las lluvias, y algunas se encuentran alejadas de los ríos.',34,'3.1.9'),
'Bta-cas':('Bosque de antiguas terrazas aluviales donde sobresalen árboles de castaña entre la cubierta boscosa. Esta categoría combina una forma del terreno, la terraza alta, con una composición vegetal distintiva reconocida en la memoria de los bosques amazónicos con castaña.',40,'3.1.16'),
'Bta-pa':('Bosque de terrazas altas que incorpora bambúes o cañas conocidas como paca entre sus árboles. La clasificación considera esta asociación por separado, aunque los árboles siguen predominando sobre el bambú; no corresponde a un pacal dominado por cañas.',40,'3.1.15'),
'Btb':('Bosque de terrazas de la llanura aluvial amazónica. La cartografía reúne terrazas recientes que pueden inundarse y otras más antiguas no inundables, porque la escala de trabajo no permitió distinguirlas. Por eso, esta categoría no indica una única condición de inundación.',29,'3.1.4'),
'Btb-cas':('Cobertura boscosa de terrazas bajas que forma parte de los bosques con castaña descritos por MINAM. Se distingue por la presencia destacada de este árbol y por ocupar superficies aluviales bajas, frente a las categorías de terraza alta y colina.',40,'3.1.16'),
'Btb-pa':('Bosque asentado en terrazas bajas donde se encuentran cañas de bambú conocidas como paca. La memoria agrupa esta asociación entre los bosques con Guadua: los árboles predominan sobre las cañas, que acompañan a la vegetación arbórea en esta forma del terreno.',40,'3.1.15'),
'Bi-pal':('Bosque inundable de la llanura aluvial amazónica, conocido como aguajal, en el que predominan palmeras. La memoria describe inundaciones prolongadas y suelos de drenaje deficiente. Junto a las palmeras también pueden encontrarse árboles y arbustos propios de ambientes inundados.',25,'3.1.1'),
'L/Co':('Categoría de cuerpos de agua que reúne lagunas, lagos y cochas en la cobertura nacional. La memoria los incluye entre las otras coberturas sin vegetación. Su identificación cartográfica no ofrece, por sí sola, una descripción de cada ambiente acuático.',89,'5'),
'Pac':('Formación vegetal en la que predominan los bambúes conocidos como paca sobre los árboles y otras plantas. Puede ocupar terrazas, colinas o montañas amazónicas. Esa dominancia de las cañas la diferencia de los bosques con paca, donde predominan los árboles.',39,'3.1.14'),
'Pj':('Cobertura principalmente herbácea de las zonas altas de los Andes, sobre terrenos de pendientes diversas. Por la escala del mapa, esta unidad reúne formaciones diferentes: hierbas en manojos, vegetación baja semejante a un césped y sectores con arbustos llamados tolares.',75,'3.4.7'),
'R':('Clase cartográfica que identifica ríos entre las otras coberturas sin vegetación del mapa nacional. Se conserva como una unidad distinta de los bosques. La memoria no aporta en esta categoría una caracterización individual de los cursos de agua representados.',89,'5'),
'Sahi-pal':('Sabana de vegetación herbácea donde emergen palmeras dispersas, descrita para las Pampas del Heath. La memoria señala que se inunda durante la temporada lluviosa y se seca en el periodo seco; las palmeras también se concentran junto a cursos de agua.',31,'3.1.7'),
'Is':('Vegetación que ocupa superficies recientes y planas en los cauces de ríos amazónicos, afectadas por inundaciones estacionales. Incluye distintas etapas de desarrollo: hierbas colonizadoras, franjas de arbustos y cañas, y comunidades de árboles que se establecen sobre esas superficies.',31,'3.1.6')}
source='https://sinia.minam.gob.pe/sites/default/files/archivos/public/docs/memoria_descriptiva_cobertura_vegetal_2.pdf'
cats=json.loads((r/'datos/territorio/cobertura-categorias.json').read_text(encoding='utf8'))
assert {c['codigo_original'] for c in cats}==set(entries)
assert len({v[0] for v in entries.values()})==27
for code,(text,page,section) in entries.items():assert 30<=len(text.split())<=55,(code,len(text.split()))
d={'fuente':{'institucion':'Ministerio del Ambiente (MINAM)','publicacion':'Mapa Nacional de Cobertura Vegetal — Memoria descriptiva','anio':2015,'url':source,'sha256_pdf_consultado':hashlib.sha256(Path(os.environ['TEMP'],'ecoselva-memoria-2015.pdf').read_bytes()).hexdigest(),'nota':'Síntesis educativas; las categorías con paca y castaña comparten secciones oficiales. Las clases de agua permanecen ocultas en Bosques.'},'categorias':{c['id']:{'descripcion':entries[c['codigo_original']][0],'pagina':entries[c['codigo_original']][1],'seccion':entries[c['codigo_original']][2],'codigo_original':c['codigo_original'],'categoria_original':c['categoria_original']} for c in cats}}
(r/'datos/territorio/cobertura-descripciones.json').write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf8')
p=r/'index.html';s=p.read_bytes().decode('utf8');anchor='<script type="application/json" id="selva-territorio-cobertura-datos">';assert anchor in s
s=s.replace(anchor,'<script type="application/json" id="selva-territorio-descripciones">'+json.dumps(d,ensure_ascii=False,separators=(',',':'))+'</script>\n'+anchor,1);p.write_bytes(s.encode('utf8'))
p=r/'script.js';s=p.read_bytes().decode('utf8');anchor='        Object.assign(topics, forestData.topics);';s=s.replace(anchor,anchor+'\n        const forestDescriptions = JSON.parse(document.getElementById("selva-territorio-descripciones")?.textContent || \'{"categorias":{}}\');',1)
s=s.replace('const text = node("p", "", topic.mode === "bosques" ? topic.text','const education = topic.mode === "bosques" ? forestDescriptions.categorias[key] : null;\n            const text = node("p", "", topic.mode === "bosques" ? (education?.descripcion || topic.text)',1)
s=s.replace('            if (primary.childElementCount) card.append(primary);','''            if (education) {
                const context = node("div", "selva-territorio-ficha-contexto");
                context.append(node("p", "", "Clasificación cartográfica: MINAM · 2015"), node("p", "", "No representa necesariamente el estado actual.")); card.append(context);
                const reference = node("a", "", "Memoria descriptiva · sección " + education.seccion + ", página " + education.pagina + " ↗");
                reference.href = forestDescriptions.fuente.url + "#page=" + education.pagina; reference.target = "_blank"; reference.rel = "noopener noreferrer"; sources.append(reference);
            } else if (primary.childElementCount) card.append(primary);''',1)
s=s.replace('link.href = topic.source; link.target = "_blank"; link.rel = "noopener noreferrer"; card.append(link);','link.href = topic.source; link.target = "_blank"; link.rel = "noopener noreferrer";\n                if (education) sources.append(link); else card.append(link);',1)
p.write_bytes(s.encode('utf8'))
with (r/'style.css').open('ab') as f:f.write('''
/* Contexto histórico de las fichas educativas de Bosques. */
#explora-madre-de-dios .selva-territorio-ficha-contexto { margin: 13px 0; padding-top: 10px; border-top: 1px solid #dce4de; }
#explora-madre-de-dios .selva-territorio-ficha-contexto p { margin: 3px 0; font-size: 10px; line-height: 1.5; }
#explora-madre-de-dios .selva-territorio-ficha-contexto p:first-child { font-weight: 600; color: #405d4d; }
#explora-madre-de-dios .selva-territorio-ficha-contexto ~ .selva-territorio-registro > a { display: block; margin-top: 10px; }
'''.encode('utf8'))
print('27 síntesis documentadas; 30–55 palabras; fichas y datos originales conservados.')
