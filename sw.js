/* Lex Liga minimal service worker – offline shell */
var CACHE = 'lex-liga-v1';
var ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/supabase-config.js',
  './js/home-app.js',
  './js/announce.js',
  './manifest.json'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(function () {
      return caches.match(e.request).then(function (r) { return r || caches.match('./index.html'); });
    })
  );
});
