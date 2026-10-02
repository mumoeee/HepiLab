/* view2d.js — kanvas pola 2D: zoom/pan, geser island, ketuk edge = potong/tempel, ketuk face = pilih (menyala juga di 3D). */
const V2={s:1,x:0,y:0},c2=$('#c2'),x2=c2.getContext('2d');let W2=1,H2=1,D2=1,dirty2=true,grab=null;
const need2=()=>{dirty2=true};
const wp=i=>{const r=U.res,o=r.isl[r.iof[i]],p=r.pl[i];return U.f[i].map(a=>[p[a][0]+o.ox,p[a][1]+o.oy])}; // koordinat dunia 2D sebuah face
const s2w=(x,y)=>[(x-V2.x)/V2.s,(y-V2.y)/V2.s],w2s=p=>[p[0]*V2.s+V2.x,p[1]*V2.s+V2.y];
function bounds2(){let b=[1/0,1/0,-1/0,-1/0];U.f.forEach((_,i)=>wp(i).forEach(p=>{b=[Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])]}));return b}
function fit2(){if(!U.res)return;const b=bounds2(),pd=30,w=b[2]-b[0]||1,h=b[3]-b[1]||1,s=Math.max(1e-6,Math.min((W2-2*pd)/w,(H2-2*pd)/h));
  V2.s=s;V2.x=(W2-w*s)/2-b[0]*s;V2.y=(H2-h*s)/2-b[1]*s;need2()}
new ResizeObserver(()=>{const r=c2.parentElement.getBoundingClientRect();if(!r.width)return;D2=Math.min(devicePixelRatio||1,2);W2=r.width;H2=r.height;c2.width=W2*D2;c2.height=H2*D2;need2()}).observe(c2.parentElement);
function draw2(){x2.setTransform(D2,0,0,D2,0,0);x2.clearRect(0,0,W2,H2);const r=U.res;if(!r)return;
  x2.save();x2.translate(V2.x,V2.y);x2.scale(V2.s,V2.s);const px=1/V2.s;x2.lineJoin='round';x2.lineCap='round';
  const path=P=>{x2.beginPath();P.forEach((p,k)=>k?x2.lineTo(p[0],p[1]):x2.moveTo(p[0],p[1]));x2.closePath()};
  U.f.forEach((fc,i)=>{path(wp(i));x2.fillStyle=i===SEL.f?'#ffd479':hsl(r.iof[i]*47%360,42,76);x2.fill()});
  U.f.forEach((fc,i)=>{const P=wp(i);fc.forEach((a,k)=>{const b=fc[(k+1)%fc.length],key=ek(a,b),fd=r.fold.has(key);
    x2.beginPath();x2.moveTo(...P[k]);x2.lineTo(...P[(k+1)%P.length]);
    x2.setLineDash(fd?[6*px,4*px]:[]);x2.strokeStyle=fd?'#e0457b':'#2a2118';x2.lineWidth=(fd?1.2:2)*px;x2.stroke()})});
  if(SEL.e){x2.setLineDash([]);x2.strokeStyle='#5fc4b5';x2.lineWidth=4*px;
    U.f.forEach((fc,i)=>{const P=wp(i);fc.forEach((a,k)=>{if(ek(a,fc[(k+1)%fc.length])!==SEL.e)return;x2.beginPath();x2.moveTo(...P[k]);x2.lineTo(...P[(k+1)%P.length]);x2.stroke()})})}
  x2.restore()}
function pick2(x,y){let best=null,bd=9;
  U.f.forEach((fc,i)=>{const P=wp(i);fc.forEach((a,k)=>{const d=dseg([x,y],w2s(P[k]),w2s(P[(k+1)%P.length]));if(d<bd){bd=d;best=ek(a,fc[(k+1)%fc.length])}})});
  if(best)return{e:best};const w=s2w(x,y);for(let i=U.f.length-1;i>=0;i--)if(inPoly(w,wp(i)))return{f:i};return null}
gesture(c2,{
  down(x,y){grab=null;if(!U.res)return;const w=s2w(x,y);for(let i=U.f.length-1;i>=0;i--)if(inPoly(w,wp(i))){grab=U.res.iof[i];break}},
  drag(dx,dy,e,two){if(!U.res)return;
    if(grab!=null&&!two&&(e.buttons&1)){const o=U.res.isl[grab];o.ox+=dx/V2.s;o.oy+=dy/V2.s;PLACE.set(o.key,{ox:o.ox,oy:o.oy})}
    else{V2.x+=dx;V2.y+=dy}need2()},
  zoom(k,x,y){const n=clamp(V2.s*k,V2.s*.2,V2.s*5);k=n/V2.s;V2.x=x-(x-V2.x)*k;V2.y=y-(y-V2.y)*k;V2.s=n;need2()},
  tap(x,y){const h=pick2(x,y);if(h)pickHit(h)}});
