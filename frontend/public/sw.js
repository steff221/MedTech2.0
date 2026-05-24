// Minimal service worker — clears old caches, never intercepts requests.
// All assets are always fetched fresh from the network.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// No fetch handler: every request goes directly to the network.
