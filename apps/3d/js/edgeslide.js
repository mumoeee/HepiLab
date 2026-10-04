/* edgeslide.js — Edge Slide ala Blender (G G): vertex pada edge/loop terpilih meluncur sepanjang edge di sampingnya.
   Desktop: tekan G G (G lalu G lagi) atau tombol ⇔ / menu Mesh; gerakkan mouse, klik / Enter = OK, klik kanan / Esc = batal, ketik angka (-1…1).
   HP: tombol ⇔ lalu seret jari di viewport, ✓ / ✕ di bar atas. Faktor −1…+1: negatif ke sisi kiri, positif ke sisi kanan loop.
   Memakai cache adjacency (core.js). Dimuat setelah proportional.js, sebelum main.js. */

/* Pecah edge terpilih jadi rantai berarah, lalu cari tetangga kiri/kanan tiap vertex dari face di kedua sisi rantai */
function slideSetup(o,keys){
 const A=adj(o),nb={};keys.forEach(k=>{const[a,b]=k.split('_').map(Number);(nb[a]=nb[a]||[]).push(b);(nb[b]=nb[b]||[]).push(a)});
 if(Object.values(nb).some(l=>l.length>2))return{err:'Edge Slide: pilihan bercabang tidak didukung — pilih satu loop / rantai edge.'};
 const used=new Set,chains=[];
 const walk=s=>{const ch=[s];let prev=-1,cur=s;
  for(;;){const nx=nb[cur].find(x=>x!==prev&&!used.has(ek(cur,x)));if(nx===undefined)break;used.add(ek(cur,nx));ch.push(nx);prev=cur;cur=nx;if(cur===s)break}return ch};
 Object.keys(nb).map(Number).filter(v=>nb[v].length===1).forEach(s=>{if(nb[s].some(x=>!used.has(ek(s,x))))chains.push(walk(s))});
 Object.keys(nb).map(Number).forEach(s=>{if(nb[s].some(x=>!used.has(ek(s,x))))chains.push(walk(s))});
 const Lf={},Rt={};
 const dirEdge=(a,b)=>{   // a→b: wajah kiri memuat a,b berurutan; wajah kanan memuat b,a berurutan
  let L=null,R=null;(A.ef[ek(a,b)]||[]).forEach(fi=>{const f=o.f[fi],n=f.length;for(let k=0;k<n;k++){
   if(f[k]===a&&f[(k+1)%n]===b)L={f,k,n};else if(f[k]===b&&f[(k+1)%n]===a)R={f,k,n}}});
  if(L){const{f,k,n}=L;if(Lf[a]===undefined)Lf[a]=f[(k+n-1)%n];Lf[b]=f[(k+2)%n]}   // tetangga kiri a = sebelum a; kiri b = sesudah b
  if(R){const{f,k,n}=R;Rt[a]=Rt[a]!==undefined?Rt[a]:f[(k+2)%n];if(Rt[b]===undefined)Rt[b]=f[(k+n-1)%n]}};
 chains.forEach(ch=>{for(let i=0;i<ch.length-1;i++)dirEdge(ch[i],ch[i+1])});
 const vs=[...new Set(chains.flat())].map(i=>({i,v:[...o.v[i]],L:Lf[i],R:Rt[i]}));
 if(!vs.some(x=>x.L!==undefined||x.R!==undefined))return{err:'Edge Slide: edge ini tidak punya face di sampingnya.'};
 return{vs}}

function slSelEdges(){if(mode!=='edit'||!sel)return[];if(sm==='e')return[...S.e];const vs=selV();return edges(sel).filter(([a,b])=>vs.has(a)&&vs.has(b)).map(x=>x[2])}
function slStart(fromKey){
 if(SL||MD)return;
 if(mode!=='edit'||!sel)return toast('Edge Slide: masuk mode Edit, lalu pilih edge / loop.');
 const keys=slSelEdges();if(!keys.length)return toast('Edge Slide: pilih edge dulu (mode Edge).');
 const r=slideSetup(sel,keys);if(r.err)return toast(r.err);
 SL={vs:r.vs,t:0,num:'',q:[0,0],s:[0,0]};
 const p=pivot(),c=scr(p);
 if(coarse){SL.q=[c[0]+80,c[1]];SL.s=[...SL.q]}else if(fromKey&&(LM[0]||LM[1])){SL.q=[...LM];SL.s=[...LM]}else{SL.q=[...c];SL.s=[...c];SL.rs=true}
 // arah layar acuan: vertex terdekat dengan titik awal
 let best=1e9;SL.sd=[1,0];SL.vs.forEach(x=>{const w0=W(sel,x.v),a=scr(w0),tg=x.R!==undefined?x.R:x.L;if(tg===undefined)return;
  const a2=scr(W(sel,sel.v[tg])),d=Math.hypot(a[0]-SL.s[0],a[1]-SL.s[1]);
  if(d<best){best=d;let sx=a2[0]-a[0],sy=a2[1]-a[1];if(x.R===undefined){sx=-sx;sy=-sy}SL.sd=[sx,sy]}});
 const L=Math.hypot(SL.sd[0],SL.sd[1]);if(L<40){if(L>1e-6)SL.sd=SL.sd.map(x=>x*40/L);else SL.sd=[40,0]}   // arah nyaris searah kamera: skala piksel minimum
 $('#mNum').value='';$('#mb2').hidden=false;$$('#mb2 [data-ax],#mb2 [data-pe]').forEach(b=>b.style.display='none');
 slApply()}
function slApply(){const o=sel,n=parseFloat(SL.num);
 let t=isFinite(n)?n:((SL.q[0]-SL.s[0])*SL.sd[0]+(SL.q[1]-SL.s[1])*SL.sd[1])/(SL.sd[0]*SL.sd[0]+SL.sd[1]*SL.sd[1]);
 t=clamp(t,-1,1);SL.t=t;
 SL.vs.forEach(x=>{const tg=t<0?x.L:x.R,k=Math.abs(t);
  if(tg===undefined){o.v[x.i]=[...x.v];return}
  const T=o.v[tg];o.v[x.i]=x.v.map((a,j)=>a+(T[j]-a)*k)});
 SL.txt='Edge Slide '+t.toFixed(3);$('#stm').textContent=SL.txt+'   ·   mouse / ketik −1…1 · Enter/klik = OK · Esc = batal';
 const mt=$('#mTxt');if(mt)mt.textContent=SL.txt;need();syncProps()}
function slEnd(ok){if(!SL)return;const S0=SL;SL=null;
 if(!ok)S0.vs.forEach(x=>{sel.v[x.i]=[...x.v]});
 $$('#mb2 [data-ax]').forEach(b=>{if(b.dataset.ax!=='n')b.style.display=''});$('#mb2').hidden=true;
 need();syncProps();$('#stm').textContent=ok?'Selesai.':'Dibatalkan.';if(ok&&typeof commit3==='function')commit3()}
function slKey(e){const k=e.key,st=()=>{e.preventDefault();e.stopImmediatePropagation()};
 if(k==='Escape'){st();slEnd(false)}else if(k==='Enter'||k===' '){st();slEnd(true)}
 else if(/^[0-9.]$/.test(k)){st();SL.num+=k;slApply()}
 else if(k==='-'){st();SL.num=SL.num[0]==='-'?SL.num.slice(1):'-'+SL.num;slApply()}
 else if(k==='Backspace'){st();SL.num=SL.num.slice(0,-1);slApply()}
 else if(!/^(Shift|Control|Alt|Meta)$/.test(k))st()}
/* dipanggil modal.js saat G ditekan lagi di tengah grab (G G) */
function slHook(){if(mode!=='edit'||!sel||!slSelEdges().length)return false;const keys=slSelEdges();if(slideSetup(sel,keys).err)return false;mdEnd(false);slStart(true);return !!SL}

/* ---------- Pointer & tombol ---------- */
addEventListener('pointermove',e=>{if(!SL)return;
 if(coarse){if(SL.lx!==undefined&&e.target===cvEl){SL.q[0]+=e.clientX-SL.lx;SL.q[1]+=e.clientY-SL.ly;SL.lx=e.clientX;SL.ly=e.clientY;slApply()}return}
 if(e.target===cvEl){const q=loc(e);if(SL.rs){SL.rs=false;SL.s=[...q]}SL.q=q;slApply()}},true);
addEventListener('pointerdown',e=>{if(!SL)return;const onC=e.target===cvEl;
 if(e.button===2&&onC){e.preventDefault();e.stopImmediatePropagation();slEnd(false)}
 else if(e.button===0&&onC){e.preventDefault();e.stopImmediatePropagation();if(coarse){SL.lx=e.clientX;SL.ly=e.clientY}else slEnd(true)}},true);
addEventListener('pointerup',()=>{if(SL)SL.lx=undefined},true);
{const _e=mdEnd;mdEnd=function(ok){if(SL)return slEnd(ok);_e(ok)}}
$('#mNum').addEventListener('input',e=>{if(SL){SL.num=e.target.value.replace(',','.');slApply()}});

/* ---------- Tombol toolbar + menu Mesh ---------- */
MM.slide=()=>slStart(isKey());
$('#t3 [data-a=pe]').insertAdjacentHTML('afterend','<button data-a="slide" title="Edge Slide (G G) — pilih edge / loop, lalu seret">⇔</button>');
$('#t3 [data-a=slide]').onclick=()=>slStart(false);
$('#mMesh').querySelector('optgroup[label="Mode Edit"]').insertAdjacentHTML('beforeend','<option value="slide">Edge Slide (G G)</option>');
syncUI();
