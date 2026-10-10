# Actualizar EcoSelva

La web se publica automáticamente cuando los cambios llegan a `main` en GitHub. Guardar un archivo en el editor prepara el cambio local; para verlo publicado, usa **Control de código fuente → Confirmar → Sincronizar cambios** en VS Code.

GitHub Pages ya está configurado con **GitHub Actions**. El flujo **Verificar y publicar EcoSelva** genera la biblioteca, Flora, la ficha de castaña, las cabeceras y pies comunes y los archivos agrupados de CSS y JavaScript; después comprueba enlaces, datos, Analytics y cartografía antes de publicar. Si falla una comprobación, la versión pública anterior se conserva.

Edita los archivos fuente, como `index.html`, `style.css`, `ecoselva.css`, `flora.css` y `territorio.css`. `assets/` contiene las versiones agrupadas que genera el flujo. El registro editorial principal es `datos/fuentes.json`; `datos/biblioteca/documentos.json` se genera desde ese registro. Los conjuntos científicos conservan su procedencia y sus fechas propias.

Los enlaces del menú y del pie de las lecturas se editan en `herramientas/actualizar_navegacion.py`. `dialogos.js` gestiona las ventanas y `navegacion.css` controla el bloqueo del fondo. Las páginas editoriales usan sus paquetes ligeros; la portada y las lecturas del mapa conservan sus estilos específicos.

Para generar y revisar los cambios localmente, abre PowerShell en la raíz del repositorio. El generador necesita Python 3:

```text
python herramientas/actualizar_sitio.py
```

Si `python` no funciona, usa `python3 herramientas/actualizar_sitio.py` o `py -3 herramientas/actualizar_sitio.py`. En Windows, el verificador prueba esas tres variantes, descarta el alias de Microsoft Store si no puede ejecutar código y configura la consola para trabajar en UTF-8:

```powershell
.\herramientas\verificar-publicacion.ps1
```

Si Windows impide ejecutar scripts por la política local, usa una excepción limitada a esa ejecución:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\herramientas\verificar-publicacion.ps1
```

En otros sistemas puedes ejecutar directamente `python3 herramientas/verificar_sitio.py`.

Hay tres pruebas de navegador opcionales en `herramientas/verificar_lectura.cjs`, `herramientas/verificar_interacciones.cjs` y `herramientas/verificar_atlas.cjs`. Requieren Node.js y Playwright; la prueba de interacciones también importa `@axe-core/playwright`. Con esas dependencias disponibles, inicia el servidor local desde la raíz del repositorio:

```text
python -m http.server 8765
```

Si corresponde, sustituye `python` por `python3` o `py -3`. En otra terminal, también desde la raíz, ejecuta las pruebas que necesites:

```text
node herramientas/verificar_lectura.cjs
node herramientas/verificar_interacciones.cjs
node herramientas/verificar_atlas.cjs
```

Los tres scripts usan `http://127.0.0.1:8765/` de manera predeterminada y aceptan otra URL base como primer argumento.

La publicación añade una versión a CSS, JavaScript y las solicitudes de datos, para que una actualización use los recursos correspondientes. Las herramientas, la documentación, los archivos de recuperación y los originales que no utiliza la web permanecen fuera de la publicación.

Sitio: [EcoSelva Madre de Dios](https://ecoselva-madre-de-dios.github.io/).
