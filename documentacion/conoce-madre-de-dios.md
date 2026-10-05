# Conoce Madre de Dios · fase 1 revisada

Revisión: 5 de octubre de 2026. Se aplica el documento específico de “Conoce Madre de Dios, versión revisada y definitiva”, conservando la arquitectura publicada y los seis módulos. La sección continúa inmediatamente después del Hero. El mapa ya integrado sigue siendo una sola implementación de `#explora-madre-de-dios`; “Todo está conectado” mantiene su posición actual al final del recorrido, como puente.

La [tabla de control y el informe técnico](control-datos-conoce.md) contienen valores, ámbito, año del dato, institución, documento, URL original, estado, conflictos y decisiones de publicación. Se consultaron directamente el Compendio INEI 2025 (presentación de diciembre de 2025; publicación en el portal del 23 de enero de 2026), el plan regional fechado en agosto de 2020 con horizonte 2025 y la Ley 27285 original.

## Criterios de datos

La superficie se presenta como **aproximadamente 85 000 km²**, con la diferencia entre INEI y GORE explicada en la ventana de fuentes. Los colindantes distinguen departamentos peruanos (Ucayali, Cusco, Puno) de países (Brasil, Bolivia); el esquema de agrupación evita asignar una dirección cardinal cuando la formulación documental difiere.

Las listas de 11 distritos y el conteo de tres provincias se verificaron en los cuadros 1.1 y 1.2 de INEI 2025. Las fichas conservan las capitales provinciales y añaden la posición relativa dentro del departamento, identificada como lectura orientativa de la figura 2 del plan regional. Salvación se verifica directamente en el artículo 2 de la Ley 27285; no se utilizan etiquetas antiguas del mapa para inferir la capital.

El rango altitudinal de 176 a 3 967 m s. n. m. se identifica como referencia del documento de 2020, sin atribuirle una medición actual. El dibujo del relieve lleva el rótulo “Esquema educativo · sin escala”. El clima conserva una formulación general, sin combinar meses de estaciones ni publicar un pronóstico. El Compendio 2025 reúne indicadores anuales de SENAMHI de 2015–2024; no se crea un gráfico climático.

La historia mantiene la distinción entre territorio habitado y creación administrativa en 1912. Personas presenta los casos documentados Ese Eja (BDPI, sin fecha indicada) y recolectores de castaña (Thomas y colaboradores, 2017), sin resumir toda la diversidad cultural ni convertir una proyección de población en censo. Se conserva el acceso a la ficha piloto de castaña.

## Conservación y presentación

`script.js`, `ventanas.js`, `conoce.js`, los scripts de fichas, las hojas de estilo anteriores y todos los archivos de `datos/` permanecen intactos. No se cambian categorías, geometrías, colores, zoom, fuentes, metodología ni contenido científico previo. Esta revisión no mueve HTML ni cambia IDs. Solo actualiza los nuevos módulos, el esquema educativo independiente de colindantes y dos reglas en `conoce.css`.

Los límites, la geografía y los casos humanos se muestran mediante detalles desplegables; las provincias y fuentes usan el diálogo existente de la fase anterior, con ficha inferior en móvil y lectura alternativa sin JavaScript. El enlace “Explorar ríos en el mapa” navega al módulo 03 sin cambiar la categoría elegida.

El localizador `images/conoce-peru.svg` mantiene [Natural Earth Admin 1, escala 1:10 millones, versión 5.1.1](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/), [datos originales](https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip), de [dominio público](https://www.naturalearthdata.com/about/terms-of-use/). Es una simplificación educativa independiente del mapa interactivo; no se utiliza para calcular cifras ni para demarcar límites.
