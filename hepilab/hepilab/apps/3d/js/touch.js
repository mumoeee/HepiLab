
/* ======== mobile ======== */
/* mobile.js — sumbu Z ke atas (primitif & posisi tambah), skala seragam, kontrol sentuh G/R/S. Dimuat setelah view.js, sebelum main.js. */

/* ---------- Z ke atas: putar primitif 90° di sumbu X (Y lama → Z). pyr ikut lewat cone ---------- */
{const zu=g=>{g.v=g.v.map(p=>[p[0],-p[2],p[1]]);return g};
 ['plane','cyl','cone','sphere','torus'].forEach(k=>{const f=GEN[k];GEN[k]=(...a)=>zu(f(...a))})}
const _addZ=add;add=function(k){_addZ(k);if(sel){setP(sel,CUR[0],CUR[1],CUR[2]+(k==='plane'?0:.5));need();syncProps()}};

/* ---------- Skala seragam: titik tengah gizmo Scale (seret = semua sumbu) + kunci di panel ---------- */
const _gzh=gzHit;gzHit=function(x,y){if(tool==='scale'&&gzGeo()){const s=scr(pivot());if(Math.hypot(s[0]-x,s[1]-y)<(coarse?26:14))return'u'}return _gzh(x,y)};
const _gzd=gzDrag;gzDrag=function(dx,dy){if(dr.a!=='u')return _gzd(dx,dy);const f=Math.max(.2,1+(dx-dy)*.008),p=pivot();
 if(mode==='obj')SO.forEach(o=>['x','y','z'].forEach(a=>o.mesh.scale[a]=Math.max(.01,o.mesh.scale[a]*f)));
 else selV().forEach(i=>{const r=sub3(W(sel,sel.v[i]),p);sel.v[i]=Wi(sel,p.map((c,k)=>c+r[k]*f))});need();syncProps()};
const _dgz=drawGizmo;drawGizmo=function(){_dgz();if(tool==='scale'&&sel&&!(mode==='edit'&&!selV().size)){const p=pivot();if(toC(p)[2]>=NEAR){const s=scr(p);
 g2.strokeStyle='#fff';g2.fillStyle='rgba(255,255,255,.25)';g2.lineWidth=2;g2.beginPath();g2.arc(s[0],s[1],coarse?18:11,0,6.283);g2.fill();g2.stroke()}}};
$('#props3 [data-p=s0]').parentNode.insertAdjacentHTML('afterend','<div class="f2"><label style="grid-column:span 4"><input type="checkbox" id="sLock" checked> Skala seragam (3 sumbu ikut)</label></div>');
$$('#props3 input[data-p^=s]').forEach(i=>i.addEventListener('input',()=>{const v=parseFloat(i.value);if(sel&&v>0&&$('#sLock').checked){['x','y','z'].forEach(a=>sel.mesh.scale[a]=Math.max(.01,v));need();syncProps()}}));

/* ---------- Sentuh: bar bawah G/R/S. Saat modal aktif: seret jari di kanvas, X/Y/Z kunci sumbu, ✓ / ✕ ---------- */
vp.insertAdjacentHTML('beforeend','<div id="mbar">'+
 '<div id="mb2" hidden><div id="mTxt"></div><button data-ax="x">X</button><button data-ax="y">Y</button><button data-ax="z">Z</button><input id="mNum" type="text" inputmode="decimal" placeholder="ketik angka"><button id="mNeg">±</button><button id="mOk" class="on">✓ OK</button><button id="mNo">✕ Batal</button></div></div>');
const mbAx=()=>$$('#mb2 [data-ax]').forEach(b=>b.classList.toggle('on',!!MD&&MD.ax===b.dataset.ax));
const _mds=mdStart;mdStart=function(k){if(coarse){const c=scr(pivot());LM=[c[0]+80,c[1]]}_mds(k);if(MD){$('#mNum').value='';$('#mb2').hidden=false;mbAx()}};
const _mde=mdEnd;mdEnd=function(ok){_mde(ok);$('#mb2').hidden=true};
$('#mbar').onclick=e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.ax&&MD){MD.ax=MD.ax===d.ax?null:d.ax;mdApply();mbAx()}
 else if(b.id==='mOk')mdEnd(true);else if(b.id==='mNo')mdEnd(false);else if(b.id==='mNeg'&&MD){const i=$('#mNum');i.value=i.value[0]==='-'?i.value.slice(1):'-'+i.value;MD.num=i.value;mdApply()}};


/* ---------- Ketik angka di HP: kolom di bar bawah (keyboard HP muncul saat kolom diketuk) ---------- */
$('#mNum').oninput=e=>{if(MD){MD.num=e.target.value.replace(',','.');mdApply()}};
$('#mNum').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();mdEnd(true)}else if(e.key==='Escape')mdEnd(false)};
const _mda=mdApply;mdApply=function(){_mda();$('#mTxt').textContent=MD?MD.txt:''};
/* tinggi layar mengikuti area yang benar-benar terlihat (di atas keyboard & bilah navigasi) */
{const fit=()=>{document.body.style.height=(window.visualViewport?visualViewport.height:innerHeight)+'px'};fit();addEventListener('resize',fit);
 if(window.visualViewport){visualViewport.addEventListener('resize',fit);visualViewport.addEventListener('scroll',()=>scrollTo(0,0))}}

/* ---------- HP: G/R/S langsung (di toolbar) + ☰ panel & ⛶ layar penuh (di baris menu atas) ---------- */
{const h=$('#t3 [data-t=scale]').nextElementSibling,T=(k,n,t)=>`<button class="ts" data-m="${k}" title="${t}: seret jari di kanvas"><b>${k.toUpperCase()}</b><small>${n}</small></button>`;
 h.insertAdjacentHTML('afterend',T('g','geser','Geser langsung')+T('r','putar','Putar langsung')+T('s','skala','Skala langsung (seragam)')+'<hr class="tsh">');
 $$('#t3 .ts').forEach(b=>b.onclick=()=>mdStart(b.dataset.m));
 const m=$('#menu'),f=document.createElement('button');m.textContent='☰';m.title='Outliner & Transform';f.id='bFs';f.title='Layar penuh';f.textContent='⛶';$('#vh').prepend(m);m.after(f);
 f.onclick=()=>{const d=document,el=d.documentElement;if(d.fullscreenElement||d.webkitFullscreenElement)return(d.exitFullscreen||d.webkitExitFullscreen).call(d);
  const r=el.requestFullscreen||el.webkitRequestFullscreen;if(!r)return toast('Layar penuh tidak didukung browser ini. iPhone: Bagikan → Tambahkan ke Layar Utama.');
  const p=r.call(el,{navigationUI:'hide'});p&&p.catch&&p.catch(()=>toast('Layar penuh ditolak browser.'))}}
cvEl.addEventListener('pointerdown',()=>{$('#h3').style.display='none'},{once:true});   // petunjuk hilang setelah disentuh
