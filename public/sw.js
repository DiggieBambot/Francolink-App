const CACHE_NAME = 'francolink-v5';

const STATIC_ASSETS = [
  '/',
];

// Install — cache only what exists
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use individual adds so one failure doesn't break everything
      return Promise.allSettled(
        STATIC_ASSETS.map((url) => cache.add(url).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Push — receive a server-sent notification and display it.
// Expected payload (JSON):
//   { title, body, icon?, badge?, url?, tag? }
// On Android/desktop the system tray uses these fields. iOS Safari (16.4+) uses
// title + body. The browser refuses to subscribe in the first place unless a
// push handler is registered — so this listener is what unblocks subscription.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    if (event.data) data = event.data.json();
  } catch {
    if (event.data) data = { body: event.data.text() };
  }
  const title = data.title || 'FrancoLink';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-192.png',
    tag: data.tag,
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click — focus an existing tab on the target URL or open one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(url).catch(() => {});
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Fetch strategy
// --------------
// Auth, API, and dynamic pages must ALWAYS hit the network so sign-in/out and
// freshly-deployed routes are never served stale from cache (this was causing
// "sign out doesn't work" and new pages 404-ing from an old cached shell).
//
// - Only immutable, content-hashed build assets (/_next/static/) are cached
//   (cache-first) — they're safe because their URL changes when content does.
// - Everything else is network-first, with cache used only as an offline
//   fallback. Navigations fall back to the cached "/" shell when offline.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept auth, API, supabase, or cross-origin/extension requests.
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/admin/login') ||
    url.href.includes('supabase')
  ) {
    return;
  }

  // Immutable hashed build assets → cache-first (fast, never stale by URL).
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
      )
    );
    return;
  }

  // Everything else (documents, RSC, data) → network-first.
  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((cached) => {
        if (cached) return cached;
        if (request.mode === 'navigate') return caches.match('/');
        return new Response('', { status: 504, statusText: 'Offline' });
      })
    )
  );
});
