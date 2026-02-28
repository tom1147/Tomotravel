// Service Worker for Tomo Game PWA v5
const CACHE_NAME = 'tomo-game-v5';
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
    './assets/bomb2.png',
    './assets/beach_night_bg.png',
    './assets/title.png',
    './assets/icon512.png',
    './assets/haa.jpg',
    './assets/aya.png',
    './assets/tomoend.png',
    './assets/tomogame.png'
];

// インストール時にキャッシュ
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                // 個別にキャッシュ（一部失敗しても続行）
                return Promise.allSettled(
                    urlsToCache.map(url => cache.add(url).catch(err => {
                        console.warn('Failed to cache:', url, err);
                    }))
                );
            })
    );
    self.skipWaiting();
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
    self.clients.claim();
});

// リクエスト時にネットワーク優先（キャッシュはフォールバック）
self.addEventListener('fetch', (event) => {
    // 動画ファイルはキャッシュしない（サイズが大きいため）
    if (event.request.url.includes('.mp4') || event.request.url.includes('.mp3')) {
        event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200 && response.type === 'basic') {
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
