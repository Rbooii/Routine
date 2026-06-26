// Service Worker for Push Notifications
// This runs in the browser background

self.addEventListener("push", function (event) {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || "Time for your skincare routine!",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/badge-72.png",
    tag: data.tag || "routine-reminder",
    vibrate: [200, 100, 200],
    actions: [
      { action: "open", title: "Open Routine" },
      { action: "dismiss", title: "Dismiss" },
    ],
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "🧴 Routine", options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
