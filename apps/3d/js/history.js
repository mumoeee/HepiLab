
/* ======== history ======== */
/* history.js — simpan/muat scene, autosave ke browser, Undo/Redo.
   Cara kerja Undo: setelah tiap aksi, kondisi scene dibandingkan dengan sebelumnya. Kalau beda → masuk riwayat. */

/* ---------- Scene <-> teks JSON (v = versi format file, naikkan bila struktur berubah) ---------- */
const sceneStr=()=>JSON.stringify({v:2,uid,objs:objs.map(o=>({id:o.id,name:o.name,v:o.v,f:o.f,color:o.color,vis:o.vis,mesh:o.mesh,seams:o.seams||[]}))});
function loadScene(str,keep){const d=JSON.parse(str);if(!Array.isArray(d.objs))throw new Error('bad');
 const id=keep&&sel?sel.id:null;objs=d.objs;if(!d.v||d.v<2)objs.forEach(o=>{const m=o.mesh,p=m.position;m.position={x:p.x,y:-p.z,z:p.y};Object.assign(m.rotation,eul(mmul(axisRot([1,0,0],Math.PI/2),rotM(m.rotation))))});objs.forEach(o=>{o.seams=o.seams||[]});uid=Math.max(d.uid||1,...objs.map(o=>o.id+1));
 SO=new Set;S={v:new Set,e:new Set,f:new Set};setSel(objs.find(o=>o.id===id)||null);need()}

/* ---------- Autosave (localStorage) ---------- */
function autosave(){try{localStorage.setItem('hepilab3d',sceneStr())}catch(e){}}
function loadAuto(){try{const s=localStorage.getItem('hepilab3d');if(!s)return false;loadScene(s);return true}catch(e){return false}}

/* ---------- Undo / Redo ---------- */
let UNDO=[],REDO=[],HC='';
function histInit(){HC=sceneStr();UNDO=[];REDO=[]}
function commit3(){const c=sceneStr();if(c===HC)return;UNDO.push(HC);if(UNDO.length>60)UNDO.shift();REDO=[];HC=c;autosave()}
function undo3(){commit3();if(!UNDO.length)return toast('Tidak ada yang bisa di-undo.');REDO.push(HC);HC=UNDO.pop();loadScene(HC,true);autosave();toast('Undo ↶')}
function redo3(){if(!REDO.length)return toast('Tidak ada yang bisa di-redo.');UNDO.push(HC);HC=REDO.pop();loadScene(HC,true);autosave();toast('Redo ↷')}
let _ct;const soon=()=>{clearTimeout(_ct);_ct=setTimeout(commit3,150)};   // digabung: banyak event berurutan = 1x simpan (lebih ringan)
['pointerup','keyup','change','click'].forEach(t=>addEventListener(t,soon,true));
addEventListener('visibilitychange',()=>{commit3();autosave()});addEventListener('pagehide',()=>{commit3();autosave()});
