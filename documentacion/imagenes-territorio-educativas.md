# Inventario de las nuevas imágenes educativas

El mapa localizador y el esquema del río son SVG editables. La fotografía del río procede de Wikimedia Commons y la escena del aguajal es una ilustración conceptual generada con IA, identificada como tal en la página. No se modificaron capas científicas.

## Aguajal conceptual · EcoSelva

- Archivo: `images/aguajal-conceptual-ecoselva.jpg`.
- Modo de creación: herramienta integrada de generación de imágenes de OpenAI, a partir de texto.
- Prompt de trabajo: “Escena conceptual amplia, semirrealista y de apariencia fotográfica de un aguajal amazónico, con palmeras de aguaje y agua en el sotobosque; composición horizontal, luz natural, sin texto, logotipos ni marcas de agua.”
- Archivo generado: 1672 × 941 píxeles; copia web en JPEG de 1400 × 788 píxeles, calidad 88.
- Alcance: representa un aguajal amazónico de forma educativa. No documenta un sitio, una fecha ni un registro de campo y no se atribuye a Madre de Dios.
- El pie visible declara que es una ilustración conceptual generada con IA y que no corresponde a un lugar específico.
- SHA-256 de la copia web: `2800688808b84af5b86041871e0160da4004c17f5a2be608992a604cf690afd8`.

## Andreas König (andy_king50)

- Archivo: `images/rio-tambopata-andreas-koenig.jpg`.
- Autor: [Andreas König (andy_king50)](https://commons.wikimedia.org/wiki/User:Andy_king50).
- Fuente: [ficha original](https://commons.wikimedia.org/wiki/File:Tambopata_River_2107.jpg).
- Licencia de la imagen y su presentación: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
- Fecha y ubicación documentadas: 7 de noviembre de 2017; río Tambopata, aguas arriba de Infierno, Perú.
- Original: 4284 × 2680 píxeles.
- Copia local: 1280 × 801 píxeles; miniatura descargada de Wikimedia Commons.
- Archivo de descarga: https://thumb.wikimedia.org/wikipedia/commons/thumb/d/df/Tambopata_River_2107.jpg/1280px-Tambopata_River_2107.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail
- Presentación mediante CSS: 4:3, priorizando el agua y la orilla. No se modifica la fotografía almacenada.
- Alcance: Actividad de identificación del ambiente acuático. No permite determinar distribución de humedales ni representa una medición actual.
- El pie visible incluye autor, fuente, licencia, reducción y encuadre adaptado.
- SHA-256: `e47991ad59be6530bc6511e50864407832f2ec49de79dc67e1e39a450470bd74`.

## Ribera del río Manu · As578

- Archivo: `images/manu-ribera-as578.jpg`.
- Autor: [As578](https://en.wikipedia.org/wiki/User:As578).
- Fuente: [Manu riverbank](https://commons.wikimedia.org/wiki/File:Manu_riverbank.jpg), Wikimedia Commons.
- Licencia: [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5/).
- Lugar documentado por la fuente: ribera del río Manu, Parque Nacional del Manu, Madre de Dios, Perú.
- Copia local: 1280 × 874 píxeles; miniatura oficial de Wikimedia Commons.
- Presentación: cabecera recortada mediante CSS en la ficha territorial de la provincia de Manu; el archivo almacenado no se recorta.
- SHA-256: `d3e34eebc2dfcc441c1e442bcf028e15b6455cfdc4d154de3bfe4a4c8d5716f8`.

## Localizador territorial de Madre de Dios

- Archivo visible: `images/mapas/conoce-madre-de-dios-atlas.svg`.
- Ubicación nacional: conserva exactamente los dos atributos `d` de Natural Earth 5.1.1 usados en `images/conoce-peru.svg`, correspondientes a la base del Perú y Madre de Dios.
- Vista departamental: se genera desde `datos/territorio/provincias.geojson`, derivado de la capa `DISTRITOS_MDD` del archivo cartográfico entregado.
- Presentación: muestra Tahuamanu, Manu y Tambopata y sitúa Ucayali, Cusco, Puno, Brasil y Bolivia dentro de la misma lámina.
- Alcance: los límites se simplifican para la lectura a escala web. La entidad generadora y la escala de `DISTRITOS_MDD` no están documentadas; el mapa mantiene el aviso de referencia educativa sin valor demarcatorio.
- Generador: `herramientas/generar_mapa_conoce.py`.

## Esquema del río

Ilustración conceptual propia de EcoSelva, `images/territorio-rio.svg`. Conserva seis claves: cuenca, quebradas y afluentes, río principal, meandro, cocha y bosque ribereño. No tiene escala ni localización geográfica. Los números se dibujan en HTML sobre el SVG para mantener un tamaño legible en móviles. No se confunde con el mapa interactivo de capas.

## Imagen de observación de campo

Creada con IA, con aviso visible de su carácter ilustrativo. La herramienta, el prompt y el archivo final están documentados en [imagen-observacion-campo.md](imagen-observacion-campo.md).
