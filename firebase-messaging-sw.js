// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB0pAoabkUttBhOqaQ2S_K0yzM5UUpru5Q",
  authDomain: "critical-reports.firebaseapp.com",
  projectId: "critical-reports",
  storageBucket: "critical-reports.firebasestorage.app",
  messagingSenderId: "174004397870",
  appId: "1:174004397870:web:1ad8cc50f66e42ff2d3cbf"
});

const messaging = firebase.messaging();

// استقبال الإشعارات في الخلفية
messaging.onBackgroundMessage(payload => {
  console.log('📨 Background message:', payload);
  const { title, body, icon } = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(title || '🚨 بلاغ حرج جديد', {
    body: body || '',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    dir: 'rtl',
    tag: 'report-' + (data.reportId || Date.now()),
    renotify: true,
    data: { url: '/', reportId: data.reportId },
    actions: [
      { action: 'view', title: '📖 اطلاع فوري' },
      { action: 'close', title: '✕' }
    ]
  });
});

// عند الضغط على الإشعار
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) { client.focus(); return; }
      }
      clients.openWindow('/');
    })
  );
});
