/* Mejora progresiva de los detalles del mini atlas; no interviene en el mapa. */
document.addEventListener("DOMContentLoaded", () => {
    const section = document.getElementById("conoce-madre-de-dios");
    const modal = document.getElementById("conoce-modal");
    if (!section || !modal || typeof modal.showModal !== "function") return;
    const title = modal.querySelector("#conoce-modal-titulo");
    const content = modal.querySelector(".conoce-modal-contenido");
    window.ecoDialog.register(modal, { closeSelector: '.conoce-modal-cerrar' });

    const openDetail = (details, summary, type) => {
        if (document.querySelector("dialog[open]")) return;
        details.open = false;
        title.textContent = details.dataset.conoceTitulo;
        content.replaceChildren(...[...details.querySelector(".conoce-detalle").childNodes].map(node => node.cloneNode(true)));
        modal.dataset.conoceTipo = type;
        window.ecoDialog.open(modal, summary);
    };

    const enhance = (selector, type) => section.querySelectorAll(selector).forEach(details => {
        const summary = details.querySelector("summary");
        summary.setAttribute("aria-haspopup", "dialog");
        summary.setAttribute("aria-controls", modal.id);
        details.dataset.conoceModal = "true";
        summary.addEventListener("click", event => {
            if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.button) return;
            event.preventDefault();
            openDetail(details, summary, type);
        });
    });

    enhance(".conoce-fuentes", "fuentes");
    enhance(".conoce-provincia", "provincia");

    // Conserva enlaces profundos: las provincias usan el dialogo y las fuentes su detalle nativo.
    const reveal = hash => {
        let target;
        try { target = document.getElementById(decodeURIComponent(hash.slice(1))); }
        catch { return; }
        if (!target || !section.contains(target)) return;
        if (target.matches(".conoce-provincia")) {
            target.scrollIntoView({ block: "center" });
            openDetail(target, target.querySelector("summary"), "provincia");
        } else if (target.matches(".conoce-fuentes")) {
            target.open = true;
        }
    };
    reveal(location.hash);
    window.addEventListener("hashchange", () => reveal(location.hash));
});
