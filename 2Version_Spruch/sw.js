const CACHE_NAME = 'spruch-des-tages-v4';

const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/favicon-32.png'
];

// ── Install: Assets vorab cachen ──────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Cache befüllt');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// ── Activate: Alte Caches löschen ────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Alter Cache gelöscht:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: Cache-first mit Netzwerk-Fallback ──────────────────────
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// ── Push: Server-Push-Benachrichtigungen ──────────────────────────
self.addEventListener('push', event => {
  const data    = event.data ? event.data.json() : {};
  const title   = data.title || '🌅 Spruch des Tages';
  const options = {
    body:  data.body  || 'Dein heutiger Spruch wartet auf dich!',
    icon:  '/icons/icon-192.png',
    badge: '/icons/favicon-32.png',
    vibrate: [100, 50, 100]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click: App öffnen ────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
