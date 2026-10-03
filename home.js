/* home.js — membuat kartu app dari apps/registry.js (dengan pratinjau mini) + tombol "Pasang di layar utama". */
const G='#e8a33d',L='rgba(237,233,224,.5)';
/* pratinjau mini per app; app lain otomatis memakai ikon besar */
const PV={
 d3:`<svg viewBox="0 0 240 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
  <polygon points="120,30 163,55 120,80 77,55" fill="${G}" fill-opacity=".22"/>
  <path d="M120 30L163 55V105L120 130L77 105V55Z M77 55L120 80L163 55 M120 80V130" fill="none" stroke="${G}" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M163 55L190 62V102L163 105" fill="none" stroke="${L}" stroke-width="1" stroke-dasharray="3 3"/>
  <g fill="#09090a" stroke="${G}" stroke-width="1.4"><circle cx="120" cy="30" r="3.2"/><circle cx="163" cy="55" r="3.2"/><circle cx="163" cy="105" r="3.2"/><circle cx="120" cy="130" r="3.2"/><circle cx="77" cy="105" r="3.2"/><circle cx="77" cy="55" r="3.2"/></g>
  <circle cx="120" cy="80" r="3.4" fill="#fff"/></svg>`,
 vec:`<svg viewBox="0 0 240 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
  <rect x="26" y="26" width="192" height="100" fill="none" stroke="${L}" stroke-width="1" stroke-dasharray="3 3" opacity=".6"/>
  <path d="M34 112C74 22 114 22 134 72S194 122 214 42" fill="none" stroke="${G}" stroke-width="2.6" stroke-linecap="round"/>
  <g stroke="${L}" stroke-width="1"><path d="M34 112L74 22M114 22L154 122M214 42L194 122"/></g>
  <g fill="${G}"><circle cx="74" cy="22" r="2.6"/><circle cx="114" cy="22" r="2.6"/><circle cx="154" cy="122" r="2.6"/><circle cx="194" cy="122" r="2.6"/></g>
  <g fill="#09090a" stroke="${G}" stroke-width="1.6"><rect x="29" y="107" width="10" height="10"/><rect x="129" y="67" width="10" height="10"/><rect x="209" y="37" width="10" height="10"/></g></svg>`};
const TAGS={d3:['Mesh','Seam','Unfold'],vec:['Bezier','Layer','SVG']};
const kind=a=>/3d/i.test(a.id+' '+a.path)?'d3':/vec/i.test(a.id+' '+a.path)?'vec':null;
const apps=globalThis.HL_APPS||[];
document.getElementById('cards').innerHTML=apps.map((a,i)=>{
 const k=kind(a),chips=(TAGS[k]||[]).map(t=>`<span>${t}</span>`).join('');
 return `<a class="app" href="${a.path}" style="--i:${i}">
  <div class="pv"><div class="chrome"><i></i><i></i><i></i><span>${a.name}</span></div>${k?PV[k]:`<div class="big">${a.icon}</div>`}</div>
  <div class="bd">
   <div class="hd"><span class="tile">${a.icon}</span><span class="nm"><b>${a.name}</b><span class="tag">App ${String(i+1).padStart(2,'0')}</span></span></div>
   <span class="d">${a.desc}</span>
   ${chips?`<div class="chips">${chips}</div>`:''}
   <div class="ft"><span class="ok">Siap offline</span><span class="open">Buka <span>→</span></span></div>
  </div></a>`}).join('');
const ct=document.getElementById('count');if(ct)ct.textContent=String(apps.length).padStart(2,'0')+' app';

let deferred;const btn=document.getElementById('install');
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;btn.hidden=false});
btn.onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;btn.hidden=true};
