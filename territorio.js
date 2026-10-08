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
        let topics, forestData, forestDescriptions, lectura, atlasPresentation;
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
        const metresPerSvgUnit = atlasPresentation.metros_por_unidad_svg;
        const provinceToggle = territory.querySelector("#territorio-provincias");
        svg.querySelector('.selva-territorio-colindantes').setAttribute('aria-hidden', 'true');
        const provinceLabels = [...svg.querySelectorAll(".selva-territorio-provincias-nombres text")].map(text => ({
            text, anchor: { x: Number(text.getAttribute("x")), y: Number(text.getAttribute("y")) }, priority: 80, size: 12
        }));
        const contextLabels = [...svg.querySelectorAll(".selva-territorio-colindantes text")].map(text => ({
            text, anchor: { x: Number(text.getAttribute("x")), y: Number(text.getAttribute("y")) }, priority: 5, size: 10
        }));
        const pointLabels = new Map(atlasPresentation.etiquetas.filter(item => item.id).map(item => [item.id, item]));
        const overlayLabels = [];
        const labelSettings = {
            madre: [.53, 18, -19], tambopata: [.5, 14, 22], inambari: [.72, -35, 22],
            piedras: [.48, 18, -22], manu: [.52, -32, -20], heath: [.45, -30, -15]
        };
        const mapLabels = Object.entries(labelSettings).map(([key, settings]) => {
            const visual = svg.querySelector(`[data-mapa-feature="${key}"] .selva-territorio-rio-linea`);
            const path = visual.localName === "use" ? svg.querySelector(visual.getAttribute("href")) : visual;
            const group = document.createElementNS(svg.namespaceURI, "g");
            const text = document.createElementNS(svg.namespaceURI, "text");
            group.dataset.mapLabel = key;
            text.textContent = topics[key].name.replace("Río ", "");
            group.append(text); labelLayer.append(group);
            return { key, path, group, text, settings };
        });
        const selectedLabel = document.createElementNS(svg.namespaceURI, "text");
        labelLayer.append(selectedLabel);
        // Copia visual del contorno: exactamente las mismas coordenadas.
        const outline = svg.querySelector(".selva-territorio-limite").cloneNode(true);
        outline.removeAttribute("class"); outline.classList.add("eco-atlas-boundary"); outline.setAttribute("aria-hidden", "true");
        svg.insertBefore(outline, labelLayer);
        const provinceLines = svg.querySelector(".selva-territorio-provincias-limites");
        const hydroScene = svg.querySelector('[data-territorio-scene="rios"]');
        hydroScene.parentElement.insertBefore(provinceLines, hydroScene);
        const updateMapLabels = () => {
            labelLayer.style.display = "";
            const ratio = 1 / (svg.getScreenCTM()?.a || 1), zoom = 600 / view[2];
            const candidates = provinceLabels.map(item => ({ ...item, visible: provinceToggle.checked }));
            candidates.push(...contextLabels.map(item => ({ ...item, visible: zoom < 1.5 })));
            mapLabels.forEach(({ key, path, group, text, settings }) => {
                const point = path.getPointAtLength(path.getTotalLength() * settings[0]);
                candidates.push({ text, group, anchor: {x:point.x, y:point.y},
                    offsets: [[settings[1], settings[2]], [0,-14], [0,14]],
                    priority: key === selectedKey ? 100 : 70, size: key === selectedKey ? 13 : 11,
                    visible: enabledLayers.has("rios") });
            });
            const selectedPoint = pointLabels.get(selectedKey);
            selectedLabel.textContent = selectedKey && topics[selectedKey] ? topics[selectedKey].name : "";
            candidates.push({text:selectedLabel, anchor:selectedPoint || {x:0,y:0}, priority:100, size:13,
                visible:Boolean(selectedPoint && selectedKey && enabledLayers.has(topics[selectedKey].mode))});
            candidates.push(...overlayLabels.map(item => ({...item,
                visible: overlayInputs.some(input => input.checked && input.dataset.territorioOverlayToggle === item.layer) && zoom >= (item.layer === "anp" ? 1.4 : 1.7),
                size:item.layer === "anp" ? 10.5 : 10, priority:item.layer === "anp" ? 50 : 30 })));
            window.ecoAtlas.labels(svg, candidates, [...canvas.querySelectorAll('.selva-territorio-ubicacion,.selva-territorio-brujula,.selva-territorio-controles,.selva-territorio-escala')]);
        };
        provinceToggle.addEventListener("change", () => {
            svg.querySelectorAll(".selva-territorio-provincias-limites, .selva-territorio-provincias-nombres").forEach(layer => {
                layer.style.display = provinceToggle.checked ? "" : "none";
            });
            updateMapLabels(); updateLegend();
        });
        const forestColors = { tierra: "#24563A", inundable: "#3E7763", aguajal: "#768B49", secundario: "#7EAB70" };
        Object.assign(forestColors, Object.fromEntries(forestData.categories.map(category => [category.id, category.color])));
        // Paleta de presentación; códigos, clases y atributos MINAM sin cambios.
        const displayPalette = {
            "Ano-ba":"#c4b396", "Bca":"#234c3b", "Bca-pa":"#667b39",
            "Bcb":"#499367", "Bcb-cas":"#9c8057", "Bcb-pa":"#8eb363",
            "Bcb-Shi":"#256665", "Bllm":"#659e95", "Bm":"#294d52",
            "Bm-al":"#abc0b6", "Bm-ba":"#44756a", "Bm-ba-pa":"#b3be75",
            "Bm-pa":"#496526", "Bm-mo":"#76845f", "Bta":"#71a48f",
            "Bta-cas":"#baa06c", "Bta-pa":"#a6cb8f", "Btb":"#318f99",
            "Btb-cas":"#d3c68a", "Btb-pa":"#7cbdb0", "Bi-pal":"#87944b",
            "L/Co":"#78b8c2", "Pac":"#b6a250", "Pj":"#d5c493",
            "R":"#408899", "Sahi-pal":"#c7d6a0", "Is":"#9cafa3"
        };
        forestData.categories.forEach(category => { forestColors[category.id] = displayPalette[category.codigo_original] || category.color; });

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
            window.ecoAtlas.scale(svg, scaleElement, metresPerSvgUnit);
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
        let forestPromise = null, forestReady = false, forestError = "";
        const loadForest = () => {
            if (forestReady) return Promise.resolve();
            if (forestPromise) return forestPromise;
            forestError = "";
            forestPromise = (async () => {
                const response = await fetch(window.ecoResourceURL("datos/presentacion/bosques.svg"));
                if (!response.ok) throw new Error("Cobertura: HTTP " + response.status);
                const doc = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
                const incoming = [...doc.querySelectorAll('[data-mapa-feature]')];
                if (doc.querySelector('parsererror') || incoming.length !== forestData.categories.length) throw new Error("Cobertura incompleta");
                incoming.forEach(group => {
                    const target = features.find(feature => feature.dataset.mapaFeature === group.dataset.mapaFeature);
                    if (!target) throw new Error("Categoría ausente");
                    [...group.children].filter(child => child.localName === 'path').forEach(path => target.append(document.importNode(path, true)));
                });
                forestReady = true; filterForest(selectedKey && topics[selectedKey].mode === "bosques" ? selectedKey : null);
            })().catch(() => { forestError = "No se pudo cargar la cobertura. Desactiva y activa Bosques para volver a intentar."; })
                .finally(() => { forestPromise = null; updateLayerStatus(); });
            updateLayerStatus(); return forestPromise;
        };
        const overlayPromises = new Map(), readyOverlays = new Set();
        const overlayFiles = { anp: "datos/presentacion/anp.svg", distritos: "datos/presentacion/distritos.svg" };
        let overlayError = "";
        const updateLayerStatus = () => {
            const names = [...layerInputs.filter(input => input.checked).map(input => input.parentElement.textContent.trim()),
                ...(provinceToggle.checked ? ["Provincias"] : []),
                ...overlayInputs.filter(input => input.checked && readyOverlays.has(input.dataset.territorioOverlayToggle)).map(input => input.parentElement.textContent.trim())];
            layerStatus.textContent = (names.length ? "Capas visibles: " + names.join(" · ") + "." : "No hay capas activadas; se conserva el contorno de referencia.") +
                (overlayError ? " " + overlayError : overlayPromises.size ? " Cargando contornos adicionales…" : "") +
                (forestError ? " " + forestError : forestPromise ? " Cargando cobertura MINAM 2015…" : "") +
                " Las fechas y límites de uso se explican en Datos y metodología.";
        };
        const updateScenes = () => {
            if (enabledLayers.has("bosques")) loadForest();
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
        const loadOverlays = name => {
            if (readyOverlays.has(name)) return Promise.resolve();
            if (overlayPromises.has(name)) return overlayPromises.get(name);
            overlayError = "";
            const promise = (async () => {
                const response = await fetch(window.ecoResourceURL(overlayFiles[name]));
                if (!response.ok) throw new Error("HTTP " + response.status);
                const doc = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
                const original = doc.querySelector('[data-territorio-overlay="' + name + '"]');
                if (doc.querySelector("parsererror") || !original) throw new Error("Capa inválida: " + name);
                const group = document.importNode(original, true);
                group.setAttribute("clip-path", "url(#territorio-limite-clip)");
                hydroScene.parentElement.insertBefore(group, name === "anp" ? provinceLines : hydroScene);
                const records = atlasPresentation.etiquetas.filter(item => item.capa === name);
                if (name === "anp") [...group.children].forEach((path, i) => {
                    path.style.strokeDasharray = records[i].categoria === "Parque Nacional" ? "none" : records[i].categoria === "Reserva Nacional" ? "8 3" : "3 3";
                });
                records.forEach(record => {
                    const text = document.createElementNS(svg.namespaceURI, "text");
                    text.textContent = record.nombre; labelLayer.append(text);
                    overlayLabels.push({text, anchor:record, layer:name});
                });
                readyOverlays.add(name);
            })().catch(error => {
                console.error("No se pudo cargar la capa:", error);
                const input = overlayInputs.find(item => item.dataset.territorioOverlayToggle === name);
                input.checked = false;
                overlayError = "No se pudo cargar " + name + ". Activa su casilla para volver a intentar.";
            }).finally(() => { overlayPromises.delete(name); updateScenes(); updateLegend(); updateMapLabels(); });
            overlayPromises.set(name, promise); updateLayerStatus();
            return promise;
        };
        overlayInputs.forEach(input => input.addEventListener("change", () => {
            if (input.checked) loadOverlays(input.dataset.territorioOverlayToggle);
            updateScenes(); updateLegend(); updateMapLabels();
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

        const updateLegend = () => {
            legend.replaceChildren();
            const heading = title => legend.append(node("strong", "eco-atlas-legend-heading", title));
            const sample = (kind, title) => {
                const item = node("span", "selva-territorio-leyenda-item");
                item.append(node("i", "selva-territorio-muestra selva-territorio-muestra--" + kind), node("span", "", title)); legend.append(item);
            };
            if (enabledLayers.has("bosques")) {
                heading("Cobertura · MINAM, 2015");
                modes.bosques.keys.forEach(key => {
                    const item = node("span", "selva-territorio-leyenda-item");
                    const swatch = node("i", "selva-territorio-color"); swatch.style.backgroundColor = forestColors[key];
                    item.append(swatch, node("span", "", topics[key].name)); legend.append(item);
                });
                legend.append(node("small", "selva-territorio-leyenda-aviso", "Categorías originales; colores de visualización EcoSelva. Incluye coberturas no forestales."));
            }
            if (provinceToggle.checked) {heading("Provincias"); const item = node("span", "", "Límite provincial"); item.prepend(node("i", "eco-atlas-swatch")); legend.append(item);}
            if (enabledLayers.has("rios")) {heading("Ríos"); sample("rio", "Cursos representados"); if (selectedKey && topics[selectedKey].mode === "rios") sample("seleccionado", "Río seleccionado");}
            if (enabledLayers.has("humedales")) {heading("Masas de agua");sample("laguna", "Laguna");sample("pantano", "Pantano");}
            overlayInputs.filter(input => input.checked && readyOverlays.has(input.dataset.territorioOverlayToggle)).forEach(input => {
                const name = input.dataset.territorioOverlayToggle;
                heading(name === "anp" ? "Áreas naturales protegidas" : "Distritos");
                const item = node("span", "", name === "anp" ? "PN: sólido · RN: rayas · RC: puntos" : "Contorno distrital de referencia");
                item.prepend(node("i", "eco-atlas-swatch eco-atlas-swatch--" + name));legend.append(item);
            });
            if (!legend.childElementCount) legend.append(node("span", "", "Contorno departamental de referencia; capas temáticas desactivadas."));
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
        const requestedLayers = layerInputs.filter(input => input.checked).map(input => input.dataset.territorioCapa);
        requestedLayers.forEach(mode => enabledLayers.add(mode));
        setMode(requestedMode || requestedLayers.at(-1) || 'rios', false, true, true);
        enabledLayers.clear();
        requestedLayers.forEach(mode => enabledLayers.add(mode));
        updateScenes(); updateFeatures(); updateMapLabels(); updateLegend();
        provinceToggle.dispatchEvent(new Event('change'));
        overlayInputs.filter(input => input.checked).forEach(input => loadOverlays(input.dataset.territorioOverlayToggle));
        };

        const host = territory.querySelector("[data-territorio-map-src]");
        const canvas = territory.querySelector(".selva-territorio-canvas");
        const controls = [...territory.querySelectorAll("[data-territorio-zoom], #territorio-provincias, [data-territorio-capa], [data-territorio-overlay-toggle]")];
        let loading = false, loaded = false;
        const selections = controls.filter(control => control.matches('input[type="checkbox"]'));
        controls.forEach(control => { control.disabled = !selections.includes(control); });
        selections.forEach(control => control.addEventListener('change', () => {
            if (loaded) return;
            if (control.dataset.territorioCapa && control.checked) requestedMode = control.dataset.territorioCapa;
            if (requestedMode && !territory.querySelector('[data-territorio-capa="' + requestedMode + '"]').checked) requestedMode = null;
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
                const dataFiles = ["datos/territorio/registros-visor.json", "datos/territorio/cobertura-fichas.json", "datos/territorio/descripciones.json", "datos/territorio/lectura.json", "datos/presentacion/etiquetas.json"];
                const [response, ...dataResponses] = await Promise.all([fetch(window.ecoResourceURL(host.dataset.territorioMapSrc)), ...dataFiles.map(path => fetch(window.ecoResourceURL(path)))]);
                if (dataResponses.some(item => !item.ok)) throw new Error("No se pudieron cargar los registros del mapa.");
                [topics, forestData, forestDescriptions, lectura, atlasPresentation] = await Promise.all(dataResponses.map(item => item.json()));
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
