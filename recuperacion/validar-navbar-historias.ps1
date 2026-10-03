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
        $stream.Dispose()
    } while ($result.id -ne $script:sequence)
    if($result.error) { throw ($result.error | ConvertTo-Json) }
    return $result.result
}
function Eval($expression) { (Cdp 'Runtime.evaluate' @{expression=$expression;awaitPromise=$true;returnByValue=$true}).result.value }
$null=Cdp 'Runtime.enable' @{}
$null=Eval 'window.checkErrors=[];addEventListener("error",e=>checkErrors.push(e.message));addEventListener("unhandledrejection",e=>checkErrors.push(String(e.reason)));'
[Threading.Thread]::Sleep(1200)
$null=Eval 'window.scrollTo({top:0,behavior:"instant"})'
[Threading.Thread]::Sleep(300)
Eval 'JSON.stringify({navbarCount:document.querySelectorAll(".menu.container").length,parent:document.querySelector(".menu.container").parentElement.tagName,initialHeight:document.querySelector(".menu.container").getBoundingClientRect().height,logo:document.querySelector(".logo img").getBoundingClientRect().height,transitionHeight:document.querySelector(".selva-introduccion").getBoundingClientRect().height,accesses:[...document.querySelectorAll(".selva-introduccion-accesos a")].map(a=>({target:a.hash,exists:!!document.querySelector(a.hash)}))})'
foreach($target in @('#sabias-que','#programas','#ambiente','#explora-madre-de-dios','#quienes-somos','#investigaciones','#colabora','#contacto','footer')) {
    $null=Eval ('document.querySelector("'+$target+'").scrollIntoView({behavior:"instant"})')
    [Threading.Thread]::Sleep(240)
    Eval 'JSON.stringify({scroll:Math.round(scrollY),navbarHeight:document.querySelector(".menu.container").getBoundingClientRect().height,logoHeight:document.querySelector(".logo img").getBoundingClientRect().height,navbarTop:document.querySelector(".menu.container").getBoundingClientRect().top,visibleAtTop:!!document.elementFromPoint(30,30)?.closest(".menu.container")})'
}
$null=Eval 'document.querySelector("#sabias-que").scrollIntoView({behavior:"instant"})'
[Threading.Thread]::Sleep(600)
$coords=Eval '({x:document.querySelector(".selva-flip-card").getBoundingClientRect().left+30,y:document.querySelector(".selva-flip-card").getBoundingClientRect().top+30})'
$null=Cdp 'Input.dispatchMouseEvent' @{type='mouseMoved';x=$coords.x;y=$coords.y}
[Threading.Thread]::Sleep(300)
Eval 'JSON.stringify({hoverTransform:getComputedStyle(document.querySelector(".selva-flip-inner")).transform,storyCount:document.querySelectorAll(".selva-flip-card").length,cardHeight:document.querySelector(".selva-flip-card").getBoundingClientRect().height})'
for($i=0;$i-lt6;$i++) {
    $null=Eval ('document.querySelectorAll(".selva-flip-toggle")['+$i+'].click()')
    [Threading.Thread]::Sleep(150)
    Eval ('JSON.stringify({category:document.querySelector(".selva-historia-categoria").textContent,open:document.querySelector("#selva-historia-modal").open,contentIdentical:document.querySelector(".selva-historia-cuerpo").innerHTML===document.querySelectorAll(".selva-flip-back")['+$i+'].innerHTML,imageLoaded:document.querySelector(".selva-historia-visual img").naturalWidth>0,dialogs:document.querySelectorAll("#selva-historia-modal").length})')
    $null=Eval 'document.querySelector(".selva-historia-cerrar").click()'
    Eval ('JSON.stringify({focusRestored:document.activeElement===document.querySelectorAll(".selva-flip-toggle")['+$i+'],overflowRestored:document.body.style.overflow})')
}
$null=Eval 'document.querySelectorAll(".selva-flip-toggle")[1].click()'
$null=Cdp 'Input.dispatchKeyEvent' @{type='keyDown';key='Tab';code='Tab';windowsVirtualKeyCode=9;modifiers=8}
Eval 'JSON.stringify({trapBack:document.activeElement===document.querySelector(".selva-historia-cuerpo a:last-of-type")||document.activeElement.closest("#selva-historia-modal")!==null})'
$null=Cdp 'Input.dispatchKeyEvent' @{type='keyDown';key='Escape';code='Escape';windowsVirtualKeyCode=27}
[Threading.Thread]::Sleep(100)
Eval 'JSON.stringify({escapeClosed:!document.querySelector("#selva-historia-modal").open})'
$null=Eval 'document.querySelectorAll(".selva-flip-toggle")[0].click()'
$null=Cdp 'Input.dispatchMouseEvent' @{type='mousePressed';x=3;y=100;button='left';clickCount=1}
$null=Cdp 'Input.dispatchMouseEvent' @{type='mouseReleased';x=3;y=100;button='left';clickCount=1}
Eval 'JSON.stringify({backdropClosed:!document.querySelector("#selva-historia-modal").open})'
$null=Eval 'document.querySelectorAll(".selva-flip-toggle")[0].click()'
$shot=Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false}
[IO.File]::WriteAllBytes((Join-Path $PWD 'recuperacion/historias-modal-desktop.png'),[Convert]::FromBase64String($shot.data))
$null=Eval 'document.querySelector(".selva-historia-cerrar").click()'
foreach($width in @(820,390,320)) {
    $null=Cdp 'Emulation.setDeviceMetricsOverride' @{width=$width;height=844;deviceScaleFactor=1;mobile=($width-lt640)}
    $null=Eval 'document.querySelector("#sabias-que").scrollIntoView({behavior:"instant"})'
    [Threading.Thread]::Sleep(250)
    Eval 'JSON.stringify({width:innerWidth,columns:getComputedStyle(document.querySelector(".selva-flip-grid")).gridTemplateColumns,overflow:document.documentElement.scrollWidth>innerWidth,navbarHeight:document.querySelector(".menu.container").getBoundingClientRect().height})'
    $null=Eval 'document.querySelectorAll(".selva-flip-toggle")[1].click()'
    [Threading.Thread]::Sleep(100)
    Eval 'JSON.stringify({modalWidth:document.querySelector("#selva-historia-modal").getBoundingClientRect().width,overflow:document.querySelector("#selva-historia-modal").scrollWidth>innerWidth,closeTop:document.querySelector(".selva-historia-cerrar").getBoundingClientRect().top})'
    if($width-eq390){$shot=Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false};[IO.File]::WriteAllBytes((Join-Path $PWD 'recuperacion/historias-modal-movil.png'),[Convert]::FromBase64String($shot.data))}
    $null=Eval 'document.querySelector(".selva-historia-cerrar").click()'
}
$null=Eval 'document.querySelector("#menu").checked=true;document.querySelector(".navbar a[href=\"#programas\"]").click()'
[Threading.Thread]::Sleep(800)
Eval 'JSON.stringify({mobileMenuClosed:!document.querySelector("#menu").checked,errors:checkErrors})'
$bytes=[Text.Encoding]::UTF8.GetBytes('{"id":999,"method":"Browser.close"}')
$segment=New-Object 'ArraySegment[byte]' -ArgumentList @(,$bytes)
$null=$socket.SendAsync($segment,[Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
$socket.Dispose()