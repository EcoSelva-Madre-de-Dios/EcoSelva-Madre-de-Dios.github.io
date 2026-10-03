import json,pathlib,re
root=pathlib.Path(__file__).resolve().parent.parent
out=root/'datos/territorio'
p=root/'index.html';html=p.read_bytes().decode('utf8')
start=html.index('    <section class="selva-explora reveal" id="explora-madre-de-dios">')
end=html.index('    <section class="info-1" id="quienes-somos">',start)
previous=html[start:end]
svg=(out/'mapa.svg').read_text(encoding='utf8')
data=(out/'fichas.json').read_text(encoding='utf8').replace('</',r'<\/')
section='''    <section class="selva-explora reveal" id="explora-madre-de-dios">
        <div class="container">
            <p class="selva-microetiqueta">Explora</p>
            <h2>Territorio</h2>
            <p class="selva-territorio-subtitulo">Bosques, ríos y humedales</p>
            <p class="selva-seccion-intro">Explora cómo el bosque y los sistemas de agua estructuran el paisaje de Madre de Dios.</p>
            <div class="selva-territorio-tabs" role="tablist" aria-label="Capas del territorio">
                <button type="button" id="territorio-tab-bosques" role="tab" data-territorio-modo="bosques" aria-selected="true" aria-controls="territorio-panel">Bosques</button>
                <button type="button" id="territorio-tab-rios" role="tab" data-territorio-modo="rios" aria-selected="false" aria-controls="territorio-panel" tabindex="-1">Ríos</button>
                <button type="button" id="territorio-tab-humedales" role="tab" data-territorio-modo="humedales" aria-selected="false" aria-controls="territorio-panel" tabindex="-1">Humedales</button>
            </div>
            <div class="selva-territorio-layout" data-territorio-activo="bosques">
                <figure class="selva-territorio-mapa">
                    '''+svg+'''
                    <figcaption><div class="selva-territorio-leyenda" aria-live="polite">Contorno departamental referencial · cobertura de bosque en preparación</div>Mapa educativo elaborado por EcoSelva a partir de información cartográfica del Gobierno Regional de Madre de Dios y fuentes indicadas en cada capa.</figcaption>
                </figure>
                <div class="selva-territorio-panel" id="territorio-panel" role="tabpanel" aria-labelledby="territorio-tab-bosques">
                    <h3 class="selva-territorio-panel-titulo">Bosques</h3>
                    <p class="selva-territorio-panel-intro">Cobertura de bosque en preparación.</p>
                    <div class="selva-territorio-opciones"></div>
                    <div class="selva-territorio-ficha" aria-live="polite" aria-atomic="true"></div>
                </div>
            </div>
            <details class="selva-territorio-fuentes">
                <summary>Fuentes y metodología →</summary>
                <p>Base aportada: <strong>GRFFS_Catastro_07_10_2021.gdb.zip</strong>. La fecha del nombre del archivo no sustituye la fecha del registro de cada capa. Incorporación a EcoSelva: 2 de octubre de 2026.</p>
                <ul>
                    <li><strong>DISTRITOS_MDD:</strong> unión de los 11 distritos para obtener el contorno, sin límites internos en la vista. Simplificación topológica a 180 m. Fuente y fecha no indicadas en los campos de esta capa. Límite educativo referencial; existen registros con situación de límite indefinida.</li>
                    <li><strong>RIOS_PRINCIPALES:</strong> selección nominal de Madre de Dios, Tambopata, Inambari, Las Piedras, Manu y Heath. Complemento de tramos verificados de <strong>Hidrografia_mdd</strong>, filtrados antes de cargar sus geometrías. Unión, recorte y simplificación a 65 m; no se dibujan conexiones para rellenar huecos. Fuente y fecha del trazado no indicadas en estas capas.</li>
                    <li><strong>RioPrin:</strong> conserva nombres, cuencas, fuente y fecha de los registros relacionados. Fuente registrada: Gobierno Regional Madre de Dios. Fecha de registro: 27 de enero de 2020. Se usa como metadato, sin sustituir las líneas por polígonos anchos ni atribuirles su fecha.</li>
                    <li><strong>MasaAgua:</strong> polígonos recortados al departamento y simplificados a 12 m. Fuente registrada: Gobierno Regional Madre de Dios. Fecha de registro: 27 de enero de 2020. El dominio original <strong>CATTMA</strong> identifica TIPMAG 2 como Laguna y TIPMAG 3 como Pantano. No se reclasifican como cochas o aguajales.</li>
                </ul>
                <p>Las capas utilizadas declaran <strong>WGS 84 / UTM 19S (EPSG:32719)</strong>. El SVG conserva esa proyección mediante una transformación uniforme. Los GeoJSON preparados para la web se reproyectan a <strong>EPSG:4326</strong>. El grosor de las líneas no representa anchura ni caudal.</p>
                <p>Esta vista no representa cobertura forestal ni un inventario exhaustivo de humedales. Los Bosques de Producción Permanente no se usan como cobertura de bosque.</p>
                <p><a href="datos/territorio/metadatos.json" target="_blank" rel="noopener">Consultar metadatos de las capas ↗</a></p>
            </details>
            <script type="application/json" id="selva-territorio-datos">'''+data+'''</script>
            <template id="selva-territorio-mapa-tecnico-futuro"><a href="" data-enlace-mapa-tecnico>Consultar mapa técnico ↗</a></template>
            <template id="selva-territorio-version-anterior-gdb">'''+previous+'''</template>
        </div>
    </section>

'''
p.write_bytes((html[:start]+section+html[end:]).encode('utf8'))
p=root/'script.js';js=p.read_bytes().decode('utf8')
start=js.index('    const territory = document.querySelector(".selva-territorio-layout");')
end=js.index('    const ecosystemHotspots =',start)
(root/'recuperacion/antes-de-territorio-gdb/modulo-territorio.js').write_text(js[start:end],encoding='utf8')
module=(root/'recuperacion/modulo-territorio-gdb.js').read_text(encoding='utf8')
p.write_bytes((js[:start]+module+'\n\n'+js[end:]).encode('utf8'))
