$ErrorActionPreference = 'Stop'
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$profile = Join-Path $env:TEMP ('ecoselva-colabora-' + [Guid]::NewGuid().ToString('N'))
$url = ([Uri](Join-Path $PWD 'index.html')).AbsoluteUri
$null = Start-Process -FilePath $edge -ArgumentList @('--headless','--disable-extensions','--disable-gpu','--no-first-run','--remote-debugging-port=9317',('--user-data-dir="'+$profile+'"'),'--window-size=1440,1050',$url) -WindowStyle Hidden -PassThru
for ($i=0; $i -lt 30; $i++) { try { $targets=Invoke-RestMethod 'http://127.0.0.1:9317/json/list'; break } catch { [Threading.Thread]::Sleep(150) } }
$target=$targets | Where-Object { $_.type -eq 'page' -and $_.url -like '*index.html*' } | Select-Object -First 1
$socket=New-Object Net.WebSockets.ClientWebSocket
$null=$socket.ConnectAsync([Uri]$target.webSocketDebuggerUrl,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
$script:sequence=0
$script:errors=@()
function Cdp($method,$params) {
    $script:sequence++
    $message=@{id=$script:sequence;method=$method;params=$params} | ConvertTo-Json -Depth 12 -Compress
    $bytes=[Text.Encoding]::UTF8.GetBytes($message)
    $segment=New-Object 'ArraySegment[byte]' -ArgumentList @(,$bytes)
    $null=$socket.SendAsync($segment,[Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
    do {
        $stream=New-Object IO.MemoryStream
        do {
            $buffer=New-Object byte[] 65536
            $part=New-Object 'ArraySegment[byte]' -ArgumentList @(,$buffer)
            $response=$socket.ReceiveAsync($part,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
            $stream.Write($buffer,0,$response.Count)
        } while (!$response.EndOfMessage)
        $result=[Text.Encoding]::UTF8.GetString($stream.ToArray()) | ConvertFrom-Json
        if($result.method -eq 'Runtime.exceptionThrown'){$script:errors+=$result.params.exceptionDetails}
        $stream.Dispose()
    } while ($result.id -ne $script:sequence)
    return $result.result
}
function Eval($expression) { (Cdp 'Runtime.evaluate' @{expression=$expression;returnByValue=$true}).result.value }
function Assert($condition,$message) { if(!(Eval $condition)){ throw $message }; Write-Output ('OK: '+$message) }
$null=Cdp 'Runtime.enable' @{}
$null=Cdp 'Page.reload' @{}
[Threading.Thread]::Sleep(2500)
foreach($width in @(1440,1024,820,390,320)) {
    $null=Cdp 'Emulation.setDeviceMetricsOverride' @{width=$width;height=1050;deviceScaleFactor=1;mobile=($width-lt640)}
    $null=Eval 'document.querySelector("#colabora").scrollIntoView({behavior:"instant",block:"start"})'
    [Threading.Thread]::Sleep(180)
    Assert 'document.documentElement.scrollWidth<=innerWidth' ('Sin desbordamiento a '+$width+' px')
    Assert '[...document.querySelectorAll("#colabora h2,#colabora h3,#colabora p,#colabora li,#colabora a")].every(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth+1})' ('Contenido legible a '+$width+' px')
    if($width-ge901){ Assert 'getComputedStyle(document.querySelector(".selva-colabora-layout")).gridTemplateColumns.split(" ").length===2' 'Dos mitades en escritorio' }
    else { Assert 'getComputedStyle(document.querySelector(".selva-colabora-layout")).gridTemplateColumns.split(" ").length===1' ('Una columna responsive a '+$width+' px') }
    if($width-eq1440 -or $width-eq390){
        $shot=Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false}
        [IO.File]::WriteAllBytes((Join-Path $PWD ('recuperacion/colabora-'+$width+'.png')),[Convert]::FromBase64String($shot.data))
    }
}
Assert 'document.querySelectorAll(".selva-colabora-proceso li").length===4' 'Cuatro pasos conservados'
Assert 'document.querySelector(".selva-colabora-boton").href.startsWith("https://docs.google.com/forms/")' 'Formulario conservado'
Assert '$script:errors.Count===0'.Replace('$script:errors.Count', $script:errors.Count.ToString()) 'Sin errores JavaScript'
$bytes=[Text.Encoding]::UTF8.GetBytes('{"id":999,"method":"Browser.close"}')
$segment=New-Object 'ArraySegment[byte]' -ArgumentList @(,$bytes)
$null=$socket.SendAsync($segment,[Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
$socket.Dispose()
