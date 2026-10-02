/* view3d.js — viewer 3D kecil (Canvas 2D, tanpa library): orbit + zoom, warna per island, potongan = garis biru muda.
   Sengaja terpisah dari renderer app 3D (aturan: app tidak saling impor). Kalau nanti stabil → ekstrak ke shared/.
   Animasi lipat: FOLD 0 = pola datar (sesuai tata letak 2D) … 1 = model 3D, dengan engsel kaku di tiap edge lipatan (lihat foldXf). */
const V3={th:.8,ph:1.1,k:1,t:[0,0,0]},c3=$('#c3'),x3=c3.getContext('2d'),TF=Math.tan(Math.PI/8),LD=nor([.35,.5,.8]);
let W3=1,H3=1,D3=1,dirty3=true,S3=[],ORD=[],CAM=null,FOLD=1,animId=0;
const need3=()=>{dirty3=true};
new ResizeObserver(()=>{const r=c3.parentElement.getBoundingClientRect();if(!r.width)return;D3=Math.min(devicePixelRatio||1,2);W3=r.width;H3=r.height;c3.width=W3*D3;c3.height=H3*D3;need3()}).observe(c3.parentElement);
function fit3(){V3.t=U.c.slice();V3.k=1;need3()}
function cam(){const r=U.rad*3.2*V3.k,t=V3.t,E=[t[0]+r*Math.sin(V3.ph)*Math.sin(V3.th),t[1]-r*Math.sin(V3.ph)*Math.cos(V3.th),t[2]+r*Math.cos(V3.ph)],F=nor(sub3(t,E)),R=nor(crs(F,[0,0,1]));return{E,F,R,Up:crs(R,F),r}}
const proj=(p,C)=>{const d=sub3(p,C.E),z=dot3(d,C.F),k=H3/2/TF/Math.max(z,1e-3);return[W3/2+dot3(d,C.R)*k,H3/2-dot3(d,C.Up)*k,z]};
const nrm=P=>{const n=[0,0,0];P.forEach((p,k)=>{const q=P[(k+1)%P.length];n[0]+=(p[1]-q[1])*(p[2]+q[2]);n[1]+=(p[2]-q[2])*(p[0]+q[0]);n[2]+=(p[0]-q[0])*(p[1]+q[1])});return nor(n)};
/* ---- Animasi lipat dengan ENGSEL (rigid): tiap face berputar kaku di sekitar edge lipat ke induknya, tidak ada face yang melar/menyusut. ----
   Tiap island = pohon face (akar = faces[0]). Pada tingkat lipat e (s=1-e = "seberapa terbuka"):
     • face anak: diputar terhadap edge lipatnya sebesar s·θ  (θ = sudut yang meratakannya ke bidang induk)
     • akar island: dipindah/diputar kaku dari posisi 3D aslinya ke posisi datar di tata letak 2D (interpolasi sudut-sumbu + geser pusat)
   Tiap face punya transformasi rigid {R:matriks 3×3 baris-demi-baris, t}; transformasi anak = transformasi induk ∘ putaran engsel. */
const mmul3=(A,B)=>{const C=[];for(let i=0;i<3;i++)for(let j=0;j<3;j++)C.push(A[i*3]*B[j]+A[i*3+1]*B[3+j]+A[i*3+2]*B[6+j]);return C},
 mvec3=(R,x)=>[R[0]*x[0]+R[1]*x[1]+R[2]*x[2],R[3]*x[0]+R[4]*x[1]+R[5]*x[2],R[6]*x[0]+R[7]*x[1]+R[8]*x[2]],
 rod3=(d,a)=>{const c=Math.cos(a),s=Math.sin(a),k=1-c,[x,y,z]=d;return[c+x*x*k,x*y*k-z*s,x*z*k+y*s,y*x*k+z*s,c+y*y*k,y*z*k-x*s,z*x*k-y*s,z*y*k+x*s,c+z*z*k]},
 xfRot=(A,d,a)=>{const R=rod3(d,a),q=mvec3(R,A);return{R,t:[A[0]-q[0],A[1]-q[1],A[2]-q[2]]}},
 xfMul=(P,C)=>{const t=mvec3(P.R,C.t);return{R:mmul3(P.R,C.R),t:[t[0]+P.t[0],t[1]+P.t[1],t[2]+P.t[2]]}},
 xfApp=(M,x)=>{const y=mvec3(M.R,x);return[y[0]+M.t[0],y[1]+M.t[1],y[2]+M.t[2]]};
function rotAA(R){const an=Math.acos(clamp((R[0]+R[4]+R[8]-1)/2,-1,1));let ax=[R[7]-R[5],R[2]-R[6],R[3]-R[1]];const l=Math.hypot(...ax);
  if(l>1e-9)ax=ax.map(x=>x/l);
  else if(an>1){const d=[(R[0]+1)/2,(R[4]+1)/2,(R[8]+1)/2],k=d.indexOf(Math.max(...d)),a=Math.sqrt(Math.max(d[k],1e-12)),col=[R[k]/2+(k===0?.5:0),R[3+k]/2+(k===1?.5:0),R[6+k]/2+(k===2?.5:0)];ax=nor(col.map(x=>x/a))}
  else ax=[0,0,1];
  return{ax,an}}
/* Engsel tiap face (tidak berubah selama U.res sama): induk, titik & arah sumbu, sudut θ untuk meratakan ke bidang induk. */
let HG=null;
function hinges(){const r=U.res;if(HG&&HG.res===r)return HG;const h=new Array(U.f.length).fill(null);
  r.isl.forEach(o=>{const ord=new Map(o.faces.map((f,k)=>[f,k]));  // o.faces urut BFS: induk selalu sebelum anak
    o.faces.forEach((c,k)=>{if(!k)return;const fc=U.f[c];
      for(let j=0;j<fc.length;j++){const a=fc[j],b=fc[(j+1)%fc.length],key=ek(a,b);if(!r.fold.has(key))continue;
        const[x,y]=U.em[key],p=x===c?y:x;if(ord.get(p)>=k)continue;
        const A=U.v[a],d=nor(sub3(U.v[b],A)),nc=U.fn[c],np=U.fn[p];
        h[c]={p,A,d,th:Math.atan2(dot3(crs(nc,np),d),dot3(nc,np))};break}})});
  return HG={res:r,h}}
/* Transformasi akar island pada keterbukaan s (0 = 3D asli, 1 = datar di tata letak 2D). Pola 2D dilihat dari +Z, sumbu y dibalik. */
function rootXf(root,fl,s){const fc=U.f[root],P=fc.slice(0,3).map(a=>U.v[a]),W=wp(root),F=[0,1,2].map(k=>[U.c[0]+W[k][0]-fl.mx,U.c[1]-(W[k][1]-fl.my),fl.z]),
  e1=nor(sub3(P[1],P[0])),e3=U.fn[root],e2=crs(e3,e1),f1=nor(sub3(F[1],F[0])),f3=[0,0,1],f2=crs(f3,f1),R0=[];
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)R0.push(f1[i]*e1[j]+f2[i]*e2[j]+f3[i]*e3[j]);
  const C=fc.reduce((q,a)=>[q[0]+U.v[a][0],q[1]+U.v[a][1],q[2]+U.v[a][2]],[0,0,0]).map(x=>x/fc.length),q0=mvec3(R0,P[0]),t0=[F[0][0]-q0[0],F[0][1]-q0[1],F[0][2]-q0[2]],
   RC=mvec3(R0,C),G=[RC[0]+t0[0],RC[1]+t0[1],RC[2]+t0[2]],{ax,an}=rotAA(R0),Rg=rod3(ax,s*an),RgC=mvec3(Rg,C);
  return{R:Rg,t:[0,1,2].map(j=>C[j]-RgC[j]+s*(G[j]-C[j]))}}
/* Transformasi rigid semua face pada keterbukaan s. */
function foldXf(s){const H=hinges(),b=bounds2(),fl={mx:(b[0]+b[2])/2,my:(b[1]+b[3])/2,z:Math.min(...U.v.map(p=>p[2]))-U.rad*.05},M=new Array(U.f.length);
  U.res.isl.forEach(o=>o.faces.forEach((c,k)=>{if(!k)return void(M[c]=rootXf(c,fl,s));const g=H.h[c];M[c]=xfMul(M[g.p],xfRot(g.A,g.d,s*g.th))}));
  return M}
function draw3(){x3.setTransform(D3,0,0,D3,0,0);x3.clearRect(0,0,W3,H3);const r=U.res;if(!r)return;
  const C=CAM=cam(),e=FOLD*FOLD*(3-2*FOLD); // smoothstep
  let FV;if(e>=1)FV=U.f.map(fc=>fc.map(a=>U.v[a]));else{const M=foldXf(1-e);FV=U.f.map((fc,i)=>fc.map(a=>xfApp(M[i],U.v[a])))}
  S3=FV.map(P=>P.map(p=>proj(p,C)));x3.lineJoin='round';x3.lineCap='round';
  ORD=U.f.map((fc,i)=>[i,S3[i].reduce((s,p)=>s+p[2],0)/fc.length]).sort((a,b)=>b[1]-a[1]).map(a=>a[0]); // painter: jauh → dekat
  for(const i of ORD){const fc=U.f[i],P=S3[i];if(P.some(p=>p[2]<=.001))continue;
    x3.beginPath();P.forEach((p,k)=>k?x3.lineTo(p[0],p[1]):x3.moveTo(p[0],p[1]));x3.closePath();
    const n=e>=1?U.fn[i]:nrm(FV[i]);
    x3.fillStyle=i===SEL.f?'#ffd479':hsl(r.iof[i]*47%360,42,34+38*Math.abs(dot3(n,LD)));x3.fill();
    fc.forEach((a,k)=>{const b=fc[(k+1)%fc.length],fd=r.fold.has(ek(a,b)),Q=P[(k+1)%P.length];x3.beginPath();x3.moveTo(P[k][0],P[k][1]);x3.lineTo(Q[0],Q[1]);
      x3.strokeStyle=fd?'rgba(0,0,0,.35)':'#3ad6ff';x3.lineWidth=fd?1:2.4;x3.stroke()})}
  if(SEL.e){x3.strokeStyle='#fff';x3.lineWidth=4;U.f.forEach((fc,i)=>{const P=S3[i];fc.forEach((a,k)=>{if(ek(a,fc[(k+1)%fc.length])!==SEL.e)return;const Q=P[(k+1)%P.length];x3.beginPath();x3.moveTo(P[k][0],P[k][1]);x3.lineTo(Q[0],Q[1]);x3.stroke()})})}}
function pick3(x,y){if(!U.res||S3.length!==U.f.length)return null;
  for(let n=ORD.length-1;n>=0;n--){const i=ORD[n],fc=U.f[i],P=S3[i];if(P.some(p=>p[2]<=.001)||!inPoly([x,y],P))continue;
    let best=null,bd=9;fc.forEach((a,k)=>{const d=dseg([x,y],P[k],P[(k+1)%P.length]);if(d<bd){bd=d;best=ek(a,fc[(k+1)%fc.length])}});
    return best?{e:best}:{f:i}}
  let best=null,bd=9;U.f.forEach((fc,i)=>fc.forEach((a,k)=>{const P=S3[i],d=dseg([x,y],P[k],P[(k+1)%P.length]);if(d<bd){bd=d;best=ek(a,fc[(k+1)%fc.length])}}));return best?{e:best}:null}
gesture(c3,{
  drag(dx,dy,e,two){if(two||(e.buttons&6)){const C=CAM||cam(),k=2*TF*C.r/H3;V3.t=V3.t.map((q,j)=>q-C.R[j]*dx*k+C.Up[j]*dy*k)}
    else{V3.th-=dx*.01;V3.ph=clamp(V3.ph-dy*.01,.05,Math.PI-.05)}need3()},
  zoom(k){V3.k=clamp(V3.k/k,.05,10);need3()},
  tap(x,y){const h=pick3(x,y);if(h)pickHit(h)}});

/* Slider & tombol animasi lipat. Tombol: dari posisi sekarang menuju pola datar (bila sedang >50%) atau menuju model 3D. */
const fs=$('#fold');
fs.oninput=()=>{cancelAnimationFrame(animId);FOLD=fs.value/100;need3()};
$('#bAnim').onclick=()=>{cancelAnimationFrame(animId);const a=FOLD,b=a>.5?0:1,t0=performance.now(),D=1800*Math.abs(b-a)+200;
  (function step(now){const k=Math.min(1,(now-t0)/D);FOLD=a+(b-a)*k;fs.value=Math.round(FOLD*100);need3();if(k<1)animId=requestAnimationFrame(step)})(t0)};
