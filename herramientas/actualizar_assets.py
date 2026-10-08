"""Agrupa CSS y JavaScript de forma reproducible; conserva las fuentes editables."""
from pathlib import Path
import re
import sys
ROOT = Path(__file__).resolve().parents[1]
GROUPS = {
    'assets/eco-tokens.css': ('tokens.css',),
    'assets/eco-base.css': ('style.css', 'ventanas.css', 'conoce.css', 'ecoselva.css', 'lecturas.css', 'navegacion.css', 'atlas.css', 'lectura-clara.css'),
    'assets/eco-editorial.css': ('editorial.css', 'ecoselva.css', 'lecturas.css', 'navegacion.css', 'atlas.css', 'lectura-clara.css'),
    'assets/eco-lecturas.css': ('territorio.css', 'flora.css', 'lecturas.css'),
    'assets/eco-base.js': ('dialogos.js', 'script.js', 'conoce.js', 'navegacion.js', 'cartografia.js', 'ecoselva.js'),
    'assets/eco-editorial.js': ('dialogos.js', 'navegacion.js', 'cartografia.js', 'ecoselva.js'),
}

def rendered(target, sources):
    parts = []
    for name in sources:
        source = (ROOT / name).read_text()
        if name.endswith('.css'):
            source = re.sub(r'url\(([\"\']?)(images/[^)\"\']+)\1\)', lambda m: 'url(' + m[1] + '../' + m[2] + m[1] + ')', source)
        parts.append('/* ' + name + ' */\n' + source)
    return '\n'.join(parts)

def check_generated():
    for target, sources in GROUPS.items():
        if not (ROOT / target).is_file() or (ROOT / target).read_text() != rendered(target, sources):
            raise ValueError('Assets desincronizados: ejecuta herramientas/actualizar_assets.py.')

if __name__ == '__main__':
    if '--check' in sys.argv:
        check_generated()
    else:
        for target, sources in GROUPS.items():
            path = ROOT / target
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(rendered(target, sources))
    print('CSS y JavaScript agrupados y sincronizados.')
