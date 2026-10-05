# Biodiversidad → Flora: productos, usos y conservación

Revisión editorial: 5 de octubre de 2026.

La ampliación está dentro de la pestaña Flora existente, en `index.html`. No se creó una sección principal «Productos del bosque» ni otra ficha de castaña. Territorio conserva sus explicaciones y recibe enlaces; Fauna, Ambiente, Ciencia y las demás páginas conservan su contenido. Los archivos anteriores de CSS y JavaScript, imágenes, mapa y datos de Territorio permanecen idénticos.

## Lectura e interacción

- Se mantienen introducción, contadores, categorías, seis especies destacadas, fuentes, fechas y acceso a la ficha de castaña.
- Se explican productos maderables y no maderables, alimentos, usos medicinales tradicionales y conocimientos culturales, con referencias próximas al contenido.
- «Del bosque al producto» permite elegir castaña, madera, aguaje, paca y planta medicinal. Cada recurso conserva siete etapas y el alcance de sus fuentes. La etapa de transformación medicinal no verificada lo indica explícitamente; no se propone una técnica de preparación.
- «¿Aprovechar significa destruir?» relaciona uso con intensidad, método, planificación, regeneración, monitoreo y condiciones ecológicas, sociales y económicas. No constituye una certificación ni una autorización de extracción.
- Los enlaces llevan a castañales, aguajales, pacales y otras coberturas ya explicadas en Territorio; también a Ambiente, Ciencia, la Biblioteca y los estudios de la ficha existente.
- Los selectores utilizan botones nativos con estado `aria-pressed`, y las tarjetas y referencias usan `details`/`summary`. Sin JavaScript se pueden leer los cinco recorridos completos y ampliar las referencias. Los enlaces a casos y fuentes abren la pestaña Flora si antes estaba seleccionada Fauna.
- Los enlaces internos desde las tarjetas del diálogo cierran el diálogo original y abren la referencia correspondiente. Se conserva su controlador de teclado, cierre y retorno de foco.

## Cifras y límites

| Registro conservado | Fuente y alcance | Qué no representa |
| --- | --- | --- |
| 486 especies maderables | Vásquez Martínez y Rojas Gonzáles, 2022, figura 9 y texto de p. 16. Compilación taxonómica, colecciones, bibliografía y observaciones; distribución departamental de Madre de Dios. | Árboles contados, volumen aprovechado, un inventario actualizado de toda la flora o una autorización de aprovechamiento. |
| 69 especies documentadas | SERFOR, 2019, pp. 6 y 18. Revisión bibliográfica, caminatas etnobotánicas, entrevistas e identificación; Comunidad Nativa de Infierno, mercados de Puerto Maldonado y concesionarios. | Número de productos, usos o especies de toda la región. |
| Medicinales / alimenticias | Se conservan «En revisión», sin total regional. | La suma de registros locales no establece un inventario regional comparable. |

Las categorías se superponen. Los nombres comunes no se utilizan para transferir usos entre especies. Por ejemplo, sangre de grado mantiene `Croton erythrochilus`, identificado en SERFOR 2019, p. 46; no se sustituye por `Croton lechleri`. La guía identifica el exudado botánicamente como látex, aunque su descripción etnobotánica lo denomina resina: se conserva la distinción en la lectura.

Los ejemplos medicinales se identifican como descripciones etnobotánicas en una fuente institucional. No se reproducen dosis, recetas ni instrucciones de tratamiento, ni se atribuye eficacia clínica a un registro tradicional. Los campos sin evidencia emplean «Información no verificada para Madre de Dios en las fuentes consultadas.»

## Procedencia

El modelo público `datos/flora/lectura.json` conserva institución, documento, año —o ausencia de fecha explícita—, alcance, URL original, localizador y fecha de revisión para once fuentes:

- Catálogo forestal de la Revista Forestal del Perú / UNALM, 2022: cifras y especies. Durante la consulta directa el servidor presentó problemas de certificado/acceso; se contrastaron los registros indexados del PDF original, incluido el texto de la cifra departamental. Se conserva la ruta original existente.
- SERFOR, guía regional PFNM, 2019: metodología, partes utilizadas, usos locales y cadena de valor de castaña. Se consultó el PDF institucional completo y las páginas pertinentes.
- SERFOR, buenas prácticas de aprovechamiento, 2022: planificación, silvicultura, trazabilidad, fauna y regeneración. Ámbito técnico peruano, sin atribuir sostenibilidad a una operación individual.
- IIAP / Profonanpe, aguaje, 2021: frutos, relaciones con fauna y cosecha sin derribar la palmera; muchos ejemplos proceden de Loreto. No se extrapolan cantidades o tasas a Madre de Dios.
- IIAP, secado de tablillas de bambú nativo, 2022: procesos, usos y potencialidades de `Guadua weberbaueri`. El estudio técnico procede de Pucallpa; no prueba una cadena comercial regional ni establece una cuota sostenible de cosecha.
- MINAM, cobertura vegetal, 2015: presencia de pacales y bosques con paca en Madre de Dios, enlazada a la lectura de Territorio.
- Ministerio de Cultura, BDPI Ese Eja: prácticas y conocimientos de ese pueblo, sin generalizarlos a toda la región. La página no indica fecha de publicación.
- Ministerio de Cultura, RVM 046-2018: conocimientos y cestería Ese Eja en Madre de Dios.
- OSINFOR, concesiones para castaña, 2024: producción, calidad, economía y manejo. No se incorporan nuevos precios, porcentajes o cifras de empleo.
- Haugaasen y colaboradores, 2010, resumen original en UEA: transporte y enterramiento de semillas de castaña por roedores. Experimento en Amazonía central, Brasil; contexto biológico, sin tasas regionales atribuidas a Madre de Dios.
- Rockwell y colaboradores, PLOS ONE, 2015: estudio de concesiones de Madre de Dios, conectado con la evidencia ya publicada en la ficha de castaña. No se interpreta como garantía para cualquier intensidad de tala.

## Mantenimiento y publicación

`flora.css` y `flora.js` se cargan solo en la portada. Sus reglas y controles se limitan a esta ampliación y a las tarjetas del diálogo de Flora. El resto de los archivos de estilos y scripts no se modifica.

Los recorridos, las referencias y los campos de las seis especies se generan como HTML estático a partir del modelo; las explicaciones editoriales permanecen en `index.html`. Para actualizar registros:

```sh
python herramientas/actualizar_flora.py
python herramientas/verificar_sitio.py
```

El verificador comprueba integración en la pestaña existente, ausencia de recursos duplicados, siete etapas, procedencia y alcance, conservación de los conteos y sincronización del HTML con el modelo. GitHub Actions comprueba también la sintaxis de `flora.js` y publica los recursos referenciados, incluido el modelo público, al actualizar `main`.

## Validación

- 664 comprobaciones de navegador en 320, 360, 390, 768, 820, 1100, 1440 y 1920 px: cinco selecciones, estados accesibles, contenido de cada flujo, tarjetas con teclado, enlaces a fuentes, casos por URL, retorno desde Fauna, modales originales y lectura sin JavaScript.
- Sin desbordes horizontales en página, tarjetas abiertas o diálogos; un solo contenedor con desplazamiento en cada diálogo de Flora. Se corrigió el ajuste de los títulos largos de fuentes en pantallas estrechas.
- 54 revisiones axe sin infracciones WCAG A/AA detectadas: 36 de los capítulos en móvil, tableta y escritorio, y 18 de los recorridos y los dos diálogos ampliados.
- Verificación de las seis páginas, enlaces internos y entre páginas, datos/CSV existentes, mapa, Analytics único y recursos publicados. Analytics conserva exactamente `G-0KG7JC82NV`.
- Comparación de SHA-256 de los archivos originales: cambios limitados a `index.html`, el verificador y la línea de validación JavaScript de Actions; los demás cambios son archivos nuevos propios de Flora y esta documentación. La porción completa de Territorio y el HTML desde Fauna hasta el final de los scripts anteriores permanecen idénticos.

Las pruebas automáticas no sustituyen la revisión científica de nuevos usos o una evaluación de sostenibilidad en campo.
