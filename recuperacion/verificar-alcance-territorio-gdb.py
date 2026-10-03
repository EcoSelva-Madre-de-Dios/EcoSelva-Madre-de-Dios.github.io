from pathlib import Path
root=Path(__file__).resolve().parent.parent
backup=root/'recuperacion/antes-de-territorio-gdb'
for filename,start,end in [
    ('index.html','    <section class="selva-explora reveal" id="explora-madre-de-dios">','    <section class="info-1" id="quienes-somos">'),
    ('script.js','    const territory = document.querySelector(".selva-territorio-layout");','    const ecosystemHotspots =')
]:
    old=(backup/filename).read_bytes().decode('utf8')
    p=root/filename
    new=p.read_bytes().decode('utf8')
    section=new[new.index(start):new.index(end)]
    new=old[:old.index(start)]+section+old[old.index(end):]
    p.write_bytes(new.encode('utf8'))
    assert old[:old.index(start)]==new[:new.index(start)]
    assert old[old.index(end):]==new[new.index(end):]
    if filename=='script.js':
        (root/'recuperacion/modulo-territorio-gdb.js').write_text(section,encoding='utf8')
    print(filename+': contenido fuera de Territorio conservado byte por byte')
assert (root/'style.css').read_bytes().startswith((backup/'style.css').read_bytes())
print('style.css: reglas anteriores conservadas; adiciones limitadas a Territorio')
