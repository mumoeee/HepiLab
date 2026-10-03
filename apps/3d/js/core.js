
/* ======== core ======== */
/* core.js — helper khusus app 3D (dimuat setelah shared/util.js, sebelum file lain). */
const ws='3d';                                  // penanda workspace aktif (dipakai beberapa fungsi)
const ek=(a,b)=>a<b?a+'_'+b:b+'_'+a;            // kunci edge yang unik: ek(2,5) === ek(5,2) === '2_5'
let EXD=.4,INS=.3;   // parameter Extrude & Inset (diatur lewat panel operator di blender.js)
/* Transform modal (G/R/S ala Blender) — logikanya ada di modal.js.
   Pencegat tombol ditaruh di sini (file pertama dimuat) supaya jalan SEBELUM pintasan lain saat modal aktif. */
let MD=null;
addEventListener('keydown',e=>{if(MD&&e.target.id!=='mNum')mdKey(e)},true);

/* ======== camera ======== */
/* camera.js — vektor 3D, kamera orbit, proyeksi ke layar, helper gambar garis/poligon. */
/* =============== 3D WORKSPACE — renderer Canvas 2D buatan sendiri (tanpa library, jalan offline) =============== */
class V3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}clone(){return new V3(this.x,this.y,this.z)}add(b){this.x+=b.x;this.y+=b.y;this.z+=b.z;return this}sub(b){this.x-=b.x;this.y-=b.y;this.z-=b.z;return this}
 multiplyScalar(k){this.x*=k;this.y*=k;this.z*=k;return this}dot(b){return this.x*b.x+this.y*b.y+this.z*b.z}length(){return Math.hypot(this.x,this.y,this.z)}normalize(){return this.multiplyScalar(1/(this.length()||1))}
 crossVectors(a,b){const x=a.y*b.z-a.z*b.y,y=a.z*b.x-a.x*b.z,z=a.x*b.y-a.y*b.x;this.x=x;this.y=y;this.z=z;return this}applyM(o){[this.x,this.y,this.z]=W(o,[this.x,this.y,this.z]);return this}}
const T={Vector3:V3};
const vp=$('#vp'),cvEl=document.createElement('canvas'),g2=cvEl.getContext('2d');vp.prepend(cvEl);
let TF=Math.tan(Math.PI/8),ORTHO=false,CD=8;const TF0=TF,NEAR=.001,OB={th:.8,ph:1.1,r:8,t:[0,0,.8]},AXS={x:[1,0,0],y:[0,1,0],z:[0,0,1]},AC={x:'#e0503c',y:'#5fbf5a',z:'#4a8fe0'};
let cw=1,ch=1,dpr=1,E=[0,0,0],CR,CU,CF,dirty=true,multi=false;const need=()=>{dirty=true};
const sub3=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nor=a=>{const l=Math.hypot(...a)||1;return[a[0]/l,a[1]/l,a[2]/l]},LD=nor([.35,.5,.8]);
const rotM=r=>{const ca=Math.cos(r.x),sa=Math.sin(r.x),cb=Math.cos(r.y),sb=Math.sin(r.y),cc=Math.cos(r.z),sc=Math.sin(r.z);return[[cb*cc,-cb*sc,sb],[ca*sc+sa*sb*cc,ca*cc-sa*sb*sc,-sa*cb],[sa*sc-ca*sb*cc,sa*cc+ca*sb*sc,ca*cb]]};
const mmul=(A,B)=>A.map(r=>[0,1,2].map(j=>r[0]*B[0][j]+r[1]*B[1][j]+r[2]*B[2][j]));
function W(o,p){const M=o.mesh,R=rotM(M.rotation),q=[p[0]*M.scale.x,p[1]*M.scale.y,p[2]*M.scale.z];return[dot3(R[0],q)+M.position.x,dot3(R[1],q)+M.position.y,dot3(R[2],q)+M.position.z]}
function cup(){const{th,ph,t}=OB,K=ORTHO?250:1,r=OB.r*K;TF=TF0/K;CD=r;E=[t[0]+r*Math.sin(ph)*Math.sin(th),t[1]-r*Math.sin(ph)*Math.cos(th),t[2]+r*Math.cos(ph)];CF=nor(sub3(t,E));CR=nor(crs(CF,[0,0,1]));CU=crs(CR,CF);need()}
function rsz(){const r=vp.getBoundingClientRect();if(!r.width)return;dpr=Math.min(devicePixelRatio||1,2);cw=r.width;ch=r.height;cvEl.width=cw*dpr;cvEl.height=ch*dpr;need()}
new ResizeObserver(rsz).observe(vp);
const toC=p=>{const d=sub3(p,E);return[dot3(d,CR),dot3(d,CU),dot3(d,CF)]},pj=c=>{const k=ch/2/TF/c[2];return[cw/2+c[0]*k,ch/2-c[1]*k]},scr=p=>pj(toC(p));
function clipP(cs){const o=[];for(let i=0;i<cs.length;i++){const a=cs[i],b=cs[(i+1)%cs.length],ia=a[2]>=NEAR,ib=b[2]>=NEAR;if(ia)o.push(a);if(ia!==ib){const t=(NEAR-a[2])/(b[2]-a[2]);o.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,NEAR])}}return o}
function ln3(a,b,col,w){let A=toC(a),B=toC(b);if(A[2]<NEAR&&B[2]<NEAR)return;if(A[2]<NEAR||B[2]<NEAR){const bad=A[2]<NEAR,i=bad?A:B,j=bad?B:A,t=(NEAR-i[2])/(j[2]-i[2]),n=[i[0]+(j[0]-i[0])*t,i[1]+(j[1]-i[1])*t,NEAR];bad?A=n:B=n}
 const p=pj(A),q=pj(B);g2.strokeStyle=col;g2.lineWidth=w||1;g2.beginPath();g2.moveTo(p[0],p[1]);g2.lineTo(q[0],q[1]);g2.stroke()}
function poly(cs,fill,stroke,lw){g2.beginPath();cs.forEach((c,i)=>{const p=pj(c);i?g2.lineTo(p[0],p[1]):g2.moveTo(p[0],p[1])});g2.closePath();if(fill){g2.fillStyle=fill;g2.fill()}if(stroke){g2.strokeStyle=stroke;g2.lineWidth=lw||1;g2.stroke()}}

/* ======== mesh ======== */
/* mesh.js — data objek, generator primitif (kubus, silinder, ...), edge, helper seleksi. */
let objs=[],sel=null,mode='obj',sm='v',tool='move',uid=1,S={v:new Set,e:new Set,f:new Set};
const et=()=>tool;   // Move/Rotate/Scale juga berlaku di mode Edit
/* generator mesh: {v:[[x,y,z]], f:[[idx..]]} — wajah = polygon (n-gon), cocok untuk craft */
const GEN={
 cube:()=>({v:Array.from({length:8},(_,i)=>[i&1?.5:-.5,i&2?.5:-.5,i&4?.5:-.5]),f:[[1,3,7,5],[0,4,6,2],[2,6,7,3],[0,1,5,4],[4,5,7,6],[0,2,3,1]]}),
 plane:()=>({v:[[-.5,0,-.5],[-.5,0,.5],[.5,0,.5],[.5,0,-.5]],f:[[0,1,2,3]]}),
 cyl:(n=8)=>{const v=[],f=[],R=i=>i/n*Math.PI*2;for(let i=0;i<n;i++)v.push([Math.cos(R(i))*.5,-.5,Math.sin(R(i))*.5]);for(let i=0;i<n;i++)v.push([Math.cos(R(i))*.5,.5,Math.sin(R(i))*.5]);
  for(let i=0;i<n;i++){const j=(i+1)%n;f.push([i,n+i,n+j,j])}f.push([...Array(n).keys()],[...Array(n).keys()].map(i=>n+i).reverse());return{v,f}},
 cone:(n=8)=>{const v=[[0,.5,0]],f=[],R=i=>i/n*Math.PI*2;for(let i=0;i<n;i++)v.push([Math.cos(R(i))*.5,-.5,Math.sin(R(i))*.5]);
  for(let i=0;i<n;i++)f.push([1+i,0,1+(i+1)%n]);f.push([...Array(n).keys()].map(i=>1+i));return{v,f}}
};
GEN.pyr=()=>GEN.cone(4);
const NAMES={cube:'Kubus',cyl:'Silinder',cone:'Kerucut',pyr:'Piramida',plane:'Bidang'};
function mk(key,color='#d9b382'){const g=GEN[key](),id=uid++,o={id,name:NAMES[key]+' '+id,v:g.v,f:g.f,color,vis:true,mesh:{position:{x:0,y:0,z:0},rotation:{x:0,y:0,z:0},scale:{x:1,y:1,z:1}}};objs.push(o);need();return o}
const rebuild=need,setP=(o,x,y,z)=>Object.assign(o.mesh.position,{x,y,z}),drawEdit=need,tipShape=need;
function edges(o){const m=new Map();o.f.forEach(f=>f.forEach((a,k)=>{const b=f[(k+1)%f.length],key=ek(a,b);if(!m.has(key))m.set(key,[a,b,key])}));return[...m.values()]}
const selV=()=>{const o=sel,s=new Set;if(!o)return s;if(sm==='v')S.v.forEach(i=>s.add(i));if(sm==='e')S.e.forEach(k=>k.split('_').forEach(i=>s.add(+i)));if(sm==='f')S.f.forEach(i=>o.f[i]&&o.f[i].forEach(v=>s.add(v)));return s};
