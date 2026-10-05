# Ampliación de Bosques, ríos y humedales

Revisión: 5 de octubre de 2026. Módulo existente: `index.html#explora-madre-de-dios`, dentro de Conoce Madre de Dios.

La ampliación añade lectura educativa, actividades y contexto a las fichas del mapa. No crea una sección principal de Ecosistemas. El título, introducción, mapa base, leyendas, registros, fuentes y advertencias originales permanecen disponibles. Los estilos nuevos se limitan a este módulo mediante `territorio.css`.

## Contenidos y procedencia

- La clasificación cartográfica sigue siendo MINAM, Mapa Nacional de Cobertura Vegetal (2015). Se mantienen sus 27 categorías y las 25 opciones del panel de cobertura. Las tarjetas destacan unidades existentes; “tierra firme” y “ribereño” se explican como descriptores, no clases nuevas.
- Castañales enlaza la ficha existente de castaña y distingue manejo de sostenibilidad automática. Aguajales se fundamenta en MINAM e IIAP/Profonanpe (2021); no se asigna esta identidad a un registro anónimo de Pantano.
- Los seis ríos originales reciben contexto en `datos/territorio/lectura.json`, incorporado también al HTML. Tahuamanu y Acre se explican como cuencas transfronterizas documentadas por ANA (2009), sin inventar trazados para el visor.
- La dinámica fluvial enlaza el botón original de la historia de Lagos de herradura mediante `territorio-historia-lagos`. No existe una segunda historia ni una segunda ventana.
- Las relaciones de fauna y usos son explicaciones o ejemplos con ámbito declarado. Las geometrías de MasaAgua no contienen inventarios biológicos ni permiten deducir vegetación, calidad de agua o inundación actual.
- Cambios ambientales cita Geobosques/MINAM, SERNANP (2021), Gerson y colaboradores (2022) y CINCIA (2023; proyecto 2020–2022). No publica cifras actuales nuevas ni extiende resultados de estaciones a toda la región.
- Ciencia introduce campo, parcelas, inventarios, SIG, GPS, Sentinel-2, Landsat, NDVI y NBR. Las definiciones de sensores/índices remiten a Copernicus y USGS; no se presentan índices calculados ni monitoreo en tiempo real.
- La fotografía de castaña conserva autoría, edición, licencia y vínculo de Wikimedia Commons. Los dos SVG educativos son esquemas originales de EcoSelva sin escala, distinguidos expresamente de fotografías y datos cartográficos.

Publicaciones comprobadas para esta ampliación: memoria MINAM 2015, SHA-256 `b1be4e0cbdbeffa610b1b2386af95b15f66527053184a429414c40cee194fbad`; libro IIAP/Profonanpe 2021, SHA-256 `11a91b5bfb094ef6e78f2915f15bbda43c3a288d5dbeda1c684ccef98d8c6201`. Las referencias completas están en el bloque educativo de fuentes, con años y límites de alcance.

## Capas y funcionamiento

El SVG original `datos/territorio/mapa.svg` permanece intacto, al igual que todos los GeoJSON, metadatos y JSON cartográficos anteriores. Las pestañas conservan la selección de capa principal; las casillas permiten combinar o desactivar Bosques, Ríos y Humedales. Provincias mantiene su control. La vista inicial muestra Ríos y Provincias.

Distritos y ANP se cargan solo cuando se solicita una capa adicional, en una única descarga de `capas-adicionales.svg` (129 143 bytes). El SVG contiene 11 contornos distritales y seis contornos de ANP nacionales, sin relleno. No se inventan geometrías de ACP, carreteras, comunidades, deforestación o incendios; se explica que su incorporación necesita datos y procedencia verificables.

Los límites distritales reutilizan `distritos.geojson`, cuya entidad generadora, fecha de observación, escala y descarga originales no están documentadas. La incorporación de octubre de 2026 no se presenta como fecha de levantamiento. Las ANP reutilizan el GeoJSON de SERNANP ya incorporado a EcoSelva, consultado el 5 de octubre de 2026, con fecha de versión no expuesta por el servicio.

`herramientas/preparar_capas_territorio.py` reproyecta esos GeoJSON de EPSG:4326 a EPSG:32719 y utiliza el encuadre del mapa original. No realiza nueva simplificación, unión ni cálculo de áreas. Se redondea a 0,01 unidades SVG. El visor aplica el recorte del mapa existente; el límite IGN utilizado originalmente para ANP es distinto y esta diferencia se advierte en la metodología. Las referencias visuales no sustituyen demarcación ni documentación jurídica.

Para regenerar en un entorno con pyproj y Shapely: `python herramientas/preparar_capas_territorio.py`. Para comprobar la reproducibilidad: añadir `--check`. La publicación no instala estas dependencias: valida el SVG generado, sus cantidades, encuadre, CRS y hashes de origen con la herramienta estándar del sitio.

Las tarjetas educativas pueden solicitar la carga del mapa y seleccionar un ambiente aunque se acceda directamente a un capítulo por su enlace. Ante fallo de carga, el visor ofrece reintento; no muestra una capa adicional como activada si no se ha cargado. La selección, acercamiento, desplazamiento, filtros y ventana original de fuentes se conservan.

## Accesibilidad y conservación

La sección ampliada no depende de la animación de entrada que exige que el 12 % del módulo sea visible; con el nuevo contenido ese porcentaje podía dejarla invisible en celular. Se conserva visible y se mantienen las animaciones del resto del sitio. Los contrastes corregidos se limitan a controles y etiquetas de Territorio. Las actividades usan botones/selectores, mensajes de estado y reinicio; existe explicación alternativa sin JavaScript.

Se comprobó la igualdad literal de los tres bloques JSON cartográficos originales y del template de fichas previas. Fuera del módulo, los únicos cambios en index.html son el enlace a su CSS y el identificador del botón original de Lagos de herradura. Se conserva todo el JavaScript anterior fuera del controlador territorial; las actividades se inicializan únicamente si existe este módulo. Los demás HTML, estilos, scripts, datos, imágenes y el flujo de GitHub Actions permanecen intactos.

La verificación de publicación ahora comprueba la integración dentro del módulo existente, coincidencia de fichas HTML/JSON, accesos a categorías reales y procedencia de los contornos. Google Analytics conserva una sola instalación con ID `G-0KG7JC82NV`.

## Validación de la entrega

- Preparación del sitio público: 77 recursos necesarios, sin archivos de recuperación o herramientas; JavaScript y SVG válidos, enlaces y procedencia comprobados.
- 60 casos de regresión de las seis páginas, en diez tamaños entre 360 y 1920 px; 113 comprobaciones de ventanas, foco y desplazamiento. La página de inicio se repitió tras las correcciones de contraste. Sin errores de ejecución ni recursos locales faltantes.
- Ocho pruebas completas de Territorio entre 320 y 1920 px: selección de las 25 categorías, combinación/desactivación de capas, 11 distritos y seis ANP, selección por teclado, zoom, desplazamiento, filtros, fuentes y reutilización de la historia de lagos.
- Actividades comprobadas con respuestas correctas e incorrectas y reinicio; acceso directo a un capítulo antes de cargar el mapa; contenido educativo y soluciones disponibles sin JavaScript.
- Fallo simulado de descarga, reintento y desactivación durante la carga: sin contornos duplicados ni estados falsamente activados.
- Auditorías automáticas WCAG A/AA sin incidencias en los estados probados, incluida cada parte educativa visible en móvil, tablet y escritorio. Revisión de capturas y ausencia de desbordamiento horizontal.
