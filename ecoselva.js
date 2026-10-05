/* Componentes progresivos compartidos; las funciones originales conservan su lógica. */
const ecoAssetsBase = new URL('.', document.currentScript.src);
document.addEventListener('DOMContentLoaded', () => {
    const node = (tag, className, text) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    };
    const icon = name => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'eco-icon'); svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('focusable', 'false');
        const use = document.createElementNS(svg.namespaceURI, 'use');
        use.setAttribute('href', new URL('images/ecoselva-iconos.svg', ecoAssetsBase).href + '#' + name);
        svg.append(use); return svg;
    };
    const focusable = dialog => [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]')]
        .filter(element => element.getClientRects().length && !element.matches(':disabled') && getComputedStyle(element).visibility !== 'hidden' && !element.closest('[hidden]'));
    const bindKeyboard = dialog => dialog.addEventListener('keydown', event => {
        if (event.defaultPrevented || event.key !== 'Tab' || !dialog.open) return;
        const controls = focusable(dialog);
        if (!controls.length) return;
        if (document.activeElement === (event.shiftKey ? controls[0] : controls.at(-1))) {
            event.preventDefault(); controls[event.shiftKey ? controls.length - 1 : 0].focus();
        }
    });
    document.querySelectorAll('dialog').forEach(bindKeyboard);
    const states = new WeakMap();
    const createDialog = (id, className, title) => {
        const dialog = node('dialog', className); dialog.id = id;
        dialog.setAttribute('aria-labelledby', id + '-title');
        const header = node('header', 'eco-modal-barra');
        const heading = node('h2', '', title); heading.id = id + '-title';
        const close = node('button', 'eco-overlay-close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Cerrar ventana');
        header.append(heading, close); dialog.append(header, node('div', 'eco-overlay-body')); document.body.append(dialog);
        bindKeyboard(dialog);
        const restore = () => {
            const state = states.get(dialog);
            if (!state) return;
            states.delete(dialog);
            document.body.style.overflow = state.body;
            document.documentElement.style.overflow = state.document;
            dialog.querySelector('iframe')?.remove();
            if (state.origin?.isConnected) state.origin.focus({ preventScroll: true });
        };
        const dismiss = () => { dialog.close(); restore(); };
        close.addEventListener('click', dismiss);
        dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
        let outsideDown = false;
        const outside = event => { const r = dialog.getBoundingClientRect(); return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom; };
        dialog.addEventListener('pointerdown', event => { outsideDown = event.target === dialog && outside(event); });
        dialog.addEventListener('click', event => { if (outsideDown && event.target === dialog && outside(event)) dismiss(); outsideDown = false; });
        dialog.addEventListener('close', () => {
            // El evento nativo se encola: no debe restaurar una reapertura posterior.
            if (!dialog.open) restore();
        });
        return dialog;
    };
    const open = (dialog, origin) => {
        if (dialog.open || typeof dialog.showModal !== 'function') return;
        states.set(dialog, { origin, body: document.body.style.overflow, document: document.documentElement.style.overflow });
        dialog.showModal(); document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden';
        dialog.scrollTop = 0; dialog.querySelector('.eco-overlay-close').focus({ preventScroll: true });
    };
    const clone = source => {
        const copy = source.cloneNode(true); copy.removeAttribute('id');
        copy.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
        return copy;
    };
    const external = (url, label, className = 'eco-text-link') => {
        const a = node('a', className, label); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a;
    };
    let catalogPromise;
    const catalog = () => catalogPromise ||= fetch(new URL('datos/biblioteca/documentos.json', ecoAssetsBase))
        .then(response => { if (!response.ok) throw new Error('No se pudo cargar la biblioteca.'); return response.json(); })
        .catch(error => { catalogPromise = null; throw error; });
    let documentViewer, contextViewer;
    const previewDocument = async trigger => {
        trigger.disabled = true; trigger.setAttribute('aria-busy', 'true');
        try {
            const model = await catalog(); const document = model.documentos.find(item => item.id === trigger.dataset.ecoDocument);
            if (!document) throw new Error('Documento fuera del catálogo.');
            const dialog = document.pdf
                ? (documentViewer ||= createDialog('eco-document-viewer', 'eco-editorial eco-document-viewer', 'Vista previa del documento'))
                : (contextViewer ||= createDialog('eco-context-viewer', 'eco-drawer eco-context-viewer', 'Contexto y fuente'));
            const body = dialog.querySelector('.eco-overlay-body'); body.replaceChildren();
            const layout = node('div', 'eco-document-layout');
            if (document.portada) {
                const figure = node('figure', 'eco-document-cover'); const image = node('img');
                image.src = new URL(document.portada, ecoAssetsBase).href; image.width = document.ancho; image.height = document.alto;
                image.alt = 'Primera página de ' + document.titulo;
                figure.append(image, node('figcaption', '', 'Primera página del original · ' + document.autor)); layout.append(figure);
            }
            const details = node('section', 'eco-document-details');
            details.append(node('p', 'eco-eyebrow', document.tipo + ' · ' + document.anio), node('h3', '', document.titulo), node('p', 'eco-card-secondary', document.autor));
            const metadata = node('dl', 'eco-document-metadata');
            [['Ámbito', document.alcance], ['Páginas', document.paginas], ['Tamaño', document.bytes ? (document.bytes / 1000000).toFixed(1).replace('.', ',') + ' MB' : null]].forEach(([key, value]) => {
                if (value !== null && value !== undefined) metadata.append(node('dt', '', key), node('dd', '', String(value)));
            });
            details.append(metadata, node('h4', '', 'Por qué lo usamos'), node('p', '', document.uso));
            const actions = node('div', 'eco-card-actions');
            actions.append(external(document.pdf || document.url, document.pdf ? 'PDF original / descarga ↗' : 'Leer artículo original ↗', 'eco-button'));
            const context = node('a', 'eco-text-link', 'Ver el contexto en EcoSelva →'); context.href = new URL(document.contexto, ecoAssetsBase).href; actions.append(context);
            details.append(actions);
            if (document.pdf && document.previsualizacion_pdf) {
                const load = node('button', 'eco-button eco-button-outline', 'Cargar PDF completo · ' + (document.bytes / 1000000).toFixed(1).replace('.', ',') + ' MB'); load.type = 'button';
                load.addEventListener('click', () => {
                    if (body.querySelector('iframe')) return;
                    const frame = node('iframe', 'eco-pdf-frame'); frame.title = 'PDF original: ' + document.titulo; frame.src = document.pdf; frame.tabIndex = -1;
                    const reader = node('section', 'eco-pdf-reader');
                    const fallback = node('p', 'eco-document-note', 'Visor del documento original · ');
                    fallback.append(external(document.pdf, 'Abrir / descargar ↗'));
                    reader.append(fallback, frame); body.append(reader); load.disabled = true; load.textContent = 'PDF solicitado · también puedes abrir el original';
                    dialog.scrollTop += reader.getBoundingClientRect().top - dialog.getBoundingClientRect().top - dialog.querySelector('.eco-modal-barra').offsetHeight - 16;
                }); details.append(load, node('p', 'eco-document-note', 'Si tu navegador no muestra el PDF, abre el original. Allí puedes leerlo y descargarlo.'));
            }
            layout.append(details); body.append(layout);
            trigger.disabled = false; open(dialog, trigger);
        } catch {
            const feedback = node('p', 'eco-document-error', 'No se pudo abrir la vista previa. Utiliza el enlace al documento original.'); feedback.setAttribute('role', 'status');
            trigger.parentElement.querySelector('.eco-document-error')?.remove(); trigger.parentElement.append(feedback);
        } finally { trigger.disabled = false; trigger.removeAttribute('aria-busy'); }
    };
    document.addEventListener('click', event => {
        const trigger = event.target.closest('[data-eco-document]'); if (trigger) previewDocument(trigger);
    });
    document.querySelectorAll('.ficha-indicador a[href^="#"]').forEach(link => {
        link.dataset.ecoRecord = link.hash; link.setAttribute('aria-haspopup', 'dialog');
    });
    document.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
        const trigger = event.target.closest('[data-eco-record],[data-eco-context]');
        if (!trigger) return;
        const id = (trigger.dataset.ecoRecord || trigger.dataset.ecoContext).replace(/^#/, '');
        const source = document.getElementById(id); if (!source) return;
        event.preventDefault();
        contextViewer ||= createDialog('eco-context-viewer', 'eco-drawer eco-context-viewer', 'Contexto y fuente');
        const content = contextViewer.querySelector('.eco-overlay-body'); content.replaceChildren();
        if (source.querySelector(':scope > summary')) content.append(node('h3', '', source.querySelector('summary').textContent));
        [...source.children].filter(element => element.tagName !== 'SUMMARY').forEach(element => content.append(clone(element)));
        open(contextViewer, trigger);
    }, true);
    const speciesBody = document.querySelector('.selva-fauna-modal-contenido');
    if (speciesBody) {
        const decorateSpecies = () => speciesBody.querySelectorAll('.selva-fauna-especies>li').forEach(card => { card.classList.add('eco-card'); card.dataset.ecoCard = 'species'; });
        new MutationObserver(decorateSpecies).observe(speciesBody, { childList: true, subtree: true }); decorateSpecies();
    }
    // El visor reutiliza el SVG original: no genera ni simplifica geometrías.
    document.querySelectorAll('[data-eco-map]').forEach(container => {
        const attach = () => {
            const svg = container.querySelector('svg'); if (!svg || container.querySelector('.eco-map-tools')) return;
            const original = svg.getAttribute('viewBox'); if (!original) return;
            const [x, y, width, height] = original.trim().split(/[\s,]+/).map(Number);
            if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return;
            let zoom = 1, centerX = x + width / 2, centerY = y + height / 2, drag;
            const controls = node('div', 'eco-map-tools'); controls.setAttribute('role', 'group'); controls.setAttribute('aria-label', 'Controles del mapa');
            const update = () => {
                centerX = Math.max(x + width / zoom / 2, Math.min(x + width - width / zoom / 2, centerX));
                centerY = Math.max(y + height / zoom / 2, Math.min(y + height - height / zoom / 2, centerY));
                svg.setAttribute('viewBox', zoom === 1 ? original : [centerX - width / zoom / 2, centerY - height / zoom / 2, width / zoom, height / zoom].join(' '));
                controls.querySelector('[data-eco-zoom=out]').disabled = zoom === 1;
                controls.querySelector('[data-eco-zoom=in]').disabled = zoom === 4;
                container.classList.toggle('eco-map-zoomed', zoom > 1);
            };
            for (const [action, label, text] of [['in', 'Acercar mapa', '+'], ['out', 'Alejar mapa', '−'], ['reset', 'Restablecer vista', '↺']]) {
                const button = node('button', '', text); button.type = 'button'; button.dataset.ecoZoom = action; button.setAttribute('aria-label', label);
                button.addEventListener('click', () => { zoom = action === 'reset' ? 1 : Math.max(1, Math.min(4, zoom * (action === 'in' ? 1.5 : 1 / 1.5))); update(); }); controls.append(button);
            }
            container.append(controls); svg.setAttribute('tabindex', '0');
            const hint = node('p', 'eco-map-hint', 'Con zoom, arrastra el mapa o usa las flechas del teclado.'); hint.id = 'eco-map-hint-' + [...document.querySelectorAll('[data-eco-map]')].indexOf(container);
            container.insertAdjacentElement('afterend', hint); svg.setAttribute('aria-describedby', [svg.getAttribute('aria-describedby'), hint.id].filter(Boolean).join(' '));
            svg.addEventListener('keydown', event => {
                if (event.target !== svg || zoom === 1 || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
                event.preventDefault(); const step = .12 / zoom;
                centerX += (event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0) * width * step;
                centerY += (event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0) * height * step; update();
            });
            svg.addEventListener('pointerdown', event => { if (zoom > 1 && event.button === 0) drag = { startX: event.clientX, startY: event.clientY, centerX, centerY, moved: false, pointer: event.pointerId }; });
            svg.addEventListener('pointermove', event => {
                if (!drag || event.pointerId !== drag.pointer) return;
                const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
                if (!drag.moved && Math.hypot(dx, dy) < 6) return;
                drag.moved = true; svg.setPointerCapture(event.pointerId); const rect = svg.getBoundingClientRect();
                centerX = drag.centerX - dx / rect.width * width / zoom; centerY = drag.centerY - dy / rect.height * height / zoom; update();
            });
            svg.addEventListener('click', event => { if (drag?.moved) { event.preventDefault(); event.stopImmediatePropagation(); } drag = null; }, true);
            svg.addEventListener('pointercancel', () => { drag = null; }); update();
        };
        new MutationObserver(attach).observe(container, { childList: true }); attach();
    });
    // Una galería mantiene las leyendas y créditos originales junto a cada imagen.
    const pictures = [...document.querySelectorAll('.ficha-foto,.ficha-ilustracion,.anp-portada,.anp-foto,.historia-documento,.conoce-localizador')].filter(figure => figure.querySelector('img'));
    let imageViewer, imageIndex = 0;
    const showImage = index => {
        imageIndex = (index + pictures.length) % pictures.length;
        const figure = pictures[imageIndex], original = figure.querySelector('img');
        const body = imageViewer.querySelector('.eco-overlay-body'); body.replaceChildren();
        const large = node('figure', 'eco-image-view'); const image = node('img');
        image.src = original.src; image.alt = original.alt; image.width = original.width; image.height = original.height;
        large.append(image); const caption = figure.querySelector('figcaption'); if (caption) large.append(clone(caption));
        body.append(large);
        if (pictures.length > 1) {
            const nav = node('div', 'eco-image-navigation');
            for (const [direction, label] of [[-1, '← Anterior'], [1, 'Siguiente →']]) {
                const button = node('button', 'eco-button eco-button-outline', label); button.type = 'button';
                button.addEventListener('click', () => { showImage(imageIndex + direction); imageViewer.querySelector('.eco-overlay-close').focus(); }); nav.append(button);
            }
            nav.append(node('span', '', (imageIndex + 1) + ' / ' + pictures.length)); body.append(nav);
        }
    };
    pictures.forEach((figure, index) => {
        const button = node('button', 'eco-image-open'); button.type = 'button'; button.append(icon('ampliar'));
        button.setAttribute('aria-label', 'Ampliar imagen: ' + figure.querySelector('img').alt); button.setAttribute('aria-haspopup', 'dialog');
        button.addEventListener('click', () => {
            if (!imageViewer) {
                imageViewer = createDialog('eco-image-viewer', 'eco-editorial eco-image-viewer', 'Imagen y procedencia');
                imageViewer.addEventListener('keydown', event => {
                    if (pictures.length > 1 && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
                        event.preventDefault(); showImage(imageIndex + (event.key === 'ArrowLeft' ? -1 : 1)); imageViewer.querySelector('.eco-overlay-close').focus();
                    }
                });
            }
            showImage(index); open(imageViewer, button);
        }); figure.classList.add('eco-zoomable'); figure.append(button);
    });
    // Herramientas breves: accesibles también mediante foco y tecla Escape.
    const tooltip = node('div', 'eco-tooltip'); tooltip.id = 'eco-tooltip'; tooltip.setAttribute('role', 'tooltip'); tooltip.hidden = true; document.body.append(tooltip);
    let tipOrigin, tipTimer;
    const tipDescriptions = new WeakMap();
    const hideTip = () => {
        if (tipOrigin) {
            const previous = tipDescriptions.get(tipOrigin);
            if (previous) tipOrigin.setAttribute('aria-describedby', previous); else tipOrigin.removeAttribute('aria-describedby');
        }
        tooltip.hidden = true; tipOrigin = null; clearTimeout(tipTimer);
    };
    const positionTip = () => {
        if (!tipOrigin) return;
        const r = tipOrigin.getBoundingClientRect(), box = tooltip.getBoundingClientRect();
        tooltip.style.left = Math.max(12, Math.min(innerWidth - box.width - 12, r.left + r.width / 2 - box.width / 2)) + 'px';
        tooltip.style.top = (r.bottom + box.height + 12 < innerHeight ? r.bottom + 8 : Math.max(12, r.top - box.height - 8)) + 'px';
    };
    document.querySelectorAll('[data-eco-tip]').forEach(trigger => {
        tipDescriptions.set(trigger, trigger.getAttribute('aria-describedby'));
        const show = () => { hideTip(); tipOrigin = trigger; tooltip.textContent = trigger.dataset.ecoTip; trigger.setAttribute('aria-describedby', [tipDescriptions.get(trigger), tooltip.id].filter(Boolean).join(' ')); tooltip.hidden = false; positionTip(); };
        const leave = () => { tipTimer = setTimeout(() => {
            if (document.activeElement !== trigger && !trigger.matches(':hover') && !tooltip.matches(':hover')) hideTip();
        }, 100); };
        trigger.addEventListener('pointerenter', show); trigger.addEventListener('focus', show); trigger.addEventListener('pointerleave', leave); trigger.addEventListener('blur', leave);
    });
    tooltip.addEventListener('pointerenter', () => clearTimeout(tipTimer));
    tooltip.addEventListener('pointerleave', () => { if (document.activeElement !== tipOrigin && !tipOrigin?.matches(':hover')) hideTip(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') hideTip(); });
    const trackTip = () => {
        if (!tipOrigin) return;
        const rect = tipOrigin.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) hideTip(); else positionTip();
    };
    window.addEventListener('scroll', trackTip, { passive: true }); window.addEventListener('resize', trackTip);
    document.querySelectorAll('[data-eco-popover]').forEach(details => {
        const summary = details.querySelector('summary');
        details.addEventListener('toggle', () => summary.setAttribute('aria-expanded', String(details.open)));
        details.addEventListener('keydown', event => { if (event.key === 'Escape' && details.open) { event.preventDefault(); details.open = false; summary.focus(); } });
    });
    document.addEventListener('click', event => document.querySelectorAll('[data-eco-popover][open]').forEach(details => { if (!details.contains(event.target)) details.open = false; }));
    // Los controles se activan únicamente cuando el filtrado está disponible.
    document.querySelectorAll('[data-eco-library]').forEach(library => {
        const tools = library.querySelector('[data-eco-library-tools]'); if (!tools) return;
        tools.hidden = false;
        const items = [...library.querySelectorAll('[data-eco-library-item]')], search = tools.querySelector('input'), filters = [...tools.querySelectorAll('[data-eco-filter]')];
        const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); let theme = 'todos';
        const update = () => {
            const words = normalize(search.value).trim().split(/\s+/); let count = 0;
            items.forEach(item => { item.hidden = !(theme === 'todos' || item.dataset.tema === theme) || !words.every(word => normalize(item.textContent).includes(word)); if (!item.hidden) count++; });
            tools.querySelector('[role=status]').textContent = count + ' de ' + items.length + ' recursos';
            library.querySelector('[data-eco-library-empty]').hidden = count !== 0;
        };
        filters.forEach(button => button.addEventListener('click', () => { theme = button.dataset.ecoFilter; filters.forEach(item => item.setAttribute('aria-pressed', String(item === button))); update(); }));
        search.addEventListener('input', update);
        tools.querySelector('[data-eco-clear]').addEventListener('click', () => { search.value = ''; theme = 'todos'; filters.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.ecoFilter === theme))); update(); search.focus(); }); update();
    });
    // El progreso complementa los capítulos; no cambia sus rutas ni su contenido.
    document.querySelectorAll('[data-eco-progress]').forEach(nav => {
        const links = [...nav.querySelectorAll('a[href^="#"]')]; const sections = links.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean); if (!sections.length) return;
        const status = node('span', 'eco-reading-status'); status.setAttribute('aria-hidden', 'true'); nav.append(status);
        let queued = false;
        const update = () => {
            queued = false; const readingLine = Math.max(120, nav.getBoundingClientRect().bottom + 48);
            const index = Math.max(0, sections.findLastIndex(section => section.getBoundingClientRect().top <= readingLine));
            const first = sections[0].getBoundingClientRect().top + scrollY, last = sections.at(-1), end = last.getBoundingClientRect().bottom + scrollY - innerHeight;
            nav.style.setProperty('--eco-progress', Math.min(1, Math.max(0, (scrollY - first) / Math.max(1, end - first))));
            status.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(sections.length).padStart(2, '0');
            links.forEach((link, i) => { link.classList.toggle('eco-progress-active', i === index); if (!nav.hasAttribute('data-eco-current-managed')) { if (i === index) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); } });
        };
        const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } }; window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', schedule); update();
    });
    document.querySelectorAll('[data-eco-story]').forEach(story => {
        const steps = [...story.querySelectorAll('[data-eco-story-step]')], visual = story.querySelector('figure'); if (!steps.length || !visual) return;
        const label = node('div', 'eco-story-status'); visual.append(label);
        const activate = index => { label.textContent = String(index + 1).padStart(2, '0') + ' · ' + steps[index].querySelector('h4').textContent; steps.forEach((step, i) => step.classList.toggle('eco-story-active', i === index)); };
        activate(0);
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(entries => { const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]; if (visible) activate(steps.indexOf(visible.target)); }, { threshold: [0, .3, .6], rootMargin: '-20% 0px -20% 0px' }); steps.forEach(step => observer.observe(step));
        }
    });
    document.querySelectorAll('[data-eco-compare]').forEach(comparison => {
        const range = comparison.querySelector('input[type=range]'); if (!range) return;
        const update = () => { comparison.style.setProperty('--eco-comparison', range.value + '%'); range.setAttribute('aria-valuetext', range.value + '% de la primera imagen'); }; range.addEventListener('input', update); update();
    });
});
