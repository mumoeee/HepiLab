/* history.js — Undo/Redo, autosave, simpan/buka file (.json), ekspor SVG & PNG.
   Cara kerja Undo: setelah tiap aksi, kondisi gambar dibandingkan dengan sebelumnya; kalau beda → masuk riwayat. */
let VH='',VU=[],VR=[];
const vstr=()=>JSON.stringify({v:1,sh:V.sh,ly:V.ly,act:V.act,nid:V.nid,lid});    // v = versi format file
function applyV(d,keep){V.sh=d.sh;V.ly=d.ly;V.act=V.ly.some(l=>l.id===d.act)?d.act:V.ly[0].id;V.nid=Math.max(d.nid||1,...V.sh.map(s=>s.id+1));lid=Math.max(d.lid||1,...V.ly.map(l=>l.id));
 V.sel=keep?new Set([...V.sel].filter(id=>byId(id))):new Set;V.pen=null;V.node=-1;vdr=null;vr();props()}
const vsave=c=>{try{localStorage.setItem('hepilab_vec',c)}catch(_){}};
function vcommit(){if(V.pen||vdr)return;const c=vstr();if(c===VH)return;VU.push(VH);if(VU.length>80)VU.shift();VR=[];VH=c;vsave(c)}
function vundo(){vcommit();if(!VU.length)return toast('Tidak ada yang bisa di-undo.');VR.push(VH);VH=VU.pop();applyV(JSON.parse(VH),1);vsave(VH);toast('Undo ↶')}
function vredo(){if(!VR.length)return toast('Tidak ada yang bisa di-redo.');VU.push(VH);VH=VR.pop();applyV(JSON.parse(VH),1);vsave(VH);toast('Redo ↷')}
['pointerup','keyup','change','click'].forEach(t=>addEventListener(t,()=>setTimeout(vcommit,0),true));
addEventListener('pagehide',vcommit);addEventListener('visibilitychange',vcommit);
try{const s=localStorage.getItem('hepilab_vec');if(s){const d=JSON.parse(s);if(Array.isArray(d.sh)&&Array.isArray(d.ly)&&d.ly.length)applyV(d)}}catch(_){}   // muat autosave
VH=vstr();

/* ---------- File & ekspor ---------- */
function svgStr(bg){const g=V.ly.filter(l=>l.v).map(l=>'<g>'+V.sh.filter(s=>s.ly===l.id).map(s=>shp(s,0).replace(/ data-id="\d+"/,'').replace(/ style="[^"]*"/,'')).join('')+'</g>').join('');
 return'<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">'+(bg?'<rect width="1000" height="700" fill="#fff"/>':'')+g+'</svg>'}
const fileSave=()=>HL.download(new Blob([vstr()],{type:'application/json'}),'hepilab-vector.json');
const fileOpen=()=>HL.pickFile((txt,name)=>{try{const d=JSON.parse(txt);if(!Array.isArray(d.sh)||!Array.isArray(d.ly)||!d.ly.length)throw 0;applyV(d);vcommit();toast('Dibuka: '+name)}catch(_){toast('File tidak valid.')}});
const exportSvg=()=>HL.download(new Blob([svgStr(0)],{type:'image/svg+xml'}),'hepilab.svg');
function exportPng(){const im=new Image;im.onload=()=>{const c=document.createElement('canvas');c.width=2000;c.height=1400;c.getContext('2d').drawImage(im,0,0,2000,1400);c.toBlob(b=>HL.download(b,'hepilab.png'))};im.onerror=()=>toast('Gagal membuat PNG.');im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgStr(1))}
function fileNew(){if(confirm('Kosongkan kanvas? (masih bisa di-undo)')){applyV({sh:[],ly:[{id:1,n:'Layer 1',v:1,l:0}],act:1,nid:1,lid:1});vcommit()}}
