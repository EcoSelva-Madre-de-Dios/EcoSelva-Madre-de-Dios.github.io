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
