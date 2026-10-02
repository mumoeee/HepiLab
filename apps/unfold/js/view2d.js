/* view2d.js — kanvas pola 2D: zoom/pan, geser island, ketuk edge = potong/tempel, ketuk face = pilih (menyala juga di 3D). */
const V2={s:1,x:0,y:0},c2=$('#c2'),x2=c2.getContext('2d');let W2=1,H2=1,D2=1,dirty2=true,grab=null,SHOWPG=false;
const need2=()=>{dirty2=true};
const wp=i=>{const r=U.res,o=r.isl[r.iof[i]],p=r.pl[i],t=o.rot||0,c=Math.cos(t),s=Math.sin(t),cx=o.bx+o.w/2,cy=o.by+o.h/2; // putar terhadap pusat bagian, lalu geser
  return U.f[i].map(a=>{const dx=p[a][0]-cx,dy=p[a][1]-cy;return[cx+dx*c-dy*s+o.ox,cy+dx*s+dy*c+o.oy]})}; // koordinat dunia 2D sebuah face
const s2w=(x,y)=>[(x-V2.x)/V2.s,(y-V2.y)/V2.s],w2s=p=>[p[0]*V2.s+V2.x,p[1]*V2.s+V2.y];
function bounds2(){let b=[1/0,1/0,-1/0,-1/0];U.f.forEach((_,i)=>wp(i).forEach(p=>{b=[Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])]}));return b}
/* Pembagian halaman kertas: sel grid (satuan model) mulai dari pojok kiri-atas pola + padding. Margin cetak MARG mm. */
const MARG=8;
function pageGrid(){const mm=+$('#mm').value||10,[pw,ph]=$('#paper').value.split('x').map(Number),b=bounds2(),pad=5/mm+U.rad*.15,cw=(pw-2*MARG)/mm,ch=(ph-2*MARG)/mm;
  return{mm,pw,ph,cw,ch,x0:b[0]-pad,y0:b[1]-pad,cols:Math.max(1,Math.ceil((b[2]-b[0]+2*pad)/cw)),rows:Math.max(1,Math.ceil((b[3]-b[1]+2*pad)/ch))}}
function fit2(){if(!U.res)return;const b=bounds2(),pd=30,w=b[2]-b[0]||1,h=b[3]-b[1]||1,s=Math.max(1e-6,Math.min((W2-2*pd)/w,(H2-2*pd)/h));
  V2.s=s;V2.x=(W2-w*s)/2-b[0]*s;V2.y=(H2-h*s)/2-b[1]*s;need2()}
new ResizeObserver(()=>{const r=c2.parentElement.getBoundingClientRect();if(!r.width)return;D2=Math.min(devicePixelRatio||1,2);W2=r.width;H2=r.height;c2.width=W2*D2;c2.height=H2*D2;need2()}).observe(c2.parentElement);
function draw2(){x2.setTransform(D2,0,0,D2,0,0);x2.clearRect(0,0,W2,H2);const r=U.res;if(!r)return;
  x2.save();x2.translate(V2.x,V2.y);x2.scale(V2.s,V2.s);const px=1/V2.s;x2.lineJoin='round';x2.lineCap='round';
  const path=P=>{x2.beginPath();P.forEach((p,k)=>k?x2.lineTo(p[0],p[1]):x2.moveTo(p[0],p[1]));x2.closePath()};
  U.f.forEach((fc,i)=>{const P=wp(i);fc.forEach((a,k)=>{const key=ek(a,fc[(k+1)%fc.length]);
    if(!r.cutNo.has(key)||U.em[key][0]!==i)return;const t=tabPoly(P,k);if(!t)return;
    path(t);x2.fillStyle='#efe3c8';x2.fill();x2.setLineDash([]);x2.strokeStyle='#2a2118';x2.lineWidth=1.2*px;x2.stroke()})});
  U.f.forEach((fc,i)=>{path(wp(i));x2.fillStyle=i===SEL.f?'#ffd479':hsl(r.iof[i]*47%360,42,76);x2.fill()});
  U.f.forEach((fc,i)=>{const P=wp(i);fc.forEach((a,k)=>{const b=fc[(k+1)%fc.length],key=ek(a,b),fd=r.fold.has(key);
    x2.beginPath();x2.moveTo(...P[k]);x2.lineTo(...P[(k+1)%P.length]);
    x2.setLineDash(fd?(r.mtn.has(key)?[10*px,3*px,2*px,3*px]:[6*px,4*px]):[]);x2.strokeStyle=fd?'#e0457b':'#2a2118';x2.lineWidth=(fd?1.2:2)*px;x2.stroke()})});
  if(SEL.e){x2.setLineDash([]);x2.strokeStyle='#5fc4b5';x2.lineWidth=4*px;
    U.f.forEach((fc,i)=>{const P=wp(i);fc.forEach((a,k)=>{if(ek(a,fc[(k+1)%fc.length])!==SEL.e)return;x2.beginPath();x2.moveTo(...P[k]);x2.lineTo(...P[(k+1)%P.length]);x2.stroke()})})}
  if(SHOWPG){const g=pageGrid();x2.setLineDash([8*px,5*px]);x2.strokeStyle='#8a93a0';x2.lineWidth=1*px;x2.fillStyle='#8a93a0';x2.textAlign='left';x2.textBaseline='top';x2.font=12*px+'px sans-serif';
    for(let q=0;q<g.rows;q++)for(let c=0;c<g.cols;c++){const x=g.x0+c*g.cw,y=g.y0+q*g.ch;x2.strokeRect(x,y,g.cw,g.ch);x2.fillText('Hal '+(q*g.cols+c+1),x+4*px,y+4*px)}x2.setLineDash([])}
  x2.fillStyle='#2a2118';x2.textAlign='center';x2.textBaseline='middle';x2.font=`${Math.max(10,U.rad*.07*V2.s)*px}px sans-serif`;
  U.f.forEach((fc,i)=>{const P=wp(i);fc.forEach((a,k)=>{const n=r.cutNo.get(ek(a,fc[(k+1)%fc.length]));if(n==null)return;const p=lblPos(P,k);x2.fillText(n,p[0],p[1])})});
  x2.restore()}
function pick2(x,y){let best=null,bd=9;
  U.f.forEach((fc,i)=>{const P=wp(i);fc.forEach((a,k)=>{const d=dseg([x,y],w2s(P[k]),w2s(P[(k+1)%P.length]));if(d<bd){bd=d;best=ek(a,fc[(k+1)%fc.length])}})});
  if(best)return{e:best};const w=s2w(x,y);for(let i=U.f.length-1;i>=0;i--)if(inPoly(w,wp(i)))return{f:i};return null}
gesture(c2,{
  down(x,y){grab=null;if(!U.res)return;const w=s2w(x,y);for(let i=U.f.length-1;i>=0;i--)if(inPoly(w,wp(i))){grab=U.res.iof[i];break}},
  drag(dx,dy,e,two){if(!U.res)return;
    if(grab!=null&&!two&&(e.buttons&1)){const o=U.res.isl[grab];o.ox+=dx/V2.s;o.oy+=dy/V2.s;PLACE.set(o.key,{ox:o.ox,oy:o.oy,rot:o.rot||0});saveSoon()}
    else{V2.x+=dx;V2.y+=dy}need2()},
  zoom(k,x,y){const n=clamp(V2.s*k,V2.s*.2,V2.s*5);k=n/V2.s;V2.x=x-(x-V2.x)*k;V2.y=y-(y-V2.y)*k;V2.s=n;need2()},
  tap(x,y){const h=pick2(x,y);if(h)pickHit(h)}});
