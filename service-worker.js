const CACHE_VERSION = 'ecoselva-2026-10-q';
const CORE = [
  '/',
  '/index.html',
  '/territorio.html',
  '/ambiente.html',
  '/flora.html',
  '/historia.html',
  '/areas-protegidas.html',
  '/biblioteca.html',
  '/fuentes-metodologia.html',
  '/fichas/castana.html',
  '/manifest.json',
  '/assets/eco-tokens.css',
  '/assets/eco-base.css',
  '/assets/eco-editorial.css',
  '/assets/eco-lecturas.css',
  '/assets/eco-patterns.css',
  '/ambiente.css',
  '/historia.css',
  '/areas-protegidas.css',
  '/fichas/ficha.css',
  '/assets/eco-base.js',
  '/assets/eco-editorial.js',
  '/territorio.js',
  '/flora.js',
  '/historia.js',
  '/areas-protegidas.js',
  '/fichas/ficha.js',
  '/datos/fauna/fichas.json',
  '/datos/flora/lectura.json',
  '/images/logo-ecoselva-educacion-256.webp',
  '/images/icono-app-ecoselva.svg',
  '/images/favicon-64.png',
  '/images/lago-sandoval-768.webp',
  '/images/rio-tambopata-andreas-koenig.jpg',
  '/images/conservacion/manu.webp',
  '/images/manu-ribera-as578.jpg',
  '/images/castanal-amazonia-peru.jpg',
  '/images/mapas/minimapa-tambopata.svg',
  '/images/mapas/minimapa-manu.svg',
  '/images/mapas/minimapa-tahuamanu.svg',
  '/images/mapas/conoce-madre-de-dios-atlas.svg',
  '/images/fondos/eco-fondo-relieve-claro.jpg',
  '/images/fondos/eco-fondo-editorial-crema.jpg',
  '/images/fondos/eco-fondo-bosque-claro.jpg',
  '/images/fondos/eco-fondo-verde-oscuro.jpg',
  '/images/conexion-biodiversidad.jpg',
  '/images/conexion-ambiente.jpg',
  '/images/conexion-territorio.jpg',
  '/images/conexion-ciencia.jpg',
  '/images/agua-madre-de-dios.jpg',
  '/images/territorio-observacion-campo.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('ecoselva-') && key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

const matchIgnoringVersion = request => caches.match(request, { ignoreSearch: true });

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const target = new URL(request.url);
  if (target.origin !== self.location.origin) return;
  if (request.headers.has('range') || ['video', 'audio'].includes(request.destination) || /\.(?:mp4|webm|mp3|ogg)$/i.test(target.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_VERSION);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        return (await matchIgnoringVersion(request)) || (await caches.match('/index.html')) || new Response(
          '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>EcoSelva sin conexión</title><body style="font-family:system-ui;padding:2rem;max-width:42rem;margin:auto"><h1>EcoSelva sin conexión</h1><p>Esta página todavía no fue almacenada en este dispositivo. Vuelve a conectarte una vez para guardarla automáticamente.</p><p><a href="/">Ir al inicio guardado</a></p></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }

  event.respondWith((async () => {
    // Una versión nueva debe descargarse antes de recurrir a otra versión offline.
    const cached = await caches.match(request);
    const update = fetch(request).then(async response => {
      if (response.ok) {
        const cache = await caches.open(CACHE_VERSION);
        await cache.put(request, response.clone());
      }
      return response;
    }).catch(() => null);
    event.waitUntil(update);
    return cached || (await update) || (await matchIgnoringVersion(request)) || new Response('', { status: 504, statusText: 'Sin conexión' });
  })());
});
