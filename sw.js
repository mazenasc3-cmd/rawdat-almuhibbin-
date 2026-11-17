// Service Worker — يستقبل إشعارات الويب ويعرضها حتى لو الموقع مغلق.
// ملاحظة: لا يعمل كـ offline cache؛ وظيفته الإشعارات فقط.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'دار روضة المحبين';
  const body = data.body || data.text || 'يوجد تحديث جديد على الموقع';
  const url = data.url || '/';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/assets/logo.jpg',
      badge: '/assets/logo.jpg',
      dir: 'rtl',
      lang: 'ar',
      tag: data.tag || 'rm-update',
      renotify: true,
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rel = (event.notification.data && event.notification.data.url) || '/';
  const target = new URL(rel, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (new URL(c.url).origin === self.location.origin) {
          if ('navigate' in c) c.navigate(target).catch(() => {});
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
