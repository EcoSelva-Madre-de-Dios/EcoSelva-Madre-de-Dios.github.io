/* Solo decoración y microentradas. No gestiona apertura, cierre ni navegación. */
document.addEventListener('DOMContentLoaded', () => {
    const botanicalPaths = {
        Maderables: 'M60 155V80M40 155h40M60 15 25 65h18L20 95h80L77 65h18ZM110 120a20 20 0 1 0 0 .1M110 130a10 10 0 1 0 0 .1',
        'No maderables': 'M30 150Q50 100 95 35M50 110Q15 105 25 65Q65 60 65 90M70 80Q70 35 115 25Q115 70 80 80M90 125a22 22 0 1 0 0 .1M90 103v-12',
        Medicinales: 'M55 150Q55 80 90 30M60 110Q20 110 20 65Q60 65 68 90M70 80Q85 35 120 40Q115 80 75 85M55 140Q95 140 110 105Q70 100 57 125',
        'Alimenticias / frutales': 'M70 50Q48 30 50 15Q80 15 80 45M72 50Q50 40 35 60Q15 90 42 120Q60 140 75 125Q100 138 120 105Q135 65 105 50Q90 40 72 50M65 140Q80 135 95 145Q85 163 65 140'
    };
    const svg = (paths, className, viewBox) => {
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        image.setAttribute('viewBox', viewBox);
        image.setAttribute('aria-hidden', 'true');
        image.setAttribute('focusable', 'false');
        image.classList.add(className);
        const line = document.createElementNS(image.namespaceURI, 'path');
        line.setAttribute('d', paths);
        image.append(line);
        return image;
    };
    const flora = document.getElementById('selva-flora-modal');
    if (flora) {
        const panel = document.createElement('div');
        panel.className = 'ecoselva-panel-botanico';
        panel.setAttribute('aria-hidden', 'true');
        flora.querySelector('.selva-flora-modal-contenido').prepend(panel);
        new MutationObserver(() => {
            if (!flora.open) return;
            const category = flora.querySelector('.selva-flora-modal-categoria').textContent;
            const label = document.createElement('span');
            label.textContent = category;
            panel.replaceChildren(svg(botanicalPaths[category] || botanicalPaths.Medicinales, 'ecoselva-botanica', '0 0 150 180'), label);
        }).observe(flora, { attributes: true, attributeFilter: ['open'] });
    }
    const environment = document.getElementById('selva-ambiente-modal');
    if (environment) {
        const scenes = [
            'M10 130Q70 118 110 130T210 125M35 123V75M15 80 35 25 55 80ZM90 125V65M68 70 90 15 112 70ZM155 125V90M140 95 155 60 170 95ZM178 70l9-9m-9 9 9 9M185 130h20',
            'M10 110Q35 100 60 110T110 110T160 110T210 110M10 130Q35 120 60 130T110 130T160 130T210 130M90 65Q90 45 110 20Q130 45 130 65a20 20 0 0 1-40 0ZM35 60l5-5 5 5-5 5ZM170 80h8v8h-8ZM155 35l6-6 6 6-6 6Z',
            'M10 130h200M110 130V90M110 108Q65 105 65 70Q105 70 110 108M110 100Q115 60 150 60Q150 95 110 100M35 40a15 15 0 1 0 0 .1M35 15v-6m-25 31H4m31 25v6M155 40Q145 20 165 20Q180 5 190 25Q212 22 210 40Z',
            'M45 120 110 35 180 120ZM45 120a6 6 0 1 0 0 .1M110 35a6 6 0 1 0 0 .1M180 120a6 6 0 1 0 0 .1M92 100Q82 70 130 65Q132 105 92 100ZM90 110l30-35'
        ];
        const body = environment.querySelector('.selva-ambiente-modal-cuerpo');
        new MutationObserver(() => {
            if (!environment.open) return;
            const areas = [...document.querySelectorAll('.selva-ambiente-area')];
            const title = environment.querySelector('#selva-ambiente-modal-titulo').textContent;
            const areaIndex = areas.findIndex(area => area.querySelector('h3').textContent === title);
            const visual = environment.querySelector('.selva-ambiente-modal-visual');
            if (!visual.querySelector('.ecoselva-microescena')) visual.append(svg(scenes[Math.max(0, areaIndex)], 'ecoselva-microescena', '0 0 220 160'));
        }).observe(environment, { attributes: true, attributeFilter: ['open'] });
        new MutationObserver(() => {
            body.classList.remove('ecoselva-ficha-entrada', 'ecoselva-ficha-volver');
            void body.offsetWidth;
            body.classList.add(body.querySelector('.selva-ambiente-opciones') ? 'ecoselva-ficha-volver' : 'ecoselva-ficha-entrada');
        }).observe(body, { childList: true });
    }
});
