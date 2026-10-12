// ============================================================
// Service Worker — PUSH NOTIFICATIONS + OFFLINE FALLBACK
// ============================================================
// هذا الـ Service Worker يقوم بأمرين:
//   1. اعتراض طلبات التنقّل (navigation) التي تفشل بسبب انقطاع الشبكة
//      وتقديم `/offline.html` بدلاً من صفحة المتصفح "Page Web non disponible"
//   2. معالجة إشعارات Push (السلوك الأصلي)
//
// ملاحظة: نحن لا نُخزّن JS chunks أو HTML عام — نترك ذاكرة التخزين
// المؤقت للمتصفح. فقط نعترض حالات الفشل.
// ============================================================

const OFFLINE_URL = '/offline.html';
const OFFLINE_CACHE = 'ggames-offline-v1';

// Install — نخزّن صفحة offline.html فقط
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => {
      return cache.addAll([OFFLINE_URL]);
    }).then(() => self.skipWaiting())
  );
});

// Activate — ننظّف الكاش القديم + نستحوذ على العملاء فوراً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== OFFLINE_CACHE) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
          return Promise.resolve();
        })
      );
    }).then(() => self.clients.claim())
  );
});

/* ═══════════════════════════════════════════════════════════════════════
   FETCH handler — intercept navigation failures
   ═══════════════════════════════════════════════════════════════════════

   When the browser tries to navigate to a URL (mode === 'navigate') and
   the network fails (ERR_INTERNET_DISCONNECTED, ERR_NAME_NOT_RESOLVED,
   ERR_NETWORK_CHANGED, etc.), we serve `/offline.html` from cache instead
   of letting the browser show its native "Page Web non disponible" page.

   For non-navigation requests (fetch, XHR, images, scripts), we just let
   them pass through — the React NetworkStatusProvider handles those.
*/
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // نعترض فقط طلبات التنقّل (HTML documents)
  if (req.mode !== 'navigate') return;

  event.respondWith(
    fetch(req)
      .then((response) => {
        // محاولة ناجحة — نُعيد الاستجابة كما هي
        return response;
      })
      .catch(() => {
        // فشل الشبكة — نقدّم offline.html من الكاش
        console.log('[SW] Navigation failed, serving offline page');
        return caches.match(OFFLINE_URL).then((cached) => {
          if (cached) return cached;
          // إن لم يكن موجوداً (مستحيل بعد التثبيت) — استجابة فارغة
          return new Response(
            '<html><body dir="rtl" style="font-family:sans-serif;text-align:center;padding:3rem;background:#0a4a3a;color:#fff"><h1>انقطع الاتصال</h1><p>تأكد من اتصالك بالإنترنت ثم أعد المحاولة.</p></body></html>',
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        });
      })
  );
});

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
