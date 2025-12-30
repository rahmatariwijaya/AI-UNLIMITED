const CACHE_NAME = 'tanya-ari-v1';
const OFFLINE_URL = '/index.html';

const ASSETS_TO_CACHE = [
  OFFLINE_URL,
  '/manifest.json',
  '/unnamed_copy_192x192.png',
  '/unnamed_copy_512x512.png'
];

// 1. Install - Caching assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Activate - Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
});

// 3. Fetch - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request) || caches.match(OFFLINE_URL);
    })
  );
});

// 4. Push Notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Pesan baru dari Tanya Ari',
    icon: '/unnamed_copy_192x192.png',
    badge: '/unnamed_copy_192x192.png',
    vibrate: [100, 50, 100]
  };
  event.waitUntil(self.registration.showNotification('Tanya Ari Aja', options));
});

// 5. Handle Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

// Background Sync & Widgets (Tetap seperti kode Anda)
self.addEventListener('sync', (event) => console.log('Syncing:', event.tag));
self.addEventListener('widgetclick', (event) => {
  if (event.action === 'open_app') event.waitUntil(clients.openWindow('/'));
});
