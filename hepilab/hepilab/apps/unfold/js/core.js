/* core.js — state & helper app Unfold. Dimuat PERTAMA (setelah shared/*). Tidak menyentuh DOM selain toast().
   Model data (sengaja sederhana supaya mudah dikembangkan):
     U.v  = [[x,y,z]…]      titik 3D (koordinat dunia, dikirim dari app 3D)
     U.f  = [[a,b,c,…]…]    face = daftar indeks titik
     U.em = {'a_b':[face…]} edge → face yang memakainya (edge dengan ≠2 face selalu jadi potongan)
     U.cuts  = Set edge yang DIPOTONG (awalnya = seam dari 3D)  ← Tahap 2: klik edge di 2D/3D mengubah ini
     U.res   = hasil unfold terakhir (lihat unfold.js) */
const ek=(a,b)=>a<b?a+'_'+b:b+'_'+a;                       // kunci edge unik, sama dengan app 3D
const sub3=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
 crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nor=a=>{const l=Math.hypot(...a)||1;return a.map(x=>x/l)};
const r3=x=>Math.round(x*1000)/1000,hsl=(h,s,l)=>`hsl(${h} ${s}% ${l}%)`;
const STORE='hepilab_unf';
const SEL={f:-1,e:null}; // pilihan saat ini (face / edge) — dipakai view2d & view3d

const U={name:'',v:[],f:[],em:{},fn:[],cuts:new Set,seams0:new Set,res:null,c:[0,0,0],rad:1};

/* Masukkan mesh baru. d = {name, v, f, cuts|seams}. Mengembalikan true bila berhasil. */
function setMesh(d){
 const v=[];for(const p of d.v||[]){if(!Array.isArray(p)||p.length<3||!p.slice(0,3).every(Number.isFinite)){toast('Data titik tidak valid.');return false}v.push([+p[0],+p[1],+p[2]])}
 const f=[];for(const fc of d.f||[]){if(!Array.isArray(fc))continue;
  const q=fc.filter(a=>Number.isInteger(a)&&a>=0&&a<v.length).filter((a,i,s)=>a!==s[(i+s.length-1)%s.length]);
  if(q.length>=3&&new Set(q).size===q.length)f.push(q)}
 if(!f.length){toast('Mesh kosong / tidak punya face yang valid.');return false}
 const em={};f.forEach((fc,i)=>fc.forEach((a,k)=>{const key=ek(a,fc[(k+1)%fc.length]);(em[key]=em[key]||[]).push(i)}));
 const fn=f.map(fc=>{const n=[0,0,0];fc.forEach((a,k)=>{const p=v[a],q=v[fc[(k+1)%fc.length]];   // normal Newell
  n[0]+=(p[1]-q[1])*(p[2]+q[2]);n[1]+=(p[2]-q[2])*(p[0]+q[0]);n[2]+=(p[0]-q[0])*(p[1]+q[1])});
  const l=Math.hypot(...n);return l>1e-12?n.map(x=>x/l):[0,0,1]});
 const mn=[0,1,2].map(k=>Math.min(...v.map(p=>p[k]))),mx=[0,1,2].map(k=>Math.max(...v.map(p=>p[k]))),cs=(d.cuts||d.seams||[]).filter(k=>em[k]);
 Object.assign(U,{name:String(d.name||'Model').slice(0,40),v,f,em,fn,cuts:new Set(cs),seams0:new Set(cs),
  c:mn.map((x,k)=>(x+mx[k])/2),rad:Math.hypot(...mx.map((x,k)=>x-mn[k]))/2||1});
 return true}

/* Terima berbagai bentuk data: proyek Unfold {app:'unfold',mesh:{v,f},cuts}, atau mesh mentah {v,f,seams} dari app 3D. */
function fromData(d){const m=d&&d.mesh?d.mesh:d;if(!m||!Array.isArray(m.v)||!Array.isArray(m.f))return false;
 return setMesh({name:d.name||m.name,v:m.v,f:m.f,cuts:d.cuts||d.seams||m.seams||[]})}

const projectData=()=>({ver:1,app:'unfold',name:U.name,mesh:{v:U.v,f:U.f},cuts:[...U.cuts]});   // format file proyek (naikkan ver bila struktur berubah)
function persist(){try{localStorage.setItem(STORE,JSON.stringify(projectData()))}catch(e){toast('Penyimpanan otomatis penuh — pakai Simpan (.json).')}}
function clearMesh(){Object.assign(U,{name:'',v:[],f:[],em:{},fn:[],cuts:new Set,seams0:new Set,res:null});try{localStorage.removeItem(STORE)}catch(e){}}

/* Contoh: kubus 2×2×2 (dipakai bila belum ada model dari 3D) */
const DEMO={name:'Kubus contoh',v:[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
 f:[[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]],cuts:[]};