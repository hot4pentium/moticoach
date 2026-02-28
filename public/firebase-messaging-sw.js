// LeagueMatrix — Web Push Service Worker | build: 2026-02-28T20:14:32.990Z
// Handles background push notifications and app icon badging

self.addEventListener('push', event => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'New message', body: event.data.text() };
  }

  const title = payload.title ?? 'LeagueMatrix';
  const options = {
    body:  payload.body  ?? '',
    icon:  '/assets/icon.png',
    badge: '/assets/icon.png',
    data:  { url: payload.url ?? '/' },
    tag:   payload.tag  ?? 'lm-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      // Badge the home screen icon
      if ('setAppBadge' in navigator) {
        return navigator.setAppBadge();
      }
    })
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Focus existing window if open
        for (const client of windowClients) {
          if ('focus' in client) return client.focus();
        }
        // Otherwise open new window
        if (clients.openWindow) return clients.openWindow(targetUrl);
      })
  );
});
