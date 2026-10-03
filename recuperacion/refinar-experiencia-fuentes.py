from pathlib import Path
import shutil,re
r=Path.cwd();b=r/'recuperacion/antes-de-refinamiento-experiencia';b.mkdir(exist_ok=True)
for n in ['index.html','script.js','style.css']:shutil.copy2(r/n,b/n)
p=r/'index.html';s=p.read_bytes().decode('utf8')
a=s.index('<section class="selva-introduccion');z=s.index('<section class="selva-curiosidades',a);intro=s[a:z]
shapes={
'#programas':''.join(f'<g class="selva-micro-huella" style="--micro-delay:{i*60}ms" transform="translate({12+i*21} {35-i*6}) rotate(-25)"><ellipse cx="0" cy="0" rx="4" ry="3"/><circle cx="-4" cy="-6" r="1.5"/><circle cx="0" cy="-7" r="1.5"/><circle cx="4" cy="-6" r="1.5"/></g>' for i in range(4)),
'#explora-madre-de-dios':'<path class="selva-micro-recorrido" pathLength="100" d="M7 42C23 39 15 17 36 19S57 43 75 23 89 19 105 9"/><circle class="selva-micro-punto" cx="105" cy="9" r="3"/>',
'#ambiente':'<g class="selva-micro-aire"><path d="M8 16q18-7 35 0t35 0M16 29q20-5 35 0t35 0M25 41q15-4 30 0"/></g><g class="selva-micro-hoja"><path d="M69 36Q54 16 91 10q4 25-22 26ZM69 36l15-18"/></g>',
'#investigaciones':'<path d="M36 40V24m0 8Q20 32 23 17q13 0 13 15Zm0-8q0-14 13-13 1 13-13 13"/><g class="selva-micro-lupa"><circle cx="65" cy="24" r="12"/><path d="m74 33 12 12"/></g><g class="selva-micro-puntos"><circle cx="22" cy="42" r="1.5"/><circle cx="48" cy="8" r="1.5"/><circle cx="94" cy="24" r="1.5"/></g>'}
for href,shape in shapes.items():
 pattern=rf'(<a href="{re.escape(href)}"[^>]*>)(.*?)(</a>)';decor='<svg class="selva-intro-micro" viewBox="0 0 116 56" aria-hidden="true" focusable="false">'+shape+'</svg>'
 intro=re.sub(pattern,lambda m:m[1]+m[2]+decor+m[3],intro,count=1,flags=re.S)
s=s[:a]+intro+s[z:]
a=s.index('<section class="selva-ambiente');z=s.index('</section>',a);env=s[a:z]
for old,new in [('Bosques y territorio','Transformaciones del bosque'),('Bosques · Deforestación · Incendios forestales','Deforestación · Incendios forestales'),('Conoce los procesos que modifican la cobertura forestal y transforman el paisaje.','Conoce procesos que modifican la cobertura forestal y transforman el paisaje.'),('Agua y contaminación','Contaminación y residuos'),('Agua · Contaminación · Residuos','Contaminación del agua · Residuos'),('Explora cómo el agua conecta el territorio y cómo distintas presiones pueden afectar su calidad y la de los ecosistemas.','Conoce presiones que afectan la calidad del agua y los efectos de los residuos en el ambiente.')]:env=env.replace(old,new)
s=s[:a]+env+s[z:]
a=s.index('    <section class="selva-explora reveal" id="explora-madre-de-dios">');z=s.index('<section class="selva-ambiente',a);territory=s[a:z]
territory=territory.replace('<details class="selva-territorio-fuentes">','<button type="button" class="selva-territorio-fuentes-abrir" aria-haspopup="dialog" aria-controls="selva-territorio-fuentes-modal">Fuentes y metodología del mapa ↗</button><details class="selva-territorio-fuentes" hidden>',1)
territory=territory.replace('<details class="selva-territorio-documentacion-previa">','<details class="selva-territorio-documentacion-previa" hidden>',1)
# Los archivos de procesamiento se preservan sin exponerse como fuentes públicas.
territory=re.sub(r'<a href="(datos/territorio/[^"]+\.json)"',r'<a hidden href="\1"',territory)
dialog='''<dialog id="selva-territorio-fuentes-modal" class="selva-territorio-fuentes-modal" aria-labelledby="selva-territorio-fuentes-titulo"><div class="selva-territorio-fuentes-modal-cabecera"><h3 id="selva-territorio-fuentes-titulo">Fuentes y datos del registro</h3><button type="button" class="selva-territorio-fuentes-cerrar" aria-label="Cerrar fuentes">×</button></div><div class="selva-territorio-fuentes-modal-cuerpo"></div></dialog>'''
territory=territory+dialog+'\n';s=s[:a]+territory+s[z:];p.write_bytes(s.encode('utf8'))
p=r/'script.js';s=p.read_bytes().decode('utf8')
anchor='    const territory = document.querySelector(".selva-territorio-layout");'
introjs='''    document.querySelectorAll(".selva-introduccion-accesos a").forEach(access => {
        let microTimer;
        access.addEventListener("pointerdown", event => {
            if (event.pointerType !== "touch") return;
            clearTimeout(microTimer); access.classList.remove("is-micro-active");
            void access.offsetWidth; access.classList.add("is-micro-active");
            microTimer = setTimeout(() => access.classList.remove("is-micro-active"), 900);
        });
    });

'''
s=s.replace(anchor,introjs+anchor,1)
anchor='        const tooltip = territory.querySelector(".selva-territorio-tooltip");'
modaljs='''
        const sourceModal = document.getElementById("selva-territorio-fuentes-modal");
        const sourceBody = sourceModal.querySelector(".selva-territorio-fuentes-modal-cuerpo");
        let sourceOpener, sourceOverflow, sourceBackdrop = false;
        const outsideSource = event => { const rect = sourceModal.getBoundingClientRect(); return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom; };
        const openSources = (trigger, content, title, type) => {
            if (document.querySelector("dialog[open]")) return;
            sourceOpener = trigger; sourceOverflow = document.body.style.overflow;
            sourceBody.replaceChildren(...[...content.childNodes].filter(child => child.nodeName !== "SUMMARY").map(child => child.cloneNode(true)));
            sourceModal.querySelector("h3").textContent = title; sourceModal.dataset.sourceType = type;
            document.body.style.overflow = "hidden"; sourceModal.showModal(); sourceModal.scrollTop = 0;
            sourceModal.querySelector(".selva-territorio-fuentes-cerrar").focus({preventScroll:true});
        };
        sourceModal.querySelector(".selva-territorio-fuentes-cerrar").addEventListener("click", () => sourceModal.close());
        sourceModal.addEventListener("close", () => { document.body.style.overflow = sourceOverflow; sourceOpener?.focus({preventScroll:true}); sourceBackdrop = false; });
        sourceModal.addEventListener("pointerdown", event => { sourceBackdrop = event.target === sourceModal && outsideSource(event); });
        sourceModal.addEventListener("click", event => { if (sourceBackdrop && event.target === sourceModal && outsideSource(event)) sourceModal.close(); sourceBackdrop = false; });
        territory.closest("#explora-madre-de-dios").querySelector(".selva-territorio-fuentes-abrir").addEventListener("click", event => {
            const content = territory.closest("#explora-madre-de-dios").querySelector(".selva-territorio-fuentes");
            openSources(event.currentTarget, content, "Fuentes y metodología del mapa", "metodologia");
        });
'''
s=s.replace(anchor,anchor+modaljs,1)
s=s.replace('            card.append(sources);','''            sources.hidden = true;
            const sourceButton = node("button", "selva-territorio-registro-abrir", "Fuentes y datos del registro ↗"); sourceButton.type = "button";
            sourceButton.setAttribute("aria-haspopup", "dialog"); sourceButton.setAttribute("aria-controls", "selva-territorio-fuentes-modal");
            sourceButton.addEventListener("click", () => openSources(sourceButton, sources, "Fuentes y datos del registro · " + topic.name, "registro"));
            card.append(sourceButton, sources);''',1)
# Conservar el enlace original dentro del contenido reutilizado del registro.
s=s.replace('if (education) sources.append(link); else card.append(link);','sources.append(link);',1)
p.write_bytes(s.encode('utf8'))
