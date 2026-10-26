const V='sw-map-v25',SHELL='shell-'+V,TILES='tiles-v1',TILE_MAX=3000;
const PRE=['./','index.html','data.json','manifest.webmanifest','leaflet.js','leaflet.css','leaflet.markercluster.js','MarkerCluster.css','layers.png','layers-2x.png','icon-192.png','icon-512.png','icon-180.png','icon-192-maskable.png','icon-512-maskable.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(PRE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('shell-')&&k!==SHELL).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
let trimming=false;async function trim(){if(trimming)return;trimming=true;try{const c=await caches.open(TILES);const ks=await c.keys();for(let i=0;i<ks.length-TILE_MAX;i++)await c.delete(ks[i])}finally{trimming=false}}
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET')return;
 if(u.hostname.endsWith('tile.openstreetmap.org')){ // runtime cache-first for tiles actually viewed
  e.respondWith(caches.open(TILES).then(async c=>{const hit=await c.match(e.request);if(hit)return hit;try{const r=await fetch(e.request);if(r.ok||r.type==='opaque'){c.put(e.request,r.clone());trim()}return r}catch(err){return new Response('',{status:504})}}));return}
 if(u.origin===location.origin){ // stale-while-revalidate for app shell + data
  if(e.request.mode==='navigate'||/(\/|index\.html|sw-idx\.json)$/.test(u.pathname)){e.respondWith(caches.open(SHELL).then(async c=>{try{const r=await fetch(e.request,{cache:'no-store'});if(r.ok)c.put(e.request,r.clone());return r}catch(err){return (await c.match(e.request,{ignoreSearch:true}))||(await c.match('index.html'))||Response.error()}}));return}
  e.respondWith(caches.open(SHELL).then(async c=>{const hit=await c.match(e.request,{ignoreSearch:true});const net=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r}).catch(()=>hit);return hit||net}))}
});
