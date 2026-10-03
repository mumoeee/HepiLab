/* view2d.js — kanvas pola 2D: zoom/pan, geser island, ketuk edge = potong/tempel, ketuk face = pilih (menyala juga di 3D). */
const V2={s:1,b:1,x:0,y:0},c2=$('#c2'),x2=c2.getContext('2d');let W2=1,H2=1,D2=1,dirty2=true,grab=null,grabT=-1,gF=-1,gd=0,mvd=false,SHOWPG=false;
const need2=()=>{dirty2=true;if(typeof FOLD!=='undefined'&&FOLD<1)dirty3=true}; // bila 3D sedang setengah terlipat, ia ikut pola 2D → gambar ulang juga
const wp=i=>{const r=U.res,o=r.isl[r.iof[i]],p=r.pl[i],t=o.rot||0,c=Math.cos(t),s=Math.sin(t),cx=o.bx+o.w/2,cy=o.by+o.h/2; // putar terhadap pusat bagian, lalu geser
  return U.f[i].map(a=>{const dx=p[a][0]-cx,dy=p[a][1]-cy;return[cx+dx*c-dy*s+o.ox,cy+dx*s+dy*c+o.oy]})}; // koordinat dunia 2D sebuah face
const s2w=(x,y)=>[(x-V2.x)/V2.s,(y-V2.y)/V2.s],w2s=p=>[p[0]*V2.s+V2.x,p[1]*V2.s+V2.y];
function bounds2(){let b=[1/0,1/0,-1/0,-1/0];U.f.forEach((_,i)=>wp(i).forEach(p=>{b=[Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])]}));for(const t of TXT){const r=txtR(t);b=[Math.min(b[0],t.x-r),Math.min(b[1],t.y-r),Math.max(b[2],t.x+r),Math.max(b[3],t.y+r)]}return b}
/* Pembagian halaman kertas: sel grid (satuan model) mulai dari pojok kiri-atas pola + padding. Margin cetak MARG mm. */
const MARG=8;
function pageGrid(){const mm=+$('#mm').value||10,[pw,ph]=$('#paper').value.split('x').map(Number),b=bounds2(),pad=5/mm+U.rad*.15,cw=(pw-2*MARG)/mm,ch=(ph-2*MARG)/mm;
  return{mm,pw,ph,cw,ch,x0:b[0]-pad,y0:b[1]-pad,cols:Math.max(1,Math.ceil((b[2]-b[0]+2*pad)/cw)),rows:Math.max(1,Math.ceil((b[3]-b[1]+2*pad)/ch))}}
/* Lebar area pola yang muat dalam satu halaman kertas (satuan model) — dipakai auto-pack di unfold.js. */
PACKW=()=>{const mm=+$('#mm').value||10,pw=+$('#paper').value.split('x')[0];return(pw-2*MARG)/mm-2*(5/mm+U.rad*.15)};
/* Daftar tab lem pada posisi dunia 2D sekarang. bad = tab menimpa face lain / tab lain (face pemilik tidak dihitung). */
function tabInfo(){const r=U.res,out=[],W=U.f.map((_,i)=>wp(i)),B=W.map(bbox),hit=(a,b)=>!(a[2]<b[0]||b[2]<a[0]||a[3]<b[1]||b[3]<a[1]);
  U.f.forEach((fc,i)=>fc.forEach((a,k)=>{const key=ek(a,fc[(k+1)%fc.length]);if(!r.cutNo.has(key)||!hasTab(key,i))return;
    const poly=tabPoly(W[i],k);if(poly)out.push({i,k,key,poly,bb:bbox(poly),bad:false})}));
  out.forEach(t=>{for(let j=0;j<W.length&&!t.bad;j++)if(j!==t.i&&hit(t.bb,B[j])&&overlap(t.poly,W[j]))t.bad=true;
    for(const u of out)if(!t.bad&&u!==t&&hit(t.bb,u.bb)&&overlap(t.poly,u.poly))t.bad=true});
  return out}
/* Garis pola untuk gambar & ekspor. Dua daftar: cut (potongan, digambar DI BAWAH) dan fold (lipatan, digambar DI ATAS supaya tidak tertutup).
   • Potongan muncul di DUA tempat pada pola (tiap sisi punya posisi sendiri) → semuanya harus digambar, tidak boleh di-dedupe.
   • Lipatan menyatu di satu tempat → dedupe per edge.
   • Pangkal tab lem = lipatan putus-putus (seperti Pepakura); tiga sisi luar tab = garis potong. */
function patLines(tabs){const r=U.res,cut=[],fold=[],done=new Set,tk=new Set(tabs.map(t=>t.i+'|'+t.key));
  U.f.forEach((fc,i)=>{const P=wp(i);fc.forEach((a,k)=>{const key=ek(a,fc[(k+1)%fc.length]),p=[P[k],P[(k+1)%P.length]];
    if(r.fold.has(key)){if(done.has(key))return;done.add(key);fold.push({p,t:r.mtn.has(key)?'mtn':'val'})}
    else if(tk.has(i+'|'+key))fold.push({p,t:'val'})
    else cut.push({p})})});
  tabs.forEach(t=>{for(let j=0;j<3;j++)cut.push({p:[t.poly[j],t.poly[j+1]],bad:t.bad})});
  return{cut,fold}}
let KEEP2=false,FIT2P=false; // fit2 diminta sebelum ukuran kanvas diketahui → tunda sampai ResizeObserver mengisi W2/H2
function fit2(){if(!U.res)return;if(W2<=1){FIT2P=true;return}const b=bounds2(),pd=30,w=b[2]-b[0]||1,h=b[3]-b[1]||1,s=Math.max(1e-6,Math.min((W2-2*pd)/w,(H2-2*pd)/h));
  V2.s=V2.b=s;V2.x=(W2-w*s)/2-b[0]*s;V2.y=(H2-h*s)/2-b[1]*s;need2()}
new ResizeObserver(()=>{const r=c2.parentElement.getBoundingClientRect();if(!r.width)return;const ow=W2,oh=H2;D2=Math.min(devicePixelRatio||1,2);W2=r.width;H2=r.height;c2.width=W2*D2;c2.height=H2*D2;
  if(KEEP2&&!FIT2P&&ow>1){V2.x+=(W2-ow)/2;V2.y+=(H2-oh)/2;KEEP2=false}else if(FIT2P||ow>1&&(Math.abs(W2-ow)/ow>.2||Math.abs(H2-oh)/oh>.2)){FIT2P=false;fit2()}need2()}).observe(c2.parentElement); // ukuran berubah banyak (putar HP, buka panel) → pas ulang
function draw2(){x2.setTransform(D2,0,0,D2,0,0);x2.clearRect(0,0,W2,H2);const r=U.res;if(!r)return;
  x2.save();x2.translate(V2.x,V2.y);x2.scale(V2.s,V2.s);const px=1/V2.s;x2.lineJoin='round';x2.lineCap='round';
  const path=P=>{x2.beginPath();P.forEach((p,k)=>k?x2.lineTo(p[0],p[1]):x2.moveTo(p[0],p[1]));x2.closePath()};
  const TI=tabInfo();TI.forEach(t=>{path(t.poly);x2.fillStyle=t.bad?'#ee8888':'#efe3c8';x2.fill()});
  U.f.forEach((fc,i)=>{path(wp(i));x2.fillStyle=i===SEL.f?'#ffd479':hsl(r.iof[i]*47%360,42,SEL.f>=0&&r.iof[SEL.f]===r.iof[i]?84:76);x2.fill()});
  const L=patLines(TI),seg=s=>{x2.beginPath();x2.moveTo(...s.p[0]);x2.lineTo(...s.p[1]);x2.stroke()};
  x2.setLineDash([]);x2.lineWidth=1.4*px;L.cut.forEach(s=>{x2.strokeStyle=s.bad?'#c0392b':STY.cut;seg(s)});   // potongan: tipis, di bawah
  x2.lineWidth=1.2*px;L.fold.forEach(s=>{x2.strokeStyle=s.t==='mtn'?STY.mtn:STY.val;x2.setLineDash(s.t==='mtn'?[10*px,3*px,2*px,3*px]:[6*px,4*px]);seg(s)});   // lipatan: di atas

  if(SEL.e){x2.setLineDash([]);x2.strokeStyle='#5fc4b5';x2.lineWidth=4*px;
    U.f.forEach((fc,i)=>{const P=wp(i);fc.forEach((a,k)=>{if(ek(a,fc[(k+1)%fc.length])!==SEL.e)return;x2.beginPath();x2.moveTo(...P[k]);x2.lineTo(...P[(k+1)%P.length]);x2.stroke()})})}
  if(SHOWPG){const g=pageGrid();x2.setLineDash([8*px,5*px]);x2.strokeStyle='#8a93a0';x2.lineWidth=1*px;x2.fillStyle='#8a93a0';x2.textAlign='left';x2.textBaseline='top';x2.font=12*px+'px sans-serif';
    for(let q=0;q<g.rows;q++)for(let c=0;c<g.cols;c++){const x=g.x0+c*g.cw,y=g.y0+q*g.ch;x2.strokeRect(x,y,g.cw,g.ch);x2.fillText('Hal '+(q*g.cols+c+1),x+4*px,y+4*px)}x2.setLineDash([])}
  x2.fillStyle='#2a2118';x2.textAlign='center';x2.textBaseline='middle';x2.font=`${Math.max(10,U.rad*.07*V2.s)*px}px sans-serif`;
  U.f.forEach((fc,i)=>{const P=wp(i);fc.forEach((a,k)=>{const n=r.cutNo.get(ek(a,fc[(k+1)%fc.length]));if(n==null)return;const p=lblPos(P,k);x2.fillText(n,p[0],p[1])})});
  drawTxt2();
  x2.restore();
  if(TABEDIT){x2.setLineDash([]);x2.textAlign='center';x2.textBaseline='middle';x2.font='bold 16px sans-serif';x2.lineWidth=1.5;x2.strokeStyle='#fff';
    for(const b of tabBtns()){const s=w2s(b.p);x2.beginPath();x2.arc(s[0],s[1],11,0,7);x2.fillStyle=b.on?'#d9534f':'#3fae6a';x2.fill();x2.stroke();x2.fillStyle='#fff';x2.fillText(b.on?'\u2212':'+',s[0],s[1]+1)}}}
/* Tombol edit tab: satu per (face, edge potongan) = satu per SISI. on = sisi ini sudah punya tab (tombol −), selain itu tombol +. Diletakkan di luar edge. */
function tabBtns(){const r=U.res,out=[];if(!r)return out;
  U.f.forEach((fc,i)=>{const P=wp(i),c=cen(P);fc.forEach((a,k)=>{const key=ek(a,fc[(k+1)%fc.length]);if(!r.cutNo.has(key))return;
    const A=P[k],B=P[(k+1)%P.length],dx=B[0]-A[0],dy=B[1]-A[1],l=Math.hypot(dx,dy);if(l<1e-9)return;
    let nx=-dy/l,ny=dx/l;if((c[0]-A[0])*nx+(c[1]-A[1])*ny>0){nx=-nx;ny=-ny}
    const d=Math.max(Math.min(l*.5,U.rad*.15*TABW)*.55,12/V2.s);
    out.push({i,k,key,p:[(A[0]+B[0])/2+nx*d,(A[1]+B[1])/2+ny*d],on:hasTab(key,i)})})});
  return out}
function pick2(x,y){if(TABEDIT){let nb=null,nd=15;for(const t of tabBtns()){const s=w2s(t.p),d=Math.hypot(s[0]-x,s[1]-y);if(d<nd){nd=d;nb=t}}if(nb)return{tb:nb}}
  {const ti=hitTxt(s2w(x,y));if(ti>=0)return{tx:ti}}   // teks pengguna diprioritaskan di atas face/edge
  let best=null,bd=9;
  U.f.forEach((fc,i)=>{const P=wp(i);fc.forEach((a,k)=>{const d=dseg([x,y],w2s(P[k]),w2s(P[(k+1)%P.length]));if(d<bd){bd=d;best=ek(a,fc[(k+1)%fc.length])}})});
  if(best)return{e:best};const w=s2w(x,y),tt=TABEDIT?null:tabInfo().find(t=>inPoly(w,t.poly));if(tt)return{t:tt};for(let i=U.f.length-1;i>=0;i--)if(inPoly(w,wp(i)))return{f:i};return null}
gesture(c2,{
  down(x,y){grab=null;grabT=-1;gF=-1;gd=0;mvd=false;if(!U.res)return;const w=s2w(x,y);grabT=hitTxt(w);if(grabT>=0)return;for(let i=U.f.length-1;i>=0;i--)if(inPoly(w,wp(i))){grab=U.res.iof[i];gF=i;break}},
  drag(dx,dy,e,two){if(!U.res)return;
    if(grabT>=0&&!two&&(e.buttons&1)){if(!mvd){gd+=Math.abs(dx)+Math.abs(dy);if(gd<5)return;mvd=true;snap();TSEL=grabT;syncExtras()}const t=TXT[grabT];t.x+=dx/V2.s;t.y+=dy/V2.s;need2();saveSoon();return}
    if(grab!=null&&!two&&(e.buttons&1)){if(!mvd){gd+=Math.abs(dx)+Math.abs(dy);if(gd<5)return;mvd=true;snap();SEL.f=gF;SEL.e=null;need3()}const o=U.res.isl[grab];o.ox+=dx/V2.s;o.oy+=dy/V2.s;PLACE.set(o.key,{ox:o.ox,oy:o.oy,rot:o.rot||0});saveSoon()}
    else{V2.x+=dx;V2.y+=dy}need2()},
  zoom(k,x,y){const n=clamp(V2.s*k,V2.b*.1,V2.b*40);k=n/V2.s;V2.x=x-(x-V2.x)*k;V2.y=y-(y-V2.y)*k;V2.s=n;need2()},
  tap(x,y){const h=pick2(x,y);if(h)pickHit(h)}});
