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

    document.querySelectorAll(".selva-flip-card").forEach((card) => {
        const toggle = card.querySelector(".selva-flip-toggle");
        if (!toggle) {
            return;
        }

        toggle.addEventListener("click", () => {
            const isFlipped = card.classList.toggle("is-flipped");
            toggle.setAttribute("aria-pressed", String(isFlipped));
        });
    });

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
