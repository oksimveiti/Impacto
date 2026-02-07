self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open('v1').then(function (cache) {
      return cache.addAll([
        '/index.html',
        '/common-css.css',
        '/manifest.json',
        "/media/logo.png",
        "/media/logo/Logo-BW.svg",
        '/media/icons/icon-192x192.png',
        '/media/icons/icon-512x512.png',
        "/authentication-Francisco/css/open-page-style.css",
        "/authentication-Francisco/html/offline.html",
        "/authentication-Francisco/css/offline-style.css",
        "/media/icons/offline-dino.svg",
        "/offline-style.css"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  // console.log("service worker is fetching " + event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      // If not in cache, try fetching from network
      return fetch(event.request)
        .catch(() => {
          // Network failed (offline), redirect to offline.html
          return caches.match('/authentication-Francisco/html/offline.html');
        });
    })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});