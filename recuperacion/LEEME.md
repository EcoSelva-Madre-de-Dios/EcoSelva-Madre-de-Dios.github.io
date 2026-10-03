# Recuperación de EcoSelva

Se restauraron los bloques disponibles en el registro anterior a la limpieza de esta sesión. Se conservó una copia del estado previo a esta recuperación en `antes-de-restaurar/`.

Origen: lecturas de index.html, style.css y script.js registradas antes de las modificaciones. El bloque desde el final de «¿Sabías que…?» hasta el footer se recuperó del registro completo. El JavaScript original se recuperó con la única corrección del salto de línea literal que impedía su ejecución. Los estilos de las tarjetas se recuperaron del bloque original; se revirtieron los estilos añadidos por la limpieza.

Restaurados: menú, flip cards, cuatro categorías de Flora en cifras, hotspots, Investigaciones, Colabora, Contacto, redes y footer, con sus textos y enlaces originales, incluidos los provisionales.

Pendiente: en la versión disponible al comienzo de esta sesión no existían las seis fichas de Flora, los filtros ni #flora-drawer. El historial de VS Code solo aportó dos archivos CSS anteriores sin ese drawer. Las seis fotografías permanecen en images/. No se inventaron fichas, fuentes ni JavaScript para sustituir el original ausente. Es necesario un respaldo anterior que contenga estos componentes.

`validacion.html` es una copia instrumentada para comprobaciones; no es una nueva página de producción.
Validación en Edge: anchos efectivos de 1336 y 504 px. Apertura/cierre de tarjetas, hotspots, cierre del menú, año dinámico e imágenes: correctos. Sin errores JavaScript capturados durante esas pruebas. La prueba móvil cubre el breakpoint móvil de CSS; no se comprobó un dispositivo físico. Anclas internas: correctas.
