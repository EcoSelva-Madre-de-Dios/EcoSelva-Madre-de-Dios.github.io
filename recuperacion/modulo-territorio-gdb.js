    const territory = document.querySelector(".selva-territorio-layout");
    if (territory) {
        const topics = JSON.parse(document.getElementById("selva-territorio-datos").textContent);
        const waterKeys = Object.keys(topics).filter(key => topics[key].mode === "humedales");
        waterKeys.sort((a, b) => topics[a].name.localeCompare(topics[b].name, "es", { numeric: true }));
        const modes = {
            bosques: { name: "Bosques", intro: "Cobertura de bosque en preparación.", keys: ["bosque-pendiente"], legend: "Contorno departamental referencial · sin capa de cobertura forestal" },
            rios: { name: "Ríos", intro: "Selecciona un río en el mapa o en el panel.", keys: ["madre", "tambopata", "inambari", "piedras", "manu", "heath"], legend: "Ríos principales verificados · trazados simplificados" },
            humedales: { name: "Humedales", intro: "Lagunas y pantanos registrados en MasaAgua. No es una cobertura completa de humedales.", keys: waterKeys, legend: "Masas de agua · clasificación original: lagunas y pantanos" }
        };
        const tabs = [...document.querySelectorAll("[data-territorio-modo]")];
        const features = [...territory.querySelectorAll("[data-mapa-feature]")];
        const options = territory.querySelector(".selva-territorio-opciones");
        const card = territory.querySelector(".selva-territorio-ficha");
        let activeMode = "bosques";
        let selectedKey;
        const highlight = key => features.forEach(feature => feature.classList.toggle("is-highlighted", feature.dataset.mapaFeature === key));
        const select = key => {
            const topic = topics[key];
            if (!topic) return;
            if (activeMode !== topic.mode) setMode(topic.mode);
            selectedKey = key;
            features.forEach(feature => {
                const selected = feature.dataset.mapaFeature === key;
                feature.classList.toggle("is-selected", selected);
                feature.setAttribute("aria-pressed", String(selected));
                feature.tabIndex = feature.dataset.mapaModo === activeMode && (activeMode === "rios" || selected) ? 0 : -1;
            });
            options.querySelectorAll("button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.territorioTema === key)));
            const picker = options.querySelector("select");
            if (picker) picker.value = key;
            const heading = document.createElement("h4");
            heading.textContent = topic.name;
            const text = document.createElement("p");
            text.textContent = topic.text;
            const details = document.createElement("dl");
            details.className = "selva-territorio-metadatos";
            topic.metadata.forEach(([label, value]) => {
                const term = document.createElement("dt");
                term.textContent = label;
                const description = document.createElement("dd");
                description.textContent = value;
                details.append(term, description);
            });
            card.replaceChildren(heading, text, details);
            highlight(key);
        };
        const setMode = (mode, moveFocus = false) => {
            const previousScroll = { left: window.scrollX, top: window.scrollY };
            activeMode = mode;
            const data = modes[mode];
            territory.dataset.territorioActivo = mode;
            tabs.forEach(tab => {
                const selected = tab.dataset.territorioModo === mode;
                tab.setAttribute("aria-selected", String(selected));
                tab.tabIndex = selected ? 0 : -1;
                if (selected) {
                    territory.querySelector("#territorio-panel").setAttribute("aria-labelledby", tab.id);
                    if (moveFocus) tab.focus({ preventScroll: true });
                }
            });
            territory.querySelector(".selva-territorio-panel-titulo").textContent = data.name;
            territory.querySelector(".selva-territorio-panel-intro").textContent = data.intro;
            territory.querySelector(".selva-territorio-leyenda").textContent = data.legend;
            options.replaceChildren();
            if (mode === "humedales") {
                const label = document.createElement("label");
                label.htmlFor = "territorio-masa-agua";
                label.textContent = "Seleccionar masa de agua";
                const picker = document.createElement("select");
                picker.id = "territorio-masa-agua";
                data.keys.forEach(key => {
                    const option = document.createElement("option");
                    option.value = key;
                    option.textContent = topics[key].name;
                    picker.append(option);
                });
                picker.addEventListener("change", () => select(picker.value));
                options.append(label, picker);
            } else if (mode === "rios") {
                data.keys.forEach(key => {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.dataset.territorioTema = key;
                    button.textContent = topics[key].name;
                    button.setAttribute("aria-pressed", "false");
                    button.addEventListener("click", () => select(key));
                    button.addEventListener("pointerenter", () => highlight(key));
                    button.addEventListener("pointerleave", () => highlight(selectedKey));
                    options.append(button);
                });
            }
            features.forEach(feature => {
                const visible = feature.dataset.mapaModo === "rios" || mode === "humedales";
                feature.style.display = visible ? "" : "none";
                feature.tabIndex = mode === "rios" && feature.dataset.mapaModo === "rios" ? 0 : -1;
                feature.setAttribute("aria-hidden", String(!visible));
            });
            select(data.keys[0]);
            territory.getBoundingClientRect();
            window.scrollTo({ ...previousScroll, behavior: "instant" });
        };
        tabs.forEach((tab, index) => {
            tab.addEventListener("click", () => setMode(tab.dataset.territorioModo));
            tab.addEventListener("keydown", event => {
                let next;
                if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
                if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
                if (event.key === "Home") next = 0;
                if (event.key === "End") next = tabs.length - 1;
                if (next !== undefined) { event.preventDefault(); setMode(tabs[next].dataset.territorioModo, true); }
            });
        });
        features.forEach(feature => {
            feature.addEventListener("click", () => select(feature.dataset.mapaFeature));
            feature.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(feature.dataset.mapaFeature); }
            });
            feature.addEventListener("pointerenter", () => highlight(feature.dataset.mapaFeature));
            feature.addEventListener("pointerleave", () => highlight(selectedKey));
        });
        setMode("bosques");
    }


