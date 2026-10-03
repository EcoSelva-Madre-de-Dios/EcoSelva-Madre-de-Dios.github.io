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
