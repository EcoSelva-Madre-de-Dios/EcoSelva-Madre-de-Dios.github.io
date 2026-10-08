# Control del refinamiento visual, cartográfico y UX

Revisión de interfaz: 7 de octubre de 2026. Las fechas científicas, de consulta y de publicación originales no se actualizan por un cambio de diseño.

## Orden y rigor

Primero se entregó el inventario de las siete capas GeoJSON disponibles, sus campos, CRS, fuente, fecha, extensión y problemas. Se registraron ocho geometrías inválidas en la copia web de cobertura; no se repararon ni se descartaron. No hay shapefiles originales adjuntos. Los nuevos archivos tendrán un inventario y un informe **actual / nueva / diferencia / recomendación** antes de convertir, estilizar o sustituir.

Los 37 archivos originales de `datos/` siguen idénticos al commit anterior. El modelo de seis ANP y el registro de 78 fuentes no cambian. No se recalculan ni sustituyen superficies, longitudes, porcentajes, categorías, valores oficiales o fechas. Continúan las advertencias MINAM 2015, fecha de observación no uniforme, escala documental distrital desconocida, referencia educativa y bases departamentales distintas.

## Presentación de mapas

Se conserva SVG. `cartografia.js` comparte etiquetas de tamaño estable en pantalla, halo de 2,5 px, prioridades y detección real de colisiones, y escala vinculada a la matriz SVG. Prioridad: selección, provincias, ríos, ANP, distritos, contexto. ANP y distritos añaden nombres al acercar; se ocultan etiquetas de menor prioridad que no caben. Los puntos interiores se calculan en copias UTM 19S; no se modifica ningún polígono.

Territorio separa cobertura, ANP y distritos por intención. Base inicial: 601 471 bytes frente a 2 655 544 bytes del mapa completo anterior (77,3 % menos). Cobertura: copia con exactamente los mismos atributos y coordenadas; se descarga al activar Bosques. ANP y distritos se descargan de forma independiente. Se mantiene el mapa original como alternativa sin JavaScript. El verificador compara coordenadas y atributos entre copias y originales antes de publicar.

La paleta de visualización distingue verdes, olivas, tonos tierra y agua. Los códigos y las categorías MINAM permanecen intactos. Como en el visor previo, la selección forestal ofrece 25 clases; las dos clases de agua de MINAM permanecen en las 27 geometrías originales y no sustituyen Ríos o MasaAgua. No se inventa una jerarquía hidrográfica: los cursos disponibles son la selección principal documentada, sin datos para clasificar caudal o anchura.

Límite departamental: 1,8 px; provincias: 1,2 px arcilla; distritos: 0,75 px discontinuos. ANP utiliza relleno leve y patrones/contornos según categoría, además de color. Territorio y ANP comparten tipografía, colores, selección, controles, fuentes y escala. Las leyendas muestran únicamente las capas/categorías activas. ANP conserva zoom/desplazamiento por teclado y arrastre; su escala se actualiza, con aproximación inherente al redondeo a 0,1 unidades de la barra original UTM. Los números identifican áreas, no accesos.

Desktop mantiene relación 70/30 y ANP usa visor 16:10. Móvil conserva selector antes del mapa, controles de 44 px y fichas accesibles. La leyenda de Territorio ocupa una fila completa después del mapa/panel y puede recorrerse con teclado. Ninguna ventana requiere dos mecanismos propios de bloqueo de scroll; se mantiene `ecoDialog` con retorno de foco.

## Diseño y recursos

Se aplican contenedores por función, sin reemplazo masivo de anchos: máximo 1440, amplio 1320, contenido 1180, lectura 68ch. Gutter desktop `clamp(22px, 5vw, 96px)`, tablet 32 y móvil 20. Fondo y menú pueden ocupar todo el ancho; el contenido conserva margen interior.

Diez microilustraciones generadas con la herramienta integrada image_gen, una por recurso, WebP transparente de 320×320 para uso visual de 64–112 px; 347 202 bytes en total, carga diferida. Prompt final de cada recurso en `microilustraciones-prompts.json`. Solo son decorativas, con alt vacío y aria-hidden; no sustituyen documentación científica o fotografías de un lugar. Controles permanecen lineales y símbolos cartográficos planos.

Inicio incluye composición conectada y subtemas de Ambiente horizontales con ilustraciones distintas y estado real de lectura. Flora combina cifras documentadas, explicación, ilustración y fuentes. Castaña tiene hero amplio, fotografía botánica completa en marco editorial, microidentidad, texto de lectura y evidencia/tablas amplias. Se refina el esquema de cinco etapas sin cambiar su significado ni asignar tiempos o probabilidades. Las fichas futuras tienen la plantilla común documentada.

## Fotografías y límites documentales

Se auditan 52 raster: 35 con uso HTML/CSS directo o en ventanas Fauna; archivo, tema, lugar, autor, fuente, licencia, URL, alt, ratio, dimensiones, duplicados y problemas constan en `auditoria-imagenes.json`. Las fotos verificadas de Manu, Collpa Colorado y jaguar conservan créditos. Guacamayo de Costa Rica y caimán de Brasil siguen explícitamente ilustrativos de la especie. No se asigna una ubicación local a imágenes genéricas ni se utiliza la misma selva para seis ANP.

Las licencias/procedencias incompletas de archivos aportados quedan pendientes de documentación, especialmente capturas satelitales, fondo, Tambopata, árbol de la tarjeta Conservación y Sobre EcoSelva. No se inventa proveedor de satélite ni autoría. Las copias originales permanecen archivadas. La fotografía principal de castaña conserva crédito y advertencia sobre la parte reconstruida.

## Validación

Ocho páginas a 1366×768, 1440×900, 1536×864, 1920×1080, 2560×1440, 768×1024, 390×844 y 412×915: sin desbordes, con márgenes, etiquetas entre 9,5–14 px sin colisiones, escala comprobada contra su transformación y carga diferida comprobada mediante peticiones de red. Se verifican selección, 27 geometrías de cobertura, 11 distritos, seis ANP y leyendas al apagar capas.

La prueba completa de interacciones pasa también a 320, 390, 820 y 1440 px: navegación, Flora/Fauna, diálogos y foco, capas, alternativa sin JavaScript, carga lenta/fallida, reintento y selección previa a descarga. axe verifica WCAG A/AA en páginas, ventanas y estados seleccionados. No se detectan errores JavaScript ni recursos locales faltantes en esos recorridos. La comprobación de colisiones es complementaria al inventario; no certifica precisión de fuentes originales ausentes.

Comandos: `python herramientas/actualizar_sitio.py`, `python herramientas/verificar_sitio.py`, pruebas opcionales `node herramientas/verificar_interacciones.cjs` y `node herramientas/verificar_atlas.cjs` (requieren Playwright y axe en entorno temporal). La publicación usa GitHub Actions y versiones de assets para reflejar automáticamente lo guardado en main.
