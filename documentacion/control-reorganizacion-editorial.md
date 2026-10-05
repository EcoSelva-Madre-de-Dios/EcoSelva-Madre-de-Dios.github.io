# Reorganización editorial y publicación

Revisión editorial: 5 de octubre de 2026.

## Resultado

La portada mantiene los resúmenes de Flora y Territorio. `flora.html` y `territorio.html` contienen las lecturas completas, con enlaces para volver al punto correspondiente de Biodiversidad o Conoce Madre de Dios. Los antiguos enlaces profundos de esas lecturas se conservan mediante anclas de compatibilidad.

- Portada: aproximadamente 83 KB, frente a los 426 KB anteriores; ya no contiene JSON cartográfico incrustado.
- Flora y Fauna tienen una extensión comparable en la portada. Flora completa conserva las seis especies, las cifras documentadas de 486 y 69, los totales medicinales y alimentarios en revisión y cinco recorridos de siete etapas.
- Contacto muestra el correo proporcionado por el responsable: `ecoselvamadrededios@gmail.com`. Se retiran el formulario sin servicio y las redes sin cuenta. El formulario de investigaciones conserva su propósito en Colabora.
- Ambiente enlaza a explicaciones y fuentes disponibles; se retiran las ocho fichas vacías.
- Ciencia ofrece estudios existentes y una entrada a Colabora. La carga de video conserva movimiento reducido y ahorro de datos.
- Conoce reduce introducciones y navegación repetidas; cada provincia muestra sus datos completos al abrir la ficha. INEI y el plan regional tienen un único bloque de referencias comunes.
- Historia y Áreas protegidas tienen acceso desde el menú. Se retira el marcador interno «Parte 2».
- Hay una entrada principal a castaña por página en Inicio, Flora y Territorio. La biblioteca mantiene los enlaces a los contextos de documentos específicos.
- `datos/fuentes.json` reúne 78 fuentes documentales sin URLs duplicadas. Biblioteca y las referencias documentales de Flora se generan desde este registro. Las fuentes compartidas conservan sus diferentes contextos de lectura.

## Mapa y datos

Las pestañas y las casillas temáticas se sustituyen por un solo grupo de casillas. Se pueden combinar Bosques, Ríos y Humedales; el panel sigue la última capa activada. Provincias, distritos y ANP mantienen sus controles independientes.

Se eliminan las seis tarjetas de ríos que duplicaban las fichas del visor. Los accesos desde explicaciones forestales recuerdan el botón y la posición de lectura: «Volver a donde estabas» restaura desplazamiento y foco. Las fuentes del mapa se pueden abrir aunque falle la carga del SVG.

Los JSON que estaban incrustados se extraen a `registros-visor.json`, `cobertura-fichas.json` y `descripciones.json`. El mapa y sus datos se solicitan al llegar al visor. `datos/territorio/fichas.json`, los GeoJSON, los SVG, los metadatos originales y los modelos científicos anteriores se conservan sin cambios.

El visor territorial usa seis ríos; el mapa de áreas protegidas usa otra base con siete, incluido Tahuamanu. Se explica la diferencia sin agregar trazados ni equiparar bases distintas.

## Lectura y mantenimiento

Se incorporan variables compartidas para créditos (13 px), notas (14,5 px), lectura (17 px), subtítulos (20 px) y tres niveles de espaciado. Los párrafos largos tienen un ancho de lectura acotado. Las grillas de desplegables alinean las tarjetas por arriba. Se corrigen el desborde de Ambiente en 320 px y los contrastes de la leyenda y la etiqueta del mapa en estado de selección.

Se retiran el controlador de hotspots sin HTML, 59 selectores obsoletos, la decoración de ventanas sin consumidores y las plantillas antiguas sin uso. Los archivos fuente siguen siendo editables; `actualizar_assets.py` genera los recursos agrupados de forma reproducible. El inicio carga dos CSS y un JS local; las lecturas completas añaden su CSS y controlador propio.

Se precarga la imagen del hero. Analytics conserva el ID `G-0KG7JC82NV`, una sola instalación por página y una nota de estadísticas enlazada a la información de Google. No se incorpora Google Tag Manager.

La fecha del pie corresponde a esta revisión editorial. Las fechas de comprobación de PDF y las revisiones de conjuntos científicos se mantienen en sus registros originales: no se modifica una fecha técnica para hacerla coincidir con la edición de otra página. Los nombres completos de autores en las referencias y las citas abreviadas por apellido cumplen funciones distintas.

## Validación

`verificar_sitio.py` comprueba ocho páginas, los enlaces entre ellas, las fuentes, los fragmentos generados, los indicadores y CSV de castaña, Analytics, los modelos científicos y los contornos cartográficos. La publicación incluye únicamente los recursos usados por el sitio.

`verificar_interacciones.cjs` comprueba 320, 390, 820 y 1440 px, navegación móvil, cuatro grupos de fauna, cinco recorridos de Flora, enlaces antiguos, 174 humedales, 11 distritos, seis ANP, regreso al origen y lectura sin JavaScript. Incluye auditorías automáticas WCAG A/AA en páginas y ventanas, tanto al cargar como en estados de selección.

El flujo de GitHub Actions genera el sitio antes de verificarlo y publicarlo. El paquete público añade una versión común a los recursos para evitar mezclar archivos de publicaciones diferentes.
