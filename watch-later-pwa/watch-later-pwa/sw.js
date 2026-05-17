// =====================================================
//  Watch Later Adder PWA - sw.js (Service Worker)
//  PWAのオフライン対応とキャッシュを管理する
// =====================================================

const CACHE_NAME = 'wla-pwa-v1';
const ASSETS = ['/', '/index.html', '/app.js', '/manifest.json'];

// インストール時にアセットをキャッシュ
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// /share へのリクエストをindex.htmlに渡す（Share Target対応）
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname === '/share') {
    // 共有されたURLをパラメータごとindex.htmlに転送する
    e.respondWith(
      caches.match('/index.html').then(r => r || fetch('/index.html'))
    );
    return;
  }
  // その他はキャッシュ優先
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
