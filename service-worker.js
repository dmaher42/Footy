const ASSET_VERSION = "2026.04.11.12";
const CACHE_NAME = `footy-player-manager-v5-${ASSET_VERSION}`;
const APP_SHELL = [
  "./",
  "./index.html",
  `./styles.css?v=${ASSET_VERSION}`,
  `./app.js?v=${ASSET_VERSION}`,
  `./manifest.json?v=${ASSET_VERSION}`,
  "./version.json",
  `./icons/icon-192.png?v=${ASSET_VERSION}`,
  `./icons/icon-512.png?v=${ASSET_VERSION}`,
  `./icons/apple-touch-icon.png?v=${ASSET_VERSION}`,
];
const NETWORK_FIRST_SUFFIXES = [
  "/",
  "/index.html",
  "/app.js",
  "/styles.css",
  "/manifest.json",
  "/version.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  const isNavigationRequest = event.request.mode === "navigate";
  const useNetworkFirst =
    isNavigationRequest ||
    NETWORK_FIRST_SUFFIXES.some((suffix) => requestUrl.pathname.endsWith(suffix));

  if (useNetworkFirst) {
    const freshRequest = new Request(event.request, { cache: "no-store" });

    event.respondWith(
      fetch(freshRequest).then((networkResponse) => {
        const responseClone = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return networkResponse;
      }).catch(() =>
        caches.match(event.request).then((cachedResponse) => cachedResponse || caches.match("./index.html"))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        const responseClone = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return networkResponse;
      });
    }).catch(() => caches.match("./index.html"))
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
