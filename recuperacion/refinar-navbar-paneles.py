from pathlib import Path
import shutil
r=Path.cwd();b=r/'recuperacion/antes-de-navbar-paneles';b.mkdir(exist_ok=True)
for n in ['index.html','style.css','script.js']:shutil.copy2(r/n,b/n)
p=r/'script.js';s=p.read_bytes().decode('utf8')
s=s.replace('let activeMode = "bosques", selectedKey = null, showAll = false, zoomFrame = 0;','let activeMode = "bosques", selectedKey = null, showAll = false, waterTypeFilter = "todos", zoomFrame = 0;',1)
s=s.replace('const waterKeys = () => showAll ? allWater : initialWater;','const waterKeys = () => waterTypeFilter === "todos" ? (showAll ? allWater : initialWater) : allWater.filter(key => topics[key].waterType === waterTypeFilter);',1)
s=s.replace('intro: "Selecciona un río para conocerlo."','intro: "Explora los principales cursos de agua representados en el mapa."',1)
s=s.replace('intro: "Explora las lagunas y los pantanos registrados."','intro: "Explora lagunas y pantanos registrados en la cartografía."',1)
s=s.replace('activeMode === "rios" ? [["rio", "Ríos principales"], ...(selectedKey ? [["seleccionado", "Río seleccionado"]] : [])]','activeMode === "rios" ? (selectedKey ? [["seleccionado", "Río seleccionado"], ["rio", "Otros cursos mostrados"]] : [["rio", "Cursos mostrados"]])',1)
s=s.replace('[...new Set(waterKeys().map(key => topics[key].waterType))].map(type => [type.toLowerCase(), type]);','[["laguna", "Laguna"], ["pantano", "Pantano"]];',1)
s=s.replace('            const panelIcon = territory.querySelector(".selva-territorio-panel-icono");','            territory.classList.toggle("has-element-selection", !!key);\n            const panelIcon = territory.querySelector(".selva-territorio-panel-icono");',1)
s=s.replace('"Selecciona un río para conocerlo" : "Selecciona una masa de agua"','"Selecciona un río para seguir su recorrido." : "Filtra los humedales por tipo o selecciona uno en el mapa."',1)
s=s.replace('const badge = icon(topicIcon); badge.classList.add("selva-territorio-ficha-icono"); card.prepend(badge);','''const badge = icon(topicIcon); badge.classList.add("selva-territorio-ficha-icono"); card.prepend(badge);
            const back = node("button", "selva-territorio-ficha-volver", "← Volver"); back.type = "button";
            back.addEventListener("click", () => { clearSelection(); options.querySelector("button,select")?.focus({preventScroll:true}); }); card.prepend(back);''',1)
anchor='        const buildOptions = () => {'
s=s.replace(anchor,'''        const clearSelection = () => {
            selectedKey = null; tooltip.hidden = true;
            if (activeMode === "bosques") { filterForest(null); territory.dataset.forest = "todos"; }
            updateFeatures(); buildOptions(); showCard(null); updateLegend(); updateMapLabels();
        };
'''+anchor,1)
anchor='            if (activeMode === "humedales") {\n                const label = node("label", "", "Seleccionar masa de agua");'
s=s.replace(anchor,'''            if (activeMode === "humedales") {
                const filters = node("div", "selva-territorio-filtros-agua"); filters.setAttribute("role", "group"); filters.setAttribute("aria-label", "Filtrar humedales por tipo registrado");
                [["todos", "Todos", "humedales"], ["Laguna", "Lagunas", "laguna"], ["Pantano", "Pantanos", "pantano"]].forEach(([type, name, glyph]) => {
                    const button = node("button", ""); button.type = "button"; button.dataset.waterFilter = type;
                    button.setAttribute("aria-pressed", String(waterTypeFilter === type)); button.append(icon(glyph), node("span", "", name));
                    button.addEventListener("click", () => {
                        waterTypeFilter = type; markExplored();
                        if (selectedKey && !waterKeys().includes(selectedKey)) { selectedKey = null; tooltip.hidden = true; showCard(null); }
                        updateFeatures(); buildOptions(); updateLegend(); updateMapLabels();
                        options.querySelector(`[data-water-filter="${type}"]`).focus({preventScroll:true});
                    }); filters.append(button);
                }); options.append(filters);
                const label = node("label", "", "Seleccionar masa de agua");''',1)
s=s.replace('toggle.type = "button"; toggle.dataset.territorioTodos = "";','toggle.type = "button"; toggle.hidden = waterTypeFilter !== "todos"; toggle.dataset.territorioTodos = "";',1)
s=s.replace('showAll ? "Conjunto completo disponible en esta vista." : "Selección por nombre y tamaño geométrico. No mide abundancia."','waterTypeFilter !== "todos" ? "Registros disponibles del tipo seleccionado. Clasificación original de MasaAgua." : showAll ? "Conjunto completo disponible en esta vista." : "Selección por nombre y tamaño geométrico. No mide abundancia."',1)
anchor='                if (activeMode === "bosques") {\n                    const all = node("button", "selva-territorio-todos",'
s=s.replace(anchor,'''                if (activeMode === "rios") {
                    const all = node("button", "selva-territorio-todos", "Ver todos"); all.type = "button"; all.dataset.territorioRiosTodos = "";
                    all.setAttribute("aria-pressed", String(!selectedKey));
                    all.addEventListener("click", () => { clearSelection(); options.querySelector("[data-territorio-rios-todos]").focus({preventScroll:true}); }); options.prepend(all);
                }
'''+anchor,1)
s=s.replace('activeMode = mode; selectedKey = null; showAll = false;','activeMode = mode; selectedKey = null; showAll = false; waterTypeFilter = "todos";',1)
s=s.replace('            if (mode === "rios") select("madre", false);','            // Ríos inicia sin selección para presentar todos los trazados.',1)
s=s.replace('            updateFeatures(); showCard(key); updateLegend(); updateMapLabels(); tooltip.hidden = true;','            options.querySelector("[data-territorio-rios-todos]")?.setAttribute("aria-pressed", "false");\n            updateFeatures(); showCard(key); updateLegend(); updateMapLabels(); tooltip.hidden = true;',1)
p.write_bytes(s.encode('utf8'))
