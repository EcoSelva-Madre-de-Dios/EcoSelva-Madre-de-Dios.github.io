/* Mejora compartida del teclado; cada ventana conserva su apertura y cierre. */
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("dialog").forEach(dialog => {
        dialog.addEventListener("keydown", event => {
            if (event.defaultPrevented || event.key !== "Tab" || !dialog.open) return;
            const controls = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]')]
                .filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== "hidden" && !node.closest("[hidden]"));
            if (!controls.length) return;
            const edge = event.shiftKey ? controls[0] : controls.at(-1);
            if (document.activeElement === edge) {
                event.preventDefault();
                controls[event.shiftKey ? controls.length - 1 : 0].focus();
            }
        });
    });
});
