$ErrorActionPreference = 'Stop'
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$profile = Join-Path $env:TEMP ('ecoselva-fauna-' + [Guid]::NewGuid().ToString('N'))
$url = ([Uri](Join-Path (Split-Path (Join-Path $PWD 'recuperacion')) 'index.html')).AbsoluteUri
$null = Start-Process -FilePath $edge -ArgumentList @('--headless','--disable-extensions','--disable-gpu','--no-first-run','--remote-debugging-port=9313',('--user-data-dir="'+$profile+'"'),'--window-size=1440,1050',$url) -WindowStyle Hidden -PassThru
for ($i=0; $i -lt 30; $i++) { try { $targets=Invoke-RestMethod 'http://127.0.0.1:9313/json/list'; break } catch { [Threading.Thread]::Sleep(150) } }
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
$null=Cdp 'Page.reload' @{}
[Threading.Thread]::Sleep(3000)
foreach($width in @(1440,1024,820,640,390,320)){
 $null=Cdp 'Emulation.setDeviceMetricsOverride' @{width=$width;height=1050;deviceScaleFactor=1;mobile=($width-lt640)}
 $null=Eval 'document.querySelector("#selva-introduccion").scrollIntoView({behavior:"instant"});window.overlap=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1'
 Assert '[...document.querySelectorAll(".selva-introduccion-accesos a")].every(a=>{const title=a.querySelector("strong").getBoundingClientRect(),sub=a.querySelector("span:not([aria-hidden])").getBoundingClientRect(),effect=a.querySelector(".selva-intro-micro").getBoundingClientRect(),arrow=a.querySelector("span[aria-hidden]").getBoundingClientRect();return !overlap(title,sub)&&!overlap(title,effect)&&!overlap(sub,effect)&&!overlap(title,arrow)&&!overlap(sub,arrow)})' ('Textos y efectos separados a '+$width+' px')
 Assert 'document.documentElement.scrollWidth<=innerWidth' ('Sin desbordamiento a '+$width+' px')
}
$null=Cdp 'Emulation.setDeviceMetricsOverride' @{width=1440;height=1050;deviceScaleFactor=1;mobile=$false}
$null=Eval 'document.querySelector("#selva-introduccion").scrollIntoView({behavior:"instant"})'
$point=Eval '(()=>{const r=document.querySelector(".selva-introduccion-accesos a").getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()'
$null=Cdp 'Input.dispatchMouseEvent' @{type='mouseMoved';x=$point.x;y=$point.y}
[Threading.Thread]::Sleep(1900)
Assert 'parseFloat(getComputedStyle(document.querySelector(".selva-intro-micro")).opacity)>.8&&[...document.querySelectorAll(".selva-micro-huella")].every(e=>parseFloat(getComputedStyle(e).opacity)>.8)' 'Efecto permanece visible al terminar el movimiento'
$shot=Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false}
[IO.File]::WriteAllBytes((Join-Path $PWD 'recuperacion/accesos-corregidos.png'),[Convert]::FromBase64String($shot.data))
$null=Cdp 'Emulation.setEmulatedMedia' @{features=@(@{name='prefers-reduced-motion';value='reduce'})}
Assert '[...document.querySelectorAll(".selva-intro-micro *")].every(e=>getComputedStyle(e).animationName==="none")' 'Movimiento reducido respetado'
if($script:earlyErrors.Count){throw 'Errores de carga'}
$bytes=[Text.Encoding]::UTF8.GetBytes('{"id":999,"method":"Browser.close"}')
$segment=New-Object 'ArraySegment[byte]' -ArgumentList @(,$bytes)
$null=$socket.SendAsync($segment,[Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
$socket.Dispose()