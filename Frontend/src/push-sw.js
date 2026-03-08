/* Push notification service worker - handles incoming push events */
self.addEventListener('push', (event) => {
  let data = { title: 'News Adda India', body: 'New article', url: '/', image: null };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (_) {}
  const url = data.url || '/';
  const urlToOpen = url.startsWith('http') ? url : (self.location.origin + (url.startsWith('/') ? url : '/' + url));
  const imageUrl = data.image && (data.image.startsWith('http://') || data.image.startsWith('https://')) ? data.image : null;
  const logoUrl = self.location.origin + '/assets/videos/slogo.png';
  const options = {
    body: data.body || 'Read the latest news',
    icon: imageUrl || logoUrl,
    badge: logoUrl,
    image: imageUrl || logoUrl,
    data: { url: urlToOpen, id: data.id },
    actions: [{ action: 'open', title: 'Read' }]
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'News Adda India', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || self.location.origin + '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
