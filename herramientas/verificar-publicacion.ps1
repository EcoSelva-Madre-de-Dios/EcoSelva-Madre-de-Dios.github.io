$ErrorActionPreference = 'Stop'
$rootPath = if ($PSScriptRoot) { Split-Path $PSScriptRoot -Parent } else { (Get-Location).Path }
Set-Location -LiteralPath $rootPath
$gitCommand = Get-Command git -ErrorAction SilentlyContinue
$gitPath = if ($gitCommand) { $gitCommand.Source } else { 'C:\Program Files\Git\cmd\git.exe' }
if (!(Test-Path -LiteralPath $gitPath)) { throw 'Git no disponible.' }
$sources = @('index.html', 'style.css', 'script.js', 'ventanas.css', 'ventanas.js', 'fuentes-metodologia.html')
$resources = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
foreach ($source in $sources) {
    if (!(Test-Path -LiteralPath $source)) { throw "Falta archivo de codigo: $source" }
    $content = [IO.File]::ReadAllText((Join-Path $rootPath $source))
    if ($content -match '(?m)^(<<<<<<<|=======|>>>>>>>)') { throw "Conflicto Git en $source" }
    $pattern = '(?:\b(?:src|href|poster|data-src)\s*=\s*["'']([^"'']+)["''])|url\(\s*["'']?([^\)"'']+)["'']?\s*\)|["'']((?:images|imagenesEco|videos|datos)/[^"''\r\n]+)["'']'
    foreach ($match in [regex]::Matches($content, $pattern)) {
        $resource = @($match.Groups[1].Value, $match.Groups[2].Value, $match.Groups[3].Value) | Where-Object { $_ } | Select-Object -First 1
        if ($resource -match '^(https?:|data:|#|mailto:|tel:)' -or $resource.Contains('${')) { continue }
        # Las cadenas srcset contienen varias rutas seguidas de su descriptor.
        foreach ($candidate in ($resource -split ',\s*(?=(?:images|imagenesEco)/)')) {
            $candidate = ($candidate -replace '\s+\d+(?:w|x)$', '') -replace '[?#].*$', ''
            [void]$resources.Add($candidate.Trim())
        }
    }
}
foreach ($resource in $resources) {
    $cursor = $rootPath
    foreach ($part in ($resource -split '/')) {
        if ($part -eq '..') { throw "Ruta fuera del proyecto: $resource" }
        if ($part -eq '.') { continue }
        $entries = @(Get-ChildItem -LiteralPath $cursor -Force)
        $exact = $entries | Where-Object { $_.Name -ceq $part } | Select-Object -First 1
        if (!$exact) { throw "Ruta inexistente o mayusculas distintas: $resource (segmento: $part)" }
        $cursor = $exact.FullName
    }
    if (!(Test-Path -LiteralPath $cursor -PathType Leaf)) { throw "No es archivo: $resource" }
}
$deleted = @(& $gitPath diff --name-only --diff-filter=D; & $gitPath diff --cached --name-only --diff-filter=D) | Where-Object { $_ }
if ($deleted.Count) { throw ('Eliminaciones detectadas. No publicar: ' + ($deleted -join ', ')) }
$ignored = @($resources | & $gitPath check-ignore --stdin)
if ($ignored.Count) { throw ('Recursos ignorados por Git: ' + ($ignored -join ', ')) }
& $gitPath diff --check
if ($LASTEXITCODE -ne 0) { throw 'Revisar errores de diff.' }
Write-Output "OK: $($resources.Count) rutas verificadas; sin eliminaciones ni recursos ignorados."
Write-Output 'Dependencias de codigo que deben publicarse juntas: index.html, style.css, script.js, ventanas.css, ventanas.js.'
Write-Output 'Recursos aun no registrados en Git:'
foreach ($resource in ($resources | Sort-Object)) {
    $tracked = @(& $gitPath ls-files -- $resource)
    if (!$tracked.Count) { Write-Output $resource }
}
exit 0
