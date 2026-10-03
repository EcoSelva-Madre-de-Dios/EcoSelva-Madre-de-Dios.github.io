    const territory = document.querySelector(".selva-territorio-layout");
    if (territory) {
        const topics = JSON.parse(document.getElementById("selva-territorio-datos").textContent);
        const svg = territory.querySelector(".selva-territorio-svg");
        const canvas = territory.querySelector(".selva-territorio-canvas");
        const scenes = [...svg.querySelectorAll("[data-territorio-scene]")];
        const features = [...svg.querySelectorAll("[data-mapa-feature]")];
        const tabs = [...document.querySelectorAll("[data-territorio-modo]")];
        const options = territory.querySelector(".selva-territorio-opciones");
        const card = territory.querySelector(".selva-territorio-ficha");
        const legend = territory.querySelector(".selva-territorio-leyenda");
        const tooltip = territory.querySelector(".selva-territorio-tooltip");
        const returnView = territory.querySelector(".selva-territorio-volver-vista");
        const helper = territory.querySelector(".selva-territorio-ayuda");
        const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
        const allWater = Object.keys(topics).filter(key => topics[key].mode === "humedales").sort((a, b) => topics[a].name.localeCompare(topics[b].name, "es"));
        const initialWater = allWater.filter(key => topics[key].initial);
        const modes = {
            bosques: { name: "Bosques", phrase: "Ambientes forestales de la Amazonía sur.", intro: "Explora un ambiente forestal.", icon: "tierra", keys: ["tierra", "inundable", "aguajal", "secundario"], note: "Representación educativa. La cobertura cartográfica detallada de bosques se incorporará con una fuente específica." },
            rios: { name: "Ríos", phrase: "Los cursos de agua conectan el territorio.", intro: "Selecciona un río para conocerlo.", icon: "rios", keys: ["madre", "tambopata", "inambari", "piedras", "manu", "heath"], note: "Selección de trazados reales. El grosor gráfico no representa anchura ni caudal." },
            humedales: { name: "Humedales", phrase: "Ambientes donde agua y tierra se encuentran.", intro: "Explora las lagunas y los pantanos registrados.", icon: "humedales", note: "Selección inicial por nombre y tamaño geométrico; no representa la totalidad ni la abundancia de los humedales." }
        };
        let activeMode = "bosques", selectedKey = null, showAll = false, zoomFrame = 0;
        let view = [0, 0, 600, 510];
        let explored = false;
        try { explored = sessionStorage.getItem("ecoselva-territorio-explorado") === "1"; } catch {}
        helper.hidden = explored;
        const markExplored = () => {
            explored = true; helper.hidden = true;
            try { sessionStorage.setItem("ecoselva-territorio-explorado", "1"); } catch {}
        };
        const node = (tag, className, text) => {
            const el = document.createElement(tag);
            if (className) el.className = className;
            if (text) el.textContent = text;
            return el;
        };
        const icon = key => {
            const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            el.setAttribute("viewBox", "0 0 24 24"); el.setAttribute("aria-hidden", "true");
            const use = document.createElementNS(el.namespaceURI, "use");
            use.setAttribute("href", "#territorio-icono-" + key); el.append(use); return el;
        };
        const waterKeys = () => showAll ? allWater : initialWater;
        const updateLegend = () => {
            const items = activeMode === "bosques" ? modes.bosques.keys.map(key => [key, topics[key].name.replace("Bosque de ", "").replace("Bosque ", "")]) :
                activeMode === "rios" ? [["rio", "Ríos principales"], ...(selectedKey ? [["seleccionado", "Río seleccionado"]] : [])] :
                [...new Set(waterKeys().map(key => topics[key].waterType))].map(type => [type.toLowerCase(), type]);
            legend.replaceChildren(...items.map(([kind, text]) => {
                const item = node("span", "selva-territorio-leyenda-item");
                item.append(node("i", "selva-territorio-muestra selva-territorio-muestra--" + kind), node("span", "", text)); return item;
            }));
            if (activeMode === "bosques") legend.append(node("small", "", "Representación educativa"));
        };
        const setView = (next, animate = true) => {
            cancelAnimationFrame(zoomFrame);
            const before = [...view], started = performance.now();
            const draw = time => {
                const t = !animate || reducedMotion.matches ? 1 : Math.min(1, (time - started) / 400);
                const eased = 1 - Math.pow(1 - t, 3);
                view = before.map((value, i) => value + (next[i] - value) * eased);
                svg.setAttribute("viewBox", view.join(" "));
                returnView.hidden = Math.abs(view[2] - 600) < 1;
                territory.querySelector('[data-territorio-zoom="out"]').disabled = view[2] >= 599;
                territory.querySelector('[data-territorio-zoom="in"]').disabled = view[2] <= 301;
                if (t < 1) zoomFrame = requestAnimationFrame(draw);
            };
            zoomFrame = requestAnimationFrame(draw);
        };
        const zoomFeature = feature => {
            const box = feature.getBBox();
            const width = Math.min(570, Math.max(600 / 1.75, box.width + 90, (box.height + 90) * 600 / 510));
            const height = width * 510 / 600;
            const x = Math.max(0, Math.min(600 - width, box.x + box.width / 2 - width / 2));
            const y = Math.max(0, Math.min(510 - height, box.y + box.height / 2 - height / 2));
            setView([x, y, width, height]);
        };
        const labelFeature = (key, event) => {
            const feature = features.find(el => el.dataset.mapaFeature === key);
            if (!feature || feature.getAttribute("aria-hidden") === "true") return;
            tooltip.textContent = topics[key].registeredName === null ? topics[key].waterType : topics[key].name;
            tooltip.hidden = false;
            const rect = canvas.getBoundingClientRect();
            let x = event?.clientX, y = event?.clientY;
            if (x === undefined) {
                const box = feature.getBBox(), matrix = feature.getScreenCTM();
                const point = new DOMPoint(box.x + box.width / 2, box.y + box.height / 2).matrixTransform(matrix);
                x = point.x; y = point.y;
            }
            tooltip.style.left = Math.max(10, Math.min(rect.width - tooltip.offsetWidth - 10, x - rect.left + 12)) + "px";
            tooltip.style.top = Math.max(12, Math.min(rect.height - 42, y - rect.top - 34)) + "px";
        };
        const highlight = (key, event) => {
            features.forEach(feature => feature.classList.toggle("is-highlighted", feature.dataset.mapaFeature === key));
            if (key) labelFeature(key, event); else tooltip.hidden = true;
        };
        const updateFeatures = () => {
            const visibleWater = new Set(waterKeys());
            features.forEach(feature => {
                const key = feature.dataset.mapaFeature;
                const visible = feature.dataset.mapaModo === activeMode && (activeMode !== "humedales" || visibleWater.has(key));
                feature.style.display = visible ? "" : "none";
                feature.style.pointerEvents = visible ? "" : "none";
                feature.setAttribute("aria-hidden", String(!visible));
                feature.tabIndex = visible && (activeMode === "rios" || selectedKey === key) ? 0 : -1;
                feature.classList.toggle("is-selected", visible && selectedKey === key);
                if (visible) { feature.setAttribute("role", "button"); feature.setAttribute("aria-pressed", String(selectedKey === key)); }
                else { feature.removeAttribute("role"); feature.removeAttribute("aria-pressed"); feature.classList.remove("is-highlighted"); }
            });
            territory.classList.toggle("has-selection", !!selectedKey && activeMode !== "bosques");
        };
        const showCard = key => {
            if (!key) {
                const hint = node("div", "selva-territorio-ficha-ayuda");
                hint.append(icon(modes[activeMode].icon), node("h4", "", activeMode === "rios" ? "Selecciona un río para conocerlo" : "Selecciona una masa de agua"), node("p", "", "Pulsa una geometría o utiliza las opciones del panel."));
                card.replaceChildren(hint); return;
            }
            const topic = topics[key];
            const heading = node("h4", "", topic.name), text = node("p", "", topic.text);
            const details = node("dl", "selva-territorio-metadatos");
            topic.metadata.forEach(([label, value]) => details.append(node("dt", "", label), node("dd", "", value)));
            card.replaceChildren(heading, text, details);
            if (topic.source) {
                const link = node("a", "", topic.reference + " ↗");
                link.href = topic.source; link.target = "_blank"; link.rel = "noopener noreferrer"; card.append(link);
            }
        };
        const select = (key, interact = true) => {
            if (!topics[key] || topics[key].mode !== activeMode) return;
            selectedKey = key;
            if (interact) markExplored();
            if (activeMode === "bosques") {
                territory.dataset.forest = key;
                territory.style.setProperty("--territorio-forest-color", topics[key].color);
                svg.querySelector("#territorio-arbol-conceptual").setAttribute("href", "#territorio-icono-" + key);
            }
            options.querySelectorAll("[data-territorio-tema]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.territorioTema === key)));
            const picker = options.querySelector("select"); if (picker) picker.value = key;
            updateFeatures(); showCard(key); updateLegend(); tooltip.hidden = true;
            const feature = features.find(el => el.dataset.mapaFeature === key);
            if (feature && interact) zoomFeature(feature);
        };
        const buildOptions = () => {
            options.replaceChildren();
            if (activeMode === "humedales") {
                const label = node("label", "", "Seleccionar masa de agua"); label.htmlFor = "territorio-masa-agua";
                const picker = node("select", ""); picker.id = "territorio-masa-agua";
                const placeholder = node("option", "", "Explora una laguna o un pantano"); placeholder.value = ""; picker.append(placeholder);
                waterKeys().forEach(key => { const item = node("option", "", topics[key].name); item.value = key; picker.append(item); });
                picker.value = selectedKey || ""; picker.addEventListener("change", () => { if (picker.value) select(picker.value); });
                const toggle = node("button", "selva-territorio-todos", showAll ? "Volver a la selección inicial" : "Mostrar todos los registros");
                toggle.type = "button"; toggle.dataset.territorioTodos = ""; toggle.setAttribute("aria-expanded", String(showAll));
                toggle.addEventListener("click", () => {
                    markExplored(); showAll = !showAll;
                    if (selectedKey && !waterKeys().includes(selectedKey)) { selectedKey = null; showCard(null); setView([0, 0, 600, 510]); }
                    updateFeatures(); buildOptions(); updateLegend();
                    options.querySelector("[data-territorio-todos]").focus({ preventScroll: true });
                });
                options.append(label, picker, toggle, node("small", "selva-territorio-alcance", showAll ? "Conjunto completo disponible en esta vista." : "Selección por nombre y tamaño geométrico. No mide abundancia."));
            } else {
                modes[activeMode].keys.forEach(key => {
                    const button = node("button", "selva-territorio-acceso");
                    button.type = "button"; button.dataset.territorioTema = key; button.setAttribute("aria-pressed", String(selectedKey === key));
                    if (activeMode === "bosques") {
                        button.style.setProperty("--ambient-color", topics[key].color);
                        button.append(icon(key));
                        const content = node("span", ""); content.append(node("strong", "", topics[key].name), node("small", "", topics[key].micro)); button.append(content);
                    } else button.append(icon("rios"), node("span", "", topics[key].name));
                    button.addEventListener("click", () => select(key));
                    button.addEventListener("pointerenter", event => highlight(key, event));
                    button.addEventListener("pointerleave", () => highlight(null));
                    button.addEventListener("focus", () => highlight(key));
                    button.addEventListener("blur", () => highlight(null)); options.append(button);
                });
            }
        };
        const setMode = (mode, moveFocus = false, initial = false) => {
            const scroll = { left: window.scrollX, top: window.scrollY };
            activeMode = mode; selectedKey = null; showAll = false;
            territory.dataset.territorioActivo = mode;
            tooltip.hidden = true; setView([0, 0, 600, 510], false);
            scenes.forEach(scene => {
                const visible = scene.dataset.territorioScene === mode;
                scene.style.display = visible ? "" : "none";
                scene.style.pointerEvents = visible ? "" : "none";
                scene.setAttribute("aria-hidden", String(!visible));
                if (visible) scene.removeAttribute("inert"); else scene.setAttribute("inert", "");
                scene.classList.remove("is-entering");
                if (visible) { scene.getBoundingClientRect(); scene.classList.add("is-entering"); }
            });
            tabs.forEach(tab => {
                const selected = tab.dataset.territorioModo === mode;
                tab.setAttribute("aria-selected", String(selected)); tab.tabIndex = selected ? 0 : -1;
                if (selected) { territory.querySelector("#territorio-panel").setAttribute("aria-labelledby", tab.id); if (moveFocus) tab.focus({ preventScroll: true }); }
            });
            const data = modes[mode];
            territory.querySelector(".selva-territorio-panel-titulo").textContent = data.name;
            territory.querySelector(".selva-territorio-panel-intro").textContent = data.intro;
            territory.querySelector(".selva-territorio-escena-titulo").textContent = data.name;
            territory.querySelector(".selva-territorio-escena-frase").textContent = data.phrase;
            territory.querySelector(".selva-territorio-nota-escena").textContent = data.note;
            territory.querySelectorAll(".selva-territorio-modo-icono use, .selva-territorio-panel-icono use").forEach(use => use.setAttribute("href", "#territorio-icono-" + data.icon));
            buildOptions(); updateFeatures(); showCard(null); updateLegend();
            if (mode === "bosques") select("tierra", false);
            if (!initial) markExplored();
            territory.getBoundingClientRect(); window.scrollTo({ ...scroll, behavior: "instant" });
        };
        tabs.forEach((tab, index) => {
            tab.addEventListener("click", () => { if (activeMode !== tab.dataset.territorioModo) setMode(tab.dataset.territorioModo); });
            tab.addEventListener("keydown", event => {
                const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
                if (next !== undefined) { event.preventDefault(); setMode(tabs[next].dataset.territorioModo, true); }
            });
        });
        features.forEach(feature => {
            const available = () => feature.getAttribute("aria-hidden") !== "true" && feature.dataset.mapaModo === activeMode;
            feature.addEventListener("click", () => { if (available()) select(feature.dataset.mapaFeature); });
            feature.addEventListener("keydown", event => { if (available() && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); select(feature.dataset.mapaFeature); } });
            feature.addEventListener("pointerenter", event => { if (available()) highlight(feature.dataset.mapaFeature, event); });
            feature.addEventListener("pointermove", event => { if (available()) labelFeature(feature.dataset.mapaFeature, event); });
            feature.addEventListener("pointerleave", () => highlight(null));
            feature.addEventListener("focus", () => { if (available()) highlight(feature.dataset.mapaFeature); });
            feature.addEventListener("blur", () => highlight(null));
        });
        territory.querySelectorAll("[data-territorio-zoom]").forEach(button => button.addEventListener("click", () => {
            markExplored(); tooltip.hidden = true;
            if (button.dataset.territorioZoom === "reset") { setView([0, 0, 600, 510]); return; }
            const width = Math.max(300, Math.min(600, view[2] * (button.dataset.territorioZoom === "in" ? .8 : 1.25)));
            const height = width * 510 / 600;
            setView([Math.max(0, Math.min(600 - width, view[0] + (view[2] - width) / 2)), Math.max(0, Math.min(510 - height, view[1] + (view[3] - height) / 2)), width, height]);
        }));
        returnView.addEventListener("click", () => { tooltip.hidden = true; setView([0, 0, 600, 510]); });
        reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) { cancelAnimationFrame(zoomFrame); svg.setAttribute("viewBox", view.join(" ")); } });
        setMode("bosques", false, true);
    }
