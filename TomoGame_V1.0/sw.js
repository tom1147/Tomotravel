// Service Worker for Tomo Game PWA v4.1
const CACHE_NAME = 'tomo-game-v4.1';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './js/game.js',
    './js/objects.js',
    './manifest.json',
    './assets/tama1.png',
    './assets/tama2.png',
    './assets/tama3.png',
    './assets/tama4.png',
    './assets/tama5.png',
    './assets/tama6.png',
    './assets/tama7.png',
    './assets/tama8.png',
    './assets/tama9.png',
    './assets/tama10.png',
    './assets/tama11.png',
    './assets/tama12.png',
    './assets/beach_night_bg.png',
    './assets/bomb2.png',
    './assets/title.png',
    './assets/tomoend.png',
    './assets/tomogame.png',
    './assets/icon512.png',
    './assets/con1.png',
    './assets/con2.png',
    './assets/con3.png',
    './assets/con4.png'
];

// インストール時にキャッシュ
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
    self.skipWaiting(); // 即座に新しいSWを有効化
});

// 古いキャッシュを削除
self.addEventListener('activate', (event) => {
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
    self.clients.claim(); // 即座にページを制御
});

// リクエスト時にネットワーク優先（キャッシュはフォールバック）
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // ネットワーク成功時はキャッシュを更新
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
