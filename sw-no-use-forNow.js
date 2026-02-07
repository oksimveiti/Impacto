// 最もシンプルなService Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker installing.");
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated.");
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

// 開発環境でのチェック
if (
  window.location.protocol === "https:" ||
  window.location.hostname === "localhost"
) {
  // Service Worker登録処理
}

const CACHE_NAME = "impacto-v1";
const DYNAMIC_CACHE = "dynamic-v1";

// キャッシュするURLのリスト
const urlsToCache = [
  "/",
  "/index.html",
  "/common-css.css",
  "/media/logo.png",
  "/authentication-Francisco/css/open-page-style.css",
  "/home/html/home.html",
  "/authentication-Francisco/html/offline.html",
  "/authentication-Francisco/css/offline-style.css"
  // その他キャッシュしたいリソース
];

// ユーザー認証情報をキャッシュするための関数
async function cacheAuthData(authData) {
  const cache = await caches.open(DYNAMIC_CACHE);
  await cache.put("auth-data", new Response(JSON.stringify(authData)));
}

// インストール時のキャッシュ
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("キャッシュを開きました");
      return cache.addAll(urlsToCache);
    })
  );
});

// フェッチ時のキャッシュ対応
self.addEventListener("fetch", (event) => {
  // 認証関連のリクエストの処理
  if (event.request.url.includes("firebaseauth")) {
    // オフライン時は保存された認証データを返す
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(DYNAMIC_CACHE);
        return cache.match("auth-data");
      })
    );
    return;
  }

  // 通常のリクエストの処理
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).then((fetchResponse) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        })
      );
    })
  );
});

// 古いキャッシュの削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// プッシュ通知の受信処理（オプション）
self.addEventListener("push", (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: "/images/logo.png",
      badge: "/images/badge.png",
    };

    event.waitUntil(self.registration.showNotification("Impacto", options));
  }
});
