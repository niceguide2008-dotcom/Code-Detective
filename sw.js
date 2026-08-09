const CACHE_NAME = "code-detective-v1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/home.html",
  "/admin.html",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle normal GET requests.
  if (request.method !== "GET") return;

  // Don't interfere with Supabase/API requests.
  if (
    request.url.includes("supabase.co") ||
    request.url.includes("/rest/") ||
    request.url.includes("/auth/")
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && new URL(request.url).origin === location.origin) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
        }

        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match("/home.html");
        });
      })
  );
});