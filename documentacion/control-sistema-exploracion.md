# Control del sistema de exploración

Revisión: 5 de octubre de 2026. Base: `3ff98076fcec59d90f8ed9cfbe843abb36fa9c43`.

## Implementación

- Sistema compartido de tarjetas, iconos, controles, tooltip, popover, visores y paneles laterales, documentado en `sistema-componentes.md`.
- Biblioteca accesible desde la portada, el menú EcoSelva y las páginas de lectura: nueve recursos existentes, búsqueda, filtros, siete portadas originales y consulta contextual.
- Vista previa rápida de documentos, lectura del PDF a petición y acceso al original para descargar. Los PDF completos permanecen en sus instituciones.
- Galerías con ampliación, referencias, navegación con botones y flechas; progreso integrado en Castaña, Historia y Áreas protegidas; lectura del ciclo de castaña ligada a su ilustración.
- Zoom, desplazamiento con teclado y arrastre en el mapa de conservación. Especies y fichas de ANP usan panel lateral en escritorio y ventana inferior en móvil.
- Comparador de imágenes disponible como componente para pares verificables futuros. No se publica una comparación sin imágenes compatibles.
- Corrección del generador de Castaña: el título de cada documento ya no sobrescribe los encabezados «Fuentes primarias · Madre de Dios» y «Lectura complementaria · Brasil».

## Validación realizada

Se probaron las seis páginas en 1366 × 768, 1440 × 900, 1536 × 864, 1920 × 1080, 768 × 1024, 820 × 1180, 1024 × 768, 360 × 800, 390 × 844 y 412 × 915: 60 casos aprobados. Se verificaron ausencia de desbordamiento horizontal, recursos locales, errores JavaScript, navegación, filtros, mapas, fuentes y ventanas. Se comprobaron 113 aperturas de ventanas, foco, Escape, cierre exterior donde corresponde y ausencia de un segundo contenedor de desplazamiento en su contenido.

Las auditorías axe de esa matriz revisaron 18 estados de página y 34 estados de ventanas contra WCAG 2 A/AA y WCAG 2.1 AA: ninguna infracción detectada. Las nuevas funciones se revisaron además a 360, 820 y 1536 px, incluyendo las nueve vistas previas, popover, copia exacta del registro científico en el drawer, galería, progreso, narrativa y tooltip. Se auditó cada vista previa y el visor de datos e imágenes. Las auditorías automáticas complementan la comprobación de teclado; no equivalen a certificar accesibilidad en todos los dispositivos.

Se comprobó la biblioteca con JavaScript desactivado: nueve fuentes con enlaces al original y registros científicos accesibles mediante desplegables nativos. Ante una respuesta 503 del catálogo, permanece el enlace al documento y aparece un aviso accesible con el botón habilitado para reintentar. El comparador se probó mediante teclado con imágenes de prueba que no se publican.

Se probaron selección de polígonos, zoom, flechas, restablecimiento y arrastre en 360, 820 y 1920 px. Arrastrar el mapa no abre una ficha accidentalmente. Se revisaron capturas finales con fotografías cargadas en móvil y escritorio. El lector PDF se comprobó con Chromium completo y el original `01782.pdf` del Congreso: respuesta 200, tipo `application/pdf`, tres páginas visibles, enlace alternativo disponible y eliminación del iframe al cerrar.

También pasaron:

```bash
node --check script.js
node --check ventanas.js
node --check fichas/ficha.js
node --check conoce.js
node --check historia.js
node --check areas-protegidas.js
node --check ecoselva.js
python herramientas/actualizar_ficha_castana.py --check
python herramientas/actualizar_biblioteca.py --check
python herramientas/verificar_sitio.py
python herramientas/preparar_publicacion.py /tmp/ecoselva-sistema/publicacion-validada
git diff --check
```

El paquete de publicación contiene 70 archivos utilizados por las páginas. Las herramientas, documentos internos, archivos temporales y PDF descargados para comprobar metadatos quedan fuera del sitio.

## Integridad

Los 531 párrafos originales de las cinco páginas anteriores permanecen presentes. Los 63 archivos originales comprobados en `datos/`, `images/` y los recursos de `fichas/` conservan su SHA-256. No se modificaron los modelos científicos, indicadores, CSV, imágenes originales ni los seis archivos JavaScript originales de funciones específicas.

El mapa territorial conserva 249 paths, 349 usos y 174 humedales. El mapa de conservación conserva las seis áreas y su geometría. Los controles nuevos solo cambian el `viewBox` del SVG en el navegador.

| Recurso | SHA-256 conservado |
| --- | --- |
| `datos/territorio/mapa.svg` | `33cb546984c299170d71b3e2772a45c0d80bb2df779e6a5836acb7e32e55cad7` |
| `datos/conservacion/mapa.svg` | `7df2a8656ee547320c38695c078627d2c43ba57b0511a3e12ceb0e7219ea101d` |

Las páginas que incorporan Analytics conservan una sola instalación con `G-0KG7JC82NV` dentro de `head`. No se añade un contenedor de Google Tag Manager. El sitemap incluye la biblioteca y el despliegue sigue usando GitHub Actions.
