/* Interacciones propias de Flora; los controles existentes conservan su lógica. */
document.addEventListener('DOMContentLoaded', () => {
    const flora = document.getElementById('selva-biodiversidad-panel-flora');
    const selector = flora?.querySelector('.flora-selector');
    const cases = Array.from(flora?.querySelectorAll('[data-flora-caso]') || []);
    const buttons = Array.from(selector?.querySelectorAll('[data-flora-recurso]') || []);
    const status = flora?.querySelector('.flora-estado');
    if (!flora) return;

    const selectResource = (id, announce = true) => {
        const selected = cases.find(panel => panel.dataset.floraCaso === id);
        if (!selected) return;
        cases.forEach(panel => { panel.hidden = panel !== selected; });
        buttons.forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.floraRecurso === id));
        });
        if (announce && status) {
            status.textContent = `Recorrido seleccionado: ${selected.querySelector('h4').textContent}.`;
        }
    };

    if (cases.length && buttons.length && buttons.every(button =>
        cases.some(panel => panel.dataset.floraCaso === button.dataset.floraRecurso))) {
        selectResource('castana', false);
        selector.hidden = false;
        buttons.forEach(button => {
            button.addEventListener('click', () => selectResource(button.dataset.floraRecurso));
        });
    }

    const revealTarget = (target, scroll = true) => {
        if (!target || !flora.contains(target)) return;
        // Activar la pestaña con su controlador original, incluso al volver desde Fauna.
        if (flora.hidden) document.getElementById('selva-biodiversidad-tab-flora')?.click();
        const panel = target.closest('[data-flora-caso]');
        if (panel && !selector?.hidden) selectResource(panel.dataset.floraCaso);
        let ancestor = target;
        while (ancestor && ancestor !== flora) {
            if (ancestor.tagName === 'DETAILS') ancestor.open = true;
            ancestor = ancestor.parentElement;
        }
        if (scroll) requestAnimationFrame(() => target.scrollIntoView({ block:'start' }));
    };
    const hashTarget = () => {
        try { return document.getElementById(decodeURIComponent(location.hash.slice(1))); }
        catch { return null; }
    };
    window.addEventListener('hashchange', () => revealTarget(hashTarget()));
    document.addEventListener('click', event => {
        const anchor = event.target.closest('a[href^="#"]');
        if (!anchor) return;
        let target;
        try { target = document.getElementById(decodeURIComponent(anchor.hash.slice(1))); }
        catch { return; }
        if (!target || !flora.contains(target)) return;
        // Cerrar el diálogo original antes de navegar a una referencia de la página.
        const dialog = anchor.closest('dialog[open]');
        dialog?.querySelector('.selva-flora-modal-cerrar')?.click();
        revealTarget(target);
    });
    revealTarget(hashTarget());
});
