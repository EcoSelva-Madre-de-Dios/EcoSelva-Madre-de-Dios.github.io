"""Copia solo los archivos utilizados por las páginas al directorio de publicación."""
from pathlib import Path
import shutil
import sys
import re
from hashlib import sha256
from urllib.parse import urlsplit, urlunsplit
from verificar_sitio import local_path
from verificar_sitio import ROOT, published_files, verify

if __name__ == '__main__':
    if verify():
        sys.exit(1)
    destination = Path(sys.argv[1] if len(sys.argv) > 1 else '_site').resolve()
    if destination == ROOT or destination.is_relative_to(ROOT / '.git'):
        sys.exit('El destino debe ser una carpeta de publicación independiente.')
    if destination.exists() and any(destination.iterdir()):
        sys.exit('Usa una carpeta de publicación vacía para evitar archivos antiguos.')
    files = published_files()
    digest = sha256()
    for source in sorted(files):
        digest.update(str(source.relative_to(ROOT)).encode())
        digest.update(source.read_bytes())
    version = digest.hexdigest()[:12]
    for source in files:
        target = destination / source.relative_to(ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        if source.suffix == '.html':
            html = source.read_text()
            html = re.sub(r'(<html\b[^>]*)(>)', lambda m: m[1] + ' data-eco-version="' + version + '"' + m[2], html, count=1)
            def version_asset(match):
                reference = match[2]
                asset = local_path(reference, source.parent)
                if asset in files and asset.suffix in ('.css', '.js'):
                    url = urlsplit(reference)
                    query = url.query + ('&' if url.query else '') + 'v=' + version
                    reference = urlunsplit(url._replace(query=query))
                return match[1] + reference + match[3]
            html = re.sub(r'((?:src|href)=")([^"]+)(")', version_asset, html)
            target.write_text(html)
        else:
            shutil.copy2(source, target)
    (destination / '.nojekyll').touch()
    print(f'Publicación preparada en {destination}. Las copias de recuperación y herramientas permanecen fuera del sitio.')
