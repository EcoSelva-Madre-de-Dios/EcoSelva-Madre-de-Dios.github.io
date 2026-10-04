"""Copia solo los archivos utilizados por las páginas al directorio de publicación."""
from pathlib import Path
import shutil
import sys
from verificar_sitio import ROOT, published_files, verify

if __name__ == '__main__':
    if verify():
        sys.exit(1)
    destination = Path(sys.argv[1] if len(sys.argv) > 1 else '_site').resolve()
    if destination == ROOT or destination.is_relative_to(ROOT / '.git'):
        sys.exit('El destino debe ser una carpeta de publicación independiente.')
    if destination.exists() and any(destination.iterdir()):
        sys.exit('Usa una carpeta de publicación vacía para evitar archivos antiguos.')
    for source in published_files():
        target = destination / source.relative_to(ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
    (destination / '.nojekyll').touch()
    print(f'Publicación preparada en {destination}. Las copias de recuperación y herramientas permanecen fuera del sitio.')
