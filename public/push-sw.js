/* Lembretes de treino: importado pelo service worker gerado pelo Workbox. */
/* O push chega sem payload (ver worker/push.js), então o texto é fixo. */
self.addEventListener('push', event => {
  event.waitUntil(
    self.registration.showNotification('Hora do treino 💪', {
      body: 'Seu treino de hoje está esperando. Bora manter a sequência!',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'overload-treino',
      renotify: false,
      data: { url: '/?tab=workout' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate?.(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
