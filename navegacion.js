/* Menú compartido: desplegables exclusivos, cierre exterior y control completo por teclado. */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.menu.container').forEach(header => {
        const toggle = header.querySelector('.selva-menu-toggle');
        const control = header.querySelector('.selva-menu-control');
        const nav = header.querySelector('.navbar');
        const dropdowns = [...header.querySelectorAll('.selva-nav-desplegable details')];
        if (!nav) return;

        const syncControl = () => control?.setAttribute('aria-expanded', String(Boolean(toggle?.checked)));
        const closeDropdowns = except => dropdowns.forEach(item => {
            if (item !== except) item.open = false;
        });
        const closeMenu = ({ restoreFocus = false } = {}) => {
            closeDropdowns();
            if (toggle) toggle.checked = false;
            syncControl();
            if (restoreFocus) control?.focus({ preventScroll: true });
        };

        toggle?.addEventListener('change', () => {
            syncControl();
            if (!toggle.checked) closeDropdowns();
        });
        control?.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            toggle.checked = !toggle.checked;
            toggle.dispatchEvent(new Event('change'));
        });
        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('toggle', () => {
                if (dropdown.open) closeDropdowns(dropdown);
            });
        });
        header.addEventListener('keydown', event => {
            if (event.key !== 'Escape') return;
            const openDropdown = dropdowns.find(item => item.open);
            if (openDropdown) {
                event.preventDefault();
                openDropdown.open = false;
                openDropdown.querySelector('summary')?.focus({ preventScroll: true });
            } else if (toggle?.checked) {
                event.preventDefault();
                closeMenu({ restoreFocus: true });
            }
        });
        nav.addEventListener('click', event => {
            if (event.target.closest('a[href]')) closeMenu();
        });
        document.addEventListener('click', event => {
            if (!header.contains(event.target)) closeMenu();
        });
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1180 && toggle?.checked) closeMenu();
        });
        syncControl();
    });
});
