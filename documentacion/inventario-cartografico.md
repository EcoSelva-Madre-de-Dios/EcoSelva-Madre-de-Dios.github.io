# Inventario cartográfico previo al refinamiento

Inspección de solo lectura de las copias web disponibles. No hay shapefiles originales en el repositorio: la validez de los originales no puede certificarse con estas copias. No se reproyectó, reparó, simplificó ni sustituyó ninguna geometría.

| Capa web | Elementos | Geometría | CRS web | CRS de origen documentado | Fecha |
|---|---:|---|---|---|---|
| datos/conservacion/anp.geojson | 6 | Polygon, MultiPolygon | EPSG:4326 | EPSG:4326 | No expuesta por el servicio |
| datos/territorio/cobertura-vegetal.geojson | 27 | MultiPolygon | EPSG:4326 | EPSG:32718 | Mapa Nacional de Cobertura Vegetal (2015) |
| datos/territorio/distritos.geojson | 11 | Polygon | EPSG:4326 | EPSG:32719 | Sin documentar |
| datos/territorio/limite.geojson | 1 | Polygon | EPSG:4326 | EPSG:32719 | Sin documentar |
| datos/territorio/masas-agua.geojson | 174 | Polygon, MultiPolygon | EPSG:4326 | EPSG:32719 | 2020-01-27 |
| datos/territorio/provincias.geojson | 3 | Polygon | EPSG:4326 | EPSG:32719 | Sin documentar |
| datos/territorio/rios.geojson | 6 | MultiLineString | EPSG:4326 | EPSG:32719 | Sin documentar |

## datos/conservacion/anp.geojson

Fuente: SERNANP. Escala: Sin documentar.
Extensión (orden x/y): `[-72.417168, -13.397897, -68.712295, -9.906202]`. Unidades: ['degree', 'degree'].
Campos: `id, codigo, nombre, categoria, departamentos, total_ha, mdd_ha`.
Nulos por campo: `{}`. Multipartes: 1; vacías: 0; inválidas: 0; duplicados geométricos: 0.
SHA-256: `5f44b3395ec32d140f03aa15efafb1f5f563011bc3a1491cf1be3cbbf255cb54`.
- Escala de origen no documentada.

## datos/territorio/cobertura-vegetal.geojson

Fuente: Ministerio del Ambiente (MINAM). Escala: 1:100 000 según memoria descriptiva; escala del shapefile no indicada en XML.
Extensión (orden x/y): `[-72.408369762171, -13.397816528507612, -68.65227910545926, -9.86715624626472]`. Unidades: ['degree', 'degree'].
Campos: `codigo_original, categoria_original, categoria_ecoselva, fuente, fecha, escala, clasificacion_campo, codigo_campo, procesamiento, id, color, icon, fid_originales`.
Nulos por campo: `{}`. Multipartes: 27; vacías: 0; inválidas: 8; duplicados geométricos: 0.
SHA-256: `985f6cc8d498c0c5233b395c98b910ec565c972c98e7c214c05b95a51b5caebc`.
- Geometrías inválidas detectadas en la copia inspeccionada; no se repararon.
- CobVeg2013 es el nombre original del campo; 2015 corresponde a la publicación y no a una fecha uniforme de observación. No representa el estado de 2026.
- Se conservan las 27 clases que intersectan el departamento, incluidas las no forestales y clases de agua propias de esta cobertura de 2015; no sustituyen las capas de Ríos ni Humedales.
- Índice 0: Self-intersection[-69.6118927061616 -11.5275670609649].
- Índice 1: Self-intersection[-71.3257231662825 -12.4537966170374].
- Índice 5: Self-intersection[-69.8871622383425 -11.6703640430558].
- Índice 6: Self-intersection[-69.3222258872307 -11.5459386595149].
- Índice 7: Self-intersection[-69.1287321948169 -12.543116625375].
- Índice 14: Self-intersection[-69.147681887586 -12.3580857915964].
- Índice 17: Self-intersection[-69.4372602188694 -11.6775710679078].
- Índice 24: Self-intersection[-69.4070821465501 -11.6791439934247].

## datos/territorio/distritos.geojson

Fuente: Geodatabase aportada; generador no documentado en estas capas. Escala: Sin documentar.
Extensión (orden x/y): `[-72.408309, -13.397817, -68.652015, -9.867156]`. Unidades: ['degree', 'degree'].
Campos: `distrito_, provincia, region, situac_lim, validado`.
Nulos por campo: `{}`. Multipartes: 0; vacías: 0; inválidas: 0; duplicados geométricos: 0.
SHA-256: `c70433638a268cf44bfdf36d4162c819e4eaf8fc72604e5eb2cf5c540160db30`.
- Fecha de observación/versión no documentada.
- Escala de origen no documentada.
- No se usa Bosques_de_Producción_Permanente como cobertura forestal.
- MasaAgua no equivale a una cobertura exhaustiva de humedales.
- Las fechas de RioPrin no se atribuyen a los trazados de RIos_Principales o Hidrografia_mdd.
- Contorno educativo referencial; atributos distritales conservan situaciones de límite definidas e indefinidas.

## datos/territorio/limite.geojson

Fuente: Geodatabase aportada; generador no documentado en estas capas. Escala: Sin documentar.
Extensión (orden x/y): `[-72.40837, -13.397817, -68.651489, -9.867156]`. Unidades: ['degree', 'degree'].
Campos: `capa, distritos`.
Nulos por campo: `{}`. Multipartes: 0; vacías: 0; inválidas: 0; duplicados geométricos: 0.
SHA-256: `1f1fe81a52358912d400f45984ac46d6d60752afbf959036d11de07ddcef4b0c`.
- Fecha de observación/versión no documentada.
- Escala de origen no documentada.
- No se usa Bosques_de_Producción_Permanente como cobertura forestal.
- MasaAgua no equivale a una cobertura exhaustiva de humedales.
- Las fechas de RioPrin no se atribuyen a los trazados de RIos_Principales o Hidrografia_mdd.
- Contorno educativo referencial; atributos distritales conservan situaciones de límite definidas e indefinidas.

## datos/territorio/masas-agua.geojson

Fuente: Gobierno Regional Madre de Dios. Escala: Sin documentar.
Extensión (orden x/y): `[-72.073751, -13.139814, -68.718428, -11.125435]`. Unidades: ['degree', 'degree'].
Campos: `id, nombre, tipo, FUENTE, FECREG, TIPMAG, NOMMAG`.
Nulos por campo: `{'nombre': 162, 'NOMMAG': 162}`. Multipartes: 7; vacías: 0; inválidas: 0; duplicados geométricos: 0.
SHA-256: `94670d0d39b5c5a7765c191dae7362bf78758e3f65c3668fce4b88a7aedf40be`.
- Escala de origen no documentada.
- MasaAgua no es un inventario exhaustivo de humedales.

## datos/territorio/provincias.geojson

Fuente: Geodatabase aportada; generador no documentado en estas capas. Escala: Sin documentar.
Extensión (orden x/y): `[-72.40830893933074, -13.397816528507612, -68.65148884484084, -9.867156232123332]`. Unidades: ['degree', 'degree'].
Campos: `provincia, distritos_fid, etiqueta_punto_utm`.
Nulos por campo: `{}`. Multipartes: 0; vacías: 0; inválidas: 0; duplicados geométricos: 0.
SHA-256: `b08320925fefa6614c04d516838a3baecf17c52e4b9da35bcc0336cc7148d8e5`.
- Fecha de observación/versión no documentada.
- Escala de origen no documentada.
- No se usa Bosques_de_Producción_Permanente como cobertura forestal.
- MasaAgua no equivale a una cobertura exhaustiva de humedales.
- Las fechas de RioPrin no se atribuyen a los trazados de RIos_Principales o Hidrografia_mdd.
- Contorno educativo referencial; atributos distritales conservan situaciones de límite definidas e indefinidas.

## datos/territorio/rios.geojson

Fuente: Geodatabase aportada; generador no documentado en estas capas. Escala: Sin documentar.
Extensión (orden x/y): `[-72.226114, -13.344398, -68.652831, -11.033356]`. Unidades: ['degree', 'degree'].
Campos: `id, nombre, capas_trazado, fecha_trazado, metadatos_RioPrin`.
Nulos por campo: `{'fecha_trazado': 6}`. Multipartes: 6; vacías: 0; inválidas: 0; duplicados geométricos: 0.
SHA-256: `e3d3bc12a868f339955810717a0a1348e510e69ede4feca2ffdd5880dbfc3350`.
- Fecha de observación/versión no documentada.
- Escala de origen no documentada.
- No se usa Bosques_de_Producción_Permanente como cobertura forestal.
- MasaAgua no equivale a una cobertura exhaustiva de humedales.
- Las fechas de RioPrin no se atribuyen a los trazados de RIos_Principales o Hidrografia_mdd.
- Contorno educativo referencial; atributos distritales conservan situaciones de límite definidas e indefinidas.

## Archivos auxiliares disponibles

Los SVG son derivados de visualización, no fuentes nuevas. Su CRS y transformación constan en los metadatos. Los JSON de fichas y categorías conservan atributos y textos; no son capas adicionales. El XML de MINAM documenta el shapefile cuyo original no está presente.

| Archivo | Bytes | Papel |
|---|---:|---|
| datos/territorio/CobVeg_180615.shp.xml | 24387 | Metadatos de proveedor |
| datos/territorio/bosques-capa-config.json | 1147 | Metadatos / atributos / contenido del visor |
| datos/territorio/capas-adicionales-metadatos.json | 1710 | Metadatos / atributos / contenido del visor |
| datos/territorio/capas-adicionales.svg | 129143 | Visualización SVG |
| datos/territorio/cobertura-bosques.svg | 2063332 | Visualización SVG |
| datos/territorio/cobertura-categorias.json | 15952 | Metadatos / atributos / contenido del visor |
| datos/territorio/cobertura-descripciones.json | 12788 | Metadatos / atributos / contenido del visor |
| datos/territorio/cobertura-fichas.json | 45992 | Metadatos / atributos / contenido del visor |
| datos/territorio/cobertura-metadatos.json | 2294 | Metadatos / atributos / contenido del visor |
| datos/territorio/cobertura-trazabilidad.json | 725903 | Metadatos / atributos / contenido del visor |
| datos/territorio/descripciones.json | 11361 | Metadatos / atributos / contenido del visor |
| datos/territorio/fichas-escenas.json | 75848 | Metadatos / atributos / contenido del visor |
| datos/territorio/fichas.json | 66066 | Metadatos / atributos / contenido del visor |
| datos/territorio/lectura.json | 5926 | Metadatos / atributos / contenido del visor |
| datos/territorio/mapa.svg | 2655544 | Visualización SVG |
| datos/territorio/metadatos.json | 629656 | Metadatos / atributos / contenido del visor |
| datos/territorio/presentacion-escenas.json | 645 | Metadatos / atributos / contenido del visor |
| datos/territorio/presentacion-profesional.json | 1058 | Metadatos / atributos / contenido del visor |
| datos/territorio/provincias-metadatos.json | 816 | Metadatos / atributos / contenido del visor |
| datos/territorio/referencia-contextual.json | 522 | Metadatos / atributos / contenido del visor |
| datos/territorio/registros-visor.json | 75849 | Metadatos / atributos / contenido del visor |
| datos/conservacion/areas.json | 26276 | Metadatos / atributos / contenido del visor |
| datos/conservacion/mapa.svg | 85891 | Visualización SVG |
| datos/conservacion/metadatos.json | 6465 | Metadatos / atributos / contenido del visor |

## Decisión de presentación

Conservar SVG: admite capas, zoom, desplazamiento, etiquetas por escala y detección de colisiones sin incorporar un motor externo. La presentación puede refinarse sin editar coordenadas ni valores oficiales.

Los errores encontrados se informan; no se corrigen silenciosamente. Las fechas de consulta e incorporación no son fechas de observación. MINAM 2015 es una publicación histórica; los límites distritales tienen limitaciones documentales. La capa de ANP usa otra base departamental IGN: no fusionar bases como si fueran equivalentes.

## Recepción de shapefiles nuevos

1. Guardar original y componentes sin cambios, con hash y documentación del proveedor.
2. Ejecutar este inventario y devolver CRS/EPSG, campos, geometrías, cantidad, fecha, fuente, escala, unidades y problemas antes de convertir o diseñar.
3. Comparar en un informe: **capa actual / capa nueva / diferencia / recomendación**. Registrar diferencias de fuente, fecha, CRS, atributos, resolución y geometría; no reemplazar automáticamente.
4. Después de la revisión, procesar una copia en CRS métrico apropiado y exportar una copia web. Documentar cada paso. Preservar atributos oficiales; rotular cualquier medida derivada como cálculo EcoSelva.
5. Si se simplifica, elegir tolerancias por capa y tamaño de entidad, medir cambio de área, forma y topología, y conservar el original. El inventario por sí solo nunca inicia este procesamiento.
