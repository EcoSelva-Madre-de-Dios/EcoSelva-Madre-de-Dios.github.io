document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const block = document.getElementById('anp-datos');
  if (!block) return;
  let model;
  try { model = JSON.parse(block.textContent); } catch { return; }
  const areas = new Map(model.areas.map(area => [area.id, area]));
  const money = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const format = value => money.format(value).replace(/,/g, ' ').replace(/\.(\d{2})$/, ',$1');
  const panel = document.querySelector('.anp-panel');
  const map = document.querySelector('.anp-mapa');
  const ficheDialog = document.querySelector('.anp-dialogo-ficha');
  const sourceDialog = document.querySelector('.anp-dialogo-fuente');
  const enhanced = typeof ficheDialog.showModal === 'function';
  let selected = null;
  let category = 'todos';
  let svg = null;
  const cleanClone = element => {
    const clone = element.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    return clone;
  };
  function openDialog(dialog, content, origin, title) {
    dialog.querySelector('.anp-dialogo-contenido').replaceChildren(content);
    dialog.querySelector('header h2').textContent = title;
    window.ecoDialog.open(dialog, origin);
  }
  [ficheDialog, sourceDialog].forEach(dialog => window.ecoDialog.register(dialog, {
    closeSelector: '[data-anp-cerrar]',
    onClose: () => dialog.querySelector('.anp-dialogo-contenido').replaceChildren()
  }));
  function reveal(id) {
    const target = document.getElementById(id);
    if (!target) return;
    let parent = target;
    while (parent) {
      if (parent.tagName === 'DETAILS') parent.open = true;
      parent = parent.parentElement;
    }
    target.scrollIntoView({ block: 'start' });
  }
  function fullFiche(id, origin) {
    const target = document.getElementById('ficha-' + id);
    if (!target) return;
    if (!enhanced) { reveal(target.id); return; }
    openDialog(ficheDialog, cleanClone(target.querySelector('.anp-ficha-contenido')), origin, 'Ficha del área protegida');
  }
  function renderMapState() {
    svg?.querySelectorAll('[data-anp]').forEach(zone => {
      zone.hidden = category !== 'todos' && zone.dataset.categoria !== category;
      // SVG elements do not implement HTML's hidden rendering consistently.
      zone.style.display = zone.hidden ? 'none' : '';
      zone.classList.toggle('anp-seleccionada', zone.dataset.anp === selected);
      zone.classList.toggle('anp-atenuada', Boolean(selected) && zone.dataset.anp !== selected);
      if (zone.dataset.anp === selected) zone.setAttribute('aria-current', 'true');
      else zone.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-anp-seleccionar]').forEach(link => {
      link.hidden = category !== 'todos' && link.dataset.categoria !== category;
      if (link.dataset.anpSeleccionar === selected) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }
  function select(id, origin) {
    const area = areas.get(id);
    if (!area) return;
    selected = id;
    renderMapState();
    const content = document.getElementById('ficha-' + id).querySelector('.anp-ficha-contenido');
    panel.replaceChildren();
    const badge = cleanClone(content.querySelector('.anp-etiqueta'));
    const heading = document.createElement('h3'); heading.textContent = area.nombre;
    const description = document.createElement('p'); description.textContent = area.importancia;
    const departments = document.createElement('p'); departments.textContent = area.departamentos.join(' · ') + ' · Creación: ' + area.fecha_creacion.slice(0, 4);
    const measures = cleanClone(content.querySelector('.anp-medidas'));
    const citation = document.createElement('p'); citation.className = 'anp-citas';
    const source = document.createElement('a'); source.href = '#fuente-' + id; source.setAttribute('data-anp-fuente', ''); source.textContent = 'SERNANP · ficha oficial ↗'; citation.append(source);
    const link = document.createElement('a'); link.href = '#ficha-' + id; link.className = 'anp-boton'; link.dataset.anpFicha = id; link.textContent = 'Ver ficha completa →';
    panel.append(badge, heading, description, departments, measures, citation, link);
    if (enhanced && window.matchMedia('(max-width:700px)').matches) openDialog(ficheDialog, cleanClone(panel), origin, 'Área seleccionada');
    else if (!enhanced) reveal('ficha-' + id);
  }
  document.addEventListener('click', event => {
    const source = event.target.closest('a[data-anp-fuente]');
    if (source) {
      const target = document.getElementById(source.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      if (enhanced) openDialog(sourceDialog, cleanClone(target), source, 'Fuente y alcance');
      else reveal(target.id);
      return;
    }
    const full = event.target.closest('[data-anp-ficha]');
    if (full) { event.preventDefault(); fullFiche(full.dataset.anpFicha, full); return; }
    const selector = event.target.closest('[data-anp-seleccionar], .anp-mapa [data-anp]');
    if (selector) { event.preventDefault(); select(selector.dataset.anpSeleccionar || selector.dataset.anp, selector); }
  });
  const filters = document.querySelector('.anp-filtros');
  filters.hidden = false;
  filters.addEventListener('click', event => {
    const button = event.target.closest('[data-anp-filtro]');
    if (!button) return;
    category = button.dataset.anpFiltro;
    if (selected && category !== 'todos' && areas.get(selected).tipo !== category) {
      selected = null;
      panel.innerHTML = '<p class="anp-kicker">Leer el mapa</p><h3>Elige un área protegida</h3><p>Selecciona uno de los nombres de esta categoría.</p>';
    }
    filters.querySelectorAll('button').forEach(control => control.setAttribute('aria-pressed', String(control === button)));
    renderMapState();
    const count = model.areas.filter(area => category === 'todos' || area.tipo === category).length;
    document.querySelector('.anp-conteo').textContent = `${count} de ${areas.size} áreas nacionales · selecciona un nombre`;
  });
  async function loadMap() {
    try {
      const response = await fetch(window.ecoResourceURL('datos/conservacion/mapa.svg'));
      if (!response.ok) return;
      const doc = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
      const root = doc.documentElement;
      if (root.localName !== 'svg' || root.querySelector('parsererror') || root.querySelectorAll('[data-anp]').length !== areas.size) return;
      svg = document.importNode(root, true);
      svg.querySelectorAll('[data-anp]').forEach(zone => {
        zone.setAttribute('href', '#ficha-' + zone.dataset.anp);
        zone.setAttribute('tabindex', '0');
      });
      map.replaceChildren(svg);
      renderMapState();
    } catch { /* The static map and HTML fiches remain available. */ }
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); loadMap(); }
    }, { rootMargin: '250px' });
    observer.observe(map);
  } else loadMap();
  const metricControls = document.querySelector('.anp-metricas');
  metricControls.hidden = false;
  metricControls.addEventListener('click', event => {
    const button = event.target.closest('[data-anp-metrica]');
    if (!button) return;
    const key = button.dataset.anpMetrica;
    if (!['total_ha', 'mdd_ha'].includes(key)) return;
    const maximum = Math.max(...model.areas.map(area => area[key]));
    document.querySelectorAll('[data-anp-barra]').forEach(bar => {
      const value = areas.get(bar.dataset.anpBarra)[key];
      bar.querySelector('strong').textContent = format(value) + ' ha';
      bar.querySelector('i').style.width = (value / maximum * 100) + '%';
    });
    metricControls.querySelectorAll('button').forEach(control => control.setAttribute('aria-pressed', String(control === button)));
    document.querySelector('.anp-grafico-titulo').textContent = (key === 'total_ha' ? 'Superficie total del ANP' : 'Superficie dentro de Madre de Dios') + ' · hectáreas (ha)';
  });
  const revealHash = () => {
    try { if (location.hash) reveal(decodeURIComponent(location.hash.slice(1))); }
    catch { /* Un fragmento inválido no impide usar filtros ni fichas. */ }
  };
  revealHash();
  window.addEventListener('hashchange', revealHash);
});
