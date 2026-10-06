"""Genera el sitio desde sus modelos y estilos con un solo comando."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]

if __name__ == '__main__':
    for name in ('actualizar_biblioteca.py', 'actualizar_flora.py', 'actualizar_ficha_castana.py', 'actualizar_navegacion.py', 'actualizar_assets.py'):
        subprocess.run([sys.executable, str(ROOT / 'herramientas' / name)], cwd=ROOT, check=True)
