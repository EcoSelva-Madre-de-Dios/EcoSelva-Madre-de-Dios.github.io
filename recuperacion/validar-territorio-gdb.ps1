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
$null=Cdp 'Runtime.enable' @{}
$null=Cdp 'Page.reload' @{}
[Threading.Thread]::Sleep(1000)
$null=Cdp 'Page.bringToFront' @{}
$null=Eval 'window.mapErrors=[];addEventListener("error",e=>mapErrors.push(e.message));document.querySelector("#explora-madre-de-dios").scrollIntoView({behavior:"instant"})'
[Threading.Thread]::Sleep(1000)
$null=Eval 'document.querySelector("#explora-madre-de-dios").scrollIntoView({behavior:"instant"});new Function(document.querySelector("script[src*=script]") ? "return true" : "")'
Eval 'JSON.stringify({bosques:document.querySelector(".selva-territorio-ficha h4").textContent,aguaOculta:[...document.querySelectorAll(".selva-territorio-agua")].every(x=>x.style.display==="none")})'
$null=Eval 'window.oldY=scrollY;document.querySelector("[data-territorio-modo=rios]").click()'
Eval 'JSON.stringify({noScroll:oldY===scrollY,riverButtons:document.querySelectorAll(".selva-territorio-opciones button").length,riverGeometries:document.querySelectorAll(".selva-territorio-rio").length})'
foreach($river in @('madre','tambopata','inambari','piedras','manu','heath')) {
 $null=Eval ('document.querySelector(''[data-mapa-feature="'+$river+'"]'').dispatchEvent(new MouseEvent("click",{bubbles:true}))')
 Eval 'JSON.stringify({selected:document.querySelector(".selva-territorio-ficha h4").textContent,onlyOne:document.querySelectorAll(".selva-territorio-rio.is-selected").length===1,metadata:document.querySelector(".selva-territorio-metadatos").textContent})'
}
$null=Eval 'window.oldY=scrollY;document.querySelector("[data-territorio-modo=humedales]").click()'
Eval 'JSON.stringify({noScroll:oldY===scrollY,agua:document.querySelectorAll(".selva-territorio-agua").length,opciones:document.querySelector("#territorio-masa-agua").options.length,visible:[...document.querySelectorAll(".selva-territorio-agua")].every(x=>x.style.display!=="none")})'
$null=Eval 'const s=document.querySelector("#territorio-masa-agua");s.selectedIndex=7;s.dispatchEvent(new Event("change"))'
Eval 'JSON.stringify({aguaSeleccionada:document.querySelector(".selva-territorio-ficha h4").textContent,synchronized:document.querySelector(".selva-territorio-agua.is-selected").dataset.mapaFeature===document.querySelector("#territorio-masa-agua").value})'
foreach($width in @(1440,820,390,320)) {
 $null=Cdp 'Emulation.setDeviceMetricsOverride' @{width=$width;height=1050;deviceScaleFactor=1;mobile=($width-lt640)}
 $null=Eval 'document.querySelector("#explora-madre-de-dios").scrollIntoView({behavior:"instant"})'
 [Threading.Thread]::Sleep(350)
 Eval 'JSON.stringify({width:innerWidth,columns:getComputedStyle(document.querySelector(".selva-territorio-layout")).gridTemplateColumns,mapHeight:document.querySelector(".selva-territorio-svg").getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth,errors:mapErrors})'
 if($width-eq1440-or$width-eq390){$shot=Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false};[IO.File]::WriteAllBytes((Join-Path $PWD ('recuperacion/territorio-gdb-'+$width+'.png')),[Convert]::FromBase64String($shot.data))}
}
$null=Eval 'document.querySelector("[data-territorio-modo=bosques]").focus()'
$null=Cdp 'Input.dispatchKeyEvent' @{type='keyDown';key='ArrowRight';code='ArrowRight';windowsVirtualKeyCode=39}
Eval 'JSON.stringify({keyboardMode:document.activeElement.dataset.territorioModo,previousMapArchived:!!document.querySelector("#selva-territorio-version-anterior-gdb").content.querySelector(".selva-territorio-svg"),previousHotspotsArchived:!!document.querySelector("#selva-territorio-version-anterior-gdb").content.querySelector("#selva-territorio-experiencia-anterior"),errors:mapErrors})'
$bytes=[Text.Encoding]::UTF8.GetBytes('{"id":999,"method":"Browser.close"}')
$segment=New-Object 'ArraySegment[byte]' -ArgumentList @(,$bytes)
$null=$socket.SendAsync($segment,[Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
$socket.Dispose()
$script:earlyErrors | ConvertTo-Json -Depth 8 -Compress