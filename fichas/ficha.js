/* Mejora progresiva: las tres profundidades y los datos están en el HTML. */
document.addEventListener("DOMContentLoaded", () => {
    const article = document.querySelector("[data-ficha]");
    if (!article) return;
    const targetForHash = hash => {
        try { return document.getElementById(decodeURIComponent(hash.replace(/^#/, ""))); }
        catch { return null; }
    };
    const reveal = target => {
        for (let ancestor = target; ancestor; ancestor = ancestor.parentElement) {
            if (ancestor.tagName === "DETAILS") ancestor.open = true;
        }
    };
    const focusTarget = target => {
        const focus = target.tagName === "DETAILS" ? target.querySelector("summary") : target;
        if (!focus.hasAttribute("tabindex") && focus.tagName !== "SUMMARY") focus.tabIndex = -1;
        focus.focus({ preventScroll: true });
    };
    const initialTarget = targetForHash(location.hash);
    if (initialTarget) {
        reveal(initialTarget);
        requestAnimationFrame(() => initialTarget.scrollIntoView({ block: "start" }));
    }

    const modal = document.querySelector("#ficha-glosario-modal");
    const closeButton = modal.querySelector(".ficha-glosario-cerrar");
    let openingLink;
    let restoreFocus = true;
    let previousOverflow;
    modal.addEventListener("close", () => {
        document.documentElement.style.overflow = previousOverflow;
        if (restoreFocus && openingLink?.isConnected) openingLink.focus({ preventScroll: true });
        restoreFocus = true;
    });
    closeButton.addEventListener("click", () => modal.close());
    modal.addEventListener("click", event => {
        const bounds = modal.getBoundingClientRect();
        if (event.target === modal && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) modal.close();
    });
    document.querySelectorAll("[data-glosario]").forEach(link => {
        if (typeof modal.showModal !== "function") return;
        link.setAttribute("aria-haspopup", "dialog");
        link.setAttribute("aria-controls", modal.id);
        link.addEventListener("click", event => {
            if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
            const entry = targetForHash(link.hash);
            if (!entry) return;
            event.preventDefault();
            openingLink = link;
            modal.querySelector("#ficha-glosario-titulo").textContent = entry.querySelector("dt").textContent;
            modal.querySelector("#ficha-glosario-definicion").replaceChildren(...[...entry.querySelector("dd").childNodes].map(node => node.cloneNode(true)));
            previousOverflow = document.documentElement.style.overflow;
            modal.showModal();
            document.documentElement.style.overflow = "hidden";
            closeButton.focus({ preventScroll: true });
        });
    });
    document.addEventListener("click", event => {
        if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
        const link = event.target.closest('a[href^="#"]');
        const target = link && targetForHash(link.hash);
        if (!target) return;
        if (modal.open) { restoreFocus = false; modal.close(); }
        reveal(target);
        requestAnimationFrame(() => focusTarget(target));
    });
    window.addEventListener("hashchange", () => {
        const target = targetForHash(location.hash);
        if (target) reveal(target);
    });

    {
        const navigation = document.querySelector(".ficha-navegacion");
        const sections = [...article.querySelectorAll(".ficha-capa")];
        const updateCurrent = () => {
            const section = sections.filter(item => item.getBoundingClientRect().top <= 110).at(-1) || sections[0];
            navigation.querySelectorAll("a").forEach(link => {
                if (link.hash === `#${section.id}`) link.setAttribute("aria-current", "location");
                else link.removeAttribute("aria-current");
            });
        };
        let pending = false;
        window.addEventListener("scroll", () => {
            if (pending) return;
            pending = true;
            requestAnimationFrame(() => { updateCurrent(); pending = false; });
        }, { passive: true });
        window.addEventListener("resize", updateCurrent);
        updateCurrent();
    }
});
