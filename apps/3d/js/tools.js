
/* ======== blender ======== */
/* blender.js — Fase 1: toolbar kontekstual, ikon ringkas, panel operator (Extrude/Inset bisa diatur),
   gizmo ala Blender (panah / cincin / kotak), Kursor 3D, titik Origin, panel Ukuran (dimensi). Dimuat setelah modeling.js. */
const CUR=[0,0,0];let curMode=false,OP=null;
const dimOf=o=>[0,1,2].map(k=>{const a=o.v.map(p=>p[k]);return(Math.max(...a)-Math.min(...a))*Math.abs(o.mesh.scale['xyz'[k]])});

/* ---------- ikon ringkas ---------- */
[...$('#snapSel').options].forEach(o=>o.textContent='🧲 '+({off:'Off',v:'Vertex',e:'Edge',ve:'V+E',g:'Grid'})[o.value]);
$('#addSel').title='Tambah objek (muncul di Kursor 3D)';
{const og=document.createElement('optgroup');og.label='Kursor 3D';
 og.innerHTML='<option value="curSel">Kursor ke terpilih</option><option value="curOrg">Kursor ke pusat (Shift+C)</option><option value="orgCur">Origin ke kursor</option>';$('#mMesh').append(og);
 const b=document.createElement('button');b.id='bCur';b.textContent='⌖';b.title='Kursor 3D: aktifkan lalu klik di viewport untuk meletakkan';$('#snapSel').before(b);
 b.onclick=()=>{curMode=!curMode;b.classList.toggle('on',curMode)};
 vp.insertAdjacentHTML('beforeend','<div id="opp" hidden></div>');
 $('#props3 [data-p=s0]').parentNode.insertAdjacentHTML('afterend','<div class="f"><span>Ukuran</span><input type="number" step=".1" data-d="0"><input type="number" step=".1" data-d="1"><input type="number" step=".1" data-d="2"></div><div class="f2"><button id="bFit" style="grid-column:span 4" title="Skala seragam: sisi terpanjang jadi 1">⤢ Ukuran = 1</button></div>')}
$$('#props3 input[data-d]').forEach(i=>i.oninput=()=>{const v=parseFloat(i.value);if(!sel||!(v>0))return;const k=+i.dataset.d,a=sel.v.map(p=>p[k]),raw=Math.max(...a)-Math.min(...a);if(raw>1e-9){sel.mesh.scale['xyz'[k]]=v/raw;need()}});
$('#bFit').onclick=()=>{if(!sel)return;const s=1/Math.max(...dimOf(sel));['x','y','z'].forEach(a=>sel.mesh.scale[a]*=s);need();syncProps()};

/* ---------- toolbar kontekstual: Object vs Edit ---------- */
const _su1=syncUI;syncUI=function(){_su1();const ed=mode==='edit';
 $$('#t3 [data-a=ext],#t3 [data-a=exti],#t3 [data-a=pe],#t3 [data-a=slide],#t3 [data-a=fill],#t3 [data-a=fillh]').forEach(b=>b.style.display=ed?'':'none');$('#t3 [data-a=dup]').style.display='';
 $('#mMesh').querySelectorAll('optgroup').forEach(g=>{const h=(g.label==='Mode Edit'&&!ed)||(g.label==='Objek'&&ed);g.hidden=g.disabled=h})};
const _sp0=syncProps;syncProps=function(){_sp0();$$('#props3 input[data-d]').forEach(i=>{i.disabled=!sel;if(!sel){i.value='';return}if(document.activeElement!==i)i.value=+dimOf(sel)[+i.dataset.d].toFixed(3)})};

/* ---------- panel operator: atur parameter setelah aksi (seperti "Adjust Last Operation") ---------- */
function runOp(title,get,set,min,max,st,fn){
 const snap=sceneStr(),pre={sm,v:[...S.v],e:[...S.e],f:[...S.f]};fn();if(sceneStr()===snap)return;
 const p=$('#opp');OP={after:sceneStr()};p.hidden=false;
 p.innerHTML=`<b>${title}</b><input type="range" min="${min}" max="${max}" step="${st}" value="${get()}"><input type="number" step="${st}" value="${get()}"><button>OK</button>`;
 const[r,n,ok]=p.querySelectorAll('input,button'),go=v=>{if(isNaN(v))return;if(sceneStr()!==OP.after){p.hidden=true;return}
  set(v);loadScene(snap,true);mode='edit';sm=pre.sm;S={v:new Set(pre.v),e:new Set(pre.e),f:new Set(pre.f)};fn();OP.after=sceneStr()};
 r.oninput=()=>{n.value=r.value;go(+r.value)};n.oninput=()=>{r.value=n.value;go(+n.value)};ok.onclick=()=>{p.hidden=true;OP=null}}
const _ex0=extrude;extrude=function(){runOp('Extrude',()=>EXD,v=>EXD=v,-2,2,.05,_ex0)};$('#t3 [data-a=ext]').onclick=extrude;
const _in0=MM.inset;MM.inset=function(){runOp('Inset',()=>INS,v=>INS=v,.02,.95,.01,_in0)};

/* ---------- gizmo ala Blender ---------- */
const ringPts=(p,k,L,n)=>{const u=AXS[{x:'y',y:'z',z:'x'}[k]],w=AXS[{x:'z',y:'x',z:'y'}[k]];return Array.from({length:n+1},(_,i)=>{const a=i/n*6.2832;return p.map((x,j)=>x+(u[j]*Math.cos(a)+w[j]*Math.sin(a))*L)})};
function drawGizmo(){if(!sel||(mode==='edit'&&!selV().size))return;const p=pivot();if(toC(p)[2]<NEAR)return;const L=Math.hypot(...sub3(E,p))*.2,t=et(),r=coarse?11:8;
 for(const k in AXS){const c=AC[k];
  if(t==='rotate'){const q=ringPts(p,k,L,48);for(let i=1;i<q.length;i++)ln3(q[i-1],q[i],c,3);continue}
  const tip=p.map((x,i)=>x+AXS[k][i]*L);ln3(p,tip,c,3.5);if(toC(tip)[2]<NEAR)continue;
  const a=scr(p),b=scr(tip),l=Math.hypot(b[0]-a[0],b[1]-a[1])||1,ux=(b[0]-a[0])/l,uy=(b[1]-a[1])/l;g2.fillStyle=c;g2.beginPath();
  if(t==='scale')g2.rect(b[0]-r*.8,b[1]-r*.8,r*1.6,r*1.6);
  else{g2.moveTo(b[0]+ux*r*1.8,b[1]+uy*r*1.8);g2.lineTo(b[0]-uy*r*.7,b[1]+ux*r*.7);g2.lineTo(b[0]+uy*r*.7,b[1]-ux*r*.7);g2.closePath()}
  g2.fill()}
 const s=scr(p);g2.fillStyle='#fff';g2.beginPath();g2.arc(s[0],s[1],3,0,6.283);g2.fill()}
const _gh0=gzHit;gzHit=function(x,y){if(et()!=='rotate')return _gh0(x,y);if(!gzGeo())return null;const p=pivot(),L=Math.hypot(...sub3(E,p))*.2;let b=coarse?20:10,h=null;
 for(const k in AXS){const q=ringPts(p,k,L,32);for(let i=1;i<q.length;i++){if(toC(q[i-1])[2]<NEAR||toC(q[i])[2]<NEAR)continue;const d=dseg(x,y,scr(q[i-1]),scr(q[i]));if(d<b){b=d;h=k}}}return h};
const _gd0=gzDrag;gzDrag=function(dx,dy){if(et()!=='rotate')return _gd0(dx,dy);   // rotate = putar mengelilingi pivot di layar
 const d=AXS[dr.a],p=pivot(),c=scr(p),a=scr(p.map((x,i)=>x+d[i])),sx=a[0]-c[0],sy=a[1]-c[1],L=Math.hypot(sx,sy)||1;
 let da=Math.atan2(dr.y+dy-c[1],dr.x+dx-c[0])-Math.atan2(dr.y-c[1],dr.x-c[0]);da=Math.atan2(Math.sin(da),Math.cos(da));
 const m=(dot3(d,CF)<0?-da:da)/.012;_gd0(m*sx/L,m*sy/L)};

/* ---------- Kursor 3D + titik Origin ---------- */
const _d1=draw;draw=function(){_d1();
 SO.forEach(o=>{if(!o.vis)return;const q=o.mesh.position,P=[q.x,q.y,q.z];if(toC(P)[2]<NEAR)return;const s=scr(P);g2.fillStyle='#ffa53a';g2.strokeStyle='#000';g2.lineWidth=1;g2.beginPath();g2.arc(s[0],s[1],4,0,6.283);g2.fill();g2.stroke()});
 if(toC(CUR)[2]>=NEAR){const s=scr(CUR),r=11;g2.lineWidth=2;g2.strokeStyle='#fff';g2.beginPath();g2.arc(s[0],s[1],r,0,6.283);g2.stroke();g2.strokeStyle='#e0503c';g2.setLineDash([4,4]);g2.stroke();g2.setLineDash([]);
  g2.strokeStyle='#fff';g2.beginPath();g2.moveTo(s[0]-r-5,s[1]);g2.lineTo(s[0]+r+5,s[1]);g2.moveTo(s[0],s[1]-r-5);g2.lineTo(s[0],s[1]+r+5);g2.stroke()}};
const _pd=cvEl.onpointerdown;cvEl.onpointerdown=e=>{if(curMode&&e.button===0&&!e.shiftKey){const q=loc(e),D=rayOf(q[0],q[1]),h=hitRay(D,objs.filter(o=>o.vis));let c=null;
  if(h)c=E.map((x,i)=>x+D[i]*h.t);else if(Math.abs(D[2])>1e-6){const t=-E[2]/D[2];if(t>0)c=E.map((x,i)=>x+D[i]*t)}
  if(c){CUR.splice(0,3,...c);need();toast('Kursor 3D dipindah.')}return}_pd(e)};
const _add1=add;add=function(k){_add1(k);if(sel){setP(sel,CUR[0],CUR[1]+(k==='plane'?0:.5),CUR[2]);need();syncProps()}};
MM.curSel=()=>{if(!sel)return toast('Pilih objek dulu.');CUR.splice(0,3,...pivot());fin('Kursor 3D ke posisi terpilih.')};
MM.curOrg=()=>{CUR.fill(0);fin('Kursor 3D ke pusat.')};
MM.orgCur=()=>{const L=mode==='obj'?[...SO]:sel?[sel]:[];if(!L.length)return toast('Pilih objek dulu.');L.forEach(o=>{const c=Wi(o,CUR);o.v=o.v.map(p=>sub3(p,c));setP(o,...CUR)});fin('Origin dipindah ke Kursor 3D.')};
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.shiftKey&&e.code==='KeyC'){CUR.fill(0);fin('Kursor 3D ke pusat.')}});
syncUI();

/* ======== tools2 ======== */
/* tools2.js — Fase 2: Bevel, Loop Cut, Subdivide (jumlah), Hapus bertipe (Vertex/Edge/Face), tombol toolbar edit.
   Memakai runOp() dari blender.js (panel parameter). Dimuat setelah blender.js. */
let BVL=.25,LCN=1,SUBN=1;

/* ---------- Bevel: seluruh pojok (vertex) yang tersentuh pilihan dipotong jadi cap + strip ---------- */
function bevelRun(){if(!needEdit())return;const o=sel,T=selV(),t=BVL;if(!T.size)return toast('Bevel: pilih edge / vertex dulu.');
 const ci=[],dirE={},nxt={},nf=[];
 o.f.forEach((f,fi)=>{const c=cen3(o,f);ci[fi]=f.map(v=>{if(!T.has(v))return v;o.v.push(o.v[v].map((x,k)=>x+(c[k]-x)*t));return o.v.length-1});f.forEach((a,k)=>dirE[a+'_'+f[(k+1)%f.length]]=[fi,k])});
 const dd=a=>a.filter((v,i)=>v!==a[(i+1)%a.length]);ci.forEach(f=>nf.push(f));
 Object.keys(dirE).forEach(key=>{const[a,b]=key.split('_').map(Number),r=dirE[b+'_'+a];if(a>b||!r||(!T.has(a)&&!T.has(b)))return;
  const[f1,k1]=dirE[key],[f2,k2]=r,A1=ci[f1][k1],B1=ci[f1][(k1+1)%ci[f1].length],B2=ci[f2][k2],A2=ci[f2][(k2+1)%ci[f2].length],s=dd([B1,A1,A2,B2]);
  if(s.length>=3)nf.push(s);if(T.has(a))nxt[A2]=A1;if(T.has(b))nxt[B1]=B2});
 const seen=new Set;Object.keys(nxt).map(Number).forEach(s=>{if(seen.has(s))return;const cy=[s];seen.add(s);let c=nxt[s];while(c!==undefined&&c!==s&&cy.length<99){cy.push(c);seen.add(c);c=nxt[c]}if(c===s&&cy.length>=3)nf.push(cy)});
 o.f=nf.filter(f=>f.length>=3);compact(o);rebuild(o);clrS();fin('Bevel selesai — atur lebar di panel kiri bawah.')}

/* ---------- Loop Cut: potong ring quad yang dilewati edge terpilih ---------- */
function loopCut(){if(!needEdit())return;const o=sel;if(sm==='f')return toast('Loop Cut: pakai mode Edge/Vertex, pilih sebuah edge.');
 const vs=selV(),E0=sm==='e'?[...S.e]:edges(o).filter(([a,b])=>vs.has(a)&&vs.has(b)).map(x=>x[2]);if(!E0.length)return toast('Loop Cut: pilih sebuah edge dulu.');
 const n=LCN,ef={},ring=new Map,cuts={};o.f.forEach((f,fi)=>f.forEach((a,k)=>(ef[ek(a,f[(k+1)%f.length])]=ef[ek(a,f[(k+1)%f.length])]||[]).push(fi)));
 const walk=(key,fi)=>{let cur=key,f=fi;while(f!==undefined&&!ring.has(f)){const F=o.f[f];if(F.length!==4)return;const k=F.findIndex((a,i)=>ek(a,F[(i+1)%4])===cur);if(k<0)return;ring.set(f,k);cur=ek(F[(k+2)%4],F[(k+3)%4]);f=(ef[cur]||[]).find(x=>x!==f)}};
 E0.forEach(k=>(ef[k]||[]).forEach(fi=>walk(k,fi)));if(!ring.size)return toast('Loop Cut: edge ini tidak berada di jalur quad.');
 const get=(a,b,i)=>{const key=ek(a,b);if(!cuts[key]){const lo=Math.min(a,b),hi=Math.max(a,b);cuts[key]=Array.from({length:n},(_,j)=>{o.v.push(o.v[lo].map((x,c)=>x+(o.v[hi][c]-x)*(j+1)/(n+1)));return o.v.length-1})}return a<b?cuts[key][i-1]:cuts[key][n-i]};
 const pt=(a,b,i)=>i===0?a:i===n+1?b:get(a,b,i),nf=[],ns=new Set;
 o.f.forEach((f,fi)=>{if(!ring.has(fi))return;const k=ring.get(fi),g=[0,1,2,3].map(j=>f[(k+j)%4]);
  for(let i=0;i<=n;i++){nf.push([pt(g[0],g[1],i),pt(g[0],g[1],i+1),pt(g[3],g[2],i+1),pt(g[3],g[2],i)]);if(i>0)ns.add(ek(pt(g[0],g[1],i),pt(g[3],g[2],i)))}});
 o.f.forEach((f,fi)=>{if(ring.has(fi))return;nf.push(f.flatMap((a,k)=>{const c=cuts[ek(a,f[(k+1)%f.length])];return!c?[a]:a<f[(k+1)%f.length]?[a,...c]:[a,...[...c].reverse()]}))});
 o.f=nf;clrS();sm='e';S.e=ns;fin('Loop Cut: '+ring.size+' face dipotong — atur jumlah di panel.')}

/* ---------- Hapus bertipe ---------- */
function delKill(type){const o=sel,vs=selV(),kill=new Set,es=sm==='e'?new Set(S.e):new Set(edges(o).filter(([a,b])=>vs.has(a)&&vs.has(b)).map(x=>x[2]));
 if(sm==='f')o.f.forEach((f,i)=>S.f.has(i)&&f.forEach((a,k)=>es.add(ek(a,f[(k+1)%f.length]))));const sf=selF();
 o.f.forEach((f,i)=>{if((type==='v'&&f.some(v=>vs.has(v)))||(type==='e'&&f.some((a,k)=>es.has(ek(a,f[(k+1)%f.length]))))||(type==='f'&&sf.has(i)))kill.add(i)});
 if(!kill.size)return toast('Tidak ada yang terhapus untuk tipe ini.');o.f=o.f.filter((_,i)=>!kill.has(i));
 if(!o.f.length){objs=objs.filter(x=>x!==o);setSel(null);return toast('Objek kosong, dihapus.')}compact(o);rebuild(o);clrS();fin(kill.size+' face dihapus.')}
const _del0=del;del=function(){if(mode!=='edit'||!sel||!selV().size)return _del0();const p=$('#opp');OP=null;p.hidden=false;
 p.innerHTML='<b>Hapus</b><button data-k="v">Vertex</button><button data-k="e">Edge</button><button data-k="f">Face</button><button data-k="x">✕</button>';
 p.onclick=e=>{const k=e.target.dataset.k;if(!k)return;p.hidden=true;p.onclick=null;if(k!=='x')delKill(k)}};
$('#t3 [data-a=del]').onclick=del;

/* ---------- Hubungkan ke panel parameter, menu, toolbar, pintasan ---------- */
const _sd0=MM.subdiv;MM.subdiv=()=>runOp('Subdivide ×',()=>SUBN,v=>SUBN=Math.round(v),1,3,1,()=>{for(let i=0;i<SUBN;i++)_sd0()});
MM.bevel=()=>runOp('Bevel',()=>BVL,v=>BVL=v,.02,.48,.01,bevelRun);
MM.lcut=()=>runOp('Loop Cut ×',()=>LCN,v=>LCN=Math.round(v),1,8,1,loopCut);
$('#mMesh').querySelector('optgroup[label="Mode Edit"]').insertAdjacentHTML('afterbegin','<option value="bevel">Bevel (B)</option><option value="lcut">Loop Cut (Ctrl+R)</option>');
$('#t3 [data-a=ext]').insertAdjacentHTML('afterend','<button class="edo" data-a="inset" title="Inset face (I)">⧈</button><button class="edo" data-a="lcut" title="Loop Cut (Ctrl+R)">⊟</button><button class="edo" data-a="bev" title="Bevel (B)">◪</button>');
$('#t3 [data-a=inset]').onclick=()=>MM.inset();$('#t3 [data-a=lcut]').onclick=()=>MM.lcut();$('#t3 [data-a=bev]').onclick=()=>MM.bevel();
const _su2=syncUI;syncUI=function(){_su2();$$('#t3 .edo').forEach(b=>b.style.display=mode==='edit'?'':'none')};
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const c=e.ctrlKey||e.metaKey,st=()=>{e.preventDefault();e.stopImmediatePropagation()};
 if(c&&e.code==='KeyR'){st();MM.lcut()}else if(!c&&!e.shiftKey&&!e.altKey&&e.code==='KeyB'){st();MM.bevel()}},true);
syncUI();

/* ======== unfold ======== */
/* unfold.js — ubah mesh 3D jadi pola 2D (potong/lipat), modal hasil, dan tombol 'Kirim ke Vector Workspace'. */
/* =============== UNFOLD =============== */
let UF=null;
function unfold(){const o=sel;if(!o)return toast('Pilih objek dulu, lalu klik Unfold.');
 const F=mode==='edit'&&sm==='f'&&S.f.size?[...S.f]:o.f.map((_,i)=>i);
 const P=o.v.map(p=>new T.Vector3(...p).applyM(o)),em={};
 F.forEach(i=>{const f=o.f[i];f.forEach((a,k)=>{const key=ek(a,f[(k+1)%f.length]);(em[key]=em[key]||[]).push(i)})});
 const pl={},isl=[],fold=new Set(),poly=i=>o.f[i].map(v=>pl[i].c[v]);
 const inP=(q,g)=>{let c=false;for(let i=0,j=g.length-1;i<g.length;j=i++){const a=g[i],b=g[j];if((a[1]>q[1])!=(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
 const cen=g=>[g.reduce((s,a)=>s+a[0],0)/g.length,g.reduce((s,a)=>s+a[1],0)/g.length];
 const smp=g=>{const c=cen(g);return[c,...g.map(a=>[c[0]+(a[0]-c[0])*.85,c[1]+(a[1]-c[1])*.85])]};
 const hit=(g,h)=>smp(g).some(q=>inP(q,h))||smp(h).some(q=>inP(q,g));
 for(const r of F){if(pl[r])continue;
  const f=o.f[r],n=new T.Vector3();f.forEach((a,k)=>n.add(new T.Vector3().crossVectors(P[a],P[f[(k+1)%f.length]])));n.normalize();
  const u=P[f[1]].clone().sub(P[f[0]]).normalize(),w=new T.Vector3().crossVectors(n,u),c={};
  f.forEach(v=>{const d=P[v].clone().sub(P[f[0]]);c[v]=[d.dot(u),d.dot(w)]});
  const id=isl.length;isl.push([r]);pl[r]={c};const q=[r];
  while(q.length){const pI=q.shift(),pf=o.f[pI];
   pf.forEach((a,k)=>{const b=pf[(k+1)%pf.length],ci=em[ek(a,b)].find(x=>x!==pI);if(ci===undefined||pl[ci]||(o.seams||[]).includes(ek(a,b)))return;
    const cf=o.f[ci],A=pl[pI].c[a],B=pl[pI].c[b],e=P[b].clone().sub(P[a]),eh=e.clone().normalize();
    let ux=B[0]-A[0],uy=B[1]-A[1];const ul=Math.hypot(ux,uy);ux/=ul;uy/=ul;const nx=-uy,ny=ux,pc=cen(poly(pI)),s=Math.sign((pc[0]-A[0])*nx+(pc[1]-A[1])*ny)||1,cc={};
    cf.forEach(v=>{const rr=P[v].clone().sub(P[a]),al=rr.dot(eh),pv=rr.sub(eh.clone().multiplyScalar(al)).length();cc[v]=[A[0]+ux*al-s*nx*pv,A[1]+uy*al-s*ny*pv]});
    const g=cf.map(v=>cc[v]);if(isl[id].some(j=>hit(g,poly(j))))return;
    pl[ci]={c:cc};isl[id].push(ci);q.push(ci);fold.add(ek(a,b))})}}
 let X=0,Y=0,rh=0;const out=[];
 isl.forEach(list=>{const pts=list.flatMap(poly),x0=Math.min(...pts.map(a=>a[0])),y0=Math.min(...pts.map(a=>a[1])),w=Math.max(...pts.map(a=>a[0]))-x0,h=Math.max(...pts.map(a=>a[1]))-y0;
  if(X>0&&X+w>12){X=0;Y+=rh+.6;rh=0}out.push(list.map(i=>({f:o.f[i],pts:poly(i).map(a=>[a[0]-x0+X,a[1]-y0+Y])})));X+=w+.6;rh=Math.max(rh,h)});
 UF={out,fold,F,o};const all=out.flat().flatMap(x=>x.pts),mx=Math.max(...all.map(a=>a[0])),my=Math.max(...all.map(a=>a[1]));
 let body='',lines='';out.flat().forEach(({f,pts})=>{body+=`<polygon points="${pts.join(' ')}" fill="#e6c48a"/>`;
  f.forEach((a,k)=>{const b=(k+1)%f.length,isF=fold.has(ek(a,f[b]));lines+=`<line x1="${pts[k][0]}" y1="${pts[k][1]}" x2="${pts[b][0]}" y2="${pts[b][1]}" stroke="${isF?'#e0457b':'#2a2118'}" stroke-width="${isF?.035:.05}" ${isF?'stroke-dasharray=".14 .09"':''} stroke-linecap="round"/>`})});
 $('#usvg').setAttribute('viewBox',`-.5 -.5 ${mx+1} ${my+1}`);$('#usvg').innerHTML=body+lines;
 $('#ustat').textContent=`${out.length} bagian · ${out.flat().length} sisi · ${fold.size} lipatan`;$('#unf').hidden=false}
/* Buka di app Unfold: kirim MESH (titik dunia + face + seam), bukan pola jadi — algoritma unfold hanya ada di app Unfold. */
$('#uOpen').onclick=()=>{const{F,o}=UF,m={},v=[],f=F.map(i=>o.f[i].map(a=>m[a]??(m[a]=v.push(W(o,o.v[a]).map(x=>+x.toFixed(5)))-1))),
  cuts=(o.seams||[]).map(k=>k.split('_')).filter(([a,b])=>m[a]!==undefined&&m[b]!==undefined).map(([a,b])=>ek(m[a],m[b]));
  if(!HL.send('unfold',{name:o.name||'Model',mesh:{v,f},cuts}))return toast('Gagal mengirim (penyimpanan penuh?).');
  if(typeof commit3==='function')commit3();location.href='../unfold/?import=unfold'};
$('#bUnf').onclick=unfold;$('#uClose').onclick=()=>$('#unf').hidden=true;
/* Kirim pola ke app Vector: data disimpan lewat HL.send (shared/transfer.js), lalu halaman Vector dibuka. */
$('#uSend').onclick=()=>{const K=60,l1={name:'Pola Unfold',shapes:[]},l2={name:'Garis lipat',shapes:[]},done=new Set;   // done: tiap garis lipat dikirim sekali saja
 UF.out.flat().forEach(({f,pts})=>{const P=pts.map(a=>[a[0]*K+60,a[1]*K+60]);l1.shapes.push({p:P,c:1,fill:'#e6c48a',stroke:'#2a2118',sw:1.5});
  f.forEach((a,k)=>{const b=(k+1)%f.length;const key=ek(a,f[b]);if(UF.fold.has(key)&&!done.has(key)){done.add(key);l2.shapes.push({p:[P[k],P[b]],c:0,fill:null,stroke:'#e0457b',sw:1.5,dash:1})}})});
 if(!HL.send('unfold',{layers:[l1,l2]}))return toast('Gagal mengirim (penyimpanan penuh?). Coba hapus data lama.');
 if(typeof commit3==='function')commit3();location.href='../vector/?import=unfold'};

/* ======== boolean ======== */
/* boolean.js — Boolean (Lubangi / Gabung / Irisan) berbasis BSP */
/* ---------- Boolean (BSP-CSG). Objek AKTIF = yang dilubangi, objek terpilih lain = pemotong ---------- */
const EP=1e-5;
function csgSplit(pl,q,cf,cb,fr,bk){let ty=0;const t=q.v.map(p=>{const d=dot3(pl.n,p)-pl.w,c=d<-EP?2:d>EP?1:0;ty|=c;return c});
 if(ty===0)(dot3(pl.n,q.pl.n)>0?cf:cb).push(q);else if(ty===1)fr.push(q);else if(ty===2)bk.push(q);
 else{const f=[],b=[];q.v.forEach((vi,i)=>{const j=(i+1)%q.v.length,vj=q.v[j];if(t[i]!==2)f.push(vi);if(t[i]!==1)b.push(vi);
  if((t[i]|t[j])===3){const u=(pl.w-dot3(pl.n,vi))/dot3(pl.n,sub3(vj,vi)),v=vi.map((x,k)=>x+(vj[k]-x)*u);f.push(v);b.push(v)}});
  if(f.length>=3)fr.push({v:f,pl:q.pl});if(b.length>=3)bk.push({v:b,pl:q.pl})}}
class Nd{constructor(p){this.pl=null;this.f=null;this.b=null;this.p=[];if(p)this.build(p)}
 inv(){this.p=this.p.map(q=>({v:q.v.slice().reverse(),pl:{n:q.pl.n.map(x=>-x),w:-q.pl.w}}));if(this.pl)this.pl={n:this.pl.n.map(x=>-x),w:-this.pl.w};if(this.f)this.f.inv();if(this.b)this.b.inv();[this.f,this.b]=[this.b,this.f]}
 clip(ps){if(!this.pl)return ps.slice();let f=[],b=[];ps.forEach(q=>csgSplit(this.pl,q,f,b,f,b));f=this.f?this.f.clip(f):f;b=this.b?this.b.clip(b):[];return f.concat(b)}
 clipTo(n){this.p=n.clip(this.p);if(this.f)this.f.clipTo(n);if(this.b)this.b.clipTo(n)}
 all(){let a=this.p.slice();if(this.f)a=a.concat(this.f.all());if(this.b)a=a.concat(this.b.all());return a}
 build(ps){if(!ps.length)return;if(!this.pl)this.pl=ps[0].pl;const f=[],b=[];ps.forEach(q=>csgSplit(this.pl,q,this.p,this.p,f,b));if(f.length){this.f=this.f||new Nd();this.f.build(f)}if(b.length){this.b=this.b||new Nd();this.b.build(b)}}}
function csgPolys(o){const w=o.v.map(p=>W(o,p)),r=[];o.f.forEach(f=>{for(let k=1;k<f.length-1;k++){const A=w[f[0]],B=w[f[k]],C=w[f[k+1]],c=crs(sub3(B,A),sub3(C,A));if(Math.hypot(...c)<1e-9)continue;const n=nor(c);r.push({v:[A,B,C],pl:{n,w:dot3(n,A)}})}});return r}
function boolOp(kind){const L=[...SO];if(mode!=='obj'||L.length<2||!sel||!SO.has(sel))return toast('Boolean: pilih ≥2 objek (Shift+klik). Objek AKTIF (terakhir dipilih) = yang dilubangi, yang lain = pemotong.');
 const A=sel;let pa=csgPolys(A);const cut=L.filter(o=>o!==A);
 cut.forEach(B=>{const a=new Nd(pa),b=new Nd(csgPolys(B));
  if(kind==='sub'){a.inv();a.clipTo(b);b.clipTo(a);b.inv();b.clipTo(a);b.inv();a.build(b.all());a.inv()}
  else if(kind==='uni'){a.clipTo(b);b.clipTo(a);b.inv();b.clipTo(a);b.inv();a.build(b.all())}
  else{a.inv();b.clipTo(a);b.inv();a.clipTo(b);b.clipTo(a);a.build(b.all());a.inv()}pa=a.all()});
 const mp=new Map,V=[],F=[],key=p=>p.map(x=>Math.round(x*1e4)).join();
 pa.forEach(q=>{const ix=q.v.map(p=>{const k=key(p);if(!mp.has(k)){mp.set(k,V.length);V.push(Wi(A,p))}return mp.get(k)}).filter((x,i,a)=>x!==a[(i+1)%a.length]);if(ix.length>=3&&new Set(ix).size===ix.length)F.push(ix)});
 if(!F.length)return toast('Hasil kosong — objek tidak bersinggungan?');
 A.v=V;A.f=F;A.seams=[];cut.forEach(o=>o.vis=false);SO=new Set([A]);setSel(A);fin('Boolean selesai. Pemotong disembunyikan (klik ◉ di Outliner untuk menampilkan). Hasil terbaik jika kedua objek berupa solid tertutup.')}
MM.bsub=()=>boolOp('sub');MM.buni=()=>boolOp('uni');MM.bint=()=>boolOp('int');
$('#mMesh').querySelector('optgroup[label="Objek"]').insertAdjacentHTML('beforeend','<option value="bsub">Boolean: Lubangi (A − B)</option><option value="buni">Boolean: Gabung (A + B)</option><option value="bint">Boolean: Irisan (A ∩ B)</option>');


/* ======== io ======== */
/* io.js — Impor SVG (bidang datar) + Ekspor OBJ/STL */
/* ---------- Impor SVG → bidang datar ---------- */
function earclip(P){const idx=[...P.keys()],out=[],cr=(a,b,c)=>(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);let g=0;
 while(idx.length>3&&g++<5000){let ok=false;for(let i=0;i<idx.length;i++){const n=idx.length,a=idx[(i+n-1)%n],b=idx[i],c=idx[(i+1)%n];if(cr(P[a],P[b],P[c])<=1e-12)continue;
  if(idx.some(k=>k!==a&&k!==b&&k!==c&&![a,b,c].some(z=>P[z][0]===P[k][0]&&P[z][1]===P[k][1])&&cr(P[a],P[b],P[k])>=0&&cr(P[b],P[c],P[k])>=0&&cr(P[c],P[a],P[k])>=0))continue;out.push([a,b,c]);idx.splice(i,1);ok=true;break}
  if(!ok){for(let i=1;i<idx.length-1;i++)out.push([idx[0],idx[i],idx[i+1]]);return out}}
 if(idx.length===3)out.push([...idx]);return out}
function svgToMesh(txt,name){const host=document.createElement('div');host.style.cssText='position:absolute;left:-9999px;top:0;width:800px;height:800px';host.innerHTML=txt;document.body.append(host);
 const svg=host.querySelector('svg');if(!svg){host.remove();return toast('File SVG tidak valid.')}if(!svg.getAttribute('width'))svg.setAttribute('width',800);if(!svg.getAttribute('height'))svg.setAttribute('height',800);
 const NS='http://www.w3.org/2000/svg',subs=[];
 const sample=(el,closedHint)=>{const len=el.getTotalLength();if(!(len>0))return null;const n=Math.min(120,Math.max(8,Math.ceil(len/6))),m=el.getCTM(),pts=[];
  for(let i=0;i<=n;i++){const p=el.getPointAtLength(len*i/n);pts.push([m.a*p.x+m.c*p.y+m.e,m.b*p.x+m.d*p.y+m.f])}
  return{pts,end:el.getPointAtLength(len),start:el.getPointAtLength(0)}};
 svg.querySelectorAll('path,rect,circle,ellipse,polygon,polyline').forEach(el=>{if(el.closest('defs,clipPath,mask,symbol'))return;
  if(el.tagName!=='path'){const r=sample(el);if(r)subs.push({pts:r.pts,g:el});return}
  const parts=(el.getAttribute('d')||'').match(/[Mm][^Mm]*/g)||[];let cur={x:0,y:0};
  parts.forEach(s=>{let d=s;if(s[0]==='m'){const re=/-?\d*\.?\d+(?:e[-+]?\d+)?/gi,a=re.exec(s),b=re.exec(s);if(a&&b)d='M'+(cur.x+ +a[0])+' '+(cur.y+ +b[0])+s.slice(re.lastIndex)}
   const t=document.createElementNS(NS,'path');t.setAttribute('d',d);el.before(t);const r=sample(t);t.remove();if(!r)return;cur=/z/i.test(s)?r.start:r.end;subs.push({pts:r.pts,g:el})})});
 host.remove();
 const polys=subs.map(s=>Object.assign((p=>p.length>2&&Math.hypot(p[0][0]-p.at(-1)[0],p[0][1]-p.at(-1)[1])<1e-6?p.slice(0,-1):p)(s.pts.filter((q,i,a)=>i===0||Math.hypot(q[0]-a[i-1][0],q[1]-a[i-1][1])>1e-6)),{g:s.g})).filter(p=>p.length>=3);
 if(!polys.length)return toast('Tidak ada bentuk yang bisa dibaca di SVG ini.');
 const all=polys.flat(),mn=[0,1].map(k=>Math.min(...all.map(p=>p[k]))),mx=[0,1].map(k=>Math.max(...all.map(p=>p[k]))),sc=2/Math.max(mx[0]-mn[0],mx[1]-mn[1],1e-9),V=[],F=[];
 const N=polys.map(p=>Object.assign(p.map(q=>[(q[0]-(mn[0]+mx[0])/2)*sc,(q[1]-(mn[1]+mx[1])/2)*sc],0),{g:p.g})),
  ar=P=>P.reduce((s,a,i)=>{const b=P[(i+1)%P.length];return s+a[0]*b[1]-b[0]*a[1]},0)/2,
  pip=(q,g)=>{let c=false;for(let i=0,j=g.length-1;i<g.length;j=i++){const a=g[i],b=g[j];if((a[1]>q[1])!=(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])c=!c}return c},
  cr=(a,b,c)=>(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]),
  X=(a,b,c,d)=>{const o=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);return o(a,b,c)*o(a,b,d)<0&&o(c,d,a)*o(c,d,b)<0},
  ed=L=>L.map((a,k)=>[a,L[(k+1)%L.length]]),
  par=N.map((p,i)=>{const c=N.map((g,j)=>j!==i&&g.g===p.g&&pip(p[0],g)?j:-1).filter(j=>j>=0).sort((x,y)=>Math.abs(ar(N[x]))-Math.abs(ar(N[y])));return{d:c.length,up:c[0]}});   // ganjil = lubang (even-odd)
 N.forEach((p,i)=>{if(par[i].d%2)return;
  const O=ar(p)<0?p.slice().reverse():p,H=N.filter((_,j)=>par[j].d%2&&par[j].up===i).map(h=>ar(h)>0?h.slice().reverse():h),o=V.length;
  [O,...H].flat().forEach(q=>V.push([q[0],-q[1],0]));   // bidang datar di XZ (y=0), normal menghadap atas
  if(!H.length&&O.every((q,k)=>cr(q,O[(k+1)%O.length],O[(k+2)%O.length])>=-1e-9)){F.push(O.map((_,k)=>o+k).reverse());return}   // cembung tanpa lubang = 1 face utuh
  let id=O.length,Q=O.map((q,k)=>[q[0],q[1],k]);const Hs=H.map(h=>h.map(q=>[q[0],q[1],id++]));
  Hs.sort((a,b)=>Math.max(...b.map(q=>q[0]))-Math.max(...a.map(q=>q[0])));
  while(Hs.length){const h=Hs.shift(),m=h.reduce((b,q,k)=>q[0]>h[b][0]?k:b,0),M=h[m],ce=[...ed(Q),...Hs.flatMap(ed),...ed(h)],   // hubungkan lubang ke tepi luar dengan "jembatan"
   cand=Q.map((q,k)=>[Math.hypot(q[0]-M[0],q[1]-M[1]),k]).sort((a,b)=>a[0]-b[0]),c=(cand.find(([,k])=>!ce.some(([a,b])=>X(M,Q[k],a,b)))||cand[0])[1];
   Q=[...Q.slice(0,c+1),...h.slice(m),...h.slice(0,m),M,Q[c],...Q.slice(c+1)]}
  earclip(Q).forEach(t=>F.push(t.map(k=>o+Q[k][2]).reverse()))});
 const ob=mk('cube');ob.name='SVG '+(name||'').replace(/\.svg$/i,'');ob.v=V;ob.f=F;setP(ob,CUR[0],CUR[1],CUR[2]);setSel(ob);need();toast('SVG diimpor sebagai bidang datar: '+polys.length+' bentuk. Pilih face di mode Edit lalu Extrude (E) untuk menebalkan.')}
function pickSvg(){const i=document.createElement('input');i.type='file';i.accept='.svg,image/svg+xml';i.onchange=()=>{const f=i.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{svgToMesh(r.result,f.name)}catch(_){toast('Gagal membaca SVG.')}};r.readAsText(f)};i.click()}

/* ---------- Ekspor OBJ / STL (koordinat dunia, objek yang terlihat) ---------- */
function exportMesh(kind){const L=objs.filter(o=>o.vis);if(!L.length)return toast('Tidak ada objek untuk diekspor.');let out='';
 if(kind==='obj'){let off=0;out='# HepiLab 3D\n';L.forEach(o=>{out+='o '+o.name.replace(/\s+/g,'_')+'\n';o.v.forEach(p=>out+='v '+W(o,p).map(x=>+x.toFixed(5)).join(' ')+'\n');o.f.forEach(f=>out+='f '+f.map(i=>i+1+off).join(' ')+'\n');off+=o.v.length})}
 else{out='solid hepilab\n';L.forEach(o=>{const w=o.v.map(p=>W(o,p));o.f.forEach(f=>{for(let k=1;k<f.length-1;k++){const A=w[f[0]],B=w[f[k]],C=w[f[k+1]],n=nor(crs(sub3(B,A),sub3(C,A)));
   out+=`facet normal ${n.join(' ')}\n outer loop\n${[A,B,C].map(p=>'  vertex '+p.join(' ')+'\n').join('')} endloop\nendfacet\n`}})});out+='endsolid hepilab\n'}
 HL.download(new Blob([out],{type:'text/plain'}),'hepilab-3d.'+kind);toast('Diekspor: hepilab-3d.'+kind+' ('+L.length+' objek)')}
const _xf=$('#xFile').onchange;$('#xFile').onchange=e=>{const v=e.target.value;if(v==='obj'||v==='stl'||v==='isvg'){e.target.value='';v==='isvg'?pickSvg():exportMesh(v);return}_xf(e)};
syncUI();

/* ======== import obj ======== */
/* Impor OBJ: v / f (n-gon dipertahankan, indeks negatif didukung), beberapa objek (o / g), titik kembar digabung.
   Menu: File → "Impor 3D (.obj)…". File dari aplikasi lain biasanya Y-atas → ditawarkan diputar jadi Z-atas. */
function parseObj(txt){
 const V=[],list=[];let cur=null;const start=n=>{cur={name:n||'OBJ',f:[]};list.push(cur)};
 for(const ln of txt.replace(/\\\r?\n/g,' ').split(/\r?\n/)){const t=ln.trim();if(!t||t[0]==='#')continue;const p=t.split(/\s+/),k=p[0];
  if(k==='v')V.push([0,1,2].map(i=>isFinite(+p[i+1])?+p[i+1]:0));
  else if(k==='o'||k==='g'){const n=p.slice(1).join('_');if(cur&&!cur.f.length)cur.name=n||cur.name;else start(n)}
  else if(k==='f'){if(!cur)start();const ix=p.slice(1).map(s=>{const i=parseInt(s.split('/')[0],10);return i<0?V.length+i:i-1}).filter(i=>i>=0&&i<V.length);if(ix.length>=3)cur.f.push(ix)}}
 return{V,list:list.filter(o=>o.f.length)}}
const bbox3=a=>{const mn=[1/0,1/0,1/0],mx=[-1/0,-1/0,-1/0];a.forEach(p=>{for(let k=0;k<3;k++){if(p[k]<mn[k])mn[k]=p[k];if(p[k]>mx[k])mx[k]=p[k]}});return[mn,mx]};
function importObj(txt,fname){
 const d=parseObj(txt);if(!d.list.length)return toast('OBJ ini tidak berisi face yang bisa dibaca.');
 const nF=d.list.reduce((s,o)=>s+o.f.length,0);
 if(nF>30000&&!confirm('Model besar ('+nF+' face). Bisa berat di HP. Tetap impor?'))return;
 const yup=!/^#\s*HepiLab/i.test(txt)&&confirm('Model dari aplikasi lain biasanya Y-atas.\nOK = putar jadi Z-atas (seperti HepiLab)\nBatal = biarkan apa adanya');
 const tf=p=>yup?[p[0],-p[2],p[1]]:p;
 const parts=d.list.map(o=>{const mp=new Map,v=[],f=[];
  const id=i=>{const p=tf(d.V[i]),k=p.map(x=>Math.round(x*1e5)).join(',');if(!mp.has(k)){mp.set(k,v.length);v.push(p)}return mp.get(k)};   // titik kembar digabung
  o.f.forEach(fi=>{const g=fi.map(id).filter((x,i,a)=>x!==a[(i+1)%a.length]);if(g.length>=3&&new Set(g).size===g.length)f.push(g)});
  return{name:o.name,v,f}}).filter(p=>p.f.length);
 if(!parts.length)return toast('Semua face rusak/kosong, tidak ada yang diimpor.');
 const[gmn,gmx]=bbox3(parts.flatMap(p=>p.v)),gc=gmn.map((x,i)=>(x+gmx[i])/2),size=Math.max(...gmx.map((x,i)=>x-gmn[i])),
  k=(size>20||(size>0&&size<.1))?2/size:1;   // terlalu besar / kecil → diskalakan jadi ±2 satuan
 const made=parts.map((p,i)=>{const[mn,mx]=bbox3(p.v),c=mn.map((x,j)=>(x+mx[j])/2),o=mk('cube');
  o.name=(p.name&&p.name!=='OBJ'?p.name:(fname||'OBJ').replace(/\.obj$/i,'')+(parts.length>1?' '+(i+1):'')).slice(0,40);
  o.v=p.v.map(q=>q.map((x,j)=>(x-c[j])*k));o.f=p.f;o.seams=[];
  setP(o,CUR[0]+(c[0]-gc[0])*k,CUR[1]+(c[1]-gc[1])*k,CUR[2]+(c[2]-gc[2])*k);return o});
 mode='obj';SO=new Set(made);setSel(made[made.length-1]);view3('frame');
 fin('OBJ diimpor: '+made.length+' objek · '+made.reduce((s,o)=>s+o.v.length,0)+' vertex · '+made.reduce((s,o)=>s+o.f.length,0)+' face'+(k!==1?' (diskalakan)':'')+(yup?' · diputar ke Z-atas':'')+'.')}
function pickObj(){const i=document.createElement('input');i.type='file';i.accept='.obj,text/plain';
 i.onchange=()=>{const f=i.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{importObj(r.result,f.name);commit3()}catch(_){toast('Gagal membaca OBJ.')}};r.readAsText(f)};i.click()}
$('#xFile').querySelector('[value=obj]').insertAdjacentHTML('beforebegin','<option value="iobj">Impor 3D (.obj)…</option>');
{const _xf2=$('#xFile').onchange;$('#xFile').onchange=e=>{if(e.target.value==='iobj'){e.target.value='';pickObj();return}_xf2(e)}}
syncUI();
