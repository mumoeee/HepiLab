
/* ======== render ======== */
/* render.js — menggambar scene + gizmo (panah geser/putar/skala). */
function draw(){dirty=false;g2.setTransform(dpr,0,0,dpr,0,0);g2.fillStyle='#101113';g2.fillRect(0,0,cw,ch);g2.lineJoin='round';
 drawGrid();
 const fl=[];objs.forEach(o=>{if(!o.vis)return;const wv=o.v.map(p=>W(o,p)),h=parseInt(o.color.slice(1),16),rgb=[h>>16&255,h>>8&255,h&255];
  o.f.forEach(f=>{const vs=f.map(i=>wv[i]),cs=clipP(vs.map(toC));if(cs.length<3)return;let n=[0,0,0];
   vs.forEach((a,k)=>{const b=vs[(k+1)%vs.length];n[0]+=(a[1]-b[1])*(a[2]+b[2]);n[1]+=(a[2]-b[2])*(a[0]+b[0]);n[2]+=(a[0]-b[0])*(a[1]+b[1])});n=nor(n);
   const k=Math.min(1,.38+.5*Math.abs(dot3(n,LD))+.12*Math.abs(n[2]));fl.push({cs,z:cs.reduce((t,c)=>t+c[2],0)/cs.length,col:`rgb(${rgb.map(x=>x*k|0)})`})})});
 g2.globalAlpha=shade==='x'?.35:1;fl.sort((a,b)=>b.z-a.z).forEach(q=>poly(q.cs,shade==='w'?null:q.col,shade==='w'?'#9fb0bd':'#14181b',1));g2.globalAlpha=1;
 if(mode==='obj')SO.forEach(o=>{if(!o.vis)return;const wv=o.v.map(p=>W(o,p));edges(o).forEach(([a,b])=>ln3(wv[a],wv[b],o===sel?'#ffa53a':'#c98a35',2))});
 if(mode==='edit'&&sel){const o=sel,vs=selV(),
   occ=(shade==='s'||shade==='r')?buildDepth():null,   // Solid/Render: bagian yang tertutup disembunyikan. Wire/X-ray: semua terlihat (seperti Blender)
   vis=w=>{const c=toC(w);return c[2]>=NEAR&&(!occ||visD(occ,c))},
   seg=(A,B,col,wd)=>{if(!occ)return ln3(A,B,col,wd);const N=8,L=t=>A.map((x,j)=>x+(B[j]-x)*t);g2.lineCap='round';
    for(let i=0;i<N;i++)if(vis(L((i+.5)/N)))ln3(L(i/N),L((i+1)/N),col,wd);g2.lineCap='butt'};
  /* FACE: hanya face yang menghadap kamera (isi + garis tepi oranye), tanpa titik vertex */
  if(sm==='f')S.f.forEach(i=>{const f=o.f[i];if(!f)return;const ws=f.map(v=>W(o,o.v[v]));
   if(occ&&!vis([0,1,2].map(k=>ws.reduce((t,p)=>t+p[k],0)/ws.length)))return;
   const cs=clipP(ws.map(toC));if(cs.length>2)poly(cs,'rgba(255,165,58,.45)','#ffa53a',2)});
  /* EDGE: semua edge yang terlihat digambar tipis, yang terpilih oranye tebal; tanpa titik vertex */
  if(sm==='e'){edges(o).forEach(([a,b,k])=>{if(!S.e.has(k))seg(W(o,o.v[a]),W(o,o.v[b]),'rgba(160,190,215,.55)',1.5)});
   S.e.forEach(k=>{const[a,b]=k.split('_');seg(W(o,o.v[a]),W(o,o.v[b]),'#ffa53a',3)})}
  /* VERTEX: titik kecil (lebih kecil di HP), yang tertutup tidak digambar */
  if(sm==='v')o.v.forEach((p,i)=>{const w=W(o,p);if(!vis(w))return;const q=scr(w),on=vs.has(i);g2.fillStyle=on?'#ffa633':'#cfe0f2';g2.beginPath();g2.arc(q[0],q[1],coarse?(on?2.2:1.6):(on?2.8:2.2),0,6.283);g2.fill()})}
 if(snapPt){const s=scr(snapPt);g2.strokeStyle='#4cf';g2.lineWidth=2;g2.beginPath();g2.arc(s[0],s[1],9,0,6.283);g2.stroke()}
 if(dr&&dr.k==='box'){g2.strokeStyle='#4cc3b3';g2.lineWidth=1;g2.setLineDash([5,4]);g2.strokeRect(dr.sx,dr.sy,dr.x-dr.sx,dr.y-dr.sy);g2.setLineDash([])}
 drawGizmo()}
function pivot(){if(mode==='obj'){const c=[0,0,0];SO.forEach(o=>{const p=o.mesh.position;c[0]+=p.x;c[1]+=p.y;c[2]+=p.z});return c.map(x=>x/(SO.size||1))}const vs=[...selV()],c=[0,0,0];vs.forEach(i=>{const w=W(sel,sel.v[i]);c[0]+=w[0];c[1]+=w[1];c[2]+=w[2]});return c.map(x=>x/(vs.length||1))}
function gzGeo(){if(!sel||(mode==='edit'&&!selV().size))return null;const p=pivot();if(toC(p)[2]<NEAR)return null;const L=Math.hypot(...sub3(E,p))*.2,a=scr(p),r={};for(const k in AXS)r[k]=[a,scr(p.map((x,i)=>x+AXS[k][i]*L))];return r}
const dseg=(x,y,A,B)=>{const dx=B[0]-A[0],dy=B[1]-A[1],l=dx*dx+dy*dy||1,t=clamp(((x-A[0])*dx+(y-A[1])*dy)/l,0,1);return Math.hypot(x-A[0]-t*dx,y-A[1]-t*dy)};
function gzHit(x,y){const G=gzGeo();if(!G)return null;let b=coarse?26:12,h=null;for(const k in G){const d=dseg(x,y,G[k][0],G[k][1]);if(d<b){b=d;h=k}}return h}
function gzDrag(dx,dy){const ax=dr.a,d=AXS[ax],p=pivot(),a=scr(p),b=scr(p.map((x,i)=>x+d[i])),sx=b[0]-a[0],sy=b[1]-a[1],L=Math.hypot(sx,sy),m=(dx*sx+dy*sy)/(L||1),amt=m/Math.max(L,14),M=sel.mesh,t=et();
 if(mode==='obj'){SO.forEach(ob=>{const M=ob.mesh;if(t==='move')M.position[ax]+=amt;else if(t==='rotate'){const R=mmul(rotM({x:ax==='x'?m*.012:0,y:ax==='y'?m*.012:0,z:ax==='z'?m*.012:0}),rotM(M.rotation));
   const y=Math.asin(clamp(R[0][2],-1,1));M.rotation.y=y;if(Math.abs(R[0][2])<.9999999){M.rotation.x=Math.atan2(-R[1][2],R[2][2]);M.rotation.z=Math.atan2(-R[0][1],R[0][0])}else{M.rotation.x=Math.atan2(R[2][1],R[1][1]);M.rotation.z=0}}
  else M.scale[ax]=Math.max(.05,M.scale[ax]*(1+m*.008))})}
 else if(t==='move'){const R=rotM(M.rotation),w=d.map(x=>x*amt),l=[0,1,2].map(i=>(R[0][i]*w[0]+R[1][i]*w[1]+R[2][i]*w[2])/[M.scale.x,M.scale.y,M.scale.z][i]);selV().forEach(i=>{sel.v[i][0]+=l[0];sel.v[i][1]+=l[1];sel.v[i][2]+=l[2]})}
 else{const g=m*.012,Rg=rotM({x:ax==='x'?g:0,y:ax==='y'?g:0,z:ax==='z'?g:0}),fc=1+m*.008;selV().forEach(i=>{const r=sub3(W(sel,sel.v[i]),p);let n;if(t==='rotate')n=[0,1,2].map(j=>dot3(Rg[j],r));else{const k=dot3(r,d)*(fc-1);n=r.map((x,j)=>x+d[j]*k)}sel.v[i]=Wi(sel,[p[0]+n[0],p[1]+n[1],p[2]+n[2]])})}
 need();syncProps()}

/* ---------- Depth buffer kecil (setengah resolusi) untuk menyembunyikan vertex/edge/face yang tertutup di Solid ---------- */
function rast(d,w,h,A,B,C){
 const x0=Math.max(0,Math.floor(Math.min(A[0],B[0],C[0]))),x1=Math.min(w-1,Math.ceil(Math.max(A[0],B[0],C[0]))),
  y0=Math.max(0,Math.floor(Math.min(A[1],B[1],C[1]))),y1=Math.min(h-1,Math.ceil(Math.max(A[1],B[1],C[1]))),
  den=(B[1]-C[1])*(A[0]-C[0])+(C[0]-B[0])*(A[1]-C[1]);if(Math.abs(den)<1e-12)return;
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const px=x+.5,py=y+.5,
  l1=((B[1]-C[1])*(px-C[0])+(C[0]-B[0])*(py-C[1]))/den,l2=((C[1]-A[1])*(px-C[0])+(A[0]-C[0])*(py-C[1]))/den,l3=1-l1-l2;
  if(l1<-1e-6||l2<-1e-6||l3<-1e-6)continue;
  const z=1/(l1*A[2]+l2*B[2]+l3*C[2]),i=y*w+x;if(z<d[i])d[i]=z}}
function buildDepth(){
 let nt=0;objs.forEach(o=>{if(o.vis)o.f.forEach(f=>nt+=Math.max(0,f.length-2))});if(nt>60000)return null;   // terlalu berat: tampilkan semua
 const s=.5,w=Math.max(1,Math.ceil(cw*s)),h=Math.max(1,Math.ceil(ch*s)),d=new Float32Array(w*h).fill(Infinity);let zn=Infinity,zx=-Infinity;
 objs.forEach(o=>{if(!o.vis)return;const cv=o.v.map(p=>toC(W(o,p)));
  o.f.forEach(f=>{const cs=clipP(f.map(i=>cv[i]));if(cs.length<3)return;
   const P=cs.map(c=>{const k=ch/2/TF/c[2];if(c[2]<zn)zn=c[2];if(c[2]>zx)zx=c[2];return[(cw/2+c[0]*k)*s,(ch/2-c[1]*k)*s,1/c[2]]});
   for(let k=1;k<P.length-1;k++)rast(d,w,h,P[0],P[k],P[k+1])})});
 return{d,w,h,s,bias:Math.max(zx-zn,0)*.006+1e-4}}
function visD(D,c){const q=pj(c),x=Math.floor(q[0]*D.s),y=Math.floor(q[1]*D.s);if(x<0||y<0||x>=D.w||y>=D.h)return true;
 const tol=D.bias+10*c[2]*TF/(ch/2)/D.s;let occl=false;   // tersembunyi hanya jika ada permukaan LEBIH DEKAT di sekitarnya dan tidak ada permukaan miliknya sendiri
 for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const X=x+i,Y=y+j;if(X<0||Y<0||X>=D.w||Y>=D.h)continue;const d=D.d[Y*D.w+X];if(d===Infinity)continue;
  if(c[2]<=d+tol)return true;occl=true}
 return !occl}
