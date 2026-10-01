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
