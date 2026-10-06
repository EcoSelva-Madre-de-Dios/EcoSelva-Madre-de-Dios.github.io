# Tarjetas, diálogos y navegación común

Revisión editorial: 5 de octubre de 2026.

## Correcciones

- Flora, Geografía y Personas alinean las tarjetas por arriba en sus propias hojas. Abrir un desplegable no aumenta la altura de sus vecinos.
- Las provincias usan `details` nativos. El resumen muestra nombre y número de distritos; capital, nombres, ubicación y referencias aparecen al desplegar, sin clonar la ficha en una ventana.
- `dialogos.js` concentra apertura, cierre, clic en el fondo y regreso del foco. Se retiran las trampas manuales de Tab. El bloqueo de desplazamiento se controla con `html:has(dialog[open])` y permanece activo mientras quede una ventana abierta.
- Las siete páginas internas comparten cabecera, menú y pie, generados por `actualizar_navegacion.py`. El menú permite acceder a las demás secciones y funciona sin JavaScript.
- Biblioteca, Metodología, Historia, Áreas protegidas y Castaña cargan el paquete editorial. Su CSS común baja de unos 244 KB a 62 KB, sin cargar la hoja completa de la portada.
- Metodología incorpora descripción, Open Graph y una sola instalación de Analytics con el ID `G-0KG7JC82NV`. El CSS incrustado se traslada a `editorial.css`. La verificación exige metadatos y Analytics en las ocho páginas.
- El panel del mapa usa notas de 14,5 px para lectura y controles, con el color secundario compartido en las etiquetas y notas que tenían contraste insuficiente.
- Las capas se pueden elegir durante la descarga del SVG. Se aplican juntas al terminar y se conservan si falla. Las fuentes siguen accesibles durante el fallo y el reintento recupera el visor.
- El conteo de ANP usa el tamaño del modelo. Los fragmentos mal codificados no interrumpen los controladores de Áreas protegidas e Historia.
- Los desplegables de Geografía y Personas conservan la decisión del lector al cambiar de ancho. Se retiran los atributos antiguos de apertura automática sin controlador.
- Los espacios reutilizan la escala existente sin cambiar sus valores. Los tamaños auxiliares de 12 y 13 px pasan al token de créditos. Se retiran los estilos sin consumidores de la antigua ventana de Flora, incluida su franja decorativa.
- La nota de superficies de las seis fichas de ANP aparece una vez y cada ficha enlaza al alcance común. Las citas BDPI identifican el pueblo correspondiente y conservan los enlaces a las fuentes completas.

El registro de 78 fuentes, la separación de Flora y Territorio, la carga diferida del mapa y la retirada de los antiguos hotspots ya estaban implementados. Todos los archivos de datos anteriores y los modelos JSON incrustados de Historia y Áreas protegidas permanecen intactos.

## Verificación

Las ocho páginas se comprueban a 320, 390, 820 y 1440 px: menús, Escape y retorno de foco, fauna, recorridos de Flora, geometrías del mapa y anclas antiguas. Las pruebas comparan la altura de las tarjetas vecinas al desplegar y ejercitan dos ventanas anidadas.

Las auditorías automáticas WCAG A/AA cubren páginas, fichas de fauna, documentos y estados seleccionados del mapa. Se prueban descarga lenta, fallo de red, fuentes durante el fallo y recuperación sin perder las capas elegidas. La revisión visual cubre el menú móvil y las páginas editoriales.

GitHub Actions genera cabeceras, pies, fragmentos y paquetes antes de verificar y publicar. La versión común de los recursos evita mezclar archivos de despliegues distintos.
