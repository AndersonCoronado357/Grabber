/* Grabber service worker — PWA instalable + Web Push (VAPID).
   Passthrough puro (como Hibi): NO interceptamos respuestas (no llamamos a
   respondWith), así el navegador maneja la red con normalidad y evitamos el
   error "Failed to convert value to 'Response'" cuando la red falla y no hay
   nada en caché. La instalabilidad solo exige que exista un listener 'fetch'. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  /* passthrough: sin respondWith */
});

/* Web Push real: el navegador despierta este worker aunque la app esté cerrada.
   El servidor manda { title, body, url, tag } como JSON.
   IMPORTANTE: icon/badge son OBLIGATORIOS en la práctica — en Android un push
   del navegador SIN icono se descarta en silencio. */
self.addEventListener('push', (event) => {
  let data = { title: 'Grabber', body: '' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    /* payload no-JSON */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/public/brand/icon-192-v3.png',
      badge: '/public/brand/icon-192-v3.png',
      tag: data.tag || 'grabber',
      renotify: true,
      data: { url: data.url || '/' },
    }),
  );
});

/* Tocar la notificación enfoca una pestaña de Grabber ya abierta (y la lleva a
   la vista correspondiente), o abre una nueva. */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of all) {
        if ('focus' in c) {
          await c.focus();
          if (c.navigate && url) await c.navigate(url).catch(() => {});
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })(),
  );
});
