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
