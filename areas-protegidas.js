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
  let refreshAtlas = () => {};
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
    document.querySelectorAll('.anp-leyenda [data-anp-leyenda]').forEach(item => {
      item.hidden = category !== 'todos' && item.dataset.anpLeyenda !== category;
    });
    refreshAtlas();
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
      setupAtlas();
      renderMapState();
    } catch { /* The static map and HTML fiches remain available. */ }
  }
  function setupAtlas() {
    const ns = svg.namespaceURI;
    const originalOrientation = [...svg.children].at(-1);
    const originalScale = originalOrientation.querySelector('path[d*="h"]')?.getAttribute('d').match(/h([\d.]+)/);
    if (!originalScale) return;
    // La barra archivada fue generada en UTM 19S: 100 km / longitud SVG.
    // Su redondeo a 0,1 unidades se conserva como aproximación documentada.
    const metresPerUnit = 100000 / Number(originalScale[1]);
    originalOrientation.style.display = 'none';
    const boundary = svg.querySelector(':scope > path');
    boundary.style.fill = '#eef1e7';
    const outline = boundary.cloneNode(); outline.classList.add('eco-atlas-boundary');
    outline.removeAttribute('style');
    outline.removeAttribute('fill'); outline.removeAttribute('stroke'); outline.removeAttribute('stroke-width');
    svg.append(outline);
    svg.querySelectorAll(':scope > path[stroke-dasharray]').forEach(path => {
      path.style.stroke = '#8a6147'; path.style.strokeDasharray = 'none';
      path.style.strokeWidth = '1.2'; path.setAttribute('vector-effect', 'non-scaling-stroke');
    });
    svg.querySelectorAll(':scope > path[opacity]').forEach(path => {
      path.style.stroke = '#287c83'; path.style.strokeWidth = '1.5';
      path.setAttribute('vector-effect', 'non-scaling-stroke');
    });
    const context = document.createElement('div'); context.className = 'eco-atlas-context';
    context.innerHTML = '<strong>Madre de Dios</strong><span>Perú · vista regional</span>';
    const scale = document.createElement('div'); scale.className = 'eco-atlas-scale';
    scale.setAttribute('aria-label', 'Escala gráfica aproximada, en UTM 19S');
    scale.innerHTML = '<div><span>0</span><span class="eco-atlas-scale-value">100 km</span></div><i></i>';
    const compass = document.createElement('div'); compass.className = 'eco-atlas-compass';
    compass.setAttribute('aria-label', 'Norte arriba'); compass.innerHTML = '<strong>N</strong><i></i>';
    const tooltip = document.createElement('div'); tooltip.className = 'eco-atlas-tooltip'; tooltip.hidden = true;
    map.append(context, scale, compass, tooltip);
    const provinces = [...svg.querySelectorAll('.anp-provincia')].map(text => ({text, anchor:{x:Number(text.getAttribute('x')),y:Number(text.getAttribute('y'))}, priority:80, size:12}));
    const badges = [...svg.querySelectorAll('[data-anp]')].map(zone => {
      const text = zone.querySelector('.anp-numero'), circle = zone.querySelector('.anp-numero-fondo');
      return {zone, text, circle, anchor:{x:Number(text.getAttribute('x')),y:Number(text.getAttribute('y'))}};
    });
    const selectedName = document.createElementNS(ns, 'text'); svg.append(selectedName);
    let zoom = 1;
    refreshAtlas = () => {
      if (!svg.getScreenCTM()?.a) return;
      const ratio = 1 / svg.getScreenCTM().a;
      const candidates = [...provinces];
      badges.forEach(item => {
        const chosen = item.zone.dataset.anp === selected;
        candidates.push({...item, priority:chosen ? 100 : 60, size:13, visible:item.zone.style.display !== 'none', offsets:[[0,0]]});
        item.circle.setAttribute('r', 10 * ratio);
        item.circle.style.strokeWidth = 1.2 * ratio + 'px';
      });
      const chosen = badges.find(item => item.zone.dataset.anp === selected);
      selectedName.textContent = chosen ? areas.get(selected).nombre : '';
      candidates.push({text:selectedName, anchor:chosen?.anchor || {x:0,y:0}, priority:95, size:12,
        visible:Boolean(chosen && zoom > 1.25), offsets:[[0,-22],[0,26],[0,-40]]});
      window.ecoAtlas.labels(svg, candidates, [context, scale, compass, ...map.querySelectorAll('.eco-map-tools')]);
      badges.forEach(item => { item.circle.style.display = item.text.style.display; });
      window.ecoAtlas.scale(svg, scale, metresPerUnit);
    };
    map.addEventListener('eco:mapview', event => { zoom = event.detail.zoom; tooltip.hidden = true; refreshAtlas(); });
    new ResizeObserver(refreshAtlas).observe(map);
    badges.forEach(({zone}) => {
      const show = event => {
        const area = areas.get(zone.dataset.anp);
        tooltip.textContent = area.nombre + ' · ' + area.categoria; tooltip.hidden = false;
        const rect = map.getBoundingClientRect(), target = zone.querySelector('.anp-numero').getBoundingClientRect();
        const x = event.clientX || target.left, y = event.clientY || target.top;
        tooltip.style.left = Math.max(12, Math.min(rect.width - tooltip.offsetWidth - 12, x - rect.left + 10)) + 'px';
        tooltip.style.top = Math.max(12, Math.min(rect.height - tooltip.offsetHeight - 12, y - rect.top + 10)) + 'px';
      };
      zone.addEventListener('pointerenter', show); zone.addEventListener('focus', show);
      zone.addEventListener('pointerleave', () => {tooltip.hidden = true;});
      zone.addEventListener('blur', () => {tooltip.hidden = true;});
    });
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
