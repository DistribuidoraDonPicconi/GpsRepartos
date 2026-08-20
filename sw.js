// Service Worker mínimo: solo lo necesario para que la app sea
// instalable como PWA. No cachea Google Maps, así el mapa y los
// pines nunca quedan desactualizados.
const CACHE_NAME = 'ruta-reparto-v1';
const ARCHIVOS_CACHE = ['./index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(nombres.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Nunca cachear Google Maps (siempre tiene que pedirse a la red, para
// no mostrar mapas/pines desactualizados). El resto del cascarón usa
// "red primero, caché de respaldo" para mantenerlo actualizado, y
// sirve desde caché si falla la red (offline).
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  const esDinamico =
    url.hostname.includes('maps.googleapis.com') ||
    url.hostname.includes('maps.gstatic.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('googleapis.com');

  if (esDinamico || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        const copia = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
        return resp;
      })
      .catch(() => caches.match(event.request))
  );
});
