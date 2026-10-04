/* bevel.js — Bevel per-edge (lebar · segmen · kebulatan) dan Knife (seret garis untuk memotong face).
   Dimuat setelah edgeslide.js, sebelum main.js. Bagian CORE di bawah murni data (tanpa DOM) supaya mudah diuji. */

/*CORE-BEGIN*/
const bvLen=a=>Math.hypot(a[0],a[1],a[2]),bvSc=(a,k)=>[a[0]*k,a[1]*k,a[2]*k],bvAdd=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],
 bvLerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],bvDd=a=>a.filter((v,i)=>v!==a[(i+1)%a.length]);

/* Urutkan face di sekeliling vertex v → {seq:[face], E:[tetangga], cyc, k}. Face i berada di antara edge E[i] dan E[i+1]. null = non-manifold. */
function bvFan(o,v,A){
 const fs=[...new Set(A.vf[v]||[])];if(fs.length<2)return null;
 const pv={},nv={},pm={},nm={};
 for(const fi of fs){const f=o.f[fi],n=f.length;let k=-1,c=0;for(let i=0;i<n;i++)if(f[i]===v){k=i;c++}
  if(c!==1)return null;const p=f[(k+n-1)%n],q=f[(k+1)%n];
  if(pm[p]!==undefined||nm[q]!==undefined)return null;pv[fi]=p;nv[fi]=q;pm[p]=fi;nm[q]=fi}
 let start=fs.find(f=>nm[pv[f]]===undefined),cyc=false;if(start===undefined){start=fs[0];cyc=true}
 const seq=[start];let cur=start;
 for(;;){const nx=pm[nv[cur]];if(nx===undefined)break;if(nx===start){cyc=true;break}if(seq.length>fs.length)return null;seq.push(nx);cur=nx}
 if(seq.length!==fs.length)return null;
 const k=seq.length;if(cyc&&k<3)return null;
 const E=seq.map(f=>pv[f]);E.push(cyc?E[0]:nv[seq[k-1]]);
 return{seq,E,cyc,k}}

/* Bevel edge `keys` (kunci 'a_b') selebar w, N segmen, rnd 0..1 (0 = chamfer lurus, 1 = melengkung).
   Mengubah o.f / o.v langsung. Hasil: {strips:[indeks face baru], skipped} atau null. */
function bevelCore(o,keys,w,N,rnd){
 const A=adj(o),total=new Set(keys).size;
 let BE=new Set(keys.filter(k=>{const e=A.ef[k]||[];return e.length===2&&e[0]!==e[1]}));
 let fan=null;
 for(let it=0;it<8;it++){fan={};const bad=new Set,vs=new Set;BE.forEach(k=>k.split('_').forEach(x=>vs.add(+x)));
  vs.forEach(v=>{const F=bvFan(o,v,A);F?fan[v]=F:bad.add(v)});
  if(!bad.size)break;BE=new Set([...BE].filter(k=>!k.split('_').some(x=>bad.has(+x))));fan=null}
 if(!fan||!BE.size)return null;
 const V=o.v,rep={},can={},wid=(fi,v)=>fi+'_'+v;
 BE.forEach(key=>{const[fa,fb]=A.ef[key],f=o.f[fa],n=f.length;let a=-1,b=-1;
  for(let i=0;i<n;i++){const x=f[i],y=f[(i+1)%n];if(ek(x,y)===key){a=x;b=y;break}}can[key]={a,b,F1:fa,F2:fb}});
 const cor=(v,p,q)=>{const P=V[v],a=sub3(V[p],P),b=sub3(V[q],P),la=bvLen(a)||1e-9,lb=bvLen(b)||1e-9,ua=bvSc(a,1/la),ub=bvSc(b,1/lb);
  return{ua,ub,la,lb,s:Math.max(bvLen(crs(ua,ub)),.2)}};
 const kk=(s,...L)=>Math.min(w/s,.49*Math.min(...L)),mkv=(v,D)=>{V.push(bvAdd(V[v],D));return V.length-1};
 const term=[],caps=[],capF=[];

 /* TAHAP 1 — titik pojok baru di tiap vertex yang tersentuh */
 Object.keys(fan).forEach(vs=>{const v=+vs,{seq,E,cyc,k}=fan[v],bj=[];
  for(let j=cyc?0:1;j<k;j++)if(BE.has(ek(v,E[j])))bj.push(j);
  const m=bj.length;if(!m)return;
  if(cyc&&m===1){   // ujung rantai bevel: dua titik, sisanya ditutup segitiga / digabung ke face tengah
   const j0=bj[0],gl=(j0+k-1)%k,c0=cor(v,E[j0],E[j0+1]),c1=cor(v,E[gl],E[gl+1]);
   const P2=mkv(v,bvSc(c0.ub,kk(c0.s,c0.lb))),P1=mkv(v,bvSc(c1.ua,kk(c1.s,c1.la)));
   rep[wid(seq[j0],v)]=[P2];rep[wid(seq[gl],v)]=[P1];term.push({v,j0,P1,P2,k,seq,E});return}
  const wedges=[];
  if(cyc){for(let i=0;i<m;i++){const s=bj[i],e=bj[(i+1)%m];wedges.push({s,len:(e-s+k)%k,lb:true,rb:true})}}
  else{const S=[0,...bj];S.forEach((s,i)=>{const e=i<bj.length?bj[i]:k;wedges.push({s,len:e-s,lb:i>0,rb:i<bj.length})})}
  wedges.forEach(wd=>{const fa=wd.s%k,fb=(wd.s+wd.len-1)%k;let D=[0,0,0];
   if(wd.lb&&wd.rb&&wd.len===1){const c=cor(v,E[fa],E[fa+1]);D=bvSc(bvAdd(c.ua,c.ub),kk(c.s,c.la,c.lb))}
   else{let n=0;
    if(wd.lb){const c=cor(v,E[fa],E[fa+1]);D=bvAdd(D,bvSc(c.ub,kk(c.s,c.lb)));n++}
    if(wd.rb){const c=cor(v,E[fb],E[fb+1]);D=bvAdd(D,bvSc(c.ua,kk(c.s,c.la)));n++}
    if(n)D=bvSc(D,1/n)}
   const id=mkv(v,D);for(let t=0;t<wd.len;t++)rep[wid(seq[(wd.s+t)%k],v)]=[id]});
  if(cyc&&(m>=3||N>=2))caps.push({v,bj,E})});

 /* TAHAP 2 — profil (titik-titik penampang) tiap edge di tiap ujungnya; urut dari sisi F1 ke sisi F2 */
 const prof={};
 BE.forEach(key=>{const c=can[key];[c.a,c.b].forEach(v=>{
  const p=rep[wid(c.F1,v)][0],q=rep[wid(c.F2,v)][0],P0=V[p],Q0=V[q],C=bvLerp(bvLerp(P0,Q0,.5),V[v],rnd),pl=[p];
  for(let i=1;i<N;i++){const t=i/N,u=1-t;V.push([0,1,2].map(x=>u*u*P0[x]+2*u*t*C[x]+t*t*Q0[x]));pl.push(V.length-1)}
  pl.push(q);prof[key+'|'+v]=pl})});

 /* TAHAP 3 — ujung rantai & tutup (cap) di pojok */
 term.forEach(t=>{const{v,j0,P1,P2,k,seq,E}=t,key=ek(v,E[j0]),c=can[key],pl=prof[key+'|'+v],s21=c.F1===seq[j0]?pl:[...pl].reverse();
  if(k===3)rep[wid(seq[(j0+1)%k],v)]=[...s21];
  else{rep[wid(seq[(j0+1)%k],v)]=[P2,v];rep[wid(seq[(j0+k-2)%k],v)]=[v,P1];capF.push([v,...s21])}});
 caps.forEach(({v,bj,E})=>{const poly=[];
  bj.forEach(j=>{const key=ek(v,E[j]),c=can[key],pl=prof[key+'|'+v],L=c.a===v?pl:[...pl].reverse();poly.push(...L.slice(0,-1))});
  capF.push(poly.reverse())});

 /* rakit ulang face */
 const orig=o.f.map((f,fi)=>bvDd(f.flatMap(v=>rep[wid(fi,v)]||[v]))).filter(f=>f.length>=3),strips=[];
 BE.forEach(key=>{const c=can[key],PA=prof[key+'|'+c.a],PB=prof[key+'|'+c.b];
  for(let i=0;i<N;i++)strips.push([PB[i],PA[i],PA[i+1],PB[i+1]])});
 const sf=[...strips,...capF].map(bvDd).filter(f=>f.length>=3);
 o.f=[...orig,...sf];
 return{strips:sf.map((_,i)=>orig.length+i),skipped:total-BE.size}}

/* Knife: potong face dengan garis layar A→B. proj(i) → [sx,sy,zKamera] untuk vertex i; allow = Set indeks face yang boleh dipotong (null = semua).
   Hasil: {chords:[kunci edge baru], n} atau null (tidak ada yang terpotong; mesh tidak berubah). */
function knifeCore(o,allow,proj,A,B){
 const dx=B[0]-A[0],dy=B[1]-A[1];if(dx*dx+dy*dy<4)return null;
 const nv0=o.v.length,cut={},px={},P=i=>px[i]||(px[i]=proj(i));
 const cross=(a,b)=>{const key=ek(a,b);if(key in cut)return cut[key];
  const lo=Math.min(a,b),hi=Math.max(a,b),p=P(lo),q=P(hi);let r=null;
  if(p[2]>NEAR&&q[2]>NEAR){const ex=q[0]-p[0],ey=q[1]-p[1],den=dx*ey-dy*ex;
   if(Math.abs(den)>1e-9){const wx=p[0]-A[0],wy=p[1]-A[1],u=(wx*ey-wy*ex)/den,s=(wx*dy-wy*dx)/den;
    if(u>=0&&u<=1&&s>=0&&s<=1){
     if(s<1e-4)r={vid:lo,u};else if(s>1-1e-4)r={vid:hi,u};
     else{const t=s*p[2]/((1-s)*q[2]+s*p[2]);o.v.push(bvLerp(o.v[lo],o.v[hi],t));r={vid:o.v.length-1,u}}}}}
  return cut[key]=r};
 o.f.forEach((f,fi)=>{if(allow&&!allow.has(fi))return;f.forEach((a,k)=>cross(a,f[(k+1)%f.length]))});
 const nf=[],chords=[];
 o.f.forEach((f,fi)=>{const n=f.length,pts=[],cr=new Map;
  f.forEach((a,k)=>{const b=f[(k+1)%n],r=cut[ek(a,b)];pts.push(a);
   if(r){if(!cr.has(r.vid))cr.set(r.vid,r.u);if(r.vid!==a&&r.vid!==b)pts.push(r.vid)}});
  if(allow&&!allow.has(fi)||cr.size<2){nf.push(pts);return}
  const ids=[...cr.entries()].sort((x,y)=>x[1]-y[1]).map(x=>x[0]);let polys=[pts];
  for(let i=0;i+1<ids.length;i+=2){const p=ids[i],q=ids[i+1];
   for(let pi=0;pi<polys.length;pi++){const L=polys[pi],ia=L.indexOf(p),ib=L.indexOf(q);if(ia<0||ib<0)continue;
    const d=Math.abs(ia-ib);if(d<2||d>L.length-2)break;   // bertetangga: tidak ada yang dibelah
    const lo=Math.min(ia,ib),hi=Math.max(ia,ib);
    polys.splice(pi,1,L.slice(lo,hi+1),[...L.slice(hi),...L.slice(0,lo+1)]);chords.push(ek(p,q));break}}
  polys.forEach(x=>nf.push(x))});
 if(!chords.length){o.v.length=nv0;return null}
 o.f=nf.filter(f=>f.length>=3);return{chords,n:chords.length}}
/*CORE-END*/

/* ================== UI ================== */
let BVW=.1,BVN=2,BVR=1;   // lebar, segmen, kebulatan (0 = chamfer lurus, 1 = bulat)

/* panel parameter ganda (versi runOp dengan beberapa slider) */
function runOpN(title,ps,fn){
 const snap=sceneStr(),pre={sm,v:[...S.v],e:[...S.e],f:[...S.f]};fn();if(sceneStr()===snap)return;
 const p=$('#opp');OP={after:sceneStr()};p.hidden=false;
 p.innerHTML=`<b>${title}</b>`+ps.map(q=>`<span>${q.label}</span><input type="range" min="${q.min}" max="${q.max}" step="${q.step}" value="${q.get()}"><input type="number" min="${q.min}" max="${q.max}" step="${q.step}" value="${q.get()}">`).join('')+'<button>OK</button>';
 const ins=p.querySelectorAll('input'),ok=p.querySelector('button'),go=()=>{if(sceneStr()!==OP.after){p.hidden=true;return}
  ps.forEach((q,i)=>{const x=+ins[i*2+1].value;if(!isNaN(x))q.set(clamp(x,+q.min,+q.max))});
  loadScene(snap,true);mode='edit';sm=pre.sm;S={v:new Set(pre.v),e:new Set(pre.e),f:new Set(pre.f)};fn();OP.after=sceneStr()};
 ps.forEach((q,i)=>{const r=ins[i*2],n=ins[i*2+1];r.oninput=()=>{n.value=r.value;go()};n.oninput=()=>{r.value=n.value;go()}});
 ok.onclick=()=>{p.hidden=true;OP=null}}

function bvKeys(){const o=sel;
 if(sm==='e')return[...S.e];
 if(sm==='f'){const s=new Set;S.f.forEach(i=>{const f=o.f[i];f&&f.forEach((a,k)=>s.add(ek(a,f[(k+1)%f.length])))});return[...s]}
 const vs=selV();return edges(o).filter(([a,b])=>vs.has(a)&&vs.has(b)).map(x=>x[2])}

function bevelRun2(){if(!needEdit())return;const o=sel,keys=bvKeys();
 if(!keys.length)return toast('Bevel: pilih edge dulu (mode Edge). Mode Vertex: pilih 2+ vertex yang tersambung.');
 const r=bevelCore(o,keys,BVW,Math.max(1,Math.round(BVN)),BVR);
 if(!r)return toast('Bevel: edge ini tidak bisa di-bevel (tepi terbuka atau sambungan non-manifold).');
 compact(o);clrS();sm='f';S.f=new Set(r.strips);rebuild(o);
 fin('Bevel '+(new Set(keys).size-r.skipped)+' edge'+(r.skipped?' ('+r.skipped+' dilewati)':'')+' — atur lebar / segmen / bulat di panel.')}

MM.bevel=function(){if(sel&&sel.hid&&sel.hid.length)unhideMesh(sel);
 runOpN('Bevel',[{label:'Lebar',get:()=>BVW,set:v=>BVW=v,min:.005,max:.6,step:.005},
  {label:'Segmen',get:()=>BVN,set:v=>BVN=Math.round(v),min:1,max:10,step:1},
  {label:'Bulat',get:()=>BVR,set:v=>BVR=v,min:0,max:1,step:.05}],bevelRun2)};
MM.bevelv=()=>runOp('Bevel Vertex',()=>BVL,v=>BVL=v,.02,.48,.01,bevelRun);   // bevel pojok lama (per vertex)

/* ---------- Knife ---------- */
let KN=null;   // aktif: {a,b,drag}
function knStart(){if(!needEdit())return;if(sel.hid&&sel.hid.length)unhideMesh(sel);if(OP){$('#opp').hidden=true;OP=null}
 KN={a:null,b:null,drag:false};cvEl.style.cursor='crosshair';knBtn();
 toast('Knife: seret garis melewati face yang mau dipotong · Esc / K = keluar · klik-kanan = orbit');need()}
function knEnd(){if(!KN)return;KN=null;cvEl.style.cursor='';knBtn();need()}
function knBtn(){const b=$('#t3 [data-a=knife]');if(b)b.classList.toggle('on',!!KN)}
function knRun(){const o=sel;if(!o||!KN||!KN.a||!KN.b)return;
 const wv=o.v.map(p=>W(o,p)),through=shade==='x'||shade==='w',restrict=selF(),allow=new Set;
 o.f.forEach((f,i)=>{if(restrict.size&&!restrict.has(i))return;
  if(!through){let nx=0,ny=0,nz=0,cx=0,cy=0,cz=0;const n=f.length;
   f.forEach((a,k)=>{const p=wv[a],q=wv[f[(k+1)%n]];nx+=(p[1]-q[1])*(p[2]+q[2]);ny+=(p[2]-q[2])*(p[0]+q[0]);nz+=(p[0]-q[0])*(p[1]+q[1]);cx+=p[0];cy+=p[1];cz+=p[2]});
   if(nx*(E[0]-cx/n)+ny*(E[1]-cy/n)+nz*(E[2]-cz/n)<=0)return}   // sisi belakang: lewati (X-ray / Wire = tembus semua)
  allow.add(i)});
 const proj=i=>{const c=toC(wv[i]),p=pj(c);return[p[0],p[1],c[2]]};
 const r=knifeCore(o,allow,proj,KN.a,KN.b);
 if(!r)return toast('Knife: garis tidak memotong face mana pun (harus melintasi edge).');
 clrS();sm='e';S.e=new Set(r.chords);rebuild(o);fin('Knife: '+r.n+' potongan — edge hasil potong terpilih.');
 if(typeof commit3==='function')commit3();syncProps()}

addEventListener('pointerdown',e=>{if(!KN||e.target!==cvEl||e.button!==0||!e.isPrimary)return;
 e.preventDefault();e.stopImmediatePropagation();KN.a=KN.b=loc(e);KN.drag=true;need()},true);
addEventListener('pointermove',e=>{if(KN&&KN.drag){KN.b=loc(e);need()}},true);
addEventListener('pointerup',e=>{if(!KN||!KN.drag)return;KN.drag=false;KN.b=loc(e);try{knRun()}finally{if(KN){KN.a=KN.b=null;need()}}},true);
addEventListener('pointercancel',()=>{if(KN&&KN.drag){KN.drag=false;KN.a=KN.b=null;need()}},true);
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
 const st=()=>{e.preventDefault();e.stopImmediatePropagation()};
 if(KN&&e.key==='Escape'){st();knEnd()}
 else if(e.code==='KeyK'&&!e.shiftKey&&!MD&&!SL){st();MM.knife()}},true);
{const _d=draw;draw=function(){_d();if(KN&&KN.a&&KN.b){g2.save();g2.setTransform(dpr,0,0,dpr,0,0);g2.strokeStyle='#ffd24a';g2.lineWidth=2;g2.setLineDash([7,5]);
  g2.beginPath();g2.moveTo(KN.a[0],KN.a[1]);g2.lineTo(KN.b[0],KN.b[1]);g2.stroke();g2.restore()}}}
{const _s=syncUI;syncUI=function(){_s();if(KN&&(mode!=='edit'||!sel))knEnd()}}
MM.knife=()=>KN?knEnd():knStart();

/* ---------- Tombol & menu ---------- */
$('#t3 [data-a=bev]').title='Bevel per-edge (B) — lebar, segmen, bulat';
$('#t3 [data-a=bev]').insertAdjacentHTML('afterend','<button class="edo" data-a="knife" title="Knife (K) — seret garis untuk memotong face">🔪</button>');
$('#t3 [data-a=knife]').onclick=()=>MM.knife();
{const g=$('#mMesh').querySelector('optgroup[label="Mode Edit"]'),bo=g.querySelector('option[value=bevel]');
 if(bo)bo.textContent='Bevel per-edge (B)';
 g.insertAdjacentHTML('afterbegin','<option value="knife">Knife (K)</option>');
 if(bo)bo.insertAdjacentHTML('afterend','<option value="bevelv">Bevel Vertex (pojok)</option>')}
syncUI();
