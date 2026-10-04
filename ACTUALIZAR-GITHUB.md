# Actualizar EcoSelva

La web se publica automáticamente cuando los cambios llegan a `main` en GitHub. Guardar un archivo en el editor prepara el cambio local; para verlo en la web, confirma el cambio y envíalo al repositorio.

En VS Code puedes usar **Control de código fuente → Confirmar → Sincronizar cambios**. Antes de sincronizar, revisa qué archivos estás enviando. Si Git indica que existen cambios remotos o conflictos, intégralos conservando tus cambios; no reemplaces toda la carpeta.

El flujo **Verificar y publicar EcoSelva** comprueba JavaScript, rutas, enlaces, Google Analytics y el SVG antes de publicar. Para usarlo como única fuente, selecciona **GitHub Actions** en **Settings → Pages → Build and deployment → Source**. Así, si falla una comprobación, mantiene la versión anterior de la web y muestra el error en la pestaña **Actions** del repositorio.

Mientras siga seleccionada la publicación desde la rama `main`, GitHub también ejecuta su publicación habitual; `_config.yml` excluye las copias y los archivos internos de ese método. Evita mantener ambas publicaciones activas seleccionando **GitHub Actions** una sola vez.

La publicación incluye solo los archivos utilizados por las páginas. `recuperacion/`, las herramientas, los originales y los datos que no utiliza la web se conservan en el repositorio y quedan fuera del sitio público. No borres recursos solo porque no se utilicen en la página principal.

Para revisar los cambios localmente, con Python 3:

```text
python herramientas/verificar_sitio.py
```

Sitio: https://ecoselva-madre-de-dios.github.io/
