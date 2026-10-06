/* Mejora progresiva: el texto, los hitos y las referencias ya están en el HTML. */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    const modal = document.querySelector('.historia-modal');
    const contenido = modal.querySelector('.historia-modal-contenido');
    window.ecoDialog.register(modal, {
        closeSelector: '[data-historia-cerrar]',
        onClose: () => contenido.replaceChildren()
    });

    const revelar = (elemento) => {
        for (let padre = elemento.parentElement; padre; padre = padre.parentElement) {
            if (padre.tagName === 'DETAILS') padre.open = true;
        }
        if (elemento.tagName === 'DETAILS') elemento.open = true;
    };

    document.addEventListener('click', (evento) => {
        const enlace = evento.target.closest('a[data-historia-fuente]');
        if (!enlace || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
        const fuente = document.getElementById(enlace.hash.slice(1));
        if (!fuente) return;
        if (typeof modal.showModal !== 'function') {
            revelar(fuente);
            return;
        }
        evento.preventDefault();
        const copia = fuente.cloneNode(true);
        copia.removeAttribute('id');
        copia.removeAttribute('tabindex');
        copia.querySelectorAll('[id]').forEach((nodo) => nodo.removeAttribute('id'));
        contenido.replaceChildren(copia);
        window.ecoDialog.open(modal, enlace);
    });
    const filtros = document.querySelector('.historia-filtros');
    const conteo = document.querySelector('.historia-conteo');
    const hitos = [...document.querySelectorAll('[data-historia-categoria]')];
    const filtrar = (categoria) => {
        let visibles = 0;
        hitos.forEach((hito) => {
            hito.hidden = categoria !== 'todos' && hito.dataset.historiaCategoria !== categoria;
            if (!hito.hidden) visibles++;
        });
        filtros.querySelectorAll('button').forEach((boton) => {
            boton.setAttribute('aria-pressed', String(boton.dataset.historiaFiltro === categoria));
        });
        conteo.textContent = `${visibles} de ${hitos.length} hitos · orden cronológico`;
    };
    filtros.addEventListener('click', (evento) => {
        const boton = evento.target.closest('[data-historia-filtro]');
        if (boton) filtrar(boton.dataset.historiaFiltro);
    });
    filtros.hidden = false;
    conteo.hidden = false;
    filtrar('todos');

    const abrirDestino = () => {
        let destino;
        try { destino = document.getElementById(decodeURIComponent(location.hash.slice(1))); }
        catch { return; }
        if (!destino) return;
        if (destino.closest('[data-historia-categoria]')) filtrar('todos');
        revelar(destino);
        destino.scrollIntoView({ block: 'start' });
        if (destino.matches('.historia-registro')) destino.focus({ preventScroll: true });
    };
    window.addEventListener('hashchange', abrirDestino);
    if (location.hash) abrirDestino();

    if ('IntersectionObserver' in window) {
        const enlaces = [...document.querySelectorAll('.historia-navegacion a')];
        const observador = new IntersectionObserver((entradas) => {
            const visible = entradas.find((entrada) => entrada.isIntersecting);
            if (!visible) return;
            enlaces.forEach((enlace) => {
                if (enlace.hash === `#${visible.target.id}`) enlace.setAttribute('aria-current', 'location');
                else enlace.removeAttribute('aria-current');
            });
        }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });
        document.querySelectorAll('.historia-capitulo').forEach((capitulo) => observador.observe(capitulo));
        observador.observe(document.querySelector('.historia-hero'));
    }
});
