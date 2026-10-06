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
