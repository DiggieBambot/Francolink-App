const CACHE_NAME = 'francolink-v4';

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

// Fetch — network first, fallback to cache, fallback to / for navigation
self.addEventListener('fetch', (event) => {
  // Skip non-GET, chrome-extension, and API requests
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.startsWith('chrome-extension')
  ) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request)
          .then((cached) => cached || caches.match('/'))
      )
    );
    return;
  }

  // For other assets — cache first, then network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Only cache successful same-origin responses
        if (
          response.ok &&
          response.type === 'basic' &&
          !event.request.url.includes('supabase')
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('/'));
    })
  );
});
