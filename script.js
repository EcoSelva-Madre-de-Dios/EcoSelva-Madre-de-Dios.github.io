document.addEventListener("DOMContentLoaded", () => {
    const followLegacyHash = () => {
        let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
        const target = document.getElementById(id);
        if (target?.dataset.ecoDestino) location.replace(target.dataset.ecoDestino);
    };
    followLegacyHash(); window.addEventListener("hashchange", followLegacyHash);
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
        const dropdowns = [...navbar.querySelectorAll(".selva-nav-desplegable details")];
        const dropdown = dropdowns.find(item => item.querySelector('a[href="#quienes-somos"]'));
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
            dropdowns.forEach(item => { item.open = false; });
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

        [...navbar.querySelectorAll("a[href]")].forEach((link) => {
            link.addEventListener("click", () => {
                setActiveNavigationLink(link);
                dropdowns.forEach(item => { item.open = false; });
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
    const biodiversity = document.querySelector("#biodiversidad");
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
        let faunaGroups;
        const body = faunaModal.querySelector(".selva-fauna-modal-cuerpo");
        const title = faunaModal.querySelector("#selva-fauna-modal-titulo");
        const back = faunaModal.querySelector(".selva-fauna-volver");
        let activeGroup;
        window.ecoDialog.register(faunaModal, { closeSelector: '.selva-fauna-modal-cerrar' });
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
            title.textContent = "Fauna documentada";
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
            button.addEventListener("click", async () => {
                if (faunaModal.open) return;
                button.disabled = true; button.setAttribute("aria-busy", "true");
                try {
                    if (!faunaGroups) {
                        const response = await fetch(window.ecoResourceURL("datos/fauna/fichas.json"));
                        if (!response.ok) throw new Error("No se pudo cargar Fauna.");
                        faunaGroups = await response.json();
                    }
                } catch {
                    const feedback = element("p", "No se pudo cargar la ficha. Reintenta o consulta la fuente enlazada debajo de las cifras.", "eco-document-error");
                    feedback.setAttribute("role", "status");
                    button.parentElement.querySelector(".eco-document-error")?.remove();
                    button.parentElement.append(feedback); return;
                } finally { button.disabled = false; button.removeAttribute("aria-busy"); }
                if (document.querySelector("dialog[open]")) return;
                activeGroup = button.dataset.faunaExplorar;
                const group = faunaGroups[activeGroup];
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
                window.ecoDialog.open(faunaModal, button);
            });
        });
        back.addEventListener("click", () => showGroup(true));

    }

    const storyModal = document.querySelector("#selva-historia-modal");
    if (storyModal) {
        window.ecoDialog.register(storyModal, { closeSelector: '.selva-historia-cerrar' });
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
                window.ecoDialog.open(storyModal, button);
            });
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
