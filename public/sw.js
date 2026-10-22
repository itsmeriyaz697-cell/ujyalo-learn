/*
  Ujyalo Learn service worker.

  Scope decisions:
  - Caches only static, non-personal assets (app shell, icons, hashed bundles).
  - NEVER caches /api responses, Firebase requests or any student data.
  - Navigation requests prefer the network so deployments update promptly,
    with a cached shell as an offline fallback.
*/
const VERSION = 'ujyalo-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const SHELL_URLS = ['/', '/index.html', '/offline.html', '/favicon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

const isPrivate = (url) =>
  url.pathname.startsWith('/api/') ||
  url.hostname.includes('googleapis.com') ||
  url.hostname.includes('firebaseio.com') ||
  url.hostname.includes('firebasestorage.googleapis.com') ||
  url.hostname.includes('identitytoolkit');

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Only handle same-origin and explicitly safe resources.
  if (isPrivate(url)) return;
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', copy)).catch(() => {});
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || (await caches.match('/index.html')) || (await caches.match('/offline.html')) || Response.error();
        }),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/') || /\.(css|js|woff2?|png|svg|ico|webp)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok && response.type === 'basic') {
              const copy = response.clone();
              caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
            }
            return response;
          }),
      ),
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
