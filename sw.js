// =====================================================

//  Watch Later Adder PWA - sw.js (Service Worker)

//  GitHub Pagesのサブディレクトリ構成に対応したバージョン

// =====================================================


const CACHE_NAME = 'wla-pwa-v2';

const BASE = '/watch-later-pwa';


// キャッシュするファイルのリスト（サブディレクトリのパスで指定）

const ASSETS = [

  BASE + '/',

  BASE + '/index.html',

  BASE + '/app.js',

  BASE + '/manifest.json'

];


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


// リクエストの処理

self.addEventListener('fetch', (e) => {

  const url = new URL(e.request.url);


  // 共有URLのリクエスト（?url=...付き）→ index.htmlを返す

  // これがないとGitHub Pagesが404を返してしまう

  if (url.pathname === BASE + '/' && url.searchParams.has('url')) {

    e.respondWith(

      caches.match(BASE + '/index.html')

        .then(r => r || fetch(BASE + '/index.html'))

    );

    return;

  }


  // その他はキャッシュ優先・なければネットワークから取得

  e.respondWith(

    caches.match(e.request)

      .then(r => r || fetch(e.request))

  );

});


