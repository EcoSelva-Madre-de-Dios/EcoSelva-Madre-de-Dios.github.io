$ErrorActionPreference = 'Stop'
$rootPath = if ($PSScriptRoot) { Split-Path $PSScriptRoot -Parent } else { (Get-Location).Path }
Set-Location -LiteralPath $rootPath
$pythonCommand = Get-Command python -ErrorAction SilentlyContinue
if (!$pythonCommand) { $pythonCommand = Get-Command python3 -ErrorAction SilentlyContinue }
if (!$pythonCommand) { throw 'Instala Python 3 para ejecutar el verificador local. GitHub también lo ejecuta automáticamente al publicar.' }
& $pythonCommand.Source herramientas/verificar_sitio.py
if ($LASTEXITCODE -ne 0) { throw 'La verificación del sitio detectó errores.' }
