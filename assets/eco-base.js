/* dialogos.js */
/* Diálogos nativos: cierre, fondo y retorno de foco compartidos. */
(() => {
    'use strict';
    const records = new WeakMap();
    const finish = dialog => {
        const record = records.get(dialog);
        if (!record?.active || dialog.open) return;
        record.active = false;
        record.outsideDown = false;
        const origin = record.origin;
        record.origin = null;
        record.options.onClose?.();
        const current = [...document.querySelectorAll('dialog[open]')].at(-1);
        if (record.restoreFocus && origin?.isConnected && origin.getClientRects().length && (!current || current.contains(origin))) {
            origin.focus({ preventScroll: true });
            window.scrollTo({ left: record.scrollX, top: record.scrollY, behavior: 'instant' });
        }
    };
    const close = (dialog, { restoreFocus = true } = {}) => {
        const record = records.get(dialog);
        if (record) record.restoreFocus = restoreFocus;
        if (dialog.open) dialog.close();
        finish(dialog);
    };
    const register = (dialog, options = {}) => {
        if (records.has(dialog)) {
            Object.assign(records.get(dialog).options, options);
            return dialog;
        }
        const record = { options, active: false, outsideDown: false };
        records.set(dialog, record);
        const outside = event => {
            const bounds = dialog.getBoundingClientRect();
            return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
        };
        dialog.addEventListener('pointerdown', event => {
            record.outsideDown = event.target === dialog && outside(event);
        });
        dialog.addEventListener('click', event => {
            const button = event.target.closest(record.options.closeSelector || '[data-eco-dialog-close]');
            if ((button && dialog.contains(button)) || (record.outsideDown && event.target === dialog && outside(event))) close(dialog);
            record.outsideDown = false;
        });
        dialog.addEventListener('cancel', event => { event.preventDefault(); close(dialog); });
        dialog.addEventListener('close', () => finish(dialog));
        return dialog;
    };
    const open = (dialog, origin = document.activeElement) => {
        if (dialog.open || typeof dialog.showModal !== 'function') return false;
        register(dialog);
        dialog.querySelectorAll('template[data-eco-controls]').forEach(template => template.replaceWith(template.content));
        const record = records.get(dialog);
        record.origin = origin;
        record.scrollX = window.scrollX; record.scrollY = window.scrollY;
        record.restoreFocus = true;
        record.active = true;
        dialog.showModal();
        dialog.scrollTop = 0;
        dialog.dispatchEvent(new CustomEvent('eco:dialogopen', { bubbles: true }));
        dialog.querySelector(record.options.closeSelector || '[data-eco-dialog-close]')?.focus({ preventScroll: true });
        return true;
    };
    window.ecoDialog = { register, open, close };
})();

/* script.js */
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

/* conoce.js */
/* Mejora progresiva de los detalles del mini atlas; no interviene en el mapa. */
document.addEventListener("DOMContentLoaded", () => {
    const section = document.getElementById("conoce-madre-de-dios");
    const modal = document.getElementById("conoce-modal");
    if (!section || !modal || typeof modal.showModal !== "function") return;
    const title = modal.querySelector("#conoce-modal-titulo");
    const content = modal.querySelector(".conoce-modal-contenido");
    window.ecoDialog.register(modal, { closeSelector: '.conoce-modal-cerrar' });
    section.querySelectorAll(".conoce-fuentes").forEach(details => {
        const summary = details.querySelector("summary");
        summary.setAttribute("aria-haspopup", "dialog");
        summary.setAttribute("aria-controls", modal.id);
        summary.addEventListener("click", event => {
            if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.button) return;
            if (document.querySelector("dialog[open]")) return;
            event.preventDefault();
            title.textContent = details.dataset.conoceTitulo;
            content.replaceChildren(...[...details.querySelector(".conoce-detalle").childNodes].map(node => node.cloneNode(true)));
            modal.dataset.conoceTipo = 'fuentes';
            window.ecoDialog.open(modal, summary);
        });
    });
    // Conserva el acceso directo a fuentes y fichas; los detalles son nativos sin JS.
    const reveal = hash => {
        let target;
        try { target = document.getElementById(decodeURIComponent(hash.slice(1))); }
        catch { return; }
        if (!target || !section.contains(target)) return;
        if (target.matches(".conoce-fuentes, .conoce-provincia")) target.open = true;
    };
    reveal(location.hash);
    window.addEventListener("hashchange", () => reveal(location.hash));
});

/* navegacion.js */
/* El menú común funciona también como desplegable nativo sin JavaScript. */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.eco-global-menu').forEach(menu => {
        const summary = menu.querySelector('summary');
        menu.addEventListener('keydown', event => {
            if (event.key === 'Escape' && menu.open) {
                event.preventDefault(); menu.open = false; summary.focus();
            }
        });
        menu.addEventListener('click', event => {
            if (event.target.closest('a[href]')) menu.open = false;
        });
        document.addEventListener('click', event => { if (!menu.contains(event.target)) menu.open = false; });
    });
});

/* cartografia.js */
/* Presentación cartográfica compartida; no altera geometrías ni atributos. */
(() => {
  'use strict';
  const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const labels = (svg, candidates, obstacles = []) => {
    const matrix = svg.getScreenCTM();
    if (!matrix?.a) return;
    const ratio = 1 / matrix.a;
    const viewport = svg.getBoundingClientRect();
    const occupied = obstacles.map(el => el.getBoundingClientRect());
    [...candidates].sort((a, b) => b.priority - a.priority).forEach(item => {
      const { text, group = text, anchor } = item;
      group.style.display = item.visible === false ? 'none' : '';
      group.dataset.atlasVisible = 'false';
      group.setAttribute('aria-hidden', 'true');
      if (item.visible === false) return;
      text.classList.add('eco-atlas-label');
      text.style.fontSize = 'var(--text-note)';
      const noteSize = parseFloat(getComputedStyle(text).fontSize) || 13;
      text.style.fontSize = noteSize * ratio + 'px';
      text.style.strokeWidth = 2.5 * ratio + 'px';
      text.setAttribute('text-anchor', 'middle');
      const shifts = item.offsets || [[0, 0], [0, -16], [0, 16], [20, -10], [-20, 10]];
      let accepted = false;
      for (const [dx, dy] of shifts) {
        text.setAttribute('x', anchor.x + dx * ratio);
        text.setAttribute('y', anchor.y + dy * ratio);
        const r = text.getBoundingClientRect();
        const box = {left:r.left-4, right:r.right+4, top:r.top-3, bottom:r.bottom+3};
        if (box.left < viewport.left + 8 || box.right > viewport.right - 8 || box.top < viewport.top + 8 || box.bottom > viewport.bottom - 8 || occupied.some(other => overlaps(box, other))) continue;
        occupied.push(box); accepted = true; break;
      }
      if (!accepted) group.style.display = 'none';
      group.dataset.atlasVisible = String(accepted);
    });
  };
  const scale = (svg, element, metresPerUnit) => {
    const matrix = svg.getScreenCTM();
    if (!matrix?.a || !Number.isFinite(metresPerUnit) || metresPerUnit <= 0) return;
    const target = Math.min(120, svg.getBoundingClientRect().width * .28);
    const choices = [1, 2, 5, 10, 20, 25, 50, 100, 150, 200];
    const km = choices.filter(k => k * 1000 / metresPerUnit * matrix.a <= target).at(-1) || 1;
    element.querySelector('i').style.width = (km * 1000 / metresPerUnit * matrix.a) + 'px';
    element.querySelector('.eco-atlas-scale-value, .selva-territorio-escala-valor').textContent = km + ' km';
    element.dataset.metresPerUnit = metresPerUnit;
    element.dataset.km = km;
  };
  window.ecoAtlas = { labels, scale };
})();

/* ecoselva.js */
/* Componentes progresivos compartidos; las funciones originales conservan su lógica. */
const ecoAssetsBase = new URL(document.currentScript.src.includes('/assets/') ? '../' : '.', document.currentScript.src);
window.ecoResourceURL = resource => {
    const url = new URL(resource, ecoAssetsBase);
    const version = document.documentElement.dataset.ecoVersion;
    if (version && url.origin === location.origin) url.searchParams.set('v', version);
    return url.href;
};
document.addEventListener('DOMContentLoaded', () => {
    const node = (tag, className, text) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    };
    const icon = name => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'eco-icon'); svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('focusable', 'false');
        const use = document.createElementNS(svg.namespaceURI, 'use');
        use.setAttribute('href', new URL('images/ecoselva-iconos.svg', ecoAssetsBase).href + '#' + name);
        svg.append(use); return svg;
    };
    const createDialog = (id, className, title) => {
        const dialog = node('dialog', className); dialog.id = id;
        dialog.setAttribute('aria-labelledby', id + '-title');
        const header = node('header', 'eco-modal-barra');
        const heading = node('h2', '', title); heading.id = id + '-title';
        const close = node('button', 'eco-overlay-close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Cerrar ventana');
        header.append(heading, close); dialog.append(header, node('div', 'eco-overlay-body')); document.body.append(dialog);
        window.ecoDialog.register(dialog, {
            closeSelector: '.eco-overlay-close',
            onClose: () => dialog.querySelector('iframe')?.remove()
        });
        return dialog;
    };
    const open = (dialog, origin) => window.ecoDialog.open(dialog, origin);
    const clone = source => {
        const copy = source.cloneNode(true); copy.removeAttribute('id');
        copy.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
        return copy;
    };
    const external = (url, label, className = 'eco-text-link') => {
        const a = node('a', className, label); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a;
    };
    let catalogPromise;
    const catalog = () => catalogPromise ||= fetch(window.ecoResourceURL('datos/fuentes.json'))
        .then(response => { if (!response.ok) throw new Error('No se pudo cargar la biblioteca.'); return response.json(); })
        .catch(error => { catalogPromise = null; throw error; });
    let documentViewer, contextViewer;
    const previewDocument = async trigger => {
        trigger.disabled = true; trigger.setAttribute('aria-busy', 'true');
        try {
            const model = await catalog(); const document = model.documentos.find(item => item.id === trigger.dataset.ecoDocument);
            if (!document) throw new Error('Documento fuera del catálogo.');
            const dialog = document.pdf
                ? (documentViewer ||= createDialog('eco-document-viewer', 'eco-editorial eco-document-viewer', 'Vista previa del documento'))
                : (contextViewer ||= createDialog('eco-context-viewer', 'eco-drawer eco-context-viewer', 'Contexto y fuente'));
            const body = dialog.querySelector('.eco-overlay-body'); body.replaceChildren();
            const layout = node('div', 'eco-document-layout');
            if (document.portada) {
                const figure = node('figure', 'eco-document-cover'); const image = node('img');
                image.src = new URL(document.portada, ecoAssetsBase).href; image.width = document.ancho; image.height = document.alto;
                image.alt = 'Primera página de ' + document.titulo; image.loading = 'lazy'; image.decoding = 'async';
                figure.append(image, node('figcaption', '', 'Primera página del original · ' + document.autor)); layout.append(figure);
            }
            const details = node('section', 'eco-document-details');
            details.append(node('p', 'eco-eyebrow', document.tipo + ' · ' + (document.anio || 'Sin fecha indicada')), node('h3', '', document.titulo), node('p', 'eco-card-secondary', document.autor));
            const metadata = node('dl', 'eco-document-metadata');
            [['Ámbito', document.alcance], ['Páginas', document.paginas], ['Tamaño', document.bytes ? (document.bytes / 1000000).toFixed(1).replace('.', ',') + ' MB' : null]].forEach(([key, value]) => {
                if (value !== null && value !== undefined) metadata.append(node('dt', '', key), node('dd', '', String(value)));
            });
            if (document.fecha_documento) metadata.append(node('dt', '', 'Fecha o periodo del documento'), node('dd', '', document.fecha_documento));
            details.append(metadata, node('h4', '', 'Por qué lo usamos'), node('p', '', document.uso));
            const actions = node('div', 'eco-card-actions');
            actions.append(external(document.pdf || document.url, document.pdf ? 'PDF original / descarga ↗' : 'Consultar fuente original ↗', 'eco-button'));
            const context = node('a', 'eco-text-link', 'Ver el contexto en EcoSelva →'); context.href = new URL(document.contexto, ecoAssetsBase).href; actions.append(context);
            if (document.contextos?.length > 1) {
                const contexts = node('details', 'eco-document-contexts');
                contexts.append(node('summary', '', 'Otros lugares donde citamos esta fuente'));
                const list = node('ul');
                document.contextos.filter(url => url !== document.contexto).forEach(url => {
                    const item = node('li'); const link = node('a', 'eco-text-link', url.startsWith('historia') ? 'Historia de Madre de Dios →' : url.startsWith('areas-protegidas') ? 'Áreas protegidas →' : 'Otra lectura de EcoSelva →');
                    link.href = new URL(url, ecoAssetsBase).href; item.append(link); list.append(item);
                });
                contexts.append(list); details.append(contexts);
            }
            details.append(actions);
            if (document.pdf && document.previsualizacion_pdf) {
                const load = node('button', 'eco-button eco-button-outline', 'Cargar PDF completo · ' + (document.bytes / 1000000).toFixed(1).replace('.', ',') + ' MB'); load.type = 'button';
                load.addEventListener('click', () => {
                    if (body.querySelector('iframe')) return;
                    const frame = node('iframe', 'eco-pdf-frame'); frame.title = 'PDF original: ' + document.titulo; frame.src = document.pdf; frame.tabIndex = -1;
                    const reader = node('section', 'eco-pdf-reader');
                    const fallback = node('p', 'eco-document-note', 'Visor del documento original · ');
                    fallback.append(external(document.pdf, 'Abrir / descargar ↗'));
                    reader.append(fallback, frame); body.append(reader); load.disabled = true; load.textContent = 'PDF solicitado · también puedes abrir el original';
                    dialog.scrollTop += reader.getBoundingClientRect().top - dialog.getBoundingClientRect().top - dialog.querySelector('.eco-modal-barra').offsetHeight - 16;
                }); details.append(load, node('p', 'eco-document-note', 'Si tu navegador no muestra el PDF, abre el original. Allí puedes leerlo y descargarlo.'));
            }
            layout.append(details); body.append(layout);
            trigger.disabled = false; open(dialog, trigger);
        } catch {
            const feedback = node('p', 'eco-document-error', 'No se pudo abrir la vista previa. Utiliza el enlace al documento original.'); feedback.setAttribute('role', 'status');
            trigger.parentElement.querySelector('.eco-document-error')?.remove(); trigger.parentElement.append(feedback);
        } finally { trigger.disabled = false; trigger.removeAttribute('aria-busy'); }
    };
    document.addEventListener('click', event => {
        const trigger = event.target.closest('[data-eco-document]'); if (trigger) previewDocument(trigger);
    });
    document.querySelectorAll('.ficha-indicador a[href^="#"]').forEach(link => {
        link.dataset.ecoRecord = link.hash; link.setAttribute('aria-haspopup', 'dialog');
    });
    document.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
        const trigger = event.target.closest('[data-eco-record],[data-eco-context]');
        if (!trigger) return;
        const id = (trigger.dataset.ecoRecord || trigger.dataset.ecoContext).replace(/^#/, '');
        const source = document.getElementById(id); if (!source) return;
        event.preventDefault();
        contextViewer ||= createDialog('eco-context-viewer', 'eco-drawer eco-context-viewer', 'Contexto y fuente');
        const content = contextViewer.querySelector('.eco-overlay-body'); content.replaceChildren();
        if (source.querySelector(':scope > summary')) content.append(node('h3', '', source.querySelector('summary').textContent));
        [...source.children].filter(element => element.tagName !== 'SUMMARY').forEach(element => content.append(clone(element)));
        open(contextViewer, trigger);
    }, true);
    const speciesBody = document.querySelector('.selva-fauna-modal-contenido');
    if (speciesBody) {
        const decorateSpecies = () => speciesBody.querySelectorAll('.selva-fauna-especies>li').forEach(card => { card.classList.add('eco-card'); card.dataset.ecoCard = 'species'; });
        new MutationObserver(decorateSpecies).observe(speciesBody, { childList: true, subtree: true }); decorateSpecies();
    }
    // El visor reutiliza el SVG original: no genera ni simplifica geometrías.
    document.querySelectorAll('[data-eco-map]').forEach(container => {
        const attach = () => {
            const svg = container.querySelector('svg'); if (!svg || container.querySelector('.eco-map-tools')) return;
            const original = svg.getAttribute('viewBox'); if (!original) return;
            const [x, y, width, height] = original.trim().split(/[\s,]+/).map(Number);
            if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return;
            let zoom = 1, centerX = x + width / 2, centerY = y + height / 2, drag;
            const controls = node('div', 'eco-map-tools'); controls.setAttribute('role', 'group'); controls.setAttribute('aria-label', 'Controles del mapa');
            const update = () => {
                centerX = Math.max(x + width / zoom / 2, Math.min(x + width - width / zoom / 2, centerX));
                centerY = Math.max(y + height / zoom / 2, Math.min(y + height - height / zoom / 2, centerY));
                svg.setAttribute('viewBox', zoom === 1 ? original : [centerX - width / zoom / 2, centerY - height / zoom / 2, width / zoom, height / zoom].join(' '));
                controls.querySelector('[data-eco-zoom=out]').disabled = zoom === 1;
                controls.querySelector('[data-eco-zoom=in]').disabled = zoom === 4;
                container.classList.toggle('eco-map-zoomed', zoom > 1);
                container.dispatchEvent(new CustomEvent('eco:mapview', { detail: { svg, zoom } }));
            };
            for (const [action, label, text] of [['in', 'Acercar mapa', '+'], ['out', 'Alejar mapa', '−'], ['reset', 'Restablecer vista', '↺']]) {
                const button = node('button', '', text); button.type = 'button'; button.dataset.ecoZoom = action; button.setAttribute('aria-label', label);
                button.addEventListener('click', () => { zoom = action === 'reset' ? 1 : Math.max(1, Math.min(4, zoom * (action === 'in' ? 1.5 : 1 / 1.5))); update(); }); controls.append(button);
            }
            container.append(controls); svg.setAttribute('tabindex', '0');
            const hint = node('p', 'eco-map-hint', 'Con zoom, arrastra el mapa o usa las flechas del teclado.'); hint.id = 'eco-map-hint-' + [...document.querySelectorAll('[data-eco-map]')].indexOf(container);
            container.insertAdjacentElement('afterend', hint); svg.setAttribute('aria-describedby', [svg.getAttribute('aria-describedby'), hint.id].filter(Boolean).join(' '));
            svg.addEventListener('keydown', event => {
                if (event.target !== svg || zoom === 1 || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
                event.preventDefault(); const step = .12 / zoom;
                centerX += (event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0) * width * step;
                centerY += (event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0) * height * step; update();
            });
            svg.addEventListener('pointerdown', event => { if (zoom > 1 && event.button === 0) drag = { startX: event.clientX, startY: event.clientY, centerX, centerY, moved: false, pointer: event.pointerId }; });
            svg.addEventListener('pointermove', event => {
                if (!drag || event.pointerId !== drag.pointer) return;
                const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
                if (!drag.moved && Math.hypot(dx, dy) < 6) return;
                drag.moved = true; svg.setPointerCapture(event.pointerId); const matrix = svg.getScreenCTM();
                centerX = drag.centerX - dx / matrix.a; centerY = drag.centerY - dy / matrix.a; update();
            });
            svg.addEventListener('click', event => { if (drag?.moved) { event.preventDefault(); event.stopImmediatePropagation(); } drag = null; }, true);
            svg.addEventListener('pointercancel', () => { drag = null; }); update();
        };
        new MutationObserver(attach).observe(container, { childList: true }); attach();
    });
    // Una galería mantiene las leyendas y créditos originales junto a cada imagen.
    const pictures = [...document.querySelectorAll('.ficha-foto,.ficha-ilustracion,.anp-portada,.anp-foto,.historia-documento,.conoce-localizador')].filter(figure => figure.querySelector('img'));
    let imageViewer, imageIndex = 0;
    const showImage = index => {
        imageIndex = (index + pictures.length) % pictures.length;
        const figure = pictures[imageIndex], original = figure.querySelector('img');
        const body = imageViewer.querySelector('.eco-overlay-body'); body.replaceChildren();
        const large = node('figure', 'eco-image-view'); const image = node('img');
        image.src = original.src; image.alt = original.alt; image.width = original.width; image.height = original.height; image.loading = 'lazy'; image.decoding = 'async';
        large.append(image); const caption = figure.querySelector('figcaption'); if (caption) large.append(clone(caption));
        body.append(large);
        if (pictures.length > 1) {
            const nav = node('div', 'eco-image-navigation');
            for (const [direction, label] of [[-1, '← Anterior'], [1, 'Siguiente →']]) {
                const button = node('button', 'eco-button eco-button-outline', label); button.type = 'button';
                button.addEventListener('click', () => { showImage(imageIndex + direction); imageViewer.querySelector('.eco-overlay-close').focus(); }); nav.append(button);
            }
            nav.append(node('span', '', (imageIndex + 1) + ' / ' + pictures.length)); body.append(nav);
        }
    };
    const enhancePicture = (figure, index) => {
        if (figure.querySelector(':scope > .eco-image-open')) return;
        const button = node('button', 'eco-image-open'); button.type = 'button'; button.append(icon('ampliar'));
        button.setAttribute('aria-label', 'Ampliar imagen: ' + figure.querySelector('img').alt); button.setAttribute('aria-haspopup', 'dialog');
        button.addEventListener('click', () => {
            if (!imageViewer) {
                imageViewer = createDialog('eco-image-viewer', 'eco-editorial eco-image-viewer', 'Imagen y procedencia');
                imageViewer.addEventListener('keydown', event => {
                    if (pictures.length > 1 && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
                        event.preventDefault(); showImage(imageIndex + (event.key === 'ArrowLeft' ? -1 : 1)); imageViewer.querySelector('.eco-overlay-close').focus();
                    }
                });
            }
            showImage(index); open(imageViewer, button);
        }); figure.classList.add('eco-zoomable'); figure.append(button);
    };
    const enhanceVisiblePictures = () => {
        document.querySelectorAll('.ficha-foto,.ficha-ilustracion,.anp-portada,.anp-foto,.historia-documento,.conoce-localizador').forEach(figure => {
            const image = figure.querySelector('img');
            if (!image || !figure.getClientRects().length || figure.closest('dialog:not([open])')) return;
            let index = pictures.findIndex(item => item.querySelector('img').src === image.src);
            if (index < 0) { index = pictures.length; pictures.push(figure); }
            enhancePicture(figure, index);
        });
    };
    document.addEventListener('toggle', enhanceVisiblePictures, true);
    document.addEventListener('eco:dialogopen', enhanceVisiblePictures);
    document.addEventListener('eco:panelopen', enhanceVisiblePictures);
    enhanceVisiblePictures();
    const revealHash = () => {
        let target;
        try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { return; }
        for (let current = target; current; current = current.parentElement) {
            if (current.tagName === 'DETAILS') current.open = true;
        }
    };
    revealHash(); window.addEventListener('hashchange', revealHash);
    // Herramientas breves: accesibles también mediante foco y tecla Escape.
    const tooltip = node('div', 'eco-tooltip'); tooltip.id = 'eco-tooltip'; tooltip.setAttribute('role', 'tooltip'); tooltip.hidden = true; document.body.append(tooltip);
    let tipOrigin, tipTimer;
    const tipDescriptions = new WeakMap();
    const hideTip = () => {
        if (tipOrigin) {
            const previous = tipDescriptions.get(tipOrigin);
            if (previous) tipOrigin.setAttribute('aria-describedby', previous); else tipOrigin.removeAttribute('aria-describedby');
        }
        tooltip.hidden = true; tipOrigin = null; clearTimeout(tipTimer);
    };
    const positionTip = () => {
        if (!tipOrigin) return;
        const r = tipOrigin.getBoundingClientRect(), box = tooltip.getBoundingClientRect();
        tooltip.style.left = Math.max(12, Math.min(innerWidth - box.width - 12, r.left + r.width / 2 - box.width / 2)) + 'px';
        tooltip.style.top = (r.bottom + box.height + 12 < innerHeight ? r.bottom + 8 : Math.max(12, r.top - box.height - 8)) + 'px';
    };
    document.querySelectorAll('[data-eco-tip]').forEach(trigger => {
        tipDescriptions.set(trigger, trigger.getAttribute('aria-describedby'));
        const show = () => { hideTip(); tipOrigin = trigger; tooltip.textContent = trigger.dataset.ecoTip; trigger.setAttribute('aria-describedby', [tipDescriptions.get(trigger), tooltip.id].filter(Boolean).join(' ')); tooltip.hidden = false; positionTip(); };
        const leave = () => { tipTimer = setTimeout(() => {
            if (document.activeElement !== trigger && !trigger.matches(':hover') && !tooltip.matches(':hover')) hideTip();
        }, 100); };
        trigger.addEventListener('pointerenter', show); trigger.addEventListener('focus', show); trigger.addEventListener('pointerleave', leave); trigger.addEventListener('blur', leave);
    });
    tooltip.addEventListener('pointerenter', () => clearTimeout(tipTimer));
    tooltip.addEventListener('pointerleave', () => { if (document.activeElement !== tipOrigin && !tipOrigin?.matches(':hover')) hideTip(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') hideTip(); });
    const trackTip = () => {
        if (!tipOrigin) return;
        const rect = tipOrigin.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) hideTip(); else positionTip();
    };
    window.addEventListener('scroll', trackTip, { passive: true }); window.addEventListener('resize', trackTip);
    document.querySelectorAll('[data-eco-popover]').forEach(details => {
        const summary = details.querySelector('summary');
        details.addEventListener('toggle', () => summary.setAttribute('aria-expanded', String(details.open)));
        details.addEventListener('keydown', event => { if (event.key === 'Escape' && details.open) { event.preventDefault(); details.open = false; summary.focus(); } });
    });
    document.addEventListener('click', event => document.querySelectorAll('[data-eco-popover][open]').forEach(details => { if (!details.contains(event.target)) details.open = false; }));
    // Los controles se activan únicamente cuando el filtrado está disponible.
    document.querySelectorAll('[data-eco-library]').forEach(library => {
        const tools = library.querySelector('[data-eco-library-tools]'); if (!tools) return;
        tools.hidden = false;
        const items = [...library.querySelectorAll('[data-eco-library-item]')], search = tools.querySelector('input'), filters = [...tools.querySelectorAll('[data-eco-filter]')];
        const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); let theme = 'todos';
        const update = () => {
            const words = normalize(search.value).trim().split(/\s+/); let count = 0;
            items.forEach(item => { item.hidden = !(theme === 'todos' || item.dataset.tema === theme) || !words.every(word => normalize(item.textContent).includes(word)); if (!item.hidden) count++; });
            tools.querySelector('[role=status]').textContent = count + ' de ' + items.length + ' recursos';
            library.querySelector('[data-eco-library-empty]').hidden = count !== 0;
        };
        filters.forEach(button => button.addEventListener('click', () => { theme = button.dataset.ecoFilter; filters.forEach(item => item.setAttribute('aria-pressed', String(item === button))); update(); }));
        search.addEventListener('input', update);
        tools.querySelector('[data-eco-clear]').addEventListener('click', () => { search.value = ''; theme = 'todos'; filters.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.ecoFilter === theme))); update(); search.focus(); }); update();
    });
    // El progreso complementa los capítulos; no cambia sus rutas ni su contenido.
    document.querySelectorAll('[data-eco-progress]').forEach(nav => {
        const links = [...nav.querySelectorAll('a[href^="#"]')]; const sections = links.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean); if (!sections.length) return;
        const status = node('span', 'eco-reading-status'); status.setAttribute('aria-hidden', 'true'); nav.append(status);
        let queued = false;
        const update = () => {
            queued = false; const readingLine = Math.max(120, nav.getBoundingClientRect().bottom + 48);
            const index = Math.max(0, sections.findLastIndex(section => section.getBoundingClientRect().top <= readingLine));
            const first = sections[0].getBoundingClientRect().top + scrollY, last = sections.at(-1), end = last.getBoundingClientRect().bottom + scrollY - innerHeight;
            nav.style.setProperty('--eco-progress', Math.min(1, Math.max(0, (scrollY - first) / Math.max(1, end - first))));
            status.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(sections.length).padStart(2, '0');
            links.forEach((link, i) => { link.classList.toggle('eco-progress-active', i === index); if (!nav.hasAttribute('data-eco-current-managed')) { if (i === index) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); } });
        };
        const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } }; window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', schedule); update();
    });
    document.querySelectorAll('[data-eco-story]').forEach(story => {
        const steps = [...story.querySelectorAll('[data-eco-story-step]')], visual = story.querySelector('figure'); if (!steps.length || !visual) return;
        const label = node('div', 'eco-story-status'); visual.append(label);
        const activate = index => { label.textContent = String(index + 1).padStart(2, '0') + ' · ' + steps[index].querySelector('h4').textContent; steps.forEach((step, i) => step.classList.toggle('eco-story-active', i === index)); };
        activate(0);
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(entries => { const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]; if (visible) activate(steps.indexOf(visible.target)); }, { threshold: [0, .3, .6], rootMargin: '-20% 0px -20% 0px' }); steps.forEach(step => observer.observe(step));
        }
    });
    document.querySelectorAll('[data-eco-compare]').forEach(comparison => {
        const range = comparison.querySelector('input[type=range]'); if (!range) return;
        const update = () => { comparison.style.setProperty('--eco-comparison', range.value + '%'); range.setAttribute('aria-valuetext', range.value + '% de la primera imagen'); }; range.addEventListener('input', update); update();
    });
});
