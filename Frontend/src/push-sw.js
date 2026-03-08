/* Push notification service worker - handles incoming push events */
self.addEventListener('push', (event) => {
  let data = { title: 'News Adda India', body: 'New article', url: '/' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (_) {}
  const options = {
    body: data.body || 'Read the latest news',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: { url: data.url || '/', id: data.id },
    actions: [{ action: 'open', title: 'Read' }]
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'News Adda India', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
