const CACHE_NAME = "razarth-cache-v26";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./fechamento.html",
  "./styles.css",
  "./fechamento.css",
  "./manifest.json",
  "./js/main.js",
  "./js/fechamento.js",
  "./js/services/ui.js",
  "./js/services/dashboard.js",
  "./js/services/filtros.js",
  "./js/services/classificacao.js",
  "./js/services/importacao.js",
  "./js/services/realtime.js",
  "./js/services/auth.js",
  "./js/services/fechamento.js",
  "./js/services/analiseIa.js",
  "./js/config/supabase.js",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/skalee-symbol-login.png",
  "./icons/skalee-wordmark-login.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }

  const isFreshAsset = /\.(?:html|js|css)$/i.test(requestUrl.pathname) || event.request.mode === "navigate";
  if (isFreshAsset) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        const cloned = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return networkResponse;
      }).catch(async () => {
        const cachedResponse = await caches.match(event.request);
        return cachedResponse || caches.match("./index.html");
      })
    );
    return;
  }

  const isAppShellAsset = APP_ASSETS.some((asset) => requestUrl.pathname.endsWith(asset.replace(/^\.\//, "/")));

  if (isAppShellAsset || requestUrl.pathname === "/" || requestUrl.pathname.endsWith("/index.html")) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        const cloned = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return networkResponse;
      }).catch(async () => {
        const cachedResponse = await caches.match(event.request);
        return cachedResponse || caches.match("./index.html");
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        const cloned = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return networkResponse;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
