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
/* ---- Tab lem di model 3D ----
   Tab = trapesium yang sama dengan di pola 2D, tapi dihitung di koordinat 3D asli face pemiliknya (sebidang dengan face itu, keluar dari edge).
   Saat model melipat (e: 0 = datar … 1 = jadi), tab ikut face-nya (transformasi M[i]) DAN berengsel di pangkalnya: berputar e·φ ke arah DALAM face tetangga
   • tab SATU sisi: φ = sudut dari arah-keluar face pemilik ke arah-masuk face tetangga → akhirnya menempel di sisi dalam tetangga.
   • tab DUA sisi: kedua tab menekuk ke garis bagi sudut dalam → bertemu & saling menempel (tab ke tab), tiap tab digeser tipis ke sisinya agar tidak z-fight.
   Urutan rangkai: face melipat dulu, tab menekuk di separuh akhir, lalu tab memudar & hilang saat model jadi (sudah di dalam objek). */
let SHOWTAB3=true;
const cen3=j=>U.f[j].reduce((s,x)=>[s[0]+U.v[x][0],s[1]+U.v[x][1],s[2]+U.v[x][2]],[0,0,0]).map(x=>x/U.f[j].length);
function tabs3(){const r=U.res,out=[];if(!SHOWTAB3||!(TABW>0))return out;
  U.f.forEach((fc,i)=>fc.forEach((a,k)=>{const b=fc[(k+1)%fc.length],key=ek(a,b);if(!r.cutNo.has(key)||!hasTab(key,i))return;
    const A=U.v[a],B=U.v[b],ev=sub3(B,A),l=Math.hypot(...ev),q=U.em[key].find(j=>j!==i);if(l<1e-9||q===undefined)return;
    const d=ev.map(x=>x/l),ni=U.fn[i],nq=U.fn[q],dd=Math.min(l*.5,U.rad*.15*TABW),m=Math.min(l*.22,dd);if(dd<1e-9)return;
    let o=crs(ni,d);if(dot3(o,sub3(cen3(i),A))>0)o=o.map(x=>-x);       // arah keluar dari face pemilik (sebidang)
    let u=crs(nq,d);if(dot3(u,sub3(cen3(q),A))<0)u=u.map(x=>-x);        // arah masuk ke face tetangga
    const dual=tabSides(key).length>1,eps=U.rad*.01;let tg=u,off=nq.map(x=>-x*eps);
    if(dual){const si=o.map(x=>-x),bs=[si[0]+u[0],si[1]+u[1],si[2]+u[2]],bl=Math.hypot(...bs);tg=bl>1e-6?bs.map(x=>x/bl):ni.map(x=>-x); // garis bagi sudut dalam
      const pn=crs(d,tg),sg=dot3(pn,si)<0?-1:1;off=pn.map(x=>x*sg*eps)}
    let phi=Math.atan2(dot3(crs(o,tg),d),dot3(o,tg));
    if(Math.abs(phi)>Math.PI-1e-3)phi=dot3(crs(d,o),ni)<0?Math.PI:-Math.PI; // tetangga sebidang: lipat lewat sisi dalam
    const P=(p,x)=>[p[0]+d[0]*x+o[0]*dd,p[1]+d[1]*x+o[1]*dd,p[2]+d[2]*x+o[2]*dd];
    out.push({i,A,d,phi,pts:[A,P(A,m),P(B,-m),B],off})}));
  return out}
function drawTab3(w){const P=w.S;if(P.some(p=>p[2]<=.001))return;x3.save();x3.globalAlpha=w.a;const n=nrm(w.P);
  x3.beginPath();P.forEach((p,k)=>k?x3.lineTo(p[0],p[1]):x3.moveTo(p[0],p[1]));x3.closePath();
  x3.fillStyle=hsl(40,50,45+35*Math.abs(dot3(n,LD)));x3.fill();x3.strokeStyle='rgba(60,40,10,.75)';x3.lineWidth=1;x3.stroke();
  x3.save();x3.setLineDash([4,3]);x3.strokeStyle='#e0457b';x3.lineWidth=1.5;x3.beginPath();x3.moveTo(P[0][0],P[0][1]);x3.lineTo(P[3][0],P[3][1]);x3.stroke();x3.restore();x3.restore()} // pangkal tab = lipatan
function drawModel3(){x3.setTransform(D3,0,0,D3,0,0);x3.clearRect(0,0,W3,H3);const r=U.res;if(!r)return;
  const C=CAM=cam(),e=FOLD*FOLD*(3-2*FOLD); // smoothstep
  let FV,M=null;if(e>=1)FV=U.f.map(fc=>fc.map(a=>U.v[a]));else{M=foldXf(1-e);FV=U.f.map((fc,i)=>fc.map(a=>xfApp(M[i],U.v[a])))}
  S3=FV.map(P=>P.map(p=>proj(p,C)));x3.lineJoin='round';x3.lineCap='round';
  const ta=clamp((1-FOLD)/.15,0,1),tq=clamp((e-.45)/.55,0,1),te=tq*tq*(3-2*tq); // ta = kejelasan tab (memudar saat model jadi) · te = kemajuan tab menekuk (belakangan setelah face)
  const TW=(ta<.02?[]:tabs3()).map(t=>{const R=rod3(t.d,te*t.phi);let P=t.pts.map(p=>{const q=mvec3(R,sub3(p,t.A));return[t.A[0]+q[0]+t.off[0]*te,t.A[1]+q[1]+t.off[1]*te,t.A[2]+q[2]+t.off[2]*te]});
    if(M)P=P.map(p=>xfApp(M[t.i],p));return{P,a:ta,S:P.map(p=>proj(p,C))}});
  const items=U.f.map((fc,i)=>({f:i,z:S3[i].reduce((s,p)=>s+p[2],0)/fc.length})).concat(TW.map(w=>({w,z:w.S.reduce((s,p)=>s+p[2],0)/w.S.length})));
  items.sort((a,b)=>b.z-a.z);ORD=items.filter(o=>!o.w).map(o=>o.f); // painter: jauh → dekat (face & tab bercampur)
  for(const it of items){if(it.w){drawTab3(it.w);continue}const i=it.f,fc=U.f[i],P=S3[i];if(P.some(p=>p[2]<=.001))continue;
    x3.beginPath();P.forEach((p,k)=>k?x3.lineTo(p[0],p[1]):x3.moveTo(p[0],p[1]));x3.closePath();
    const n=e>=1?U.fn[i]:nrm(FV[i]);
    x3.fillStyle=i===SEL.f?'#ffd479':hsl(r.iof[i]*47%360,42,34+38*Math.abs(dot3(n,LD)));x3.fill();
    fc.forEach((a,k)=>{const b=fc[(k+1)%fc.length],fd=r.fold.has(ek(a,b)),Q=P[(k+1)%P.length];x3.beginPath();x3.moveTo(P[k][0],P[k][1]);x3.lineTo(Q[0],Q[1]);
      x3.strokeStyle=fd?'rgba(0,0,0,.35)':'#3ad6ff';x3.lineWidth=fd?1:2.4;x3.stroke()})}
  if(SEL.e){x3.strokeStyle='#fff';x3.lineWidth=4;U.f.forEach((fc,i)=>{const P=S3[i];fc.forEach((a,k)=>{if(ek(a,fc[(k+1)%fc.length])!==SEL.e)return;const Q=P[(k+1)%P.length];x3.beginPath();x3.moveTo(P[k][0],P[k][1]);x3.lineTo(Q[0],Q[1]);x3.stroke()})})}}
let SHOWDIM=true;
/* Kotak pembatas model + panjang tiap sisi (mm, sudah dikali skala MMU). Hanya saat model utuh (lipat 100%). L = sumbu X, P = Y, T = Z (atas). */
function drawDims(){if(!U.res||!CAM)return;const C=CAM,mn=[0,1,2].map(k=>Math.min(...U.v.map(p=>p[k]))),mx=[0,1,2].map(k=>Math.max(...U.v.map(p=>p[k]))),cor=[];
  for(let i=0;i<8;i++)cor.push([i&1?mx[0]:mn[0],i&2?mx[1]:mn[1],i&4?mx[2]:mn[2]]);
  const S=cor.map(p=>proj(p,C));if(S.some(p=>p[2]<=.001))return;
  const E=[];for(let i=0;i<8;i++)for(let k=0;k<3;k++)if(!(i>>k&1))E.push([i,i|1<<k,k]); // 12 rusuk: sudut yang beda tepat satu bit
  x3.save();x3.setLineDash([4,4]);x3.strokeStyle='rgba(200,210,225,.35)';x3.lineWidth=1;
  E.forEach(([a,b])=>{x3.beginPath();x3.moveTo(S[a][0],S[a][1]);x3.lineTo(S[b][0],S[b][1]);x3.stroke()});x3.setLineDash([]);
  const col=['#ff7b7b','#6fdc8c','#6ab7ff'],nm=['L','P','T'];x3.font='600 11px sans-serif';x3.textAlign='center';x3.textBaseline='middle';
  for(let k=0;k<3;k++){if(!(U.ext[k]>1e-9))continue;
    const cand=E.filter(e=>e[2]===k).map(([a,b])=>({a,b,m:[(S[a][0]+S[b][0])/2,(S[a][1]+S[b][1])/2]})),
     pk=k===2?cand.reduce((p,q)=>q.m[0]<p.m[0]?q:p):cand.reduce((p,q)=>q.m[1]>p.m[1]?q:p); // T: rusuk tegak paling kiri · L/P: rusuk alas paling depan
    x3.strokeStyle=col[k];x3.lineWidth=2.5;x3.beginPath();x3.moveTo(S[pk.a][0],S[pk.a][1]);x3.lineTo(S[pk.b][0],S[pk.b][1]);x3.stroke();
    const t=nm[k]+' '+fmtMM(U.ext[k]*MMU),w=x3.measureText(t).width+10;
    x3.fillStyle='rgba(20,22,26,.88)';x3.fillRect(pk.m[0]-w/2,pk.m[1]-9,w,18);x3.fillStyle=col[k];x3.fillText(t,pk.m[0],pk.m[1])}
  x3.restore()}
function draw3(){drawModel3();if(SHOWDIM&&FOLD>=.999)drawDims()}
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

$('#bTab3').onclick=()=>{SHOWTAB3=!SHOWTAB3;$('#bTab3').setAttribute('aria-pressed',SHOWTAB3);need3()};
$('#bDim').onclick=()=>{SHOWDIM=!SHOWDIM;$('#bDim').setAttribute('aria-pressed',SHOWDIM);need3()};
