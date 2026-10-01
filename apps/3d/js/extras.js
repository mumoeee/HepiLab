/* extras.js — fitur tambahan 3D: pilih semua, tampilan kamera, seam, menu File, dan pintasan keyboard.
   Beberapa fungsi lama (draw, compact, dup, syncUI) dibungkus di sini agar fitur baru ikut jalan. */

/* ---------- Pilih semua / kosongkan ---------- */
function selAll(){if(mode==='obj'){SO=new Set(objs.filter(o=>o.vis));setSel([...SO].pop()||null);return}
 if(!sel)return;const s=S[sm];if(sm==='v')sel.v.forEach((_,i)=>s.add(i));if(sm==='f')sel.f.forEach((_,i)=>s.add(i));if(sm==='e')edges(sel).forEach(x=>s.add(x[2]));need();syncUI()}
function selNone(){if(mode==='obj'){SO=new Set;setSel(null);return}S={v:new Set,e:new Set,f:new Set};need();syncUI()}

/* ---------- Tampilan kamera ---------- */
function frame3(){const pts=(mode==='edit'&&sel&&selV().size?[...selV()].map(i=>W(sel,sel.v[i])):(SO.size?[...SO]:objs).filter(o=>o.vis).flatMap(o=>o.v.map(p=>W(o,p))));
 if(!pts.length)return;const mn=[0,1,2].map(k=>Math.min(...pts.map(p=>p[k]))),mx=[0,1,2].map(k=>Math.max(...pts.map(p=>p[k])));
 OB.t=mn.map((x,k)=>(x+mx[k])/2);OB.r=clamp((Math.hypot(...mx.map((x,k)=>x-mn[k]))/2||1)*(ch>cw?4:2.8),1.5,60);cup()}
function view3(v){if(v==='frame')return frame3();const a={front:[0,1.5708],right:[1.5708,1.5708],top:[0,.02],persp:[.8,1.1]}[v];if(a){OB.th=a[0];OB.ph=a[1];cup()}}

/* ---------- Seam: edge yang ditandai akan DIPOTONG saat Unfold (disimpan di o.seams) ---------- */
function toggleSeam(){if(mode!=='edit'||sm!=='e'||!S.e.size)return toast('Seam: masuk mode Edit → Edge, pilih edge dulu.');
 const o=sel,q=new Set(o.seams||[]),all=[...S.e].every(k=>q.has(k));S.e.forEach(k=>all?q.delete(k):q.add(k));o.seams=[...q];need();
 toast(all?'Seam dihapus.':'Seam ditandai (garis biru muda) — Unfold akan memotong di sini.')}
function drawSeams(){objs.forEach(o=>{if(!o.vis||!o.seams)return;o.seams.forEach(k=>{const[a,b]=k.split('_');if(o.v[a]&&o.v[b])ln3(W(o,o.v[a]),W(o,o.v[b]),'#3ad6ff',3.5)})})}

/* ---------- Sambungan ke fungsi lama ---------- */
const _draw0=draw;draw=function(){_draw0();drawSeams()};
const _compact0=compact;compact=function(o){const used=new Set(o.f.flat()),m={};let n=0;o.v.forEach((_,i)=>{if(used.has(i))m[i]=n++});
 o.seams=(o.seams||[]).map(k=>k.split('_').map(Number)).filter(([a,b])=>m[a]!==undefined&&m[b]!==undefined).map(([a,b])=>ek(m[a],m[b]));_compact0(o)};
const _dup0=dup;dup=function(){const src=[...SO];_dup0();if(mode==='obj')[...SO].forEach((n,i)=>{if(src[i]&&n!==src[i])n.seams=[...(src[i].seams||[])]})};
$('#t3 [data-a=dup]').onclick=dup;
const _su0=syncUI;syncUI=function(){_su0();$('#xSeam').style.display=mode==='edit'&&sm==='e'?'':'none'};

/* ---------- Tombol (markup-nya ada di index.html) ---------- */
$('#t3').addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(b)({undo:undo3,redo:redo3,all:selAll,none:selNone})[b.dataset.x]()});
$('#xSeam').onclick=toggleSeam;
$('#xView').onchange=e=>{view3(e.target.value);e.target.value=''};
$('#xFile').onchange=e=>{const v=e.target.value;e.target.value='';
 if(v==='save'){HL.download(new Blob([sceneStr()],{type:'application/json'}),'hepilab-3d.json');toast('Proyek disimpan ke file.')}
 else if(v==='open')HL.pickFile((txt,name)=>{try{loadScene(txt,false);commit3();toast('Proyek dibuka: '+name)}catch(_){toast('File tidak valid.')}});
 else if(v==='new'&&confirm('Kosongkan semua objek? (masih bisa di-undo)')){loadScene('{"v":1,"uid":1,"objs":[]}');commit3()}};

/* ---------- Keyboard tambahan (fase capture: jalan lebih dulu dari main.js) ---------- */
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const c=e.ctrlKey||e.metaKey,stop=()=>{e.preventDefault();e.stopImmediatePropagation()};
 if(c&&e.code==='KeyZ'){stop();e.shiftKey?redo3():undo3()}
 else if(c&&e.code==='KeyY'){stop();redo3()}
 else if(!c&&e.code==='KeyA'){stop();e.altKey?selNone():selAll()}},true);
