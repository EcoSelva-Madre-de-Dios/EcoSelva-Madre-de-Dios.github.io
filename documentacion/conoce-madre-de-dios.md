# Conoce Madre de Dios · integración de fase 1

Revisión: 4 de octubre de 2026. La introducción territorial tiene seis módulos y conserva una sola implementación de `#explora-madre-de-dios`. `script.js`, `ventanas.js`, las hojas de estilo anteriores y todos los archivos de `datos/` permanecen intactos. Solo cambia la cabecera externa del mapa, además de su posición en el documento. “Todo está conectado” se conserva al final del nuevo recorrido; los contenidos científicos existentes siguen presentes.

## Datos y fuentes verificados

| Contenido | Fuente y alcance |
| --- | --- |
| 85 300,5 km² | INEI, Compendio Estadístico Madre de Dios 2024, cuadro 1.1, página impresa 11 / PDF 17. La nota indica información al **2023**; conservar la precisión de un decimal. |
| 3 provincias y 11 distritos | Mismo documento, cuadros 1.1 y 1.2. Organización política presentada en **2024**. |
| Distritos por provincia | INEI, cuadro 1.2: Tambopata (Tambopata, Inambari, Las Piedras, Laberinto); Manu (Manu, Fitzcarrald, Madre de Dios, Huepetuhe); Tahuamanu (Iñapari, Iberia, Tahuamanu). Los conteos 4, 4 y 3 corresponden a estas listas. |
| Capitales | Gobierno Regional de Madre de Dios, Plan de prevención y reducción del riesgo de desastres frente a incendios forestales, página impresa 4 / PDF 14: Puerto Maldonado, Salvación, Iñapari. Puerto Maldonado también es la capital departamental. |
| Ubicación y colindantes | Mismo plan, página impresa 2 / PDF 12. Norte: Ucayali/Brasil; oeste: Cusco/Ucayali; este: Brasil/Bolivia; sur: Cusco/Puno. El esquema de orientación no dibuja límites ni distancias. |
| Altitud | Mismo plan, página impresa 2 / PDF 12: rango citado de 176 m (Tambopata) a 3 967 m (cerro La Merced, Manu). El SVG del relieve es una ilustración conceptual, no un perfil topográfico medido. |
| Clima y ríos | Plan regional, páginas impresas 27–28 / PDF 37–38; clasificación basada en SENAMHI y diagnóstico hidrológico de ANA. INEI, cuadro 2.17, página impresa 21 / PDF 27, compila registros climatológicos de SENAMHI. No se presenta un pronóstico actual. |
| Historia del territorio y lengua | Ministerio de Cultura, BDPI, ficha Ese Eja: apartados Historia, Ámbitos territoriales y Lengua. La página no indica fecha de publicación; declarar esa ausencia. No generalizar las prácticas de un pueblo a todos los habitantes. |
| Creación del departamento | Congreso de la República, Ley N.º 1782, artículo 1 y promulgación del **26 de diciembre de 1912**, páginas 1 y 3 del documento original. No trasladar sus antiguos límites ni distritos al mapa actual. |
| Trabajo y conocimiento de castañeros | Thomas y colaboradores, artículo científico original publicado en 2017. Se enlaza a la ficha piloto existente, sin crear otra ficha. |

El compendio lleva edición **2024**, presentación de diciembre de 2024 y publicación en el portal de INEI del **30 de enero de 2025**. El plan regional se titula “al 2025”, pero su portada indica **Puerto Maldonado, agosto de 2020**: 2025 es el horizonte del plan, no el año de publicación ni del dato. Su superficie no se utiliza para sustituir la seleccionada de INEI.

Documentos originales:

- [INEI · Compendio 2024](https://www.gob.pe/institucion/inei/informes-publicaciones/6453865-compendio-estadistico-madre-de-dios-2024), [capítulos 1 al 4](https://cdn.www.gob.pe/uploads/document/file/7613488/6453865-compendio-madre-de-dios-2024-capitulo-1-al-4.pdf?v=1739224110).
- [GORE Madre de Dios · plan de agosto de 2020 con horizonte 2025](https://sigrid.cenepred.gob.pe/sigridv3/storage/biblioteca//10108_plan-de-prevencion-y-reduccion-del-riesgo-de-desastres-frente-a-incendios-forestales-region-madre-de-dios-2025.pdf).
- [Ministerio de Cultura · ficha Ese Eja](https://bdpi.cultura.gob.pe/pueblos/ese-eja).
- [Congreso · Ley N.º 1782](https://leyes.congreso.gob.pe/Documentos/Leyes/01782.pdf).
- [Thomas y colaboradores · 2017](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0183743).

## Presentación y conservación del mapa

`conoce.css` contiene estilos del mini atlas y de la cabecera externa reubicada. No cambia categorías, colores, geometrías, paneles, zoom, leyenda ni controles cartográficos. `conoce.js` mejora los `<details>` nuevos con un único `<dialog>` para provincias y referencias; reutiliza la presentación de las ventanas de fuentes, conserva foco/teclado/cierre y ofrece una ficha inferior en móvil. Los contenidos y sus enlaces también se consultan sin JavaScript. Los límites, la geografía y los dos casos de personas usan detalles desplegables: se muestran abiertos al cargar en escritorio y cerrados en móvil, conservando después la elección del lector.

El enlace “Explorar los ríos en el mapa” navega al módulo 03. Mantiene el modo que haya elegido el lector: no fuerza el cambio de categoría ni interviene en el JavaScript existente.

El localizador pequeño `images/conoce-peru.svg` utiliza [Natural Earth Admin 1, escala 1:10 millones, versión 5.1.1](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/), [datos originales](https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip), de [dominio público](https://www.naturalearthdata.com/about/terms-of-use/). Se seleccionaron las geometrías del Perú y se simplificaron para una ubicación general, con Madre de Dios resaltado. No se utilizó para regenerar el mapa interactivo ni para calcular cifras. Los esquemas de límites y relieve son SVG educativos originales de EcoSelva.

Antes de publicar, comprobar estructura, enlaces, IDs, las tres capas, referencias provinciales, selección, tooltips, zoom, reset, fuentes, menú móvil, foco y lectura sin JavaScript. Comparar los archivos cartográficos, JSON y scripts previos con la revisión anterior. GitHub Actions ejecuta la verificación de integración y comprueba la sintaxis de `conoce.js` antes de desplegar.
