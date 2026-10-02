/* home.js — membuat kartu app dari apps/registry.js + tombol "Pasang di layar utama". */
document.getElementById('cards').innerHTML=(globalThis.HL_APPS||[]).map(a=>
 `<a class="card" href="${a.path}"><span class="ic">${a.icon}</span><b>${a.name}</b><span class="d">${a.desc}</span><span class="go">Buka →</span></a>`).join('');
let deferred;const btn=document.getElementById('install');
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;btn.hidden=false});
btn.onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;btn.hidden=true};
