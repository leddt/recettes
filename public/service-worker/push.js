self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let notificationData = {
    title: "Nouvelle recette",
    body: "Une nouvelle recette a été ajoutée.",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    data: { url: "/" },
  };

  try {
    notificationData = { ...notificationData, ...event.data.json() };
  } catch {
    notificationData.body = event.data.text();
  }

  const { title, ...options } = notificationData;

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname === targetUrl && "focus" in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});
