/* ======== workflow ======== */
/* workflow.js — alur kerja ala Blender yang ramah sentuh:
   • Extrude (E) & Duplikat (Shift+D) langsung masuk grab; N = kunci ke arah normal (tombol N muncul di bar sentuh).
     Esc / ✕ membatalkan geseran saja — geometri baru tetap di tempatnya (sama seperti Blender), Undo membuangnya.
   • Hide (H) / Hide unselected (Shift+H) / Reveal (Alt+H), juga lewat tombol toolbar dan menu Mesh.
   • Statistik seleksi di pojok viewport, toggle garis topologi (View → Overlay).
   Dimuat setelah primitives.js, sebelum main.js. */

/* ---------- Wire overlay ---------- */
const syncWireBtn=()=>$$('#t3 [data-w=wire]').forEach(b=>b.classList.toggle('on',wireEd));
function toggleWire(){wireEd=!wireEd;try{localStorage.setItem('hl3dwire',wireEd?'1':'0')}catch(e){}syncWireBtn();need();toast(wireEd?'Garis topologi: nyala.':'Garis topologi: mati.')}

/* ---------- Hide / Reveal ----------
   Face yang disembunyikan dipindah ke o.hid (indeks vertex tetap sama), jadi tidak ikut tergambar, terpilih, atau terkena operasi.
   Aturan aman: begitu keluar dari mode Edit / pindah objek, semuanya otomatis ditampilkan lagi. */
function liveVs(o){if(!o||!o.hid||!o.hid.length)return null;const s=new Set;o.f.forEach(f=>f.forEach(v=>s.add(v)));return s}
{const _c=compact;compact=function(o){const h=o.hid&&o.hid.length?o.hid:null;if(!h)return _c(o);const n=o.f.length;o.f=o.f.concat(h);_c(o);o.hid=o.f.slice(n);o.f=o.f.slice(0,n)}}   // vertex milik face tersembunyi jangan terbuang
function unhideMesh(o,quiet){if(!o||!o.hid||!o.hid.length)return;o.f.push(...o.hid);o.hid=[];need();if(!quiet)toast('Face tersembunyi ditampilkan kembali (keluar dari mode Edit).')}
{const _sm=setMode;setMode=function(m){if(mode==='edit'&&m!=='edit')unhideMesh(sel);_sm(m)}}
{const _ss=setSel;setSel=function(o){if(sel&&sel!==o&&objs.includes(sel))unhideMesh(sel,true);_ss(o)}}
function selectNewFaces(o,from){for(let i=from;i<o.f.length;i++){const f=o.f[i];
 if(sm==='f')S.f.add(i);else if(sm==='v')f.forEach(v=>S.v.add(v));else f.forEach((a,j)=>S.e.add(ek(a,f[(j+1)%f.length])))}}
function hideSel(inv){
 if(mode==='obj'){
  if(inv&&!SO.size)return toast('Sembunyikan: pilih objek dulu.');
  const L=inv?objs.filter(o=>o.vis&&!SO.has(o)):[...SO].filter(o=>o.vis);
  if(!L.length)return toast(inv?'Tidak ada objek lain yang bisa disembunyikan.':'Sembunyikan: pilih objek dulu.');
  L.forEach(o=>o.vis=false);if(!inv)setSel(null);else SO=new Set([...SO].filter(o=>o.vis));
  return fin(L.length+' objek disembunyikan (Alt+H = tampilkan).')}
 if(!needEdit())return;
 const o=sel,vs=selV();if(!vs.size)return toast('Sembunyikan: pilih bagian mesh dulu.');
 const hit=new Set();
 if(sm==='f')S.f.forEach(i=>hit.add(i));else o.f.forEach((f,i)=>{if(f.some(v=>vs.has(v)))hit.add(i)});
 const keep=[],gone=[];o.f.forEach((f,i)=>((inv?!hit.has(i):hit.has(i))?gone:keep).push(f));
 if(!gone.length)return toast('Tidak ada face yang disembunyikan.');
 o.hid=(o.hid||[]).concat(gone);o.f=keep;clrS();fin(gone.length+' face disembunyikan (Alt+H = tampilkan).')}
function revealAll(){
 if(mode==='obj'){const h=objs.filter(o=>!o.vis);if(!h.length)return toast('Tidak ada objek tersembunyi.');
  h.forEach(o=>o.vis=true);SO=new Set(h);setSel(h[h.length-1]);return fin(h.length+' objek ditampilkan.')}
 if(!needEdit())return;const o=sel;
 if(!o.hid||!o.hid.length)return toast('Tidak ada face tersembunyi.');
 const n0=o.f.length,k=o.hid.length;o.f.push(...o.hid);o.hid=[];clrS();selectNewFaces(o,n0);fin(k+' face ditampilkan kembali.')}
/* operasi yang menggabung/menggeser indeks vertex: tampilkan dulu face tersembunyi supaya datanya tidak rusak */
['mergec','merged','mx','my','mz','bevel','lcut'].forEach(k=>{const f=MM[k];if(f)MM[k]=function(){if(sel&&sel.hid&&sel.hid.length)unhideMesh(sel);return f.apply(this,arguments)}});
MM.hide=()=>hideSel(false);MM.hideu=()=>hideSel(true);MM.reveal=revealAll;

/* ---------- Mulai grab setelah Extrude / Duplikat ---------- */
const isKey=()=>!!(window.event&&window.event.type==='keydown');
function startGrab(nd,fromKey){
 mdStart('g');if(!MD)return;
 MD.keep=true;   // Esc membatalkan geseran saja
 if(nd){MD.nd=nd;MD.ax='n'}
 if(!coarse&&(!fromKey||(LM[0]===0&&LM[1]===0)))MD.rs=true;   // dari tombol/menu: titik awal diambil saat kursor masuk kanvas
 const nb=$('#mb2 [data-ax=n]');if(nb)nb.style.display=nd?'':'none';
 mdApply();if(typeof mbAx==='function')mbAx()}
{const _e=mdEnd;mdEnd=function(ok){const M=MD;_e(ok);const nb=$('#mb2 [data-ax=n]');if(nb)nb.style.display='none';
 if(M&&M.keep&&!ok)toast('Geser dibatalkan — geometri baru tetap ada (↶ / Ctrl+Z untuk membuangnya).')}}
addEventListener('pointermove',e=>{if(MD&&MD.rs&&e.target===cvEl){MD.rs=false;MD.s=[...LM];mdApply()}},true);
{const _c3=commit3;commit3=function(){if(MD&&MD.keep)return;_c3()}}   // extrude/duplikat + geser = satu langkah Undo

function selNormalW(o){let fl;
 if(sm==='f')fl=[...S.f].map(i=>o.f[i]).filter(Boolean);else{const vs=selV();fl=o.f.filter(f=>f.some(v=>vs.has(v)))}
 const n=[0,0,0];fl.forEach(f=>{const w=f.map(v=>W(o,o.v[v]));w.forEach((a,k)=>{const b=w[(k+1)%w.length];n[0]+=(a[1]-b[1])*(a[2]+b[2]);n[1]+=(a[2]-b[2])*(a[0]+b[0]);n[2]+=(a[0]-b[0])*(a[1]+b[1])})});
 const L=Math.hypot(...n);return L>1e-9?n.map(x=>x/L):null}

/* Extrude: bentuk di tempat (jarak 0), lalu langsung geser sepanjang normal */
function extrudeGrab(){
 const fk=isKey();
 if(mode!=='edit'||!sel)return _ex0();
 const o=sel;if(!(sm==='f'?S.f.size:sm==='e'?S.e.size:S.v.size))return _ex0();   // _ex0 = extrude asli, memberi pesan yang sesuai
 const nd=selNormalW(o),before=sceneStr(),keep=EXD;EXD=0;
 try{_ex0()}finally{EXD=keep}
 if(sceneStr()===before)return;
 startGrab(nd,fk)}
extrude=extrudeGrab;$('#t3 [data-a=ext]').onclick=()=>extrude();

/* Extrude Individual Faces (Alt+E): tiap face di-extrude sendiri sepanjang normalnya, tanpa berbagi vertex/sisi dengan tetangga */
function nrmW(o,f){const w=f.map(v=>W(o,o.v[v])),n=[0,0,0];w.forEach((a,k)=>{const b=w[(k+1)%w.length];n[0]+=(a[1]-b[1])*(a[2]+b[2]);n[1]+=(a[2]-b[2])*(a[0]+b[0]);n[2]+=(a[0]-b[0])*(a[1]+b[1])});
 const L=Math.hypot(...n)||1;return n.map(x=>x/L)}
function extrudeIndiv(){
 const fk=isKey();if(!needEdit())return;const o=sel,fs=[...selF()];
 if(!fs.length)return toast('Extrude individual: pilih face dulu (mode Face, atau vertex/edge yang melingkupi face).');
 const ind={},side=[],tot=[0,0,0];
 fs.forEach(i=>{const f=o.f[i],nw=f.map(v=>{o.v.push([...o.v[v]]);return o.v.length-1}),nr=nrmW(o,f);
  f.forEach((a,k)=>{const j=(k+1)%f.length;side.push([a,f[j],nw[j],nw[k]])});   // arah sama dengan extrudeF
  o.f[i]=nw;nw.forEach(v=>ind[v]=nr);tot[0]+=nr[0];tot[1]+=nr[1];tot[2]+=nr[2]});
 o.f.push(...side);const L=Math.hypot(...tot),nd=L>1e-6?tot.map(x=>x/L):nrmW(o,o.f[fs[0]]);
 clrS();sm='f';S.f=new Set(fs);rebuild(o);need();syncUI();
 startGrab(nd,fk);if(MD)MD.ind=ind}   // tiap vertex bergeser sepanjang normal face-nya sendiri; N dilepas = geser bebas
MM.exti=extrudeIndiv;
$('#t3 [data-a=ext]').insertAdjacentHTML('afterend','<button data-a="exti" title="Extrude individual faces (Alt+E)">⤒</button>');$('#t3 [data-a=exti]').onclick=()=>extrudeIndiv();
addEventListener('keydown',e=>{if(MD||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.ctrlKey||e.metaKey||!e.altKey||e.shiftKey||e.code!=='KeyE')return;
 e.preventDefault();e.stopImmediatePropagation();if(mode==='edit')extrudeIndiv();else toast('Extrude individual: masuk mode Edit dulu (Tab).')},true);

/* Duplikat: objek (mode Object) atau face terpilih (mode Edit), lalu langsung geser */
function dupGeom(){
 const fk=isKey();if(!needEdit())return;const o=sel,fs=[...selF()];
 if(!fs.length)return toast('Duplikat: pilih face (atau vertex/edge yang melingkupi face).');
 const mp={},n0=o.f.length;
 fs.forEach(i=>o.f[i].forEach(v=>{if(mp[v]===undefined){mp[v]=o.v.length;o.v.push([...o.v[v]])}}));
 fs.forEach(i=>o.f.push(o.f[i].map(v=>mp[v])));
 clrS();selectNewFaces(o,n0);rebuild(o);need();syncUI();startGrab(null,fk)}
{const _d=dup;dup=function(){const fk=isKey();
 if(mode==='edit')return dupGeom();
 const before=[...SO];_d();if(mode==='obj'&&sel&&!before.includes(sel))startGrab(null,fk)}}
$('#t3 [data-a=dup]').onclick=()=>dup();
MM.dupe=()=>dup();

/* ---------- Tombol toolbar + menu Mesh + pintasan ---------- */
$('#t3 [data-x=all]').insertAdjacentHTML('beforebegin','<button data-w="hide" title="Sembunyikan terpilih (H) · Shift+H = sembunyikan yang tak terpilih">◌</button><button data-w="reveal" title="Tampilkan semua yang tersembunyi (Alt+H)">◉</button><button data-w="wire" title="Garis topologi di mode Edit (nyala/mati)">⊞</button><hr>');
$('#t3').addEventListener('click',e=>{const b=e.target.closest('[data-w]');if(b)b.dataset.w==='hide'?hideSel(false):b.dataset.w==='wire'?toggleWire():revealAll()});syncWireBtn();
{const m=$('#mMesh'),add='<option value="hide">Sembunyikan (H)</option><option value="hideu">Sembunyikan yang tak terpilih (Shift+H)</option><option value="reveal">Tampilkan semua (Alt+H)</option><option value="dupe">Duplikat + geser (Shift+D)</option>';
 m.querySelector('optgroup[label="Mode Edit"]').insertAdjacentHTML('beforeend','<option value="exti">Extrude individual (Alt+E)</option>'+add);m.querySelector('optgroup[label="Objek"]').insertAdjacentHTML('beforeend',add)}
addEventListener('keydown',e=>{if(MD||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.code!=='KeyH')return;
 e.preventDefault();e.stopImmediatePropagation();e.altKey?revealAll():hideSel(e.shiftKey)},true);

/* ---------- Statistik di pojok viewport ---------- */
let _stS='';
function updStats(){const el=$('#stx');if(!el)return;let t='';
 try{if(mode==='edit'&&sel){const o=sel,big=o.f.length>20000,ed=big?null:edges(o),sv=selV(),lv=liveVs(o);
   const se=sm==='e'?S.e.size:ed?ed.reduce((n,[a,b])=>n+(sv.has(a)&&sv.has(b)?1:0),0):0,
    sf=sm==='f'?S.f.size:sv.size?o.f.reduce((n,f)=>n+(f.every(v=>sv.has(v))?1:0),0):0;
   t='Vert '+sv.size+'/'+(lv?lv.size:o.v.length)+' · Edge '+se+'/'+(ed?ed.length:'–')+' · Face '+sf+'/'+o.f.length+(o.hid&&o.hid.length?' · '+o.hid.length+' tersembunyi':'')}
  else{const L=objs.filter(o=>o.vis);t='Objek '+[...SO].filter(o=>o.vis).length+'/'+L.length+' · Vert '+L.reduce((n,o)=>n+o.v.length,0)+' · Face '+L.reduce((n,o)=>n+o.f.length,0)}}catch(e){t=''}
 if(t!==_stS){_stS=t;el.textContent=t}}
{const _d=draw;draw=function(){_d();updStats()}}
need();syncUI();
