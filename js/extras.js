/* extras.js — tambahan 3D: Undo/Redo, Pilih semua, Simpan otomatis + file, Tampilan, Seam.
   Dimuat SETELAH workspace3d.js dan SEBELUM main.js. */

/* ---------- Simpan / muat scene ---------- */
const sceneStr=()=>JSON.stringify({uid,objs:objs.map(o=>({id:o.id,name:o.name,v:o.v,f:o.f,color:o.color,vis:o.vis,mesh:o.mesh,seams:o.seams||[]}))});
function loadScene(str,keep){const d=JSON.parse(str);if(!Array.isArray(d.objs))throw new Error('bad');
 const id=keep&&sel?sel.id:null;objs=d.objs;objs.forEach(o=>{o.seams=o.seams||[]});uid=Math.max(d.uid||1,...objs.map(o=>o.id+1));
 SO=new Set;S={v:new Set,e:new Set,f:new Set};setSel(objs.find(o=>o.id===id)||null);need()}
function autosave(){try{localStorage.setItem('hepilab3d',sceneStr())}catch(e){}}
function loadAuto(){try{const s=localStorage.getItem('hepilab3d');if(!s)return false;loadScene(s);return true}catch(e){return false}}

/* ---------- Undo / Redo (otomatis: bandingkan kondisi scene setelah tiap aksi) ---------- */
let UNDO=[],REDO=[],HC='';
function histInit(){HC=sceneStr();UNDO=[];REDO=[]}
function commit3(){if(ws!=='3d')return;const c=sceneStr();if(c===HC)return;UNDO.push(HC);if(UNDO.length>60)UNDO.shift();REDO=[];HC=c;autosave()}
function undo3(){commit3();if(!UNDO.length)return toast('Tidak ada yang bisa di-undo.');REDO.push(HC);HC=UNDO.pop();loadScene(HC,true);autosave();toast('Undo ↶')}
function redo3(){if(!REDO.length)return toast('Tidak ada yang bisa di-redo.');UNDO.push(HC);HC=REDO.pop();loadScene(HC,true);autosave();toast('Redo ↷')}
['pointerup','keyup','change','click'].forEach(t=>addEventListener(t,()=>setTimeout(commit3,0),true));
addEventListener('visibilitychange',()=>{commit3();autosave()});addEventListener('pagehide',()=>{commit3();autosave()});

/* ---------- Pilih semua / kosongkan ---------- */
function selAll(){if(mode==='obj'){SO=new Set(objs.filter(o=>o.vis));setSel([...SO].pop()||null);return}
 if(!sel)return;const s=S[sm];if(sm==='v')sel.v.forEach((_,i)=>s.add(i));if(sm==='f')sel.f.forEach((_,i)=>s.add(i));if(sm==='e')edges(sel).forEach(x=>s.add(x[2]));need();syncUI()}
function selNone(){if(mode==='obj'){SO=new Set;setSel(null);return}S={v:new Set,e:new Set,f:new Set};need();syncUI()}

/* ---------- Tampilan kamera ---------- */
function frame3(){const pts=(mode==='edit'&&sel&&selV().size?[...selV()].map(i=>W(sel,sel.v[i])):(SO.size?[...SO]:objs).filter(o=>o.vis).flatMap(o=>o.v.map(p=>W(o,p))));
 if(!pts.length)return;const mn=[0,1,2].map(k=>Math.min(...pts.map(p=>p[k]))),mx=[0,1,2].map(k=>Math.max(...pts.map(p=>p[k])));
 OB.t=mn.map((x,k)=>(x+mx[k])/2);OB.r=clamp((Math.hypot(...mx.map((x,k)=>x-mn[k]))/2||1)*(ch>cw?4:2.8),1.5,60);cup()}
function view3(v){if(v==='frame')return frame3();const a={front:[0,1.5708],right:[1.5708,1.5708],top:[0,.02],persp:[.8,1.1]}[v];if(a){OB.th=a[0];OB.ph=a[1];cup()}}

/* ---------- Seam (edge yang dipotong saat Unfold) ---------- */
function toggleSeam(){if(mode!=='edit'||sm!=='e'||!S.e.size)return toast('Seam: masuk mode Edit → Edge, pilih edge dulu.');
 const o=sel,q=new Set(o.seams||[]),all=[...S.e].every(k=>q.has(k));S.e.forEach(k=>all?q.delete(k):q.add(k));o.seams=[...q];need();
 toast(all?'Seam dihapus.':'Seam ditandai (garis biru muda) — Unfold akan memotong di sini.')}
function drawSeams(){objs.forEach(o=>{if(!o.vis||!o.seams)return;o.seams.forEach(k=>{const[a,b]=k.split('_');if(o.v[a]&&o.v[b])ln3(W(o,o.v[a]),W(o,o.v[b]),'#3ad6ff',3.5)})})}

/* ---------- Sambung ke fungsi lama (draw, compact, dup, syncUI) ---------- */
const _draw0=draw;draw=function(){_draw0();drawSeams()};
const _compact0=compact;compact=function(o){const used=new Set(o.f.flat()),m={};let n=0;o.v.forEach((_,i)=>{if(used.has(i))m[i]=n++});
 o.seams=(o.seams||[]).map(k=>k.split('_').map(Number)).filter(([a,b])=>m[a]!==undefined&&m[b]!==undefined).map(([a,b])=>ek(m[a],m[b]));_compact0(o)};
const _dup0=dup;dup=function(){const src=[...SO];_dup0();if(mode==='obj')[...SO].forEach((n,i)=>{if(src[i]&&n!==src[i])n.seams=[...(src[i].seams||[])]})};
$('#t3 [data-a=dup]').onclick=dup;
const _su0=syncUI;syncUI=function(){_su0();$('#xSeam').style.display=mode==='edit'&&sm==='e'?'':'none'};

/* ---------- Tombol-tombol (dibuat lewat JS, tidak perlu edit HTML) ---------- */
$('#t3').insertAdjacentHTML('afterbegin','<button data-x="undo" title="Undo (Ctrl+Z)">↶</button><button data-x="redo" title="Redo (Ctrl+Shift+Z)">↷</button><hr>');
$('#t3').insertAdjacentHTML('beforeend','<hr><button data-x="all" title="Pilih semua (A)">☑</button><button data-x="none" title="Kosongkan pilihan (Alt+A)">☐</button>');
$('#t3').addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(b)({undo:undo3,redo:redo3,all:selAll,none:selNone})[b.dataset.x]()});
$('#bUnf').insertAdjacentHTML('beforebegin',
 '<button id="xSeam" style="display:none" title="Tandai edge terpilih sebagai garis POTONG saat Unfold">✂ Seam</button>'+
 '<select id="xView" title="Tampilan kamera"><option value="">🎥 Tampilan…</option><option value="frame">Fokus ke objek</option><option value="front">Depan</option><option value="right">Kanan</option><option value="top">Atas</option><option value="persp">Miring (default)</option></select>'+
 '<select id="xFile" title="Proyek tersimpan otomatis di HP ini"><option value="">💾 File…</option><option value="save">Simpan ke file (.json)</option><option value="open">Buka file…</option><option value="new">Proyek baru</option></select>');
$('#xSeam').onclick=toggleSeam;
$('#xView').onchange=e=>{view3(e.target.value);e.target.value=''};
const fileIn=document.createElement('input');fileIn.type='file';fileIn.accept='.json,application/json';fileIn.hidden=true;document.body.appendChild(fileIn);
fileIn.onchange=()=>{const f=fileIn.files[0];if(!f)return;const r=new FileReader();
 r.onload=()=>{try{loadScene(r.result,false);commit3();toast('Proyek dibuka: '+f.name)}catch(e){toast('File tidak valid.')}};r.readAsText(f);fileIn.value=''};
$('#xFile').onchange=e=>{const v=e.target.value;e.target.value='';
 if(v==='save'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([sceneStr()],{type:'application/json'}));a.download='hepilab-proyek.json';document.body.appendChild(a);a.click();a.remove();toast('Proyek disimpan ke file.')}
 else if(v==='open')fileIn.click();
 else if(v==='new'&&confirm('Kosongkan semua objek? (masih bisa di-undo)')){loadScene('{"uid":1,"objs":[]}');commit3()}};

/* ---------- Keyboard (capture: jalan duluan sebelum main.js) ---------- */
addEventListener('keydown',e=>{if(ws!=='3d'||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const c=e.ctrlKey||e.metaKey;
 if(c&&e.code==='KeyZ'){e.preventDefault();e.stopImmediatePropagation();e.shiftKey?redo3():undo3()}
 else if(c&&e.code==='KeyY'){e.preventDefault();e.stopImmediatePropagation();redo3()}
 else if(!c&&e.code==='KeyA'){e.preventDefault();e.stopImmediatePropagation();e.altKey?selNone():selAll()}},true);