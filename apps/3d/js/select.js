/* select.js — multi-objek, geser bebas, snap/magnet, box select. */
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
