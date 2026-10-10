/* Visor y actividades de Territorio: conserva los datos cartográficos originales. */
document.addEventListener("DOMContentLoaded", () => {
    const revealReference = () => {
        let target; try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { return; }
        if (!target) return;
        let ancestor = target;
        while (ancestor) { if (ancestor.localName === "details") ancestor.open = true; ancestor = ancestor.parentElement; }
        requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
    };
    revealReference(); window.addEventListener("hashchange", revealReference);
    const territory = document.querySelector(".selva-territorio-layout");
    if (territory) {
        let exploreTopic = null, pendingTopic = null;
        let requestedMode = null;
        let topics, forestData, forestDescriptions, lectura, atlasPresentation, administrativeData;
        let origin = null;
        const returnOrigin = territory.querySelector(".territorio-retorno");
        returnOrigin.addEventListener("click", () => {
            if (!origin?.button.isConnected) return;
            const previous = origin; origin = null; returnOrigin.hidden = true;
            window.scrollTo({ top: previous.y, behavior: "instant" });
            previous.button.focus({ preventScroll: true });
        });
        const sourceModal = document.getElementById("selva-territorio-fuentes-modal");
        const sourceBody = sourceModal.querySelector(".selva-territorio-fuentes-modal-cuerpo");
        window.ecoDialog.register(sourceModal, { closeSelector: '.selva-territorio-fuentes-cerrar' });
        const openSources = (trigger, content, title, type) => {
            if (document.querySelector("dialog[open]")) return;
            sourceBody.replaceChildren(...[...content.childNodes].filter(child => child.nodeName !== "SUMMARY").map(child => child.cloneNode(true)));
            sourceModal.querySelector("h3").textContent = title; sourceModal.dataset.sourceType = type;
            window.ecoDialog.open(sourceModal, trigger);
        };
        territory.closest("#explora-madre-de-dios").querySelector(".selva-territorio-fuentes-abrir").addEventListener("click", event => {
            const content = territory.closest("#explora-madre-de-dios").querySelector(".selva-territorio-fuentes");
            openSources(event.currentTarget, content, "Fuentes y metodología del mapa", "metodologia");
        });

        const initializeTerritory = () => {
            Object.assign(topics, forestData.topics);
            const forestCategories = forestData.categories;
            const svg = territory.querySelector(".selva-territorio-svg");
            const canvas = territory.querySelector(".selva-territorio-canvas");
            const scenes = [...svg.querySelectorAll("[data-territorio-scene]")];
            let features = [...svg.querySelectorAll("[data-mapa-feature]")];
            const options = territory.querySelector(".selva-territorio-opciones");
            const card = territory.querySelector(".selva-territorio-ficha");
            const legend = territory.querySelector(".selva-territorio-leyenda");
            const tooltip = territory.querySelector(".selva-territorio-tooltip");
            const returnView = territory.querySelector(".selva-territorio-volver-vista");
            const helper = territory.querySelector(".selva-territorio-ayuda");
            const resetButton = territory.querySelector(".territorio-restablecer");
            const layerStatus = territory.querySelector("[data-territorio-capas-status]");
            const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
            const thematicInputs = [...territory.querySelectorAll("[data-territorio-capa]")];
            const overlayInputs = [...territory.querySelectorAll("[data-territorio-overlay-toggle]")];
            const allLayerInputs = [...overlayInputs, ...thematicInputs];
            const enabledLayers = new Set();
            const activationOrder = [];
            const overlayLabels = [];
            const activeFilters = { anp: "todos", humedales: "todos" };
            const sourceNames = {
                provincias: "Base administrativa de referencia",
                distritos: "Base administrativa de referencia",
                bosques: "MINAM · 2015",
                rios: "Base hidrográfica documentada",
                humedales: "MasaAgua · registro cartográfico",
                anp: "SERNANP · consulta 5 de octubre de 2026"
            };
            const modes = {
                provincias: { name: "Provincias", phrase: "Tres provincias de Madre de Dios.", intro: "Selecciona una provincia para ubicarla y consultar el alcance de sus datos.", icon: "mapas", keys: [], note: "Límites de referencia educativa; entidad generadora, fecha y escala no documentadas." },
                distritos: { name: "Distritos", phrase: "Once distritos organizados por provincia.", intro: "Busca o selecciona un distrito para reconocer su ubicación.", icon: "mapas", keys: [], note: "Límites de referencia educativa; no sustituyen cartografía demarcatoria oficial." },
                bosques: { name: "Bosques y cobertura", phrase: "Cobertura vegetal · MINAM, 2015.", intro: "Explora las 27 categorías originales presentes en el recorte de Madre de Dios.", icon: "bosques", keys: forestCategories.map(category => category.id), note: "Cartografía publicada en 2015. No representa necesariamente el estado actual del territorio." },
                rios: { name: "Ríos", phrase: "Seis cursos de agua documentados.", intro: "Selecciona un río para seguir el trazado disponible y consultar su registro.", icon: "rios", keys: ["madre", "tambopata", "inambari", "piedras", "manu", "heath"], note: "El grosor gráfico no representa anchura ni caudal. La selección no abarca toda la red hidrográfica." },
                humedales: { name: "Humedales", phrase: "Lagunas y pantanos registrados.", intro: "Filtra o busca los registros de MasaAgua disponibles.", icon: "humedales", keys: [], note: "La clasificación distingue lagunas y pantanos; no identifica aguajales por sí sola." },
                anp: { name: "Áreas naturales protegidas", phrase: "Seis ANP nacionales con territorio en Madre de Dios.", intro: "Filtra por categoría y selecciona un área para comparar su superficie total con la porción departamental.", icon: "conservacion", keys: [], note: "Geometrías SERNANP recortadas para la vista. No incluyen ACP ni sustituyen documentos legales." }
            };

            const slug = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            const formatHectares = value => {
                const [whole, decimals] = Number(value).toFixed(2).split(".");
                return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + decimals + " ha";
            };
            administrativeData.provinces.features.forEach((feature, index) => {
                const key = "provincia-" + slug(feature.properties.provincia);
                modes.provincias.keys.push(key);
                topics[key] = {
                    name: feature.properties.provincia, mode: "provincias",
                    text: "Provincia representada mediante la base administrativa disponible en el proyecto.",
                    metadata: [["Provincia", feature.properties.provincia], ["Distritos asociados", String(feature.properties.distritos_fid?.length || "No documentado")], ["Fuente", sourceNames.provincias], ["Fecha y escala", "No documentadas"], ["Uso", "Referencia educativa; no demarcación legal"]],
                    source: "fuentes-metodologia.html#metodologia-capa-3", reference: "Metodología de límites administrativos", overlayIndex: index
                };
            });
            administrativeData.districts.features.forEach((feature, index) => {
                const key = "distrito-" + index + "-" + slug(feature.properties.distrito_);
                modes.distritos.keys.push(key);
                topics[key] = {
                    name: feature.properties.distrito_, mode: "distritos",
                    text: "Distrito representado mediante la base administrativa disponible en el proyecto.",
                    metadata: [["Distrito", feature.properties.distrito_], ["Provincia", feature.properties.provincia], ["Situación del límite", feature.properties.situac_lim || "No documentada"], ["Validación registrada", feature.properties.validado || "No documentada"], ["Fecha y escala", "No documentadas"], ["Uso", "Referencia educativa; no demarcación legal"]],
                    source: "fuentes-metodologia.html#metodologia-capa-3", reference: "Metodología de límites administrativos", overlayIndex: index
                };
            });
            administrativeData.anp.features.forEach((feature, index) => {
                const properties = feature.properties;
                const key = "anp-" + properties.id;
                modes.anp.keys.push(key);
                topics[key] = {
                    name: properties.nombre, mode: "anp", category: properties.categoria, anpId: properties.id,
                    text: "Área natural protegida de administración nacional con territorio dentro de Madre de Dios.",
                    metadata: [["Categoría", properties.categoria], ["Código", properties.codigo], ["Departamentos", properties.departamentos.join(" · ")], ["Superficie total del ANP", formatHectares(properties.total_ha)], ["Dentro de Madre de Dios", formatHectares(properties.mdd_ha)], ["Fuente cartográfica", "SERNANP · GeoSERNANP"], ["Consulta", "5 de octubre de 2026"], ["Alcance", "La geometría del visor está recortada a Madre de Dios; las superficies proceden de fuentes oficiales y no se calculan desde el dibujo"]],
                    source: "areas-protegidas.html#ficha-" + properties.id, reference: "Abrir ficha documentada del ANP", overlayIndex: index
                };
            });
            modes.humedales.keys = Object.keys(topics).filter(key => topics[key].mode === "humedales").sort((a, b) => topics[a].name.localeCompare(topics[b].name, "es"));

            let activeMode = null, selectedKey = null, zoomFrame = 0, lastDragAt = 0;
            let view = [0, 0, 600, 510];
            let forestPromise = null, forestReady = false, forestError = "", overlayError = "";
            const overlayPromises = new Map(), readyOverlays = new Set();
            const overlayFiles = { provincias: "datos/presentacion/provincias.svg", distritos: "datos/presentacion/distritos.svg", anp: "datos/presentacion/anp.svg" };
            const labelLayer = svg.querySelector(".selva-territorio-etiquetas");
            const scaleElement = territory.querySelector(".selva-territorio-escala");
            const metresPerSvgUnit = atlasPresentation.metros_por_unidad_svg;
            svg.querySelector(".selva-territorio-colindantes")?.setAttribute("aria-hidden", "true");
            svg.querySelectorAll(".selva-territorio-provincias-limites,.selva-territorio-provincias-nombres").forEach(layer => layer.style.display = "none");
            const contextLabels = [...svg.querySelectorAll(".selva-territorio-colindantes text")].map(text => ({ text, anchor: { x: Number(text.getAttribute("x")), y: Number(text.getAttribute("y")) }, priority: 5, size: 10 }));
            const pointLabels = new Map(atlasPresentation.etiquetas.filter(item => item.id).map(item => [item.id, item]));
            const labelSettings = { madre: [.53, 18, -19], tambopata: [.5, 14, 22], inambari: [.72, -35, 22], piedras: [.48, 18, -22], manu: [.52, -32, -20], heath: [.45, -30, -15] };
            const mapLabels = Object.entries(labelSettings).map(([key, settings]) => {
                const visual = svg.querySelector(`[data-mapa-feature="${key}"] .selva-territorio-rio-linea`);
                const path = visual.localName === "use" ? svg.querySelector(visual.getAttribute("href")) : visual;
                const group = document.createElementNS(svg.namespaceURI, "g");
                const text = document.createElementNS(svg.namespaceURI, "text");
                group.dataset.mapLabel = key; text.textContent = topics[key].name.replace("Río ", ""); group.append(text); labelLayer.append(group);
                return { key, path, group, text, settings };
            });
            const selectedLabel = document.createElementNS(svg.namespaceURI, "text"); labelLayer.append(selectedLabel);
            const outline = svg.querySelector(".selva-territorio-limite").cloneNode(true);
            outline.removeAttribute("class"); outline.classList.add("eco-atlas-boundary"); outline.setAttribute("aria-hidden", "true"); svg.insertBefore(outline, labelLayer);

            const node = (tag, className, text) => {
                const element = document.createElement(tag); if (className) element.className = className; if (text !== undefined && text !== null) element.textContent = text; return element;
            };
            const icon = key => {
                const element = document.createElementNS("http://www.w3.org/2000/svg", "svg"); element.setAttribute("viewBox", "0 0 24 24"); element.setAttribute("aria-hidden", "true");
                const use = document.createElementNS(element.namespaceURI, "use"); use.setAttribute("href", "#territorio-icono-" + key); element.append(use); return element;
            };
            const inputForMode = mode => allLayerInputs.find(input => (input.dataset.territorioCapa || input.dataset.territorioOverlayToggle) === mode);
            const isEnabled = mode => enabledLayers.has(mode);
            const visibleKeys = mode => {
                if (mode === "humedales" && activeFilters.humedales !== "todos") return modes.humedales.keys.filter(key => topics[key].waterType === activeFilters.humedales);
                if (mode === "anp" && activeFilters.anp !== "todos") return modes.anp.keys.filter(key => topics[key].category === activeFilters.anp);
                return modes[mode]?.keys || [];
            };
            const updateStatus = () => {
                const names = activationOrder.filter(isEnabled).map(mode => modes[mode].name);
                layerStatus.textContent = (names.length ? "Capas visibles: " + names.join(" · ") + "." : "Vista general lista. No hay capas temáticas activadas.") +
                    (overlayPromises.size ? " Cargando contornos…" : "") + (forestPromise ? " Cargando cobertura MINAM 2015…" : "") +
                    (overlayError ? " " + overlayError : "") + (forestError ? " " + forestError : "");
            };
            const updateScale = () => {
                const matrix = svg.getScreenCTM(); if (!matrix) return; window.ecoAtlas.scale(svg, scaleElement, metresPerSvgUnit); territory.classList.toggle("is-zoomed", view[2] < 599);
            };
            const updateMapLabels = () => {
                const zoom = 600 / view[2];
                const candidates = contextLabels.map(item => ({ ...item, visible: zoom < 1.45 }));
                mapLabels.forEach(({ key, path, group, text, settings }) => {
                    const point = path.getPointAtLength(path.getTotalLength() * settings[0]);
                    candidates.push({ text, group, anchor: {x: point.x, y: point.y}, offsets: [[settings[1], settings[2]], [0, -14], [0, 14]], priority: key === selectedKey ? 100 : 70, size: key === selectedKey ? 13 : 11, visible: isEnabled("rios") });
                });
                const selectedPoint = pointLabels.get(selectedKey);
                selectedLabel.textContent = selectedKey && topics[selectedKey] ? topics[selectedKey].name : "";
                candidates.push({ text: selectedLabel, anchor: selectedPoint || {x: 0, y: 0}, priority: 100, size: 13, visible: Boolean(selectedPoint && selectedKey && isEnabled(topics[selectedKey].mode)) });
                overlayLabels.forEach(item => candidates.push({ ...item, visible: isEnabled(item.layer) && (item.key === selectedKey || item.layer === "provincias" || zoom >= (item.layer === "anp" ? 1.35 : 1.75)), size: item.layer === "provincias" ? 11.5 : 10, priority: item.key === selectedKey ? 100 : item.layer === "provincias" ? 65 : 35 }));
                window.ecoAtlas.labels(svg, candidates, [...canvas.querySelectorAll(".selva-territorio-ubicacion,.selva-territorio-brujula,.selva-territorio-controles,.selva-territorio-escala")]);
            };
            const setView = (next, animate = true) => {
                cancelAnimationFrame(zoomFrame); const before = [...view], started = performance.now();
                const draw = time => {
                    const progress = !animate || reducedMotion.matches ? 1 : Math.min(1, (time - started) / 420); const eased = 1 - Math.pow(1 - progress, 3);
                    view = before.map((value, index) => value + (next[index] - value) * eased); svg.setAttribute("viewBox", view.join(" ")); updateMapLabels(); updateScale();
                    returnView.hidden = Math.abs(view[2] - 600) < 1; territory.querySelector('[data-territorio-zoom="out"]').disabled = view[2] >= 599; territory.querySelector('[data-territorio-zoom="in"]').disabled = view[2] <= 301;
                    if (progress < 1) zoomFrame = requestAnimationFrame(draw);
                }; zoomFrame = requestAnimationFrame(draw);
            };
            const zoomFeature = feature => {
                const box = feature.getBBox(); const width = Math.min(570, Math.max(600 / 1.8, box.width + 90, (box.height + 90) * 600 / 510)); const height = width * 510 / 600;
                setView([Math.max(0, Math.min(600 - width, box.x + box.width / 2 - width / 2)), Math.max(0, Math.min(510 - height, box.y + box.height / 2 - height / 2)), width, height]);
            };
            const forestColors = Object.fromEntries(forestData.categories.map(category => [category.id, category.color]));
            const displayPalette = {"Ano-ba":"#c4b396","Bca":"#234c3b","Bca-pa":"#667b39","Bcb":"#499367","Bcb-cas":"#9c8057","Bcb-pa":"#8eb363","Bcb-Shi":"#256665","Bllm":"#659e95","Bm":"#294d52","Bm-al":"#abc0b6","Bm-ba":"#44756a","Bm-ba-pa":"#b3be75","Bm-pa":"#496526","Bm-mo":"#76845f","Bta":"#71a48f","Bta-cas":"#baa06c","Bta-pa":"#a6cb8f","Btb":"#318f99","Btb-cas":"#d3c68a","Btb-pa":"#7cbdb0","Bi-pal":"#87944b","L/Co":"#78b8c2","Pac":"#b6a250","Pj":"#d5c493","R":"#408899","Sahi-pal":"#c7d6a0","Is":"#9cafa3"};
            forestData.categories.forEach(category => forestColors[category.id] = displayPalette[category.codigo_original] || category.color);
            const filterForest = key => svg.querySelectorAll("#territorio-bosques-capa [data-forest-category],#territorio-bosques-capa [data-bosque-tipo]").forEach(polygon => {
                const category = (polygon.dataset.bosqueTipo || polygon.dataset.forestCategory).replace("tierra-firme", "tierra"); const selected = !key || category === key;
                if (forestColors[category]) polygon.style.fill = forestColors[category]; polygon.style.opacity = selected ? ".9" : ".12"; polygon.classList.toggle("is-selected", Boolean(key && selected));
            });
            const bindFeature = feature => {
                if (feature.dataset.territorioBound === "true") return; feature.dataset.territorioBound = "true";
                const available = () => feature.getAttribute("aria-hidden") !== "true" && isEnabled(feature.dataset.mapaModo);
                feature.addEventListener("click", () => { if (available() && performance.now() - lastDragAt >= 250) select(feature.dataset.mapaFeature); });
                feature.addEventListener("keydown", event => { if (available() && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); select(feature.dataset.mapaFeature); } });
                feature.addEventListener("pointerenter", event => { if (available()) highlight(feature.dataset.mapaFeature, event); });
                feature.addEventListener("pointermove", event => { if (available()) labelFeature(feature.dataset.mapaFeature, event); });
                feature.addEventListener("pointerleave", () => highlight(null)); feature.addEventListener("focus", () => { if (available()) highlight(feature.dataset.mapaFeature); }); feature.addEventListener("blur", () => highlight(null));
            };
            const loadForest = () => {
                if (forestReady) return Promise.resolve(); if (forestPromise) return forestPromise; forestError = "";
                forestPromise = (async () => {
                    const response = await fetch(window.ecoResourceURL("datos/presentacion/bosques.svg")); if (!response.ok) throw new Error("Cobertura: HTTP " + response.status);
                    const doc = new DOMParser().parseFromString(await response.text(), "image/svg+xml"); const incoming = [...doc.querySelectorAll("[data-mapa-feature]")];
                    if (doc.querySelector("parsererror") || incoming.length !== forestData.categories.length) throw new Error("Cobertura incompleta");
                    incoming.forEach(group => { const target = features.find(feature => feature.dataset.mapaFeature === group.dataset.mapaFeature); if (!target) throw new Error("Categoría ausente"); [...group.children].filter(child => child.localName === "path").forEach(path => target.append(document.importNode(path, true))); });
                    forestReady = true; filterForest(selectedKey && topics[selectedKey]?.mode === "bosques" ? selectedKey : null);
                })().catch(error => { console.error("No se pudo cargar la cobertura:", error); forestError = "No se pudo cargar la cobertura. Desactiva y activa Bosques para volver a intentar."; })
                    .finally(() => { forestPromise = null; updateStatus(); updateFeatures(); }); updateStatus(); return forestPromise;
            };
            const overlayRecord = (name, index) => {
                const key = modes[name].keys[index]; const point = atlasPresentation.etiquetas.filter(item => item.capa === name)[index]; return { key, point };
            };
            const loadOverlay = name => {
                if (readyOverlays.has(name)) return Promise.resolve(); if (overlayPromises.has(name)) return overlayPromises.get(name); overlayError = "";
                const promise = (async () => {
                    const response = await fetch(window.ecoResourceURL(overlayFiles[name])); if (!response.ok) throw new Error("HTTP " + response.status);
                    const doc = new DOMParser().parseFromString(await response.text(), "image/svg+xml"); const original = doc.querySelector(`[data-territorio-overlay="${name}"]`);
                    if (doc.querySelector("parsererror") || !original) throw new Error("Capa inválida: " + name);
                    const group = document.importNode(original, true); group.setAttribute("clip-path", "url(#territorio-limite-clip)"); group.removeAttribute("pointer-events"); group.dataset.territorioOverlay = name;
                    [...group.children].filter(child => child.localName === "path").forEach((path, index) => {
                        const { key, point } = overlayRecord(name, index); if (!key) return; path.dataset.mapaFeature = key; path.dataset.mapaModo = name; path.classList.add("territorio-overlay-feature", "territorio-overlay-feature--" + name);
                        if (name === "anp") { path.dataset.anpCategoria = topics[key].category; path.style.strokeDasharray = topics[key].category === "Parque Nacional" ? "none" : topics[key].category === "Reserva Nacional" ? "9 4" : "3 4"; }
                        features.push(path); bindFeature(path);
                        if (point) { const text = document.createElementNS(svg.namespaceURI, "text"); text.textContent = topics[key].name.replace(/^Parque Nacional (del |de )?/i, "").replace(/^Reserva (Nacional|Comunal) /i, ""); labelLayer.append(text); overlayLabels.push({text, anchor: point, layer: name, key}); }
                    });
                    labelLayer.parentElement.insertBefore(group, labelLayer); readyOverlays.add(name);
                })().catch(error => { console.error("No se pudo cargar la capa:", error); inputForMode(name).checked = false; enabledLayers.delete(name); overlayError = "No se pudo cargar " + modes[name].name + ". Activa su casilla para volver a intentar."; })
                    .finally(() => { overlayPromises.delete(name); updateScenes(); updateFeatures(); updateLegend(); updateMapLabels(); updateStatus(); });
                overlayPromises.set(name, promise); updateStatus(); return promise;
            };
            const updateScenes = () => {
                scenes.forEach(scene => { const visible = isEnabled(scene.dataset.territorioScene); scene.style.display = visible ? "" : "none"; scene.style.pointerEvents = visible ? "" : "none"; scene.setAttribute("aria-hidden", String(!visible)); if (visible) scene.removeAttribute("inert"); else scene.setAttribute("inert", ""); });
                overlayInputs.forEach(input => svg.querySelectorAll(`[data-territorio-overlay="${input.dataset.territorioOverlayToggle}"]`).forEach(group => group.style.display = input.checked ? "" : "none")); updateStatus();
            };
            const updateFeatures = () => {
                const allowed = new Set(activeMode ? visibleKeys(activeMode) : []);
                features.forEach(feature => {
                    const key = feature.dataset.mapaFeature, mode = feature.dataset.mapaModo;
                    const visible = isEnabled(mode) && (mode !== "bosques" || modes.bosques.keys.includes(key)) && (mode !== "humedales" || activeMode !== "humedales" || allowed.has(key)) && (mode !== "anp" || activeMode !== "anp" || allowed.has(key));
                    feature.style.display = visible ? "" : "none"; feature.style.pointerEvents = visible ? "" : "none"; feature.setAttribute("aria-hidden", String(!visible)); feature.tabIndex = visible ? 0 : -1; feature.classList.toggle("is-selected", visible && selectedKey === key);
                    if (visible) { feature.setAttribute("role", "button"); feature.setAttribute("aria-label", "Explorar " + topics[key].name); feature.setAttribute("aria-pressed", String(selectedKey === key)); } else { feature.removeAttribute("role"); feature.removeAttribute("aria-pressed"); feature.classList.remove("is-highlighted"); }
                }); territory.classList.toggle("has-selection", Boolean(selectedKey));
            };
            const updateLegend = () => {
                legend.replaceChildren(); const heading = text => legend.append(node("strong", "eco-atlas-legend-heading", text));
                const sample = (kind, text) => { const item = node("span", "selva-territorio-leyenda-item"); item.append(node("i", "selva-territorio-muestra selva-territorio-muestra--" + kind), node("span", "", text)); legend.append(item); };
                if (isEnabled("provincias")) { heading("Provincias"); sample("provincias", "Límite provincial de referencia"); }
                if (isEnabled("distritos")) { heading("Distritos"); sample("distritos", "Límite distrital de referencia"); }
                if (isEnabled("bosques")) { heading("Cobertura vegetal · MINAM, 2015"); modes.bosques.keys.forEach(key => { const item = node("span", "selva-territorio-leyenda-item"); const swatch = node("i", "selva-territorio-color"); swatch.style.backgroundColor = forestColors[key]; item.append(swatch, node("span", "", topics[key].name)); legend.append(item); }); legend.append(node("small", "selva-territorio-leyenda-aviso", "27 categorías originales presentes; colores de visualización EcoSelva.")); }
                if (isEnabled("rios")) { heading("Ríos"); sample("rio", "Curso representado"); }
                if (isEnabled("humedales")) { heading("Humedales"); sample("laguna", "Laguna"); sample("pantano", "Pantano"); }
                if (isEnabled("anp")) { heading("Áreas naturales protegidas"); sample("anp-pn", "Parque nacional"); sample("anp-rn", "Reserva nacional"); sample("anp-rc", "Reserva comunal"); }
                if (!legend.childElementCount) legend.append(node("span", "", "Contorno departamental de referencia; capas temáticas desactivadas."));
            };
            const labelFeature = (key, event) => {
                const feature = features.find(item => item.dataset.mapaFeature === key); if (!feature || feature.getAttribute("aria-hidden") === "true") return;
                tooltip.textContent = topics[key].registeredName === null ? topics[key].waterType : topics[key].name; tooltip.hidden = false;
                const rect = canvas.getBoundingClientRect(); let x = event?.clientX, y = event?.clientY;
                if (x === undefined) { const box = feature.getBBox(), matrix = feature.getScreenCTM(), point = new DOMPoint(box.x + box.width / 2, box.y + box.height / 2).matrixTransform(matrix); x = point.x; y = point.y; }
                tooltip.style.left = Math.max(10, Math.min(rect.width - tooltip.offsetWidth - 10, x - rect.left + 12)) + "px"; tooltip.style.top = Math.max(12, Math.min(rect.height - 42, y - rect.top - 34)) + "px";
            };
            const highlight = (key, event) => { features.forEach(feature => feature.classList.toggle("is-highlighted", feature.dataset.mapaFeature === key)); mapLabels.forEach(label => label.group.classList.toggle("is-highlighted", label.key === key)); if (key) labelFeature(key, event); else tooltip.hidden = true; };
            const appendLearning = (key, target) => {
                const topic = topics[key]; if (!["bosques", "rios", "humedales"].includes(topic.mode)) return;
                const more = node("details", "territorio-ficha-aprender"); more.append(node("summary", "", "Comprender esta capa")); const dl = node("dl", ""); const add = (label, value) => dl.append(node("dt", "", label), node("dd", "", value));
                if (topic.mode === "rios" && lectura.rios[key]) { const record = lectura.rios[key]; add("Ubicación del trazado", lectura.ubicacion); add("Importancia", record.importancia); add("Ambientes relacionados", record.ambientes); add("Biodiversidad y alcance", record.biodiversidad); add("Áreas protegidas relacionadas", record.anp); add("Cambios que estudiar", lectura.amenazas); more.append(dl); }
                else if (topic.mode === "humedales" && lectura.humedales[topic.waterType]) { const record = lectura.humedales[topic.waterType]; add("Características y límites", record.caracteristicas); add("Importancia", record.importancia); add("Vegetación", record.vegetacion); add("Fauna", record.fauna); more.append(dl); }
                else if (topic.mode === "bosques") { const education = forestDescriptions.categorias[key]; if (education) { add("Descripción", education.descripcion); add("Memoria descriptiva", "Sección " + education.seccion + " · página " + education.pagina); more.append(dl); } }
                target.append(more);
            };
            const showCard = key => {
                territory.classList.toggle("has-element-selection", Boolean(key));
                if (!activeMode) { card.className = "selva-territorio-ficha"; card.replaceChildren(Object.assign(node("div", "selva-territorio-ficha-ayuda"), {innerHTML: "<h3>Vista general de Madre de Dios</h3><p>El contorno departamental permanece visible como referencia. Activa una capa para explorar sus registros.</p>"})); return; }
                const data = modes[activeMode], panelIcon = territory.querySelector(".selva-territorio-panel-icono"); panelIcon.querySelector("use").setAttribute("href", "#territorio-icono-" + data.icon);
                if (!key) { const hint = node("div", "selva-territorio-ficha-ayuda"); hint.append(icon(data.icon), node("h3", "", "Explora " + data.name.toLowerCase()), node("p", "", data.note)); card.replaceChildren(hint); return; }
                const topic = topics[key], education = topic.mode === "bosques" ? forestDescriptions.categorias[key] : null;
                const labels = { provincias: "Provincia · límite de referencia", distritos: "Distrito · límite de referencia", bosques: "Cobertura vegetal · categoría oficial", rios: "Río · trazado cartográfico", humedales: (topic.waterType || "Humedal") + " · MasaAgua", anp: topic.category + " · SERNANP" };
                const type = node("span", "selva-territorio-tipo-ficha", labels[topic.mode]); const heading = node("h3", "", topic.name); const text = node("p", "", education?.descripcion || topic.text);
                const details = node("dl", "selva-territorio-metadatos"); topic.metadata.forEach(([label, value]) => details.append(node("dt", "", label), node("dd", "", value)));
                const back = node("button", "selva-territorio-ficha-volver", "← Volver a la lista"); back.type = "button"; back.addEventListener("click", () => { clearSelection(); options.querySelector("input,button,select")?.focus({preventScroll: true}); });
                card.replaceChildren(back, type, heading, text, details); appendLearning(key, card);
                if (topic.source) { const link = node("a", "selva-territorio-registro-abrir", topic.reference + " →"); link.href = topic.source; card.append(link); }
            };
            const clearSelection = () => { selectedKey = null; tooltip.hidden = true; filterForest(null); updateFeatures(); buildOptions(); showCard(null); updateLegend(); updateMapLabels(); };
            const select = (key, interact = true) => {
                if (!topics[key]) return; const mode = topics[key].mode; if (!isEnabled(mode)) activateMode(mode); if (activeMode !== mode) setMode(mode); selectedKey = key;
                helper.hidden = true;
                if (mode === "bosques") filterForest(key); updateFeatures(); buildOptions(); showCard(key); updateLegend(); updateMapLabels(); tooltip.hidden = true;
                const feature = features.find(item => item.dataset.mapaFeature === key); if (feature && interact && mode !== "bosques") zoomFeature(feature);
            };
            const searchableList = (mode, keys) => {
                const searchLabel = node("label", "territorio-busqueda-label", "Buscar en " + modes[mode].name.toLowerCase()); const search = node("input", "territorio-busqueda"); search.type = "search"; search.placeholder = "Escribe un nombre"; searchLabel.append(search); options.append(searchLabel);
                const count = node("p", "territorio-resultados", keys.length + " registros disponibles"); const list = node("div", "territorio-lista-registros"); options.append(count, list);
                const render = () => { const query = search.value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); const filtered = keys.filter(key => topics[key].name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(query)); count.textContent = filtered.length + (filtered.length === 1 ? " registro disponible" : " registros disponibles"); list.replaceChildren(); filtered.forEach(key => { const button = node("button", "selva-territorio-acceso"); button.type = "button"; button.dataset.territorioTema = key; button.setAttribute("aria-pressed", String(selectedKey === key)); const badge = mode === "bosques" ? node("i", "selva-territorio-color") : icon(mode === "anp" ? "conservacion" : mode === "humedales" ? (topics[key].waterType === "Laguna" ? "laguna" : "pantano") : modes[mode].icon); if (mode === "bosques") badge.style.backgroundColor = forestColors[key]; const content = node("span", ""); content.append(node("strong", "", topics[key].name)); const secondary = mode === "anp" ? topics[key].category : mode === "distritos" ? topics[key].metadata.find(item => item[0] === "Provincia")?.[1] : mode === "bosques" ? topics[key].micro : mode === "humedales" ? topics[key].waterType : "Seleccionar y ampliar"; content.append(node("small", "", secondary)); button.append(badge, content); button.addEventListener("click", () => select(key)); button.addEventListener("pointerenter", event => highlight(key, event)); button.addEventListener("pointerleave", () => highlight(null)); button.addEventListener("focus", () => highlight(key)); button.addEventListener("blur", () => highlight(null)); list.append(button); }); };
                search.addEventListener("input", render); render();
            };
            const buildOptions = () => {
                options.replaceChildren(); if (!activeMode) return;
                if (activeMode === "anp") { const filters = node("div", "territorio-filtros-anp"); filters.setAttribute("role", "group"); filters.setAttribute("aria-label", "Filtrar áreas por categoría"); [["todos", "Todas"], ["Parque Nacional", "Parques"], ["Reserva Nacional", "Reserva nacional"], ["Reserva Comunal", "Reservas comunales"]].forEach(([value, label]) => { const button = node("button", "", label); button.type = "button"; button.setAttribute("aria-pressed", String(activeFilters.anp === value)); button.addEventListener("click", () => { activeFilters.anp = value; if (selectedKey && !visibleKeys("anp").includes(selectedKey)) selectedKey = null; updateFeatures(); buildOptions(); showCard(selectedKey); updateMapLabels(); }); filters.append(button); }); options.append(filters); }
                if (activeMode === "humedales") { const filters = node("div", "selva-territorio-filtros-agua"); filters.setAttribute("role", "group"); filters.setAttribute("aria-label", "Filtrar humedales por tipo registrado"); [["todos", "Todos", "humedales"], ["Laguna", "Lagunas", "laguna"], ["Pantano", "Pantanos", "pantano"]].forEach(([value, label, glyph]) => { const button = node("button", ""); button.type = "button"; button.setAttribute("aria-pressed", String(activeFilters.humedales === value)); button.append(icon(glyph), node("span", "", label)); button.addEventListener("click", () => { activeFilters.humedales = value; if (selectedKey && !visibleKeys("humedales").includes(selectedKey)) selectedKey = null; updateFeatures(); buildOptions(); showCard(selectedKey); updateMapLabels(); }); filters.append(button); }); options.append(filters); }
                searchableList(activeMode, visibleKeys(activeMode));
            };
            const setMode = mode => {
                activeMode = mode; selectedKey = null; tooltip.hidden = true; filterForest(null); territory.dataset.territorioActivo = mode; setView([0, 0, 600, 510], false);
                const data = modes[mode]; territory.querySelector(".selva-territorio-panel-titulo").textContent = data.name; territory.querySelector(".selva-territorio-panel-intro").textContent = data.intro; territory.querySelector(".selva-territorio-escena-titulo").textContent = data.name; territory.querySelector(".selva-territorio-escena-frase").textContent = data.phrase; territory.querySelector(".selva-territorio-nota-escena").textContent = data.note; territory.querySelectorAll(".selva-territorio-modo-icono use,.selva-territorio-panel-icono use").forEach(use => use.setAttribute("href", "#territorio-icono-" + data.icon)); helper.lastChild.textContent = "Selecciona un elemento para consultar su ficha";
                buildOptions(); updateFeatures(); showCard(null); updateLegend(); updateMapLabels();
            };
            const showIdle = () => {
                activeMode = null; selectedKey = null; territory.dataset.territorioActivo = "base"; territory.querySelector(".selva-territorio-panel-titulo").textContent = "Explora una capa"; territory.querySelector(".selva-territorio-panel-intro").textContent = "Elige una capa para ver su leyenda, registros y fuente."; territory.querySelector(".selva-territorio-escena-titulo").textContent = "Vista general"; territory.querySelector(".selva-territorio-escena-frase").textContent = "Madre de Dios · cartografía educativa"; territory.querySelector(".selva-territorio-nota-escena").textContent = "Vista base educativa. Activa una capa para consultar su fecha, procedencia y limitaciones."; territory.querySelectorAll(".selva-territorio-modo-icono use,.selva-territorio-panel-icono use").forEach(use => use.setAttribute("href", "#territorio-icono-mapas")); helper.lastChild.textContent = "Activa una capa para comenzar"; options.replaceChildren(); showCard(null); updateFeatures(); updateLegend(); updateMapLabels();
            };
            const activateMode = async mode => {
                const input = inputForMode(mode); input.checked = true; enabledLayers.add(mode); const oldIndex = activationOrder.indexOf(mode); if (oldIndex >= 0) activationOrder.splice(oldIndex, 1); activationOrder.push(mode);
                if (mode === "bosques") loadForest(); if (overlayFiles[mode]) await loadOverlay(mode); updateScenes(); updateFeatures(); updateLegend(); updateMapLabels(); setMode(mode);
            };
            allLayerInputs.forEach(input => input.addEventListener("change", async () => {
                const mode = input.dataset.territorioCapa || input.dataset.territorioOverlayToggle;
                if (input.checked) await activateMode(mode);
                else { enabledLayers.delete(mode); const index = activationOrder.indexOf(mode); if (index >= 0) activationOrder.splice(index, 1); if (selectedKey && topics[selectedKey]?.mode === mode) selectedKey = null; updateScenes(); if (activeMode === mode) { const next = [...activationOrder].reverse().find(isEnabled); if (next) setMode(next); else showIdle(); } else { updateFeatures(); updateLegend(); updateMapLabels(); } }
                updateStatus();
            }));
            resetButton.addEventListener("click", () => { allLayerInputs.forEach(input => input.checked = false); enabledLayers.clear(); activationOrder.splice(0); activeFilters.anp = "todos"; activeFilters.humedales = "todos"; helper.hidden = false; filterForest(null); svg.querySelectorAll("[data-territorio-overlay]").forEach(group => group.style.display = "none"); setView([0, 0, 600, 510]); showIdle(); updateScenes(); updateStatus(); });
            features.forEach(bindFeature);
            territory.querySelectorAll("[data-territorio-zoom]").forEach(button => button.addEventListener("click", () => { tooltip.hidden = true; if (button.dataset.territorioZoom === "reset") { setView([0, 0, 600, 510]); return; } const width = Math.max(300, Math.min(600, view[2] * (button.dataset.territorioZoom === "in" ? .8 : 1.25))), height = width * 510 / 600; setView([Math.max(0, Math.min(600 - width, view[0] + (view[2] - width) / 2)), Math.max(0, Math.min(510 - height, view[1] + (view[3] - height) / 2)), width, height]); }));
            returnView.addEventListener("click", () => { tooltip.hidden = true; setView([0, 0, 600, 510]); });
            let drag = null;
            svg.addEventListener("pointerdown", event => { if (view[2] >= 599 || event.button !== 0) return; drag = {id: event.pointerId, x: event.clientX, y: event.clientY, start: [...view], scale: svg.getScreenCTM().a, moving: false}; });
            svg.addEventListener("pointermove", event => { if (!drag || drag.id !== event.pointerId) return; const dx = event.clientX - drag.x, dy = event.clientY - drag.y; if (!drag.moving && Math.hypot(dx, dy) < 5) return; drag.moving = true; svg.setPointerCapture(event.pointerId); lastDragAt = performance.now(); tooltip.hidden = true; setView([Math.max(0, Math.min(600 - drag.start[2], drag.start[0] - dx / drag.scale)), Math.max(0, Math.min(510 - drag.start[3], drag.start[1] - dy / drag.scale)), drag.start[2], drag.start[3]], false); });
            const finishDrag = event => { if (drag?.moving) { lastDragAt = performance.now(); if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId); } drag = null; }; svg.addEventListener("pointerup", finishDrag); svg.addEventListener("pointercancel", finishDrag);
            svg.addEventListener("keydown", event => { if (view[2] >= 599 || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return; event.preventDefault(); const dx = event.key === "ArrowRight" ? 25 : event.key === "ArrowLeft" ? -25 : 0, dy = event.key === "ArrowDown" ? 25 : event.key === "ArrowUp" ? -25 : 0; setView([Math.max(0, Math.min(600 - view[2], view[0] + dx)), Math.max(0, Math.min(510 - view[3], view[1] + dy)), view[2], view[3]], false); });
            window.addEventListener("resize", () => { updateMapLabels(); updateScale(); }); reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) { cancelAnimationFrame(zoomFrame); svg.setAttribute("viewBox", view.join(" ")); } });
            exploreTopic = async key => { if (!topics[key]) return; await activateMode(topics[key].mode); select(key); territory.scrollIntoView({behavior: reducedMotion.matches ? "instant" : "smooth", block: "start"}); if (origin) { returnOrigin.hidden = false; returnOrigin.focus({preventScroll: true}); } else card.querySelector(".selva-territorio-ficha-volver")?.focus({preventScroll: true}); };
            const preselected = allLayerInputs.filter(input => input.checked).map(input => input.dataset.territorioCapa || input.dataset.territorioOverlayToggle);
            allLayerInputs.forEach(input => input.checked = false); enabledLayers.clear(); activationOrder.splice(0); showIdle(); updateScenes(); updateFeatures(); updateLegend(); updateScale(); updateStatus();
            preselected.reduce((promise, mode) => promise.then(() => activateMode(mode)), Promise.resolve()).then(() => { if (requestedMode && isEnabled(requestedMode)) setMode(requestedMode); });
        };


        const host = territory.querySelector("[data-territorio-map-src]");
        const canvas = territory.querySelector(".selva-territorio-canvas");
        const controls = [...territory.querySelectorAll("[data-territorio-zoom], [data-territorio-capa], [data-territorio-overlay-toggle], .territorio-restablecer")];
        let loading = false, loaded = false;
        const selections = controls.filter(control => control.matches('input[type="checkbox"]'));
        controls.forEach(control => { control.disabled = !selections.includes(control); });
        selections.forEach(control => control.addEventListener('change', () => {
            if (loaded) return;
            const mode = control.dataset.territorioCapa || control.dataset.territorioOverlayToggle;
            if (mode && control.checked) requestedMode = mode;
            if (requestedMode) {
                const selected = territory.querySelector('[data-territorio-capa="' + requestedMode + '"],[data-territorio-overlay-toggle="' + requestedMode + '"]');
                if (!selected?.checked) requestedMode = null;
            }
            territory.querySelector('[data-territorio-capas-status]').textContent = 'Las capas seleccionadas se aplicarán al terminar de cargar el mapa.';
            loadTerritory();
        }));
        const loadTerritory = async () => {
            if (loading || loaded) return;
            loading = true;
            canvas.setAttribute("aria-busy", "true");
            const message = host.querySelector("[role='status']");
            const retry = host.querySelector("button");
            if (message) message.textContent = "Cargando mapa…";
            if (retry) retry.hidden = true;
            let loadedSvg;
            try {
                const dataFiles = ["datos/territorio/registros-visor.json", "datos/territorio/cobertura-fichas.json", "datos/territorio/descripciones.json", "datos/territorio/lectura.json", "datos/presentacion/etiquetas.json", "datos/territorio/provincias.geojson", "datos/territorio/distritos.geojson", "datos/conservacion/anp.geojson"];
                const [response, ...dataResponses] = await Promise.all([fetch(window.ecoResourceURL(host.dataset.territorioMapSrc)), ...dataFiles.map(path => fetch(window.ecoResourceURL(path)))]);
                if (dataResponses.some(item => !item.ok)) throw new Error("No se pudieron cargar los registros del mapa.");
                const [loadedTopics, loadedForest, loadedDescriptions, loadedReading, loadedPresentation, provinces, districts, anp] = await Promise.all(dataResponses.map(item => item.json()));
                topics = loadedTopics; forestData = loadedForest; forestDescriptions = loadedDescriptions; lectura = loadedReading; atlasPresentation = loadedPresentation;
                administrativeData = { provinces, districts, anp };
                if (!response.ok) throw new Error(`Mapa: HTTP ${response.status}`);
                const document = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
                if (document.querySelector("parsererror") || document.documentElement.localName !== "svg") throw new Error("El mapa no es un SVG válido.");
                loadedSvg = window.document.importNode(document.documentElement, true);
                host.replaceWith(loadedSvg);
                controls.forEach(control => { control.disabled = false; });
                initializeTerritory();
                loaded = true;
                observer?.disconnect();
                if (pendingTopic) { const key = pendingTopic; pendingTopic = null; exploreTopic(key); }
            } catch (error) {
                console.error("No se pudo cargar el mapa de EcoSelva:", error);
                loadedSvg?.remove();
                if (!host.isConnected) canvas.prepend(host);
                if (message) message.textContent = "No se pudo cargar el mapa. Puedes volver a intentarlo.";
                if (retry) retry.hidden = false;
                controls.forEach(control => { control.disabled = !selections.includes(control); });
                territory.querySelector('[data-territorio-capas-status]').textContent = 'Tus capas seleccionadas se conservan. Vuelve a intentar la carga del mapa.';
            } finally {
                loading = false;
                canvas.setAttribute("aria-busy", "false");
            }
        };
        territory.closest("#explora-madre-de-dios").querySelectorAll("[data-territorio-explorar]").forEach(button => {
            button.disabled = false; button.hidden = false;
            button.addEventListener("click", () => {
                origin = { button, y: window.scrollY };
                if (loaded || !host) exploreTopic?.(button.dataset.territorioExplorar);
                else {
                    pendingTopic = button.dataset.territorioExplorar;
                    territory.scrollIntoView({block: "start", behavior: "instant"});
                    loadTerritory();
                }
            });
        });
        let observer;
        if (host) {
            host.querySelector("button")?.addEventListener("click", loadTerritory);
            if ("IntersectionObserver" in window) {
                observer = new IntersectionObserver(entries => {
                    if (entries.some(entry => entry.isIntersecting)) loadTerritory();
                }, { rootMargin: "600px" });
                observer.observe(territory);
            } else loadTerritory();
        } else initializeTerritory();
    }


    // Actividades locales: sin llamadas externas y con alternativas en noscript.
    const territorioAula = document.getElementById("explora-madre-de-dios");
    if (territorioAula) {
        const quiz = territorioAula.querySelector("[data-territorio-quiz]");
        const answers = [...quiz.querySelectorAll("[data-territorio-respuesta]")];
        answers.forEach(button => {
            button.disabled = false; button.setAttribute("aria-pressed", "false");
            button.addEventListener("click", () => {
                answers.forEach(answer => answer.setAttribute("aria-pressed", String(answer === button)));
                const value = button.dataset.territorioRespuesta;
                quiz.querySelector(".territorio-feedback").textContent = value === "rio" ?
                    "Correcto: el agua de la parte inferior corresponde al río Tambopata; el bosque crece en la orilla. La fotografía no permite identificar todos los humedales del paisaje." :
                    value === "bosque" ? "El bosque aparece en la orilla. Observa el agua de la parte inferior y prueba otra respuesta." :
                    "Esta fotografía muestra el río Tambopata. La presencia de agua por sí sola no identifica un aguajal ni otro tipo de humedal. Observa la parte inferior y prueba otra respuesta.";
            });
        });
        const form = territorioAula.querySelector("[data-territorio-relaciona]");
        form.querySelectorAll("button").forEach(button => { button.disabled = false; });
        const expected = {bosque: "carbono", rio: "agua", humedal: "regulacion"};
        const names = {bosque: "bosque → almacenamiento de carbono", rio: "río → conducción de agua", humedal: "humedal → almacenamiento y regulación hídrica"};
        form.addEventListener("submit", event => {
            event.preventDefault();
            if (!form.reportValidity()) return;
            const wrong = Object.keys(expected).filter(name => {
                const field = form.elements.namedItem(name);
                const match = field.value === expected[name];
                field.setAttribute("aria-invalid", String(!match));
                field.setAttribute("aria-describedby", "territorio-relaciona-feedback");
                return !match;
            });
            const feedback = form.querySelector(".territorio-feedback");
            feedback.id = "territorio-relaciona-feedback";
            feedback.textContent = wrong.length ? "Has relacionado " + (3 - wrong.length) + " de 3 funciones destacadas. Revisa: " + wrong.map(name => names[name]).join("; ") + ". Estas funciones son ejemplos y no son exclusivas de un ambiente." :
                "Correcto: bosque → carbono; río → agua; humedal → regulación hídrica. Los humedales también pueden almacenar carbono y los bosques influir en el agua: las funciones se conectan.";
        });
        form.addEventListener("reset", () => {
            form.querySelector(".territorio-feedback").textContent = "";
            form.querySelectorAll("select").forEach(field => { field.removeAttribute("aria-invalid"); field.removeAttribute("aria-describedby"); });
        });
        // Abre las fuentes desplegables al seguir una referencia local.
        territorioAula.querySelectorAll('a[href^="#territorio-"]').forEach(link => link.addEventListener("click", () => {
            const target = document.getElementById(link.hash.slice(1));
            let parent = target?.parentElement;
            while (parent && parent !== territorioAula) { if (parent.localName === "details") parent.open = true; parent = parent.parentElement; }
        }));
    }


});
