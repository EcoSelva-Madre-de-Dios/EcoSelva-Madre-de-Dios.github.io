# Plantilla de ficha EcoSelva

Modelo piloto: `/fichas/castana.html`. Una página continua con tres profundidades y enlaces directos; el contenido principal se publica como HTML estático y se lee sin JavaScript. No replicar hasta evaluar esta ficha con lectores de los públicos previstos.

## Campos obligatorios

| Campo | Criterio editorial |
| --- | --- |
| Nombre común y científico | Verificados; nombre científico en cursiva. No inventar nombres locales. |
| Ámbito y tipo | Territorio explícito y categoría real. |
| Introducción | Máximo 25 palabras; explicar la relación con el territorio con una fuente. |
| Fotografía | Autor, fuente, licencia compatible, enlace al original, modificaciones declaradas, alt descriptivo y dimensiones. |
| Dato destacado | Valor verificable con unidad, periodo, ámbito y fuente; declarar cualquier redondeo. |
| Tres ideas esenciales | Dónde, personas y por qué importa. El bloque “En 20 segundos” no supera aproximadamente 120–160 palabras. |
| Desarrollo educativo | Al menos dos módulos documentados, lenguaje claro y términos contextuales. No extrapolar un estudio local a toda la región. |
| Datos | Solo registros apropiados para el tema; si no existen cifras válidas, describir la evidencia disponible sin inventarlas. |
| Documentos | Institución/autores, título, año, tipo, ámbito, enlace original y motivo de uso; separar fuentes primarias y lecturas complementarias. |
| Limitaciones | Alcance temporal y espacial, metodología conocida, vacíos y diferencias pendientes. |
| Revisión y autoría | Fecha real de revisión; responsabilidad institucional EcoSelva Madre de Dios. Personas únicamente con autorización para publicar el nombre. |

## Estructura reutilizable

1. Breadcrumb con destinos existentes, cabecera 55 % texto / 45 % fotografía; en móvil, fotografía primero. Metadatos visibles y navegación por anclas.
2. **Lo esencial:** dato destacado, tres ideas y enlaces “Entender cómo funciona ↓” y “Consultar datos y evidencia ↘”. Referencias compactas arriba.
3. **Para entender:** módulos educativos, procesos ilustrados cuando hay evidencia suficiente, personas y territorio, caso local con fecha y alcance. `<details>` solo para ampliaciones puntuales, nunca para esconder una profundidad completa.
4. **Datos y evidencia:** 2–4 tarjetas si hay indicadores válidos, registros técnicos expandibles, documentos jerarquizados y “Lo que aún falta conocer”.
5. Relaciones con secciones existentes, revisión institucional, metodología y plantilla de cita con `[fecha de consulta del lector]`.

Los componentes comunes están en `fichas/ficha.css` y `fichas/ficha.js`. La textura y el diagrama de la castaña son SVG originales, propios del piloto; no representan duraciones ni frecuencias. Usar los colores del sitio, contraste suficiente, texto continuo de 15–16 px, lectura de 760 px y datos hasta 1060 px. No copiar patrones indígenas ni inventar nuevas categorías.

## Fuentes y controles de rigor

Priorizar documentos oficiales originales y artículos científicos originales. Toda afirmación factual lleva una referencia rastreable; un estudio brasileño se identifica como tal. Mantener separados **periodo del dato**, **año de publicación** y **revisión EcoSelva**. Un caso de 2012 publicado en 2017 se presenta como histórico.

No atribuir causas a discrepancias sin documentación. No mezclar cifras nacionales y regionales, productos con cáscara y pelados, ni deducir rendimientos. Las recomendaciones institucionales se identifican como recomendaciones, sin afirmar que fueron ejecutadas. Añadir normativa solo después de verificar el documento oficial relevante y su vigencia; el informe de OSINFOR de 2024 se utiliza aquí como fuente técnica fechada, no como certificación de vigencia normativa.

CSV y gráficos son opcionales. Un CSV contiene hechos revisados con procedencia, sin redistribuir tablas completas ni material protegido por una licencia incompatible. Un gráfico requiere al menos **cuatro observaciones comparables de la misma variable, unidad y ámbito**, y revisión de métodos y universos; documentar cualquier ruptura. Los tres registros regionales de este piloto se presentan en tabla. No usar puntuaciones de confianza ni estimaciones de producción actual.

## Actualizar una cifra del piloto

La fuente editable es `datos/fichas/castana.json`. Los cinco registros conservan la precisión de las tablas originales; `tarjetas` selecciona los indicadores visibles y `destacado` selecciona el resumen redondeado. `documentos` contiene las referencias editoriales. Las definiciones y métodos describen lo que permite conocer cada documento, sin completar huecos por inferencia.

1. Verificar el dato en el documento original y revisar producto, unidad, periodo, territorio, localizador, precisión, metodología y límites. No cambiar un número aislado conservando una fuente que ya no lo respalda.
2. Editar el registro y su procedencia en el JSON. Si se hizo una nueva revisión editorial, cambiar la fecha superior y las fechas de todos los registros que realmente se volvieron a revisar.
3. Ejecutar:

   ```text
   python herramientas/actualizar_ficha_castana.py
   python herramientas/actualizar_ficha_castana.py --check
   python herramientas/verificar_sitio.py
   ```

4. Revisar el diff: el generador actualiza únicamente los bloques delimitados `<!-- ficha:… -->` y el CSV. No editar a mano esos bloques; los textos educativos externos a ellos permanecen independientes.
5. Revisar en móvil y escritorio, confirmar el cambio y enviarlo a `main`. GitHub Actions verifica que HTML, JSON y CSV coincidan antes de publicar; nunca descarga cifras ni actualiza contenido factual automáticamente.

La página incluye el JSON para consulta y el CSV para descarga. El generador, esta guía y los archivos internos no forman parte de la publicación.

## Puerta de publicación para futuras fichas

No publicar una nueva ficha sin fotografía con licencia, introducción, Lo esencial completo, al menos dos módulos de Para entender, fuentes comprobadas, fecha real de revisión y metodología/limitaciones cuando corresponda. No mostrar secciones vacías, “Próximamente”, descargas inexistentes ni enlaces a fichas vacías.

Antes de replicar, evaluar con lectores: comprensión rápida para público general, aprendizaje de procesos para estudiantes y trazabilidad para profesionales. Comprobar móvil, teclado, glosario, anclas, lectura sin JavaScript, SEO propio y actualización de datos sin reescribir la página. Las comprobaciones técnicas no sustituyen esta evaluación humana. En esta fase solo existe el piloto de castaña.

## Presentación refinada

Mantener cabecera común, breadcrumb, hero amplio, metadatos, nivel esencial, explicación, datos/evidencia, fuentes y última revisión. Usar `--layout-wide` para evidencia/tablas y `--reading-max` para texto; no extender párrafos a todo el ancho. Una microidentidad editorial puede tener una microilustración decorativa (64–120 px, alt vacío), sin sustituir la fotografía documentada ni el esquema científico. La castaña muestra el objeto completo sobre un marco editorial; sus créditos y la reconstrucción declarada permanecen visibles. Las ventanas reutilizan `ecoDialog`: editorial 40/60, drawer técnico y bottom sheet móvil.
