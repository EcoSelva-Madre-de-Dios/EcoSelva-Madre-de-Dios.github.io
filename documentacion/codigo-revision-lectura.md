# Código de la revisión de lectura

8 de octubre de 2026. Se mostró cada bloque durante la implementación; este documento reúne su código completo.

## Escala compartida

```css
/* Variables compartidas de EcoSelva. */
:root {
  --layout-max:1440px; --layout-wide:1320px; --layout-content:1180px;
  --reading-max:65ch; --reading-narrow:640px; --page-gutter:clamp(22px,5vw,96px);
  --space-unit:8px;
  --space-1:8px; --space-2:16px; --space-3:24px; --space-4:32px; --space-5:40px;
  --space-6:48px; --space-7:64px; --space-8:80px; --space-9:120px;
  --radius-sm:6px; --radius-md:10px; --radius-lg:16px; --radius-xl:24px;
  --forest-deep:#102e22; --forest:#163d2b; --green-natural:#3d7a4d;
  --earth:#c77a3d; --water:#287c83; --sand:#cfb45c;
  --ink:#202a25; --muted:#59635d; --paper:#f3f0e6; --white:#fff;
  --earth-text:#82502c; --water-text:#24656b; --line:#d3dbd1;
  --font-heading:Manrope,Arial,sans-serif; --font-body:Inter,Arial,sans-serif;
  --shadow-raised:0 8px 24px rgb(16 46 34 / 8%);
  --shadow-dialog:0 24px 80px rgb(16 46 34 / 24%);
  --motion-fast:180ms; --motion-card:220ms; --motion-dialog:220ms;
  /* Referencia del sistema; las consultas @media utilizan sus valores literales. */
  --breakpoint-mobile:767px; --breakpoint-tablet:1100px;
  --anp-bosque:var(--forest); --anp-texto:var(--ink); --anp-suave:var(--muted);
  --anp-papel:var(--paper); --anp-linea:var(--line); --anp-agua:var(--water-text); --anp-tierra:var(--earth-text);
  /* Cuatro tamaños de texto compartidos. */
  --text-note:clamp(13px,.8rem + .1vw,14px);
  --text-body:clamp(16px,.95rem + .2vw,18px);
  --text-title:clamp(22px,1.2rem + .5vw,28px);
  --text-display:clamp(32px,1.6rem + 2vw,56px);
  --text-credit:var(--text-note); --text-reading:var(--text-body); --text-subtitle:var(--text-title);
  --padding-section:clamp(48px,6vw,88px); --padding-block:32px; --padding-card:24px;
}

```

## Conoce Madre de Dios

```html
<section aria-labelledby="conoce-titulo" class="conoce-madre" id="conoce-madre-de-dios">
 <div class="container conoce-cabecera">
  <p class="selva-microetiqueta">
   Un territorio para conocer
  </p>
  <h2 id="conoce-titulo">
   Conoce Madre de Dios
  </h2>
  <p class="conoce-introduccion">
   En la Amazonía suroriental del Perú, montañas, llanuras y ríos forman el territorio donde las personas habitan y trabajan.
  </p>
 </div>
 <div class="container conoce-modulos">
  <section aria-labelledby="conoce-ubicacion-titulo" class="conoce-modulo" id="conoce-ubicacion">
   <header class="conoce-modulo-cabecera">
    <h3 id="conoce-ubicacion-titulo">
     En el suroriente del Perú
    </h3>
   </header>
   <div class="conoce-ubicacion-grid">
    <figure class="conoce-localizador">
     <img alt="Localizador del Perú con Madre de Dios resaltado en verde, en el suroriente del país." decoding="async" height="405" loading="lazy" src="images/conoce-peru.svg" width="360"/>
     <figcaption>
      Localizador educativo; no es cartografía demarcatoria.
     </figcaption>
    </figure>
    <div class="conoce-ubicacion-texto">
     <dl class="conoce-datos">
      <div>
       <dt>
        Superficie aproximada
       </dt>
       <dd>
        ≈85 000
        <span>
         km²
        </span>
       </dd>
      </div>
      <div>
       <dt>
        Provincias
       </dt>
       <dd>
        3
       </dd>
      </div>
      <div>
       <dt>
        Distritos
       </dt>
       <dd>
        11
       </dd>
      </div>
     </dl>
     <p>
      <strong>
       Departamentos vecinos:
      </strong>
      Ucayali, Cusco y Puno.
     </p>
     <p>
      <strong>
       Países fronterizos:
      </strong>
      Brasil y Bolivia.
     </p>
     <a class="conoce-enlace" href="fuentes-metodologia.html#metodologia-conoce" id="conoce-fuentes-ubicacion">
      Cómo se documentan la superficie y los límites →
     </a>
    </div>
   </div>
  </section>
  <section aria-labelledby="conoce-provincias-titulo" class="conoce-modulo conoce-modulo-provincias" id="conoce-provincias">
   <header class="conoce-modulo-cabecera">
    <h3 id="conoce-provincias-titulo">
     Sus provincias y distritos
    </h3>
   </header>
   <div class="conoce-provincias">
    <details class="conoce-provincia" data-conoce-titulo="Tambopata" id="conoce-provincia-tambopata">
     <summary>
      <svg aria-hidden="true" class="eco-flat" focusable="false" viewbox="0 0 96 96">
       <use href="images/ecoselva-planas.svg#provincia-tambopata">
       </use>
      </svg>
      <strong>
       Tambopata
      </strong>
      <span class="conoce-provincia-cantidad">
       4 distritos
      </span>
      <span class="conoce-provincia-abrir">
       Conocer Tambopata ↓
      </span>
     </summary>
     <div class="conoce-detalle">
      <dl class="conoce-ficha-provincia">
       <dt>
        Capital provincial
       </dt>
       <dd>
        Puerto Maldonado, también capital departamental
       </dd>
       <dt>
        Distritos
       </dt>
       <dd>
        Tambopata, Inambari, Las Piedras, Laberinto
       </dd>
       <dt>
        Ubicación orientativa
       </dt>
       <dd>
        Sector central y sureste del departamento.
       </dd>
      </dl>
     </div>
    </details>
    <details class="conoce-provincia" data-conoce-titulo="Manu" id="conoce-provincia-manu">
     <summary>
      <svg aria-hidden="true" class="eco-flat" focusable="false" viewbox="0 0 96 96">
       <use href="images/ecoselva-planas.svg#provincia-manu">
       </use>
      </svg>
      <strong>
       Manu
      </strong>
      <span class="conoce-provincia-cantidad">
       4 distritos
      </span>
      <span class="conoce-provincia-abrir">
       Conocer Manu ↓
      </span>
     </summary>
     <div class="conoce-detalle">
      <dl class="conoce-ficha-provincia">
       <dt>
        Capital provincial
       </dt>
       <dd>
        Salvación
       </dd>
       <dt>
        Distritos
       </dt>
       <dd>
        Manu, Fitzcarrald, Madre de Dios, Huepetuhe
       </dd>
       <dt>
        Ubicación orientativa
       </dt>
       <dd>
        Sector occidental del departamento.
       </dd>
      </dl>
     </div>
    </details>
    <details class="conoce-provincia" data-conoce-titulo="Tahuamanu" id="conoce-provincia-tahuamanu">
     <summary>
      <svg aria-hidden="true" class="eco-flat" focusable="false" viewbox="0 0 96 96">
       <use href="images/ecoselva-planas.svg#provincia-tahuamanu">
       </use>
      </svg>
      <strong>
       Tahuamanu
      </strong>
      <span class="conoce-provincia-cantidad">
       3 distritos
      </span>
      <span class="conoce-provincia-abrir">
       Conocer Tahuamanu ↓
      </span>
     </summary>
     <div class="conoce-detalle">
      <dl class="conoce-ficha-provincia">
       <dt>
        Capital provincial
       </dt>
       <dd>
        Iñapari
       </dd>
       <dt>
        Distritos
       </dt>
       <dd>
        Iñapari, Iberia, Tahuamanu
       </dd>
       <dt>
        Ubicación orientativa
       </dt>
       <dd>
        Sector norte y nororiental del departamento.
       </dd>
      </dl>
     </div>
    </details>
   </div>
   <a class="conoce-enlace" href="fuentes-metodologia.html#metodologia-conoce" id="conoce-fuentes-provincias">
    Consultar el respaldo de las capitales y distritos →
   </a>
  </section>
  <section aria-labelledby="territorio-resumen-titulo" class="conoce-modulo" id="explora-madre-de-dios">
   <header class="conoce-modulo-cabecera">
    <h3 id="territorio-resumen-titulo">
     Bosques, ríos y humedales
    </h3>
   </header>
   <div class="eco-preview-map">
    <img alt="Esquema de un río que conecta bosques y humedales; ilustración educativa sin escala." decoding="async" height="260" loading="lazy" src="images/territorio-rio.svg" width="720"/>
    <div>
     <p>
      Activa las capas del mapa y consulta sus registros. Las fechas corresponden a las fuentes; no es un monitoreo en tiempo real.
     </p>
     <a class="eco-button" href="territorio.html">
      Consultar las capas del territorio →
     </a>
    </div>
   </div>
  </section>
  <div class="conoce-preview-grid">
   <section aria-labelledby="conoce-geografia-titulo" class="eco-card conoce-preview" id="conoce-geografia">
    <h3 id="conoce-geografia-titulo">
     De las montañas a la llanura
    </h3>
    <p>
     Relieve, clima y cuencas ayudan a comprender la variedad del paisaje.
    </p>
    <a class="eco-text-link" href="territorio.html#conoce-geografia">
     Comprender el relieve y las cuencas →
    </a>
   </section>
   <section aria-labelledby="conoce-historia-titulo" class="eco-card conoce-preview" id="conoce-historia">
    <h3 id="conoce-historia-titulo">
     Madre de Dios a través del tiempo
    </h3>
    <p>
     Una historia de pueblos, ríos y bosques anterior a la creación administrativa del departamento.
    </p>
    <a class="eco-text-link" href="historia.html">
     Recorrer la historia de Madre de Dios →
    </a>
   </section>
   <section aria-labelledby="conoce-personas-titulo" class="eco-card conoce-preview" id="conoce-personas">
    <h3 id="conoce-personas-titulo">
     El territorio también se vive
    </h3>
    <p>
     Lenguas, comunidades, trabajo y conocimientos forman parte de la vida del bosque.
    </p>
    <a class="eco-text-link" href="territorio.html#conoce-personas">
     Conocer a las personas del territorio →
    </a>
   </section>
  </div>
  <div class="eco-block-sources" id="conoce-fuentes-comunes">
   <h3>
    Fuentes de ubicación y provincias
   </h3>
   <ol>
    <li>
     <a href="https://www.gob.pe/institucion/inei/informes-publicaciones/7654854-madre-de-dios-compendio-estadistico-2025" rel="noopener noreferrer" target="_blank">
      INEI · Compendio Estadístico Madre de Dios 2025, cuadros 1.1 y 1.2.
     </a>
    </li>
    <li>
     <a href="https://sigrid.cenepred.gob.pe/sigridv3/storage/biblioteca//10108_plan-de-prevencion-y-reduccion-del-riesgo-de-desastres-frente-a-incendios-forestales-region-madre-de-dios-2025.pdf" rel="noopener noreferrer" target="_blank">
      GORE Madre de Dios · Plan regional de 2020, páginas 4 y 5.
     </a>
    </li>
    <li>
     <a href="https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/" rel="noopener noreferrer" target="_blank">
      Natural Earth · Admin 1, versión 5.1.1, dominio público.
     </a>
    </li>
    <li>
     <a href="https://leyes.congreso.gob.pe/Documentos/Leyes/27285.pdf#page=1" rel="noopener noreferrer" target="_blank">
      Congreso · Ley N.º 27285, artículo 2, 2000.
     </a>
    </li>
   </ol>
  </div>
 </div>
</section>

```

## Historias breves

```html
<section class="selva-curiosidades reveal" id="sabias-que">
 <div class="container">
  <p class="selva-microetiqueta">
   Historias breves
  </p>
  <h2>
   ¿Sabías que...?
  </h2>
  <p class="selva-seccion-intro">
   Seis historias para mirar Madre de Dios desde otra perspectiva.
  </p>
  <div class="selva-flip-grid">
   <article class="selva-flip-card" data-eco-card="visual">
    <span class="selva-flip-inner">
     <button aria-label="Flora: Un bosque que también alimenta" aria-pressed="false" class="selva-flip-front selva-tema-flora selva-flip-toggle" type="button">
      <svg aria-hidden="true" class="eco-flat eco-story-art" focusable="false" viewbox="0 0 96 96">
       <use href="images/ecoselva-planas.svg#flora-castana">
       </use>
      </svg>
      <span class="selva-flip-frente-texto">
       <span class="selva-flip-categoria">
        Flora
       </span>
       <span class="selva-flip-frente-titulo">
        Un bosque que también alimenta
       </span>
      </span>
     </button>
     <span class="selva-flip-back">
      <span class="selva-curiosidad-encabezado">
       <strong class="selva-curiosidad-titulo">
        La castaña amazónica
       </strong>
       <em class="selva-curiosidad-taxonomia">
        Bertholletia excelsa
       </em>
      </span>
      <span class="selva-curiosidad-texto">
       Caracteriza los bosques de Madre de Dios. En Tambopata, los castañales están protegidos y su aprovechamiento sigue un manejo orientado al uso sostenible.
      </span>
      <span aria-label="Etiquetas" class="selva-curiosidad-etiquetas">
       <span>
        Flora
       </span>
       <span>
        Bosque
       </span>
       <span>
        Castaña
       </span>
      </span>
      <span class="selva-curiosidad-fuentes">
       <a href="flora.html#flora-recorrido">
        Del bosque al producto →
       </a>
      </span>
      <span aria-label="Fuentes de esta historia" class="eco-numbered-citations">
       <a aria-label="Consultar referencia 1" data-eco-context="#historias-ref-1" href="#historias-ref-1">
        [1]
       </a>
       <a aria-label="Consultar referencia 2" data-eco-context="#historias-ref-2" href="#historias-ref-2">
        [2]
       </a>
      </span>
     </span>
    </span>
   </article>
   <article class="selva-flip-card" data-eco-card="visual">
    <span class="selva-flip-inner">
     <button aria-label="Fauna: El jaguar aún recorre estos bosques" aria-pressed="false" class="selva-flip-front selva-tema-fauna selva-flip-toggle" type="button">
      <svg aria-hidden="true" class="eco-flat eco-story-art" focusable="false" viewbox="0 0 96 96">
       <use href="images/ecoselva-planas.svg#fauna-mamiferos">
       </use>
      </svg>
      <span class="selva-flip-frente-texto">
       <span class="selva-flip-categoria">
        Fauna
       </span>
       <span class="selva-flip-frente-titulo">
        El jaguar aún recorre estos bosques
       </span>
      </span>
     </button>
     <span class="selva-flip-back">
      <span class="selva-curiosidad-encabezado">
       <strong class="selva-curiosidad-titulo">
        Jaguar
       </strong>
       <em class="selva-curiosidad-taxonomia">
        Panthera onca
       </em>
      </span>
      <span class="selva-curiosidad-texto">
       Está registrado en la Reserva Nacional Tambopata, donde comparte hábitat con otros felinos, primates y sachavacas.
      </span>
      <span aria-label="Etiquetas" class="selva-curiosidad-etiquetas">
       <span>
        Fauna
       </span>
       <span>
        Mamíferos
       </span>
       <span>
        Jaguar
       </span>
      </span>
      <span aria-label="Fuentes de esta historia" class="eco-numbered-citations">
       <a aria-label="Consultar referencia 1" data-eco-context="#historias-ref-1" href="#historias-ref-1">
        [1]
       </a>
      </span>
     </span>
    </span>
   </article>
   <article class="selva-flip-card" data-eco-card="visual">
    <span class="selva-flip-inner">
     <button aria-label="Ecosistemas: La Amazonía no es un solo bosque" aria-pressed="false" class="selva-flip-front selva-tema-ecosistemas selva-flip-toggle" type="button">
      <img alt="Lago rodeado de bosque y palmeras, con cielo azul y nubes reflejadas en el agua." class="selva-curiosidad-foto" decoding="async" height="1080" loading="lazy" src="images/rn-tambopata.jpg" width="1920"/>
      <span class="selva-flip-frente-texto">
       <span class="selva-flip-categoria">
        Ecosistemas
       </span>
       <span class="selva-flip-frente-titulo">
        La Amazonía no es un solo bosque
       </span>
      </span>
     </button>
     <span class="selva-flip-back">
      <span class="selva-curiosidad-encabezado">
       <strong class="selva-curiosidad-titulo">
        Ecosistemas de Tambopata
       </strong>
      </span>
      <span class="selva-curiosidad-texto">
       La Reserva Nacional Tambopata reúne aguajales, pacales, castañales, bosques de terraza y ribereños, collpas y cochas. Este mosaico de ambientes alberga su biodiversidad.
      </span>
      <span aria-label="Etiquetas" class="selva-curiosidad-etiquetas">
       <span>
        Ecosistemas
       </span>
       <span>
        Paisaje
       </span>
       <span>
        Amazonía
       </span>
      </span>
      <span aria-label="Fuentes de esta historia" class="eco-numbered-citations">
       <a aria-label="Consultar referencia 1" data-eco-context="#historias-ref-1" href="#historias-ref-1">
        [1]
       </a>
      </span>
     </span>
    </span>
   </article>
   <article class="selva-flip-card" data-eco-card="visual">
    <span class="selva-flip-inner">
     <button aria-label="Agua: Hay lagos que alguna vez fueron río" aria-pressed="false" class="selva-flip-front selva-tema-agua selva-flip-toggle" id="territorio-historia-lagos" type="button">
      <img alt="Vista satelital de un río amazónico sinuoso entre bosque y zonas intervenidas." class="selva-curiosidad-foto" decoding="async" height="675" loading="lazy" src="images/agua-madre-de-dios.jpg" width="1200"/>
      <span class="selva-flip-frente-texto">
       <span class="selva-flip-categoria">
        Agua
       </span>
       <span class="selva-flip-frente-titulo">
        Hay lagos que alguna vez fueron río
       </span>
      </span>
     </button>
     <span class="selva-flip-back">
      <span class="selva-curiosidad-encabezado">
       <strong class="selva-curiosidad-titulo">
        Lagos de herradura
       </strong>
      </span>
      <span class="selva-curiosidad-texto">
       Los lagos de herradura de Tambopata se originan cuando el río cambia de cauce y aísla un meandro. En estos antiguos brazos viven peces, aves, reptiles y mamíferos.
      </span>
      <span aria-label="Etiquetas" class="selva-curiosidad-etiquetas">
       <span>
        Agua
       </span>
       <span>
        Ríos
       </span>
       <span>
        Cochas
       </span>
      </span>
      <span aria-label="Fuentes de esta historia" class="eco-numbered-citations">
       <a aria-label="Consultar referencia 3" data-eco-context="#historias-ref-3" href="#historias-ref-3">
        [3]
       </a>
      </span>
     </span>
    </span>
   </article>
   <article class="selva-flip-card" data-eco-card="visual">
    <span class="selva-flip-inner">
     <button aria-label="Ambiente: El territorio también guarda las huellas de nuestras actividades" aria-pressed="false" class="selva-flip-front selva-tema-desafios selva-flip-toggle" type="button">
      <img alt="Imagen satelital de La Pampa y su entorno amazónico, con bosque, áreas intervenidas y cursos de agua." class="selva-curiosidad-foto" decoding="async" height="768" loading="lazy" src="images/pampa-ecoselva.jpg" width="1003"/>
      <span class="selva-flip-frente-texto">
       <span class="selva-flip-categoria">
        Ambiente
       </span>
       <span class="selva-flip-frente-titulo">
        El territorio también guarda las huellas de nuestras actividades
       </span>
      </span>
      <small class="selva-curiosidad-credito">
       Imagen propia: EcoSelva Madre de Dios.
      </small>
     </button>
     <span class="selva-flip-back">
      <span class="selva-curiosidad-encabezado">
       <strong class="selva-curiosidad-titulo">
        Presiones ambientales
       </strong>
      </span>
      <span class="selva-curiosidad-texto">
       La deforestación y la contaminación afectan la diversidad biológica de Madre de Dios. Los diagnósticos ambientales analizan distintas actividades humanas, entre ellas la minería aurífera.
      </span>
      <span aria-label="Etiquetas" class="selva-curiosidad-etiquetas">
       <span>
        Ambiente
       </span>
       <span>
        Territorio
       </span>
       <span>
        Presiones ambientales
       </span>
      </span>
      <span aria-label="Fuentes de esta historia" class="eco-numbered-citations">
       <a aria-label="Consultar referencia 4" data-eco-context="#historias-ref-4" href="#historias-ref-4">
        [4]
       </a>
      </span>
     </span>
    </span>
   </article>
   <article class="selva-flip-card" data-eco-card="visual">
    <span class="selva-flip-inner">
     <button aria-label="Conservación: Conservar no siempre significa dejar de usar" aria-pressed="false" class="selva-flip-front selva-tema-conservacion selva-flip-toggle" type="button">
      <svg aria-hidden="true" class="eco-story-art" focusable="false" viewbox="0 0 96 96">
       <use href="images/ecoselva-planas.svg#conservacion-uso">
       </use>
      </svg>
      <span class="selva-flip-frente-texto">
       <span class="selva-flip-categoria">
        Conservación
       </span>
       <span class="selva-flip-frente-titulo">
        Conservar no siempre significa dejar de usar
       </span>
      </span>
     </button>
     <span class="selva-flip-back">
      <span class="selva-curiosidad-encabezado">
       <strong class="selva-curiosidad-titulo">
        Conservación y uso sostenible
       </strong>
      </span>
      <span class="selva-curiosidad-texto">
       En Tambopata, la protección del bosque se combina con el manejo sostenible de la castaña y el turismo de naturaleza. Las personas que viven y trabajan allí pueden contribuir a su conservación.
      </span>
      <span aria-label="Etiquetas" class="selva-curiosidad-etiquetas">
       <span>
        Conservación
       </span>
       <span>
        Uso sostenible
       </span>
       <span>
        Territorio
       </span>
      </span>
      <span aria-label="Fuentes de esta historia" class="eco-numbered-citations">
       <a aria-label="Consultar referencia 1" data-eco-context="#historias-ref-1" href="#historias-ref-1">
        [1]
       </a>
      </span>
     </span>
    </span>
   </article>
  </div>
  <p class="selva-curiosidad-explorar">
   Continúa el recorrido:
   <a href="#biodiversidad">
    Consulta los registros de flora
    <span aria-hidden="true">
     →
    </span>
   </a>
  </p>
  <dialog aria-labelledby="selva-historia-titulo" class="selva-historia-modal eco-editorial" id="selva-historia-modal">
   <header class="eco-modal-barra">
    <span class="eco-modal-contexto">
     EcoSelva · Historias
    </span>
    <template data-eco-controls="">
     <button aria-label="Cerrar historia" class="selva-historia-cerrar" type="button">
      ×
     </button>
    </template>
   </header>
   <div class="selva-historia-layout">
    <div class="selva-historia-visual">
    </div>
    <div class="selva-historia-contenido">
     <p class="selva-microetiqueta selva-historia-categoria">
     </p>
     <h3 id="selva-historia-titulo">
     </h3>
     <div class="selva-historia-cuerpo">
     </div>
    </div>
   </div>
  </dialog>
  <div class="eco-block-sources" id="historias-fuentes">
   <h3>
    Fuentes de estas historias
   </h3>
   <ol>
    <li id="historias-ref-1">
     <a aria-label="SERNANP, Reserva Nacional Tambopata" data-eco-review-date="2026-10" data-source-institution="SERNANP" data-source-original-url="https://www.gob.pe/institucion/sernanp/informes-publicaciones/1793047-reserva-nacional-tambopata" data-source-publication-date="" data-source-title="Reserva Nacional Tambopata" href="https://www.gob.pe/institucion/sernanp/informes-publicaciones/1793047-reserva-nacional-tambopata" rel="noopener noreferrer" target="_blank">
      SERNANP · Reserva Nacional Tambopata
     </a>
    </li>
    <li id="historias-ref-2">
     <a aria-label="SERNANP, Plan de Manejo del recurso Castaña, Resolución Directoral N.° 006-2025-SERNANP-DGANP" data-eco-review-date="2026-10" data-source-institution="SERNANP" data-source-original-url="https://www.gob.pe/institucion/sernanp/normas-legales/6374223-006-2025-sernanp-dganp" data-source-publication-date="2025" data-source-title="Plan de Manejo del recurso Castaña, Resolución Directoral N.° 006-2025-SERNANP-DGANP" href="https://www.gob.pe/institucion/sernanp/normas-legales/6374223-006-2025-sernanp-dganp" rel="noopener noreferrer" target="_blank">
      SERNANP · Plan de Manejo del recurso Castaña, Resolución Directoral N.° 006-2025-SERNANP-DGANP · 2025
     </a>
    </li>
    <li id="historias-ref-3">
     <a aria-label="Fuente: SERNANP, Reserva Nacional Tambopata, portal Visita Áreas Naturales" data-eco-review-date="2026-10" data-source-institution="SERNANP" data-source-original-url="https://visitaareasnaturales.sernanp.gob.pe/anps/reserva-nacional-tambopata/" data-source-publication-date="" data-source-title="Reserva Nacional Tambopata, portal Visita Áreas Naturales" href="https://visitaareasnaturales.sernanp.gob.pe/anps/reserva-nacional-tambopata/" rel="noopener noreferrer" target="_blank">
      SERNANP · Reserva Nacional Tambopata, portal Visita Áreas Naturales
     </a>
    </li>
    <li id="historias-ref-4">
     <a aria-label="Fuente histórica: Instituto de Investigaciones de la Amazonía Peruana, Estrategia regional de la diversidad biológica de Madre de Dios" data-eco-review-date="" data-source-institution="Instituto de Investigaciones de la Amazonía Peruana (IIAP)" data-source-original-url="https://repositorio.iiap.gob.pe/items/e76fd5b6-b0cc-4ce7-be27-87bfee5c8620" data-source-publication-date="" data-source-title="Estrategia regional de la diversidad biológica de Madre de Dios" href="https://repositorio.iiap.gob.pe/items/e76fd5b6-b0cc-4ce7-be27-87bfee5c8620" rel="noopener noreferrer" target="_blank">
      Instituto de Investigaciones de la Amazonía Peruana (IIAP) · Estrategia regional de la diversidad biológica de Madre de Dios
     </a>
    </li>
   </ol>
  </div>
 </div>
</section>

```

## Biodiversidad y Fauna

```html
<section class="general container" id="biodiversidad">
 <p class="selva-microetiqueta">
  Descubre
 </p>
 <div class="eco-topic-heading">
  <svg aria-hidden="true" class="eco-flat" focusable="false" viewbox="0 0 96 96">
   <use href="images/ecoselva-planas.svg#flora-bosque">
   </use>
  </svg>
  <h2>
   Biodiversidad
  </h2>
 </div>
 <p class="selva-seccion-intro selva-biodiversidad-intro">
  Conoce la diversidad de vida que habita nuestra región y descubre el papel que cumplen sus especies en los ecosistemas amazónicos.
 </p>
 <div aria-label="Biodiversidad" class="selva-biodiversidad-tabs" role="tablist">
  <button aria-controls="selva-biodiversidad-panel-flora" aria-selected="true" class="selva-biodiversidad-tab" id="selva-biodiversidad-tab-flora" role="tab" tabindex="0" type="button">
   Flora
  </button>
  <button aria-controls="selva-biodiversidad-panel-fauna" aria-selected="false" class="selva-biodiversidad-tab" id="selva-biodiversidad-tab-fauna" role="tab" tabindex="-1" type="button">
   Fauna
  </button>
 </div>
 <div aria-labelledby="selva-biodiversidad-tab-flora" class="selva-biodiversidad-panel" id="selva-biodiversidad-panel-flora" role="tabpanel" tabindex="0">
  <p class="selva-biodiversidad-panel-intro">
   Árboles, palmeras y otras plantas sostienen relaciones ecológicas y poseen usos forestales, alimentarios, medicinales y culturales.
  </p>
  <div class="eco-flora-preview">
   <article class="eco-card" data-eco-card="stat">
    <svg aria-hidden="true" class="eco-flat" focusable="false" viewbox="0 0 96 96">
     <use href="images/ecoselva-planas.svg#flora-bosque">
     </use>
    </svg>
    <h3>
     Maderables
    </h3>
    <p>
     Árboles documentados para el aprovechamiento de madera; su registro no autoriza la corta.
    </p>
    <a href="flora.html#flora-especies-maderables">
     Conocer shihuahuaco, cedro y capirona →
    </a>
   </article>
   <article class="eco-card" data-eco-card="stat">
    <svg aria-hidden="true" class="eco-flat" focusable="false" viewbox="0 0 96 96">
     <use href="images/ecoselva-planas.svg#flora-castana">
     </use>
    </svg>
    <h3>
     No maderables
    </h3>
    <p>
     Semillas, frutos y materiales del bosque, con usos alimentarios, medicinales y culturales.
    </p>
    <a href="flora.html#flora-especies-no-maderables">
     Conocer castaña, aguaje y huasái →
    </a>
   </article>
  </div>
  <p class="eco-preview-note">
   Los usos pueden superponerse. Los totales regionales de medicinales y alimenticias siguen en revisión.
  </p>
  <a class="eco-button" href="flora.html">
   Explorar especies, usos y productos del bosque →
  </a>
 </div>
 <div aria-labelledby="selva-biodiversidad-tab-fauna" class="selva-biodiversidad-panel selva-biodiversidad-fauna" hidden="" id="selva-biodiversidad-panel-fauna" role="tabpanel" tabindex="0">
  <p class="selva-microetiqueta selva-fauna-cifras">
   En cifras
  </p>
  <div aria-label="Registros regionales de fauna" class="selva-fauna-stats">
   <article class="selva-fauna-stat selva-fauna-stat--mamiferos" data-eco-card="stat" data-fauna-categoria="mamiferos">
    <svg aria-hidden="true" class="selva-fauna-icono eco-flat" focusable="false" viewbox="0 0 96 96">
     <use href="images/ecoselva-planas.svg#fauna-mamiferos">
     </use>
    </svg>
    <h3>
     Mamíferos
    </h3>
    <div aria-label="214 especies de mamíferos registradas" class="selva-fauna-numero" role="img">
     <span aria-hidden="true" data-fauna-count="214">
      214
     </span>
    </div>
    <p class="selva-fauna-descripcion">
     especies registradas
    </p>
    <div data-fauna-action-label="Ver mamíferos" data-fauna-actions="mamiferos">
    </div>
   </article>
   <article class="selva-fauna-stat selva-fauna-stat--aves" data-eco-card="stat" data-fauna-categoria="aves">
    <svg aria-hidden="true" class="selva-fauna-icono eco-flat" focusable="false" viewbox="0 0 96 96">
     <use href="images/ecoselva-planas.svg#fauna-aves">
     </use>
    </svg>
    <h3>
     Aves
    </h3>
    <div aria-label="755 especies de aves registradas" class="selva-fauna-numero" role="img">
     <span aria-hidden="true" data-fauna-count="755">
      755
     </span>
    </div>
    <p class="selva-fauna-descripcion">
     especies registradas
    </p>
    <div data-fauna-action-label="Ver aves" data-fauna-actions="aves">
    </div>
   </article>
   <article class="selva-fauna-stat selva-fauna-stat--reptiles" data-eco-card="stat" data-fauna-categoria="reptiles">
    <svg aria-hidden="true" class="selva-fauna-icono eco-flat" focusable="false" viewbox="0 0 96 96">
     <use href="images/ecoselva-planas.svg#fauna-reptiles">
     </use>
    </svg>
    <h3>
     Reptiles
    </h3>
    <div aria-label="132 especies de reptiles reportadas" class="selva-fauna-numero" role="img">
     <span aria-hidden="true" data-fauna-count="132">
      132
     </span>
    </div>
    <p class="selva-fauna-descripcion">
     especies reportadas
    </p>
    <div data-fauna-action-label="Ver reptiles" data-fauna-actions="reptiles">
    </div>
   </article>
   <article class="selva-fauna-stat selva-fauna-stat--anfibios" data-eco-card="stat" data-fauna-categoria="anfibios">
    <svg aria-hidden="true" class="selva-fauna-icono eco-flat" focusable="false" viewbox="0 0 96 96">
     <use href="images/ecoselva-planas.svg#fauna-anfibios">
     </use>
    </svg>
    <h3>
     Anfibios
    </h3>
    <div aria-label="124 especies de anfibios registradas" class="selva-fauna-numero" role="img">
     <span aria-hidden="true" data-fauna-count="124">
      124
     </span>
    </div>
    <p class="selva-fauna-descripcion">
     especies registradas
    </p>
    <div data-fauna-action-label="Ver anfibios" data-fauna-actions="anfibios">
    </div>
   </article>
  </div>
  <p class="selva-fauna-nota">
   Los inventarios regionales pueden ampliarse con nuevos registros.
  </p>
  <div class="selva-fauna-fuente eco-block-sources">
   <h3>
    Fuente de las cifras de fauna
   </h3>
   <ol>
    <li>
     <a href="https://cdn.www.gob.pe/uploads/document/file/7432540/6332224-19-madre-de-dios_informacion-para-el-planeamiento-con-enfoque-territorial_dic2024.pdf?v=1735362686" rel="noopener noreferrer" target="_blank">
      CEPLAN · Madre de Dios: Información para el Planeamiento con enfoque territorial, diciembre de 2024.
     </a>
    </li>
   </ol>
  </div>
  <p class="selva-fauna-proxima" hidden="">
   Peces · próxima categoría
  </p>
  <dialog aria-labelledby="selva-fauna-modal-titulo" class="selva-fauna-modal eco-editorial" data-eco-presentation="drawer" id="selva-fauna-modal">
   <header class="eco-modal-barra">
    <span class="eco-modal-contexto">
     EcoSelva · Fauna
    </span>
    <template data-eco-controls="">
     <button aria-label="Cerrar ventana de fauna" class="selva-fauna-modal-cerrar" type="button">
      ×
     </button>
    </template>
   </header>
   <div class="selva-fauna-modal-layout">
    <div class="selva-fauna-modal-contenido">
     <p class="selva-microetiqueta selva-fauna-modal-categoria">
     </p>
     <h3 id="selva-fauna-modal-titulo">
      Registros de fauna
     </h3>
     <div class="selva-fauna-modal-cuerpo">
     </div>
    </div>
    <figure class="selva-fauna-modal-imagen">
     <img alt="" data-fauna-photo="" decoding="async" height="600" loading="lazy" width="900"/>
     <figcaption>
      <small class="selva-fauna-foto-credito">
      </small>
     </figcaption>
    </figure>
   </div>
  </dialog>
 </div>
</section>

```

## Ambiente

```html
<section class="selva-ambiente reveal" id="ambiente">
 <div class="container">
  <p class="selva-microetiqueta selva-microetiqueta--tierra">
   Comprende
  </p>
  <h2>
   Ambiente
  </h2>
  <svg aria-hidden="true" class="eco-separator" focusable="false" viewbox="0 0 320 32">
   <use href="images/ecoselva-planas.svg#separador-rio">
   </use>
  </svg>
  <p class="selva-ambiente-subtitulo">
   Cambios y conservación
  </p>
  <p class="selva-seccion-intro">
   Comprende cómo las actividades humanas y los procesos naturales transforman el territorio, y conoce las respuestas que buscan conservar y recuperar sus ecosistemas.
  </p>
  <div class="selva-ambiente-areas">
   <article class="selva-ambiente-area" data-ambiente-area="bosques">
    <span aria-hidden="true" class="selva-ambiente-numero">
     01
    </span>
    <svg aria-hidden="true" class="eco-flat" focusable="false" viewbox="0 0 96 96">
     <use href="images/ecoselva-planas.svg#flora-bosque">
     </use>
    </svg>
    <h3>
     Transformaciones del bosque
    </h3>
    <p class="selva-ambiente-area-descripcion">
     La pérdida y degradación de cobertura cambian el paisaje. Conoce cómo se estudian esos cambios, los incendios y sus límites de interpretación.
    </p>
    <a class="eco-text-link selva-ambiente-acceso" href="territorio.html#territorio-cambios">
     Ver pérdida y degradación del bosque →
    </a>
   </article>
   <article class="selva-ambiente-area" data-ambiente-area="agua">
    <span aria-hidden="true" class="selva-ambiente-numero">
     02
    </span>
    <svg aria-hidden="true" class="eco-flat" focusable="false" viewbox="0 0 96 96">
     <use href="images/ecoselva-planas.svg#residuos">
     </use>
    </svg>
    <h3>
     Agua y contaminación
    </h3>
    <p class="selva-ambiente-area-descripcion">
     La minería y otras presiones pueden afectar el agua. El contexto de CINCIA permite distinguir lo documentado de lo que este visor no mide.
    </p>
    <a class="eco-text-link selva-ambiente-acceso" href="territorio.html#territorio-fuente-cincia">
     Leer los estudios sobre contaminación →
    </a>
   </article>
   <article class="selva-ambiente-area" data-ambiente-area="clima">
    <span aria-hidden="true" class="selva-ambiente-numero">
     03
    </span>
    <svg aria-hidden="true" class="eco-flat" focusable="false" viewbox="0 0 96 96">
     <use href="images/ecoselva-planas.svg#comprender">
     </use>
    </svg>
    <h3>
     Observar para recuperar
    </h3>
    <p class="selva-ambiente-area-descripcion">
     El trabajo de campo, los datos geográficos y las imágenes satelitales ayudan a comprender los cambios. Sus índices necesitan contexto y validación.
    </p>
    <a class="eco-text-link selva-ambiente-acceso" href="territorio.html#territorio-ciencia">
     Comprender imágenes y trabajo de campo →
    </a>
   </article>
   <article class="selva-ambiente-area" data-ambiente-area="conservacion">
    <span aria-hidden="true" class="selva-ambiente-numero">
     04
    </span>
    <svg aria-hidden="true" class="eco-flat" focusable="false" viewbox="0 0 96 96">
     <use href="images/ecoselva-planas.svg#conservar">
     </use>
    </svg>
    <h3>
     Conservación y gestión
    </h3>
    <p class="selva-ambiente-area-descripcion">
     Conoce las categorías y formas de gestión de las áreas naturales protegidas nacionales presentes en Madre de Dios.
    </p>
    <a class="eco-text-link selva-ambiente-acceso" href="areas-protegidas.html">
     Consultar fichas de áreas protegidas →
    </a>
   </article>
  </div>
 </div>
</section>

```

## Ciencia

```html
<section class="selva-investigaciones reveal" id="investigaciones">
 <video aria-hidden="true" class="selva-investigaciones-video" loop="" muted="" playsinline="" poster="images/investigaciones-poster.jpg" preload="metadata" tabindex="-1">
  <source data-src="videos/investigaciones-ecoselva.webm" type="video/webm"/>
  <source data-src="videos/investigaciones-ecoselva.mp4" type="video/mp4"/>
 </video>
 <div class="container selva-investigaciones-contenido">
  <p class="selva-microetiqueta">
   Ciencia
  </p>
  <h2>
   Investigaciones para comprender
  </h2>
  <p class="selva-proximamente">
   Estudios sobre el uso del bosque y el conocimiento de los recolectores, con sus métodos y límites de interpretación.
  </p>
  <div class="eco-science-links">
   <a class="eco-button" href="biblioteca.html#titulo-doc-rockwell">
    Uso múltiple del bosque · Rockwell, 2015 →
   </a>
   <a class="eco-button eco-button-outline" href="biblioteca.html#titulo-doc-thomas">
    Conocimiento local · Thomas, 2017 →
   </a>
  </div>
  <a class="selva-investigaciones-etiqueta" href="#colabora">
   Aportar un estudio sobre Madre de Dios →
  </a>
 </div>
</section>

```

## Accesos a las lecturas

```html
<section aria-labelledby="explorar-titulo" class="eco-discover" id="seguir-explorando">
 <div class="container">
  <header class="eco-discover-heading">
   <div>
    <p class="eco-eyebrow">
     Leer · mirar · explorar
    </p>
    <h2 id="explorar-titulo">
     Sigue el hilo del conocimiento
    </h2>
    <p>
     De una especie a su territorio, y de una historia a sus fuentes.
    </p>
   </div>
   <a class="eco-button eco-button-outline" href="biblioteca.html">
    Explorar biblioteca
    <svg aria-hidden="true" class="eco-icon" focusable="false" viewbox="0 0 24 24">
     <use href="images/ecoselva-iconos.svg#biblioteca">
     </use>
    </svg>
   </a>
  </header>
  <div class="eco-bento">
   <article class="eco-card eco-bento-feature" data-eco-card="visual">
    <svg aria-hidden="true" class="eco-flat eco-ficha-preview" focusable="false" viewbox="0 0 96 96">
     <use href="images/ecoselva-planas.svg#flora-castana">
     </use>
    </svg>
    <div>
     <p class="eco-eyebrow">
      Flora · ficha educativa
     </p>
     <h3>
      Castaña amazónica
     </h3>
     <p>
      Lo esencial, los procesos del bosque y los datos que puedes consultar.
     </p>
     <a class="eco-button" href="fichas/castana.html">
      Abrir ficha de castaña amazónica →
     </a>
    </div>
   </article>
   <a class="eco-card eco-bento-map" data-eco-card="map" href="territorio.html">
    <svg aria-hidden="true" class="eco-icon" focusable="false" viewbox="0 0 24 24">
     <use href="images/ecoselva-iconos.svg#mapas">
     </use>
    </svg>
    <div>
     <p class="eco-eyebrow">
      Atlas · capas y registros
     </p>
     <h3>
      Leer el territorio
     </h3>
     <p>
      Acércate a los bosques, los ríos y los humedales.
     </p>
     <span class="eco-text-link">
      Seleccionar las capas del mapa →
     </span>
    </div>
   </a>
  </div>
 </div>
</section>

```

## Sobre EcoSelva y secuencia

```html
<section class="info-1" id="quienes-somos">
 <div class="info-content container">
  <div class="selva-sobre-layout">
   <div class="selva-sobre-presentacion">
    <div class="selva-sobre-contenido">
     <p class="selva-microetiqueta selva-microetiqueta--clara">
      Nuestra iniciativa
     </p>
     <h2>
      Sobre EcoSelva
     </h2>
     <p class="selva-sobre-principal">
      EcoSelva Madre de Dios es una iniciativa de educación ambiental que pone el conocimiento sobre el territorio al alcance de la comunidad.
     </p>
     <ol aria-label="Nuestro recorrido educativo" class="eco-learning-sequence">
      <li>
       <svg aria-hidden="true" class="eco-flat" focusable="false" viewbox="0 0 96 96">
        <use href="images/ecoselva-planas.svg#conocer">
        </use>
       </svg>
       <strong>
        Conocer
       </strong>
      </li>
      <li>
       <svg aria-hidden="true" class="eco-flat" focusable="false" viewbox="0 0 96 96">
        <use href="images/ecoselva-planas.svg#comprender">
        </use>
       </svg>
       <strong>
        Comprender
       </strong>
      </li>
      <li>
       <svg aria-hidden="true" class="eco-flat" focusable="false" viewbox="0 0 96 96">
        <use href="images/ecoselva-planas.svg#valorar">
        </use>
       </svg>
       <strong>
        Valorar
       </strong>
      </li>
      <li>
       <svg aria-hidden="true" class="eco-flat" focusable="false" viewbox="0 0 96 96">
        <use href="images/ecoselva-planas.svg#conservar">
        </use>
       </svg>
       <strong>
        Conservar
       </strong>
      </li>
     </ol>
    </div>
    <div class="selva-sobre-imagen">
     <img alt="Persona de espaldas con los brazos levantados en un camino entre árboles al atardecer." decoding="async" height="768" loading="lazy" src="images/sobre-ecoselva.jpg" width="917"/>
    </div>
   </div>
   <div class="selva-sobre-proposito">
    <article aria-labelledby="selva-sobre-mision" class="selva-sobre-bloque">
     <h3 id="selva-sobre-mision">
      <svg aria-hidden="true" class="selva-sobre-icono" focusable="false" viewbox="0 0 24 24">
       <path d="M5 20c1-7 5-11 12-15M5 16C1 8 9 3 21 3c0 12-6 19-13 15">
       </path>
      </svg>
      Misión
     </h3>
     <p>
      Acercar el conocimiento sobre la biodiversidad y el ambiente de Madre de Dios mediante contenidos educativos claros y confiables que promuevan su valoración y conservación.
     </p>
    </article>
    <article aria-labelledby="selva-sobre-vision" class="selva-sobre-bloque">
     <h3 id="selva-sobre-vision">
      <svg aria-hidden="true" class="selva-sobre-icono" focusable="false" viewbox="0 0 24 24">
       <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z">
       </path>
       <circle cx="12" cy="12" r="3">
       </circle>
      </svg>
      Visión
     </h3>
     <p>
      Ser un referente de educación ambiental sobre Madre de Dios, acercando el conocimiento científico y ambiental a más personas.
     </p>
    </article>
    <article aria-labelledby="selva-sobre-editorial" class="selva-sobre-bloque selva-sobre-editorial">
     <h3 id="selva-sobre-editorial">
      Responsabilidad editorial
     </h3>
     <p>
      Cada contenido remite a su evidencia y reconoce sus límites.
     </p>
     <a href="fuentes-metodologia.html">
      Conoce nuestra metodología y fuentes
      <span aria-hidden="true">
       →
      </span>
     </a>
    </article>
   </div>
  </div>
 </div>
</section>

```

## Colabora

```html
<section aria-labelledby="colabora-titulo" class="selva-colabora reveal" id="colabora">
 <div class="container selva-colabora-layout">
  <header class="selva-colabora-encabezado">
   <h2 id="colabora-titulo">
    Colabora con EcoSelva
   </h2>
   <p>
    Comparte una investigación realizada en Madre de Dios para acercar sus hallazgos a la comunidad.
   </p>
  </header>
  <ol class="selva-colabora-pasos">
   <li class="selva-colabora-paso">
    <svg aria-hidden="true" class="eco-flat" focusable="false" viewbox="0 0 96 96">
     <use href="images/ecoselva-planas.svg#colabora-enviar">
     </use>
    </svg>
    <h3>
     1. Envía tu estudio
    </h3>
    <p>
     Indica título, ámbito, resumen, enlace y contacto.
    </p>
   </li>
   <li class="selva-colabora-paso">
    <svg aria-hidden="true" class="eco-flat" focusable="false" viewbox="0 0 96 96">
     <use href="images/ecoselva-planas.svg#colabora-revisar">
     </use>
    </svg>
    <h3>
     2. Revisamos las fuentes
    </h3>
    <p>
     Comprobamos su relación con Madre de Dios y su respaldo documental.
    </p>
   </li>
   <li class="selva-colabora-paso">
    <svg aria-hidden="true" class="eco-flat" focusable="false" viewbox="0 0 96 96">
     <use href="images/ecoselva-planas.svg#colabora-acordar">
     </use>
    </svg>
    <h3>
     3. Acordamos la adaptación
    </h3>
    <p>
     Coordinamos contigo cualquier incorporación educativa.
    </p>
   </li>
  </ol>
  <div class="selva-colabora-accion">
   <a aria-label="Enviar mi investigación; abre el formulario en una pestaña nueva" class="btn-1 selva-colabora-boton" href="https://docs.google.com/forms/d/e/1FAIpQLSc98981DSaQP1b8FAmxDJmj9CqJH9FF74LvEj1nmuzzkrkFqA/viewform?usp=header" rel="noopener noreferrer" target="_blank">
    Enviar mi investigación ↗
   </a>
  </div>
  <p class="selva-colabora-compromiso">
   Respetamos la autoría y las fuentes; el envío no implica una publicación automática.
  </p>
 </div>
</section>

```

## Pie de contacto

```html
<footer class="footer" id="contacto">
 <div class="container selva-footer-layout">
  <div class="selva-footer-identidad">
   <a aria-label="EcoSelva Madre de Dios, inicio" class="selva-footer-logo" href="#inicio">
    <img alt="EcoSelva Madre de Dios · Educar para Preservar" decoding="async" height="768" loading="lazy" src="images/logo-ecoselva-educacion.png" width="768"/>
   </a>
   <p class="selva-footer-nombre">
    <strong>
     EcoSelva Madre de Dios
    </strong>
   </p>
   <p class="selva-footer-lema">
    Educar para Preservar
   </p>
   <p class="selva-footer-descripcion">
    Historias, datos y recursos para aprender sobre Madre de Dios.
   </p>
   <nav aria-label="Navegación secundaria" class="selva-footer-nav">
    <a href="biblioteca.html">
     Biblioteca
    </a>
    <a href="#quienes-somos">
     Sobre EcoSelva
    </a>
    <a href="#investigaciones">
     Investigaciones
    </a>
    <a href="#colabora">
     Colabora
    </a>
   </nav>
  </div>
  <div class="selva-footer-contacto">
   <p class="selva-microetiqueta selva-microetiqueta--clara">
    Conversemos
   </p>
   <h2>
    Contacto
   </h2>
   <p>
    Escríbenos para consultas y sugerencias sobre EcoSelva.
   </p>
   <a class="eco-contact-email" href="mailto:ecoselvamadrededios@gmail.com">
    ecoselvamadrededios@gmail.com
   </a>
   <p>
    Para compartir un estudio, consulta los requisitos en
    <a href="#colabora">
     Colabora
    </a>
    .
   </p>
  </div>
 </div>
</footer>

```

## Diálogos, controles diferidos y regreso al origen

```js
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

```

## Apertura de Fauna e historias

```js
    const faunaModal = document.querySelector("#selva-fauna-modal");
    if (faunaModal) {
        let faunaGroups, activeGroup, back;
        const body = faunaModal.querySelector(".selva-fauna-modal-cuerpo");
        const title = faunaModal.querySelector("#selva-fauna-modal-titulo");
        window.ecoDialog.register(faunaModal, { closeSelector: '.selva-fauna-modal-cerrar' });
        const element = (tag, text, className) => {
            const node = document.createElement(tag);
            if (text) node.textContent = text;
            if (className) node.className = className;
            return node;
        };
        const link = (text, url) => {
            const node = element("a", text); node.href = url;
            node.target = "_blank"; node.rel = "noopener noreferrer";
            return node;
        };
        const references = entries => {
            const footer = element("div", null, "eco-block-sources");
            const list = element("ol");
            [...new Map(entries.map(([label, url]) => [url, [label, url]])).values()].forEach(([label, url]) => {
                const item = element("li"); item.append(link(label, url)); list.append(item);
            });
            footer.append(element("h4", "Fuentes de los registros"), list); return footer;
        };
        const showGroup = (focusTitle = false) => {
            const group = faunaGroups[activeGroup]; body.replaceChildren();
            title.textContent = `${group.name}: especies documentadas`;
            if (back) back.hidden = true;
            const list = element("ul", null, "selva-fauna-especies");
            group.species.forEach(species => {
                const item = element("li"), content = element("div");
                const illustration = document.querySelector(`[data-fauna-categoria="${activeGroup}"] .selva-fauna-icono`).cloneNode(true);
                item.append(illustration);
                content.append(element("h4", species[0]), element("em", species[1]), element("p", `Registro: ${species[2] || group.place}.`));
                const button = element("button", `Ver ${species[0]} →`, "selva-fauna-conocer");
                button.type = "button"; button.setAttribute("aria-label", `Ver ficha de ${species[0]}`);
                button.addEventListener("click", () => showSpecies(species)); content.append(button); item.append(content); list.append(item);
            });
            body.append(list, references(group.species.map(species => [species[4] || group.reference, species[3] || group.source])));
            if (focusTitle) { title.tabIndex = -1; title.focus({ preventScroll: true }); faunaModal.scrollTop = 0; }
        };
        const showSpecies = species => {
            const group = faunaGroups[activeGroup]; body.replaceChildren(); title.textContent = species[0];
            if (!back) {
                back = element("button", null, "selva-fauna-volver"); back.type = "button";
                back.addEventListener("click", () => showGroup(true)); title.before(back);
            }
            back.hidden = false; back.textContent = `← Volver a ${group.name.toLowerCase()}`;
            body.append(element("em", species[1], "selva-fauna-cientifico"));
            const record = element("dl", null, "selva-fauna-ficha");
            record.append(element("dt", "Dónde se ha registrado"), element("dd", species[2] || group.place));
            body.append(record, references([[species[4] || group.reference, species[3] || group.source]]));
            if (species !== group.species[0]) body.append(element("p", `La fotografía de referencia corresponde a ${group.species[0][0].toLowerCase()}.`, "selva-fauna-ficha-revision"));
            back.focus({ preventScroll: true }); faunaModal.scrollTop = 0;
        };
        const validGroup = group => group && typeof group.name === 'string' && group.name.trim()
            && typeof group.place === 'string' && typeof group.source === 'string' && /^https:\/\//.test(group.source)
            && typeof group.photo === 'string' && Number.isFinite(group.photoWidth) && Number.isFinite(group.photoHeight)
            && Array.isArray(group.species) && group.species.length > 0
            && group.species.every(species => Array.isArray(species) && species.slice(0, 2).length === 2
                && species.slice(0, 2).every(value => typeof value === 'string' && value.trim()));
        const openGroup = async button => {
            if (faunaModal.open) return;
            button.disabled = true; button.setAttribute("aria-busy", "true");
            try {
                if (!faunaGroups) {
                    const response = await fetch(window.ecoResourceURL("datos/fauna/fichas.json"));
                    if (!response.ok) throw new Error("No se pudo cargar Fauna.");
                    faunaGroups = await response.json();
                }
                const group = faunaGroups[button.dataset.faunaExplorar];
                if (!validGroup(group)) throw new Error('La ficha no contiene registros completos.');
                if (document.querySelector("dialog[open]")) return;
                activeGroup = button.dataset.faunaExplorar;
                button.parentElement.querySelector(".eco-document-error")?.remove();
                faunaModal.querySelector(".selva-fauna-modal-categoria").textContent = "Registros locales";
                const photo = faunaModal.querySelector("[data-fauna-photo]");
                photo.src = group.photo; photo.alt = `${group.species[0][0]} (${group.species[0][1]}). ${group.photoPlace}.`;
                photo.width = group.photoWidth; photo.height = group.photoHeight;
                faunaModal.querySelector(".selva-fauna-foto-credito").replaceChildren(
                    document.createTextNode(`Foto: ${group.author} · `), link("Wikimedia Commons", group.photoSource),
                    document.createTextNode(" · "), link(group.license, group.licenseUrl), document.createTextNode(`. ${group.photoPlace}.`));
                showGroup(); window.ecoDialog.open(faunaModal, button);
            } catch {
                faunaGroups = undefined;
                const feedback = element("p", "No se pudo cargar una ficha completa. Puedes volver a intentarlo.", "eco-document-error");
                feedback.setAttribute("role", "status"); button.parentElement.querySelector(".eco-document-error")?.remove();
                button.parentElement.append(feedback);
            } finally { button.disabled = false; button.removeAttribute("aria-busy"); }
        };
        const prepareFaunaActions = () => {
            const panel = document.getElementById('selva-biodiversidad-panel-fauna');
            if (panel.hidden) return;
            panel.querySelectorAll('[data-fauna-actions]').forEach(host => {
                if (host.querySelector('button')) return;
                const button = element('button', host.dataset.faunaActionLabel + ' →', 'selva-fauna-explorar');
                button.type = 'button'; button.dataset.faunaExplorar = host.dataset.faunaActions;
                button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-controls', faunaModal.id);
                button.addEventListener('click', () => openGroup(button)); host.append(button);
            });
        };
        biodiversity.addEventListener('eco:panelopen', prepareFaunaActions);
        prepareFaunaActions();
    }

    const storyModal = document.querySelector("#selva-historia-modal");
    if (storyModal) {
        window.ecoDialog.register(storyModal, { closeSelector: '.selva-historia-cerrar' });
        document.querySelectorAll("#sabias-que .selva-flip-card").forEach((card) => {
            const button = card.querySelector(".selva-flip-toggle");
            const content = card.querySelector(".selva-flip-back");
            if (!button || !content) return;
            content.hidden = true;
            button.removeAttribute("aria-pressed");
            button.setAttribute("aria-haspopup", "dialog");
            button.setAttribute("aria-controls", "selva-historia-modal");
            const cue = document.createElement("span");
            cue.className = "selva-historia-descubrir";
            cue.textContent = {
                Flora: "Conocer la castaña →", Fauna: "Leer sobre el jaguar →",
                Ecosistemas: "Distinguir los ambientes →", Agua: "Comprender las cochas →",
                Ambiente: "Reconocer las presiones →", Conservación: "Conocer el uso sostenible →"
            }[button.querySelector(".selva-flip-categoria").textContent] || "Leer esta historia →";
            cue.setAttribute("aria-hidden", "true");
            button.querySelector(".selva-flip-frente-texto").append(cue);
            button.addEventListener("click", () => {
                if (storyModal.open || !content.textContent.trim()) return;
                storyModal.querySelector(".selva-historia-categoria").textContent = button.querySelector(".selva-flip-categoria").textContent;
                storyModal.querySelector("#selva-historia-titulo").textContent = button.querySelector(".selva-flip-frente-titulo").textContent;
                const visual = storyModal.querySelector(".selva-historia-visual");
                const illustration = button.querySelector("img, .eco-story-art");
                if (!illustration) return;
                const picture = illustration.cloneNode(true);
                picture.removeAttribute("sizes");
                visual.replaceChildren(picture);
                const credit = button.querySelector(".selva-curiosidad-foto-credito, .selva-curiosidad-credito");
                if (credit) visual.append(credit.cloneNode(true));
                // Clonar mantiene texto, etiquetas, enlaces y todos los atributos de las fuentes.
                const body = storyModal.querySelector(".selva-historia-cuerpo");
                body.replaceChildren(...[...content.childNodes].map((node) => node.cloneNode(true)));
                window.ecoDialog.open(storyModal, button);
            });
        });

    }


```

## Reglas de distribución

```css
/* Lectura editorial: escala compartida, ilustraciones planas y bloques sin repeticiones. */
.eco-site{font-size:var(--text-body)}
.eco-site :is(p,blockquote,figcaption,dd){max-width:var(--reading-max)}
.eco-flat{display:block;flex:none;width:64px;height:64px;fill:var(--forest);stroke:none}
.eco-flat *{stroke:none}
.eco-separator{display:block;width:min(320px,100%);height:32px;margin:var(--space-3) 0;stroke:none}
.eco-block-sources{margin-top:var(--space-4);padding-top:var(--space-2);border-top:1px solid var(--line);font-size:var(--text-note);color:var(--muted)}
.eco-block-sources h3{font-size:var(--text-note);margin-bottom:var(--space-1)}
.eco-block-sources ol{padding-left:var(--space-3);display:grid;gap:var(--space-1)}
.eco-block-sources li{list-style:decimal;font-size:var(--text-note)}
.eco-block-sources a{text-decoration:underline;text-underline-offset:4px}
.eco-site .conoce-provincias{align-items:start}
.eco-site .conoce-provincia summary .eco-flat{width:56px;height:56px;grid-row:1/4;grid-column:1}
.eco-site .conoce-provincia summary{display:grid;grid-template-columns:56px 1fr;gap:var(--space-1) var(--space-2)}
.eco-site .conoce-provincia summary :is(strong,span){grid-column:2}
.eco-site .conoce-datos dd{font-size:var(--text-title)}
.eco-story-art{width:144px;height:144px;align-self:center;margin:auto;stroke:none}
.selva-historia-visual>.eco-story-art{width:min(240px,80%);height:auto;aspect-ratio:1;min-height:0;object-fit:contain;margin:auto}
.eco-numbered-citations{display:flex;gap:var(--space-1);margin-top:var(--space-2);font-size:var(--text-note)}
.eco-numbered-citations a{min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;text-decoration:underline}
.eco-site .eco-flora-preview .eco-card{padding:var(--space-3);display:grid;gap:var(--space-1);grid-template-columns:64px minmax(0,1fr)}
.eco-site .eco-flora-preview .eco-flat{grid-row:1/4;width:64px;height:64px}
.eco-site .eco-flora-preview .eco-card :is(h3,p,a){grid-column:2;margin:0}
.eco-site .selva-fauna-icono.eco-flat{width:64px;height:64px;stroke:none}
.eco-site .selva-fauna-stats{gap:var(--space-2)}
.eco-site .selva-fauna-especies>li{grid-template-columns:56px minmax(0,1fr);align-items:start;padding:var(--space-2);gap:var(--space-2)}
.eco-site .selva-fauna-especies .eco-flat{width:48px;height:48px;stroke:none}
.eco-site .selva-fauna-stat :is(h3,p){max-width:100%}
.eco-site .selva-fauna-stat [data-fauna-actions]{margin-top:auto}
.eco-site .selva-fauna-modal-imagen img{aspect-ratio:4/3;object-fit:cover;width:100%;height:auto;min-height:0}
.eco-site .selva-ambiente-area{grid-template-columns:64px minmax(0,1fr);gap:var(--space-1) var(--space-2);padding:var(--space-3)}
.eco-site .selva-ambiente-area .eco-flat{grid-column:1;grid-row:2/5;width:64px;height:64px}
.eco-site .selva-ambiente-area :is(h3,p,a){grid-column:2;max-width:var(--reading-max)}
.eco-site .selva-ambiente-area .selva-ambiente-numero{grid-column:2}
.eco-site #investigaciones .eco-separator{fill:var(--sand)}
@media(max-width:640px){.eco-site .selva-ambiente-area{grid-template-columns:48px minmax(0,1fr);padding:var(--space-2)}.eco-site .selva-ambiente-area .eco-flat{width:48px;height:48px}}
.eco-site .eco-connected-nav a{grid-template-columns:64px 1fr;padding:var(--space-2);gap:var(--space-2)}
.eco-site .eco-connected-nav .eco-flat{width:64px;height:64px}
.eco-site .eco-bento-feature>.eco-ficha-preview{position:static;width:144px;height:144px;margin:auto;aspect-ratio:1;stroke:none}
.eco-site .eco-bento-feature{grid-template-columns:160px minmax(0,1fr)}
@media(max-width:640px){.eco-site .eco-bento-feature{grid-template-columns:1fr}.eco-site .eco-connected-nav a{grid-template-columns:48px 1fr}.eco-site .eco-connected-nav .eco-flat{width:48px;height:48px}}
.eco-learning-sequence{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--space-2);margin-top:var(--space-3);list-style:none}
.eco-learning-sequence li{display:grid;justify-items:center;gap:var(--space-1);font-size:var(--text-note);list-style:none;min-width:0}
.eco-learning-sequence .eco-flat{width:48px;height:48px;stroke:none}
.eco-site .selva-sobre-imagen img{aspect-ratio:4/3;object-fit:cover;height:auto}
@media(max-width:640px){.eco-learning-sequence{grid-template-columns:repeat(2,minmax(0,1fr))}}
.eco-site .selva-colabora-layout{max-width:var(--layout-content);gap:var(--space-3)}
.eco-site .selva-colabora-encabezado{text-align:left;max-width:none;margin:0}
.eco-site .selva-colabora-encabezado h2{font-size:var(--text-display);margin-bottom:var(--space-2)}
.eco-site .selva-colabora-pasos{list-style:none;gap:var(--space-3);padding:0;margin:0}
.eco-site .selva-colabora-paso{list-style:none;min-height:0;padding:var(--space-3);gap:var(--space-2)}
.eco-site .selva-colabora-paso h3{font-size:var(--text-title);line-height:1.35;margin:0}
.eco-site .selva-colabora-paso p{font-size:var(--text-body);margin:0}
.eco-site .selva-colabora-accion{align-items:start;gap:var(--space-1)}
.eco-site .selva-colabora-compromiso{max-width:var(--reading-max);margin:0;padding-top:var(--space-2);font-size:var(--text-note);line-height:1.6}
@media(max-width:767px){.eco-site .selva-colabora-pasos{grid-template-columns:1fr}.eco-site .selva-colabora-paso{display:grid;grid-template-columns:48px 1fr;column-gap:var(--space-2)}.eco-site .selva-colabora-paso .eco-flat{width:48px;height:48px;grid-row:1/3}.eco-site .selva-colabora-paso :is(h3,p){grid-column:2}}
.eco-site .flora-references{display:grid;gap:var(--space-2);padding-left:var(--space-3);grid-column:1/-1}
.eco-site .flora-references>li{list-style:decimal;min-width:0;max-width:none}
.eco-site .flora-references .flora-fuente{padding:var(--space-2);max-width:none}
.eco-site .flora-references p{font-size:var(--text-note)}
.eco-site .selva-flora-stat-icono.eco-flat{stroke:none}
.eco-site .ficha-foto img{aspect-ratio:745/858;object-fit:cover;width:100%;height:auto}
.eco-site .ficha-documentos{padding-left:var(--space-3)}
.eco-site .ficha-documentos>li{list-style:decimal}
.eco-site .ficha-tabla{min-width:640px}
.eco-site .ficha-tabla-marco{overflow-x:auto;max-width:100%}
.eco-site .ficha-serie-separada tr:first-child>*{border-top:3px solid var(--line)}
@media(max-width:640px){.eco-site .eco-connected-nav{grid-template-columns:1fr}.eco-site .eco-connected-nav a>div{min-width:0}.eco-site .eco-connected-nav strong{overflow-wrap:anywhere}}
.eco-site .territorio-method-links{display:grid;gap:var(--space-2);grid-template-columns:repeat(2,minmax(0,1fr));margin-block:var(--space-3)}
.eco-site .territorio-method-links a{padding:var(--space-2);border-radius:var(--radius-md);background:var(--paper);font-size:var(--text-body)}
.eco-site .metodologia details{margin-block:var(--space-2);padding:var(--space-2);border:1px solid var(--line);border-radius:var(--radius-md)}
.eco-site .metodologia summary{font-size:var(--text-body);line-height:1.6;cursor:pointer}
.eco-site .metodologia dl{margin-top:var(--space-2);font-size:var(--text-body);line-height:1.7}
.eco-site .metodologia dt{font-weight:700;margin-top:var(--space-2)}
@media(max-width:767px){.eco-site .territorio-method-links{grid-template-columns:1fr}}
.eco-source-records{padding-left:var(--space-3);display:grid;gap:var(--space-2)}
.eco-source-records>li{list-style:decimal;max-width:none;min-width:0}
.eco-source-records .historia-registro{margin:0}
.eco-site img{object-fit:cover}
.eco-site .conoce-localizador img{aspect-ratio:360/405}
.eco-site .selva-curiosidad-foto{aspect-ratio:4/3}
.eco-site .eco-image-view img{object-fit:contain;aspect-ratio:auto}
.eco-site .eco-footer-review{font-size:var(--text-note)}
.eco-site #colabora .selva-colabora-layout{grid-template-columns:minmax(0,1fr);gap:var(--space-3)}
.eco-site #colabora .selva-colabora-encabezado::after{content:none}
.eco-site #colabora .selva-colabora-boton{width:fit-content;min-height:48px;justify-content:center;padding:var(--space-2) var(--space-3)}
.eco-site #colabora .selva-colabora-compromiso{background:none;border:0;border-radius:0;padding:0;box-shadow:none}
.eco-site .eco-learning-sequence .eco-flat{width:64px;height:64px;padding:var(--space-1);background:var(--paper);border-radius:var(--radius-md)}
.eco-site #biodiversidad .eco-topic-heading{justify-content:center;gap:var(--space-2)}
.eco-site #biodiversidad .eco-topic-heading h2{width:auto;margin:0;text-align:left}
.eco-site .territorio-castana-art{width:min(240px,100%);height:auto;aspect-ratio:1;justify-self:center}
.eco-site .anp-galeria>.anp-foto:only-child{grid-column:1/-1;width:min(100%,800px);justify-self:center}
/* Fauna: orden de lectura continuo, cifras estables y acciones al final. */
.eco-site #biodiversidad .selva-fauna-stat{grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto auto auto 1fr;grid-template-areas:"icono" "titulo" "numero" "descripcion" "accion";gap:var(--space-1)}
.eco-site #biodiversidad .selva-fauna-stat>[data-fauna-actions]{grid-area:accion;align-self:end}

```

## Tabla canónica de castaña

```html
<div aria-label="Tabla de registros de castaña, desplazable horizontalmente" class="ficha-tabla-marco" role="region" tabindex="0">
 <table class="ficha-tabla">
  <caption>
   Producción registrada: cada valor conserva su categoría y ámbito
  </caption>
  <thead>
   <tr>
    <th scope="col">
     Categoría
    </th>
    <th scope="col">
     Ámbito
    </th>
    <th scope="col">
     Año
    </th>
    <th scope="col">
     Valor
    </th>
    <th scope="col">
     Unidad
    </th>
    <th scope="col">
     Referencia
    </th>
   </tr>
  </thead>
  <tbody aria-label="Serie regional con cáscara">
   <tr data-registro-resumen="registro-2021">
    <td data-campo="indicador" data-valor="Producción registrada de castaña con cáscara">
     Con cáscara
    </td>
    <td data-campo="ámbito" data-valor="Madre de Dios">
     Madre de Dios
    </td>
    <td data-campo="año" data-valor="2021">
     2021
    </td>
    <td data-campo="valor" data-valor="8638185">
     8 638 185
    </td>
    <td data-campo="unidad" data-valor="kg">
     kg
    </td>
    <td>
     <a aria-label="Consultar contexto de castaña con cáscara, Madre de Dios 2021" data-eco-record="#registro-2021" href="#registro-2021">
      [1]
     </a>
    </td>
   </tr>
   <tr data-registro-resumen="registro-2022">
    <td data-campo="indicador" data-valor="Producción registrada de castaña con cáscara">
     Con cáscara
    </td>
    <td data-campo="ámbito" data-valor="Madre de Dios">
     Madre de Dios
    </td>
    <td data-campo="año" data-valor="2022">
     2022
    </td>
    <td data-campo="valor" data-valor="14447374.26">
     14 447 374,26
    </td>
    <td data-campo="unidad" data-valor="kg">
     kg
    </td>
    <td>
     <a aria-label="Consultar contexto de castaña con cáscara, Madre de Dios 2022" data-eco-record="#registro-2022" href="#registro-2022">
      [2]
     </a>
    </td>
   </tr>
   <tr data-registro-resumen="registro-2023">
    <td data-campo="indicador" data-valor="Producción registrada de castaña con cáscara">
     Con cáscara
    </td>
    <td data-campo="ámbito" data-valor="Madre de Dios">
     Madre de Dios
    </td>
    <td data-campo="año" data-valor="2023">
     2023
    </td>
    <td data-campo="valor" data-valor="10156532.82">
     10 156 532,82
    </td>
    <td data-campo="unidad" data-valor="kg">
     kg
    </td>
    <td>
     <a aria-label="Consultar contexto de castaña con cáscara, Madre de Dios 2023" data-eco-record="#registro-2023" href="#registro-2023">
      [3]
     </a>
    </td>
   </tr>
  </tbody>
  <tbody aria-label="Registros fuera de la serie regional con cáscara" class="ficha-serie-separada">
   <tr data-registro-resumen="registro-peru-2021">
    <td data-campo="indicador" data-valor="Producción registrada de castaña con cáscara">
     Con cáscara
    </td>
    <td data-campo="ámbito" data-valor="Perú">
     Perú
    </td>
    <td data-campo="año" data-valor="2021">
     2021
    </td>
    <td data-campo="valor" data-valor="8638185.12">
     8 638 185,12
    </td>
    <td data-campo="unidad" data-valor="kg">
     kg
    </td>
    <td>
     <a aria-label="Consultar contexto de castaña con cáscara, Perú 2021" data-eco-record="#registro-peru-2021" href="#registro-peru-2021">
      [1]
     </a>
    </td>
   </tr>
   <tr data-registro-resumen="registro-pelada-2023">
    <td data-campo="indicador" data-valor="Producción registrada de castaña pelada">
     Pelada
    </td>
    <td data-campo="ámbito" data-valor="Madre de Dios">
     Madre de Dios
    </td>
    <td data-campo="año" data-valor="2023">
     2023
    </td>
    <td data-campo="valor" data-valor="3903605.76">
     3 903 605,76
    </td>
    <td data-campo="unidad" data-valor="kg">
     kg
    </td>
    <td>
     <a aria-label="Consultar contexto de castaña pelada, Madre de Dios 2023" data-eco-record="#registro-pelada-2023" href="#registro-pelada-2023">
      [3]
     </a>
    </td>
   </tr>
  </tbody>
 </table>
</div>

```

## Generadores de Flora y castaña

Los cambios permanentes de citas, documentación y valores únicos están en `herramientas/actualizar_flora.py` y `herramientas/actualizar_ficha_castana.py`; el comando `python herramientas/actualizar_sitio.py` los regenera.

## Nota común de las fichas de áreas protegidas

Los seis enlaces metodológicos conservan sus anclas y remiten a una única explicación compartida.

```html
<details id="metodo-anp-fuente-manu"><summary>Alcance compartido de las seis fichas oficiales</summary><ul><li>Parque Nacional del Manu</li><li id="metodo-anp-fuente-bahuaja">Parque Nacional Bahuaja-Sonene</li><li id="metodo-anp-fuente-alto-purus">Parque Nacional Alto Purús</li><li id="metodo-anp-fuente-tambopata">Reserva Nacional Tambopata</li><li id="metodo-anp-fuente-amarakaeri">Reserva Comunal Amarakaeri</li><li id="metodo-anp-fuente-purus">Reserva Comunal Purús</li></ul><p>Descripción específica del ANP: objetivos, ecosistemas, elementos destacados y relación con personas. Sus cifras se contrastan con el listado legal de 2026 y los mapas departamentales.</p></details>
```

## Fotografías sin repetición

La fotografía de castaña queda en su ficha; el destacado de Territorio utiliza el símbolo plano. Collpa Colorado permanece en la cabecera de Áreas protegidas y su galería conserva una única fotografía del Manu.

```html
<svg class="eco-flat territorio-castana-art" viewBox="0 0 96 96" aria-hidden="true" focusable="false"><use href="images/ecoselva-planas.svg#flora-castana"></use></svg>
<figure class="anp-foto"><img src="images/conservacion/manu.webp" width="1280" height="960" loading="lazy" decoding="async" alt="Río de agua marrón, bancos de arena y bosque bajo un cielo nublado en el Parque Nacional del Manu."><figcaption><strong>Parque Nacional del Manu · río Manu</strong><span>Erfil · 16/07/2012 · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a> · <a aria-label="Referencia 31: Procedencia ↗" data-anp-fuente="" href="#fuente-foto-manu">[31]</a></span></figcaption></figure>
```

## Héroe con un único acceso

```html
<header class="header" id="inicio">
 <div class="header-content container">
  <div class="header-txt">
   <p class="selva-hero-kicker">
    Madre de Dios · Amazonía peruana
   </p>
   <h1 class="hero-titulo">
    Nuestra selva,
    <br/>
    nuestro futuro
   </h1>
   <svg aria-label="Línea inspirada en los ríos de la Amazonía" class="selva-rio-trazo" role="img" viewbox="0 0 360 34">
    <path d="M3 18c42-19 65 17 106-2s58-18 83-2 49 20 75 1 53-14 90 1">
    </path>
   </svg>
   <p class="hero-descripcion">
    Educación ambiental para conocer, valorar y preservar Madre de Dios.
   </p>
   <a class="btn-1" href="#conoce-madre-de-dios">
    Conoce Madre de Dios
    <span aria-hidden="true">
     →
    </span>
   </a>
  </div>
 </div>
</header>

```

## Enlaces de compatibilidad con títulos específicos

Se conservan los 86 identificadores y destinos antiguos.

```html
<div class="eco-legacy-links">
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-cifras-titulo" href="flora.html#flora-cifras-titulo" id="flora-cifras-titulo">
  Ver Registros documentados en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-maderables-titulo" href="flora.html#flora-maderables-titulo" id="flora-maderables-titulo">
  Ver Productos maderables en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-no-maderables-titulo" href="flora.html#flora-no-maderables-titulo" id="flora-no-maderables-titulo">
  Ver Productos forestales no maderables en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-castana-titulo" href="flora.html#flora-castana-titulo" id="flora-castana-titulo">
  Ver Castaña amazónica en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-medicinales-titulo" href="flora.html#flora-medicinales-titulo" id="flora-medicinales-titulo">
  Ver Plantas medicinales en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-alimentos-titulo" href="flora.html#flora-alimentos-titulo" id="flora-alimentos-titulo">
  Ver Alimentos y frutos del bosque en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-cultura-titulo" href="flora.html#flora-cultura-titulo" id="flora-cultura-titulo">
  Ver El bosque también es conocimiento en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-recorrido-titulo" href="flora.html#flora-recorrido-titulo" id="flora-recorrido-titulo">
  Ver Del bosque al producto en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-caso-castana-titulo" href="flora.html#flora-caso-castana-titulo" id="flora-caso-castana-titulo">
  Ver Castaña en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-caso-madera-titulo" href="flora.html#flora-caso-madera-titulo" id="flora-caso-madera-titulo">
  Ver Madera en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-caso-aguaje-titulo" href="flora.html#flora-caso-aguaje-titulo" id="flora-caso-aguaje-titulo">
  Ver Aguaje en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-caso-paca-titulo" href="flora.html#flora-caso-paca-titulo" id="flora-caso-paca-titulo">
  Ver Paca en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-caso-medicinal-titulo" href="flora.html#flora-caso-medicinal-titulo" id="flora-caso-medicinal-titulo">
  Ver Planta medicinal en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-relaciones-titulo" href="flora.html#flora-relaciones-titulo" id="flora-relaciones-titulo">
  Ver La planta sigue siendo parte del bosque en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-manejo-titulo" href="flora.html#flora-manejo-titulo" id="flora-manejo-titulo">
  Ver ¿Aprovechar significa destruir? en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-economia-titulo" href="flora.html#flora-economia-titulo" id="flora-economia-titulo">
  Ver Cuando el bosque también sostiene economías en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-seguir-titulo" href="flora.html#flora-seguir-titulo" id="flora-seguir-titulo">
  Ver De la especie al territorio y a su evidencia en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-fuentes-titulo" href="flora.html#flora-fuentes-titulo" id="flora-fuentes-titulo">
  Ver Fuentes y alcance de esta lectura en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-bosques-titulo" href="territorio.html#territorio-bosques-titulo" id="territorio-bosques-titulo">
  Ver La Amazonía no es un solo bosque en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-rios-titulo" href="territorio.html#territorio-rios-titulo" id="territorio-rios-titulo">
  Ver El agua dibuja el territorio en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-humedales-titulo" href="territorio.html#territorio-humedales-titulo" id="territorio-humedales-titulo">
  Ver Donde el agua cambia la vida en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-conexiones-titulo" href="territorio.html#territorio-conexiones-titulo" id="territorio-conexiones-titulo">
  Ver Una red, no una lista de ambientes en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-beneficios-titulo" href="territorio.html#territorio-beneficios-titulo" id="territorio-beneficios-titulo">
  Ver ¿Qué nos brindan estos ecosistemas? en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-cambios-titulo" href="territorio.html#territorio-cambios-titulo" id="territorio-cambios-titulo">
  Ver ¿Qué pasa cuando se altera el territorio? en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-ciencia-titulo" href="territorio.html#territorio-ciencia-titulo" id="territorio-ciencia-titulo">
  Ver ¿Cómo estudiamos el territorio? en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-actividades-titulo" href="territorio.html#territorio-actividades-titulo" id="territorio-actividades-titulo">
  Ver Mira, relaciona y explora en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-metodologia-titulo" href="territorio.html#territorio-metodologia-titulo" id="territorio-metodologia-titulo">
  Ver Cada capa tiene una historia en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#selva-territorio-fuentes-titulo" href="territorio.html#selva-territorio-fuentes-titulo" id="selva-territorio-fuentes-titulo">
  Ver Fuentes y datos del registro en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#selva-territorio-fuentes-modal" href="territorio.html#selva-territorio-fuentes-modal" id="selva-territorio-fuentes-modal">
  Ver Fuentes y datos del registro en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#conoce-fuentes-geografia" href="territorio.html#conoce-fuentes-geografia" id="conoce-fuentes-geografia">
  Ver Un paisaje que cambia con el relieve en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#conoce-fuentes-personas" href="territorio.html#conoce-fuentes-personas" id="conoce-fuentes-personas">
  Ver Referencias sobre personas y territorio en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-especies-maderables" href="flora.html#flora-especies-maderables" id="flora-especies-maderables">
  Ver Especies maderables documentadas en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-especies-no-maderables" href="flora.html#flora-especies-no-maderables" id="flora-especies-no-maderables">
  Ver Especies no maderables documentadas en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-maderables" href="flora.html#flora-maderables" id="flora-maderables">
  Ver Productos maderables en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-no-maderables" href="flora.html#flora-no-maderables" id="flora-no-maderables">
  Ver Productos forestales no maderables en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-medicinales" href="flora.html#flora-medicinales" id="flora-medicinales">
  Ver Plantas medicinales en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-alimentos" href="flora.html#flora-alimentos" id="flora-alimentos">
  Ver Alimentos y frutos del bosque en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-cultura" href="flora.html#flora-cultura" id="flora-cultura">
  Ver El bosque también es conocimiento en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-caso-castana" href="flora.html#flora-caso-castana" id="flora-caso-castana">
  Ver Castaña en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-caso-madera" href="flora.html#flora-caso-madera" id="flora-caso-madera">
  Ver Madera en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-caso-aguaje" href="flora.html#flora-caso-aguaje" id="flora-caso-aguaje">
  Ver Aguaje en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-caso-paca" href="flora.html#flora-caso-paca" id="flora-caso-paca">
  Ver Paca en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-caso-medicinal" href="flora.html#flora-caso-medicinal" id="flora-caso-medicinal">
  Ver Planta medicinal en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-recorrido" href="flora.html#flora-recorrido" id="flora-recorrido">
  Ver Del bosque al producto en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-relaciones" href="flora.html#flora-relaciones" id="flora-relaciones">
  Ver La planta sigue siendo parte del bosque en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-manejo" href="flora.html#flora-manejo" id="flora-manejo">
  Ver ¿Aprovechar significa destruir? en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-economia" href="flora.html#flora-economia" id="flora-economia">
  Ver Cuando el bosque también sostiene economías en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-seguir" href="flora.html#flora-seguir" id="flora-seguir">
  Ver De la especie al territorio y a su evidencia en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-fuente-catalogo" href="flora.html#flora-fuente-catalogo" id="flora-fuente-catalogo">
  Ver Catálogo de las especies forestales maderables de la Amazonía y la Yunga Peruana en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-fuente-pfnm" href="flora.html#flora-fuente-pfnm" id="flora-fuente-pfnm">
  Ver Guía de Productos Forestales no Maderables en Madre de Dios en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-fuente-manejo" href="flora.html#flora-fuente-manejo" id="flora-fuente-manejo">
  Ver Manual de Buenas Prácticas de Aprovechamiento Forestal en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-fuente-aguaje" href="flora.html#flora-fuente-aguaje" id="flora-fuente-aguaje">
  Ver El aguaje: Superalimento amazónico, y los beneficios del manejo y conservación de los aguajales para el desarrollo regional amazónico en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-fuente-bambu" href="flora.html#flora-fuente-bambu" id="flora-fuente-bambu">
  Ver Secado de tablillas de bambú nativo en la Amazonía peruana en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-fuente-cobertura" href="flora.html#flora-fuente-cobertura" id="flora-fuente-cobertura">
  Ver Mapa Nacional de Cobertura Vegetal. Memoria descriptiva en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-fuente-bdpi" href="flora.html#flora-fuente-bdpi" id="flora-fuente-bdpi">
  Ver Ficha del pueblo Ese Eja en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-fuente-cesteria" href="flora.html#flora-fuente-cesteria" id="flora-fuente-cesteria">
  Ver Resolución Viceministerial N.° 046-2018-VMPCIC-MC en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-fuente-osinfor" href="flora.html#flora-fuente-osinfor" id="flora-fuente-osinfor">
  Ver Análisis del aprovechamiento de madera en concesiones para castaña en Madre de Dios en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-fuente-dispersion" href="flora.html#flora-fuente-dispersion" id="flora-fuente-dispersion">
  Ver Seed dispersal of the Brazil nut tree (Bertholletia excelsa) by scatter-hoarding rodents in a central amazonian forest en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-fuente-rockwell" href="flora.html#flora-fuente-rockwell" id="flora-fuente-rockwell">
  Ver Nut Production in Bertholletia excelsa across a Logged Forest Mosaic: Implications for Multiple Forest Use en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-fuentes" href="flora.html#flora-fuentes" id="flora-fuentes">
  Ver Fuentes y alcance de esta lectura en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="flora.html#flora-productos-usos" href="flora.html#flora-productos-usos" id="flora-productos-usos">
  Ver Una planta, muchas relaciones en Flora →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-provincias" href="territorio.html#territorio-provincias" id="territorio-provincias">
  Ver Explora el territorio en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-panel" href="territorio.html#territorio-panel" id="territorio-panel">
  Ver Registros del mapa de Madre de Dios en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-castanales" href="territorio.html#territorio-castanales" id="territorio-castanales">
  Ver Castañales de Madre de Dios en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-bosques" href="territorio.html#territorio-bosques" id="territorio-bosques">
  Ver La Amazonía no es un solo bosque en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-rios" href="territorio.html#territorio-rios" id="territorio-rios">
  Ver El agua dibuja el territorio en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-aguajales" href="territorio.html#territorio-aguajales" id="territorio-aguajales">
  Ver Aguajales en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-humedales" href="territorio.html#territorio-humedales" id="territorio-humedales">
  Ver Donde el agua cambia la vida en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-conexiones" href="territorio.html#territorio-conexiones" id="territorio-conexiones">
  Ver Una red, no una lista de ambientes en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-beneficios" href="territorio.html#territorio-beneficios" id="territorio-beneficios">
  Ver ¿Qué nos brindan estos ecosistemas? en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-cambios" href="territorio.html#territorio-cambios" id="territorio-cambios">
  Ver ¿Qué pasa cuando se altera el territorio? en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-ciencia" href="territorio.html#territorio-ciencia" id="territorio-ciencia">
  Ver ¿Cómo estudiamos el territorio? en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-funcion-bosque" href="territorio.html#territorio-funcion-bosque" id="territorio-funcion-bosque">
  Ver Funciones del bosque en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-funcion-rio" href="territorio.html#territorio-funcion-rio" id="territorio-funcion-rio">
  Ver Funciones del río en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-funcion-humedal" href="territorio.html#territorio-funcion-humedal" id="territorio-funcion-humedal">
  Ver Funciones del humedal en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-actividades" href="territorio.html#territorio-actividades" id="territorio-actividades">
  Ver Mira, relaciona y explora en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-fuente-cobertura" href="territorio.html#territorio-fuente-cobertura" id="territorio-fuente-cobertura">
  Ver Mapa Nacional de Cobertura Vegetal — MINAM 2015 en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-fuente-ecosistemas" href="territorio.html#territorio-fuente-ecosistemas" id="territorio-fuente-ecosistemas">
  Ver Mapa Nacional de Ecosistemas del Perú — MINAM 2019 en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-fuente-aguaje" href="territorio.html#territorio-fuente-aguaje" id="territorio-fuente-aguaje">
  Ver El aguaje: superalimento amazónico y conservación de los aguajales en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-fuente-anp" href="territorio.html#territorio-fuente-anp" id="territorio-fuente-anp">
  Ver Descripciones oficiales de Tambopata, Manu y Bahuaja-Sonene en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-fuente-cincia" href="territorio.html#territorio-fuente-cincia" id="territorio-fuente-cincia">
  Ver Inventario biológico rápido del río Madre de Dios y sus tributarios en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-fuente-mercurio" href="territorio.html#territorio-fuente-mercurio" id="territorio-fuente-mercurio">
  Ver Amazon forests capture high levels of atmospheric mercury pollution from artisanal gold mining en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-fuente-incendios" href="territorio.html#territorio-fuente-incendios" id="territorio-fuente-incendios">
  Ver Prevención de incendios forestales en Madre de Dios en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-fuente-geobosques" href="territorio.html#territorio-fuente-geobosques" id="territorio-fuente-geobosques">
  Ver Geobosques: monitoreo de cobertura y pérdida de bosques en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-fuente-satelites" href="territorio.html#territorio-fuente-satelites" id="territorio-fuente-satelites">
  Ver Sentinel-2 e índices NDVI y NBR en Territorio →
 </a>
 <a class="eco-legacy-bridge" data-eco-destino="territorio.html#territorio-metodologia" href="territorio.html#territorio-metodologia" id="territorio-metodologia">
  Ver Cada capa tiene una historia en Territorio →
 </a>
</div>

```

## Ilustración de conservación y uso

```xml
<symbol id="conservacion-uso" viewBox="0 0 96 96"><rect x="22" y="40" width="10" height="42" rx="4" fill="var(--earth,#c77a3d)"/><path fill="var(--forest,#163d2b)" d="M27 10C11 10 8 23 13 30 0 36 6 54 20 54h14c14 0 20-18 7-24 5-7 2-20-14-20Z"/><rect x="42" y="58" width="46" height="26" rx="10" fill="var(--earth,#c77a3d)"/><g fill="var(--sand,#cfb45c)"><ellipse cx="53" cy="55" rx="7" ry="12" transform="rotate(-25 53 55)"/><ellipse cx="68" cy="51" rx="7" ry="12"/><ellipse cx="80" cy="56" rx="6" ry="11" transform="rotate(25 80 56)"/></g></symbol>
```
