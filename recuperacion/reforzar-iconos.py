from pathlib import Path
import re,shutil
r=Path.cwd(); b=r/'recuperacion/antes-de-colores-iconos';b.mkdir(exist_ok=True)
for n in ['index.html','style.css','script.js']: shutil.copy2(r/n,b/n)
p=(r/'index.html').read_bytes().decode('utf8');a=p.index('    <section class="selva-explora reveal" id="explora-madre-de-dios">');z=p.index('<section class="selva-ambiente reveal" id="ambiente">');s=p[a:z]
paths={'bosques':'M3 20h18M6 20v-7m-4 0 4-7 4 7ZM12 20V9m-4 0 4-7 4 7ZM18 20v-5m-3 0 3-6 3 6Z','tierra':'M12 20V9M5 20h14M8 6c0-5 8-5 8 0 5 1 5 8 0 9H8C3 14 3 7 8 6Z','inundable':'M12 15V7M8 5c0-4 8-4 8 0 4 1 4 7 0 8H8C4 12 4 6 8 5ZM2 18q2-2 5 0t5 0t5 0t5 0M2 22q2-2 5 0t5 0t5 0t5 0','aguajal':'M12 21V7M8 21h8M12 7Q5 0 2 8M12 7Q19 0 22 8M12 7Q3 5 3 13M12 7Q21 5 21 13M12 7Q8 0 11 2M12 7Q16 0 13 2','secundario':'M12 20V11M6 21h12M12 15Q3 15 4 6q8 0 8 9ZM12 11q0-8 8-8 1 8-8 8','rios':'M14 2C3 5 20 9 10 13S7 19 15 22M19 2c-8 4 5 7-4 12','humedales':'M2 17q2-2 5 0t5 0t5 0t5 0M2 22q2-2 5 0t5 0t5 0t5 0M6 14V5m0 5L3 7M12 14V2m0 6 3-3M18 14V6m0 4 3-3','laguna':'M3 12C2 4 11 2 18 5c7 4 4 13-4 15S3 18 3 12ZM7 13q2-2 5 0t5 0','pantano':'M2 17q2-2 5 0t5 0t5 0t5 0M2 21q2-2 5 0t5 0t5 0t5 0M6 13V4m0 5L3 6M12 13V2m0 6 3-3M18 13V5m0 5 3-3','agua':'M12 2C9 7 4 11 4 15a8 8 0 0 0 16 0c0-4-5-8-8-13ZM8 16q2-2 4 0t4 0'}
for key,d in paths.items():
 symbol=f'<symbol id="territorio-icono-{key}" viewBox="0 0 24 24"><path d="{d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>'
 pattern=rf'<symbol id="territorio-icono-{key}".*?</symbol>'
 if re.search(pattern,s):s=re.sub(pattern,symbol,s,count=1)
 else:s=s.replace('</defs>',symbol+'</defs>',1)
for key in ['bosques','rios','humedales']:
 s=re.sub(rf'(<button[^>]*data-territorio-modo="{key}"[^>]*>)([^<]+)(</button>)',rf'\1<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#territorio-icono-{key}"/></svg><span>\2</span>\3',s,count=1)
s=s.replace('class="selva-territorio-modo-icono" viewBox="0 0 24 24" aria-hidden="true"><use href="#territorio-icono-tierra"','class="selva-territorio-modo-icono" viewBox="0 0 24 24" aria-hidden="true"><use href="#territorio-icono-bosques"',1)
(r/'index.html').write_bytes((p[:a]+s+p[z:]).encode('utf8'))
j=(r/'script.js').read_bytes().decode('utf8');j=j.replace('intro: "Explora un ambiente forestal.", icon: "tierra"','intro: "Explora un ambiente forestal.", icon: "bosques"',1)
a='        const forestPolygons = () =>';z=j.index('        const updateScale =',j.index(a));start=j.index(a)
j=j[:start]+'''        const forestColors = { tierra: "#24563A", inundable: "#3E7763", aguajal: "#768B49", secundario: "#7EAB70" };
        const forestPolygons = () => [...svg.querySelectorAll("#territorio-bosques-capa [data-forest-category], #territorio-bosques-capa [data-bosque-tipo]")];
        const filterForest = key => {
            forestPolygons().forEach(polygon => {
                const category = (polygon.dataset.bosqueTipo || polygon.dataset.forestCategory).replace("tierra-firme", "tierra");
                const selected = !key || category === key;
                if (forestColors[category]) polygon.style.fill = forestColors[category];
                polygon.style.opacity = selected ? "0.90" : "0.14";
                polygon.classList.toggle("is-selected", !!key && selected);
            });
        };
'''+j[z:]
a=j.index('            if (activeMode === "bosques") {',j.index('const updateLegend'));z=j.index('            const items =',a)
j=j[:a]+'''            if (activeMode === "bosques") {
                legend.replaceChildren(...modes.bosques.keys.map(key => {
                    const item = node("span", "selva-territorio-leyenda-item");
                    const swatch = node("i", "selva-territorio-color"); swatch.style.backgroundColor = forestColors[key];
                    item.append(swatch, icon(key), node("span", "", key === "tierra" ? "Tierra firme" : topics[key].name)); return item;
                }), node("small", "selva-territorio-leyenda-aviso", "Colores educativos. La distribución espacial detallada está en preparación."));
                return;
            }
'''+j[z:]
j=j.replace('button.style.setProperty("--ambient-color", topics[key].color);','button.style.setProperty("--ambient-color", forestColors[key]);',1)
j=j.replace('button.append(content);','button.append(content);\n                        const swatch = node("i", "selva-territorio-color"); swatch.setAttribute("aria-hidden", "true"); button.append(swatch);',1)
j=j.replace('            if (!key) {\n                const hint', '''            const panelIcon = territory.querySelector(".selva-territorio-panel-icono");
            const topicIcon = !key ? modes[activeMode].icon : activeMode === "bosques" ? key : activeMode === "humedales" ? (topics[key].waterType === "Laguna" ? "laguna" : topics[key].waterType === "Pantano" ? "pantano" : "agua") : "rios";
            panelIcon.querySelector("use").setAttribute("href", "#territorio-icono-" + topicIcon);
            panelIcon.style.color = activeMode === "bosques" && key ? forestColors[key] : "";
            card.style.setProperty("--ambient-color", activeMode === "bosques" && key ? forestColors[key] : "var(--mode-accent)");
            card.classList.toggle("is-forest-card", activeMode === "bosques" && !!key);
            if (!key) {
                const hint''',1)
j=j.replace('activeMode === "rios" ? "Selecciona un río para conocerlo" : "Selecciona una masa de agua"','activeMode === "bosques" ? "Explora los ambientes forestales" : activeMode === "rios" ? "Selecciona un río para conocerlo" : "Selecciona una masa de agua"',1)
j=j.replace('hint.append(icon(modes[activeMode].icon),','hint.append(icon(modes[activeMode].icon),',1)
j=j.replace('            card.replaceChildren(type, heading, text);','            card.replaceChildren(type, heading, text);\n            const badge = icon(topicIcon); badge.classList.add("selva-territorio-ficha-icono"); card.prepend(badge);',1)
(r/'script.js').write_bytes(j.encode('utf8'))
