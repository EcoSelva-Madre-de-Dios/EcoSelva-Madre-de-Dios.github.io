$ErrorActionPreference='Stop'
$utf8=New-Object Text.UTF8Encoding($false)
$html=[IO.File]::ReadAllText((Join-Path $PWD 'index.html'))
$data=[IO.File]::ReadAllText((Join-Path $PWD 'recuperacion/territorio-rios-ider.json'))|ConvertFrom-Json
$names=@{madre='Madre de Dios';tambopata='Tambopata';inambari='Inambari';piedras='Las Piedras';manu='Manu';heath='Heath'}
$groups=''
foreach($key in @('madre','tambopata','inambari','piedras','manu','heath')) {
 $features=@($data.features|Where-Object { ($_.attributes.nombre -replace '^R[ií]o\s+','').Trim() -eq $names[$key] })
 if(!$features.Count){throw "Falta $key"}
 $d=''
 foreach($f in $features){foreach($path in $f.geometry.paths){$first=$true;foreach($point in $path){$x=40+($point[0]+72.429)*101.92195690157253;$y=50+(-9.907-$point[1])*101.92195690157253;$prefix=if($first){'M'}else{'L'};$d+=($prefix+$x.ToString('F1',[cultureinfo]::InvariantCulture)+','+$y.ToString('F1',[cultureinfo]::InvariantCulture)+' ');$first=$false}}}
 $label='Río '+$names[$key]
 $groups+='<g class="selva-territorio-rio" data-mapa-feature="'+$key+'" role="button" tabindex="0" aria-label="'+$label+'" aria-pressed="false"><title>'+$label+'</title><path class="selva-territorio-rio-hit" d="'+$d.Trim()+'"/><path class="selva-territorio-rio-linea" d="'+$d.Trim()+'"/></g>'
 Write-Output "$label : $($features.Count) segmentos oficiales"
}
$html=[regex]::Replace($html,'(<g class="selva-territorio-red" clip-path="url\(#territorio-limite-clip\)">).*?(</g></g><g class="selva-territorio-orientacion")',('$1'+$groups+'$2'),[Text.RegularExpressions.RegexOptions]::Singleline)
$html=$html.Replace('Límite y cinco ríos simplificados de cartografía MINAM. Los símbolos de ambientes no indican ubicación ni extensión. El trazado del río Manu está pendiente de incorporar.','Límite de MINAM y seis ríos simplificados de la Infraestructura de Datos Espaciales Regional Amazónica. Los símbolos de ambientes no indican ubicación ni extensión.')
$html=$html.Replace('MINAM · ServicioBase, Departamento y Nombre Río','MINAM · ServicioBase, Departamento').Replace('Geometrías del límite y cinco ríos;','Geometría del límite;')
$html=$html.Replace('<p>Los ambientes son símbolos ilustrativos, no polígonos cartográficos. Río Manu: trazado pendiente de incorporar desde cartografía verificable.</p>','<p>Los ambientes son símbolos ilustrativos, no polígonos cartográficos.</p>')
$html=$html.Replace('</ol>'+[Environment]::NewLine+'                <p>Los ambientes','<li><a href="https://www.idep.gob.pe/geoportal/rest/services/INSTITUCIONALES/IDER_AMAZONICOS/MapServer/41" target="_blank" rel="noopener noreferrer">IDEP · IDER Amazónicos, Ríos</a>. Recorridos nominales de los seis ríos; año y escala de origen no indicados. Consulta: octubre de 2026. Simplificación a 0,002° y recorte al límite referencial.</li></ol>'+[Environment]::NewLine+'                <p>Los ambientes')
if(!$html.Contains('IDER Amazónicos, Ríos')){ $html=$html.Replace('<p>Los ambientes son símbolos','<p><a href="https://www.idep.gob.pe/geoportal/rest/services/INSTITUCIONALES/IDER_AMAZONICOS/MapServer/41" target="_blank" rel="noopener noreferrer">IDEP · IDER Amazónicos, Ríos</a>: recorridos nominales de los seis ríos; año y escala de origen no indicados. Consulta: octubre de 2026. Simplificación a 0,002° y recorte al límite referencial.</p><p>Los ambientes son símbolos') }
[IO.File]::WriteAllText((Join-Path $PWD 'index.html'),$html,$utf8)
$js=[IO.File]::ReadAllText((Join-Path $PWD 'script.js'))
$js=$js.Replace('https://geoservidorperu.minam.gob.pe/arcgis/rest/services/ServicioBase/MapServer/7','https://www.idep.gob.pe/geoportal/rest/services/INSTITUCIONALES/IDER_AMAZONICOS/MapServer/41').Replace('["heath", "Río Heath"]','["heath", "Río Heath"], ["manu", "Río Manu"]')
$js=$js.Replace('capa nominal de ríos de MINAM','capa de ríos de IDER Amazónicos').Replace('MINAM · Nombre Río; año de origen no indicado','IDEP · IDER Amazónicos, Ríos; año de origen no indicado')
$js=[regex]::Replace($js,'(?m)^\s*topics\.manu = .*?;\r?\n','')
$js=$js.Replace('["madre", "tambopata", "inambari", "piedras", "heath"].includes','["madre", "tambopata", "inambari", "piedras", "heath", "manu"].includes')
[IO.File]::WriteAllText((Join-Path $PWD 'script.js'),$js,$utf8)
$metaPath=Join-Path $PWD 'recuperacion/territorio-procedencia.json'
$meta=[IO.File]::ReadAllText($metaPath)|ConvertFrom-Json
$meta.river_layer=41
$meta.raw_rivers='territorio-rios-ider.json'
$meta.pending_geometry=$null
$meta|Add-Member -NotePropertyName river_geometry_source -NotePropertyValue 'https://www.idep.gob.pe/geoportal/rest/services/INSTITUCIONALES/IDER_AMAZONICOS/MapServer/41' -Force
$meta|Add-Member -NotePropertyName excluded_layer -NotePropertyValue 'MINAM layer 7 Nombre Río: baselines de etiquetas, no recorridos; excluidos del SVG final.' -Force
$meta.processing='Límite MINAM simplificado a 0,005°; ríos IDER Amazónicos simplificados a 0,002°. Coordenadas EPSG:4326 transformadas uniformemente a SVG y ríos recortados al límite referencial. Igual grosor sin equivalencia con anchura ni caudal.'
[IO.File]::WriteAllText($metaPath,($meta|ConvertTo-Json -Depth 10),$utf8)
