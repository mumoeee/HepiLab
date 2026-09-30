/* vector2.js — tambahan Vector Workspace: Bezier, bentuk baru, undo/redo, grup, susun, snap grid, file & ekspor.
   Dimuat SETELAH vector.js dan SEBELUM main.js. */

/* ---------- Matematika kurva (handle disimpan di s.h[i] = {a:handle masuk, b:handle keluar, m:tipe c/s/y}) ---------- */
const same=(u,v)=>Math.abs(u[0]-v[0])<1e-6&&Math.abs(u[1]-v[1])<1e-6;
const bz=(a,b,c,d,t)=>{const u=1-t,k0=u*u*u,k1=3*u*u*t,k2=3*u*t*t,k3=t*t*t;return[k0*a[0]+k1*b[0]+k2*c[0]+k3*d[0],k0*a[1]+k1*b[1]+k2*c[1]+k3*d[1]]};
const ctl=(s,i)=>{const n=s.p.length,j=(i+1)%n,h=s.h||[],a=s.p[i],b=s.p[j];return[a,h[i]?h[i].b:a,h[j]?h[j].a:b,b]};
function samp(s){if(!s.h)return s.p;const n=s.p.length,m=s.c?n:n-1,o=[s.p[0]];for(let i=0;i<m;i++){const c=ctl(s,i);for(let k=1;k<=16;k++)o.push(bz(c[0],c[1],c[2],c[3],k/16))}return o}
function pathD(s){const p=s.p,n=p.length,m=s.c?n:n-1;let d='M'+p[0].join(' ');
 for(let i=0;i<m;i++){const j=(i+1)%n,c=ctl(s,i);d+=same(c[1],c[0])&&same(c[2],c[3])?'L'+p[j].join(' '):'C'+c[1].join(' ')+' '+c[2].join(' ')+' '+p[j].join(' ')}
 return d+(s.c?'Z':'')}
function fixH(s){const H=s.h=s.h||[];H.length=s.p.length;for(let i=0;i<H.length;i++)if(!H[i])H[i]=null;return H}
const vraw=e=>{const r=svg.getBoundingClientRect();return[(e.clientX-r.left-V.vw.x)/V.vw.z,(e.clientY-r.top-V.vw.y)/V.vw.z]};

/* ---------- Ganti fungsi lama agar paham kurva ---------- */
bb=function(s){if(s.t==='text')return[s.x,s.y-s.size,s.x+s.txt.length*s.size*.55,s.y+s.size*.25];const q=samp(s),x=q.map(a=>a[0]),y=q.map(a=>a[1]);return[Math.min(...x),Math.min(...y),Math.max(...x),Math.max(...y)]};
xf=function(s,fn,k=1,r=0){if(s.t==='text'){[s.x,s.y]=fn([s.x,s.y]);s.size*=k;s.rot=(s.rot||0)+r}else{s.p=s.p.map(q=>fn(q));if(s.h)s.h=s.h.map(h=>h&&{a:fn(h.a),b:fn(h.b),m:h.m})}};
const _shp0=shp;
shp=function(s,lk){if(s.t==='text')return _shp0(s,lk);
 return`<path data-id="${s.id}" d="${pathD(s)}" fill="${s.fill||'none'}" stroke="${s.stroke||'none'}" stroke-width="${s.sw}"${s.dash?' stroke-dasharray="8 5"':''} stroke-linejoin="round" style="pointer-events:${lk?'none':'all'}"/>`};

/* ---------- Bentuk: ellipse Bezier, bintang, persegi sudut bulat ---------- */
const _sf0=shapeFrom;
shapeFrom=function(t,a,b,s){s.h=null;
 if(t==='c'){const rx=Math.abs(b[0]-a[0])/2,ry=Math.abs(b[1]-a[1])/2,cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2,k=.5523;
  s.p=[[cx,cy-ry],[cx+rx,cy],[cx,cy+ry],[cx-rx,cy]];
  s.h=[{a:[cx-k*rx,cy-ry],b:[cx+k*rx,cy-ry]},{a:[cx+rx,cy-k*ry],b:[cx+rx,cy+k*ry]},{a:[cx+k*rx,cy+ry],b:[cx-k*rx,cy+ry]},{a:[cx-rx,cy+k*ry],b:[cx-rx,cy-k*ry]}].map(h=>({a:h.a,b:h.b,m:'s'}))}
 else if(t==='u'){const x0=Math.min(a[0],b[0]),x1=Math.max(a[0],b[0]),y0=Math.min(a[1],b[1]),y1=Math.max(a[1],b[1]),r=Math.min(V.rad==null?20:V.rad,(x1-x0)/2,(y1-y0)/2);
  if(r<.5){s.p=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];return}
  const q=r*.5523,N=[[x0+r,y0],[x1-r,y0],[x1,y0+r],[x1,y1-r],[x1-r,y1],[x0+r,y1],[x0,y1-r],[x0,y0+r]],
   ia={0:[x0+r-q,y0],2:[x1,y0+r-q],4:[x1-r+q,y1],6:[x0,y1-r+q]},ib={1:[x1-r+q,y0],3:[x1,y1-r+q],5:[x0+r-q,y1],7:[x0,y0+r-q]};
  s.p=N;s.h=N.map((p,i)=>({a:ia[i]||[...p],b:ib[i]||[...p],m:'c'}))}
 else if(t==='s'){const R=Math.hypot(b[0]-a[0],b[1]-a[1]),n=V.sides;s.p=Array.from({length:n*2},(_,i)=>{const r=i%2?R*.45:R,an=i/(2*n)*6.2832-1.5708;return[a[0]+r*Math.cos(an),a[1]+r*Math.sin(an)]})}
 else _sf0(t,a,b,s)};

/* ---------- Operasi node ---------- */
function splitSeg(s,i,t){const n=s.p.length,j=(i+1)%n,H=fixH(s),[P0,C1,C2,P3]=ctl(s,i),curved=!(same(C1,P0)&&same(C2,P3)),
 L=(a,b)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],A=L(P0,C1),B=L(C1,C2),C=L(C2,P3),D=L(A,B),E2=L(B,C),F=L(D,E2);
 if(curved){if(!H[i])H[i]={a:[...P0],b:[...P0],m:'c'};if(!H[j])H[j]={a:[...P3],b:[...P3],m:'c'};H[i].b=A;H[j].a=C}
 s.p.splice(i+1,0,F);H.splice(i+1,0,curved?{a:D,b:E2,m:'s'}:null)}
function segLine(s,i){const j=(i+1)%s.p.length,H=fixH(s);if(H[i]){H[i].b=[...s.p[i]];H[i].m='c'}if(H[j]){H[j].a=[...s.p[j]];H[j].m='c'}}
function segCurve(s,i){const j=(i+1)%s.p.length,H=fixH(s),c=ctl(s,i);if(!(same(c[1],c[0])&&same(c[2],c[3])))return toast('Segmen ini sudah kurva.');
 const A=s.p[i],B=s.p[j];if(!H[i])H[i]={a:[...A],b:[...A],m:'c'};if(!H[j])H[j]={a:[...B],b:[...B],m:'c'};
 H[i].b=[A[0]+(B[0]-A[0])/3,A[1]+(B[1]-A[1])/3];H[j].a=[B[0]-(B[0]-A[0])/3,B[1]-(B[1]-A[1])/3];H[i].m=H[j].m='c'}
function nodeType(s,i,m){const H=fixH(s);if(m==='c'){if(H[i])H[i].m='c';return}
 const n=s.p.length,P0=s.p[i],pv=s.p[i>0?i-1:(s.c?n-1:0)],nx=s.p[i<n-1?i+1:(s.c?0:n-1)],h=H[i]||{a:[...P0],b:[...P0]};
 let t=[h.b[0]-h.a[0],h.b[1]-h.a[1]],L=Math.hypot(t[0],t[1]),A=Math.hypot(h.a[0]-P0[0],h.a[1]-P0[1]),B=Math.hypot(h.b[0]-P0[0],h.b[1]-P0[1]);
 if(L<1e-6){t=[nx[0]-pv[0],nx[1]-pv[1]];L=Math.hypot(t[0],t[1])||1;const d1=Math.hypot(P0[0]-pv[0],P0[1]-pv[1]),d2=Math.hypot(nx[0]-P0[0],nx[1]-P0[1]);A=B=(d1&&d2?Math.min(d1,d2):(d1||d2))/3}
 if(m==='y')A=B=(A+B)/2;t=[t[0]/L,t[1]/L];
 H[i]={a:[P0[0]-t[0]*A,P0[1]-t[1]*A],b:[P0[0]+t[0]*B,P0[1]+t[1]*B],m}}
function smoothAll(s){const n=s.p.length;if(n<3)return;const H=fixH(s);
 for(let i=0;i<n;i++){const P0=s.p[i],pv=s.p[i>0?i-1:(s.c?n-1:0)],nx=s.p[i<n-1?i+1:(s.c?0:n-1)],tx=(nx[0]-pv[0])/6,ty=(nx[1]-pv[1])/6;H[i]={a:[P0[0]-tx,P0[1]-ty],b:[P0[0]+tx,P0[1]+ty],m:'s'}}}
function delNode(s,i){if(s.p.length<=2)return;fixH(s);s.h.splice(i,1);s.p.splice(i,1)}
function nodeAct(a){
 if(a==='all'||a==='flat'){const ss=selS().filter(x=>x.p);if(!ss.length)return toast('Pilih bentuk dulu.');ss.forEach(x=>{if(a==='all')smoothAll(x);else x.h=null});vr();props();return}
 const s=selS()[0];if(!s||!s.p||selS().length!==1)return toast('Pilih satu bentuk dengan alat Node (◇).');
 if(a==='close'){s.c=+!s.c;s.fill=s.c&&!V.st.nf?V.st.fill:null;vr();props();return}
 const i=V.node,n=s.p.length;if(i<0||i>=n)return toast('Ketuk dulu sebuah node (titik putih).');
 const m=s.c?n:n-1,sg=i<m?i:i-1;
 if(a==='add'){splitSeg(s,sg,.5);V.node=sg+1}
 else if(a==='del'){if(n<=2)return;delNode(s,i);V.node=-1}
 else if(a==='line')segLine(s,sg);
 else if(a==='curve')segCurve(s,sg);
 else nodeType(s,i,a);
 vr();props()}
/* klik ganda pada garis/kurva = tambah node (bentuk kurva tetap terjaga) */
dbl=function(e){if(V.pen){finishPen();vtool('v');return}
 if(V.tool!=='n')return;const s=selS()[0];if(!s||!s.p)return;
 const p=vraw(e),n=s.p.length,m=s.c?n:n-1;let best=null,bd=10/V.vw.z;
 for(let i=0;i<m;i++){const c=ctl(s,i);for(let k=1;k<24;k++){const q=bz(c[0],c[1],c[2],c[3],k/24),d=Math.hypot(p[0]-q[0],p[1]-q[1]);if(d<bd){bd=d;best=[i,k/24]}}}
 if(best){splitSeg(s,best[0],best[1]);V.node=best[0]+1;vr()}};

/* ---------- Gambar handle kurva di alat Node ---------- */
const _ui0=ui;
ui=function(){_ui0();const ss=selS(),s=ss[0];if(V.tool!=='n'||ss.length!==1||!s.p||!s.h||V.node<0)return;
 const z=V.vw.z,n=s.p.length,r=(coarse?11:5)/z,w=1/z;let h='';
 for(let d=-1;d<=1;d++){let k=V.node+d;if(s.c)k=(k+n)%n;else if(k<0||k>=n)continue;const H=s.h[k],P0=s.p[k];if(!H)continue;
  [H.a,H.b].forEach((q,wi)=>{if(same(q,P0))return;h+=`<line x1="${P0[0]}" y1="${P0[1]}" x2="${q[0]}" y2="${q[1]}" stroke="#e8a33d" stroke-width="${w}" pointer-events="none"/><circle data-q="${k}:${wi}" cx="${q[0]}" cy="${q[1]}" r="${r}" fill="#e8a33d" stroke="#222" stroke-width="${w}"/>`})}
 UI.insertAdjacentHTML('beforeend',h)};

/* ---------- Pointer: seret handle, pen klik-seret, node ikut handle, grup ---------- */
const pd0=svg.onpointerdown,pm0=svg.onpointermove,pu0=svg.onpointerup;
svg.onpointerdown=e=>{const t=e.target,q=t.dataset&&t.dataset.q;
 if(q&&V.tool==='n'&&VP.size===0&&e.button===0){svg.setPointerCapture(e.pointerId);VP.set(e.pointerId,[e.clientX,e.clientY]);dn={x:e.clientX,y:e.clientY};const[i,w]=q.split(':').map(Number);vdr={k:'hd',i,w};return}
 if(VP.size===0&&(V.tool==='v'||V.tool==='n')&&!e.shiftKey){const c=t.closest&&t.closest('[data-id]'),s=c&&byId(+c.dataset.id);if(s&&s.g&&!V.sel.has(s.id))V.sel=new Set(V.sh.filter(x=>x.g===s.g).map(x=>x.id))}
 pd0(e);
 if(V.tool==='p'&&V.pen&&!vdr&&VP.size===1&&e.button===0)vdr={k:'pendrag',s:V.pen,i:V.pen.p.length-2}};
svg.onpointermove=e=>{const d=vdr;
 if(d&&(d.k==='pendrag'||d.k==='hd'||d.k==='node')&&VP.size<2){
  if(VP.has(e.pointerId))VP.set(e.pointerId,[e.clientX,e.clientY]);const p=vpt(e);
  if(d.k==='pendrag'){const s=d.s,P0=s.p[d.i];if(P0){const H=fixH(s);H[d.i]=Math.hypot(p[0]-P0[0],p[1]-P0[1])>4/V.vw.z?{a:[2*P0[0]-p[0],2*P0[1]-p[1]],b:[...p],m:'s'}:null;vr()}}
  else{const s=selS()[0];if(s&&s.p&&s.p[d.i]){
   if(d.k==='hd'){const H=s.h&&s.h[d.i];if(H){const P0=s.p[d.i],k=d.w?'b':'a',o=d.w?'a':'b';H[k]=[...p];
     if(H.m!=='c'){const vx=p[0]-P0[0],vy=p[1]-P0[1],L=Math.hypot(vx,vy)||1,lo=H.m==='y'?L:Math.hypot(H[o][0]-P0[0],H[o][1]-P0[1]);H[o]=[P0[0]-vx/L*lo,P0[1]-vy/L*lo]}
     vr()}}
   else{const o=s.p[d.i];s.p[d.i]=p;const H=s.h&&s.h[d.i];if(H){const mv=q=>[p[0]+q[0]-o[0],p[1]+q[1]-o[1]];s.h[d.i]={a:mv(H.a),b:mv(H.b),m:H.m}}vr()}}}
  return}
 pm0(e)};
svg.onpointerup=svg.onpointercancel=e=>{pu0(e);grpExpand()};

/* ---------- Grup, susun, balik ---------- */
const newG=()=>'g'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function group(){const ss=selS();if(ss.length<2)return toast('Pilih minimal 2 objek untuk dijadikan grup.');const g=newG();ss.forEach(s=>s.g=g);toast('Objek digrup.');vr()}
function ungroup(){const ss=selS();ss.forEach(s=>{delete s.g});toast('Grup dilepas.');vr()}
function grpExpand(){const gs=new Set(selS().map(s=>s.g).filter(Boolean));if(!gs.size)return;let ch=false;V.sh.forEach(s=>{if(s.g&&gs.has(s.g)&&!V.sel.has(s.id)){V.sel.add(s.id);ch=true}});if(ch){vr();props()}}
function zord(front){const mine=V.sh.filter(s=>V.sel.has(s.id)),rest=V.sh.filter(s=>!V.sel.has(s.id));if(!mine.length)return;V.sh=front?[...rest,...mine]:[...mine,...rest];vr()}
function flip(h){const ss=selS();if(!ss.length)return;const b=bbAll(ss),cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2;ss.forEach(s=>xf(s,q=>h?[2*cx-q[0],q[1]]:[q[0],2*cy-q[1]]));vr();props()}
vdup=function(){const gm={},n=selS().map(s=>{const c=JSON.parse(JSON.stringify(s));c.id=V.nid++;if(c.g){gm[c.g]=gm[c.g]||newG();c.g=gm[c.g]}xf(c,q=>[q[0]+20,q[1]+20]);V.sh.push(c);return c.id});V.sel=new Set(n);vr();props()};
$('#vdup').onclick=vdup;
$('#vdel').onclick=()=>{const s=selS()[0];if(V.tool==='n'&&V.node>=0&&s&&s.p&&s.p.length>2){delNode(s,V.node);V.node=-1;vr();return}V.sh=V.sh.filter(x=>!V.sel.has(x.id));V.sel.clear();vr();props()};

/* ---------- Undo/Redo + autosave + file ---------- */
let VH='',VU=[],VR=[];
const vstr=()=>JSON.stringify({sh:V.sh,ly:V.ly,act:V.act,nid:V.nid,lid});
function applyV(d,keep){V.sh=d.sh;V.ly=d.ly;V.act=V.ly.some(l=>l.id===d.act)?d.act:V.ly[0].id;V.nid=Math.max(d.nid||1,...V.sh.map(s=>s.id+1));lid=Math.max(d.lid||1,...V.ly.map(l=>l.id));
 V.sel=keep?new Set([...V.sel].filter(id=>byId(id))):new Set;V.pen=null;V.node=-1;vdr=null;vr();props()}
const vsave=c=>{try{localStorage.setItem('hepilab_vec',c)}catch(_){}};
function vcommit(){if(ws!=='v'||V.pen||vdr)return;const c=vstr();if(c===VH)return;VU.push(VH);if(VU.length>80)VU.shift();VR=[];VH=c;vsave(c)}
function vundo(){vcommit();if(!VU.length)return toast('Tidak ada yang bisa di-undo.');VR.push(VH);VH=VU.pop();applyV(JSON.parse(VH),1);vsave(VH);toast('Undo ↶')}
function vredo(){if(!VR.length)return toast('Tidak ada yang bisa di-redo.');VU.push(VH);VH=VR.pop();applyV(JSON.parse(VH),1);vsave(VH);toast('Redo ↷')}
['pointerup','keyup','change','click'].forEach(t=>addEventListener(t,()=>setTimeout(vcommit,0),true));
addEventListener('pagehide',vcommit);addEventListener('visibilitychange',vcommit);
try{const s=localStorage.getItem('hepilab_vec');if(s){const d=JSON.parse(s);if(Array.isArray(d.sh)&&Array.isArray(d.ly)&&d.ly.length)applyV(d)}}catch(_){}
VH=vstr();

function vdl(b,n){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
function svgStr(bg){const g=V.ly.filter(l=>l.v).map(l=>'<g>'+V.sh.filter(s=>s.ly===l.id).map(s=>shp(s,0).replace(/ data-id="\d+"/,'').replace(/ style="[^"]*"/,'')).join('')+'</g>').join('');
 return'<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">'+(bg?'<rect width="1000" height="700" fill="#fff"/>':'')+g+'</svg>'}
const vFile=document.createElement('input');vFile.type='file';vFile.accept='.json,application/json';vFile.hidden=true;document.body.appendChild(vFile);
vFile.onchange=()=>{const f=vFile.files[0];if(!f)return;const r=new FileReader();
 r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.sh)||!Array.isArray(d.ly)||!d.ly.length)throw 0;applyV(d);vcommit();toast('Dibuka: '+f.name)}catch(_){toast('File tidak valid.')}};r.readAsText(f);vFile.value=''};

/* ---------- UI: tombol & panel (dibuat lewat JS, tidak perlu edit HTML) ---------- */
const vcss=document.createElement('style');vcss.textContent='.gb{display:grid;grid-template-columns:1fr 1fr;gap:4px}.gb button{padding:5px 4px;font-size:12px}#vxbar{pointer-events:none;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}#vxbar button{pointer-events:auto;flex:none}';document.head.appendChild(vcss);
$('#tV').insertAdjacentHTML('afterbegin','<button data-k="vundo" title="Undo (Ctrl+Z)">↶</button><button data-k="vredo" title="Redo (Ctrl+Shift+Z)">↷</button><hr>');
$('#tV [data-k=vundo]').onclick=vundo;$('#tV [data-k=vredo]').onclick=vredo;
$('#tV [data-v=y]').insertAdjacentHTML('afterend','<button data-v="s" title="Bintang (S) — jumlah sudut = kolom Sisi">★</button><button data-v="u" title="Persegi sudut bulat (U) — atur Radius di panel">▢</button>');
$$('#tV [data-v]').forEach(b=>b.onclick=()=>vtool(b.dataset.v));
$('#wV .cv').insertAdjacentHTML('beforeend','<div class="ov" id="vxbar" style="bottom:30px;left:8px;right:8px;display:none">'+
 [['add','＋ Node'],['del','－ Node'],['line','╱ Lurus'],['curve','⌒ Kurva'],['c','Cusp'],['s','Halus'],['y','Simetris'],['all','≈ Haluskan semua'],['flat','▱ Lurus semua'],['close','⭘ Tutup/Buka']].map(([k,l])=>`<button data-na="${k}">${l}</button>`).join('')+'</div>');
$('#vxbar').onclick=e=>{const b=e.target.closest('button');if(b)nodeAct(b.dataset.na)};
const _vt0=vtool;vtool=function(t){_vt0(t);$('#vxbar').style.display=V.tool==='n'?'flex':'none'};
$('#wV .side').insertAdjacentHTML('beforeend',
 '<div class="box"><h4>Susun dan Grup</h4><div class="gb"><button id="vxFront">⬆ Ke depan</button><button id="vxBack">⬇ Ke belakang</button><button id="vxFlipH">⇋ Balik H</button><button id="vxFlipV">⥮ Balik V</button><button id="vxGrp">▣ Grup</button><button id="vxUng">▢ Lepas grup</button></div></div>'+
 '<div class="box"><h4>Kanvas dan File</h4><div class="f2"><span>Snap</span><select id="vxSnap" style="grid-column:span 3;width:100%"><option value="0">Off</option><option value="5">Grid 5</option><option value="10">Grid 10</option><option value="25">Grid 25</option><option value="50">Grid 50</option></select></div>'+
 '<div class="f2"><span>Radius</span><input type="number" id="vxRad" min="0" value="20" style="grid-column:span 3"></div>'+
 '<div class="gb"><button id="vxSave">💾 Simpan .json</button><button id="vxOpen">📂 Buka</button><button id="vxSvg">⇩ Ekspor SVG</button><button id="vxPng">⇩ Ekspor PNG</button><button id="vxNew" style="grid-column:span 2">Kanvas baru</button></div></div>');
$('#vxFront').onclick=()=>zord(1);$('#vxBack').onclick=()=>zord(0);$('#vxFlipH').onclick=()=>flip(1);$('#vxFlipV').onclick=()=>flip(0);$('#vxGrp').onclick=group;$('#vxUng').onclick=ungroup;
$('#vxSnap').onchange=e=>V.gs=+e.target.value;$('#vxRad').oninput=e=>V.rad=Math.max(0,+e.target.value||0);
$('#vxSave').onclick=()=>vdl(new Blob([vstr()],{type:'application/json'}),'hepilab-vector.json');
$('#vxOpen').onclick=()=>vFile.click();
$('#vxSvg').onclick=()=>vdl(new Blob([svgStr(0)],{type:'image/svg+xml'}),'hepilab.svg');
$('#vxPng').onclick=()=>{const im=new Image;im.onload=()=>{const c=document.createElement('canvas');c.width=2000;c.height=1400;c.getContext('2d').drawImage(im,0,0,2000,1400);c.toBlob(b=>vdl(b,'hepilab.png'))};im.onerror=()=>toast('Gagal membuat PNG.');im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgStr(1))};
$('#vxNew').onclick=()=>{if(confirm('Kosongkan kanvas? (masih bisa di-undo)')){applyV({sh:[],ly:[{id:1,n:'Layer 1',v:1,l:0}],act:1,nid:1,lid:1});vcommit()}};

/* ---------- Keyboard (capture: jalan sebelum main.js) ---------- */
addEventListener('keydown',e=>{if(ws!=='v'||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const c=e.ctrlKey||e.metaKey,k=e.code,stop=()=>{e.preventDefault();e.stopImmediatePropagation()};
 if(c&&k==='KeyZ'){stop();e.shiftKey?vredo():vundo()}
 else if(c&&k==='KeyY'){stop();vredo()}
 else if(c&&k==='KeyG'){stop();e.shiftKey?ungroup():group()}
 else if(!c&&!e.altKey&&k==='KeyS'){stop();vtool('s')}
 else if(!c&&!e.altKey&&k==='KeyU'){stop();vtool('u')}
 else if(!c&&k.startsWith('Arrow')&&selS().length){stop();const d=e.shiftKey?10:1,dx=k==='ArrowLeft'?-d:k==='ArrowRight'?d:0,dy=k==='ArrowUp'?-d:k==='ArrowDown'?d:0;selS().forEach(s=>xf(s,q=>[q[0]+dx,q[1]+dy]));vr();props()}
 else if((e.key==='Delete'||e.key==='Backspace')&&V.tool==='n'&&V.node>=0){const s=selS()[0];if(s&&s.p&&s.p.length>2){stop();delNode(s,V.node);V.node=-1;vr();props()}}},true);