# Actualizar EcoSelva

La web se publica automáticamente cuando los cambios llegan a `main` en GitHub. Guardar un archivo en el editor prepara el cambio local; para verlo publicado, usa **Control de código fuente → Confirmar → Sincronizar cambios** en VS Code.

GitHub Pages ya está configurado con **GitHub Actions**. El flujo **Verificar y publicar EcoSelva** genera la biblioteca, Flora, la ficha de castaña y los archivos agrupados de CSS y JavaScript; después comprueba enlaces, datos, Analytics y cartografía antes de publicar. Si falla una comprobación, la versión pública anterior se conserva.

Edita los archivos fuente, como `index.html`, `style.css`, `ecoselva.css`, `flora.css` y `territorio.css`. `assets/` contiene las versiones agrupadas que genera el flujo. El registro editorial principal es `datos/fuentes.json`; `datos/biblioteca/documentos.json` se genera desde ese registro. Los conjuntos científicos conservan su procedencia y sus fechas propias.

Para generar y revisar los cambios localmente:

```text
python3 herramientas/actualizar_sitio.py
python3 herramientas/verificar_sitio.py
```

La publicación añade una versión a CSS, JavaScript y las solicitudes de datos, para que una actualización use los recursos correspondientes. Las herramientas, la documentación, los archivos de recuperación y los originales que no utiliza la web permanecen fuera de la publicación.

Sitio: [EcoSelva Madre de Dios](https://ecoselva-madre-de-dios.github.io/).
