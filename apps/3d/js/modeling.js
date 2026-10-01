/* modeling.js — alat modelling ala Blender: Inset, Subdivide, Merge, Mirror, Separate/Join, seleksi lanjutan,
   Apply transform, Origin, mode tampilan (Solid/Wire/X-ray), primitif Bola & Torus. Dimuat setelah extras.js. */
let shade='s';
const clrS=()=>{S={v:new Set,e:new Set,f:new Set}},fin=m=>{need();syncUI();toast(m)};
const needEdit=()=>{if(mode!=='edit'||!sel){toast('Masuk mode Edit dulu (Tab), lalu pilih bagian mesh.');return false}return true};
const cen3=(o,f)=>[0,1,2].map(k=>f.reduce((s,v)=>s+o.v[v][k],0)/f.length);
/* world -> koordinat lokal objek (kebalikan W) */
function Wi(o,w){const M=o.mesh,R=rotM(M.rotation),d=sub3(w,[M.position.x,M.position.y,M.position.z]),s=[M.scale.x,M.scale.y,M.scale.z];return[0,1,2].map(i=>(R[0][i]*d[0]+R[1][i]*d[1]+R[2][i]*d[2])/s[i])}
/* face yang dipilih (face mode) atau yang semua vertex-nya terpilih (vertex/edge mode) */
function selF(){const o=sel,s=new Set;if(sm==='f')S.f.forEach(i=>s.add(i));else{const vs=selV();if(vs.size)o.f.forEach((f,i)=>{if(f.every(v=>vs.has(v)))s.add(i)})}return s}
/* gabungkan vertex (mp: lama->baru), buang face rusak/dobel, lalu rapikan indeks */
function weld(o,mp){const rp=v=>mp[v]===undefined?v:rp(mp[v]);
 o.f=o.f.map(f=>f.map(rp).filter((v,i,a)=>v!==a[(i+1)%a.length])).filter(f=>f.length>=3&&new Set(f).size===f.length);
 const key=f=>[...f].sort((a,b)=>a-b).join(),c={};o.f.forEach(f=>c[key(f)]=(c[key(f)]||0)+1);o.f=o.f.filter(f=>c[key(f)]===1);
 if(!o.f.length){objs=objs.filter(x=>x!==o);setSel(null);return}compact(o)}
function setByV(vs,any){const o=sel;clrS();if(sm==='v')vs.forEach(i=>S.v.add(i));
 if(sm==='e')edges(o).forEach(([a,b,k])=>(any?(vs.has(a)||vs.has(b)):(vs.has(a)&&vs.has(b)))&&S.e.add(k));
 if(sm==='f')o.f.forEach((f,i)=>(any?f.some(v=>vs.has(v)):f.every(v=>vs.has(v)))&&S.f.add(i))}

const MM={
 inset(){if(!needEdit())return;const o=sel,fs=[...selF()];if(!fs.length)return toast('Inset: pilih face dulu.');const t=INS,out=[];
  fs.forEach(i=>{const f=o.f[i],c=cen3(o,f),nw=f.map(v=>{o.v.push(o.v[v].map((x,k)=>x+(c[k]-x)*t));return o.v.length-1});
   f.forEach((a,k)=>{const j=(k+1)%f.length;o.f.push([a,f[j],nw[j],nw[k]])});o.f[i]=nw;out.push(i)});
  clrS();sm='f';S.f=new Set(out);fin('Inset selesai — face tengah bisa digeser / di-extrude.')},
 subdiv(){if(!needEdit())return;const o=sel;let fs=selF();if(!fs.size)fs=new Set(o.f.map((_,i)=>i));const mid={};
  const M=(a,b)=>{const k=ek(a,b);if(mid[k]===undefined){mid[k]=o.v.length;o.v.push(o.v[a].map((x,i)=>(x+o.v[b][i])/2))}return mid[k]};
  fs.forEach(i=>{const f=o.f[i];f.forEach((a,k)=>M(a,f[(k+1)%f.length]))});
  const nf=[],ns=new Set;
  o.f.forEach((f,i)=>{const L=f.length;if(fs.has(i)){const c=o.v.length;o.v.push(cen3(o,f));const m=f.map((a,k)=>mid[ek(a,f[(k+1)%L])]);f.forEach((a,k)=>{ns.add(nf.length);nf.push([a,m[k],c,m[(k+L-1)%L]])})}
   else nf.push(f.flatMap((a,k)=>{const m=mid[ek(a,f[(k+1)%L])];return m===undefined?[a]:[a,m]}))});
  o.f=nf;clrS();sm='f';S.f=ns;fin('Subdivide selesai.')},
 mergec(){if(!needEdit())return;const o=sel,vs=[...selV()];if(vs.length<2)return toast('Merge: pilih ≥2 vertex.');
  const c=[0,1,2].map(k=>vs.reduce((s,v)=>s+o.v[v][k],0)/vs.length),mp={};o.v[vs[0]]=c;vs.slice(1).forEach(v=>mp[v]=vs[0]);weld(o,mp);clrS();fin(vs.length+' vertex digabung di tengah.')},
 merged(){if(!needEdit())return;const o=sel,c=selV().size?[...selV()]:o.v.map((_,i)=>i),mp={};
  for(let j=1;j<c.length;j++)for(let i=0;i<j;i++){if(mp[c[i]]!==undefined)continue;if(Math.hypot(...sub3(o.v[c[i]],o.v[c[j]]))<.001){mp[c[j]]=c[i];break}}
  const n=Object.keys(mp).length;if(!n)return toast('Tidak ada vertex yang berimpit.');weld(o,mp);clrS();fin(n+' vertex berimpit digabung.')},
 flip(){if(!sel)return toast('Pilih objek dulu.');const o=sel;let fs=mode==='edit'?selF():new Set;if(!fs.size)fs=new Set(o.f.map((_,i)=>i));fs.forEach(i=>o.f[i]=o.f[i].slice().reverse());fin('Normal face dibalik ('+fs.size+').')},
 sep(){if(!needEdit())return;const o=sel,fs=selF();if(!fs.size)return toast('Pisahkan: pilih face (atau vertex yang melingkupi face).');if(fs.size===o.f.length)return toast('Semua face terpilih — tidak ada yang dipisah.');
  const used=[...new Set([...fs].flatMap(i=>o.f[i]))],mp={};used.forEach((v,i)=>mp[v]=i);
  const n=mk('cube',o.color);n.name=o.name+' pisah';n.v=used.map(v=>[...o.v[v]]);n.f=[...fs].map(i=>o.f[i].map(v=>mp[v]));['position','rotation','scale'].forEach(k=>Object.assign(n.mesh[k],o.mesh[k]));
  o.f=o.f.filter((_,i)=>!fs.has(i));compact(o);clrS();fin('Dipisah jadi objek baru: '+n.name)},
 mx(){mir('x')},my(){mir('y')},mz(){mir('z')},
 inv(){if(mode==='obj'){SO=new Set(objs.filter(o=>o.vis&&!SO.has(o)));setSel([...SO].pop()||null);return}if(!needEdit())return;const o=sel,s=S[sm],old=new Set(s);s.clear();
  if(sm==='v')o.v.forEach((_,i)=>!old.has(i)&&s.add(i));if(sm==='e')edges(o).forEach(x=>!old.has(x[2])&&s.add(x[2]));if(sm==='f')o.f.forEach((_,i)=>!old.has(i)&&s.add(i));fin('Pilihan dibalik.')},
 grow(){if(!needEdit())return;const o=sel,vs=selV();if(!vs.size)return toast('Pilih sesuatu dulu.');
  if(sm==='v'){const n=new Set(vs);o.f.forEach(f=>f.forEach((v,k)=>{if(vs.has(v)){n.add(f[(k+1)%f.length]);n.add(f[(k+f.length-1)%f.length])}}));setByV(n,false)}else setByV(vs,true);fin('Pilihan diperluas.')},
 link(){if(!needEdit())return;const o=sel,vs=selV();if(!vs.size)return toast('Pilih sesuatu dulu, lalu Pilih terhubung.');let ch=true;
  while(ch){ch=false;o.f.forEach(f=>{if(f.some(v=>vs.has(v)))f.forEach(v=>{if(!vs.has(v)){vs.add(v);ch=true}})})}setByV(vs,false);fin('Pilih terhubung.')},
 join(){const L=[...SO];if(mode!=='obj'||L.length<2)return toast('Gabung: pilih ≥2 objek (Shift+klik, atau tombol ☑).');const b=sel&&SO.has(sel)?sel:L[L.length-1];
  L.forEach(o=>{if(o===b)return;const off=b.v.length;o.v.forEach(p=>b.v.push(Wi(b,W(o,p))));o.f.forEach(f=>b.f.push(f.map(v=>v+off)));
   (o.seams||[]).forEach(k=>{const[x,y]=k.split('_').map(Number);(b.seams=b.seams||[]).push(ek(x+off,y+off))})});
  objs=objs.filter(o=>o===b||!SO.has(o));SO=new Set([b]);setSel(b);fin(L.length+' objek digabung.')},
 apply(){const L=mode==='obj'?[...SO]:sel?[sel]:[];if(!L.length)return toast('Pilih objek dulu.');
  L.forEach(o=>{const p=o.mesh.position,pw=[p.x,p.y,p.z];o.v=o.v.map(v=>sub3(W(o,v),pw));Object.assign(o.mesh.rotation,{x:0,y:0,z:0});Object.assign(o.mesh.scale,{x:1,y:1,z:1})});fin('Rotasi & skala diterapkan (skala jadi 1).')},
 origin(){const L=mode==='obj'?[...SO]:sel?[sel]:[];if(!L.length)return toast('Pilih objek dulu.');
  L.forEach(o=>{const c=[0,1,2].map(k=>(Math.min(...o.v.map(p=>p[k]))+Math.max(...o.v.map(p=>p[k])))/2),pw=W(o,c);o.v=o.v.map(p=>sub3(p,c));setP(o,...pw)});fin('Origin dipindah ke tengah objek.')},
 shade(){setShade({s:'w',w:'x',x:'s'}[shade])}
};
function mir(ax){const o=sel;if(!o)return toast('Pilih objek dulu.');const k='xyz'.indexOf(ax),n0=o.v.length,f0=o.f.length;
 o.v.push(...o.v.slice(0,n0).map(p=>p.map((x,i)=>i===k?-x:x)));o.f.push(...o.f.slice(0,f0).map(f=>f.map(v=>v+n0).reverse()));
 const mp={};for(let v=0;v<n0;v++)if(Math.abs(o.v[v][k])<1e-4)mp[v+n0]=v;weld(o,mp);clrS();fin('Mirror '+ax.toUpperCase()+' (sumbu lokal objek). Vertex di sumbu otomatis menyatu.')}
function setShade(v){shade=v;$('#xShade').value=v;need()}

/* ---------- primitif baru: Bola & Torus (arah face dikoreksi otomatis menghadap keluar) ---------- */
function outward(g,ref){g.f=g.f.map(f=>{const c=[0,1,2].map(k=>f.reduce((s,v)=>s+g.v[v][k],0)/f.length),n=[0,0,0];
 f.forEach((a,k)=>{const A=g.v[a],B=g.v[f[(k+1)%f.length]];n[0]+=(A[1]-B[1])*(A[2]+B[2]);n[1]+=(A[2]-B[2])*(A[0]+B[0]);n[2]+=(A[0]-B[0])*(A[1]+B[1])});
 return dot3(n,sub3(c,ref(c)))<0?f.slice().reverse():f});return g}
GEN.sphere=(n=12,m=8)=>{const v=[[0,.5,0]],f=[],R=(j,i)=>1+(j-1)*n+i%n;
 for(let j=1;j<m;j++){const ph=Math.PI*j/m;for(let i=0;i<n;i++){const th=i/n*6.2832;v.push([.5*Math.sin(ph)*Math.cos(th),.5*Math.cos(ph),.5*Math.sin(ph)*Math.sin(th)])}}v.push([0,-.5,0]);const L=v.length-1;
 for(let i=0;i<n;i++){f.push([0,R(1,i),R(1,i+1)]);f.push([L,R(m-1,i+1),R(m-1,i)]);for(let j=1;j<m-1;j++)f.push([R(j,i),R(j+1,i),R(j+1,i+1),R(j,i+1)])}
 return outward({v,f},()=>[0,0,0])};
GEN.torus=(n=12,m=8)=>{const v=[],f=[],Rr=.35,r=.15;for(let i=0;i<n;i++)for(let j=0;j<m;j++){const t=i/n*6.2832,p=j/m*6.2832;v.push([(Rr+r*Math.cos(p))*Math.cos(t),r*Math.sin(p),(Rr+r*Math.cos(p))*Math.sin(t)])}
 for(let i=0;i<n;i++)for(let j=0;j<m;j++){const i2=(i+1)%n,j2=(j+1)%m;f.push([i*m+j,i2*m+j,i2*m+j2,i*m+j2])}
 return outward({v,f},c=>{const l=Math.hypot(c[0],c[2])||1;return[Rr*c[0]/l,0,Rr*c[2]/l]})};
NAMES.sphere='Bola';NAMES.torus='Torus';

/* ---------- tombol & pintasan ---------- */
$('#mMesh').onchange=e=>{const v=e.target.value;e.target.value='';if(MM[v])MM[v]()};
$('#xShade').onchange=e=>setShade(e.target.value);
const MK={KeyI:'inset',KeyW:'subdiv',KeyM:'mergec',KeyP:'sep',KeyL:'link',KeyZ:'shade'};
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const c=e.ctrlKey||e.metaKey,st=()=>{e.preventDefault();e.stopImmediatePropagation()};
 if(c&&e.code==='KeyI'){st();MM.inv()}else if(c&&e.code==='KeyJ'){st();MM.join()}
 else if(!c&&!e.shiftKey&&!e.altKey&&MK[e.code]){st();MM[MK[e.code]]()}},true);
