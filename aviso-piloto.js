/* Aviso compartido de etapa piloto. El cierre se recuerda entre páginas. */
(() => {
  'use strict';

  const STORAGE_KEY = 'ecoselva-aviso-piloto-v1';
  const STORAGE_VALUE = 'entendido';

  const readAcknowledgement = () => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === STORAGE_VALUE;
    } catch {
      return false;
    }
  };

  const saveAcknowledgement = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, STORAGE_VALUE);
    } catch {
      /* La navegación continúa aunque el navegador bloquee el almacenamiento. */
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.classList.contains('eco-site')) return;

    const notice = document.createElement('aside');
    notice.className = 'eco-pilot-notice';
    notice.hidden = true;
    notice.setAttribute('aria-labelledby', 'eco-pilot-title');
    notice.setAttribute('aria-describedby', 'eco-pilot-description');
    notice.innerHTML = [
      '<div class="eco-pilot-notice__inner">',
      '<span class="eco-pilot-notice__mark" aria-hidden="true">i</span>',
      '<div class="eco-pilot-notice__content">',
      '<p class="eco-pilot-notice__label">Comunicado importante</p>',
      '<h2 id="eco-pilot-title">EcoSelva está en etapa piloto</h2>',
      '<p class="eco-pilot-notice__text" id="eco-pilot-description">Estamos revisando contenidos, fuentes y herramientas para mejorar esta experiencia educativa sobre Madre de Dios. Si encuentras un error o deseas sugerir una mejora, puedes escribirnos.</p>',
      '</div>',
      '<div class="eco-pilot-notice__actions">',
      '<button class="eco-pilot-notice__accept" type="button">Entendido</button>',
      '<a class="eco-pilot-notice__suggestion" href="mailto:ecoselvamadrededios@gmail.com?subject=Sugerencia%20para%20EcoSelva">Enviar una sugerencia</a>',
      '</div>',
      '</div>'
    ].join('');

    const header = document.querySelector('.menu.container, .eco-global-header');
    if (header) header.insertAdjacentElement('afterend', notice);
    else document.body.prepend(notice);

    const footerTarget = document.querySelector('.eco-global-footer nav, .selva-pie-final-contenido');
    const reopen = document.createElement('button');
    reopen.className = 'eco-pilot-reopen';
    reopen.type = 'button';
    reopen.textContent = 'Ver aviso de etapa piloto';
    if (footerTarget) footerTarget.append(reopen);

    const accept = notice.querySelector('.eco-pilot-notice__accept');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let returnFocus = null;
    let returnPosition = null;

    const showNotice = ({ origin = null, bringIntoView = false } = {}) => {
      returnFocus = origin;
      returnPosition = origin ? { left: window.scrollX, top: window.scrollY } : null;
      notice.hidden = false;
      window.requestAnimationFrame(() => notice.classList.add('is-visible'));
      if (!bringIntoView) return;
      notice.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
      window.setTimeout(() => accept.focus({ preventScroll: true }), reducedMotion.matches ? 0 : 220);
    };

    const hideNotice = ({ remember = true } = {}) => {
      if (remember) saveAcknowledgement();
      notice.classList.remove('is-visible');
      const finish = () => {
        notice.hidden = true;
        if (returnPosition) {
          window.scrollTo({ ...returnPosition, behavior: 'instant' });
          returnFocus?.focus({ preventScroll: true });
        } else if (document.activeElement === accept) {
          document.querySelector('.eco-marca, .logo, #contenido')?.focus({ preventScroll: true });
        }
        returnFocus = null;
        returnPosition = null;
      };
      window.setTimeout(finish, reducedMotion.matches ? 0 : 190);
    };

    accept.addEventListener('click', () => hideNotice());
    reopen.addEventListener('click', () => showNotice({ origin: reopen, bringIntoView: true }));

    if (!readAcknowledgement()) showNotice();
  });
})();
