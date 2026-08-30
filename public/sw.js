self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: "/globe.svg", // Using your existing Next.js icon
      badge: "/window.svg",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: "2",
        url: data.url // The hackathon link
      },
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  // Open the hackathon URL when you click the notification!
  event.waitUntil(clients.openWindow(event.notification.data.url));
});