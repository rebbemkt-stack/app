// ─── Rebbe Club — Service Worker ──────────────────────────────────────────────
// Handles: PWA installability + background notification for the rest timer.
//
// NOTE on iOS Safari: background setTimeout inside a Service Worker is best
// effort — iOS can suspend the SW while the app isn't in the foreground, so
// the notification may not always fire there. The in-app sound + vibration +
// screen flash (see index.html) remain the primary, reliable feedback,
// especially on iOS; this notification is a bonus for browsers that support it
// (mainly Android/Chrome).

const CACHE_NAME = 'rebbe-club-v1';

let restTimerId = null;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const data = event.data || {};

  if (data.type === 'schedule-rest-notification') {
    if (restTimerId) {
      clearTimeout(restTimerId);
      restTimerId = null;
    }
    const delay = Math.max(0, (data.timerEnd || 0) - Date.now());
    restTimerId = setTimeout(() => {
      self.registration.showNotification('¡Descanso terminado! 💪', {
        body: 'Es hora de tu próxima serie.',
        icon: './icon-192.png',
        badge: './icon-192.png',
        tag: 'rebbe-rest-timer',
        renotify: true,
        vibrate: [200, 100, 200, 100, 400]
      }).catch(() => {});
      restTimerId = null;
    }, delay);
  } else if (data.type === 'cancel-rest-notification') {
    if (restTimerId) {
      clearTimeout(restTimerId);
      restTimerId = null;
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./index.html');
    })
  );
});
