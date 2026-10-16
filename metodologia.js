(() => {
  'use strict';

  const page = document.querySelector('main.metodologia');
  if (!page) return;

  const indexLinks = [...page.querySelectorAll('.metodologia-indice a[href^="#"]')];
  const indexedSections = indexLinks
    .map(link => {
      const target = document.querySelector(link.getAttribute('href'));
      return { link, target, observed: target?.matches('section') ? target.querySelector('h2') || target : target };
    })
    .filter(item => item.target);

  const markCurrent = activeLink => {
    indexLinks.forEach(link => {
      if (link === activeLink) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const revealHashTarget = () => {
    if (!location.hash) return;
    let target;
    try {
      target = document.querySelector(location.hash);
    } catch {
      return;
    }
    if (!target) return;
    let disclosure = target.matches('details') ? target : target.closest('details');
    while (disclosure) {
      disclosure.open = true;
      disclosure = disclosure.parentElement?.closest('details');
    }
    const scrollTarget = target.closest('.metodologia-seccion') || target;
    const alignTarget = () => {
      const header = document.querySelector('.eco-global-header');
      const headerHeight = header?.getBoundingClientRect().height || 0;
      const top = window.scrollY + scrollTarget.getBoundingClientRect().top - headerHeight - 24;
      window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
    };
    requestAnimationFrame(() => requestAnimationFrame(alignTarget));
    document.fonts?.ready.then(alignTarget);
    setTimeout(alignTarget, 160);
    const matching = indexedSections.find(item => item.target === target || item.target.closest('section') === target.closest('section'));
    if (matching) markCurrent(matching.link);
  };

  page.querySelectorAll('.metodologia-seccion--coleccion').forEach(section => {
    section.addEventListener('toggle', event => {
      const opened = event.target;
      if (!(opened instanceof HTMLDetailsElement) || !opened.open || opened.parentElement !== section) return;
      [...section.children].forEach(sibling => {
        if (sibling instanceof HTMLDetailsElement && sibling !== opened) sibling.open = false;
      });
    }, true);
  });

  indexLinks.forEach(link => link.addEventListener('click', () => markCurrent(link)));
  if (indexedSections[0]) markCurrent(indexedSections[0].link);
  revealHashTarget();
  addEventListener('hashchange', revealHashTarget);
  addEventListener('load', revealHashTarget, { once: true });

  if ('IntersectionObserver' in window && indexedSections.length) {
    const visible = new Map();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.set(entry.target, entry.boundingClientRect.top);
        else visible.delete(entry.target);
      });
      const nearest = [...visible.entries()].sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]))[0]?.[0];
      const match = indexedSections.find(item => item.observed === nearest);
      if (match) markCurrent(match.link);
    }, { rootMargin: '-96px 0px -70% 0px', threshold: 0 });
    indexedSections.forEach(item => observer.observe(item.observed));
  } else if (indexedSections[0]) {
    markCurrent(indexedSections[0].link);
  }
})();
