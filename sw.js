// 1. Nama Cache (Naikkan versi jadi v3 jika kamu melakukan update besar)
const CACHE_NAME = 'tanya-ari-v3'; 
const OFFLINE_URL = './index.html'; 

// 2. Daftar Aset yang Wajib Disimpan (Gunakan jalur relatif ./)
// PENTING: Jika file gambar belum ada di GitHub, biarkan tetap di-comment (pakai //) 
// agar Service Worker tidak gagal install.
const ASSETS_TO_CACHE = [
  OFFLINE_URL,
  './manifest.json',
  // './unnamed_copy_192x192.png', 
  // './unnamed_copy_512x512.png'
];

// --- PROSES INSTALL ---
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Mengunduh aset ke cache...');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
          console.error("SW: Gagal simpan cache. Cek apakah ada file yang typo/hilang!", err);
      });
    })
  );
});

// --- PROSES AKTIVASI ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('SW: Menghapus cache lama:', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

// --- PROSES PENGAMBILAN DATA (FETCH) ---
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. JANGAN CACHE API (CORS Proxy & InfinityFree)
  if (event.request.method !== 'GET' || url.href.includes('corsproxy.io') || url.pathname.includes('api.php')) {
    return; // Biarkan langsung ambil dari internet (Network Only)
  }

  // B. STRATEGI: NETWORK FIRST (Coba internet dulu, kalau gagal baru cache)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Jika internet oke, simpan salinan terbaru ke cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Jika internet mati (offline), cari di cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          // Jika tidak ada di cache sama sekali, berikan halaman utama
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});

// --- NOTIFIKASI PUSH ---
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.text() : 'Pesan baru dari AI Unlimited';
  const options = {
    body: data,
    icon: './unnamed_copy_192x192.png',
    badge: './unnamed_copy_192x192.png',
    vibrate: [100, 50, 100],
    data: { dateOfArrival: Date.now() }
  };

  event.waitUntil(
    self.registration.showNotification('AI Unlimited', options)
  );
});

// --- KLIK NOTIFIKASI ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Fokus ke tab yang sudah terbuka jika ada
      for (const client of clientList) {
        if (client.url.includes('AI-UNLIMITED') && 'focus' in client) {
          return client.focus();
        }
      }
      // Jika tidak ada tab terbuka, buka yang baru
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});
