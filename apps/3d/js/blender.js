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
 $$('#t3 [data-a=ext],#t3 [data-a=fill],#t3 [data-a=fillh]').forEach(b=>b.style.display=ed?'':'none');$('#t3 [data-a=dup]').style.display=ed?'none':'';
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
  if(h)c=E.map((x,i)=>x+D[i]*h.t);else if(Math.abs(D[1])>1e-6){const t=-E[1]/D[1];if(t>0)c=E.map((x,i)=>x+D[i]*t)}
  if(c){CUR.splice(0,3,...c);need();toast('Kursor 3D dipindah.')}return}_pd(e)};
const _add1=add;add=function(k){_add1(k);if(sel){setP(sel,CUR[0],CUR[1]+(k==='plane'?0:.5),CUR[2]);need();syncProps()}};
MM.curSel=()=>{if(!sel)return toast('Pilih objek dulu.');CUR.splice(0,3,...pivot());fin('Kursor 3D ke posisi terpilih.')};
MM.curOrg=()=>{CUR.fill(0);fin('Kursor 3D ke pusat.')};
MM.orgCur=()=>{const L=mode==='obj'?[...SO]:sel?[sel]:[];if(!L.length)return toast('Pilih objek dulu.');L.forEach(o=>{const c=Wi(o,CUR);o.v=o.v.map(p=>sub3(p,c));setP(o,...CUR)});fin('Origin dipindah ke Kursor 3D.')};
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.shiftKey&&e.code==='KeyC'){CUR.fill(0);fin('Kursor 3D ke pusat.')}});
syncUI();
