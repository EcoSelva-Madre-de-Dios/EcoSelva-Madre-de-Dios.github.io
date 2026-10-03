$ErrorActionPreference = 'Stop'
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$profile = Join-Path $env:TEMP ('ecoselva-fauna-' + [Guid]::NewGuid().ToString('N'))
$url = ([Uri](Join-Path (Split-Path (Join-Path $PWD 'recuperacion')) 'index.html')).AbsoluteUri
$null = Start-Process -FilePath $edge -ArgumentList @('--headless','--disable-extensions','--disable-gpu','--no-first-run','--remote-debugging-port=9263',('--user-data-dir="'+$profile+'"'),'--window-size=1440,1050',$url) -WindowStyle Hidden -PassThru
for ($i=0; $i -lt 30; $i++) { try { $targets=Invoke-RestMethod 'http://127.0.0.1:9263/json/list'; break } catch { [Threading.Thread]::Sleep(150) } }
$target=$targets | Where-Object { $_.type -eq 'page' -and $_.url -like '*index.html*' } | Select-Object -First 1
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
[Threading.Thread]::Sleep(3500)
$null=Eval 'window.mapErrors=[];addEventListener("error",e=>mapErrors.push(e.message));document.querySelector("#explora-madre-de-dios").scrollIntoView({behavior:"instant"})'
[Threading.Thread]::Sleep(1000)
$null=Eval 'document.querySelector("[data-territorio-modo=bosques]").click()'
Assert '[...document.querySelectorAll("[data-mapa-feature=cobertura-r],[data-mapa-feature=cobertura-l-co]")].every(e=>getComputedStyle(e).display==="none"&&e.getAttribute("aria-hidden")==="true"&&e.tabIndex===-1&&!e.hasAttribute("role"))' 'Clases de agua ocultas y no interactivas en Bosques'
Assert '!document.querySelector("[data-territorio-tema=cobertura-r]")&&!document.querySelector("[data-territorio-tema=cobertura-l-co]")&&!document.querySelector(".selva-territorio-leyenda").textContent.includes("Lagunas, lagos y cochas")' 'Lista y leyenda sin clases de agua'
Assert 'document.querySelectorAll(".selva-territorio-svg").length===1' 'Un único SVG activo'
Assert 'document.querySelectorAll("[data-territorio-scene]").length===3' 'Tres escenas'
Assert 'document.querySelectorAll(".selva-territorio-bosque-real:not([data-mapa-feature=cobertura-r]):not([data-mapa-feature=cobertura-l-co])").length===25' '27 categorías oficiales'
Assert '[...document.querySelectorAll(".selva-territorio-bosque-real:not([data-mapa-feature=cobertura-r]):not([data-mapa-feature=cobertura-l-co])")].every(x=>getComputedStyle(x).display!=="none"&&x.style.opacity==="0.9")' 'Todos muestra mosaico completo'
Assert 'document.querySelector(".selva-territorio-opciones").firstElementChild.textContent==="Todos"' 'Todos como primera opción'
Assert 'document.querySelectorAll(".selva-territorio-leyenda .selva-territorio-color").length===25' 'Leyenda de categorías reales'
$null=Eval 'window.cov=JSON.parse(document.getElementById("selva-territorio-cobertura-datos").textContent);cov.categories=cov.categories.filter(c=>!["R","L/Co"].includes(c.codigo_original));window.keys=cov.categories.map(x=>x.id)'
Assert 'cov.categories.every(c=>{const p=document.querySelector(`[data-forest-category="${c.id}"]`);return p.style.fill.toLowerCase()===c.color.toLowerCase()||getComputedStyle(p).fill===getComputedStyle([...document.querySelectorAll(".selva-territorio-leyenda .selva-territorio-color")][cov.categories.indexOf(c)]).backgroundColor})' 'Colores de mapa y leyenda coinciden'
foreach($idx in 0..24){
 $null=Eval ('document.querySelector(`[data-territorio-tema="${keys['+$idx+']}"]`).click()')
 Assert ('[...document.querySelectorAll(".selva-territorio-bosque-real:not([data-mapa-feature=cobertura-r]):not([data-mapa-feature=cobertura-l-co])")].every(p=>p.style.opacity===(p.dataset.mapaFeature===keys['+$idx+']?"0.9":"0.14"))') 'Filtro solo sobre categoría seleccionada'
 Assert ('document.querySelector(".selva-territorio-ficha h4").textContent===cov.categories['+$idx+'].categoria_original') 'Ficha conserva nombre original'
}
$null=Eval 'document.querySelector("[data-territorio-bosques-todos]").click()'
Assert '[...document.querySelectorAll(".selva-territorio-bosque-real:not([data-mapa-feature=cobertura-r]):not([data-mapa-feature=cobertura-l-co])")].every(x=>x.style.opacity==="0.9")' 'Todos restaura mosaico'
$null=Eval 'document.querySelector(".selva-territorio-bosque-real:not([data-mapa-feature=cobertura-r]):not([data-mapa-feature=cobertura-l-co])").dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}))'
Assert 'document.querySelector(".selva-territorio-bosque-real:not([data-mapa-feature=cobertura-r]):not([data-mapa-feature=cobertura-l-co])").getAttribute("aria-pressed")==="true"' 'Selección de polígono por teclado'
$null=Eval 'document.querySelector("[data-territorio-bosques-todos]").click()'
$null=Eval 'window.hit=null;const svg=document.querySelector(".selva-territorio-svg"),rect=svg.getBoundingClientRect();outer:for(let y=Math.max(90,rect.top);y<Math.min(innerHeight-30,rect.bottom);y+=5){for(let x=rect.left;x<rect.right;x+=5){const e=document.elementFromPoint(x,y)?.closest(".selva-territorio-bosque-real:not([data-mapa-feature=cobertura-r]):not([data-mapa-feature=cobertura-l-co])");if(e){hit={x,y,key:e.dataset.mapaFeature,name:e.getAttribute("aria-label")};break outer}}}'
Assert '!!hit' 'Polígono real disponible para clic'
$point=Eval 'hit'
$null=Cdp 'Input.dispatchMouseEvent' @{type='mouseMoved';x=$point.x;y=$point.y}
Assert 'document.querySelector(".selva-territorio-tooltip").textContent===hit.name&&!document.querySelector(".selva-territorio-tooltip").hidden' 'Tooltip con nombre oficial'
$null=Cdp 'Input.dispatchMouseEvent' @{type='mousePressed';x=$point.x;y=$point.y;button='left';clickCount=1}
$null=Cdp 'Input.dispatchMouseEvent' @{type='mouseReleased';x=$point.x;y=$point.y;button='left';clickCount=1}
Assert 'document.querySelector(`[data-territorio-tema="${hit.key}"]`).getAttribute("aria-pressed")==="true"' 'Clic real sincroniza categoría y panel'
$null=Eval 'document.querySelector("[data-territorio-bosques-todos]").click()'
foreach($mode in @('bosques','rios','humedales')){
 $null=Eval ('document.querySelector(''[data-territorio-modo="'+$mode+'"]'').click()')
 $null=Eval 'document.querySelector("#territorio-provincias").click()'
 Assert '[...document.querySelectorAll(".selva-territorio-provincias-limites,.selva-territorio-provincias-nombres")].every(x=>getComputedStyle(x).display==="none")' 'Ocultar provincias'
 $null=Eval 'document.querySelector("#territorio-provincias").click()'
 Assert '[...document.querySelectorAll(".selva-territorio-provincias-limites,.selva-territorio-provincias-nombres")].every(x=>getComputedStyle(x).display!=="none"&&getComputedStyle(x).pointerEvents==="none")' 'Mostrar provincias sin interacción'
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
 [IO.File]::WriteAllBytes((Join-Path $PWD ('recuperacion/territorio-cobertura-'+$mode+'.png')),[Convert]::FromBase64String($shot.data))
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
 if($width-eq390){$shot=Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false};[IO.File]::WriteAllBytes((Join-Path $PWD 'recuperacion/territorio-cobertura-390.png'),[Convert]::FromBase64String($shot.data))}
}
$null=Eval 'document.querySelector("[data-territorio-modo=bosques]").click()'
Assert 'document.querySelectorAll(".selva-territorio-bosque-real:not([data-mapa-feature=cobertura-r]):not([data-mapa-feature=cobertura-l-co])").length===25&&document.querySelector(".selva-territorio-opciones").scrollHeight>document.querySelector(".selva-territorio-opciones").clientHeight' 'Móvil: lista completa accesible por desplazamiento'
Assert 'document.documentElement.scrollWidth<=innerWidth' 'Bosques móvil sin desbordamiento'
$null=Eval 'document.querySelector("[data-territorio-tema=cobertura-bi-pal]").click()'
Assert 'document.querySelector(".selva-territorio-ficha h4").textContent==="Bosque inundable de palmeras"' 'Selección móvil de categoría oficial'
Assert 'document.querySelector(".selva-territorio-provincias-nombres").getComputedTextLength===undefined&&getComputedStyle(document.querySelector(".selva-territorio-provincias-nombres")).display!=="none"' 'Provincias conservadas en móvil'
$null=Cdp 'Emulation.setDeviceMetricsOverride' @{width=390;height=1050;deviceScaleFactor=1;mobile=$true}
$null=Eval 'document.querySelector(".selva-territorio-canvas").scrollIntoView({behavior:"instant",block:"center"});document.querySelector("[data-territorio-bosques-todos]").click()'
[Threading.Thread]::Sleep(250)
$shot=Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false}
[IO.File]::WriteAllBytes((Join-Path $PWD 'recuperacion/territorio-cobertura-bosques-390.png'),[Convert]::FromBase64String($shot.data))
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