/* workspace3d.js — seluruh Workspace 3D: kamera, renderer canvas, primitif, picking, gizmo, snap, edit mesh, outliner, panel. */
/* =============== 3D WORKSPACE — renderer Canvas 2D buatan sendiri (tanpa library, jalan offline) =============== */
class V3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}clone(){return new V3(this.x,this.y,this.z)}add(b){this.x+=b.x;this.y+=b.y;this.z+=b.z;return this}sub(b){this.x-=b.x;this.y-=b.y;this.z-=b.z;return this}
 multiplyScalar(k){this.x*=k;this.y*=k;this.z*=k;return this}dot(b){return this.x*b.x+this.y*b.y+this.z*b.z}length(){return Math.hypot(this.x,this.y,this.z)}normalize(){return this.multiplyScalar(1/(this.length()||1))}
 crossVectors(a,b){const x=a.y*b.z-a.z*b.y,y=a.z*b.x-a.x*b.z,z=a.x*b.y-a.y*b.x;this.x=x;this.y=y;this.z=z;return this}applyM(o){[this.x,this.y,this.z]=W(o,[this.x,this.y,this.z]);return this}}
const T={Vector3:V3};
const vp=$('#vp'),cvEl=document.createElement('canvas'),g2=cvEl.getContext('2d'),coarse=matchMedia('(pointer:coarse)').matches;vp.prepend(cvEl);
const TF=Math.tan(Math.PI/8),NEAR=.1,OB={th:.8,ph:1.1,r:8,t:[0,.8,0]},AXS={x:[1,0,0],y:[0,1,0],z:[0,0,1]},AC={x:'#e0503c',y:'#5fbf5a',z:'#4a8fe0'};
let cw=1,ch=1,dpr=1,E=[0,0,0],CR,CU,CF,dirty=true,multi=false;const need=()=>{dirty=true};
const sub3=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nor=a=>{const l=Math.hypot(...a)||1;return[a[0]/l,a[1]/l,a[2]/l]},LD=nor([.35,.8,.5]);
const rotM=r=>{const ca=Math.cos(r.x),sa=Math.sin(r.x),cb=Math.cos(r.y),sb=Math.sin(r.y),cc=Math.cos(r.z),sc=Math.sin(r.z);return[[cb*cc,-cb*sc,sb],[ca*sc+sa*sb*cc,ca*cc-sa*sb*sc,-sa*cb],[sa*sc-ca*sb*cc,sa*cc+ca*sb*sc,ca*cb]]};
const mmul=(A,B)=>A.map(r=>[0,1,2].map(j=>r[0]*B[0][j]+r[1]*B[1][j]+r[2]*B[2][j]));
function W(o,p){const M=o.mesh,R=rotM(M.rotation),q=[p[0]*M.scale.x,p[1]*M.scale.y,p[2]*M.scale.z];return[dot3(R[0],q)+M.position.x,dot3(R[1],q)+M.position.y,dot3(R[2],q)+M.position.z]}
function cup(){const{th,ph,r,t}=OB;E=[t[0]+r*Math.sin(ph)*Math.sin(th),t[1]+r*Math.cos(ph),t[2]+r*Math.sin(ph)*Math.cos(th)];CF=nor(sub3(t,E));CR=nor(crs(CF,[0,1,0]));CU=crs(CR,CF);need()}
function rsz(){const r=vp.getBoundingClientRect();if(!r.width)return;dpr=Math.min(devicePixelRatio||1,2);cw=r.width;ch=r.height;cvEl.width=cw*dpr;cvEl.height=ch*dpr;need()}
new ResizeObserver(rsz).observe(vp);
const toC=p=>{const d=sub3(p,E);return[dot3(d,CR),dot3(d,CU),dot3(d,CF)]},pj=c=>{const k=ch/2/TF/c[2];return[cw/2+c[0]*k,ch/2-c[1]*k]},scr=p=>pj(toC(p));
function clipP(cs){const o=[];for(let i=0;i<cs.length;i++){const a=cs[i],b=cs[(i+1)%cs.length],ia=a[2]>=NEAR,ib=b[2]>=NEAR;if(ia)o.push(a);if(ia!==ib){const t=(NEAR-a[2])/(b[2]-a[2]);o.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,NEAR])}}return o}
function ln3(a,b,col,w){let A=toC(a),B=toC(b);if(A[2]<NEAR&&B[2]<NEAR)return;if(A[2]<NEAR||B[2]<NEAR){const bad=A[2]<NEAR,i=bad?A:B,j=bad?B:A,t=(NEAR-i[2])/(j[2]-i[2]),n=[i[0]+(j[0]-i[0])*t,i[1]+(j[1]-i[1])*t,NEAR];bad?A=n:B=n}
 const p=pj(A),q=pj(B);g2.strokeStyle=col;g2.lineWidth=w||1;g2.beginPath();g2.moveTo(p[0],p[1]);g2.lineTo(q[0],q[1]);g2.stroke()}
function poly(cs,fill,stroke,lw){g2.beginPath();cs.forEach((c,i)=>{const p=pj(c);i?g2.lineTo(p[0],p[1]):g2.moveTo(p[0],p[1])});g2.closePath();if(fill){g2.fillStyle=fill;g2.fill()}if(stroke){g2.strokeStyle=stroke;g2.lineWidth=lw||1;g2.stroke()}}

let objs=[],sel=null,mode='obj',sm='v',tool='move',uid=1,S={v:new Set,e:new Set,f:new Set};
const et=()=>mode==='edit'?'move':tool;
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

function draw(){dirty=false;g2.setTransform(dpr,0,0,dpr,0,0);g2.fillStyle='#1a1f23';g2.fillRect(0,0,cw,ch);g2.lineJoin='round';
 for(let i=-12;i<=12;i++){const c=i?'#2a3238':'#56646e';ln3([i,0,-12],[i,0,12],c);ln3([-12,0,i],[12,0,i],c)}
 [['#e0503c',[12,0,0]],['#5fbf5a',[0,12,0]],['#4a8fe0',[0,0,12]]].forEach(([c,p])=>ln3([0,0,0],p,c,1.5));
 const fl=[];objs.forEach(o=>{if(!o.vis)return;const wv=o.v.map(p=>W(o,p)),h=parseInt(o.color.slice(1),16),rgb=[h>>16&255,h>>8&255,h&255];
  o.f.forEach(f=>{const vs=f.map(i=>wv[i]),cs=clipP(vs.map(toC));if(cs.length<3)return;let n=[0,0,0];
   vs.forEach((a,k)=>{const b=vs[(k+1)%vs.length];n[0]+=(a[1]-b[1])*(a[2]+b[2]);n[1]+=(a[2]-b[2])*(a[0]+b[0]);n[2]+=(a[0]-b[0])*(a[1]+b[1])});n=nor(n);
   const k=Math.min(1,.38+.5*Math.abs(dot3(n,LD))+.12*Math.abs(n[1]));fl.push({cs,z:cs.reduce((t,c)=>t+c[2],0)/cs.length,col:`rgb(${rgb.map(x=>x*k|0)})`})})});
 fl.sort((a,b)=>b.z-a.z).forEach(q=>poly(q.cs,q.col,'#14181b',1));
 if(mode==='obj')SO.forEach(o=>{if(!o.vis)return;const wv=o.v.map(p=>W(o,p));edges(o).forEach(([a,b])=>ln3(wv[a],wv[b],o===sel?'#ffa53a':'#c98a35',2))});
 if(mode==='edit'&&sel){const o=sel,vs=selV();
  if(sm==='f')S.f.forEach(i=>{const f=o.f[i];if(f){const cs=clipP(f.map(v=>toC(W(o,o.v[v]))));if(cs.length>2)poly(cs,'rgba(255,165,58,.5)')}});
  if(sm==='e')S.e.forEach(k=>{const[a,b]=k.split('_');ln3(W(o,o.v[a]),W(o,o.v[b]),'#ffa53a',2.5)});
  o.v.forEach((p,i)=>{const c=toC(W(o,p));if(c[2]<NEAR)return;const q=pj(c);g2.fillStyle=vs.has(i)?'#ffa633':'#cfe0f2';g2.beginPath();g2.arc(q[0],q[1],coarse?6.5:4.5,0,6.283);g2.fill()})}
 if(snapPt){const s=scr(snapPt);g2.strokeStyle='#4cf';g2.lineWidth=2;g2.beginPath();g2.arc(s[0],s[1],9,0,6.283);g2.stroke()}
 if(dr&&dr.k==='box'){g2.strokeStyle='#4cc3b3';g2.lineWidth=1;g2.setLineDash([5,4]);g2.strokeRect(dr.sx,dr.sy,dr.x-dr.sx,dr.y-dr.sy);g2.setLineDash([])}
 const G=gzGeo();if(G)for(const k in G){const[a,b]=G[k],t=et();g2.strokeStyle=g2.fillStyle=AC[k];g2.lineWidth=3.5;g2.beginPath();g2.moveTo(a[0],a[1]);g2.lineTo(b[0],b[1]);g2.stroke();const r=coarse?10:7;
  if(t==='scale')g2.fillRect(b[0]-r*.8,b[1]-r*.8,r*1.6,r*1.6);else{g2.beginPath();g2.arc(b[0],b[1],r,0,6.283);t==='rotate'?(g2.lineWidth=3,g2.stroke()):g2.fill()}}}
function pivot(){if(mode==='obj'){const c=[0,0,0];SO.forEach(o=>{const p=o.mesh.position;c[0]+=p.x;c[1]+=p.y;c[2]+=p.z});return c.map(x=>x/(SO.size||1))}const vs=[...selV()],c=[0,0,0];vs.forEach(i=>{const w=W(sel,sel.v[i]);c[0]+=w[0];c[1]+=w[1];c[2]+=w[2]});return c.map(x=>x/(vs.length||1))}
function gzGeo(){if(!sel||(mode==='edit'&&!selV().size))return null;const p=pivot();if(toC(p)[2]<NEAR)return null;const L=Math.hypot(...sub3(E,p))*.2,a=scr(p),r={};for(const k in AXS)r[k]=[a,scr(p.map((x,i)=>x+AXS[k][i]*L))];return r}
const dseg=(x,y,A,B)=>{const dx=B[0]-A[0],dy=B[1]-A[1],l=dx*dx+dy*dy||1,t=clamp(((x-A[0])*dx+(y-A[1])*dy)/l,0,1);return Math.hypot(x-A[0]-t*dx,y-A[1]-t*dy)};
function gzHit(x,y){const G=gzGeo();if(!G)return null;let b=coarse?26:12,h=null;for(const k in G){const d=dseg(x,y,G[k][0],G[k][1]);if(d<b){b=d;h=k}}return h}
function gzDrag(dx,dy){const ax=dr.a,d=AXS[ax],p=pivot(),a=scr(p),b=scr(p.map((x,i)=>x+d[i])),sx=b[0]-a[0],sy=b[1]-a[1],L=Math.hypot(sx,sy),m=(dx*sx+dy*sy)/(L||1),amt=m/Math.max(L,14),M=sel.mesh,t=et();
 if(mode==='obj'){SO.forEach(ob=>{const M=ob.mesh;if(t==='move')M.position[ax]+=amt;else if(t==='rotate'){const R=mmul(rotM({x:ax==='x'?m*.012:0,y:ax==='y'?m*.012:0,z:ax==='z'?m*.012:0}),rotM(M.rotation));
   const y=Math.asin(clamp(R[0][2],-1,1));M.rotation.y=y;if(Math.abs(R[0][2])<.9999999){M.rotation.x=Math.atan2(-R[1][2],R[2][2]);M.rotation.z=Math.atan2(-R[0][1],R[0][0])}else{M.rotation.x=Math.atan2(R[2][1],R[1][1]);M.rotation.z=0}}
  else M.scale[ax]=Math.max(.05,M.scale[ax]*(1+m*.008))})}
 else{const R=rotM(M.rotation),w=d.map(x=>x*amt),l=[0,1,2].map(i=>(R[0][i]*w[0]+R[1][i]*w[1]+R[2][i]*w[2])/[M.scale.x,M.scale.y,M.scale.z][i]);selV().forEach(i=>{sel.v[i][0]+=l[0];sel.v[i][1]+=l[1];sel.v[i][2]+=l[2]})}
 need();syncProps()}
const rayOf=(x,y)=>nor(CF.map((f,i)=>f+CR[i]*(x-cw/2)/(ch/2)*TF-CU[i]*(y-ch/2)/(ch/2)*TF));
function tri(D,A,B,C){const e1=sub3(B,A),e2=sub3(C,A),p=crs(D,e2),det=dot3(e1,p);if(Math.abs(det)<1e-9)return-1;const iv=1/det,s=sub3(E,A),u=dot3(s,p)*iv;if(u<0||u>1)return-1;const q=crs(s,e1),v=dot3(D,q)*iv;if(v<0||u+v>1)return-1;return dot3(e2,q)*iv}
function hitRay(D,list){let best=null;list.forEach(o=>{const wv=o.v.map(p=>W(o,p));o.f.forEach((f,fi)=>{for(let k=1;k<f.length-1;k++){const t=tri(D,wv[f[0]],wv[f[k]],wv[f[k+1]]);if(t>0&&(!best||t<best.t))best={o,fi,t}}})});return best}
const sp=(o,p)=>scr(W(o,p));
const P=new Map();let dr=null,pin=null;const loc=e=>{const r=cvEl.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
function pan(dx,dy){const s=OB.r*2*TF/ch;OB.t=OB.t.map((v,i)=>v-CR[i]*dx*s+CU[i]*dy*s)}
cvEl.oncontextmenu=e=>e.preventDefault();
cvEl.onpointerdown=e=>{cvEl.setPointerCapture(e.pointerId);const q=loc(e);P.set(e.pointerId,q);
 if(P.size===2){dr=null;const[a,b]=[...P.values()];pin={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,m:[(a[0]+b[0])/2,(a[1]+b[1])/2]};return}if(P.size>2)return;
 if(e.button===2||e.button===1){dr={k:e.shiftKey?'pan':'orb',x:q[0],y:q[1]};return}
 const h=gzHit(q[0],q[1]);if(h){dr={k:'gz',a:h,x:q[0],y:q[1]};return}
 const hit=find(q[0],q[1]);
 if(hit!==null&&et()==='move'){const isSel=mode==='obj'?SO.has(hit):S[sm].has(hit);if(!isSel)applyHit(hit,e.shiftKey||multi);const f=sel&&freeStart(q);if(f){dr=f;return}}
 if(boxSel){dr={k:'box',x:q[0],y:q[1],sx:q[0],sy:q[1],sh:e.shiftKey||multi};return}
 dr={k:'click',x:q[0],y:q[1],sx:q[0],sy:q[1],sh:e.shiftKey}};
cvEl.onpointermove=e=>{if(!P.has(e.pointerId))return;const q=loc(e);P.set(e.pointerId,q);
 if(pin&&P.size===2){const[a,b]=[...P.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1])||1,m=[(a[0]+b[0])/2,(a[1]+b[1])/2];OB.r=clamp(OB.r*pin.d/d,1.5,60);pan(m[0]-pin.m[0],m[1]-pin.m[1]);pin={d,m};cup();return}
 if(!dr)return;if(dr.k==='free'){freeMove(dr,q);return}if(dr.k==='box'){dr.x=q[0];dr.y=q[1];need();return}const dx=q[0]-dr.x,dy=q[1]-dr.y;if(dr.k==='click'&&Math.hypot(q[0]-dr.sx,q[1]-dr.sy)>(coarse?10:4))dr.k='orb';
 if(dr.k==='orb'){OB.th-=dx*.008;OB.ph=clamp(OB.ph-dy*.008,.05,3.09);cup()}else if(dr.k==='pan'){pan(dx,dy);cup()}else if(dr.k==='gz')gzDrag(dx,dy);
 dr.x=q[0];dr.y=q[1]};
cvEl.onpointerup=cvEl.onpointercancel=e=>{const was=dr;P.delete(e.pointerId);if(P.size<2)pin=null;if(e.type==='pointerup'&&was&&was.k==='click'&&P.size===0)pick(loc(e),was.sh||multi);if(was&&was.k==='box')boxPick(was);if(was&&was.k==='free'){snapPt=null;need()}dr=null};
cvEl.onwheel=e=>{e.preventDefault();OB.r=clamp(OB.r*Math.exp(e.deltaY*.001),1.5,60);cup()};
function find(mx,my){const D=rayOf(mx,my);
 if(mode==='obj'){const h=hitRay(D,objs.filter(o=>o.vis));return h?h.o:null}
 const o=sel;let hit=null;
 if(sm==='v'){let b=coarse?28:14;o.v.forEach((p,i)=>{const s=sp(o,p),d=Math.hypot(s[0]-mx,s[1]-my);if(d<b){b=d;hit=i}})}
 else if(sm==='e'){let b=coarse?22:10;edges(o).forEach(([a,c,k])=>{const d=dseg(mx,my,sp(o,o.v[a]),sp(o,o.v[c]));if(d<b){b=d;hit=k}})}
 else{const h=hitRay(D,[o]);if(h)hit=h.fi}
 return hit}
function applyHit(hit,sh){
 if(mode==='obj'){selObj(hit,sh);return}
 const set=S[sm];if(hit===null){if(!sh)set.clear()}else if(sh){set.has(hit)?set.delete(hit):set.add(hit)}else{set.clear();set.add(hit)}
 need();syncUI()}
function pick(q,sh){applyHit(find(q[0],q[1]),sh)}

/* ===== FITUR BARU: multi-objek, free transform, snap, box select, fill, extrude ===== */
let SO=new Set,snapMode='off',snapPt=null,boxSel=false;
function selObj(o,sh){
 if(!o){if(!sh){SO.clear();setSel(null)}return}
 if(sh){if(SO.has(o)){SO.delete(o);o=[...SO].pop()||null}else SO.add(o)}else SO=new Set([o]);
 setSel(o)}
/* free transform: seret langsung di bidang yang menghadap kamera */
const rayPlane=(D,p0)=>{const den=dot3(D,CF);if(Math.abs(den)<1e-6)return null;const t=dot3(sub3(p0,E),CF)/den;return E.map((e,i)=>e+D[i]*t)};
function freeStart(q){
 const p0=pivot(),st=rayPlane(rayOf(q[0],q[1]),p0);if(!st)return null;
 return{k:'free',p0,st,x:q[0],y:q[1],
  org:mode==='obj'?[...SO].map(o=>[o,{...o.mesh.position}]):[...selV()].map(i=>[i,[...sel.v[i]]])}}
function freeMove(d,q){
 const c=rayPlane(rayOf(q[0],q[1]),d.p0);if(!c)return;
 const w=snapAdjust(d,sub3(c,d.st),q);
 if(mode==='obj')d.org.forEach(([o,p])=>{o.mesh.position.x=p.x+w[0];o.mesh.position.y=p.y+w[1];o.mesh.position.z=p.z+w[2]});
 else{const M=sel.mesh,R=rotM(M.rotation),sc=[M.scale.x,M.scale.y,M.scale.z],
   l=[0,1,2].map(i=>(R[0][i]*w[0]+R[1][i]*w[1]+R[2][i]*w[2])/sc[i]);
  d.org.forEach(([i,p])=>{sel.v[i][0]=p[0]+l[0];sel.v[i][1]=p[1]+l[1];sel.v[i][2]=p[2]+l[2]})}
 need();syncProps()}
/* snap / magnet */
function snapAdjust(d,w,q){
 snapPt=null;if(snapMode==='off')return w;
 const t=[d.p0[0]+w[0],d.p0[1]+w[1],d.p0[2]+w[2]];
 if(snapMode==='g'){snapPt=t.map(x=>Math.round(x*4)/4);return sub3(snapPt,d.p0)}
 let best=null,bd=coarse?26:14;
 objs.forEach(o=>{if(!o.vis||(mode==='obj'&&SO.has(o)))return;
  const wv=o.v.map(p=>W(o,p)),mv=(mode==='edit'&&o===sel)?selV():null,ok=i=>!mv||!mv.has(i);
  if(snapMode.includes('v'))wv.forEach((p,i)=>{if(!ok(i)||toC(p)[2]<NEAR)return;const s=scr(p),dd=Math.hypot(s[0]-q[0],s[1]-q[1]);if(dd<bd){bd=dd;best=p}});
  if(snapMode.includes('e'))edges(o).forEach(([a,b])=>{if(!ok(a)||!ok(b)||toC(wv[a])[2]<NEAR||toC(wv[b])[2]<NEAR)return;
   const A=scr(wv[a]),B=scr(wv[b]),dx=B[0]-A[0],dy=B[1]-A[1],u=clamp(((q[0]-A[0])*dx+(q[1]-A[1])*dy)/(dx*dx+dy*dy||1),0,1),
    dd=Math.hypot(q[0]-A[0]-u*dx,q[1]-A[1]-u*dy);
   if(dd<bd){bd=dd;best=[0,1,2].map(k=>wv[a][k]+(wv[b][k]-wv[a][k])*u)}});
 });
 if(!best)return w;snapPt=best;return sub3(best,d.p0)}
/* box select */
function boxPick(b){
 const x0=Math.min(b.sx,b.x),x1=Math.max(b.sx,b.x),y0=Math.min(b.sy,b.y),y1=Math.max(b.sy,b.y);if(x1-x0<4&&y1-y0<4)return;
 const inn=p=>{if(toC(p)[2]<NEAR)return false;const s=scr(p);return s[0]>=x0&&s[0]<=x1&&s[1]>=y0&&s[1]<=y1};
 if(mode==='obj'){if(!b.sh)SO=new Set;objs.forEach(o=>{const p=o.mesh.position;if(o.vis&&inn([p.x,p.y,p.z]))SO.add(o)});setSel([...SO].pop()||null);return}
 const o=sel,s=S[sm];if(!b.sh)s.clear();
 if(sm==='v')o.v.forEach((p,i)=>inn(W(o,p))&&s.add(i));
 if(sm==='e')edges(o).forEach(([a,c,k])=>inn(W(o,o.v[a]))&&inn(W(o,o.v[c]))&&s.add(k));
 if(sm==='f')o.f.forEach((f,i)=>f.every(v=>inn(W(o,o.v[v])))&&s.add(i));
 need();syncUI()}
/* fill */
function rings(keys){
 const adj={};keys.forEach(k=>{const[a,b]=k.split('_').map(Number);(adj[a]=adj[a]||[]).push(b);(adj[b]=adj[b]||[]).push(a)});
 const seen=new Set,out=[];
 for(const s of Object.keys(adj).map(Number)){if(seen.has(s))continue;
  const r=[s];let prev=null,cur=s,ok=true;seen.add(s);
  for(let g=0;g<9999;g++){if(adj[cur].length!==2){ok=false;break}
   const nx=adj[cur][0]!==prev?adj[cur][0]:adj[cur][1];
   if(nx===s)break;if(seen.has(nx)){ok=false;break}r.push(nx);seen.add(nx);prev=cur;cur=nx}
  if(ok&&r.length>=3)out.push(r)}
 return out}
function angSort(o,vs){
 const P=vs.map(i=>o.v[i]),c=[0,1,2].map(k=>P.reduce((t,p)=>t+p[k],0)/P.length);let n=[0,0,0],m=0;
 P.forEach(a=>P.forEach(b=>{const x=crs(sub3(a,c),sub3(b,c)),l=Math.hypot(...x);if(l>m){m=l;n=x}}));n=nor(n);
 const u=nor(sub3(P[0],c)),w=crs(n,u);
 return vs.map((i,k)=>[i,Math.atan2(dot3(sub3(P[k],c),w),dot3(sub3(P[k],c),u))]).sort((a,b)=>a[1]-b[1]).map(x=>x[0])}
function orient(o,r){
 for(let k=0;k<r.length;k++){const a=r[k],b=r[(k+1)%r.length];
  for(const f of o.f)for(let j=0;j<f.length;j++){const x=f[j],y=f[(j+1)%f.length];
   if(x===a&&y===b)return r.slice().reverse();if(x===b&&y===a)return r}}
 return r}
function fill(){const o=sel;if(mode!=='edit'||!o)return toast('Fill: masuk mode Edit dulu.');
 let rs=sm==='e'&&S.e.size>=3?rings([...S.e]):[];
 if(!rs.length){const vs=[...selV()];if(vs.length<3)return toast('Fill: pilih ≥3 vertex, atau edge yang membentuk lingkaran tertutup.');rs=[angSort(o,vs)]}
 rs.forEach(r=>o.f.push(orient(o,r)));rebuild(o);S={v:new Set,e:new Set,f:new Set};drawEdit();syncUI();toast(rs.length+' face dibuat.')}
function fillHoles(){const o=sel;if(!o)return toast('Pilih objek dulu.');
 const c={};o.f.forEach(f=>f.forEach((a,k)=>{const key=ek(a,f[(k+1)%f.length]);c[key]=(c[key]||0)+1}));
 const rs=rings(Object.keys(c).filter(k=>c[k]===1));if(!rs.length)return toast('Tidak ada lubang tertutup.');
 rs.forEach(r=>o.f.push(orient(o,r)));rebuild(o);drawEdit();syncUI();toast(rs.length+' lubang diisi.')}
/* extrude: vertex / edge / face */
function nrmOf(o,fs){const n=[0,0,0];fs.forEach(f=>f.forEach((a,k)=>{const A=o.v[a],B=o.v[f[(k+1)%f.length]];n[0]+=(A[1]-B[1])*(A[2]+B[2]);n[1]+=(A[2]-B[2])*(A[0]+B[0]);n[2]+=(A[0]-B[0])*(A[1]+B[1])}));const L=Math.hypot(...n)||1;return n.map(x=>x/L*.4)}
function extrude(){
 if(mode!=='edit'||!sel)return toast('Extrude: masuk mode Edit, lalu pilih vertex / edge / face.');
 if(sm==='f'){if(!S.f.size)return toast('Pilih face dulu.');return extrudeF()}
 const o=sel;let eks=[];
 if(sm==='e')eks=[...S.e];
 else{if(!S.v.size)return toast('Pilih vertex dulu.');edges(o).forEach(([a,b,k])=>{if(S.v.has(a)&&S.v.has(b))eks.push(k)})}
 if(!eks.length&&sm==='e')return toast('Pilih edge dulu.');
 const vsel=selV(),d=nrmOf(o,o.f.filter(f=>f.some(v=>vsel.has(v)))),map={};
 const nv=i=>{if(map[i]===undefined){map[i]=o.v.length;o.v.push(o.v[i].map((x,c)=>x+d[c]))}return map[i]};
 if(eks.length)eks.forEach(k=>{const[a,b]=k.split('_').map(Number);let x=a,y=b;
   o.f.forEach(f=>f.forEach((p,j)=>{if(p===a&&f[(j+1)%f.length]===b){x=b;y=a}}));
   o.f.push([x,y,nv(y),nv(x)])});
 else vsel.forEach(v=>{const us=new Set;o.f.forEach(f=>{const j=f.indexOf(v);if(j>=0){us.add(f[(j+1)%f.length]);us.add(f[(j+f.length-1)%f.length])}});const w=nv(v);us.forEach(u=>o.f.push([v,u,w]))});
 rebuild(o);S={v:new Set,e:new Set,f:new Set};
 if(sm==='e')eks.forEach(k=>{const[a,b]=k.split('_').map(Number);S.e.add(ek(map[a],map[b]))});else Object.values(map).forEach(i=>S.v.add(i));
 drawEdit();syncUI();toast('Extrude selesai — geser bebas dengan mouse atau gizmo.')}

/* aksi */
function setSel(o){sel=o;if(!o){mode='obj';SO.clear()}else if(!SO.has(o))SO=new Set([o]);S={v:new Set,e:new Set,f:new Set};drawEdit();syncUI()}
function setMode(m){if(m==='edit'&&!sel)return toast('Pilih objek dulu untuk masuk mode Edit.');mode=m;S={v:new Set,e:new Set,f:new Set};drawEdit();syncUI()}
function setSm(s){sm=s;S={v:new Set,e:new Set,f:new Set};drawEdit();syncUI()}
function add(key){const o=mk(key);setP(o,((objs.length-1)%4)*1.6-2.4,key==='plane'?0:.5,2.2);setSel(o);toast(o.name+' ditambahkan.')}
function compact(o){const used=new Set(o.f.flat()),map={},nv=[];o.v.forEach((p,i)=>{if(used.has(i)){map[i]=nv.length;nv.push(p)}});o.v=nv;o.f=o.f.map(f=>f.map(v=>map[v]))}
function del(){if(!sel)return;if(mode==='obj'){objs=objs.filter(o=>!SO.has(o));SO.clear();setSel(null);return}
 const o=sel,kill=new Set();o.f.forEach((f,i)=>{if(sm==='f'&&S.f.has(i))kill.add(i);if(sm==='v'&&f.some(v=>S.v.has(v)))kill.add(i);if(sm==='e'&&f.some((a,k)=>S.e.has(ek(a,f[(k+1)%f.length]))))kill.add(i)});
 if(!kill.size)return;o.f=o.f.filter((_,i)=>!kill.has(i));if(!o.f.length){objs=objs.filter(x=>x!==o);setSel(null);return toast('Objek kosong, dihapus.')}compact(o);rebuild(o);S={v:new Set,e:new Set,f:new Set};drawEdit();syncUI();toast(kill.size+' face dihapus.')}
function extrudeF(){const o=sel;
 const fs=[...S.f],map={},cnt={},n=[0,0,0];
 fs.forEach(i=>{const f=o.f[i];f.forEach((a,k)=>{const b=f[(k+1)%f.length];cnt[ek(a,b)]=(cnt[ek(a,b)]||0)+1;n[0]+=(o.v[a][1]-o.v[b][1])*(o.v[a][2]+o.v[b][2]);n[1]+=(o.v[a][2]-o.v[b][2])*(o.v[a][0]+o.v[b][0]);n[2]+=(o.v[a][0]-o.v[b][0])*(o.v[a][1]+o.v[b][1])})});
 const L=Math.hypot(...n)||1,d=n.map(x=>x/L*.4);
 new Set(fs.flatMap(i=>o.f[i])).forEach(i=>{map[i]=o.v.length;o.v.push(o.v[i].map((x,c)=>x+d[c]))});
 const side=[];fs.forEach(i=>{const f=o.f[i];f.forEach((a,k)=>{const b=f[(k+1)%f.length];if(cnt[ek(a,b)]===1)side.push([a,b,map[b],map[a]])})});
 fs.forEach(i=>o.f[i]=o.f[i].map(v=>map[v]));o.f.push(...side);rebuild(o);drawEdit();syncUI();toast('Extrude selesai — geser dengan gizmo.')}
function dup(){if(!sel||mode!=='obj')return;const n=[];SO.forEach(s=>{const o=mk('cube',s.color);o.v=JSON.parse(JSON.stringify(s.v));o.f=JSON.parse(JSON.stringify(s.f));o.name=s.name+' salinan';['position','rotation','scale'].forEach(k=>Object.assign(o.mesh[k],s.mesh[k]));o.mesh.position.x+=.7;rebuild(o);n.push(o)});SO=new Set(n);setSel(n[n.length-1])}

/* UI sync */
function outl(){$('#outl').innerHTML=objs.map(o=>`<div class="row${o===sel?' on':''}" data-id="${o.id}"><span class="eye" data-eye="${o.id}">${o.vis?'◉':'○'}</span><span class="sw" style="background:${o.color}"></span>${o.name}</div>`).join('')||'<div class="mu">Belum ada objek</div>'}
$('#outl').onclick=e=>{const ey=e.target.dataset.eye;if(ey){const o=objs.find(x=>x.id==ey);o.vis=!o.vis;need();outl();return}const r=e.target.closest('.row');if(r){const o=objs.find(x=>x.id==r.dataset.id);if(e.shiftKey||e.ctrlKey)selObj(o,true);else{SO=new Set([o]);setSel(o)}}};
function syncProps(){const M=sel&&sel.mesh;$$('#props3 input[data-p]').forEach(i=>{const[g,k]=[i.dataset.p[0],+i.dataset.p[1]],a='xyz'[k];i.disabled=!sel;if(!sel){i.value='';return}
  if(document.activeElement===i)return;i.value=+(g==='p'?M.position[a]:g==='r'?M.rotation[a]*180/Math.PI:M.scale[a]).toFixed(2)});
 if(sel){if(document.activeElement!==$('#oname'))$('#oname').value=sel.name;$('#ocol').value=sel.color;$('#mstat').textContent=`Vertex ${sel.v.length} · Edge ${edges(sel).length} · Face ${sel.f.length}`}else $('#mstat').textContent='Tidak ada objek terpilih'}
$$('#props3 input[data-p]').forEach(i=>i.oninput=()=>{const v=parseFloat(i.value);if(!sel||isNaN(v))return;const g=i.dataset.p[0],a='xyz'[+i.dataset.p[1]],M=sel.mesh;
 if(g==='p')M.position[a]=v;else if(g==='r')M.rotation[a]=v*Math.PI/180;else M.scale[a]=Math.max(.01,v);need()});
$('#oname').oninput=e=>{if(sel){sel.name=e.target.value;outl()}};$('#ocol').oninput=e=>{if(sel){sel.color=e.target.value;need();outl()}};
function syncUI(){$('#mObj').classList.toggle('on',mode==='obj');$('#mEdit').classList.toggle('on',mode==='edit');$('#smg').style.display=mode==='edit'?'flex':'none';
 $$('#smg button').forEach(b=>b.classList.toggle('on',b.dataset.s===sm));$$('#t3 [data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===et()));
 $('#bUnf').textContent=mode==='edit'&&sm==='f'&&S.f.size?`✂ Unfold ${S.f.size} face terpilih`:'✂ Unfold → Pola 2D';tipShape();outl();syncProps()}
$('#bMulti').onclick=()=>{multi=!multi;$('#bMulti').classList.toggle('on',multi)};$('#menu').onclick=()=>$(ws==='3d'?'#w3':'#wV').classList.toggle('sp');
$('#mObj').onclick=()=>setMode('obj');$('#mEdit').onclick=()=>setMode('edit');
$$('#smg button').forEach(b=>b.onclick=()=>setSm(b.dataset.s));$('#addSel').onchange=e=>{if(e.target.value)add(e.target.value);e.target.value=''};
$$('#t3 [data-t]').forEach(b=>b.onclick=()=>{tool=b.dataset.t;syncUI()});
$('#t3 [data-a=ext]').onclick=extrude;$('#t3 [data-a=fill]').onclick=fill;$('#t3 [data-a=fillh]').onclick=fillHoles;$('#bBox').onclick=()=>{boxSel=!boxSel;$('#bBox').classList.toggle('on',boxSel)};$('#snapSel').onchange=e=>{snapMode=e.target.value};$('#t3 [data-a=del]').onclick=del;$('#t3 [data-a=dup]').onclick=dup;
