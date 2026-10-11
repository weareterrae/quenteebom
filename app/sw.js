/* Service worker da app Quente e Bom: abre sem rede e poupa dados.
   Ecrã e dados: rede primeiro, cache como reserva. Imagens: cache primeiro.
   API (/api/*) e Supabase nunca passam pela cache. Subir VERSAO ao mudar o ecrã. */
var VERSAO = 'qeb-app-v1';
var BASE = ['/app/', '/app/app.js?v=1', '/app/dados.json', '/app/manifest.webmanifest', '/assets/js/bento.js?v=6', '/assets/logos/logo_white_real.png', '/assets/img/bento_face.jpg'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSAO).then(function (c) { return c.addAll(BASE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSAO; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.indexOf('/api/') === 0) return;
  var imagem = /\.(jpg|jpeg|png|webp|svg|ttf)$/i.test(url.pathname);
  if (imagem) {
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res.ok) { var copia = res.clone(); caches.open(VERSAO).then(function (c) { c.put(req, copia); }); }
        return res;
      });
    }));
    return;
  }
  e.respondWith(fetch(req).then(function (res) {
    if (res.ok) { var copia = res.clone(); caches.open(VERSAO).then(function (c) { c.put(req, copia); }); }
    return res;
  }).catch(function () { return caches.match(req).then(function (hit) { return hit || caches.match('/app/'); }); }));
});
