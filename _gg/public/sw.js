// ============================================================
// Service Worker — PUSH NOTIFICATIONS ONLY
// ============================================================
// This SW does NOT intercept any fetch requests.
// All caching is handled by Next.js content hashes + browser HTTP cache.
// Fetch events are intentionally NOT handled — the browser's default
// network-first behaviour is exactly what we want.
// ============================================================

// Install — just activate immediately, no pre-caching
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate — clean up ALL old caches from previous SW versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          console.log('[SW] Deleting old cache:', name);
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// NO fetch event listener — browser handles all requests normally.
// This is intentional. Previous versions cached JS chunks via networkFirst,
// causing stale code to be served after deployments.

/* ═══════════════════════════════════════════════════════════════════════
   Push Notification Handlers
   ═══════════════════════════════════════════════════════════════════════ */

self.addEventListener('push', (event) => {
  let data = {
    title: 'G-Games',
    body: 'لديك إشعار جديد!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: 'ggames-notification',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: false,
    data: {
      url: '/voice-rooms',
      timestamp: Date.now(),
    },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = {
        ...data,
        title: parsed.title || data.title,
        body: parsed.body || data.body,
        icon: parsed.icon || data.icon,
        badge: parsed.badge || data.badge,
        tag: parsed.tag || data.tag,
        data: {
          url: parsed.data?.url || parsed.url || '/voice-rooms',
          type: parsed.data?.type || parsed.type,
          roomId: parsed.data?.roomId,
          fromUserId: parsed.data?.fromUserId,
          fromDisplayName: parsed.data?.fromDisplayName,
          timestamp: parsed.timestamp || Date.now(),
        },
      };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      dir: data.dir,
      lang: data.lang,
      data: data.data,
      vibrate: data.vibrate,
      requireInteraction: data.requireInteraction,
      actions: [
        { action: 'open', title: 'فتح' },
        { action: 'dismiss', title: 'إغلاق' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/voice-rooms';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(targetUrl)) return client.focus();
          return client.navigate(targetUrl).then(() => client.focus());
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
