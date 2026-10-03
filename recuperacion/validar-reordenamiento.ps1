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
function Assert($condition,$message) { if(!(Eval $condition)){throw $message};Write-Output ('OK: '+$message) }
$null=Cdp 'Runtime.enable' @{}
$null=Cdp 'Page.bringToFront' @{}
$null=Cdp 'Emulation.setEmulatedMedia' @{features=@(@{name='prefers-reduced-motion';value='no-preference'})}
$null=Cdp 'Page.reload' @{}
[Threading.Thread]::Sleep(1600)
Assert 'JSON.stringify([...document.body.children].filter(x=>["HEADER","SECTION","FOOTER"].includes(x.tagName)).map(x=>x.id))===JSON.stringify(["inicio","selva-introduccion","sabias-que","programas","explora-madre-de-dios","ambiente","investigaciones","quienes-somos","colabora","contacto"])' 'Orden completo y sin duplicados'
Assert '[...document.querySelectorAll(".navbar a[href^=\"#\"]")].every(a=>document.getElementById(a.hash.slice(1)))' 'Destinos de la navbar conservados'
$null=Eval 'document.querySelector("[data-flora-modal=maderables]").click()'
Assert 'document.querySelector("#selva-flora-modal").open' 'Modal Flora'
$null=Eval 'document.querySelector(".selva-flora-modal-cerrar").click()'
$null=Eval 'document.querySelector("[data-fauna-explorar]").click()'
Assert 'document.querySelector("#selva-fauna-modal").open' 'Modal Fauna'
$null=Eval 'document.querySelector(".selva-fauna-modal-cerrar").click()'
$null=Eval 'document.querySelector("#ambiente .selva-ambiente-explorar").click()'
Assert 'document.querySelector("#selva-ambiente-modal").open' 'Modal Ambiente'
$null=Eval 'document.querySelector("#selva-ambiente-modal").close()'
$null=Eval 'document.querySelector("#explora-madre-de-dios").scrollIntoView({behavior:"instant"});document.querySelector("[data-territorio-modo=rios]").click();document.querySelector("[data-territorio-tema=tambopata]").click()'
Assert 'document.querySelector("[data-mapa-feature=tambopata]").classList.contains("is-selected")' 'Mapa y ficha de Territorio'
$null=Eval 'document.querySelector("#investigaciones").scrollIntoView({behavior:"instant"})'
[Threading.Thread]::Sleep(1700)
Assert 'document.querySelector(".selva-investigaciones-video").readyState>=2&&!document.querySelector(".selva-investigaciones-video").paused&&document.querySelector("#investigaciones").classList.contains("is-video-playing")' 'Video Investigaciones'
foreach($width in @(1440,390)){
 $null=Cdp 'Emulation.setDeviceMetricsOverride' @{width=$width;height=900;deviceScaleFactor=1;mobile=($width-lt640)}
 Assert 'document.documentElement.scrollWidth<=innerWidth' ('Sin desbordamiento a '+$width+' px')
}
$script:earlyErrors | ConvertTo-Json -Depth 8 -Compress
if($script:earlyErrors.Count){throw 'Errores durante carga'}
$bytes=[Text.Encoding]::UTF8.GetBytes('{"id":999,"method":"Browser.close"}')
$segment=New-Object 'ArraySegment[byte]' -ArgumentList @(,$bytes)
$null=$socket.SendAsync($segment,[Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
$socket.Dispose()