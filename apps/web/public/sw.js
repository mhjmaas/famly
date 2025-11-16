// Service Worker for PWA Notifications
// Handles push notifications and notification clicks with deep linking

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();

    const options = {
      body: data.body || "",
      icon: data.icon || "/web-app-manifest-192x192.png",
      badge: "/web-app-manifest-192x192.png",
      image: data.image,
      vibrate: [200, 100, 200],
      tag: data.tag || "notification",
      requireInteraction: data.requireInteraction || false,
      data: {
        url: data.data?.url || "/",
        dateOfArrival: Date.now(),
        ...data.data,
      },
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "Notification", options),
    );
  } catch (error) {
    console.error("Error handling push event:", error);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            // Focus existing window and navigate to the URL
            return client.focus().then(() => {
              if ("navigate" in client) {
                return client.navigate(urlToOpen);
              }
            });
          }
        }

        // No window open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});

// Handle service worker activation
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
