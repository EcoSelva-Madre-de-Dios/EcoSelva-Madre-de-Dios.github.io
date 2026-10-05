# Control de diseño y adaptación a pantallas

Revisión: 5 de octubre de 2026. Base: `0d9b316`.

## Alcance

Se ajusta la presentación de Inicio, Castaña, Áreas Protegidas, Historia y
Fuentes y metodología. Conoce Madre de Dios conserva sus módulos dentro de
Inicio. La fotografía y el título de la portada permanecen iguales.

`ecoselva.css` concentra el sistema compartido, sin sustituir las hojas
existentes ni añadir un framework. `ecoselva.js` completa el recorrido de
Tab y Mayús+Tab dentro de las ventanas que lo necesitaban; respeta los
controladores existentes de apertura, cierre y retorno del foco.

La única ampliación en una lógica anterior es el bloqueo y la restauración
del desplazamiento de fondo del glosario de Castaña. El flujo automático
de GitHub Actions también comprueba la sintaxis del nuevo JavaScript.

## Sistema visual

| Uso | Medida |
| --- | --- |
| Marco máximo de escritorio | 1440 px |
| Marco amplio de portátil | 1320 px |
| Contenido de referencia | 1180 px |
| Lectura larga | 760 px |
| Introducciones breves | 640 px |
| Márgenes de móvil | 20 px |
| Márgenes de tableta | 28 px |
| Márgenes generales | `clamp(20px, 4vw, 72px)` |
| Radios | 6, 10, 16 y 24 px |
| Espaciado | 8, 12, 16, 24, 32, 48, 64, 88 y 120 px |
| Transiciones breves | 180 y 220 ms |

Se mantienen Manrope para títulos e Inter para lectura, con fuentes de
respaldo. Los colores compartidos proceden de la paleta EcoSelva. Arena y
tierra conservan su papel decorativo; los enlaces sobre fondos claros
utilizan colores con contraste suficiente.

Las portadas, mapas, galerías y cifras aprovechan el ancho disponible;
las explicaciones largas tienen su propia medida de lectura. Las historias
usan fotografías en proporción 4:3. La fotografía de Castaña conserva la
proporción de su archivo y muestra el crédito completo.

Fauna presenta cuatro columnas en escritorio y una distribución 2 × 2 en
tableta y móvil. Flora mantiene separadas las dos cifras documentadas y
las dos líneas en revisión: el diseño no convierte estas últimas en cifras
verificadas. Los mapas pasan a una columna en tableta y móvil.

Las ventanas editoriales ocupan hasta 1040 px. Las fuentes utilizan un
panel lateral de 420–540 px en escritorio. En móvil se presentan como
hojas inferiores con un máximo del 90 % de la altura disponible. La
cabecera y el cierre permanecen visibles durante la lectura y hay un solo
contenedor vertical de desplazamiento.

## Matriz de comprobación

Chromium 153, con navegación real, capturas y comprobaciones automáticas.
Cada fila comprende las cinco páginas públicas: 50 combinaciones.

| Pantalla | Inicio | Castaña | Áreas protegidas | Historia | Metodología |
| --- | --- | --- | --- | --- | --- |
| 1366 × 768 | Correcto | Correcto | Correcto | Correcto | Correcto |
| 1440 × 900 | Correcto | Correcto | Correcto | Correcto | Correcto |
| 1536 × 864 | Correcto | Correcto | Correcto | Correcto | Correcto |
| 1920 × 1080 | Correcto | Correcto | Correcto | Correcto | Correcto |
| 768 × 1024 | Correcto | Correcto | Correcto | Correcto | Correcto |
| 820 × 1180 | Correcto | Correcto | Correcto | Correcto | Correcto |
| 1024 × 768 | Correcto | Correcto | Correcto | Correcto | Correcto |
| 360 × 800 | Correcto | Correcto | Correcto | Correcto | Correcto |
| 390 × 844 | Correcto | Correcto | Correcto | Correcto | Correcto |
| 412 × 915 | Correcto | Correcto | Correcto | Correcto | Correcto |

Se comprobó ausencia de desplazamiento horizontal del documento, errores
de JavaScript y recursos locales faltantes, antes y después de interactuar.
Las tablas y filtros conservan el desplazamiento dentro de su componente.

Se realizaron 103 aperturas de ventanas en esta matriz: Escape, cierre,
retorno del foco, recorrido de teclado, cabecera fija y bloqueo del fondo.
También se comprobaron las fuentes anidadas de Áreas Protegidas, sus seis
áreas, categorías, fichas y las dos métricas de superficie; las pestañas
de biodiversidad; los tres modos del mapa territorial, zoom, provincias y
fuentes; las fichas provinciales; el glosario; los filtros de Historia y
los detalles nativos de Metodología.

En una comprobación complementaria de 390, 820 y 1920 px se recorrieron
las seis historias, las dos categorías activas de Flora, las cuatro
categorías de Fauna y sus doce fichas de especies. El mapa conserva los
174 registros de humedales: selección completa, filtros de lagunas y
pantanos, detalle del registro y resaltado de ríos con teclado.

axe-core no detectó infracciones en 15 auditorías de páginas y 31 de
ventanas bajo reglas WCAG A/AA. Son comprobaciones automáticas de los
estados revisados, no una certificación de accesibilidad. El menú
desplegado también se revisa en móvil, tableta y escritorio.

La preferencia de movimiento reducido mantiene pausado el video de
investigación. El formulario de contacto conserva su estado oculto y el
envío deshabilitado; sus campos ahora tienen etiquetas visibles cuando
se habilite el servicio correspondiente. Los accesos que ya estaban
deshabilitados siguen sin presentarse como acciones disponibles.

## Preservación

La comparación con la base confirma que las cinco páginas conservan todos
los textos anteriores, referencias e identificadores. Los cambios de
estructura se limitan a la composición, cabeceras, rutas de navegación,
etiquetas del formulario y barras de cierre.

Se conservaron intactos 81 archivos de datos, mapas, imágenes, videos y
lógica anterior. No se regeneró ni simplificó cartografía. El mapa de
Territorio conserva 249 trazados y 349 referencias `use`; el mapa de
conservación mantiene sus seis áreas.

SHA-256 de los mapas:

- `datos/territorio/mapa.svg`: `33cb546984c299170d71b3e2772a45c0d80bb2df779e6a5836acb7e32e55cad7`.
- `datos/conservacion/mapa.svg`: `7df2a8656ee547320c38695c078627d2c43ba57b0511a3e12ceb0e7219ea101d`.

El verificador del sitio confirma páginas, enlaces, indicadores/CSV,
Analytics y cartografía. La ficha generada y sus CSV continúan sincronizados
con los datos revisados. La publicación contiene 60 archivos necesarios;
las herramientas de prueba y sus dependencias quedan fuera de la web.
