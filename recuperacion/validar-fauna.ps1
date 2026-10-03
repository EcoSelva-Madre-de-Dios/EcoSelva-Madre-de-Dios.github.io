$ErrorActionPreference = 'Stop'
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$profile = Join-Path $env:TEMP ('ecoselva-fauna-' + [Guid]::NewGuid().ToString('N'))
$url = ([Uri](Join-Path (Split-Path $PSScriptRoot) 'index.html')).AbsoluteUri
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
$null=Eval 'window.faunaErrors=[];window.addEventListener("error",e=>faunaErrors.push(e.message));window.addEventListener("unhandledrejection",e=>faunaErrors.push(String(e.reason)));'
[Threading.Thread]::Sleep(1500)
Eval 'JSON.stringify({defaultFlora:!document.querySelector("#selva-biodiversidad-panel-flora").hidden,faunaHidden:document.querySelector("#selva-biodiversidad-panel-fauna").hidden})'
$null=Eval 'document.querySelector("#selva-biodiversidad-tab-fauna").click();document.querySelector("#programas").scrollIntoView({behavior:"instant"});'
[Threading.Thread]::Sleep(2200)
foreach($width in @(1440,820,390,320)) {
    $null=Cdp 'Emulation.setDeviceMetricsOverride' @{width=$width;height=1050;deviceScaleFactor=1;mobile=($width -lt 640)}
    [Threading.Thread]::Sleep(250)
    Eval 'JSON.stringify({width:innerWidth,columns:getComputedStyle(document.querySelector(".selva-fauna-stats")).gridTemplateColumns,counters:[...document.querySelectorAll("[data-fauna-count]")].map(x=>x.textContent),overflow:document.documentElement.scrollWidth>innerWidth,errors:faunaErrors})'
}
$null=Eval 'document.querySelector("#selva-biodiversidad-tab-flora").click();document.querySelector("#selva-biodiversidad-tab-fauna").click();'
Eval 'JSON.stringify({afterSwitch:[...document.querySelectorAll("[data-fauna-count]")].map(x=>x.textContent),url:location.hash})'
$null=Cdp 'Emulation.setDeviceMetricsOverride' @{width=1440;height=1050;deviceScaleFactor=1;mobile=$false}
$null=Eval 'window.scrollTo({top:scrollY+document.querySelector("#programas").getBoundingClientRect().top-120,behavior:"instant"})'
[Threading.Thread]::Sleep(250)
$shot=Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false}
[IO.File]::WriteAllBytes((Join-Path $PSScriptRoot 'fauna-desktop.png'),[Convert]::FromBase64String($shot.data))
$null=Cdp 'Emulation.setEmulatedMedia' @{features=@(@{name='prefers-reduced-motion';value='reduce'})}
$null=Cdp 'Page.reload' @{}
[Threading.Thread]::Sleep(1000)
Eval 'JSON.stringify({reducedMotion:matchMedia("(prefers-reduced-motion: reduce)").matches,counters:[...document.querySelectorAll("[data-fauna-count]")].map(x=>x.textContent)})'
$message=[Text.Encoding]::UTF8.GetBytes('{"id":999,"method":"Browser.close"}')
$segment=New-Object 'ArraySegment[byte]' -ArgumentList @(,$message)
$null=$socket.SendAsync($segment,[Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
$socket.Dispose()
