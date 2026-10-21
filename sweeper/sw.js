const C='sweeper96-v8',T='sweeper96-tiles-v1',PRE=['./','./index.html','./leaflet.css','./leaflet.js','./manifest.webmanifest','./icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(PRE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('sweeper96-')&&k!==C&&k!==T).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET')return;
 if(u.hostname.endsWith('tile.openstreetmap.org')){e.respondWith(caches.open(T).then(async c=>{const r=await c.match(e.request);const f=fetch(e.request).then(x=>{if(x.ok||x.type==='opaque')c.put(e.request,x.clone());return x}).catch(()=>r);return r||f}));return}
 if(u.origin!==location.origin||!u.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 if(e.request.mode==='navigate'||u.pathname.endsWith('index.html')){e.respondWith(fetch(e.request).then(x=>{caches.open(C).then(c=>c.put(e.request,x.clone()));return x}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));return}
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(x=>{if(x.ok){const y=x.clone();caches.open(C).then(c=>c.put(e.request,y))}return x})))});
