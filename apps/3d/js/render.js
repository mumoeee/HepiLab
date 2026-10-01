/* render.js — menggambar scene + gizmo (panah geser/putar/skala). */
function draw(){dirty=false;g2.setTransform(dpr,0,0,dpr,0,0);g2.fillStyle='#101113';g2.fillRect(0,0,cw,ch);g2.lineJoin='round';
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
