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
            const panel = document.getElementById(activeTab.getAttribute("aria-controls"));
            panel?.dispatchEvent(new CustomEvent('eco:panelopen', { bubbles: true }));
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

    // Las cifras de Fauna permanecen visibles con su valor documental desde el inicio.
    const faunaModal = document.querySelector("#selva-fauna-modal");
    if (faunaModal) {
        let faunaGroups, activeGroup, back;
        const body = faunaModal.querySelector(".selva-fauna-modal-cuerpo");
        const title = faunaModal.querySelector("#selva-fauna-modal-titulo");
        window.ecoDialog.register(faunaModal, { closeSelector: '.selva-fauna-modal-cerrar' });
        const element = (tag, text, className) => {
            const node = document.createElement(tag);
            if (text) node.textContent = text;
            if (className) node.className = className;
            return node;
        };
        const link = (text, url) => {
            const node = element("a", text); node.href = url;
            node.target = "_blank"; node.rel = "noopener noreferrer";
            return node;
        };
        const references = entries => {
            const footer = element("div", null, "eco-block-sources");
            const list = element("ol");
            [...new Map(entries.map(([label, url]) => [url, [label, url]])).values()].forEach(([label, url]) => {
                const item = element("li"); item.append(link(label, url)); list.append(item);
            });
            footer.append(element("h4", "Fuentes de los registros"), list); return footer;
        };
        const showGroup = (focusTitle = false) => {
            const group = faunaGroups[activeGroup]; body.replaceChildren();
            title.textContent = `${group.name}: especies documentadas`;
            if (back) back.hidden = true;
            const list = element("ul", null, "selva-fauna-especies");
            group.species.forEach(species => {
                const item = element("li"), content = element("div");
                const illustration = document.querySelector(`[data-fauna-categoria="${activeGroup}"] .selva-fauna-icono`).cloneNode(true);
                item.append(illustration);
                content.append(element("h4", species[0]), element("em", species[1]), element("p", `Registro: ${species[2] || group.place}.`));
                const button = element("button", `Ver ${species[0]} →`, "selva-fauna-conocer");
                button.type = "button"; button.setAttribute("aria-label", `Ver ficha de ${species[0]}`);
                button.addEventListener("click", () => showSpecies(species)); content.append(button); item.append(content); list.append(item);
            });
            body.append(list, references(group.species.map(species => [species[4] || group.reference, species[3] || group.source])));
            if (focusTitle) { title.tabIndex = -1; title.focus({ preventScroll: true }); faunaModal.scrollTop = 0; }
        };
        const showSpecies = species => {
            const group = faunaGroups[activeGroup]; body.replaceChildren(); title.textContent = species[0];
            if (!back) {
                back = element("button", null, "selva-fauna-volver"); back.type = "button";
                back.addEventListener("click", () => showGroup(true)); title.before(back);
            }
            back.hidden = false; back.textContent = `← Volver a ${group.name.toLowerCase()}`;
            body.append(element("em", species[1], "selva-fauna-cientifico"));
            const record = element("dl", null, "selva-fauna-ficha");
            record.append(element("dt", "Dónde se ha registrado"), element("dd", species[2] || group.place));
            body.append(record, references([[species[4] || group.reference, species[3] || group.source]]));
            if (species !== group.species[0]) body.append(element("p", `La fotografía de referencia corresponde a ${group.species[0][0].toLowerCase()}.`, "selva-fauna-ficha-revision"));
            back.focus({ preventScroll: true }); faunaModal.scrollTop = 0;
        };
        const validGroup = group => group && typeof group.name === 'string' && group.name.trim()
            && typeof group.place === 'string' && typeof group.source === 'string' && /^https:\/\//.test(group.source)
            && typeof group.photo === 'string' && Number.isFinite(group.photoWidth) && Number.isFinite(group.photoHeight)
            && Array.isArray(group.species) && group.species.length > 0
            && group.species.every(species => Array.isArray(species) && species.slice(0, 2).length === 2
                && species.slice(0, 2).every(value => typeof value === 'string' && value.trim()));
        const openGroup = async button => {
            if (faunaModal.open) return;
            button.disabled = true; button.setAttribute("aria-busy", "true");
            try {
                if (!faunaGroups) {
                    const response = await fetch(window.ecoResourceURL("datos/fauna/fichas.json"));
                    if (!response.ok) throw new Error("No se pudo cargar Fauna.");
                    faunaGroups = await response.json();
                }
                const group = faunaGroups[button.dataset.faunaExplorar];
                if (!validGroup(group)) throw new Error('La ficha no contiene registros completos.');
                if (document.querySelector("dialog[open]")) return;
                activeGroup = button.dataset.faunaExplorar;
                button.parentElement.querySelector(".eco-document-error")?.remove();
                faunaModal.querySelector(".selva-fauna-modal-categoria").textContent = "Registros locales";
                const photo = faunaModal.querySelector("[data-fauna-photo]");
                photo.src = group.photo; photo.alt = `${group.species[0][0]} (${group.species[0][1]}). ${group.photoPlace}.`;
                photo.width = group.photoWidth; photo.height = group.photoHeight;
                faunaModal.querySelector(".selva-fauna-foto-credito").replaceChildren(
                    document.createTextNode(`Foto: ${group.author} · `), link("Wikimedia Commons", group.photoSource),
                    document.createTextNode(" · "), link(group.license, group.licenseUrl), document.createTextNode(`. ${group.photoPlace}.`));
                showGroup(); window.ecoDialog.open(faunaModal, button);
            } catch {
                faunaGroups = undefined;
                const feedback = element("p", "No se pudo cargar una ficha completa. Puedes volver a intentarlo.", "eco-document-error");
                feedback.setAttribute("role", "status"); button.parentElement.querySelector(".eco-document-error")?.remove();
                button.parentElement.append(feedback);
            } finally { button.disabled = false; button.removeAttribute("aria-busy"); }
        };
        const prepareFaunaActions = () => {
            const panel = document.getElementById('selva-biodiversidad-panel-fauna');
            if (panel.hidden) return;
            panel.querySelectorAll('[data-fauna-actions]').forEach(host => {
                if (host.querySelector('button')) return;
                const button = element('button', host.dataset.faunaActionLabel + ' →', 'selva-fauna-explorar');
                button.type = 'button'; button.dataset.faunaExplorar = host.dataset.faunaActions;
                button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-controls', faunaModal.id);
                button.addEventListener('click', () => openGroup(button)); host.append(button);
            });
        };
        biodiversity.addEventListener('eco:panelopen', prepareFaunaActions);
        prepareFaunaActions();
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
            cue.textContent = {
                Flora: "Conocer la castaña →", Fauna: "Leer sobre el jaguar →",
                Ecosistemas: "Distinguir los ambientes →", Agua: "Comprender las cochas →",
                Ambiente: "Reconocer las presiones →", Conservación: "Conocer el uso sostenible →"
            }[button.querySelector(".selva-flip-categoria").textContent] || "Leer esta historia →";
            cue.setAttribute("aria-hidden", "true");
            button.querySelector(".selva-flip-frente-texto").append(cue);
            button.addEventListener("click", () => {
                if (storyModal.open || !content.textContent.trim()) return;
                storyModal.querySelector(".selva-historia-categoria").textContent = button.querySelector(".selva-flip-categoria").textContent;
                storyModal.querySelector("#selva-historia-titulo").textContent = button.querySelector(".selva-flip-frente-titulo").textContent;
                const visual = storyModal.querySelector(".selva-historia-visual");
                const illustration = button.querySelector("img, .eco-story-art");
                if (!illustration) return;
                const picture = illustration.cloneNode(true);
                picture.removeAttribute("sizes");
                visual.replaceChildren(picture);
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
