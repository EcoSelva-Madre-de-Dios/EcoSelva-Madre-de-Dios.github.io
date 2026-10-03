$ErrorActionPreference = 'Stop'
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$profile = Join-Path $env:TEMP ('ecoselva-fauna-' + [Guid]::NewGuid().ToString('N'))
$url = ([Uri](Join-Path (Split-Path (Join-Path $PWD 'recuperacion')) 'index.html')).AbsoluteUri
$null = Start-Process -FilePath $edge -ArgumentList @('--headless','--disable-gpu','--no-first-run','--remote-debugging-port=9247',('--user-data-dir="'+$profile+'"'),'--window-size=1440,1050',$url) -WindowStyle Hidden -PassThru
for ($i=0; $i -lt 30; $i++) { try { $targets=Invoke-RestMethod 'http://127.0.0.1:9247/json/list'; break } catch { [Threading.Thread]::Sleep(150) } }
$target=$targets | Where-Object type -eq 'page' | Select-Object -First 1
$socket=New-Object Net.WebSockets.ClientWebSocket
$null=$socket.ConnectAsync([Uri]$target.webSocketDebuggerUrl,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
$script:sequence=0
$script:earlyErrors=@()
function Cdp($method,$params) {
    $script:sequence++
    $message=@{id=$script:sequence;method=$method;params=$params} | ConvertTo-Json -Depth 15 -Compress
    $bytes=[Text.Encoding]::UTF8.GetBytes($message)
    $segment=New-Object 'ArraySegment[byte]' -ArgumentList @(,$bytes)
    $null=$socket.SendAsync($segment,[Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
    do {
        $stream=New-Object IO.MemoryStream
        do {
            $buffer=New-Object byte[] 65536
            $segment=New-Object 'ArraySegment[byte]' -ArgumentList @(,$buffer)
            $response=$socket.ReceiveAsync($segment,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
            $stream.Write($buffer,0,$response.Count)
        } while (!$response.EndOfMessage)
        $result=[Text.Encoding]::UTF8.GetString($stream.ToArray()) | ConvertFrom-Json
        if($result.method -eq 'Runtime.exceptionThrown'){$script:earlyErrors+=$result.params.exceptionDetails}
        $stream.Dispose()
    } while ($result.id -ne $script:sequence)
    if($result.error) { throw ($result.error | ConvertTo-Json) }
    return $result.result
}
function Eval($expression) { (Cdp 'Runtime.evaluate' @{expression=$expression;awaitPromise=$true;returnByValue=$true}).result.value }
function Assert($condition,$message) { if(!(Eval $condition)){ throw $message }; Write-Output ('OK: '+$message) }
$null=Cdp 'Runtime.enable' @{}
$null=Cdp 'Page.bringToFront' @{}
$null=Cdp 'Page.reload' @{}
[Threading.Thread]::Sleep(1200)
$null=Eval 'window.mapErrors=[];addEventListener("error",e=>mapErrors.push(e.message));document.querySelector("#explora-madre-de-dios").scrollIntoView({behavior:"instant"})'
[Threading.Thread]::Sleep(1000)
$null=Eval 'document.querySelector("[data-territorio-modo=bosques]").click()'
Assert 'document.querySelectorAll(".selva-territorio-svg").length===1' 'Un único SVG activo'
Assert 'document.querySelectorAll("[data-territorio-scene]").length===3' 'Tres escenas'
Assert '[...document.querySelectorAll("[data-mapa-feature]")].every(x=>getComputedStyle(x).display==="none"&&x.tabIndex===-1&&x.style.pointerEvents==="none"&&!x.hasAttribute("role"))' 'Bosques no muestra ríos ni humedales interactivos'
Assert 'document.querySelectorAll(".selva-territorio-acceso").length===4' 'Cuatro ambientes forestales'
Assert 'document.querySelectorAll(".selva-territorio-provincias-nombres text").length===3' 'Tres provincias'
Assert '[...document.querySelectorAll(".selva-territorio-provincias-nombres text")].map(x=>x.textContent).sort().join(",")==="MANU,TAHUAMANU,TAMBOPATA"' 'Nombres reales'
$null=Eval 'window.neutralFill=getComputedStyle(document.querySelector(".selva-territorio-limite")).fill;window.fixedTree=document.querySelector("#territorio-arbol-conceptual").getAttribute("href")'
foreach($key in @('tierra','inundable','aguajal','secundario')){
 $null=Eval ('document.querySelector(''[data-territorio-tema="'+$key+'"]'').click()')
 Assert 'getComputedStyle(document.querySelector(".selva-territorio-limite")).fill===neutralFill && getComputedStyle(document.querySelector(".selva-territorio-dosel-fondo")).display==="none" && document.querySelector("#territorio-arbol-conceptual").getAttribute("href")===fixedTree' 'Bosques conserva base neutral'
}
Assert 'document.querySelector(".selva-territorio-leyenda").textContent==="Distribución cartográfica en preparación."&&!document.querySelector(".selva-territorio-leyenda i")' 'Leyenda pendiente sin colores ficticios'
Assert 'document.querySelector("#territorio-bosques-capa").children.length===0' 'Sin polígonos forestales inventados'
$null=Eval 'document.querySelector("[data-territorio-bosques-todos]").click()'
Assert 'document.querySelector("[data-territorio-bosques-todos]").getAttribute("aria-pressed")==="true"' 'Ver todos'
foreach($mode in @('bosques','rios','humedales')){
 $null=Eval ('document.querySelector(''[data-territorio-modo="'+$mode+'"]'').click()')
 $null=Eval 'document.querySelector("#territorio-provincias").click()'
 Assert '[...document.querySelectorAll(".selva-territorio-provincias-limites,.selva-territorio-provincias-nombres")].every(x=>getComputedStyle(x).display==="none")' 'Ocultar provincias'
 $null=Eval 'document.querySelector("#territorio-provincias").click()'
 Assert '[...document.querySelectorAll(".selva-territorio-provincias-limites,.selva-territorio-provincias-nombres")].every(x=>getComputedStyle(x).display!=="none"&&getComputedStyle(x).pointerEvents==="none")' 'Mostrar provincias sin interacción'
}
$null=Eval 'document.querySelector("[data-territorio-modo=bosques]").click()'
foreach($key in @('tierra','inundable','aguajal','secundario')){
 $null=Eval ('document.querySelector(''[data-territorio-tema="'+$key+'"]'').click()')
 Assert ('document.querySelector(".selva-territorio-layout").dataset.forest==="'+$key+'"') ('Ficha y textura: '+$key)
}
foreach($mode in @('bosques','rios','humedales')){
 $null=Eval ('window.oldY=scrollY;document.querySelector(''[data-territorio-modo="'+$mode+'"]'').click()')
 Assert 'scrollY===oldY' ('Sin salto: '+$mode)
 Assert ('[...document.querySelectorAll("[data-territorio-scene]")].filter(x=>getComputedStyle(x).display!=="none").length===1&&document.querySelector(''[data-territorio-scene="'+$mode+'"]'').getAttribute("aria-hidden")==="false"') ('Exclusividad: '+$mode)
 Assert ('[...document.querySelectorAll("[data-mapa-feature]")].filter(x=>x.dataset.mapaModo!=="'+$mode+'").every(x=>getComputedStyle(x).display==="none"&&x.tabIndex===-1&&!x.hasAttribute("role")&&x.style.pointerEvents==="none")') ('Capas inactivas sin interacción: '+$mode)
 $null=Cdp 'Emulation.setDeviceMetricsOverride' @{width=1440;height=1050;deviceScaleFactor=1;mobile=$false}
 $null=Eval 'document.querySelector("#explora-madre-de-dios").scrollIntoView({behavior:"instant"})'
 [Threading.Thread]::Sleep(750)
 $shot=Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false}
 [IO.File]::WriteAllBytes((Join-Path $PWD ('recuperacion/territorio-provincias-'+$mode+'.png')),[Convert]::FromBase64String($shot.data))
}
Assert 'document.querySelectorAll(".selva-territorio-agua").length===174&&[...document.querySelectorAll(".selva-territorio-agua")].filter(x=>getComputedStyle(x).display!=="none").length===16' 'Humedales: selección inicial de 16, 174 conservados'
$null=Eval 'document.querySelector("[data-territorio-todos]").click()'
Assert '[...document.querySelectorAll(".selva-territorio-agua")].filter(x=>getComputedStyle(x).display!=="none").length===174' 'Mostrar todos los registros'
$null=Eval 'document.querySelector("[data-territorio-todos]").click()'
Assert '[...document.querySelectorAll(".selva-territorio-agua")].filter(x=>getComputedStyle(x).display!=="none").length===16' 'Volver a selección inicial'
$null=Eval 'const p=document.querySelector("#territorio-masa-agua");p.selectedIndex=1;p.dispatchEvent(new Event("change"))'
Assert 'document.querySelector(".selva-territorio-agua.is-selected").dataset.mapaFeature===document.querySelector("#territorio-masa-agua").value' 'Selector de agua sincronizado'
Assert 'document.querySelector(".selva-territorio-detalle-agua path").getAttribute("d")===document.querySelector(".selva-territorio-agua.is-selected .selva-territorio-agua-forma").getAttribute("d")' 'Detalle de agua conserva la geometría fuente'
Assert 'document.querySelector(".selva-territorio-leyenda").textContent.includes("Laguna")&&document.querySelector(".selva-territorio-leyenda").textContent.includes("Pantano")&&!document.querySelector(".selva-territorio-leyenda").textContent.includes("Otra")' 'Leyenda refleja los tipos presentes'
$null=Eval 'document.querySelector("[data-territorio-modo=rios]").click()'
foreach($river in @('madre','tambopata','inambari','piedras','manu','heath')){
 $null=Eval ('document.querySelector(''[data-mapa-feature="'+$river+'"]'').dispatchEvent(new MouseEvent("click",{bubbles:true}))')
 Assert ('document.querySelectorAll(".selva-territorio-rio.is-selected").length===1&&document.querySelector(".selva-territorio-rio.is-selected").dataset.mapaFeature==="'+$river+'"') ('Selección persistente: '+$river)
}
[Threading.Thread]::Sleep(450)
Assert 'document.querySelector(".selva-territorio-svg").viewBox.baseVal.width<600&&document.querySelector(".selva-territorio-svg").viewBox.baseVal.width>300' 'Zoom educativo con contexto'
$null=Eval 'document.querySelector(".selva-territorio-volver-vista").click()'
[Threading.Thread]::Sleep(450)
Assert 'document.querySelector(".selva-territorio-svg").getAttribute("viewBox")==="0 0 600 510"' 'Restablecer territorio completo'
$null=Eval 'document.querySelector("[data-territorio-zoom=in]").click()'
[Threading.Thread]::Sleep(450)
Assert 'document.querySelector(".selva-territorio-svg").viewBox.baseVal.width===480' 'Control +'
$null=Eval 'document.querySelector("[data-territorio-zoom=out]").click()'
[Threading.Thread]::Sleep(450)
Assert 'document.querySelector(".selva-territorio-svg").viewBox.baseVal.width===600' 'Control −'
$null=Eval 'document.querySelector("[data-mapa-feature=tambopata]").dispatchEvent(new PointerEvent("pointerenter",{clientX:300,clientY:700}))'
Assert 'document.querySelector("[data-map-label=tambopata]").classList.contains("is-highlighted")||(!document.querySelector(".selva-territorio-tooltip").hidden&&document.querySelector(".selva-territorio-tooltip").textContent==="Río Tambopata")' 'Etiqueta al explorar'
$null=Eval 'document.querySelector("[data-territorio-modo=rios]").click();document.querySelector("[data-territorio-zoom=reset]").click();document.querySelector(".selva-territorio-canvas").scrollIntoView({behavior:"instant",block:"center"})'
[Threading.Thread]::Sleep(450)
$point=Eval '(()=>{const p=document.querySelector("[data-mapa-feature=tambopata] .selva-territorio-rio-linea");const q=p.getPointAtLength(p.getTotalLength()/2).matrixTransform(p.getScreenCTM());return {x:q.x,y:q.y}})()'
$null=Cdp 'Input.dispatchMouseEvent' @{type='mouseMoved';x=$point.x;y=$point.y}
$null=Cdp 'Input.dispatchMouseEvent' @{type='mousePressed';x=$point.x;y=$point.y;button='left';clickCount=1}
$null=Cdp 'Input.dispatchMouseEvent' @{type='mouseReleased';x=$point.x;y=$point.y;button='left';clickCount=1}
Assert 'document.querySelector("[data-mapa-feature=tambopata]").classList.contains("is-selected")' 'Click real sobre el trazado SVG'
$null=Eval 'document.querySelector("[data-territorio-zoom=in]").click()'
[Threading.Thread]::Sleep(450)
$before=Eval 'document.querySelector(".selva-territorio-svg").viewBox.baseVal.x'
$position=Eval '(()=>{const r=document.querySelector(".selva-territorio-canvas").getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+60}})()'
$null=Cdp 'Input.dispatchMouseEvent' @{type='mousePressed';x=$position.x;y=$position.y;button='left';clickCount=1}
$null=Cdp 'Input.dispatchMouseEvent' @{type='mouseMoved';x=($position.x-35);y=$position.y;buttons=1}
$null=Cdp 'Input.dispatchMouseEvent' @{type='mouseReleased';x=($position.x-35);y=$position.y;button='left';clickCount=1}
[Threading.Thread]::Sleep(150)
$after=Eval 'document.querySelector(".selva-territorio-svg").viewBox.baseVal.x'
if($after-le$before){throw 'Arrastre no desplaza vista'}
Write-Output 'OK: Arrastre real desplaza el mapa ampliado'
Assert 'parseFloat(document.querySelector(".selva-territorio-escala i").style.width)>0' 'Escala calculada desde la proyección del SVG'
$null=Eval 'document.querySelector("[data-territorio-zoom=reset]").click()'
[Threading.Thread]::Sleep(450)
$null=Eval 'document.querySelector("[data-territorio-modo=bosques]").focus()'
$null=Cdp 'Input.dispatchKeyEvent' @{type='keyDown';key='ArrowRight';code='ArrowRight';windowsVirtualKeyCode=39}
Assert 'document.activeElement.dataset.territorioModo==="rios"' 'Pestañas con teclado'
foreach($width in @(1440,820,390,320)){
 $null=Cdp 'Emulation.setDeviceMetricsOverride' @{width=$width;height=1050;deviceScaleFactor=1;mobile=($width-lt640)}
 $null=Eval 'document.querySelector("#explora-madre-de-dios").scrollIntoView({behavior:"instant"})'
 [Threading.Thread]::Sleep(250)
 Assert 'document.documentElement.scrollWidth<=innerWidth' ('Sin desbordamiento a '+$width+' px')
 Eval 'JSON.stringify({width:innerWidth,mapHeight:document.querySelector(".selva-territorio-canvas").offsetHeight,columns:getComputedStyle(document.querySelector(".selva-territorio-layout")).gridTemplateColumns})'
 if($width-eq390){$shot=Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false};[IO.File]::WriteAllBytes((Join-Path $PWD 'recuperacion/territorio-provincias-390.png'),[Convert]::FromBase64String($shot.data))}
}
$null=Cdp 'Emulation.setEmulatedMedia' @{features=@(@{name='prefers-reduced-motion';value='reduce'})}
$null=Eval 'document.querySelector("[data-territorio-modo=humedales]").click()'
Assert 'getComputedStyle(document.querySelector("[data-territorio-scene=humedales]")).animationName==="none"' 'Movimiento reducido'
Assert 'mapErrors.length===0' 'Sin errores JavaScript durante interacción'
$script:earlyErrors | ConvertTo-Json -Depth 8 -Compress
if($script:earlyErrors.Count){throw 'Errores durante la carga'}
$bytes=[Text.Encoding]::UTF8.GetBytes('{"id":999,"method":"Browser.close"}')
$segment=New-Object 'ArraySegment[byte]' -ArgumentList @(,$bytes)
$null=$socket.SendAsync($segment,[Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
$socket.Dispose()