/* Service worker de Pumax
 * - Archivos estáticos (JS/CSS/imágenes/fuentes): primero caché, se actualizan en segundo plano.
 * - Pantallas (navegación): primero red; si no hay conexión, se muestra la última versión guardada.
 * - Llamadas a la API (otro dominio o /api): nunca se guardan, siempre van a la red.
 * Para forzar que todos los usuarios recarguen la app, cambiá VERSION.
 */
const VERSION = "pumax-v2";
const SHELL = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // API en otro dominio: no tocar
  if (url.pathname.startsWith("/api")) return;

  // Navegación entre pantallas: red primero, caché como respaldo offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match("/")))
    );
    return;
  }

  // Estáticos: caché primero, y se refresca en segundo plano
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

/* Notificaciones: al tocar una, se enfoca la app abierta o se abre en la pantalla indicada */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/dashboard/Home";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          return client.focus().then(() => ("navigate" in client ? client.navigate(url).catch(() => {}) : undefined));
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
