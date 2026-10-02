
/* ======== view ======== */
/* view.js — Tool Select, mode Render, view ortho + gizmo XYZ, grid adaptif, snap, zoom ke kursor */

/* ---------- Select-only: gizmo & geser dimatikan ---------- */
const _gg=gzGeo;gzGeo=()=>tool==='select'?null:_gg();
const _dg=drawGizmo;drawGizmo=()=>{if(tool!=='select')_dg()};

/* ---------- Mode Render (tanpa garis) ---------- */
const _poly=poly;poly=function(cs,fill,stroke,lw){if(shade==='r'&&fill&&stroke==='#14181b')stroke=fill;_poly(cs,fill,stroke,lw)};
const _ln3=ln3;ln3=function(a,b,c,w){if(shade==='r'&&mode==='obj'&&(c==='#ffa53a'||c==='#c98a35')&&w===2)return;_ln3(a,b,c,w)};
MM.shade=()=>setShade({s:'w',w:'x',x:'r',r:'s'}[shade]);

/* ---------- View axis (ortho) + grid adaptif ---------- */
const VIEWS={front:[0,Math.PI/2,1],back:[Math.PI,Math.PI/2,1],right:[Math.PI/2,Math.PI/2,0],left:[-Math.PI/2,Math.PI/2,0],top:[0,1e-4,2],bottom:[0,Math.PI-1e-4,2]},
 VN={front:'Depan',back:'Belakang',right:'Kanan',left:'Kiri',top:'Atas',bottom:'Bawah'};
const viewName=()=>ORTHO&&Object.keys(VIEWS).find(k=>Math.abs(OB.th-VIEWS[k][0])<1e-6&&Math.abs(OB.ph-VIEWS[k][1])<1e-6)||'';
const orthoDepth=()=>{const n=viewName();return n?VIEWS[n][2]:-1};
const gridStep=()=>Math.pow(10,Math.floor(Math.log10(OB.r/3)));
function updOrtho(){const b=$('#bOrtho');if(b){b.textContent=ORTHO?'◫ Ortho':'◫ Persp';b.classList.toggle('on',ORTHO)}need()}
const _v3=view3;view3=function(v){
 if(v==='ortho'){ORTHO=!ORTHO;cup();return updOrtho()}
 if(VIEWS[v]){OB.th=VIEWS[v][0];OB.ph=VIEWS[v][1];ORTHO=true;cup();return updOrtho()}
 if(v==='persp'){OB.th=.8;OB.ph=1.1;ORTHO=false;cup();return updOrtho()}
 _v3(v)};
$('#xView').insertAdjacentHTML('beforeend','<option value="back">Belakang</option><option value="left">Kiri</option><option value="bottom">Bawah</option><option value="ortho">Ortho ⇄ Perspektif (5)</option>');
$('#xView').after(Object.assign(document.createElement('button'),{id:'bOrtho',title:'Ortho / Perspektif (Numpad 5)',textContent:'◫ Persp',onclick:()=>view3('ortho')}));
addEventListener('keydown',e=>{if(MD||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const m={Numpad1:['front','back'],Numpad3:['right','left'],Numpad7:['top','bottom']}[e.code];
 if(m||e.code==='Numpad5'){e.preventDefault();e.stopImmediatePropagation();view3(m?m[e.ctrlKey?1:0]:'ortho')}},true);
function drawGrid(){const st=gridStep(),N=30,X=N*st,dp=orthoDepth(),[a,b]=dp<0?[0,1]:[0,1,2].filter(i=>i!==dp),c=[OB.t[a],OB.t[b]].map(v=>Math.round(v/st)*st),
 P=(u,v)=>{const p=[0,0,0];p[a]=u;p[b]=v;return p},col=g=>Math.abs(g)<st/2?null:Math.round(g/st)%10===0?'#3a454d':'#2a3238';
 for(let i=-N;i<=N;i++){const u=c[0]+i*st,v=c[1]+i*st,cu=col(u),cv=col(v);
  ln3(P(u,c[1]-X),P(u,c[1]+X),cu||AC['xyz'[b]],cu?1:1.5);ln3(P(c[0]-X,v),P(c[0]+X,v),cv||AC['xyz'[a]],cv?1:1.5)}
 if(dp<0)ln3([0,0,0],[0,0,Math.max(12,X)],AC.z,1.5)}
/* kubus navigasi XYZ: klik lingkaran = pindah ke tampilan itu */
function vgPts(){const R=coarse?32:40,cx=cw-R-26,cy=R+30;return{R,cx,cy,a:[['x',[1,0,0],'#e0503c','right',1],['x',[-1,0,0],'#e0503c','left',0],['y',[0,1,0],'#5fbf5a','back',1],['y',[0,-1,0],'#5fbf5a','front',0],['z',[0,0,1],'#4a8fe0','top',1],['z',[0,0,-1],'#4a8fe0','bottom',0]]
 .map(([l,v,c,n,pos])=>({l,c,n,pos,x:cx+dot3(v,CR)*R,y:cy-dot3(v,CU)*R,z:dot3(v,CF)})).sort((p,q)=>q.z-p.z)}}
function drawViewGizmo(){const G=vgPts();g2.save();g2.fillStyle='rgba(255,255,255,.05)';g2.beginPath();g2.arc(G.cx,G.cy,G.R+16,0,6.283);g2.fill();
 G.a.forEach(p=>{if(p.pos){g2.strokeStyle=p.c;g2.lineWidth=2.5;g2.beginPath();g2.moveTo(G.cx,G.cy);g2.lineTo(p.x,p.y);g2.stroke()}
  g2.beginPath();g2.arc(p.x,p.y,p.pos?9:7,0,6.283);if(p.pos){g2.fillStyle=p.c;g2.fill()}else{g2.fillStyle='rgba(20,22,25,.75)';g2.fill();g2.strokeStyle=p.c;g2.lineWidth=1.5;g2.stroke()}
  if(p.pos){g2.fillStyle='#111';g2.font='bold 11px sans-serif';g2.textAlign='center';g2.textBaseline='middle';g2.fillText(p.l.toUpperCase(),p.x,p.y+.5)}});
 g2.fillStyle='#9aa7b1';g2.font='11px sans-serif';g2.textAlign='center';g2.textBaseline='middle';g2.fillText((VN[viewName()]||'Bebas')+' · '+(ORTHO?'Ortho':'Persp'),G.cx,G.cy+G.R+30);g2.restore()}
const _dV=draw;draw=function(){_dV();drawViewGizmo()};
const _pdV=cvEl.onpointerdown;cvEl.onpointerdown=e=>{if(e.button===0&&!dr){const q=loc(e),h=[...vgPts().a].reverse().find(p=>Math.hypot(p.x-q[0],p.y-q[1])<(p.pos?13:11));if(h){e.preventDefault();view3(h.n);return}}_pdV(e)};

/* ---------- Snap yang diperbaiki: titik acuan = vertex terpilih terdekat dengan kursor (bukan pusat pivot),
   grid snap mengikuti grid yang terlihat & hanya 2 sumbu di view ortho ---------- */
const _fs=freeStart;freeStart=function(q){const d=_fs(q);if(!d)return d;
 const pts=mode==='obj'?[...SO].flatMap(o=>o.v.map(p=>W(o,p))):[...selV()].map(i=>W(sel,sel.v[i]));let bd=1e9,s=d.p0;
 pts.forEach(p=>{if(toC(p)[2]<NEAR)return;const a=scr(p),h=Math.hypot(a[0]-q[0],a[1]-q[1]);if(h<bd){bd=h;s=p}});d.src=s;return d};
snapAdjust=function(d,w,q){snapPt=null;if(snapMode==='off')return w;const s=d.src||d.p0,t=[s[0]+w[0],s[1]+w[1],s[2]+w[2]];
 if(snapMode==='g'){const st=gridStep(),dp=orthoDepth();snapPt=t.map((x,i)=>i===dp?x:Math.round(x/st)*st);return sub3(snapPt,s)}
 let best=null,bd=coarse?30:16;
 objs.forEach(o=>{if(!o.vis||(mode==='obj'&&SO.has(o)))return;const wv=o.v.map(p=>W(o,p)),mv=(mode==='edit'&&o===sel)?selV():null,ok=i=>!mv||!mv.has(i);
  if(snapMode.includes('v'))wv.forEach((p,i)=>{if(!ok(i)||toC(p)[2]<NEAR)return;const a=scr(p),h=Math.hypot(a[0]-q[0],a[1]-q[1]);if(h<bd){bd=h;best=p}});
  if(snapMode.includes('e'))edges(o).forEach(([a,b])=>{if(!ok(a)||!ok(b)||toC(wv[a])[2]<NEAR||toC(wv[b])[2]<NEAR)return;
   const A=scr(wv[a]),B=scr(wv[b]),dx=B[0]-A[0],dy=B[1]-A[1],u=clamp(((q[0]-A[0])*dx+(q[1]-A[1])*dy)/(dx*dx+dy*dy||1),0,1),h=Math.hypot(q[0]-A[0]-u*dx,q[1]-A[1]-u*dy);
   if(h<bd-(snapMode==='ve'?3:0)){bd=h;best=[0,1,2].map(k=>wv[a][k]+(wv[b][k]-wv[a][k])*u)}})});
 if(!best)return w;snapPt=best;return sub3(best,s)};


/* ---------- Zoom ke arah kursor ---------- */
cvEl.onwheel=e=>{e.preventDefault();const q=loc(e),c=rayPlane(rayOf(q[0],q[1]),OB.t),r0=OB.r;OB.r=clamp(r0*Math.exp(e.deltaY*.001),.02,3000);
 if(c){const k=OB.r/r0;OB.t=OB.t.map((t,i)=>c[i]+(t-c[i])*k)}cup()};
