from pathlib import Path
p=Path('recuperacion/verificar-conservacion-iconos.py');s=p.read_text(encoding='utf8').replace('antes-de-colores-iconos','antes-de-cobertura-real')
s=s.replace("[el.get('data-mapa-feature') for el in newsvg.iter() if el.get('data-mapa-feature')]","[el.get('data-mapa-feature') for el in newsvg.iter() if el.get('data-mapa-feature') and el.get('data-mapa-modo')!='bosques']")
Path('recuperacion/verificar-conservacion-cobertura.py').write_text(s,encoding='utf8')
p=Path('recuperacion/validar-territorio-iconos.ps1');s=p.read_text(encoding='utf-8-sig').replace('9251','9258')
a=s.index("Assert '[...document.querySelectorAll(\"[data-mapa-feature]\")]")
z=s.index("foreach($mode in @('bosques','rios','humedales')){",s.index("$null=Eval 'document.querySelector(\"[data-territorio-bosques-todos]\").click()'"))
# Sustituir exclusivamente pruebas del estado anterior de Bosques.
s=s[:a]+'''Assert 'document.querySelectorAll(".selva-territorio-bosque-real").length===27' '27 categorías oficiales'
Assert '[...document.querySelectorAll(".selva-territorio-bosque-real")].every(x=>getComputedStyle(x).display!=="none"&&x.style.opacity==="0.9")' 'Todos muestra mosaico completo'
Assert 'document.querySelector(".selva-territorio-opciones").firstElementChild.textContent==="Todos"' 'Todos como primera opción'
Assert 'document.querySelectorAll(".selva-territorio-leyenda .selva-territorio-color").length===27' 'Leyenda de categorías reales'
$null=Eval 'window.cov=JSON.parse(document.getElementById("selva-territorio-cobertura-datos").textContent);window.keys=cov.categories.map(x=>x.id)'
Assert 'cov.categories.every(c=>{const p=document.querySelector(`[data-forest-category="${c.id}"]`);return p.style.fill.toLowerCase()===c.color.toLowerCase()||getComputedStyle(p).fill===getComputedStyle([...document.querySelectorAll(".selva-territorio-leyenda .selva-territorio-color")][cov.categories.indexOf(c)]).backgroundColor})' 'Colores de mapa y leyenda coinciden'
foreach($idx in 0..26){
 $null=Eval ('document.querySelector(`[data-territorio-tema="${keys['+$idx+']}"]`).click()')
 Assert ('[...document.querySelectorAll(".selva-territorio-bosque-real")].every(p=>p.style.opacity===(p.dataset.mapaFeature===keys['+$idx+']?"0.9":"0.14"))') 'Filtro solo sobre categoría seleccionada'
 Assert ('document.querySelector(".selva-territorio-ficha h4").textContent===cov.categories['+$idx+'].categoria_original') 'Ficha conserva nombre original'
}
$null=Eval 'document.querySelector("[data-territorio-bosques-todos]").click()'
Assert '[...document.querySelectorAll(".selva-territorio-bosque-real")].every(x=>x.style.opacity==="0.9")' 'Todos restaura mosaico'
$null=Eval 'document.querySelector(".selva-territorio-bosque-real").dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}))'
Assert 'document.querySelector(".selva-territorio-bosque-real").getAttribute("aria-pressed")==="true"' 'Selección de polígono por teclado'
$null=Eval 'document.querySelector("[data-territorio-bosques-todos]").click()'
$null=Eval 'window.hit=null;const svg=document.querySelector(".selva-territorio-svg"),rect=svg.getBoundingClientRect();outer:for(let y=Math.max(90,rect.top);y<Math.min(innerHeight-30,rect.bottom);y+=5){for(let x=rect.left;x<rect.right;x+=5){const e=document.elementFromPoint(x,y)?.closest(".selva-territorio-bosque-real");if(e){hit={x,y,key:e.dataset.mapaFeature,name:e.getAttribute("aria-label")};break outer}}}'
Assert '!!hit' 'Polígono real disponible para clic'
$point=Eval 'hit'
$null=Cdp 'Input.dispatchMouseEvent' @{type='mouseMoved';x=$point.x;y=$point.y}
Assert 'document.querySelector(".selva-territorio-tooltip").textContent===hit.name&&!document.querySelector(".selva-territorio-tooltip").hidden' 'Tooltip con nombre oficial'
$null=Cdp 'Input.dispatchMouseEvent' @{type='mousePressed';x=$point.x;y=$point.y;button='left';clickCount=1}
$null=Cdp 'Input.dispatchMouseEvent' @{type='mouseReleased';x=$point.x;y=$point.y;button='left';clickCount=1}
Assert 'document.querySelector(`[data-territorio-tema="${hit.key}"]`).getAttribute("aria-pressed")==="true"' 'Clic real sincroniza categoría y panel'
$null=Eval 'document.querySelector("[data-territorio-bosques-todos]").click()'
''' +s[z:]
# Restantes pruebas antiguas específicas se eliminan antes del segundo bucle funcional.
a=s.index("$null=Eval 'document.querySelector(\"[data-territorio-modo=bosques]\").click()'",s.index("foreach($mode in @('bosques','rios','humedales')){"))
z=s.index("foreach($mode in @('bosques','rios','humedales')){",a)
s=s[:a]+s[z:]
s=s.replace('territorio-iconos-', 'territorio-cobertura-')
Path('recuperacion/validar-territorio-cobertura.ps1').write_text(s,encoding='utf-8-sig')
