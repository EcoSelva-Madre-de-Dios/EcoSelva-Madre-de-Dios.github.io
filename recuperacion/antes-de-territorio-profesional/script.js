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
                else if (selectedKey && activeMode !== "bosques") labelFeature(selectedKey);
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
            if (key) labelFeature(key, event);
            else if (selectedKey && activeMode !== "bosques") labelFeature(selectedKey);
            else tooltip.hidden = true;
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
            helper.lastChild.textContent = mode === "bosques" ? "Explora los ambientes del panel" : "Haz clic en el mapa para explorar";
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
