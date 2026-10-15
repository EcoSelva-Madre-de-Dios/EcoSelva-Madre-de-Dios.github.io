/* En móvil, el mapa permite desplazar la página y ofrece un modo explícito para moverlo libremente. */
(() => {
    document.addEventListener('DOMContentLoaded', () => {
        const root = document.getElementById('explora-madre-de-dios');
        const canvas = root?.querySelector('.selva-territorio-canvas');
        if (!root || !canvas || !matchMedia('(pointer: coarse)').matches) return;

        const enhance = svg => {
            if (!svg || svg.dataset.ecoGestureReady === 'true') return;
            svg.dataset.ecoGestureReady = 'true';
            const controls = root.querySelector('.selva-territorio-controles');
            if (!controls) return;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'territorio-gesto-toggle';
            button.setAttribute('aria-pressed', 'false');
            button.setAttribute('aria-label', 'Activar movimiento táctil libre del mapa');
            button.textContent = 'Mover mapa';
            controls.append(button);

            const status = document.createElement('span');
            status.className = 'territorio-gesto-estado sr-only';
            status.setAttribute('role', 'status');
            status.setAttribute('aria-live', 'polite');
            canvas.append(status);

            let enabled = false;
            const setEnabled = value => {
                enabled = Boolean(value);
                canvas.classList.toggle('is-touch-map-mode', enabled);
                button.setAttribute('aria-pressed', String(enabled));
                button.setAttribute('aria-label', enabled ? 'Desactivar movimiento táctil libre y volver al desplazamiento de página' : 'Activar movimiento táctil libre del mapa');
                button.textContent = enabled ? 'Desplazar página' : 'Mover mapa';
                status.textContent = enabled
                    ? 'Modo mover mapa activado. Desactívalo para desplazar la página con un dedo sobre el mapa.'
                    : 'Modo mover mapa desactivado. El gesto vertical desplaza la página; todavía puedes tocar elementos del atlas.';
            };

            button.addEventListener('click', () => setEnabled(!enabled));
            root.querySelector('.territorio-restablecer')?.addEventListener('click', () => setEnabled(false));
            setEnabled(false);
        };

        const existing = canvas.querySelector('.selva-territorio-svg');
        if (existing) enhance(existing);
        const observer = new MutationObserver(() => {
            const svg = canvas.querySelector('.selva-territorio-svg');
            if (svg) { enhance(svg); observer.disconnect(); }
        });
        observer.observe(canvas, { childList: true, subtree: true });
    });
})();
