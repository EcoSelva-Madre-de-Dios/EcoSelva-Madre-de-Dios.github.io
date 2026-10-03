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
$null=Eval 'window.envErrors=[];addEventListener("error",e=>envErrors.push(e.message))'
[Threading.Thread]::Sleep(1000)
$null=Eval 'document.querySelector("#ambiente").scrollIntoView({behavior:"instant"})'
[Threading.Thread]::Sleep(400)
Eval 'JSON.stringify({areas:document.querySelectorAll(".selva-ambiente-area").length,oldHidden:getComputedStyle(document.querySelector(".selva-ambiente-temas")).display,topics:document.querySelectorAll(".selva-ambiente-temas li").length,cardHeight:document.querySelector(".selva-ambiente-area").getBoundingClientRect().height})'
for($i=0;$i-lt4;$i++) {
    $null=Eval ('window.beforeY=scrollY;document.querySelectorAll(".selva-ambiente-explorar")['+$i+'].click()')
    Eval 'JSON.stringify({title:document.querySelector("#selva-ambiente-modal-titulo").textContent,topics:[...document.querySelectorAll(".selva-ambiente-opciones strong")].map(x=>x.textContent),noScroll:scrollY===beforeY,oneDialog:document.querySelectorAll("dialog[open]").length===1})'
    $null=Eval 'document.querySelector(".selva-ambiente-opciones button").click()'
    Eval 'JSON.stringify({topicView:document.querySelector("#selva-ambiente-modal-titulo").textContent,back:!document.querySelector(".selva-ambiente-volver").hidden})'
    $null=Eval 'document.querySelector(".selva-ambiente-volver").click();document.querySelector(".selva-ambiente-cerrar").click()'
    Eval ('JSON.stringify({focus:document.activeElement===document.querySelectorAll(".selva-ambiente-explorar")['+$i+'],scrollRestored:document.body.style.overflow===""})')
}
foreach($width in @(1440,820,390,320)) {
    $null=Cdp 'Emulation.setDeviceMetricsOverride' @{width=$width;height=1050;deviceScaleFactor=1;mobile=($width-lt640)}
    $null=Eval 'document.querySelector("#ambiente").scrollIntoView({behavior:"instant"})'
    [Threading.Thread]::Sleep(250)
    Eval 'JSON.stringify({width:innerWidth,columns:getComputedStyle(document.querySelector(".selva-ambiente-areas")).gridTemplateColumns,overflow:document.documentElement.scrollWidth>innerWidth})'
    if($width-eq1440){$shot=Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false};[IO.File]::WriteAllBytes((Join-Path $PWD 'recuperacion/ambiente-areas-desktop.png'),[Convert]::FromBase64String($shot.data))}
    $null=Eval 'document.querySelector(".selva-ambiente-explorar").click()'
    Eval 'JSON.stringify({modalOverflow:document.querySelector("#selva-ambiente-modal").scrollWidth>innerWidth,closeTop:document.querySelector(".selva-ambiente-cerrar").getBoundingClientRect().top,errors:envErrors})'
    if($width-eq390){$shot=Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false};[IO.File]::WriteAllBytes((Join-Path $PWD 'recuperacion/ambiente-modal-movil.png'),[Convert]::FromBase64String($shot.data))}
    $null=Cdp 'Input.dispatchKeyEvent' @{type='keyDown';key='Escape';code='Escape';windowsVirtualKeyCode=27}
    [Threading.Thread]::Sleep(100)
    Eval 'JSON.stringify({escapeClosed:!document.querySelector("#selva-ambiente-modal").open})'
}
$bytes=[Text.Encoding]::UTF8.GetBytes('{"id":999,"method":"Browser.close"}')
$segment=New-Object 'ArraySegment[byte]' -ArgumentList @(,$bytes)
$null=$socket.SendAsync($segment,[Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
$socket.Dispose()