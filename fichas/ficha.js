/* Mejora progresiva: el contenido y los acordeones funcionan sin JavaScript. */
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
    if (matchMedia("(min-width: 701px)").matches) {
        article.querySelector("#para-entender").open = true;
    }
    const initialTarget = targetForHash(location.hash);
    if (initialTarget) {
        reveal(initialTarget);
        requestAnimationFrame(() => initialTarget.scrollIntoView({ block: "start" }));
    }

    const modal = document.querySelector("#ficha-glosario-modal");
    const closeButton = modal.querySelector(".ficha-glosario-cerrar");
    let openingLink;
    let restoreFocus = true;
    modal.addEventListener("close", () => {
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
            modal.showModal();
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
});
