from pathlib import Path
p=Path('recuperacion/optimizar-cobertura-svg.py');s=p.read_text(encoding='utf8');a=s.index('def compact(');b=s.index('# Mantener subrutas',a);s=s[:a]+s[b:];p.write_text(s,encoding='utf8')
p=Path('recuperacion/validar-territorio-cobertura.ps1');s=p.read_text(encoding='utf-8-sig');a=s.index("$null=Cdp 'Emulation.setEmulatedMedia'")
extra='''$null=Eval 'document.querySelector("[data-territorio-modo=bosques]").click()'
Assert 'document.querySelectorAll(".selva-territorio-bosque-real").length===27&&document.querySelector(".selva-territorio-opciones").scrollHeight>document.querySelector(".selva-territorio-opciones").clientHeight' 'Móvil: lista completa accesible por desplazamiento'
Assert 'document.documentElement.scrollWidth<=innerWidth' 'Bosques móvil sin desbordamiento'
$null=Eval 'document.querySelector("[data-territorio-tema=cobertura-bi-pal]").click()'
Assert 'document.querySelector(".selva-territorio-ficha h4").textContent==="Bosque inundable de palmeras"' 'Selección móvil de categoría oficial'
Assert 'document.querySelector(".selva-territorio-provincias-nombres").getComputedTextLength===undefined&&getComputedStyle(document.querySelector(".selva-territorio-provincias-nombres")).display!=="none"' 'Provincias conservadas en móvil'
$null=Cdp 'Emulation.setDeviceMetricsOverride' @{width=390;height=1050;deviceScaleFactor=1;mobile=$true}
$null=Eval 'document.querySelector(".selva-territorio-canvas").scrollIntoView({behavior:"instant",block:"center"});document.querySelector("[data-territorio-bosques-todos]").click()'
[Threading.Thread]::Sleep(250)
$shot=Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false}
[IO.File]::WriteAllBytes((Join-Path $PWD 'recuperacion/territorio-cobertura-bosques-390.png'),[Convert]::FromBase64String($shot.data))
'''
s=s[:a]+extra+s[a:];p.write_text(s,encoding='utf-8-sig')
