/* shell.js — kerangka bersama: (1) menu navigasi antar-app di header, (2) mendaftarkan service worker agar jalan OFFLINE.
   Daftar app dibaca dari apps/registry.js. Dipakai oleh Home maupun tiap app. */
(function(){
 const root=new URL('../',document.currentScript.src).href,       // alamat folder utama repository
  here=document.body.dataset.app,nav=document.getElementById('nav');
 if(nav&&globalThis.HL_APPS)nav.innerHTML=HL_APPS.map(a=>`<a href="${root+a.path}" class="${a.id===here?'on':''}" title="${a.name}"><i>${a.icon}</i><span>${a.name}</span></a>`).join('');
 if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register(root+'sw.js').catch(()=>{});
})();
