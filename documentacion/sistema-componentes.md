# Sistema de exploración de EcoSelva

La interfaz compartida combina lectura editorial, cartografía y consulta de fuentes. Los componentes viven en `ecoselva.css` y `ecoselva.js`. Las páginas cargan ambos archivos después de sus recursos originales. El contenido, sus enlaces y su procedencia permanecen disponibles en el HTML; JavaScript añade formas de explorarlos.

## Fundamentos

Los tokens de `:root` contienen paleta, tipografías, anchos, espaciado, radios, sombras y duración de transiciones. Manrope establece la jerarquía editorial; Inter sirve para lectura y metadatos. El verde identifica exploración, el agua identifica fuentes y datos, y los tonos tierra y arena sirven como acentos. Sobre fondos claros se utilizan las variantes `--earth-text` y `--water-text` con contraste suficiente.

Los componentes nuevos se reorganizan hasta 1100 px y pasan a una columna hasta 767 px. `--breakpoint-tablet` y `--breakpoint-mobile` documentan esos valores para futuras mejoras en JavaScript. CSS no permite utilizar propiedades personalizadas dentro de una consulta `@media`: sus valores literales deben mantenerse sincronizados. Los puntos de adaptación de los mapas anteriores se conservan para respetar su lógica.

Los botones tienen un área mínima de 44 px. Las etiquetas parten de 12 px; el cuerpo conserva 16 px. Los estados de foco siempre son visibles. Los efectos de elevación se reservan para punteros precisos y se desactivan con `prefers-reduced-motion`. La información necesaria nunca depende del hover.

## Tarjetas

La clase `eco-card` aporta borde, radio, foco y estados; `data-eco-card` identifica la función. La anatomía común utiliza `eco-eyebrow`, un encabezado semántico, `eco-card-secondary`, `eco-card-content`, `eco-card-actions` y `eco-button` o `eco-text-link`. No es necesario incluir todos los campos si no aportan información.

| Valor | Función y composición |
| --- | --- |
| `editorial` | Una idea o relato; encabezado y resumen, con borde verde. |
| `visual` | Una imagen protagonista y un acceso; admite una composición a sangre. |
| `stat` | Una cifra con unidad, periodo, ámbito y enlace a su fuente; números tabulares. |
| `map` | Un mapa o acceso al atlas; conserva leyenda y contexto, sin elevar el mapa al pasar el puntero. |
| `document` | Portada completa, autor, año, ámbito y metadatos comprobados; vista previa y original. |
| `species` | Nombre común, nombre científico, lugar del registro y acceso a la ficha. |
| `resource` | Recurso educativo con icono, explicación breve y destino concreto. |
| `data` | Indicador con procedencia y consulta rápida; borde de acento agua. |
| `article` | Título del estudio, autores, ámbito y enlace al original; sin portada ficticia. |
| `protected-area` | Nombre, categoría y acceso al contexto cartográfico o la ficha. |

Una tarjeta representa un concepto. Si toda la tarjeta es un enlace, no se anidan botones ni otros enlaces. Si incluye varias acciones, se utiliza `article`. `data-eco-active="true"` marca una selección cuando un componente no dispone de `aria-current` o `aria-pressed`; estos atributos ARIA se utilizan solo cuando corresponden a la semántica del control.

```html
<article class="eco-card" data-eco-card="editorial" aria-labelledby="relato-titulo">
  <div class="eco-card-content">
    <p class="eco-eyebrow">Bosques · lectura</p>
    <h3 id="relato-titulo">Un título que representa una idea</h3>
    <p class="eco-card-secondary">Contexto breve y verificable.</p>
    <a class="eco-button" href="historia.html">Explorar la historia →</a>
  </div>
</article>
```

## Ayudas y ventanas

- `data-eco-tip="Ayuda breve"` añade un tooltip al control existente. Aparece con puntero o foco, se puede recorrer con el puntero y desaparece con Escape. Conserva cualquier descripción accesible previa.
- `details.eco-popover[data-eco-popover]` presenta contexto complementario junto al control. Funciona como un desplegable nativo sin JavaScript; la mejora añade cierre exterior y Escape.
- `data-eco-document="id-del-catalogo"` abre una vista previa o contexto de artículo. Debe acompañarse siempre de un enlace al original.
- Un enlace `href="#contenido-original" data-eco-context="contenido-original" aria-haspopup="dialog"` abre ese contenido en un panel lateral. La sección original mantiene su identificador y funciona como destino sin JavaScript. Las copias eliminan IDs para evitar duplicados.
- Los indicadores de castaña abren una copia exacta de su registro en un drawer; las tablas y registros originales permanecen disponibles.

Los visores comparten encabezado, X, Escape, foco contenido, retorno al control de origen y bloqueo del fondo. El clic exterior cierra cuando empieza y termina fuera de la ventana. Las fichas de especies y áreas protegidas aparecen como paneles laterales en escritorio; en móvil pasan a ventanas inferiores de hasta 90 `dvh`. El contenido tiene un solo contenedor de desplazamiento por ventana. El visor PDF puede incluir el desplazamiento propio del lector nativo del navegador.

## Biblioteca y documentos

`datos/biblioteca/documentos.json` contiene las fuentes ya utilizadas por EcoSelva y sus destinos de contexto. No sustituye los modelos científicos existentes. La biblioteca inicia con nueve recursos: siete PDF y dos artículos. Las siete miniaturas de `images/documentos/` se extrajeron de la primera página de los originales; autores, año de publicación, tamaño, páginas, dimensiones y SHA-256 registran la copia comprobada. Las instituciones aparecen acreditadas en las tarjetas y visores.

La búsqueda ignora tildes y combina palabras; los filtros temáticos conservan su selección y el resultado se anuncia mediante una región de estado. Sin JavaScript se muestran los nueve recursos y sus enlaces.

La vista previa carga primero la portada local. El PDF completo se solicita únicamente al pulsar «Cargar PDF completo», con su tamaño visible. Se utiliza el lector nativo del navegador y se mantiene el enlace al original si ese lector no está disponible. Los botones «PDF / descarga» abren el archivo de la institución; desde allí se descarga. No se fuerza una descarga mediante `fetch`, pues los proveedores no garantizan CORS. Cerrar el visor elimina el iframe y cancela esa presentación. No se incorporan copias completas de PDF al sitio.

```bash
python herramientas/actualizar_biblioteca.py
python herramientas/actualizar_biblioteca.py --check
python herramientas/actualizar_ficha_castana.py
python herramientas/verificar_sitio.py
```

Para agregar un documento, primero se verifica la fuente y se incorpora un enlace contextual a una sección real. Se comprueban los metadatos disponibles y se genera una portada del original cuando existe PDF. No se inventan portadas, páginas, fechas, tamaños ni ámbitos. El verificador comprueba sincronización, originales, destinos y recursos antes de publicar mediante GitHub Actions.

## Mapas y lectura

Los mapas conservan sus SVG, GeoJSON, fuentes y geometrías. Territorio mantiene sus capas de bosques, ríos, humedales y provincias, leyendas y controles. Conservación mantiene los seis contornos, sus filtros y selección mediante mapa o lista, con el panel junto al mapa en escritorio y ficha inferior en móvil.

`data-eco-map` habilita controles sobre un SVG inline que tenga `viewBox`: acercar, alejar, restablecer, arrastrar con zoom y desplazar con flechas cuando el mapa recibe foco. El componente modifica solo la vista. Los círculos, líneas, rutas y polígonos futuros deben proceder de datos verificables; las selecciones pueden usar el componente `data-eco-context` o el panel específico de cada mapa. No se añaden puntos de ingreso ni rutas supuestas. La selección conserva sus eventos originales y un arrastre no abre accidentalmente una ficha.

`data-eco-progress` integra progreso y capítulo activo en una navegación existente con anclas. `data-eco-current-managed` conserva la gestión previa de `aria-current` en Historia y Castaña; Áreas protegidas la recibe mediante el componente compartido. El contador visual no repite anuncios del lector de pantalla.

`data-eco-story` agrupa una figura y pasos `data-eco-story-step`, cada uno con encabezado `h4`. Castaña vincula la ilustración existente con «Flores y polinización» y «Semillas y dispersión»; conserva el alcance brasileño de esos estudios y sus referencias. El indicador cambia al leer cada paso. En móvil, la figura deja de ser sticky; todos los textos permanecen visibles.

## Imágenes y comparación

Las figuras editoriales de Castaña, Historia, Conoce y Áreas protegidas reciben un botón de ampliación. La galería incluye la imagen original, su alt, la leyenda y créditos completos; admite botones Anterior/Siguiente y flechas de teclado. Ninguna imagen original se sustituye.

El comparador reutilizable está disponible para futuros pares comparables. No se publica una comparación falsa utilizando imágenes de lugares, sensores o fechas incompatibles. Su estructura admite dos imágenes alineadas y una etiqueta para el control:

```html
<figure>
  <div data-eco-compare>
    <img src="primera-imagen-verificada.webp" width="1200" height="900" alt="Descripción y fecha de la primera imagen.">
    <img src="segunda-imagen-verificada.webp" width="1200" height="900" alt="Descripción y fecha de la segunda imagen.">
    <label for="comparacion-bosque">Comparar imágenes
      <input id="comparacion-bosque" type="range" min="0" max="100" value="50">
    </label>
  </div>
  <figcaption>Fuentes, fechas, ámbito y límites de la comparación.</figcaption>
</figure>
```

Los nombres del ejemplo son marcadores de documentación; deben sustituirse por recursos reales antes de utilizarlos. El control funciona con teclado y comunica el porcentaje de la primera imagen.

## Iconos y publicación

`images/ecoselva-iconos.svg` contiene símbolos de 24 × 24 con el mismo trazo: `bosques`, `biodiversidad`, `flora`, `fauna`, `mapas`, `satelite`, `datos`, `documentos`, `biblioteca`, `conservacion`, `educacion` y `ciencia`, más `ampliar` y `flecha`. Son decorativos junto al texto; los botones que solo tienen icono requieren `aria-label`.

```html
<svg class="eco-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <use href="images/ecoselva-iconos.svg#biblioteca"></use>
</svg>
```

Las rutas del ejemplo corresponden a una página en la raíz. Los componentes creados por JavaScript resuelven los recursos respecto a `ecoselva.js`, por lo que funcionan también en `fichas/`. El empaquetado incluye la biblioteca, catálogo, portadas y sprite; las herramientas y esta documentación quedan fuera de la publicación. Google Analytics conserva una instalación por página con `G-0KG7JC82NV`. El despliegue automático sigue usando el flujo existente de GitHub Actions.
