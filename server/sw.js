/*
 * Service worker – umožní nainstalovat aplikaci na plochu telefonu (PWA)
 * a zobrazit základní rozhraní i když není zrovna dostupná síť.
 * Data (kalendář, zprávy, počasí) se v budoucnu budou načítat ze serveru,
 * takže pro API volání používejte síť ("network first"), viz níže.
 */
const CACHE = 'rodina-v9';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/api.js',
  './js/store.js',
  './js/ui.js',
  './js/appearance.js',
  './js/pixel.js',
  './js/utils.js',
  './js/icons.js',
  './js/views/login.js',
  './js/views/ai.js',
  './js/views/home.js',
  './js/views/calendar.js',
  './js/views/photos.js',
  './js/views/chat.js',
  './js/views/weather.js',
  './js/views/files.js',
  './js/views/tv.js',
  './js/views/settings.js',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // API volání (až je napojíš): vždy zkus síť, fallback z cache.
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // Kostra aplikace: nejdřív cache, pak síť.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((cache) => cache.put(req, copy));
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
