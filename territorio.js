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
        let topics, forestData, forestDescriptions, lectura;
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

        const initializeTerritory = () => {
        Object.assign(topics, forestData.topics);
        const forestCategories = forestData.categories.filter(category => !["R", "L/Co"].includes(category.codigo_original));
        const svg = territory.querySelector(".selva-territorio-svg");
        const canvas = territory.querySelector(".selva-territorio-canvas");
        const scenes = [...svg.querySelectorAll("[data-territorio-scene]")];
        const features = [...svg.querySelectorAll("[data-mapa-feature]")];
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
            bosques: { name: "Bosques", phrase: "Ambientes forestales de la Amazonía sur.", intro: "Explora un ambiente forestal.", icon: "bosques", keys: ["tierra", "inundable", "aguajal", "secundario"], note: "Distribución cartográfica de ambientes forestales en preparación." },
            rios: { name: "Ríos", phrase: "Los cursos de agua conectan el territorio.", intro: "Explora los principales cursos de agua representados en el mapa.", icon: "rios", keys: ["madre", "tambopata", "inambari", "piedras", "manu", "heath"], note: "Selección de trazados reales. El grosor gráfico no representa anchura ni caudal." },
            humedales: { name: "Humedales", phrase: "Ambientes donde agua y tierra se encuentran.", intro: "Explora lagunas y pantanos registrados en la cartografía.", icon: "humedales", note: "Selección inicial por nombre y tamaño geométrico; no representa la totalidad ni la abundancia de los humedales." }
        };
        if (forestData.categories.length) {
            modes.bosques.keys = forestCategories.map(category => category.id);
            modes.bosques.phrase = "Cobertura vegetal · MINAM, 2015.";
            modes.bosques.intro = "Explora las categorías originales de la cobertura vegetal representadas para Madre de Dios.";
            modes.bosques.note = "Cartografía publicada en 2015 y recortada a Madre de Dios. No representa necesariamente el estado actual del territorio.";
        }
        let activeMode = "bosques", selectedKey = null, showAll = false, waterTypeFilter = "todos", zoomFrame = 0;
        let view = [0, 0, 600, 510];
        let lastDragAt = 0;
        const labelLayer = svg.querySelector(".selva-territorio-etiquetas");
        const scaleElement = territory.querySelector(".selva-territorio-escala");
        const metresPerSvgUnit = (8908847.9839 - 8518757.21) / 430;
        const labelSettings = {
            madre: [.53, 18, -19], tambopata: [.5, 14, 22], inambari: [.72, -85, 22],
            piedras: [.48, 18, -22], manu: [.52, -62, -20], heath: [.45, -86, -15]
        };
        initialWater.filter(key => topics[key].registeredName).sort((a, b) => {
            const first = svg.querySelector(`[data-mapa-feature="${a}"]`).getBBox();
            const second = svg.querySelector(`[data-mapa-feature="${b}"]`).getBBox();
            return second.width * second.height - first.width * first.height;
        }).slice(0, 3).forEach(key => { labelSettings[key] = [.25, 16, -24]; });
        const mapLabels = Object.entries(labelSettings).map(([key, settings]) => {
            const visual = svg.querySelector(`[data-mapa-feature="${key}"] .selva-territorio-rio-linea, [data-mapa-feature="${key}"] .selva-territorio-agua-forma`);
            const path = visual.localName === "use" ? svg.querySelector(visual.getAttribute("href")) : visual;
            const group = document.createElementNS(svg.namespaceURI, "g");
            group.dataset.mapLabel = key; group.setAttribute("role", "button");
            group.setAttribute("aria-label", "Explorar " + topics[key].name); group.setAttribute("tabindex", "-1");
            const leader = document.createElementNS(svg.namespaceURI, "path");
            const background = document.createElementNS(svg.namespaceURI, "rect");
            const text = document.createElementNS(svg.namespaceURI, "text");
            text.textContent = topics[key].name.replace("Río ", "");
            group.append(leader, background, text); labelLayer.append(group);
            group.addEventListener("click", () => { if (enabledLayers.has(topics[key].mode)) select(key); });
            group.addEventListener("pointerenter", () => { if (enabledLayers.has(topics[key].mode)) highlight(key); });
            group.addEventListener("pointerleave", () => highlight(null));
            return { key, path, group, leader, background, text, settings };
        });
        const updateMapLabels = () => {
            labelLayer.style.display = enabledLayers.has("rios") || enabledLayers.has("humedales") ? "" : "none";
            labelLayer.setAttribute("aria-hidden", String(!enabledLayers.has("rios") && !enabledLayers.has("humedales")));
            const ratio = 1 / (svg.getScreenCTM()?.a || 1);
            const occupied = [];
            mapLabels.forEach(({ key, path, group, leader, background, text, settings }) => {
                const visible = enabledLayers.has(topics[key].mode) && features.some(feature => feature.dataset.mapaFeature === key && feature.getAttribute("aria-hidden") !== "true") && (view[2] >= 540 || key === selectedKey);
                group.style.display = visible ? "" : "none";
                group.style.pointerEvents = visible ? "" : "none";
                group.setAttribute("aria-hidden", String(!visible));
                if (visible) group.setAttribute("role", "button"); else group.removeAttribute("role");
                group.classList.toggle("is-selected", key === selectedKey);
                if (group.style.display === "none") return;
                const point = path.getPointAtLength(path.getTotalLength() * settings[0]);
                text.setAttribute("font-size", 12 * ratio);
                const width = (text.textContent.length * 6.9 + 16) * ratio, height = 24 * ratio;
                let x = Math.max(view[0] + 10 * ratio, Math.min(view[0] + view[2] - width - 10 * ratio, point.x + settings[1] * ratio));
                let y = Math.max(view[1] + 12 * ratio, Math.min(view[1] + view[3] - height - 12 * ratio, point.y + settings[2] * ratio));
                for (let i = 0; i < 4 && occupied.some(box => x < box.x + box.w && x + width > box.x && y < box.y + box.h && y + height > box.y); i++) y = Math.min(view[1] + view[3] - height, y + height + 5 * ratio);
                occupied.push({ x, y, w: width, h: height });
                text.setAttribute("x", x + 8 * ratio); text.setAttribute("y", y + 15 * ratio);
                background.setAttribute("x", x); background.setAttribute("y", y);
                background.setAttribute("width", width); background.setAttribute("height", height);
                background.setAttribute("rx", 4 * ratio);
                leader.setAttribute("d", `M${point.x},${point.y}L${Math.max(x, Math.min(x + width, point.x))},${y + height / 2}`);
            });
        };
        const provinceToggle = territory.querySelector("#territorio-provincias");
        provinceToggle.addEventListener("change", () => {
            svg.querySelectorAll(".selva-territorio-provincias-limites, .selva-territorio-provincias-nombres").forEach(layer => {
                layer.style.display = provinceToggle.checked ? "" : "none";
            });
        });
        const forestColors = { tierra: "#24563A", inundable: "#3E7763", aguajal: "#768B49", secundario: "#7EAB70" };
        Object.assign(forestColors, Object.fromEntries(forestData.categories.map(category => [category.id, category.color])));
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
        const updateScale = () => {
            scaleElement.hidden = activeMode === "bosques" && !forestData.categories.length;
            const matrix = svg.getScreenCTM(); if (!matrix) return;
            svg.querySelectorAll(".selva-territorio-provincias-nombres text").forEach(text => text.setAttribute("font-size", 12 / matrix.a));
            svg.querySelectorAll(".selva-territorio-colindantes text").forEach(text => text.setAttribute("font-size", 12 / matrix.a));
            let km = 100;
            if (100000 / metresPerSvgUnit * matrix.a > 150) km = 50;
            if (km * 1000 / metresPerSvgUnit * matrix.a < 50) km = 150;
            scaleElement.querySelector("i").style.width = (km * 1000 / metresPerSvgUnit * matrix.a) + "px";
            scaleElement.querySelector(".selva-territorio-escala-valor").textContent = km + " km";
            territory.classList.toggle("is-zoomed", view[2] < 599);
        };
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
        const waterKeys = () => waterTypeFilter === "todos" ? (showAll ? allWater : initialWater) : allWater.filter(key => topics[key].waterType === waterTypeFilter);
        // Lectura educativa: reutiliza textos del aula y conserva el registro cartográfico.
        const aula = territory.closest("#explora-madre-de-dios");
        const layerInputs = [...territory.querySelectorAll("[data-territorio-capa]")];
        const overlayInputs = [...territory.querySelectorAll("[data-territorio-overlay-toggle]")];
        const layerStatus = territory.querySelector("[data-territorio-capas-status]");
        const enabledLayers = new Set();
        let overlayPromise = null, overlayReady = false, overlayError = "";
        const updateLayerStatus = () => {
            const names = [...layerInputs.filter(input => input.checked).map(input => input.parentElement.textContent.trim()),
                ...(provinceToggle.checked ? ["Provincias"] : []),
                ...overlayInputs.filter(input => input.checked && overlayReady).map(input => input.parentElement.textContent.trim())];
            layerStatus.textContent = (names.length ? "Capas visibles: " + names.join(" · ") + "." : "No hay capas activadas; se conserva el contorno de referencia.") +
                (overlayError ? " " + overlayError : overlayPromise && !overlayReady ? " Cargando contornos adicionales…" : "") +
                " Las fechas y límites de uso se explican en Datos y metodología.";
        };
        const updateScenes = () => {
            scenes.forEach(scene => {
                const visible = enabledLayers.has(scene.dataset.territorioScene);
                scene.style.display = visible ? "" : "none";
                scene.style.pointerEvents = visible ? "" : "none";
                scene.setAttribute("aria-hidden", String(!visible));
                if (visible) scene.removeAttribute("inert"); else scene.setAttribute("inert", "");
            });
            layerInputs.forEach(input => { input.checked = enabledLayers.has(input.dataset.territorioCapa); });
            overlayInputs.forEach(input => svg.querySelectorAll('[data-territorio-overlay="' + input.dataset.territorioOverlayToggle + '"]').forEach(group => {
                group.style.display = input.checked ? "" : "none";
            }));
            updateLayerStatus();
        };
        const loadOverlays = () => {
            if (overlayReady) return Promise.resolve();
            if (overlayPromise) return overlayPromise;
            overlayError = "";
            overlayPromise = (async () => {
                const response = await fetch(window.ecoResourceURL("datos/territorio/capas-adicionales.svg"));
                if (!response.ok) throw new Error("HTTP " + response.status);
                const doc = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
                if (doc.querySelector("parsererror") || doc.documentElement.localName !== "svg") throw new Error("SVG inválido");
                for (const name of ["anp", "distritos"]) {
                    const original = doc.querySelector('[data-territorio-overlay="' + name + '"]');
                    if (!original) throw new Error("Capa ausente: " + name);
                }
                for (const name of ["anp", "distritos"]) {
                    const group = document.importNode(doc.querySelector('[data-territorio-overlay="' + name + '"]'), true);
                    group.setAttribute("clip-path", "url(#territorio-limite-clip)");
                    svg.insertBefore(group, labelLayer);
                }
                overlayReady = true;
            })().catch(error => {
                console.error("No se pudieron cargar los contornos adicionales:", error);
                overlayInputs.forEach(input => { input.checked = false; });
                overlayError = "No se pudieron cargar los contornos adicionales. Activa una casilla para volver a intentar.";
            }).finally(() => { overlayPromise = null; updateScenes(); updateLegend(); });
            updateLayerStatus();
            return overlayPromise;
        };
        overlayInputs.forEach(input => input.addEventListener("change", () => {
            if (input.checked) loadOverlays();
            updateScenes(); updateLegend();
        }));
        layerInputs.forEach(input => input.addEventListener("change", () => {
            const mode = input.dataset.territorioCapa;
            if (input.checked) { enabledLayers.add(mode); setMode(mode, false, false, true); }
            else {
                enabledLayers.delete(mode);
                if (mode === activeMode && enabledLayers.size) setMode([...enabledLayers].at(-1), false, false, true);
            }
            if (selectedKey && !enabledLayers.has(topics[selectedKey].mode)) clearSelection();
            tooltip.hidden = true;
            updateScenes(); updateFeatures(); updateMapLabels(); updateLegend();
        }));
        provinceToggle.addEventListener("change", updateLayerStatus);
        const appendLearning = (key, target) => {
            const topic = topics[key];
            const more = node("details", "territorio-ficha-aprender");
            more.append(node("summary", "", "Comprender este ambiente"));
            const dl = node("dl", "");
            const add = (label, value) => dl.append(node("dt", "", label), node("dd", "", value));
            if (topic.mode === "rios") {
                const record = lectura.rios[key];
                if (!record) return;
                add("Ubicación del trazado", lectura.ubicacion);
                add("Importancia", record.importancia);
                add("Ambientes relacionados", record.ambientes);
                add("Biodiversidad y alcance", record.biodiversidad);
                add("Áreas protegidas relacionadas", record.anp);
                add("Cambios que estudiar", lectura.amenazas);
                more.append(dl);
                record.fuentes.forEach(id => {
                    const link = node("a", "territorio-referencia", "Consultar fuente: " + ({anp:"SERNANP", cincia:"CINCIA, 2023", ecosistemas:"MINAM, 2019"}[id]));
                    link.href = lectura.fuentes[id]; more.append(link);
                });
            } else if (topic.mode === "humedales") {
                const record = lectura.humedales[topic.waterType];
                if (!record) return;
                add("Características y límites del registro", record.caracteristicas);
                add("Importancia del tipo de ambiente", record.importancia);
                add("Vegetación", record.vegetacion); add("Fauna", record.fauna); more.append(dl);
                const link = node("a", "territorio-referencia", "Comprender humedales y aguajales →"); link.href = "#territorio-humedales"; more.append(link);
                const source = node("a", "territorio-referencia", "Contexto educativo: MINAM, 2019 →"); source.href = "#territorio-fuente-ecosistemas"; more.append(source);
            } else {
                const template = aula.querySelector('[data-territorio-explorar="' + key + '"]')?.closest("details")?.querySelector("dl");
                if (template) {
                    [...template.querySelectorAll("dt")].slice(1).forEach(dt => add(dt.textContent, dt.nextElementSibling.textContent));
                    more.append(dl, node("p", "", "Relaciones educativas, no un inventario de especies o amenazas de este polígono."));
                }
                const link = node("a", "territorio-referencia", "Aprender sobre los bosques y sus fuentes →"); link.href = "#territorio-bosques"; more.append(link);
            }
            target.append(more);
        };

        const appendLayerLegend = () => {
            const items = [];
            if (enabledLayers.has("rios") && activeMode !== "rios") items.push(["rio", "Ríos · cursos mostrados"]);
            if (enabledLayers.has("humedales") && activeMode !== "humedales") items.push(["laguna", "Lagunas · MasaAgua"], ["pantano", "Pantanos · MasaAgua"]);
            items.forEach(([kind, text]) => {
                const item = node("span", "selva-territorio-leyenda-item");
                item.append(node("i", "selva-territorio-muestra selva-territorio-muestra--" + kind), node("span", "", text)); legend.append(item);
            });
            if (enabledLayers.has("bosques") && activeMode !== "bosques") legend.append(node("small", "", "Cobertura vegetal · categorías MINAM, 2015; colores EcoSelva."));
            overlayInputs.filter(input => input.checked && overlayReady).forEach(input => {
                legend.append(node("small", "", input.dataset.territorioOverlayToggle === "anp" ? "ANP · contornos verdes discontinuos" : "Distritos · contornos marrones discontinuos"));
            });
        };
        const updateLegend = () => {
            if (!enabledLayers.has(activeMode)) {
                legend.replaceChildren(node("span", "", "La capa principal está desactivada. Consulta las capas visibles en las casillas del mapa.")); appendLayerLegend(); return;
            }
            if (activeMode === "bosques") {
                legend.replaceChildren(...modes.bosques.keys.map(key => {
                    const item = node("span", "selva-territorio-leyenda-item");
                    const swatch = node("i", "selva-territorio-color"); swatch.style.backgroundColor = forestColors[key];
                    item.classList.toggle("is-muted", !!selectedKey && key !== selectedKey);
                    item.setAttribute("aria-current", selectedKey === key ? "true" : "false");
                    item.append(swatch, icon(topics[key].icon || key), node("span", "", key === "tierra" ? "Tierra firme" : topics[key].name)); return item;
                }), node("small", "selva-territorio-leyenda-aviso", forestData.categories.length ? "Categorías originales · MINAM, 2015. Colores de visualización EcoSelva; incluye coberturas no forestales." : "Colores educativos. La distribución espacial detallada está en preparación."));
                appendLayerLegend(); return;
            }
            const items = activeMode === "bosques" ? modes.bosques.keys.map(key => [key, topics[key].name.replace("Bosque de ", "").replace("Bosque ", "")]) :
                activeMode === "rios" ? (selectedKey ? [["seleccionado", "Río seleccionado"], ["rio", "Otros cursos mostrados"]] : [["rio", "Cursos mostrados"]]) :
                [["laguna", "Laguna"], ["pantano", "Pantano"]];
            legend.replaceChildren(...items.map(([kind, text]) => {
                const item = node("span", "selva-territorio-leyenda-item");
                item.append(node("i", "selva-territorio-muestra selva-territorio-muestra--" + kind), node("span", "", text)); return item;
            }));
            if (activeMode === "bosques") legend.append(node("small", "", "Representación educativa"));
            appendLayerLegend();
        };
        const setView = (next, animate = true) => {
            cancelAnimationFrame(zoomFrame);
            const before = [...view], started = performance.now();
            const draw = time => {
                const t = !animate || reducedMotion.matches ? 1 : Math.min(1, (time - started) / 400);
                const eased = 1 - Math.pow(1 - t, 3);
                view = before.map((value, i) => value + (next[i] - value) * eased);
                svg.setAttribute("viewBox", view.join(" "));
                updateMapLabels(); updateScale();
                returnView.hidden = Math.abs(view[2] - 600) < 1;
                territory.querySelector('[data-territorio-zoom="out"]').disabled = view[2] >= 599;
                territory.querySelector('[data-territorio-zoom="in"]').disabled = view[2] <= 301;
                if (t < 1) zoomFrame = requestAnimationFrame(draw);
                else if (selectedKey && activeMode === "humedales") labelFeature(selectedKey);
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
            if (mapLabels.some(label => label.key === key && label.group.style.display !== "none")) { tooltip.hidden = true; return; }
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
            mapLabels.forEach(label => label.group.classList.toggle("is-highlighted", label.key === key));
            if (key) labelFeature(key, event);
            else if (selectedKey && activeMode !== "bosques") labelFeature(selectedKey);
            else tooltip.hidden = true;
        };
        const updateFeatures = () => {
            const visibleWater = new Set(waterKeys());
            features.forEach(feature => {
                const key = feature.dataset.mapaFeature;
                const featureMode = feature.dataset.mapaModo;
                const visible = enabledLayers.has(featureMode) && (featureMode !== "bosques" || modes.bosques.keys.includes(key)) && (featureMode !== "humedales" || visibleWater.has(key));
                feature.style.display = visible ? "" : "none";
                feature.style.pointerEvents = visible ? "" : "none";
                feature.setAttribute("aria-hidden", String(!visible));
                feature.tabIndex = visible && (featureMode === "rios" || selectedKey === key || (featureMode === "bosques" && !selectedKey && key === modes.bosques.keys[0])) ? 0 : -1;
                feature.classList.toggle("is-selected", visible && selectedKey === key);
                if (visible) { feature.setAttribute("role", "button"); feature.setAttribute("aria-pressed", String(selectedKey === key)); }
                else { feature.removeAttribute("role"); feature.removeAttribute("aria-pressed"); feature.classList.remove("is-highlighted"); }
            });
            territory.classList.toggle("has-selection", !!selectedKey && activeMode !== "bosques");
        };
        const showCard = key => {
            territory.classList.toggle("has-element-selection", !!key);
            const panelIcon = territory.querySelector(".selva-territorio-panel-icono");
            const topicIcon = !key ? modes[activeMode].icon : activeMode === "bosques" ? (topics[key].icon || key) : activeMode === "humedales" ? (topics[key].waterType === "Laguna" ? "laguna" : topics[key].waterType === "Pantano" ? "pantano" : "agua") : "rios";
            panelIcon.querySelector("use").setAttribute("href", "#territorio-icono-" + topicIcon);
            panelIcon.style.color = activeMode === "bosques" && key ? forestColors[key] : "";
            card.style.setProperty("--ambient-color", activeMode === "bosques" && key ? forestColors[key] : "var(--mode-accent)");
            card.classList.toggle("is-forest-card", activeMode === "bosques" && !!key);
            if (!key) {
                const hint = node("div", "selva-territorio-ficha-ayuda");
                hint.append(icon(modes[activeMode].icon), node("h4", "", activeMode === "bosques" ? "Explora los ambientes forestales" : activeMode === "rios" ? "Selecciona un río para seguir su recorrido." : "Filtra los humedales por tipo o selecciona uno en el mapa."), node("p", "", activeMode === "bosques" && forestData.categories.length ? "Vista completa de las " + forestCategories.length + " categorías presentes en el recorte. Selecciona una categoría en el mapa o en la lista. Fuente: MINAM, publicación de 2015." : "Pulsa una geometría o utiliza las opciones del panel."));
                card.replaceChildren(hint); return;
            }
            const topic = topics[key];
            const heading = node("h4", "", topic.name);
            const type = node("span", "selva-territorio-tipo-ficha", topic.mode === "bosques" ? (forestData.categories.length ? "Cobertura vegetal · categoría oficial" : "Ambiente forestal · ficha educativa") : topic.mode === "rios" ? "Río · trazado cartográfico" : topic.waterType + " · MasaAgua");
            const education = topic.mode === "bosques" ? forestDescriptions.categorias[key] : null;
            const text = node("p", "", topic.mode === "bosques" ? (education?.descripcion || topic.text) : topic.mode === "rios" ? "Consulta los datos disponibles en el registro de este río." : "Forma y clasificación conservadas del registro cartográfico.");
            const details = node("dl", "selva-territorio-metadatos");
            topic.metadata.forEach(([label, value]) => details.append(node("dt", "", label), node("dd", "", value)));
            const sources = node("details", "selva-territorio-registro");
            sources.append(node("summary", "", "Fuentes y datos del registro"), node("p", "", topic.text), details);
            card.replaceChildren(type, heading, text);
            const badge = icon(topicIcon); badge.classList.add("selva-territorio-ficha-icono"); card.prepend(badge);
            const back = node("button", "selva-territorio-ficha-volver", "← Volver"); back.type = "button";
            back.addEventListener("click", () => { clearSelection(); options.querySelector("button,select")?.focus({preventScroll:true}); }); card.prepend(back);
            const primary = node("dl", "selva-territorio-datos-principales");
            topic.metadata.filter(([label]) => /Cuenca|Fuente|Fecha de registro|Fecha del registro/.test(label)).forEach(([label, value]) => primary.append(node("dt", "", label), node("dd", "", value)));
            if (education) {
                const context = node("div", "selva-territorio-ficha-contexto");
                context.append(node("p", "", "Clasificación cartográfica: MINAM · 2015"), node("p", "", "No representa necesariamente el estado actual.")); card.append(context);
                const reference = node("a", "", "Memoria descriptiva · sección " + education.seccion + ", página " + education.pagina + " ↗");
                reference.href = forestDescriptions.fuente.url + "#page=" + education.pagina; reference.target = "_blank"; reference.rel = "noopener noreferrer"; sources.append(reference);
            } else if (primary.childElementCount) card.append(primary);
            if (topic.mode === "humedales") {
                const feature = features.find(el => el.dataset.mapaFeature === key);
                const box = feature.getBBox(), margin = Math.max(box.width, box.height) * .12 + .3;
                const preview = document.createElementNS(svg.namespaceURI, "svg");
                preview.setAttribute("viewBox", [box.x - margin, box.y - margin, box.width + 2 * margin, box.height + 2 * margin].join(" "));
                preview.setAttribute("class", "selva-territorio-detalle-agua");
                preview.setAttribute("role", "img"); preview.setAttribute("aria-label", "Forma registrada de " + topic.name);
                const visual = feature.querySelector(".selva-territorio-agua-forma");
                const original = visual.localName === "use" ? svg.querySelector(visual.getAttribute("href")) : visual;
                const shape = original.cloneNode(true);
                shape.removeAttribute("id");
                shape.removeAttribute("class"); shape.setAttribute("fill", topic.waterType === "Pantano" ? "#668f75" : "#3c9098");
                shape.setAttribute("stroke", "#176d7a"); shape.setAttribute("stroke-width", ".8"); shape.setAttribute("vector-effect", "non-scaling-stroke");
                preview.append(shape); card.append(preview, node("small", "selva-territorio-detalle-nota", "Detalle ampliado de la geometría registrada"));
            }
            sources.hidden = true;
            const sourceButton = node("button", "selva-territorio-registro-abrir", "Fuentes y datos del registro ↗"); sourceButton.type = "button";
            sourceButton.setAttribute("aria-haspopup", "dialog"); sourceButton.setAttribute("aria-controls", "selva-territorio-fuentes-modal");
            sourceButton.addEventListener("click", () => openSources(sourceButton, sources, "Fuentes y datos del registro · " + topic.name, "registro"));
            appendLearning(key, card);
            card.append(sourceButton, sources);
            if (topic.source) {
                const link = node("a", "", topic.reference + " ↗");
                link.href = topic.source; link.target = "_blank"; link.rel = "noopener noreferrer";
                sources.append(link);
            }
        };
        const select = (key, interact = true) => {
            if (!topics[key]) return;
            if (topics[key].mode !== activeMode) setMode(topics[key].mode, false, false, true);
            enabledLayers.add(topics[key].mode); updateScenes();
            if (interact && performance.now() - lastDragAt < 250) return;
            selectedKey = key;
            if (interact) markExplored();
            if (activeMode === "bosques") {
                territory.dataset.forest = key;
                filterForest(key);
                options.querySelector("[data-territorio-bosques-todos]")?.setAttribute("aria-pressed", "false");
            }
            options.querySelectorAll("[data-territorio-tema]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.territorioTema === key)));
            const picker = options.querySelector("select"); if (picker) picker.value = key;
            options.querySelector("[data-territorio-rios-todos]")?.setAttribute("aria-pressed", "false");
            updateFeatures(); showCard(key); updateLegend(); updateMapLabels(); tooltip.hidden = true;
            const feature = features.find(el => el.dataset.mapaFeature === key);
            if (feature && interact && activeMode !== "bosques") zoomFeature(feature);
        };
        const clearSelection = () => {
            selectedKey = null; tooltip.hidden = true;
            if (activeMode === "bosques") { filterForest(null); territory.dataset.forest = "todos"; }
            updateFeatures(); buildOptions(); showCard(null); updateLegend(); updateMapLabels();
        };
        const buildOptions = () => {
            options.replaceChildren();
            if (activeMode === "humedales") {
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
                const label = node("label", "", "Seleccionar masa de agua"); label.htmlFor = "territorio-masa-agua";
                const picker = node("select", ""); picker.id = "territorio-masa-agua";
                const placeholder = node("option", "", "Explora una laguna o un pantano"); placeholder.value = ""; picker.append(placeholder);
                waterKeys().forEach(key => { const item = node("option", "", topics[key].name); item.value = key; picker.append(item); });
                picker.value = selectedKey || ""; picker.addEventListener("change", () => { if (picker.value) select(picker.value); });
                const toggle = node("button", "selva-territorio-todos", showAll ? "Volver a la selección inicial" : "Mostrar todos los registros");
                toggle.type = "button"; toggle.hidden = waterTypeFilter !== "todos"; toggle.dataset.territorioTodos = ""; toggle.setAttribute("aria-expanded", String(showAll));
                toggle.addEventListener("click", () => {
                    markExplored(); showAll = !showAll;
                    if (selectedKey && !waterKeys().includes(selectedKey)) { selectedKey = null; showCard(null); setView([0, 0, 600, 510]); }
                    updateFeatures(); buildOptions(); updateLegend();
                    options.querySelector("[data-territorio-todos]").focus({ preventScroll: true });
                });
                options.append(label, picker, toggle, node("small", "selva-territorio-alcance", waterTypeFilter !== "todos" ? "Registros disponibles del tipo seleccionado. Clasificación original de MasaAgua." : showAll ? "Conjunto completo disponible en esta vista." : "Selección por nombre y tamaño geométrico. No mide abundancia."));
            } else {
                modes[activeMode].keys.forEach(key => {
                    const button = node("button", "selva-territorio-acceso");
                    button.type = "button"; button.dataset.territorioTema = key; button.setAttribute("aria-pressed", String(selectedKey === key));
                    if (activeMode === "bosques") {
                        button.style.setProperty("--ambient-color", forestColors[key]);
                        button.append(icon(topics[key].icon || key));
                        const content = node("span", ""); content.append(node("strong", "", topics[key].name), node("small", "", topics[key].micro)); button.append(content);
                        const swatch = node("i", "selva-territorio-color"); swatch.setAttribute("aria-hidden", "true"); button.append(swatch);
                    } else button.append(icon("rios"), node("span", "", topics[key].name));
                    button.addEventListener("click", () => select(key));
                    button.addEventListener("pointerenter", event => highlight(key, event));
                    button.addEventListener("pointerleave", () => highlight(null));
                    button.addEventListener("focus", () => highlight(key));
                    button.addEventListener("blur", () => highlight(null)); options.append(button);
                });
                if (activeMode === "rios") {
                    const all = node("button", "selva-territorio-todos", "Ver todos"); all.type = "button"; all.dataset.territorioRiosTodos = "";
                    all.setAttribute("aria-pressed", String(!selectedKey));
                    all.addEventListener("click", () => { clearSelection(); options.querySelector("[data-territorio-rios-todos]").focus({preventScroll:true}); }); options.prepend(all);
                }
                if (activeMode === "bosques") {
                    const all = node("button", "selva-territorio-todos", forestData.categories.length ? "Todos" : "Ver todos");
                    all.type = "button"; all.dataset.territorioBosquesTodos = "";
                    all.setAttribute("aria-pressed", String(!selectedKey));
                    all.addEventListener("click", () => {
                        selectedKey = null; territory.dataset.forest = "todos"; filterForest(null);
                        options.querySelectorAll("[data-territorio-tema]").forEach(button => button.setAttribute("aria-pressed", "false"));
                        all.setAttribute("aria-pressed", "true"); updateFeatures(); showCard(null); updateLegend(); tooltip.hidden = true;
                    });
                    options.prepend(all);
                }
            }
        };
        const setMode = (mode, moveFocus = false, initial = false, keepLayers = false) => {
            const scroll = { left: window.scrollX, top: window.scrollY };
            activeMode = mode; selectedKey = null; showAll = false; waterTypeFilter = "todos";
            if (!keepLayers) enabledLayers.clear();
            enabledLayers.add(mode);
            if (mode !== "bosques") { filterForest(null); territory.dataset.forest = "todos"; }
            territory.dataset.territorioActivo = mode;
            tooltip.hidden = true; setView([0, 0, 600, 510], false);
            updateScenes();
            const data = modes[mode];
            helper.lastChild.textContent = mode === "bosques" ? "Explora los ambientes del panel" : "Haz clic en el mapa para explorar";
            territory.querySelector(".selva-territorio-panel-titulo").textContent = data.name;
            territory.querySelector(".selva-territorio-panel-intro").textContent = data.intro;
            territory.querySelector(".selva-territorio-escena-titulo").textContent = data.name;
            territory.querySelector(".selva-territorio-escena-frase").textContent = data.phrase;
            territory.querySelector(".selva-territorio-nota-escena").textContent = data.note;
            territory.querySelectorAll(".selva-territorio-modo-icono use, .selva-territorio-panel-icono use").forEach(use => use.setAttribute("href", "#territorio-icono-" + data.icon));
            buildOptions(); updateFeatures(); showCard(null); updateLegend();
            if (mode === "bosques") {
                if (forestData.categories.length) { filterForest(null); territory.dataset.forest = "todos"; }
                else select("tierra", false);
            }
            // Ríos inicia sin selección para presentar todos los trazados.
            if (!initial) markExplored();
            territory.getBoundingClientRect(); window.scrollTo({ ...scroll, behavior: "instant" });
        };
        features.forEach(feature => {
            const available = () => feature.getAttribute("aria-hidden") !== "true" && enabledLayers.has(feature.dataset.mapaModo);
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
        let drag = null;
        svg.addEventListener("pointerdown", event => {
            if (view[2] >= 599 || event.button !== 0) return;
            drag = { id: event.pointerId, x: event.clientX, y: event.clientY, start: [...view], scale: svg.getScreenCTM().a, moving: false };
        });
        svg.addEventListener("pointermove", event => {
            if (!drag || drag.id !== event.pointerId) return;
            const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
            if (!drag.moving && Math.hypot(dx, dy) < 5) return;
            drag.moving = true; svg.setPointerCapture(event.pointerId); lastDragAt = performance.now();
            tooltip.hidden = true;
            setView([Math.max(0, Math.min(600 - drag.start[2], drag.start[0] - dx / drag.scale)), Math.max(0, Math.min(510 - drag.start[3], drag.start[1] - dy / drag.scale)), drag.start[2], drag.start[3]], false);
        });
        const finishDrag = event => { if (drag?.moving) { lastDragAt = performance.now(); if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId); } drag = null; };
        svg.addEventListener("pointerup", finishDrag); svg.addEventListener("pointercancel", finishDrag);
        svg.addEventListener("keydown", event => {
            if (view[2] >= 599 || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
            event.preventDefault();
            const dx = event.key === "ArrowRight" ? 25 : event.key === "ArrowLeft" ? -25 : 0;
            const dy = event.key === "ArrowDown" ? 25 : event.key === "ArrowUp" ? -25 : 0;
            setView([Math.max(0, Math.min(600 - view[2], view[0] + dx)), Math.max(0, Math.min(510 - view[3], view[1] + dy)), view[2], view[3]], false);
        });
        window.addEventListener("resize", () => { updateMapLabels(); updateScale(); });
        reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) { cancelAnimationFrame(zoomFrame); svg.setAttribute("viewBox", view.join(" ")); } });
        exploreTopic = key => {
            if (!topics[key]) return;
            setMode(topics[key].mode, false, false, true);
            select(key);
            territory.scrollIntoView({behavior: reducedMotion.matches ? "instant" : "smooth", block: "start"});
            if (origin) { returnOrigin.hidden = false; returnOrigin.focus({ preventScroll: true }); }
            else card.querySelector(".selva-territorio-ficha-volver")?.focus({preventScroll: true});
        };
        setMode("rios", false, true);
        };

        const host = territory.querySelector("[data-territorio-map-src]");
        const canvas = territory.querySelector(".selva-territorio-canvas");
        const controls = [...territory.querySelectorAll("[data-territorio-zoom], #territorio-provincias, [data-territorio-capa], [data-territorio-overlay-toggle]")];
        let loading = false, loaded = false;
        controls.forEach(control => { control.disabled = true; });
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
                const dataFiles = ["datos/territorio/registros-visor.json", "datos/territorio/cobertura-fichas.json", "datos/territorio/descripciones.json", "datos/territorio/lectura.json"];
                const [response, ...dataResponses] = await Promise.all([fetch(window.ecoResourceURL(host.dataset.territorioMapSrc)), ...dataFiles.map(path => fetch(window.ecoResourceURL(path)))]);
                if (dataResponses.some(item => !item.ok)) throw new Error("No se pudieron cargar los registros del mapa.");
                [topics, forestData, forestDescriptions, lectura] = await Promise.all(dataResponses.map(item => item.json()));
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
                controls.forEach(control => { control.disabled = true; });
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
                    "Correcto: el elemento central es un río, con un cauce sinuoso entre orillas. El bosque lo acompaña. La ilustración no permite identificar todos los humedales." :
                    value === "bosque" ? "El bosque aparece en las orillas. Observa el elemento central por el que fluye el agua y prueba otra respuesta." :
                    "El agua puede conectar humedales, pero aquí se representa un cauce con flujo. Observa el elemento central y prueba otra respuesta.";
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
