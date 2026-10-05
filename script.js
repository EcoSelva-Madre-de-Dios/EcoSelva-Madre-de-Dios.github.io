document.addEventListener("DOMContentLoaded", () => {
    const researchVideo = document.querySelector(".selva-investigaciones-video");
    if (researchVideo) {
        const section = researchVideo.closest("#investigaciones");
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const connection = navigator.connection;
        let inView = false;
        let loaded = false;
        let attempt = 0;
        const updateVideo = () => {
            const token = ++attempt;
            const allowed = inView && !document.hidden && !reducedMotion.matches && !connection?.saveData && !["slow-2g", "2g"].includes(connection?.effectiveType);
            if (!allowed) {
                researchVideo.pause();
                section.classList.remove("is-video-playing");
                return;
            }
            if (!loaded) {
                researchVideo.querySelectorAll("source[data-src]").forEach(source => { source.src = source.dataset.src; });
                researchVideo.muted = true;
                researchVideo.load();
                loaded = true;
            }
            researchVideo.play().then(() => {
                if (token === attempt && !researchVideo.paused) section.classList.add("is-video-playing");
            }).catch(() => section.classList.remove("is-video-playing"));
        };
        researchVideo.addEventListener("error", () => section.classList.remove("is-video-playing"));
        researchVideo.addEventListener("waiting", () => section.classList.remove("is-video-playing"));
        researchVideo.addEventListener("playing", () => {
            if (!reducedMotion.matches && inView && !document.hidden) section.classList.add("is-video-playing");
        });
        reducedMotion.addEventListener("change", updateVideo);
        connection?.addEventListener("change", updateVideo);
        document.addEventListener("visibilitychange", updateVideo);
        if ("IntersectionObserver" in window) {
            new IntersectionObserver(entries => { inView = entries[0].isIntersecting; updateVideo(); }, { threshold: 0.05 }).observe(section);
        } else { inView = true; updateVideo(); }
    }

    const currentYear = document.querySelector("#selva-anio-actual");
    if (currentYear) {
        currentYear.textContent = String(new Date().getFullYear());
    }

    const navbar = document.querySelector(".navbar");
    if (navbar) {
        const navigationLinks = [...navbar.querySelectorAll('a[href^="#"]')];
        const menuToggle = document.querySelector("#menu");
        const menuButton = document.querySelector('label[for="menu"]');
        const dropdown = navbar.querySelector(".selva-nav-desplegable details");
        const dropdownSummary = dropdown?.querySelector("summary");
        const menuBar = navbar.closest(".menu");

        const updateMenuButton = () => menuButton?.setAttribute("aria-expanded", String(menuToggle?.checked || false));
        menuToggle?.addEventListener("change", updateMenuButton);
        menuButton?.addEventListener("keydown", event => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            menuToggle.checked = !menuToggle.checked;
            updateMenuButton();
        });
        menuBar?.addEventListener("keydown", event => {
            if (event.key !== "Escape") return;
            if (dropdown?.open) dropdown.open = false;
            if (menuToggle?.checked) {
                menuToggle.checked = false;
                updateMenuButton();
                menuButton?.focus({ preventScroll: true });
            }
        });
        updateMenuButton();

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
                    updateMenuButton();
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
        const photoSizes = { mamiferos: [900, 600], aves: [960, 1021], reptiles: [960, 622], anfibios: [321, 324] };
        Object.entries(faunaGroups).forEach(([key, group]) => {
            [group.photoWidth, group.photoHeight] = photoSizes[key];
        });
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
            faunaModal.scrollTop = 0;
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
                    photo.width = group.photoWidth;
                    photo.height = group.photoHeight;
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
                faunaModal.scrollTop = 0;
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
                photo.width = group.photoWidth;
                photo.height = group.photoHeight;
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

    document.querySelectorAll(".selva-introduccion-accesos a").forEach(access => {
        let microTimer;
        access.addEventListener("pointerdown", event => {
            if (event.pointerType !== "touch") return;
            clearTimeout(microTimer); access.classList.remove("is-micro-active");
            void access.offsetWidth; access.classList.add("is-micro-active");
            microTimer = setTimeout(() => access.classList.remove("is-micro-active"), 2200);
        });
    });

    const territory = document.querySelector(".selva-territorio-layout");
    if (territory) {
        let exploreTopic = null, pendingTopic = null;
        const initializeTerritory = () => {
        const topics = JSON.parse(document.getElementById("selva-territorio-datos").textContent);
        const forestData = JSON.parse(document.getElementById("selva-territorio-cobertura-datos")?.textContent || '{"categories":[],"topics":{}}');
        Object.assign(topics, forestData.topics);
        const forestDescriptions = JSON.parse(document.getElementById("selva-territorio-descripciones")?.textContent || '{"categorias":{}}');
        const forestCategories = forestData.categories.filter(category => !["R", "L/Co"].includes(category.codigo_original));
        const svg = territory.querySelector(".selva-territorio-svg");
        const canvas = territory.querySelector(".selva-territorio-canvas");
        const scenes = [...svg.querySelectorAll("[data-territorio-scene]")];
        const features = [...svg.querySelectorAll("[data-mapa-feature]")];
        const tabs = [...document.querySelectorAll("[data-territorio-modo]")];
        const options = territory.querySelector(".selva-territorio-opciones");
        const card = territory.querySelector(".selva-territorio-ficha");
        const legend = territory.querySelector(".selva-territorio-leyenda");
        const tooltip = territory.querySelector(".selva-territorio-tooltip");
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
        const lectura = JSON.parse(document.getElementById("territorio-lectura-datos").textContent);
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
                const response = await fetch("datos/territorio/capas-adicionales.svg");
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
            if (input.checked) enabledLayers.add(input.dataset.territorioCapa);
            else enabledLayers.delete(input.dataset.territorioCapa);
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
            tabs.forEach(tab => {
                const selected = tab.dataset.territorioModo === mode;
                tab.setAttribute("aria-selected", String(selected)); tab.tabIndex = selected ? 0 : -1;
                if (selected) { territory.querySelector("#territorio-panel").setAttribute("aria-labelledby", tab.id); if (moveFocus) tab.focus({ preventScroll: true }); }
            });
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
        tabs.forEach((tab, index) => {
            tab.addEventListener("click", () => { if (activeMode !== tab.dataset.territorioModo) setMode(tab.dataset.territorioModo); });
            tab.addEventListener("keydown", event => {
                const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
                if (next !== undefined) { event.preventDefault(); setMode(tabs[next].dataset.territorioModo, true); }
            });
        });
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
            setMode(topics[key].mode);
            select(key);
            territory.scrollIntoView({behavior: reducedMotion.matches ? "instant" : "smooth", block: "start"});
            card.querySelector(".selva-territorio-ficha-volver")?.focus({preventScroll: true});
        };
        setMode("rios", false, true);
        };

        const host = territory.querySelector("[data-territorio-map-src]");
        const canvas = territory.querySelector(".selva-territorio-canvas");
        const controls = [...document.querySelectorAll("[data-territorio-modo]"), ...territory.querySelectorAll("[data-territorio-zoom], #territorio-provincias, [data-territorio-capa], [data-territorio-overlay-toggle]")];
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
                const response = await fetch(host.dataset.territorioMapSrc);
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
            button.disabled = false;
            button.addEventListener("click", () => {
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
