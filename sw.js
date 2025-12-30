const CACHE_NAME = 'tanya-ari-v1';
const OFFLINE_URL = '/index.html'; // Sudah diubah dari .php ke .html

// 1. Install & Cache (Offline Support)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pastikan semua file di bawah ini ada di root folder htdocs
      return cache.addAll([
        OFFLINE_URL, 
        '/manifest.json',
        '/unnamed_copy_192x192.png',
        '/unnamed_copy_512x512.png'
      ]);
    })
  );
  self.skipWaiting();
});

// 2. Fetch Logic (Has Logic & Offline Support)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request) || caches.match(OFFLINE_URL);
    })
  );
});

// 3. Background Sync
self.addEventListener('sync', (event) => {
  console.log('Syncing in background:', event.tag);
});

// 4. Periodic Background Sync (Periodic Sync)
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic sync running:', event.tag);
});

// 5. Push Notifications (Push Notifications)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Pesan baru dari Tanya Ari',
    icon: '/unnamed_copy_192x192.png',
    badge: '/unnamed_copy_192x192.png'
  };
  event.waitUntil(
    self.registration.showNotification('Tanya Ari Aja', options)
  );
});

// 6. Widget Interaction (Widgets)
self.addEventListener('widgetclick', (event) => {
  if (event.action === 'open_app') {
    event.waitUntil(clients.openWindow('/'));
  }
});
