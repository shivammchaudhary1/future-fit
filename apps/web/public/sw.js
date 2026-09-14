const CACHE = "future-fit-static-v1";
const STATIC = ["/offline.html", "/icon.svg"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(STATIC)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("future-fit-static-") && key !== CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      ),
  );
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate")
    return;
  // Never cache authentication, API responses, or private student/report pages.
  event.respondWith(
    fetch(event.request).catch(() => caches.match("/offline.html")),
  );
});
