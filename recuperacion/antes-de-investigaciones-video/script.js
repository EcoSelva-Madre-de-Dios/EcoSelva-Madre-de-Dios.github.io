document.addEventListener("DOMContentLoaded", () => {
    const currentYear = document.querySelector("#selva-anio-actual");
    if (currentYear) {
        currentYear.textContent = String(new Date().getFullYear());
    }

    const navbar = document.querySelector(".navbar");
    if (navbar) {
        const navigationLinks = [...navbar.querySelectorAll('a[href^="#"]')];
        const menuToggle = document.querySelector("#menu");
        const dropdown = navbar.querySelector(".selva-nav-desplegable details");
        const dropdownSummary = dropdown?.querySelector("summary");
        const menuBar = navbar.closest(".menu");

        const updateMenuSurface = () => {
            menuBar?.classList.toggle("selva-menu-scrolled", window.scrollY > 48);
        };

        const setActiveNavigationLink = (activeLink) => {
            navigationLinks.forEach((link) => link.removeAttribute("aria-current"));
            if (activeLink) {
                activeLink.setAttribute("aria-current", "location");
            }

            const activeDropdownLink = dropdown?.querySelector('a[aria-current="location"]');
            if (dropdownSummary) {
                if (activeDropdownLink) {
                    dropdownSummary.setAttribute("aria-current", "location");
                } else {
                    dropdownSummary.removeAttribute("aria-current");
                }
            }
        };

        navigationLinks.forEach((link) => {
            link.addEventListener("click", () => {
                setActiveNavigationLink(link);
                if (dropdown) {
                    dropdown.open = false;
                }
                if (menuToggle) {
                    menuToggle.checked = false;
                }
            });
        });

        const updateActiveNavigation = () => {
            const targets = navigationLinks
                .map((link) => ({
                    link,
                    target: document.querySelector(link.getAttribute("href"))
                }))
                .filter(({ target }) => target);
            let activeLink = targets[0]?.link;

            targets.forEach(({ link, target }) => {
                if (target.getBoundingClientRect().top <= 150) {
                    activeLink = link;
                }
            });
            setActiveNavigationLink(activeLink);
        };

        window.addEventListener("scroll", updateActiveNavigation, { passive: true });
        window.addEventListener("resize", updateActiveNavigation);
        window.addEventListener("scroll", updateMenuSurface, { passive: true });
        window.addEventListener("resize", updateMenuSurface);
        window.addEventListener("hashchange", () => {
            const activeLink = navigationLinks.find((link) => link.hash === window.location.hash);
            if (activeLink) {
                setActiveNavigationLink(activeLink);
            }
        });
        updateMenuSurface();
        updateActiveNavigation();
    }
    const biodiversity = document.querySelector("#programas");
    if (biodiversity) {
        const tabs = [...biodiversity.querySelectorAll('[role="tab"]')];
        const activateTab = (activeTab, moveFocus = false) => {
            tabs.forEach((tab) => {
                const selected = tab === activeTab;
                tab.setAttribute("aria-selected", String(selected));
                tab.tabIndex = selected ? 0 : -1;
                const panel = document.getElementById(tab.getAttribute("aria-controls"));
                if (panel) panel.hidden = !selected;
            });
            if (moveFocus) activeTab.focus({ preventScroll: true });
        };
        tabs.forEach((tab, index) => {
            tab.addEventListener("click", () => activateTab(tab));
            tab.addEventListener("keydown", (event) => {
                let nextIndex;
                if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
                else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
                else if (event.key === "Home") nextIndex = 0;
                else if (event.key === "End") nextIndex = tabs.length - 1;
                else return;
                event.preventDefault();
                activateTab(tabs[nextIndex], true);
            });
        });
    }

    const floraCounters = [...document.querySelectorAll(".selva-flora-stats [data-flora-count]")];
    if (floraCounters.length > 0) {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reducedMotion || !("IntersectionObserver" in window)) {
            floraCounters.forEach((counter) => {
                counter.textContent = counter.dataset.floraCount;
            });
        } else {
            const animatedCounters = new WeakSet();
            const counterObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting || animatedCounters.has(entry.target)) {
                        return;
                    }

                    animatedCounters.add(entry.target);
                    observer.unobserve(entry.target);
                    const counter = entry.target;
                    const target = Number(counter.dataset.floraCount);
                    let startedAt;
                    counter.textContent = "0";
                    const updateCounter = (now) => {
                        startedAt ??= now;
                        const progress = Math.max(0, Math.min((now - startedAt) / 1000, 1));
                        const easedProgress = 1 - Math.pow(1 - progress, 3);
                        counter.textContent = String(Math.round(target * easedProgress));

                        if (progress < 1) {
                            window.requestAnimationFrame(updateCounter);
                        }
                    };

                    window.requestAnimationFrame(updateCounter);
                });
            }, { threshold: 0.35 });

            floraCounters.forEach((counter) => {
                counterObserver.observe(counter);
            });
        }
    }

    // Contadores independientes: cada registro se anima solo al hacerse visible.
    const faunaCounters = [...document.querySelectorAll("[data-fauna-count]")];
    if (faunaCounters.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
        const faunaObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                faunaObserver.unobserve(entry.target);
                const counter = entry.target;
                const target = Number(counter.dataset.faunaCount);
                let start;
                counter.textContent = "0";
                const update = (now) => {
                    start ??= now;
                    const progress = Math.min((now - start) / 800, 1);
                    counter.textContent = String(Math.round(target * (1 - Math.pow(1 - progress, 3))));
                    if (progress < 1) window.requestAnimationFrame(update);
                };
                window.requestAnimationFrame(update);
            });
        }, { threshold: 0.35 });
        faunaCounters.forEach((counter) => faunaObserver.observe(counter));
    }

    const faunaModal = document.querySelector("#selva-fauna-modal");
    if (faunaModal) {
        const tambopataSource = "https://www.gob.pe/institucion/sernanp/informes-publicaciones/1793047-reserva-nacional-tambopata";
        const amphibianSource = "https://doi.org/10.3897/BDJ.13.e154136";
        // Selección educativa, sin ranking. Cada registro conserva su alcance local.
        const faunaGroups = {
            mamiferos: { name: "Mamíferos", source: tambopataSource, reference: "SERNANP · Reserva Nacional Tambopata", place: "Reserva Nacional Tambopata, Madre de Dios", photo: "images/jaguar-madre-de-dios.jpg", author: "Geoff Gallice", photoSource: "https://commons.wikimedia.org/wiki/File:Jaguar_Madre_de_Dios_Peru.jpg", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/", photoPlace: "Río Los Amigos, Madre de Dios, Perú", species: [["Jaguar", "Panthera onca"], ["Lobo de río", "Pteronura brasiliensis"], ["Sachavaca", "Tapirus terrestris"]] },
            aves: { name: "Aves", source: tambopataSource, reference: "SERNANP · Reserva Nacional Tambopata", place: "Reserva Nacional Tambopata, Madre de Dios", photo: "images/fauna-guacamayo.jpg", author: "chuck624", photoSource: "https://commons.wikimedia.org/wiki/File:Ara_macao_-Puntarenas_Province,_Costa_Rica-8.jpg", license: "CC BY-SA 2.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/", photoPlace: "Puntarenas, Costa Rica; fotografía ilustrativa de la especie", species: [["Guacamayo rojo", "Ara macao"], ["Águila harpía", "Harpia harpyja"], ["Gallito de las rocas", "Rupicola peruvianus", "Madre de Dios", "https://biodiversidadanp.sernanp.gob.pe/personaje-del-mes/rupicola-peruvianus/", "SERNANP · Gallito de las rocas"]] },
            reptiles: { name: "Reptiles", source: tambopataSource, reference: "SERNANP · Reserva Nacional Tambopata", place: "Reserva Nacional Tambopata, Madre de Dios", photo: "images/fauna-caiman.jpg", author: "Whaldener Endo", photoSource: "https://commons.wikimedia.org/wiki/File:Melanosuchus_niger_RDS_Uacari.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", photoPlace: "Reserva de Desarrollo Sostenible Uacari, Brasil; fotografía ilustrativa de la especie", species: [["Caimán negro", "Melanosuchus niger"], ["Taricaya", "Podocnemis unifilis"], ["Boa constrictora", "Boa constrictor"]] },
            anfibios: { name: "Anfibios", source: amphibianSource, reference: "Crnobrna y colaboradores · Biodiversity Data Journal (2025)", place: "Cuenca del río Las Piedras, Madre de Dios", photo: "images/fauna-rana.jpg", author: "Hugo Claessen", photoSource: "https://commons.wikimedia.org/wiki/File:Ameerega_trivittata02.jpg", license: "CC BY-SA 2.5", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.5/", photoPlace: "Ubicación de la fotografía no indicada; imagen ilustrativa de la especie", species: [["Rana venenosa de tres franjas", "Ameerega trivittata"], ["Rana de muslos brillantes", "Allobates femoralis"], ["Sapo de costados lisos", "Rhaebo guttatus"]] }
        };
        const body = faunaModal.querySelector(".selva-fauna-modal-cuerpo");
        const title = faunaModal.querySelector("#selva-fauna-modal-titulo");
        const back = faunaModal.querySelector(".selva-fauna-volver");
        let activeGroup;
        let openingButton;
        let previousOverflow;
        let restorePending = false;
        const restoreFaunaFocus = () => {
            if (!restorePending || faunaModal.open) return;
            restorePending = false;
            document.body.style.overflow = previousOverflow;
            openingButton?.focus({ preventScroll: true });
        };
        const closeFaunaModal = () => {
            faunaModal.close();
            restoreFaunaFocus();
        };
        const element = (tag, text, className) => {
            const node = document.createElement(tag);
            if (text) node.textContent = text;
            if (className) node.className = className;
            return node;
        };
        const link = (text, url) => {
            const node = element("a", text);
            node.href = url;
            node.target = "_blank";
            node.rel = "noopener noreferrer";
            return node;
        };
        const showSpecies = (species) => {
            const group = faunaGroups[activeGroup];
            body.replaceChildren();
            title.textContent = species[0];
            back.hidden = false;
            back.textContent = `← Volver a ${group.name}`;
            body.append(element("em", species[1], "selva-fauna-cientifico"));
            const record = element("dl", null, "selva-fauna-ficha");
            record.append(element("dt", "Dónde se ha registrado"), element("dd", species[2] || group.place));
            body.append(record, element("h4", "Fuentes"), link(species[4] || group.reference, species[3] || group.source));
            body.append(element("p", "Revisión EcoSelva: octubre de 2026.", "selva-fauna-ficha-revision"));
            // La fotografía lateral conserva el nombre y crédito de la especie representada.
            body.append(element("p", `Fotografía lateral: ${group.species[0][0]}.`, "selva-fauna-ficha-revision"));
            back.focus({ preventScroll: true });
            faunaModal.querySelector(".selva-fauna-modal-contenido").scrollTop = 0;
            if (window.matchMedia("(max-width: 640px)").matches) back.scrollIntoView({ block: "start", behavior: "instant" });
        };
        const showGroup = (focusTitle = false) => {
            const group = faunaGroups[activeGroup];
            body.replaceChildren();
            title.textContent = "Especies destacadas";
            back.hidden = true;
            const list = element("ul", null, "selva-fauna-especies");
            group.species.forEach((species, index) => {
                const item = element("li");
                const content = element("div");
                if (index === 0) {
                    const photo = element("img");
                    photo.src = group.photo;
                    photo.alt = species[0];
                    item.append(photo);
                } else {
                    const icon = document.querySelector(`[data-fauna-categoria="${activeGroup}"] .selva-fauna-icono`).cloneNode(true);
                    icon.dataset.visualType = "illustration";
                    item.append(icon);
                }
                content.append(element("h4", species[0]), element("em", species[1]), element("p", `Registro: ${species[2] || group.place}.`));
                const button = element("button", "Conocer especie →", "selva-fauna-conocer");
                button.type = "button";
                button.setAttribute("aria-label", `Conocer ${species[0]}`);
                button.addEventListener("click", () => showSpecies(species));
                content.append(button);
                item.append(content);
                list.append(item);
            });
            body.append(list, element("p", "Selección educativa de registros locales.", "selva-fauna-ficha-revision"), link(group.reference, group.source));
            if (focusTitle) {
                title.tabIndex = -1;
                title.focus({ preventScroll: true });
                if (window.matchMedia("(max-width: 640px)").matches) title.scrollIntoView({ block: "start", behavior: "instant" });
            }
        };
        document.querySelectorAll("[data-fauna-explorar]").forEach((button) => {
            button.addEventListener("click", () => {
                if (faunaModal.open) return;
                restoreFaunaFocus();
                activeGroup = button.dataset.faunaExplorar;
                const group = faunaGroups[activeGroup];
                openingButton = button;
                faunaModal.querySelector(".selva-fauna-modal-categoria").textContent = group.name;
                const photo = faunaModal.querySelector(".selva-fauna-modal-imagen img");
                photo.src = group.photo;
                photo.alt = `${group.species[0][0]} (${group.species[0][1]}). ${group.photoPlace}.`;
                faunaModal.querySelector(".selva-fauna-foto-nombre").textContent = group.species[0][0];
                faunaModal.querySelector(".selva-fauna-foto-cientifico").textContent = group.species[0][1];
                faunaModal.querySelector(".selva-fauna-foto-registro").textContent = "Especie documentada en Madre de Dios.";
                const credit = faunaModal.querySelector(".selva-fauna-foto-credito");
                credit.replaceChildren(document.createTextNode(`Foto: ${group.author} · `), link("Wikimedia Commons", group.photoSource), document.createTextNode(" · "), link(group.license, group.licenseUrl), document.createTextNode(`. ${group.photoPlace}. Consulta: octubre de 2026.`));
                showGroup();
                previousOverflow = document.body.style.overflow;
                restorePending = true;
                document.body.style.overflow = "hidden";
                faunaModal.showModal();
                faunaModal.scrollTop = 0;
                faunaModal.querySelector(".selva-fauna-modal-contenido").scrollTop = 0;
                faunaModal.querySelector(".selva-fauna-modal-cerrar").focus({ preventScroll: true });
            });
        });
        back.addEventListener("click", () => showGroup(true));
        faunaModal.querySelector(".selva-fauna-modal-cerrar").addEventListener("click", closeFaunaModal);
        faunaModal.addEventListener("close", restoreFaunaFocus);
        faunaModal.addEventListener("cancel", (event) => { event.preventDefault(); closeFaunaModal(); });
        let backdropDown = false;
        const outside = (event) => {
            const rect = faunaModal.getBoundingClientRect();
            return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
        };
        faunaModal.addEventListener("pointerdown", (event) => { backdropDown = event.target === faunaModal && outside(event); });
        faunaModal.addEventListener("click", (event) => {
            if (backdropDown && event.target === faunaModal && outside(event)) closeFaunaModal();
            backdropDown = false;
        });
        faunaModal.addEventListener("keydown", (event) => {
            if (event.key !== "Tab") return;
            const nodes = [...faunaModal.querySelectorAll("button, a[href]")].filter((node) => node.getClientRects().length);
            const first = nodes[0];
            const last = nodes[nodes.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        });
    }

    const floraModal = document.querySelector("#selva-flora-modal");
    if (floraModal) {
        const categoryNames = {
            maderables: "Maderables",
            "no-maderables": "No maderables",
            medicinales: "Medicinales",
            alimenticias: "Alimenticias / frutales"
        };
        let openingButton;
        let backdropPointerDown = false;
        const restoreFloraFocus = () => {
            document.body.classList.remove("selva-flora-modal-abierto");
            backdropPointerDown = false;
            if (openingButton?.isConnected) openingButton.focus({ preventScroll: true });
        };
        const closeFloraModal = () => {
            if (floraModal.open) {
                floraModal.close();
                restoreFloraFocus();
            }
        };
        const isOutsideModal = (event) => {
            const bounds = floraModal.getBoundingClientRect();
            return event.clientX < bounds.left || event.clientX > bounds.right
                || event.clientY < bounds.top || event.clientY > bounds.bottom;
        };

        document.querySelectorAll(".selva-flora-stat-accion[data-flora-modal]").forEach((button) => {
            button.addEventListener("click", () => {
                const category = button.dataset.floraModal;
                const template = document.getElementById(`selva-flora-contenido-${category}`);
                if (!template || floraModal.open) return;
                const consolidating = category === "medicinales" || category === "alimenticias";
                floraModal.querySelector(".selva-flora-modal-categoria").textContent = categoryNames[category];
                floraModal.querySelector(".selva-flora-modal-titulo").textContent = consolidating
                    ? "Información en consolidación" : "Especies destacadas";
                floraModal.querySelector(".selva-flora-modal-descripcion").textContent = consolidating
                    ? "Registros parciales y límites de la información regional disponible."
                    : "Una selección de especies documentadas en las fuentes consultadas.";
                floraModal.querySelector(".selva-flora-modal-cuerpo").replaceChildren(template.content.cloneNode(true));
                openingButton = button;
                floraModal.showModal();
                floraModal.scrollTop = 0;
                document.body.classList.add("selva-flora-modal-abierto");
                floraModal.querySelector(".selva-flora-modal-cerrar").focus({ preventScroll: true });
            });
        });
        floraModal.querySelector(".selva-flora-modal-cerrar").addEventListener("click", closeFloraModal);
        floraModal.addEventListener("cancel", (event) => {
            event.preventDefault();
            closeFloraModal();
        });
        floraModal.addEventListener("pointerdown", (event) => {
            backdropPointerDown = event.target === floraModal && isOutsideModal(event);
        });
        floraModal.addEventListener("click", (event) => {
            if (backdropPointerDown && event.target === floraModal && isOutsideModal(event)) closeFloraModal();
            backdropPointerDown = false;
        });
        floraModal.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                closeFloraModal();
            } else if (event.key === "Tab") {
                const focusable = [...floraModal.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')]
                    .filter((element) => element.getClientRects().length > 0);
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first?.focus();
                }
            }
        });
        floraModal.addEventListener("close", () => {
            if (!floraModal.open) restoreFloraFocus();
        });
    }

    const environmentModal = document.querySelector("#selva-ambiente-modal");
    if (environmentModal) {
        const title = environmentModal.querySelector("#selva-ambiente-modal-titulo");
        const description = environmentModal.querySelector(".selva-ambiente-modal-descripcion");
        const body = environmentModal.querySelector(".selva-ambiente-modal-cuerpo");
        const back = environmentModal.querySelector(".selva-ambiente-volver");
        let activeArea;
        let openingButton;
        let previousOverflow;
        let restorePending = false;
        const restore = () => {
            if (!restorePending || environmentModal.open) return;
            restorePending = false;
            document.body.style.overflow = previousOverflow;
            openingButton?.focus({ preventScroll: true });
        };
        const close = () => { environmentModal.close(); restore(); };
        const showTopic = (topic) => {
            title.textContent = topic;
            description.textContent = "Ficha educativa en preparación.";
            back.textContent = `← Volver a ${activeArea.querySelector("h3").textContent}`;
            back.hidden = false;
            const state = document.createElement("p");
            state.className = "selva-ambiente-ficha-estado";
            state.textContent = "Ampliaremos este tema con explicaciones y referencias verificables.";
            body.replaceChildren(state);
            back.focus({ preventScroll: true });
            if (window.matchMedia("(max-width: 640px)").matches) back.scrollIntoView({ block: "start", behavior: "instant" });
        };
        const showArea = (moveFocus = false) => {
            title.textContent = activeArea.querySelector("h3").textContent;
            description.textContent = activeArea.querySelector(".selva-ambiente-area-descripcion").textContent;
            back.hidden = true;
            const list = document.createElement("ul");
            list.className = "selva-ambiente-opciones";
            activeArea.querySelector(".selva-ambiente-area-temas").textContent.split(" · ").forEach((topic, index) => {
                const item = document.createElement("li");
                const button = document.createElement("button");
                button.type = "button";
                button.dataset.ambienteTema = topic;
                const number = document.createElement("span");
                number.textContent = String(index + 1).padStart(2, "0");
                number.setAttribute("aria-hidden", "true");
                const name = document.createElement("strong");
                name.textContent = topic;
                const arrow = document.createElement("span");
                arrow.textContent = "→";
                arrow.setAttribute("aria-hidden", "true");
                button.append(number, name, arrow);
                button.addEventListener("click", () => showTopic(topic));
                item.append(button);
                list.append(item);
            });
            body.replaceChildren(list);
            if (moveFocus) { title.tabIndex = -1; title.focus({ preventScroll: true }); }
        };
        document.querySelectorAll("#ambiente .selva-ambiente-explorar").forEach((button) => {
            button.addEventListener("click", () => {
                if (environmentModal.open) return;
                restore();
                openingButton = button;
                activeArea = button.closest(".selva-ambiente-area");
                environmentModal.style.setProperty("--ambiente-acento", getComputedStyle(activeArea).getPropertyValue("--ambiente-acento"));
                environmentModal.querySelector(".selva-ambiente-modal-visual").replaceChildren(activeArea.querySelector("svg").cloneNode(true));
                showArea();
                previousOverflow = document.body.style.overflow;
                restorePending = true;
                document.body.style.overflow = "hidden";
                environmentModal.showModal();
                environmentModal.scrollTop = 0;
                environmentModal.querySelector(".selva-ambiente-cerrar").focus({ preventScroll: true });
            });
        });
        back.addEventListener("click", () => showArea(true));
        environmentModal.querySelector(".selva-ambiente-cerrar").addEventListener("click", close);
        environmentModal.addEventListener("close", restore);
        environmentModal.addEventListener("cancel", (event) => { event.preventDefault(); close(); });
        let backdropDown = false;
        const outside = (event) => {
            const bounds = environmentModal.getBoundingClientRect();
            return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
        };
        environmentModal.addEventListener("pointerdown", (event) => { backdropDown = event.target === environmentModal && outside(event); });
        environmentModal.addEventListener("click", (event) => {
            if (backdropDown && event.target === environmentModal && outside(event)) close();
            backdropDown = false;
        });
        environmentModal.addEventListener("keydown", (event) => {
            if (event.key !== "Tab") return;
            const buttons = [...environmentModal.querySelectorAll("button")].filter((node) => node.getClientRects().length);
            const first = buttons[0];
            const last = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        });
    }

    const storyModal = document.querySelector("#selva-historia-modal");
    if (storyModal) {
        let openingCard;
        let previousOverflow;
        let restorePending = false;
        const restoreStoryFocus = () => {
            if (!restorePending || storyModal.open) return;
            restorePending = false;
            document.body.style.overflow = previousOverflow;
            openingCard?.focus({ preventScroll: true });
        };
        const closeStory = () => { storyModal.close(); restoreStoryFocus(); };
        document.querySelectorAll("#sabias-que .selva-flip-card").forEach((card) => {
            const button = card.querySelector(".selva-flip-toggle");
            const content = card.querySelector(".selva-flip-back");
            if (!button || !content) return;
            content.hidden = true;
            button.removeAttribute("aria-pressed");
            button.setAttribute("aria-haspopup", "dialog");
            button.setAttribute("aria-controls", "selva-historia-modal");
            const cue = document.createElement("span");
            cue.className = "selva-historia-descubrir";
            cue.textContent = "Descubrir →";
            cue.setAttribute("aria-hidden", "true");
            button.querySelector(".selva-flip-frente-texto").append(cue);
            button.addEventListener("click", () => {
                if (storyModal.open) return;
                restoreStoryFocus();
                openingCard = button;
                storyModal.querySelector(".selva-historia-categoria").textContent = button.querySelector(".selva-flip-categoria").textContent;
                storyModal.querySelector("#selva-historia-titulo").textContent = button.querySelector(".selva-flip-frente-titulo").textContent;
                const visual = storyModal.querySelector(".selva-historia-visual");
                const photo = button.querySelector("img").cloneNode(true);
                photo.removeAttribute("loading");
                photo.removeAttribute("sizes");
                visual.replaceChildren(photo);
                const credit = button.querySelector(".selva-curiosidad-foto-credito, .selva-curiosidad-credito");
                if (credit) visual.append(credit.cloneNode(true));
                // Clonar mantiene texto, etiquetas, enlaces y todos los atributos de las fuentes.
                const body = storyModal.querySelector(".selva-historia-cuerpo");
                body.replaceChildren(...[...content.childNodes].map((node) => node.cloneNode(true)));
                previousOverflow = document.body.style.overflow;
                restorePending = true;
                document.body.style.overflow = "hidden";
                storyModal.showModal();
                storyModal.scrollTop = 0;
                storyModal.querySelector(".selva-historia-cerrar").focus({ preventScroll: true });
            });
        });
        storyModal.querySelector(".selva-historia-cerrar").addEventListener("click", closeStory);
        storyModal.addEventListener("cancel", (event) => { event.preventDefault(); closeStory(); });
        storyModal.addEventListener("close", restoreStoryFocus);
        let backdropDown = false;
        const outside = (event) => {
            const rect = storyModal.getBoundingClientRect();
            return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
        };
        storyModal.addEventListener("pointerdown", (event) => { backdropDown = event.target === storyModal && outside(event); });
        storyModal.addEventListener("click", (event) => {
            if (backdropDown && event.target === storyModal && outside(event)) closeStory();
            backdropDown = false;
        });
        storyModal.addEventListener("keydown", (event) => {
            if (event.key !== "Tab") return;
            const focusable = [...storyModal.querySelectorAll("button, a[href]")].filter((node) => node.getClientRects().length);
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        });
    }

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

    const ecosystemHotspots = [...document.querySelectorAll(".selva-explora-hotspot")];
    const setHotspotState = (hotspot, isOpen) => {
        hotspot.setAttribute("aria-expanded", String(isOpen));
        document.getElementById(hotspot.getAttribute("aria-controls"))
            ?.setAttribute("aria-hidden", String(!isOpen));
    };

    ecosystemHotspots.forEach((hotspot) => {
        hotspot.addEventListener("focus", () => {
            ecosystemHotspots.forEach((otherHotspot) => {
                setHotspotState(otherHotspot, otherHotspot === hotspot);
            });
        });

        hotspot.addEventListener("blur", () => {
            setHotspotState(hotspot, false);
        });

        hotspot.addEventListener("click", (event) => {
            const isOpen = hotspot.getAttribute("aria-expanded") === "true";
            const shouldOpen = event.detail > 0 || !isOpen;
            ecosystemHotspots.forEach((otherHotspot) => {
                setHotspotState(otherHotspot, otherHotspot === hotspot && shouldOpen);
            });
        });

        hotspot.addEventListener("pointerleave", () => {
            if (document.activeElement !== hotspot) {
                setHotspotState(hotspot, false);
            }
        });

        hotspot.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                setHotspotState(hotspot, false);
                hotspot.blur();
            }
        });
    });

    const revealItems = document.querySelectorAll(".reveal");

    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        revealItems.forEach((item) => revealObserver.observe(item));
    } else {
        revealItems.forEach((item) => item.classList.add("is-visible"));
    }

    const backToTop = document.querySelector(".selva-volver-arriba");
    if (backToTop) {
        const footer = document.querySelector("footer");
        const updateBackToTop = () => {
            const footerBounds = footer?.getBoundingClientRect();
            const footerIsVisible = footerBounds
                ? footerBounds.top < window.innerHeight && footerBounds.bottom > 0
                : false;
            backToTop.classList.toggle("is-visible", window.scrollY > 360 && !footerIsVisible);
        };

        window.addEventListener("scroll", updateBackToTop, { passive: true });
        updateBackToTop();

        backToTop.addEventListener("click", () => {
            const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "auto"
                : "smooth";
            window.scrollTo({ top: 0, behavior });
        });
    }
});
