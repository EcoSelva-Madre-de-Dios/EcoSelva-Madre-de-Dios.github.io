$ErrorActionPreference = 'Stop'
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$profile = Join-Path $env:TEMP ('ecoselva-fauna-' + [Guid]::NewGuid().ToString('N'))
$url = ([Uri](Join-Path (Split-Path (Join-Path $PWD 'recuperacion')) 'index.html')).AbsoluteUri
$null = Start-Process -FilePath $edge -ArgumentList @('--headless','--disable-extensions','--disable-gpu','--no-first-run','--remote-debugging-port=9281',('--user-data-dir="'+$profile+'"'),'--window-size=1440,1050',$url) -WindowStyle Hidden -PassThru
for ($i=0; $i -lt 30; $i++) { try { $targets=Invoke-RestMethod 'http://127.0.0.1:9281/json/list'; break } catch { [Threading.Thread]::Sleep(150) } }
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
$null=Cdp 'Emulation.setDeviceMetricsOverride' @{width=390;height=850;deviceScaleFactor=1;mobile=$true}
$null=Eval 'document.querySelector("label[for=menu]").click()'
Assert 'document.querySelector("#menu").checked&&getComputedStyle(document.querySelector(".navbar")).display!=="none"' 'Menú móvil abre con checkbox'
$null=Eval 'document.querySelector(".selva-nav-desplegable summary").click()'
Assert 'document.querySelector(".selva-nav-desplegable details").open' 'Dropdown EcoSelva abre'
Assert '[...document.querySelectorAll(".navbar a[href^=\"#\"]")].every(a=>document.getElementById(a.getAttribute("href").slice(1)))' 'Enlaces de navegación conservados'
$null=Eval 'document.querySelector("label[for=menu]").click()'
Assert '!document.querySelector("#menu").checked' 'Menú móvil cierra'
if($script:earlyErrors.Count){throw 'Errores durante carga'}
$bytes=[Text.Encoding]::UTF8.GetBytes('{"id":999,"method":"Browser.close"}')
$segment=New-Object 'ArraySegment[byte]' -ArgumentList @(,$bytes)
$null=$socket.SendAsync($segment,[Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
$socket.Dispose()