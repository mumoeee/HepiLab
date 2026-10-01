/* sw.js — service worker: membuat HepiLab jalan OFFLINE.
   • Saat pertama dibuka ONLINE: semua halaman & file tiap app disimpan otomatis. Daftar app dibaca dari apps/registry.js,
     lalu file-nya dicari dari tag <script>/<link> di index.html masing-masing → app baru tidak perlu mendaftar manual di sini.
   • Sesudah itu: online → ambil versi terbaru (dan perbarui simpanan); offline → pakai simpanan.
   • Ingin membersihkan simpanan lama? Naikkan VERSION di bawah. */
const VERSION='v1',CACHE='hepilab-'+VERSION;
importScripts('apps/registry.js');
const base=self.registration.scope;

async function precache(){
 const cache=await caches.open(CACHE),seen=new Set;
 async function add(url){
  if(seen.has(url))return;seen.add(url);
  try{
   const res=await fetch(url,{cache:'reload'});if(!res.ok)return;
   await cache.put(url,res.clone());
   if((res.headers.get('content-type')||'').includes('text/html')){
    const html=await res.text();
    for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const u=new URL(m[1],url);if(u.origin===location.origin)await add(u.href)}}
  }catch(e){}}
 await Promise.all([base,new URL('apps/registry.js',base).href,...HL_APPS.map(a=>new URL(a.path,base).href)].map(add));
}

self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(precache())});
self.addEventListener('activate',e=>e.waitUntil(
 caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})
  .catch(()=>caches.match(r,{ignoreSearch:true})));     // ignoreSearch: "?import=unfold" tetap ketemu saat offline
});
