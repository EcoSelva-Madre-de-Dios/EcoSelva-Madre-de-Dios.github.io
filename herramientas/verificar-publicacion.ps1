$ErrorActionPreference = 'Stop'

$utf8 = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
$env:PYTHONIOENCODING = 'utf-8'
$env:PYTHONUTF8 = '1'

$rootPath = if ($PSScriptRoot) { Split-Path $PSScriptRoot -Parent } else { (Get-Location).Path }
Set-Location -LiteralPath $rootPath

function Find-WorkingPython {
    $probeMarker = 'ecoselva-python-ok'
    $candidates = @(
        @{ Command = 'python'; Arguments = @() },
        @{ Command = 'python3'; Arguments = @() },
        @{ Command = 'py'; Arguments = @('-3') }
    )

    foreach ($candidate in $candidates) {
        $pythonCommand = Get-Command $candidate.Command -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
        if (!$pythonCommand) { continue }

        $probeArguments = @($candidate.Arguments) + @('-c', "import sys; sys.stdout.write('$probeMarker')")
        try {
            $probeOutput = & $pythonCommand.Source @probeArguments 2>$null
            $probeExitCode = $LASTEXITCODE
        }
        catch {
            continue
        }

        if ($probeExitCode -eq 0 -and (($probeOutput -join "`n").Trim() -eq $probeMarker)) {
            return [PSCustomObject]@{
                Path = $pythonCommand.Source
                Arguments = @($candidate.Arguments)
            }
        }
    }

    return $null
}

$python = Find-WorkingPython
if (!$python) {
    throw 'Instala Python 3 para ejecutar el verificador local. Se probaron python, python3 y py -3, pero ninguno pudo ejecutar código. GitHub también ejecuta la verificación automáticamente al publicar.'
}

$verificationArguments = @($python.Arguments) + @('herramientas/verificar_sitio.py')
& $python.Path @verificationArguments
if ($LASTEXITCODE -ne 0) { throw 'La verificación del sitio detectó errores.' }
