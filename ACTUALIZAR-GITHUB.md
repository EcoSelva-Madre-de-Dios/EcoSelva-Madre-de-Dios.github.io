# Actualizaciones de EcoSelva sin perder recursos

Reemplaza solamente los archivos afectados, conservando sus nombres. No reemplaces la carpeta completa ni borres `images/`, `imagenesEco/`, `videos/` o `datos/`.

## Antes de editar

Comprueba `git status`. Si hay cambios locales, respáldalos y guárdalos en un commit revisado antes de actualizar desde el remoto. No hagas pull a ciegas sobre cambios pendientes.

Con la carpeta de trabajo limpia, ejecuta `git pull --ff-only origin main` y revisa nuevamente `git status`. Si falla porque las ramas divergen, detente y revisa la diferencia; no uses reset destructivo ni autostash.

## Verificar y preparar el commit

Ejecuta el verificador desde PowerShell sin cambiar la política global de ejecución:

```powershell
& ([scriptblock]::Create([IO.File]::ReadAllText((Join-Path (Get-Location) 'herramientas/verificar-publicacion.ps1'))))
```

Si solo cambias los tres archivos principales:

```text
git add -- index.html style.css script.js
```

La versión actual también usa `ventanas.css` y `ventanas.js`. Inclúyelos expresamente cuando sean nuevos o hayan cambiado. Las imágenes nuevas referenciadas también necesitan incluirse expresamente; copiar el HTML no las publica.

```text
git status
git diff --cached --name-status
git diff --cached --stat
git diff --cached --diff-filter=D --name-only
```

Si aparece una eliminación inesperada, no hagas commit ni push. Conserva los cambios y recupera solo el archivo afectado desde un commit identificado. No uses `git add .`, `git add -A`, `git reset --hard`, `git clean -fd` ni `git restore .`.

Después de revisar los archivos preparados y volver a ejecutar el verificador:

```text
git commit -m "Actualizar EcoSelva"
git push origin main
```

Las copias y pruebas de `recuperacion/` no deben añadirse por accidente. No se ha creado ni modificado `.gitignore` para ocultarlas.

## Después del push

Confirma en GitHub que están los archivos de código y los recursos nuevos, y que `images/`, `videos/` y `datos/` siguen presentes. Tras el despliegue revisa logo, Hero, historias, fauna, Sobre EcoSelva, video y mapa. Si algo falla, revisa primero la ruta exacta y su presencia en GitHub; no vuelvas a reemplazar todo el proyecto.
