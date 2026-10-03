/* bezier.js — kurva Bezier: matematika, bentuk baru (ellipse/bintang/sudut bulat), operasi node, handle di alat Node.
   Tiap node boleh punya handle di s.h[i] = {a:handle masuk, b:handle keluar, m:tipe 'c'=cusp / 's'=halus / 'y'=simetris}.
   Beberapa fungsi lama (bb, xf, shp, shapeFrom, dbl, ui) sengaja diganti di sini supaya paham kurva. */

/* ---------- Matematika kurva ---------- */
const same=(u,v)=>Math.abs(u[0]-v[0])<1e-6&&Math.abs(u[1]-v[1])<1e-6;
const bz=(a,b,c,d,t)=>{const u=1-t,k0=u*u*u,k1=3*u*u*t,k2=3*u*t*t,k3=t*t*t;return[k0*a[0]+k1*b[0]+k2*c[0]+k3*d[0],k0*a[1]+k1*b[1]+k2*c[1]+k3*d[1]]};
const ctl=(s,i)=>{const n=s.p.length,j=(i+1)%n,h=s.h||[],a=s.p[i],b=s.p[j];return[a,h[i]?h[i].b:a,h[j]?h[j].a:b,b]};
function samp(s){if(!s.h)return s.p;const n=s.p.length,m=s.c?n:n-1,o=[s.p[0]];for(let i=0;i<m;i++){const c=ctl(s,i);for(let k=1;k<=16;k++)o.push(bz(c[0],c[1],c[2],c[3],k/16))}return o}
function pathD(s){const p=s.p,n=p.length,m=s.c?n:n-1;let d='M'+p[0].join(' ');
 for(let i=0;i<m;i++){const j=(i+1)%n,c=ctl(s,i);d+=same(c[1],c[0])&&same(c[2],c[3])?'L'+p[j].join(' '):'C'+c[1].join(' ')+' '+c[2].join(' ')+' '+p[j].join(' ')}
 return d+(s.c?'Z':'')}
function fixH(s){const H=s.h=s.h||[];H.length=s.p.length;for(let i=0;i<H.length;i++)if(!H[i])H[i]=null;return H}
const vraw=e=>{const r=svg.getBoundingClientRect();return[(e.clientX-r.left-V.vw.x)/V.vw.z,(e.clientY-r.top-V.vw.y)/V.vw.z]};   // posisi pointer TANPA snap

/* ---------- Ganti fungsi lama agar paham kurva ---------- */
bb=function(s){if(s.t==='text')return[s.x,s.y-s.size,s.x+s.txt.length*s.size*.55,s.y+s.size*.25];const q=samp(s),x=q.map(a=>a[0]),y=q.map(a=>a[1]);return[Math.min(...x),Math.min(...y),Math.max(...x),Math.max(...y)]};
xf=function(s,fn,k=1,r=0){if(s.t==='text'){[s.x,s.y]=fn([s.x,s.y]);s.size*=k;s.rot=(s.rot||0)+r}else{s.p=s.p.map(q=>fn(q));if(s.h)s.h=s.h.map(h=>h&&{a:fn(h.a),b:fn(h.b),m:h.m})}};
const _shp0=shp;
shp=function(s,lk){if(s.t==='text')return _shp0(s,lk);
 return`<path data-id="${s.id}" d="${pathD(s)}" fill="${s.fill||'none'}" stroke="${s.stroke||'none'}" stroke-width="${s.sw}"${s.dash?' stroke-dasharray="8 5"':''} stroke-linejoin="round" style="pointer-events:${lk?'none':'all'}"/>`};

/* ---------- Bentuk: ellipse Bezier (c), persegi sudut bulat (u), bintang (s) ---------- */
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
function nodeAct(a){   // dipanggil tombol di bar bawah kanvas (data-na)
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
