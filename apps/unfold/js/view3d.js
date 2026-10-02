/* view3d.js — viewer 3D kecil (Canvas 2D, tanpa library): orbit + zoom, warna per island, potongan = garis biru muda.
   Sengaja terpisah dari renderer app 3D (aturan: app tidak saling impor). Kalau nanti stabil → ekstrak ke shared/. */
const V3={th:.8,ph:1.1,k:1,t:[0,0,0]},c3=$('#c3'),x3=c3.getContext('2d'),TF=Math.tan(Math.PI/8),LD=nor([.35,.5,.8]);
let W3=1,H3=1,D3=1,dirty3=true,S3=[],ORD=[],CAM=null;
const need3=()=>{dirty3=true};
new ResizeObserver(()=>{const r=c3.parentElement.getBoundingClientRect();if(!r.width)return;D3=Math.min(devicePixelRatio||1,2);W3=r.width;H3=r.height;c3.width=W3*D3;c3.height=H3*D3;need3()}).observe(c3.parentElement);
function fit3(){V3.t=U.c.slice();V3.k=1;need3()}
function cam(){const r=U.rad*3.2*V3.k,t=V3.t,E=[t[0]+r*Math.sin(V3.ph)*Math.sin(V3.th),t[1]-r*Math.sin(V3.ph)*Math.cos(V3.th),t[2]+r*Math.cos(V3.ph)],F=nor(sub3(t,E)),R=nor(crs(F,[0,0,1]));return{E,F,R,Up:crs(R,F),r}}
const proj=(p,C)=>{const d=sub3(p,C.E),z=dot3(d,C.F),k=H3/2/TF/Math.max(z,1e-3);return[W3/2+dot3(d,C.R)*k,H3/2-dot3(d,C.Up)*k,z]};
function draw3(){x3.setTransform(D3,0,0,D3,0,0);x3.clearRect(0,0,W3,H3);const r=U.res;if(!r)return;
  const C=CAM=cam();S3=U.v.map(p=>proj(p,C));x3.lineJoin='round';x3.lineCap='round';
  ORD=U.f.map((fc,i)=>[i,fc.reduce((s,a)=>s+S3[a][2],0)/fc.length]).sort((a,b)=>b[1]-a[1]).map(a=>a[0]); // painter: jauh → dekat
  for(const i of ORD){const fc=U.f[i],P=fc.map(a=>S3[a]);if(P.some(p=>p[2]<=.001))continue;
    x3.beginPath();P.forEach((p,k)=>k?x3.lineTo(p[0],p[1]):x3.moveTo(p[0],p[1]));x3.closePath();
    x3.fillStyle=i===SEL.f?'#ffd479':hsl(r.iof[i]*47%360,42,34+38*Math.abs(dot3(U.fn[i],LD)));x3.fill();
    fc.forEach((a,k)=>{const b=fc[(k+1)%fc.length],fd=r.fold.has(ek(a,b));x3.beginPath();x3.moveTo(S3[a][0],S3[a][1]);x3.lineTo(S3[b][0],S3[b][1]);
      x3.strokeStyle=fd?'rgba(0,0,0,.35)':'#3ad6ff';x3.lineWidth=fd?1:2.4;x3.stroke()})}
  if(SEL.e){const[a,b]=SEL.e.split('_');x3.beginPath();x3.moveTo(S3[a][0],S3[a][1]);x3.lineTo(S3[b][0],S3[b][1]);x3.strokeStyle='#fff';x3.lineWidth=4;x3.stroke()}}
function pick3(x,y){if(!U.res)return null;
  for(let n=ORD.length-1;n>=0;n--){const i=ORD[n],fc=U.f[i],P=fc.map(a=>S3[a]);if(P.some(p=>p[2]<=.001)||!inPoly([x,y],P))continue;
    let best=null,bd=9;fc.forEach((a,k)=>{const b=fc[(k+1)%fc.length],d=dseg([x,y],P[k],S3[b]);if(d<bd){bd=d;best=ek(a,b)}});
    return best?{e:best}:{f:i}}
  let best=null,bd=9;U.f.forEach(fc=>fc.forEach((a,k)=>{const b=fc[(k+1)%fc.length],d=dseg([x,y],S3[a],S3[b]);if(d<bd){bd=d;best=ek(a,b)}}));return best?{e:best}:null}
gesture(c3,{
  drag(dx,dy,e,two){if(two||(e.buttons&6)){const C=CAM||cam(),k=2*TF*C.r/H3;V3.t=V3.t.map((q,j)=>q-C.R[j]*dx*k+C.Up[j]*dy*k)}
    else{V3.th-=dx*.01;V3.ph=clamp(V3.ph-dy*.01,.05,Math.PI-.05)}need3()},
  zoom(k){V3.k=clamp(V3.k/k,.05,10);need3()},
  tap(x,y){const h=pick3(x,y);if(h)pickHit(h)}});
