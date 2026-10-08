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
      const { text, group = text, anchor, size = 11 } = item;
      group.style.display = item.visible === false ? 'none' : '';
      group.dataset.atlasVisible = 'false';
      group.setAttribute('aria-hidden', 'true');
      if (item.visible === false) return;
      text.classList.add('eco-atlas-label');
      text.style.fontSize = size * ratio + 'px';
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
