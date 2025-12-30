const CACHE_NAME = 'tanya-ari-v2'; // Ganti versi jika ada update
const OFFLINE_URL = './index.html'; // Gunakan Relative Path

// Daftar asset kritis. 
// PERINGATAN: Jika satu saja file ini tidak ada (404), SW GAGAL install.
// Pastikan file-file ini ada di folder yang sama dengan sw.js
const ASSETS_TO_CACHE = [
  OFFLINE_URL,
  './manifest.json'
  // './unnamed_copy_192x192.png' // Hapus comment ini HANYA jika file gambar benar-benar ada
];

// 1. INSTALL
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Paksa SW baru aktif segera
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching assets');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
          console.error("SW: Gagal cache asset. Pastikan semua file ada!", err);
      });
    })
  );
});

// 2. ACTIVATE
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    }).then(() => self.clients.claim()) // Ambil alih kontrol halaman segera
  );
});

// 3. FETCH STRATEGY
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. JANGAN CACHE API & POST REQUESTS
  // Jika fetch ke api.php atau method POST, gunakan Network Only.
  // Jangan berikan index.html jika gagal (agar tidak error JSON parse).
  if (event.request.method !== 'GET' || url.pathname.includes('api.php')) {
    return; // Biarkan browser menangani secara default (Network Only)
  }

  // B. STRATEGI UNTUK HALAMAN & ASET (Network First, Fallback Cache)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Jika berhasil fetch dari network, simpan copy ke cache (agar update)
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Jika offline, cari di cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          // Jika tidak ada di cache, dan request adalah navigasi halaman (HTML), berikan Offline Page
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});

// 4. PUSH NOTIFICATION
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.text() : 'Pesan baru dari Tanya Ari';
  event.waitUntil(
    self.registration.showNotification('Tanya Ari Aja', {
      body: data,
      icon: './unnamed_copy_192x192.png', // Pastikan file ini ada atau hapus baris ini
      badge: './unnamed_copy_192x192.png',
      vibrate: [100, 50, 100]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('./'));
});
