/* dialogos.js */
/* Diálogos nativos: cierre, fondo y retorno de foco compartidos. */
(() => {
    'use strict';
    const records = new WeakMap();
    const finish = dialog => {
        const record = records.get(dialog);
        if (!record?.active || dialog.open) return;
        record.active = false;
        record.outsideDown = false;
        const origin = record.origin;
        record.origin = null;
        record.options.onClose?.();
        const current = [...document.querySelectorAll('dialog[open]')].at(-1);
        if (record.restoreFocus && origin?.isConnected && origin.getClientRects().length && (!current || current.contains(origin))) {
            origin.focus({ preventScroll: true });
            window.scrollTo({ left: record.scrollX, top: record.scrollY, behavior: 'instant' });
        }
    };
    const close = (dialog, { restoreFocus = true } = {}) => {
        const record = records.get(dialog);
        if (record) record.restoreFocus = restoreFocus;
        if (dialog.open) dialog.close();
        finish(dialog);
    };
    const register = (dialog, options = {}) => {
        if (records.has(dialog)) {
            Object.assign(records.get(dialog).options, options);
            return dialog;
        }
        const record = { options, active: false, outsideDown: false };
        records.set(dialog, record);
        const outside = event => {
            const bounds = dialog.getBoundingClientRect();
            return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
        };
        dialog.addEventListener('pointerdown', event => {
            record.outsideDown = event.target === dialog && outside(event);
        });
        dialog.addEventListener('click', event => {
            const button = event.target.closest(record.options.closeSelector || '[data-eco-dialog-close]');
            if ((button && dialog.contains(button)) || (record.outsideDown && event.target === dialog && outside(event))) close(dialog);
            record.outsideDown = false;
        });
        dialog.addEventListener('cancel', event => { event.preventDefault(); close(dialog); });
        dialog.addEventListener('close', () => finish(dialog));
        return dialog;
    };
    const open = (dialog, origin = document.activeElement) => {
        if (dialog.open || typeof dialog.showModal !== 'function') return false;
        register(dialog);
        dialog.querySelectorAll('template[data-eco-controls]').forEach(template => template.replaceWith(template.content));
        const record = records.get(dialog);
        record.origin = origin;
        record.scrollX = window.scrollX; record.scrollY = window.scrollY;
        record.restoreFocus = true;
        record.active = true;
        dialog.showModal();
        dialog.scrollTop = 0;
        dialog.dispatchEvent(new CustomEvent('eco:dialogopen', { bubbles: true }));
        dialog.querySelector(record.options.closeSelector || '[data-eco-dialog-close]')?.focus({ preventScroll: true });
        return true;
    };
    window.ecoDialog = { register, open, close };
})();

/* navegacion.js */
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

/* cartografia.js */
/* Presentación cartográfica compartida; no altera geometrías ni atributos. */
(() => {
  'use strict';
  const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const labels = (svg, candidates, obstacles = []) => {
    const matrix = svg.getScreenCTM();
    if (!matrix?.a) return;
    const ratio = 1 / matrix.a;
    const viewport = svg.getBoundingClientRect();
    const occupied = obstacles.map(el => el.getBoundingClientRect());
    [...candidates].sort((a, b) => b.priority - a.priority).forEach(item => {
      const { text, group = text, anchor } = item;
      group.style.display = item.visible === false ? 'none' : '';
      group.dataset.atlasVisible = 'false';
      group.setAttribute('aria-hidden', 'true');
      if (item.visible === false) return;
      text.classList.add('eco-atlas-label');
      text.style.fontSize = 'var(--text-note)';
      const noteSize = parseFloat(getComputedStyle(text).fontSize) || 13;
      text.style.fontSize = noteSize * ratio + 'px';
      text.style.strokeWidth = 2.5 * ratio + 'px';
      text.setAttribute('text-anchor', 'middle');
      const shifts = item.offsets || [[0, 0], [0, -16], [0, 16], [20, -10], [-20, 10]];
      let accepted = false;
      for (const [dx, dy] of shifts) {
        text.setAttribute('x', anchor.x + dx * ratio);
        text.setAttribute('y', anchor.y + dy * ratio);
        const r = text.getBoundingClientRect();
        const box = {left:r.left-4, right:r.right+4, top:r.top-3, bottom:r.bottom+3};
        if (box.left < viewport.left + 8 || box.right > viewport.right - 8 || box.top < viewport.top + 8 || box.bottom > viewport.bottom - 8 || occupied.some(other => overlaps(box, other))) continue;
        occupied.push(box); accepted = true; break;
      }
      if (!accepted) group.style.display = 'none';
      group.dataset.atlasVisible = String(accepted);
    });
  };
  const scale = (svg, element, metresPerUnit) => {
    const matrix = svg.getScreenCTM();
    if (!matrix?.a || !Number.isFinite(metresPerUnit) || metresPerUnit <= 0) return;
    const target = Math.min(120, svg.getBoundingClientRect().width * .28);
    const choices = [1, 2, 5, 10, 20, 25, 50, 100, 150, 200];
    const km = choices.filter(k => k * 1000 / metresPerUnit * matrix.a <= target).at(-1) || 1;
    element.querySelector('i').style.width = (km * 1000 / metresPerUnit * matrix.a) + 'px';
    element.querySelector('.eco-atlas-scale-value, .selva-territorio-escala-valor').textContent = km + ' km';
    element.dataset.metresPerUnit = metresPerUnit;
    element.dataset.km = km;
  };
  window.ecoAtlas = { labels, scale };
})();

/* ecoselva.js */
/* Componentes progresivos compartidos; las funciones originales conservan su lógica. */
const ecoAssetsBase = new URL(document.currentScript.src.includes('/assets/') ? '../' : '.', document.currentScript.src);
window.ecoResourceURL = resource => {
    const url = new URL(resource, ecoAssetsBase);
    const version = document.documentElement.dataset.ecoVersion;
    if (version && url.origin === location.origin) url.searchParams.set('v', version);
    return url.href;
};
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
    const createDialog = (id, className, title) => {
        const dialog = node('dialog', className); dialog.id = id;
        dialog.setAttribute('aria-labelledby', id + '-title');
        const header = node('header', 'eco-modal-barra');
        const heading = node('h2', '', title); heading.id = id + '-title';
        const close = node('button', 'eco-overlay-close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Cerrar ventana');
        header.append(heading, close); dialog.append(header, node('div', 'eco-overlay-body')); document.body.append(dialog);
        window.ecoDialog.register(dialog, {
            closeSelector: '.eco-overlay-close',
            onClose: () => dialog.querySelector('iframe')?.remove()
        });
        return dialog;
    };
    const open = (dialog, origin) => window.ecoDialog.open(dialog, origin);
    const clone = source => {
        const copy = source.cloneNode(true); copy.removeAttribute('id');
        copy.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
        return copy;
    };
    const external = (url, label, className = 'eco-text-link') => {
        const a = node('a', className, label); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a;
    };
    let catalogPromise;
    const catalog = () => catalogPromise ||= fetch(window.ecoResourceURL('datos/fuentes.json'))
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
                image.alt = 'Primera página de ' + document.titulo; image.loading = 'lazy'; image.decoding = 'async';
                figure.append(image, node('figcaption', '', 'Primera página del original · ' + document.autor)); layout.append(figure);
            }
            const details = node('section', 'eco-document-details');
            details.append(node('p', 'eco-eyebrow', document.tipo + ' · ' + (document.anio || 'Sin fecha indicada')), node('h3', '', document.titulo), node('p', 'eco-card-secondary', document.autor));
            const metadata = node('dl', 'eco-document-metadata');
            [['Ámbito', document.alcance], ['Páginas', document.paginas], ['Tamaño', document.bytes ? (document.bytes / 1000000).toFixed(1).replace('.', ',') + ' MB' : null]].forEach(([key, value]) => {
                if (value !== null && value !== undefined) metadata.append(node('dt', '', key), node('dd', '', String(value)));
            });
            if (document.fecha_documento) metadata.append(node('dt', '', 'Fecha o periodo del documento'), node('dd', '', document.fecha_documento));
            details.append(metadata, node('h4', '', 'Por qué lo usamos'), node('p', '', document.uso));
            const actions = node('div', 'eco-card-actions');
            actions.append(external(document.pdf || document.url, document.pdf ? 'PDF original / descarga ↗' : 'Consultar fuente original ↗', 'eco-button'));
            const context = node('a', 'eco-text-link', 'Ver el contexto en EcoSelva →'); context.href = new URL(document.contexto, ecoAssetsBase).href; actions.append(context);
            if (document.contextos?.length > 1) {
                const contexts = node('details', 'eco-document-contexts');
                contexts.append(node('summary', '', 'Otros lugares donde citamos esta fuente'));
                const list = node('ul');
                document.contextos.filter(url => url !== document.contexto).forEach(url => {
                    const item = node('li'); const link = node('a', 'eco-text-link', url.startsWith('historia') ? 'Historia de Madre de Dios →' : url.startsWith('areas-protegidas') ? 'Áreas protegidas →' : 'Otra lectura de EcoSelva →');
                    link.href = new URL(url, ecoAssetsBase).href; item.append(link); list.append(item);
                });
                contexts.append(list); details.append(contexts);
            }
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
                container.dispatchEvent(new CustomEvent('eco:mapview', { detail: { svg, zoom } }));
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
                drag.moved = true; svg.setPointerCapture(event.pointerId); const matrix = svg.getScreenCTM();
                centerX = drag.centerX - dx / matrix.a; centerY = drag.centerY - dy / matrix.a; update();
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
        image.src = original.src; image.alt = original.alt; image.width = original.width; image.height = original.height; image.loading = 'lazy'; image.decoding = 'async';
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
    const enhancePicture = (figure, index) => {
        if (figure.querySelector(':scope > .eco-image-open')) return;
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
    };
    const enhanceVisiblePictures = () => {
        document.querySelectorAll('.ficha-foto,.ficha-ilustracion,.anp-portada,.anp-foto,.historia-documento,.conoce-localizador').forEach(figure => {
            const image = figure.querySelector('img');
            if (!image || !figure.getClientRects().length || figure.closest('dialog:not([open])')) return;
            let index = pictures.findIndex(item => item.querySelector('img').src === image.src);
            if (index < 0) { index = pictures.length; pictures.push(figure); }
            enhancePicture(figure, index);
        });
    };
    document.addEventListener('toggle', enhanceVisiblePictures, true);
    document.addEventListener('eco:dialogopen', enhanceVisiblePictures);
    document.addEventListener('eco:panelopen', enhanceVisiblePictures);
    enhanceVisiblePictures();
    const revealHash = () => {
        let target;
        try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { return; }
        for (let current = target; current; current = current.parentElement) {
            if (current.tagName === 'DETAILS') current.open = true;
        }
    };
    revealHash(); window.addEventListener('hashchange', revealHash);
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
        let queued = false; let activeIndex = -1; let initialized = false;
        const update = () => {
            queued = false; const readingLine = Math.max(120, nav.getBoundingClientRect().bottom + 48);
            const index = Math.max(0, sections.findLastIndex(section => section.getBoundingClientRect().top <= readingLine));
            const first = sections[0].getBoundingClientRect().top + scrollY, last = sections.at(-1), end = last.getBoundingClientRect().bottom + scrollY - innerHeight;
            nav.style.setProperty('--eco-progress', Math.min(1, Math.max(0, (scrollY - first) / Math.max(1, end - first))));
            status.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(sections.length).padStart(2, '0');
            links.forEach((link, i) => { link.classList.toggle('eco-progress-active', i === index); if (!nav.hasAttribute('data-eco-current-managed')) { if (i === index) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); } });
            if (initialized && index !== activeIndex && !nav.hasAttribute('data-eco-current-managed')) {
                const scroller = links[index].parentElement;
                if (scroller.scrollWidth > scroller.clientWidth) links[index].scrollIntoView({ block: 'nearest', inline: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
            }
            activeIndex = index; initialized = true;
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
