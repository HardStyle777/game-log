const CACHE='tasogare-v8';
const FILES=['./','./index.html','./style.css','./game.js','./manifest.webmanifest','./assets/ashwind-field.webp','./assets/hero-sword.webp','./assets/hero-warrior.webp','./assets/ashfang.webp','./assets/ashfang-walk16-v1.webp','./assets/sword-walk16-v1.webp','./assets/warrior-walk16-v1.webp','./assets/sword-anim-v3.webp','./assets/warrior-anim-v3.webp'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)))});
