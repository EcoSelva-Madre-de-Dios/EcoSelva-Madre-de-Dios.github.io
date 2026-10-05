/* Mejora progresiva de los detalles del mini atlas; no interviene en el mapa. */
document.addEventListener("DOMContentLoaded", () => {
    const section = document.getElementById("conoce-madre-de-dios");
    const modal = document.getElementById("conoce-modal");
    if (!section || !modal || typeof modal.showModal !== "function") return;
    const title = modal.querySelector("#conoce-modal-titulo");
    const content = modal.querySelector(".conoce-modal-contenido");
    const close = modal.querySelector(".conoce-modal-cerrar");
    let opener;
    let previousOverflow;
    let backdropPressed = false;
    const outside = event => {
        const rect = modal.getBoundingClientRect();
        return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    };
    section.querySelectorAll(".conoce-provincia, .conoce-fuentes").forEach(details => {
        const summary = details.querySelector("summary");
        summary.setAttribute("aria-haspopup", "dialog");
        summary.setAttribute("aria-controls", modal.id);
        summary.addEventListener("click", event => {
            if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.button) return;
            if (document.querySelector("dialog[open]")) return;
            event.preventDefault();
            opener = summary;
            previousOverflow = document.body.style.overflow;
            title.textContent = details.dataset.conoceTitulo;
            content.replaceChildren(...[...details.querySelector(".conoce-detalle").childNodes].map(node => node.cloneNode(true)));
            modal.dataset.conoceTipo = details.classList.contains("conoce-provincia") ? "provincia" : "fuentes";
            document.body.style.overflow = "hidden";
            modal.showModal();
            modal.scrollTop = 0;
            close.focus({ preventScroll: true });
        });
    });
    close.addEventListener("click", () => modal.close());
    modal.addEventListener("close", () => {
        document.body.style.overflow = previousOverflow;
        opener?.focus({ preventScroll: true });
        backdropPressed = false;
    });
    modal.addEventListener("pointerdown", event => { backdropPressed = event.target === modal && outside(event); });
    modal.addEventListener("click", event => {
        if (backdropPressed && event.target === modal && outside(event)) modal.close();
        backdropPressed = false;
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
