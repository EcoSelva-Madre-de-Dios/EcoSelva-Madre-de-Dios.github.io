$ErrorActionPreference = 'Stop'
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$profile = Join-Path $env:TEMP ('ecoselva-fauna-' + [Guid]::NewGuid().ToString('N'))
$url = ([Uri](Join-Path (Split-Path (Join-Path $PWD 'recuperacion')) 'index.html')).AbsoluteUri
$null = Start-Process -FilePath $edge -ArgumentList @('--headless','--disable-extensions','--disable-gpu','--no-first-run','--remote-debugging-port=9307',('--user-data-dir="'+$profile+'"'),'--window-size=1440,1050',$url) -WindowStyle Hidden -PassThru
for ($i=0; $i -lt 30; $i++) { try { $targets=Invoke-RestMethod 'http://127.0.0.1:9307/json/list'; break } catch { [Threading.Thread]::Sleep(150) } }
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
[Threading.Thread]::Sleep(3500)
$null=Eval 'document.querySelector("#selva-introduccion").scrollIntoView({behavior:"instant"})'
$point=Eval '(()=>{const r=document.querySelector(".selva-introduccion-accesos a").getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()'
$null=Cdp 'Input.dispatchMouseEvent' @{type='mouseMoved';x=$point.x;y=$point.y}
Assert 'document.querySelector(".selva-intro-micro").getAnimations({subtree:true}).every(a=>a.effect.getTiming().iterations===1&&a.effect.getTiming().duration+a.effect.getTiming().delay<=900)' 'Microinteracciones finitas de hasta 900 ms'
$null=Eval 'document.querySelector(".selva-introduccion-accesos a").dispatchEvent(new PointerEvent("pointerdown",{pointerType:"touch",bubbles:true}))'
Assert 'document.querySelector(".selva-introduccion-accesos a").classList.contains("is-micro-active")' 'Gesto táctil breve'
$null=Cdp 'Emulation.setEmulatedMedia' @{features=@(@{name='prefers-reduced-motion';value='reduce'})}
Assert '[...document.querySelectorAll(".selva-intro-micro,.selva-intro-micro *")].every(e=>getComputedStyle(e).animationName==="none")' 'Reduced motion sin animaciones decorativas'
$null=Eval 'document.querySelector("[data-ambiente-area=bosques] button").click()'
Assert 'document.querySelector("#selva-ambiente-modal").open&&document.querySelector("#selva-ambiente-modal-titulo").textContent==="Transformaciones del bosque"' 'Modal de Ambiente conserva funcionamiento'
Assert 'document.querySelectorAll(".selva-ambiente-opciones button").length===2' 'Dos procesos forestales, sin subtema Bosques'
$null=Eval 'document.querySelector("#selva-ambiente-modal").close();document.querySelector("[data-ambiente-area=agua] button").click()'
Assert '[...document.querySelectorAll(".selva-ambiente-opciones strong")].map(e=>e.textContent).join(",")==="Contaminación del agua,Residuos"' 'Presiones del agua y residuos'
$null=Eval 'document.querySelector("#selva-ambiente-modal").close()'
if($script:earlyErrors.Count){throw 'Errores de carga'}
$bytes=[Text.Encoding]::UTF8.GetBytes('{"id":999,"method":"Browser.close"}')
$segment=New-Object 'ArraySegment[byte]' -ArgumentList @(,$bytes)
$null=$socket.SendAsync($segment,[Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
$socket.Dispose()