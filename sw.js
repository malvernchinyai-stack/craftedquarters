/* Crafted Quarters Docs – service worker (offline-first) */
const CACHE = 'cq-docs-v1.2.0';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './css/app.css',
  './js/db.js', './js/core.js', './js/signature.js', './js/pdf.js', './js/app.js',
  './vendor/jspdf.umd.min.js', './vendor/jspdf.plugin.autotable.min.js',
  './assets/logo-white.png', './assets/logo-pdf.jpg', './assets/logo-full.png', './assets/logo-mark.png',
  './assets/icon-192.png', './assets/icon-512.png', './assets/icon-maskable-512.png',
  './assets/apple-touch-icon.png', './assets/favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
      return hit || net;
    })
  );
});
