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
$null=Cdp 'Page.bringToFront' @{}
$null=Cdp 'Emulation.setEmulatedMedia' @{features=@(@{name='prefers-reduced-motion';value='no-preference'})}
$null=Eval 'window.videoErrors=[];addEventListener("error",e=>videoErrors.push(e.message));document.querySelector("#investigaciones").scrollIntoView({behavior:"instant"})'
[Threading.Thread]::Sleep(1000)
$null=Eval 'document.querySelector("#investigaciones").scrollIntoView({behavior:"instant"})'
[Threading.Thread]::Sleep(1800)
Eval 'JSON.stringify({sources:[...document.querySelectorAll(".selva-investigaciones-video source")].map(x=>x.src),muted:document.querySelector(".selva-investigaciones-video").muted,ready:document.querySelector(".selva-investigaciones-video").readyState,playing:document.querySelector("#investigaciones").classList.contains("is-video-playing"),hidden:document.hidden,reduced:matchMedia("(prefers-reduced-motion: reduce)").matches,errors:videoErrors})'
foreach($width in @(1440,820,390,320)) {
 $null=Cdp 'Emulation.setDeviceMetricsOverride' @{width=$width;height=900;deviceScaleFactor=1;mobile=($width-lt640)}
 $null=Eval 'document.querySelector("#investigaciones").scrollIntoView({behavior:"instant"})'
 [Threading.Thread]::Sleep(350)
 Eval 'JSON.stringify({width:innerWidth,height:document.querySelector("#investigaciones").offsetHeight,overflow:document.documentElement.scrollWidth>innerWidth,sources:[...document.querySelectorAll(".selva-investigaciones-video source")].map(x=>x.src),state:document.querySelector(".selva-investigaciones-video").readyState,connection:navigator.connection?.effectiveType,saveData:navigator.connection?.saveData,script:document.scripts[0]?.src,color:getComputedStyle(document.querySelector("#investigaciones h2")).color})'
 if($width-eq1440-or$width-eq390){$shot=Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false};[IO.File]::WriteAllBytes((Join-Path $PWD ('recuperacion/investigaciones-'+$width+'.png')),[Convert]::FromBase64String($shot.data))}
}
$null=Cdp 'Emulation.setEmulatedMedia' @{features=@(@{name='prefers-reduced-motion';value='reduce'})}
[Threading.Thread]::Sleep(200)
Eval 'JSON.stringify({reducedMotion:matchMedia("(prefers-reduced-motion: reduce)").matches,paused:document.querySelector(".selva-investigaciones-video").paused,visibleVideo:getComputedStyle(document.querySelector(".selva-investigaciones-video")).opacity,poster:document.querySelector(".selva-investigaciones-video").poster,hidden:document.hidden,reduced:matchMedia("(prefers-reduced-motion: reduce)").matches,errors:videoErrors})'
$null=Cdp 'Emulation.setEmulatedMedia' @{features=@(@{name='prefers-reduced-motion';value='no-preference'})}
$null=Eval 'document.querySelector(".selva-investigaciones-video").dispatchEvent(new Event("error"))'
Eval 'JSON.stringify({errorFallback:!document.querySelector("#investigaciones").classList.contains("is-video-playing")})'
$bytes=[Text.Encoding]::UTF8.GetBytes('{"id":999,"method":"Browser.close"}')
$segment=New-Object 'ArraySegment[byte]' -ArgumentList @(,$bytes)
$null=$socket.SendAsync($segment,[Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
$socket.Dispose()