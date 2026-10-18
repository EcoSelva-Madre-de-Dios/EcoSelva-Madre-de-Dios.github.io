/* Mejoras progresivas de experiencia: búsqueda global, PWA y lectura comparativa. */
(() => {
    const ROOT = `${location.origin}/`;
    const normaliza = value => String(value || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    const url = path => new URL(path.replace(/^\//, ''), ROOT).href;

    const entradasBase = [
        ['Inicio', '/', 'EcoSelva Madre de Dios educación ambiental'],
        ['Conoce Madre de Dios', '/#conoce-madre-de-dios', 'ubicación provincias distritos Tambopata Manu Tahuamanu'],
        ['Territorio y mapa', '/territorio.html', 'atlas mapa capas territorio'],
        ['Bosques y cobertura', '/territorio.html#territorio-bosques', 'bosques cobertura vegetal terraza pacal castañales'],
        ['Ríos', '/territorio.html#territorio-rios', 'ríos agua cuencas meandros cochas Madre de Dios Tambopata Inambari Las Piedras Manu Heath'],
        ['Humedales y aguajales', '/territorio.html#territorio-humedales', 'humedales aguajales lagunas pantanos Mauritia flexuosa'],
        ['Cambios ambientales', '/ambiente.html#presiones', 'deforestación incendios contaminación minería aluvial'],
        ['Ciencia y monitoreo', '/ambiente.html#monitoreo', 'campo SIG satélites NDVI NBR monitoreo'],
        ['Datos y fuentes del territorio', '/territorio.html#territorio-metodologia', 'fuentes metodología datos cartografía'],
        ['Historia de Madre de Dios', '/historia.html', 'historia pueblos procesos hitos'],
        ['Áreas naturales protegidas', '/areas-protegidas.html', 'ANP SERNANP parques reservas conservación'],
        ['Flora de Madre de Dios', '/flora.html', 'flora maderables no maderables medicinales alimenticias'],
        ['Castaña amazónica', '/fichas/castana.html', 'castaña Bertholletia excelsa ficha especie'],
        ['Biodiversidad', '/#biodiversidad', 'flora fauna mamíferos aves reptiles anfibios'],
        ['Ambiente', '/ambiente.html', 'ambiente cambios conservación monitoreo presiones'],
        ['Investigaciones', '/#investigaciones', 'ciencia estudios investigación'],
        ['Biblioteca', '/biblioteca.html', 'biblioteca documentos mapas estudios'],
        ['Fuentes y metodología', '/fuentes-metodologia.html', 'fuentes metodología revisión datos'],
        ['Sobre EcoSelva', '/#quienes-somos', 'misión visión iniciativa EcoSelva'],
        ['Colabora', '/#colabora', 'participar investigación colaborar'],
        ['Contacto', '/#contacto', 'contacto EcoSelva']
    ].map(([title, href, keywords]) => ({ title, href: url(href), keywords, type: 'Sección' }));

    let entradas = [...entradasBase];
    let datosCargados = false;

    const agregarTitulosPagina = () => {
        const vistos = new Set(entradas.map(item => item.href));
        document.querySelectorAll('main h1, main h2, main h3').forEach(heading => {
            const anchor = heading.id || heading.closest('[id]')?.id;
            if (!anchor) return;
            const href = `${location.href.split('#')[0]}#${anchor}`;
            if (vistos.has(href)) return;
            vistos.add(href);
            entradas.push({ title: heading.textContent.trim(), href, keywords: heading.textContent, type: 'En esta página' });
        });
    };

    const cargarDatos = async () => {
        if (datosCargados) return;
        datosCargados = true;
        const tareas = [
            fetch(url('/datos/fauna/fichas.json')).then(r => r.ok ? r.json() : null).then(data => {
                if (!data || typeof data !== 'object') return;
                Object.values(data).forEach(group => {
                    if (!group || !Array.isArray(group.species)) return;
                    group.species.forEach(species => {
                        if (!Array.isArray(species) || !species[0]) return;
                        entradas.push({
                            title: species[0],
                            href: url('/#biodiversidad'),
                            keywords: `${species[1] || ''} ${group.name || ''} fauna especie`,
                            type: 'Fauna'
                        });
                    });
                });
            }).catch(() => {}),
            fetch(url('/datos/flora/lectura.json')).then(r => r.ok ? r.json() : null).then(data => {
                if (!data || !Array.isArray(data.recursos)) return;
                data.recursos.forEach(item => {
                    if (!item?.nombre) return;
                    entradas.push({
                        title: item.nombre,
                        href: item.id === 'castana' ? url('/fichas/castana.html') : url('/flora.html'),
                        keywords: `${item.nombre_cientifico || ''} flora recurso especie`,
                        type: 'Flora'
                    });
                });
            }).catch(() => {})
        ];
        await Promise.allSettled(tareas);
    };

    const crearBusqueda = () => {
        if (document.querySelector('.eco-search-trigger')) return;
        agregarTitulosPagina();

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'eco-search-trigger';
        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.setAttribute('aria-label', 'Buscar en EcoSelva');
        trigger.innerHTML = '<span aria-hidden="true">⌕</span><span>Buscar en EcoSelva…</span><kbd>Ctrl K</kbd>';

        const host = document.querySelector('.menu.container') || document.querySelector('.eco-global-header > .eco-wide');
        if (host) {
            host.append(trigger);
        } else {
            trigger.classList.add('eco-search-trigger--floating');
            document.body.append(trigger);
        }

        const dialog = document.createElement('dialog');
        dialog.className = 'eco-search-dialog';
        dialog.setAttribute('aria-labelledby', 'eco-search-title');
        dialog.innerHTML = `
            <div class="eco-search-shell">
                <header class="eco-search-head">
                    <div><span class="eco-eyebrow">EcoSelva</span><h2 id="eco-search-title">Buscar en el sitio</h2></div>
                    <template data-eco-search-controls><button type="button" class="eco-search-close" aria-label="Cerrar búsqueda">×</button></template>
                </header>
                <label class="eco-search-field">
                    <span class="sr-only">Buscar especies, capas o temas</span>
                    <span aria-hidden="true">⌕</span>
                    <input type="search" autocomplete="off" spellcheck="false" placeholder="Busca una especie, capa o tema…">
                </label>
                <p class="eco-search-help">Prueba “aguaje”, “ríos”, “jaguar”, “ciencia” o “fuentes”.</p>
                <div class="eco-search-results" role="listbox" aria-label="Resultados de búsqueda"></div>
                <footer><span>↑ ↓ navegar</span><span>Enter abrir</span><span>Esc cerrar</span></footer>
            </div>`;
        document.body.append(dialog);

        const input = dialog.querySelector('input');
        const results = dialog.querySelector('.eco-search-results');
        const controlsTemplate = dialog.querySelector('[data-eco-search-controls]');
        let activos = [];
        let seleccionado = 0;

        const pintar = () => {
            const q = normaliza(input.value);
            const tokens = q.split(/\s+/).filter(Boolean);
            activos = entradas
                .map(item => ({ item, haystack: normaliza(`${item.title} ${item.keywords} ${item.type}`) }))
                .filter(record => !tokens.length || tokens.every(token => record.haystack.includes(token)))
                .slice(0, 10)
                .map(record => record.item);
            seleccionado = Math.min(seleccionado, Math.max(0, activos.length - 1));
            results.replaceChildren();
            if (!activos.length) {
                const empty = document.createElement('p');
                empty.className = 'eco-search-empty';
                empty.textContent = 'No encontré coincidencias. Prueba con otro término.';
                results.append(empty);
                return;
            }
            activos.forEach((item, index) => {
                const link = document.createElement('a');
                link.href = item.href;
                link.className = 'eco-search-result';
                link.setAttribute('role', 'option');
                link.setAttribute('aria-selected', String(index === seleccionado));
                link.innerHTML = `<span><strong></strong><small></small></span><i aria-hidden="true">↗</i>`;
                link.querySelector('strong').textContent = item.title;
                link.querySelector('small').textContent = item.type;
                link.addEventListener('mousemove', () => {
                    seleccionado = index;
                    [...results.querySelectorAll('.eco-search-result')].forEach((node, i) => node.setAttribute('aria-selected', String(i === seleccionado)));
                });
                results.append(link);
            });
        };

        const cerrar = () => { if (dialog.open) dialog.close(); };
        const asegurarControles = () => {
            let close = dialog.querySelector('.eco-search-close');
            if (close) return close;
            dialog.querySelector('.eco-search-head').append(controlsTemplate.content.cloneNode(true));
            close = dialog.querySelector('.eco-search-close');
            close.addEventListener('click', cerrar);
            return close;
        };
        const abrir = async () => {
            if (dialog.open) return;
            asegurarControles();
            dialog.showModal();
            input.value = '';
            seleccionado = 0;
            pintar();
            requestAnimationFrame(() => input.focus());
            await cargarDatos();
            pintar();
        };

        trigger.addEventListener('click', abrir);
        dialog.addEventListener('click', event => { if (event.target === dialog) cerrar(); });
        dialog.addEventListener('close', () => dialog.querySelector('.eco-search-close')?.remove());
        input.addEventListener('input', () => { seleccionado = 0; pintar(); });
        input.addEventListener('keydown', event => {
            if (!activos.length) return;
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                seleccionado = (seleccionado + (event.key === 'ArrowDown' ? 1 : -1) + activos.length) % activos.length;
                pintar();
            } else if (event.key === 'Enter') {
                event.preventDefault();
                location.href = activos[seleccionado].href;
            }
        });
        dialog.addEventListener('keydown', event => {
            if (event.key === 'Escape') { event.preventDefault(); cerrar(); trigger.focus({ preventScroll: true }); }
        });
        document.addEventListener('keydown', event => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault(); abrir();
            }
        });
    };

    const crearComparacionFauna = () => {
        const grid = document.querySelector('#selva-biodiversidad-panel-fauna .selva-biodiversidad-stats');
        if (!grid || grid.nextElementSibling?.classList.contains('selva-fauna-comparacion')) return;
        const cards = [...grid.querySelectorAll('.selva-fauna-stat')];
        const records = cards.map(card => ({
            label: card.querySelector('h3')?.textContent.trim(),
            value: Number(card.querySelector('[data-fauna-count]')?.dataset.faunaCount)
        })).filter(item => item.label && Number.isFinite(item.value));
        if (records.length < 2) return;
        const max = Math.max(...records.map(item => item.value));
        const figure = document.createElement('figure');
        figure.className = 'selva-fauna-comparacion';
        figure.setAttribute('aria-labelledby', 'selva-fauna-comparacion-titulo');
        figure.innerHTML = '<figcaption><strong id="selva-fauna-comparacion-titulo">Comparación visual de las cifras registradas</strong><span>La longitud es relativa al valor más alto de estos cuatro grupos.</span></figcaption><div class="selva-fauna-comparacion-barras"></div><p>Lectura orientativa: compara cifras documentadas, no abundancia de individuos ni porcentaje de toda la fauna regional.</p>';
        const bars = figure.querySelector('.selva-fauna-comparacion-barras');
        records.forEach(record => {
            const row = document.createElement('div');
            row.className = 'selva-fauna-comparacion-fila';
            row.innerHTML = '<span class="selva-fauna-comparacion-etiqueta"></span><span class="selva-fauna-comparacion-pista"><i></i></span><strong></strong>';
            row.querySelector('.selva-fauna-comparacion-etiqueta').textContent = record.label;
            row.querySelector('i').style.setProperty('--eco-fauna-bar', `${Math.max(8, (record.value / max) * 100)}%`);
            row.querySelector('strong').textContent = String(record.value);
            bars.append(row);
        });
        grid.after(figure);
    };

    const activarPWA = () => {
        if (!document.querySelector('link[rel="manifest"]')) {
            const manifest = document.createElement('link');
            manifest.rel = 'manifest';
            manifest.href = url('/manifest.json');
            document.head.append(manifest);
        }
        if ('serviceWorker' in navigator && location.protocol === 'https:') {
            navigator.serviceWorker.register(url('/service-worker.js'), { scope: '/' }).catch(() => {});
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        crearBusqueda();
        crearComparacionFauna();
        activarPWA();
    });
})();
