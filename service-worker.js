/* RangeTrack offline shell. Update CACHE_VERSION when the app's file list changes. */
const CACHE_VERSION = 'rangetrack-modular-v40';
const ASSETS = [
  './', './index.html',
  './css/main.css', './css/exports.css', './css/shooters.css', './css/summary.css', './css/dashboard.css', './css/management.css',
  './js/core.js', './js/sessions.js', './js/dashboard.js',
  './js/course-editor.js', './js/roster.js', './js/scoring.js',
  './js/reports.js', './js/totals.js', './js/scoring-navigation.js', './js/bootstrap.js'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('rangetrack-') && key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL('./', self.registration.scope).pathname)) return;
  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.put(event.request, copy)));
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') return caches.match('./index.html');
      return Response.error();
    })
  );
});
