// sw.js — GKM PWA cache + notif
const CACHE = 'gkm-v1';

// Precache aset inti (boleh tambah sesuai kebutuhan)
const PRECACHE_URLS = [
  './','./index.html','./app.js','./styles.css','./sw.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js'
];

self.addEventListener('install', (e)=> {
  e.waitUntil((async ()=>{
    const c = await caches.open(CACHE);
    await c.addAll(PRECACHE_URLS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e)=> {
  e.waitUntil((async ()=>{
    // Hapus cache lama
    const keys = await caches.keys();
    await Promise.all(keys.map(k=> (k!==CACHE ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

// Cache-first untuk GET
self.addEventListener('fetch', (e)=>{
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith((async ()=>{
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      const c = await caches.open(CACHE);
      // jangan cache request no-cors POST dll
      if (res && res.status===200 && (req.url.startsWith(self.location.origin) || req.url.includes('cdn.jsdelivr.net'))) {
        c.put(req, res.clone());
      }
      return res;
    } catch {
      // fallback sederhana
      return new Response('Offline', {status:503, statusText:'Offline'});
    }
  })());
});

// Notifikasi (dipakai fitur alarm 04:00)
self.addEventListener('message', (e)=>{
  const { type, title, options } = e.data || {};
  if (type === 'show-notif' && self.registration?.showNotification) {
    self.registration.showNotification(title || 'Pengingat', options || {});
  }
});
