
/* ======== select ======== */
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
 if(sm==='v'){const lv=liveVs(o);o.v.forEach((p,i)=>(!lv||lv.has(i))&&inn(W(o,p))&&s.add(i))}
 if(sm==='e')edges(o).forEach(([a,c,k])=>inn(W(o,o.v[a]))&&inn(W(o,o.v[c]))&&s.add(k));
 if(sm==='f')o.f.forEach((f,i)=>f.every(v=>inn(W(o,o.v[v])))&&s.add(i));
 need();syncUI()}

/* ======== select2 ======== */
/* select2.js — Loop select + seleksi hanya yang terlihat (tidak tembus objek) */
/* ---------- Loop select ---------- */
const edgeFaces=o=>adj(o).ef;   // dari cache adjacency (core.js)
function loopEdges(o,k0,ef){const nb={};edges(o).forEach(([a,b])=>{(nb[a]=nb[a]||[]).push(b);(nb[b]=nb[b]||[]).push(a)});
 const sh=(k1,k2)=>(ef[k1]||[]).some(i=>(ef[k2]||[]).includes(i)),out=new Set([k0]),[a0,b0]=k0.split('_').map(Number);
 const go=(a,b)=>{for(let g=0;g<9999;g++){const n=nb[b]||[];if(n.length!==4)return;const c=n.find(x=>x!==a&&!sh(ek(a,b),ek(b,x)));if(c===undefined)return;const k=ek(b,c);if(out.has(k))return;out.add(k);a=b;b=c}};
 go(a0,b0);go(b0,a0);return out}
function ringFaces(o,k0,ef){const res=new Set,walk=(k,fi)=>{let cur=k,f=fi;while(f!==undefined&&!res.has(f)){const F=o.f[f];if(F.length!==4)return;const j=F.findIndex((a,i)=>ek(a,F[(i+1)%4])===cur);if(j<0)return;res.add(f);cur=ek(F[(j+2)%4],F[(j+3)%4]);f=(ef[cur]||[]).find(x=>x!==f)}};
 (ef[k0]||[]).forEach(fi=>walk(k0,fi));return res}
let loopOn=false;
function loopPick(q,sh){const o=sel;let k=null,b=coarse?30:18;edges(o).forEach(([a,c,key])=>{const d=dseg(q[0],q[1],sp(o,o.v[a]),sp(o,o.v[c]));if(d<b){b=d;k=key}});if(k===null)return;
 const ef=edgeFaces(o);let items;
 if(sm==='f')items=[...ringFaces(o,k,ef)];else{const L=[...loopEdges(o,k,ef)];items=sm==='e'?L:[...new Set(L.flatMap(x=>x.split('_').map(Number)))]}
 const s=S[sm],rm=sh&&items.every(x=>s.has(x));if(!sh)s.clear();items.forEach(x=>rm?s.delete(x):s.add(x));need();syncUI();toast('Loop: '+items.length+' dipilih (Shift+klik loop yang sama = lepas).')}
const _pdL=cvEl.onpointerdown;cvEl.onpointerdown=e=>{if(mode==='edit'&&sel&&e.button===0&&(loopOn||e.altKey)){e.preventDefault();loopPick(loc(e),e.shiftKey||multi);return}_pdL(e)};
$('#bLoop').onclick=()=>{loopOn=!loopOn;$('#bLoop').classList.toggle('on',loopOn)};


/* ---------- Seleksi hanya yang terlihat (kecuali Wire/X-ray). Uji tembus dilakukan hanya pada kandidat dekat kursor agar tetap ringan ---------- */
function occluder(n){const T=[];objs.forEach(o=>{if(!o.vis)return;const w=o.v.map(p=>W(o,p));o.f.forEach(f=>{for(let k=1;k<f.length-1;k++)T.push([w[f[0]],w[f[k]],w[f[k+1]]])})});
 if(T.length>40000||T.length*n>2e7)return()=>false;
 return p=>{const v=sub3(p,E),L=Math.hypot(...v),D=v.map(x=>x/L),eps=L*1e-6+1e-4;return T.some(t=>{const h=tri(D,t[0],t[1],t[2]);return h>0&&h<L-eps})}}
const hideOcc=()=>mode==='edit'&&sel&&shade!=='w'&&shade!=='x';
const _find=find;find=function(mx,my){if(!hideOcc()||sm==='f')return _find(mx,my);const o=sel,C=[];
 if(sm==='v'){const r=coarse?28:14,lv=liveVs(o);o.v.forEach((p,i)=>{if(lv&&!lv.has(i))return;const w=W(o,p);if(toC(w)[2]<NEAR)return;const s=scr(w),d=Math.hypot(s[0]-mx,s[1]-my);if(d<r)C.push([d,i,w])})}
 else{const r=coarse?22:10;edges(o).forEach(([a,c,k])=>{const A=W(o,o.v[a]),B=W(o,o.v[c]);if(toC(A)[2]<NEAR||toC(B)[2]<NEAR)return;const sa=scr(A),sb=scr(B),dx=sb[0]-sa[0],dy=sb[1]-sa[1],u=clamp(((mx-sa[0])*dx+(my-sa[1])*dy)/(dx*dx+dy*dy||1),0,1),d=Math.hypot(mx-sa[0]-u*dx,my-sa[1]-u*dy);if(d<r)C.push([d,k,A.map((x,i)=>x+(B[i]-x)*u)])})}
 C.sort((a,b)=>a[0]-b[0]);const occ=occluder(C.length),h=C.find(c=>!occ(c[2]));return h?h[1]:null};
const _bp=boxPick;boxPick=function(b){if(!hideOcc())return _bp(b);
 const x0=Math.min(b.sx,b.x),x1=Math.max(b.sx,b.x),y0=Math.min(b.sy,b.y),y1=Math.max(b.sy,b.y);if(x1-x0<4&&y1-y0<4)return;
 const o=sel,s=S[sm],occ=occluder(o.v.length),m=new Map(),inn=p=>{if(toC(p)[2]<NEAR)return false;const q=scr(p);return q[0]>=x0&&q[0]<=x1&&q[1]>=y0&&q[1]<=y1},
  ok=i=>{if(!m.has(i)){const w=W(o,o.v[i]);m.set(i,inn(w)&&!occ(w))}return m.get(i)};
 if(!b.sh)s.clear();
 if(sm==='v'){const lv=liveVs(o);o.v.forEach((_,i)=>(!lv||lv.has(i))&&ok(i)&&s.add(i))}
 if(sm==='e')edges(o).forEach(([a,c,k])=>ok(a)&&ok(c)&&s.add(k));
 if(sm==='f')o.f.forEach((f,i)=>f.every(ok)&&s.add(i));
 need();syncUI()};
