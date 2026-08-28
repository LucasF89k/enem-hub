const CACHE_VERSION = "v2"
const STATIC_CACHE = `enem-hub-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `enem-hub-dynamic-${CACHE_VERSION}`

// Assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/offline",
]

// Install: pre-cache shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => {})
    )
  )
  self.skipWaiting()
})

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// Helpers

// Só CacheFirst pra assets com hash imutável no nome (build do Next) e ícones.
// Imagens de conteúdo (ex.: /opal/*.webp) NÃO entram aqui — senão uma troca de
// arte fica presa no cache pra sempre. Essas vão pro stale-while-revalidate.
function isImmutableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(woff2?|ttf)$/.test(url.pathname)
  )
}

function isImageAsset(url) {
  return /\.(png|jpg|jpeg|svg|gif|webp|ico|avif)$/.test(url.pathname)
}

function isApiRoute(url) {
  return url.pathname.startsWith("/api/")
}

function isNavigationRequest(request) {
  return request.mode === "navigate"
}

// CacheFirst — static assets
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE)
    cache.put(request, response.clone())
  }
  return response
}

// NetworkFirst — API routes & auth
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached ?? new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// StaleWhileRevalidate — pages & dynamic content
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cached = await cache.match(request)
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone())
    return response
  })
  return cached ?? fetchPromise
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // Skip non-GET
  if (event.request.method !== "GET") return

  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(event.request))
    return
  }

  // Imagens de conteúdo: serve do cache mas revalida em background,
  // então uma troca de arte aparece no carregamento seguinte.
  if (isImageAsset(url)) {
    event.respondWith(staleWhileRevalidate(event.request))
    return
  }

  if (isApiRoute(url)) {
    event.respondWith(networkFirst(event.request))
    return
  }

  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request)
        return cached ?? caches.match("/offline") ?? new Response("Offline", { status: 503 })
      })
    )
    return
  }

  event.respondWith(staleWhileRevalidate(event.request))
})

// Push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title ?? "ENEM Hub", {
      body: data.body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: data,
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus()
      return clients.openWindow("/dashboard")
    })
  )
})
