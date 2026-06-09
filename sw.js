// Service Worker - Critical Medical Reports System
const CACHE_NAME = 'critical-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// استقبال Push Notifications
self.addEventListener('push', e => {
  if (!e.data) return;
  try {
    const data = e.data.json();
    const options = {
      body: data.body || '',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true, // تبقى حتى يضغط عليها
      dir: 'rtl',
      lang: 'ar',
      tag: data.tag || 'critical-report',
      renotify: true,
      data: { url: data.url || '/', reportId: data.reportId },
      actions: [
        { action: 'view', title: '📖 اطلاع فوري' },
        { action: 'close', title: '✕ إغلاق' }
      ]
    };
    e.waitUntil(
      self.registration.showNotification(data.title || '🚨 بلاغ حرج جديد', options)
    );
  } catch(err) {
    const text = e.data.text();
    e.waitUntil(
      self.registration.showNotification('🚨 بلاغ حرج جديد', {
        body: text, vibrate: [200,100,200], requireInteraction: true, dir: 'rtl'
      })
    );
  }
});

// عند الضغط على الإشعار
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  if (e.action === 'close') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.postMessage({ type: 'OPEN_REPORT', reportId: e.notification.data?.reportId });
          return;
        }
      }
      clients.openWindow(url);
    })
  );
});

// Background Sync - polling في الخلفية
self.addEventListener('periodicsync', e => {
  if (e.tag === 'check-reports') {
    e.waitUntil(checkNewReports());
  }
});

async function checkNewReports() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const stateRes = await cache.match('push-state');
    const state = stateRes ? await stateRes.json() : {};
    const centerId = state.centerId;
    const lastCheck = state.lastCheck || 0;
    const sbUrl = state.sbUrl;
    const sbKey = state.sbKey;
    if (!centerId || !sbUrl || !sbKey) return;

    const url = sbUrl + '/reports?select=*&center_id=eq.' + centerId + '&status=eq.sent&order=created_at.desc&limit=5';
    const res = await fetch(url, {
      headers: { 'apikey': sbKey, 'Authorization': 'Bearer ' + sbKey }
    });
    if (!res.ok) return;
    const reports = await res.json();

    for (const r of reports) {
      const createdAt = new Date(r.created_at).getTime();
      if (createdAt > lastCheck) {
        await self.registration.showNotification('🚨 بلاغ حرج جديد!', {
          body: 'المريض: ' + r.patient_name + '\n' + r.test_name,
          vibrate: [200,100,200,100,200],
          requireInteraction: true,
          dir: 'rtl',
          tag: 'report-' + r.id,
          renotify: true,
          data: { url: '/', reportId: r.id }
        });
      }
    }

    await cache.put('push-state', new Response(JSON.stringify({
      ...state, lastCheck: Date.now()
    })));
  } catch(e) { console.log('SW check error:', e); }
}
