    const territory = document.querySelector(".selva-territorio-layout");
    if (territory) {
        const minamEcosystems = "https://sinia.minam.gob.pe/sites/default/files/sinia/archivos/public/docs/memoria_mapa_ecosistemas.pdf";
        const minamRivers = "https://www.idep.gob.pe/geoportal/rest/services/INSTITUCIONALES/IDER_AMAZONICOS/MapServer/41";
        const topics = {
            tierra: { name: "Bosque de tierra firme", text: "Ambiente forestal no sujeto a las inundaciones periódicas de las crecientes. Símbolo ilustrativo, sin ubicación cartográfica.", source: minamEcosystems, reference: "MINAM · memoria de ecosistemas, 2019" },
            inundable: { name: "Bosque inundable", text: "Bosque de llanuras aluviales que experimenta inundaciones periódicas. Símbolo ilustrativo, sin ubicación cartográfica.", source: minamEcosystems, reference: "MINAM · memoria de ecosistemas, 2019" },
            aguajal: { name: "Aguajal", text: "Bosque de zonas húmedas donde el aguaje (Mauritia flexuosa) puede ser un componente dominante. Símbolo ilustrativo, sin ubicación cartográfica.", source: minamEcosystems, reference: "MINAM · memoria de ecosistemas, 2019" },
            secundario: { name: "Bosque secundario", text: "Vegetación leñosa que vuelve a desarrollarse en terrenos donde la vegetación original fue eliminada por actividades humanas. El símbolo no indica cobertura actual.", source: "https://www.minam.gob.pe/wp-content/uploads/2013/10/compendio_04_-_aprovechamiento_de_rrnn_2.pdf", reference: "MINAM · compendio de aprovechamiento de recursos naturales, definición 3.11" },
            cocha: { name: "Cocha / lago de herradura", text: "Un antiguo meandro puede quedar aislado cuando cambia el cauce del río. Símbolo ilustrativo, sin ubicación cartográfica.", source: "https://visitaareasnaturales.sernanp.gob.pe/anps/reserva-nacional-tambopata/", reference: "SERNANP · Reserva Nacional Tambopata" }
        };
        [ ["madre", "Río Madre de Dios"], ["tambopata", "Río Tambopata"], ["inambari", "Río Inambari"], ["piedras", "Río Las Piedras"], ["heath", "Río Heath"], ["manu", "Río Manu"] ].forEach(([key, name]) => {
            topics[key] = { name, text: "Trazado simplificado de la capa de ríos de IDER Amazónicos, recortado al límite departamental. El grosor de línea es gráfico y no representa anchura ni caudal.", source: minamRivers, reference: "IDEP · IDER Amazónicos, Ríos; año de origen no indicado" };
        });
        const modes = {
            bosques: { name: "Bosques", intro: "Ambientes forestales que pueden solaparse.", keys: ["tierra", "inundable", "aguajal", "secundario"] },
            rios: { name: "Ríos", intro: "Explora los principales cursos de agua.", keys: ["madre", "tambopata", "inambari", "piedras", "manu", "heath"] },
            humedales: { name: "Humedales", intro: "Ambientes conectados con el agua.", keys: ["aguajal", "cocha", "inundable"] }
        };
        const tabs = [...document.querySelectorAll("[data-territorio-modo]")];
        const features = [...territory.querySelectorAll("[data-mapa-feature]")];
        const options = territory.querySelector(".selva-territorio-opciones");
        const card = territory.querySelector(".selva-territorio-ficha");
        let activeMode = "bosques";
        let selectedKey;
        const highlight = (key) => {
            features.forEach((feature) => feature.classList.toggle("is-highlighted", feature.dataset.mapaFeature === key));
        };
        const select = (key) => {
            if (!modes[activeMode].keys.includes(key)) {
                setMode(["madre", "tambopata", "inambari", "piedras", "heath", "manu"].includes(key) ? "rios" : "humedales");
            }
            selectedKey = key;
            const topic = topics[key];
            features.forEach((feature) => {
                const selected = feature.dataset.mapaFeature === key;
                feature.classList.toggle("is-selected", selected);
                feature.setAttribute("aria-pressed", String(selected));
            });
            options.querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.territorioTema === key)));
            const heading = document.createElement("h4");
            heading.textContent = topic.name;
            const text = document.createElement("p");
            text.textContent = topic.text;
            const source = document.createElement("a");
            source.href = topic.source;
            source.textContent = topic.reference + " ↗";
            source.target = "_blank";
            source.rel = "noopener noreferrer";
            card.replaceChildren(heading, text, source);
            highlight(key);
        };
        const setMode = (mode, moveFocus = false) => {
            activeMode = mode;
            const data = modes[mode];
            territory.dataset.territorioActivo = mode;
            tabs.forEach((tab) => {
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
            options.replaceChildren();
            data.keys.forEach((key) => {
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
            features.forEach((feature) => {
                const visible = mode === "rios" ? feature.classList.contains("selva-territorio-rio") : (feature.classList.contains("selva-territorio-rio") || data.keys.includes(feature.dataset.mapaFeature));
                feature.style.display = visible ? "" : "none";
                feature.tabIndex = visible ? 0 : -1;
            });
            select(data.keys[0]);
        };
        tabs.forEach((tab, index) => {
            tab.addEventListener("click", () => setMode(tab.dataset.territorioModo));
            tab.addEventListener("keydown", (event) => {
                let next;
                if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
                if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
                if (event.key === "Home") next = 0;
                if (event.key === "End") next = tabs.length - 1;
                if (next !== undefined) { event.preventDefault(); setMode(tabs[next].dataset.territorioModo, true); }
            });
        });
        features.forEach((feature) => {
            feature.addEventListener("click", () => select(feature.dataset.mapaFeature));
            feature.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(feature.dataset.mapaFeature); }
            });
            feature.addEventListener("pointerenter", () => highlight(feature.dataset.mapaFeature));
            feature.addEventListener("pointerleave", () => highlight(selectedKey));
        });
        setMode("bosques");
    }

