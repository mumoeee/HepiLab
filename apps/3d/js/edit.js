/* edit.js — operasi mesh: fill, extrude, hapus, duplikat, ganti mode. */
/* fill */
function rings(keys){
 const adj={};keys.forEach(k=>{const[a,b]=k.split('_').map(Number);(adj[a]=adj[a]||[]).push(b);(adj[b]=adj[b]||[]).push(a)});
 const seen=new Set,out=[];
 for(const s of Object.keys(adj).map(Number)){if(seen.has(s))continue;
  const r=[s];let prev=null,cur=s,ok=true;seen.add(s);
  for(let g=0;g<9999;g++){if(adj[cur].length!==2){ok=false;break}
   const nx=adj[cur][0]!==prev?adj[cur][0]:adj[cur][1];
   if(nx===s)break;if(seen.has(nx)){ok=false;break}r.push(nx);seen.add(nx);prev=cur;cur=nx}
  if(ok&&r.length>=3)out.push(r)}
 return out}
function angSort(o,vs){
 const P=vs.map(i=>o.v[i]),c=[0,1,2].map(k=>P.reduce((t,p)=>t+p[k],0)/P.length);let n=[0,0,0],m=0;
 P.forEach(a=>P.forEach(b=>{const x=crs(sub3(a,c),sub3(b,c)),l=Math.hypot(...x);if(l>m){m=l;n=x}}));n=nor(n);
 const u=nor(sub3(P[0],c)),w=crs(n,u);
 return vs.map((i,k)=>[i,Math.atan2(dot3(sub3(P[k],c),w),dot3(sub3(P[k],c),u))]).sort((a,b)=>a[1]-b[1]).map(x=>x[0])}
function orient(o,r){
 for(let k=0;k<r.length;k++){const a=r[k],b=r[(k+1)%r.length];
  for(const f of o.f)for(let j=0;j<f.length;j++){const x=f[j],y=f[(j+1)%f.length];
   if(x===a&&y===b)return r.slice().reverse();if(x===b&&y===a)return r}}
 return r}
function fill(){const o=sel;if(mode!=='edit'||!o)return toast('Fill: masuk mode Edit dulu.');
 let rs=sm==='e'&&S.e.size>=3?rings([...S.e]):[];
 if(!rs.length){const vs=[...selV()];if(vs.length<3)return toast('Fill: pilih ≥3 vertex, atau edge yang membentuk lingkaran tertutup.');rs=[angSort(o,vs)]}
 rs.forEach(r=>o.f.push(orient(o,r)));rebuild(o);S={v:new Set,e:new Set,f:new Set};drawEdit();syncUI();toast(rs.length+' face dibuat.')}
function fillHoles(){const o=sel;if(!o)return toast('Pilih objek dulu.');
 const c={};o.f.forEach(f=>f.forEach((a,k)=>{const key=ek(a,f[(k+1)%f.length]);c[key]=(c[key]||0)+1}));
 const rs=rings(Object.keys(c).filter(k=>c[k]===1));if(!rs.length)return toast('Tidak ada lubang tertutup.');
 rs.forEach(r=>o.f.push(orient(o,r)));rebuild(o);drawEdit();syncUI();toast(rs.length+' lubang diisi.')}
/* extrude: vertex / edge / face */
function nrmOf(o,fs){const n=[0,0,0];fs.forEach(f=>f.forEach((a,k)=>{const A=o.v[a],B=o.v[f[(k+1)%f.length]];n[0]+=(A[1]-B[1])*(A[2]+B[2]);n[1]+=(A[2]-B[2])*(A[0]+B[0]);n[2]+=(A[0]-B[0])*(A[1]+B[1])}));const L=Math.hypot(...n)||1;return n.map(x=>x/L*.4)}
function extrude(){
 if(mode!=='edit'||!sel)return toast('Extrude: masuk mode Edit, lalu pilih vertex / edge / face.');
 if(sm==='f'){if(!S.f.size)return toast('Pilih face dulu.');return extrudeF()}
 const o=sel;let eks=[];
 if(sm==='e')eks=[...S.e];
 else{if(!S.v.size)return toast('Pilih vertex dulu.');edges(o).forEach(([a,b,k])=>{if(S.v.has(a)&&S.v.has(b))eks.push(k)})}
 if(!eks.length&&sm==='e')return toast('Pilih edge dulu.');
 const vsel=selV(),d=nrmOf(o,o.f.filter(f=>f.some(v=>vsel.has(v)))),map={};
 const nv=i=>{if(map[i]===undefined){map[i]=o.v.length;o.v.push(o.v[i].map((x,c)=>x+d[c]))}return map[i]};
 if(eks.length)eks.forEach(k=>{const[a,b]=k.split('_').map(Number);let x=a,y=b;
   o.f.forEach(f=>f.forEach((p,j)=>{if(p===a&&f[(j+1)%f.length]===b){x=b;y=a}}));
   o.f.push([x,y,nv(y),nv(x)])});
 else vsel.forEach(v=>{const us=new Set;o.f.forEach(f=>{const j=f.indexOf(v);if(j>=0){us.add(f[(j+1)%f.length]);us.add(f[(j+f.length-1)%f.length])}});const w=nv(v);us.forEach(u=>o.f.push([v,u,w]))});
 rebuild(o);S={v:new Set,e:new Set,f:new Set};
 if(sm==='e')eks.forEach(k=>{const[a,b]=k.split('_').map(Number);S.e.add(ek(map[a],map[b]))});else Object.values(map).forEach(i=>S.v.add(i));
 drawEdit();syncUI();toast('Extrude selesai — geser bebas dengan mouse atau gizmo.')}

/* aksi */
function setSel(o){sel=o;if(!o){mode='obj';SO.clear()}else if(!SO.has(o))SO=new Set([o]);S={v:new Set,e:new Set,f:new Set};drawEdit();syncUI()}
function setMode(m){if(m==='edit'&&!sel)return toast('Pilih objek dulu untuk masuk mode Edit.');mode=m;S={v:new Set,e:new Set,f:new Set};drawEdit();syncUI()}
function setSm(s){sm=s;S={v:new Set,e:new Set,f:new Set};drawEdit();syncUI()}
function add(key){const o=mk(key);setP(o,((objs.length-1)%4)*1.6-2.4,key==='plane'?0:.5,2.2);setSel(o);toast(o.name+' ditambahkan.')}
function compact(o){const used=new Set(o.f.flat()),map={},nv=[];o.v.forEach((p,i)=>{if(used.has(i)){map[i]=nv.length;nv.push(p)}});o.v=nv;o.f=o.f.map(f=>f.map(v=>map[v]))}
function del(){if(!sel)return;if(mode==='obj'){objs=objs.filter(o=>!SO.has(o));SO.clear();setSel(null);return}
 const o=sel,kill=new Set();o.f.forEach((f,i)=>{if(sm==='f'&&S.f.has(i))kill.add(i);if(sm==='v'&&f.some(v=>S.v.has(v)))kill.add(i);if(sm==='e'&&f.some((a,k)=>S.e.has(ek(a,f[(k+1)%f.length]))))kill.add(i)});
 if(!kill.size)return;o.f=o.f.filter((_,i)=>!kill.has(i));if(!o.f.length){objs=objs.filter(x=>x!==o);setSel(null);return toast('Objek kosong, dihapus.')}compact(o);rebuild(o);S={v:new Set,e:new Set,f:new Set};drawEdit();syncUI();toast(kill.size+' face dihapus.')}
function extrudeF(){const o=sel;
 const fs=[...S.f],map={},cnt={},n=[0,0,0];
 fs.forEach(i=>{const f=o.f[i];f.forEach((a,k)=>{const b=f[(k+1)%f.length];cnt[ek(a,b)]=(cnt[ek(a,b)]||0)+1;n[0]+=(o.v[a][1]-o.v[b][1])*(o.v[a][2]+o.v[b][2]);n[1]+=(o.v[a][2]-o.v[b][2])*(o.v[a][0]+o.v[b][0]);n[2]+=(o.v[a][0]-o.v[b][0])*(o.v[a][1]+o.v[b][1])})});
 const L=Math.hypot(...n)||1,d=n.map(x=>x/L*.4);
 new Set(fs.flatMap(i=>o.f[i])).forEach(i=>{map[i]=o.v.length;o.v.push(o.v[i].map((x,c)=>x+d[c]))});
 const side=[];fs.forEach(i=>{const f=o.f[i];f.forEach((a,k)=>{const b=f[(k+1)%f.length];if(cnt[ek(a,b)]===1)side.push([a,b,map[b],map[a]])})});
 fs.forEach(i=>o.f[i]=o.f[i].map(v=>map[v]));o.f.push(...side);rebuild(o);drawEdit();syncUI();toast('Extrude selesai — geser dengan gizmo.')}
function dup(){if(!sel||mode!=='obj')return;const n=[];SO.forEach(s=>{const o=mk('cube',s.color);o.v=JSON.parse(JSON.stringify(s.v));o.f=JSON.parse(JSON.stringify(s.f));o.name=s.name+' salinan';['position','rotation','scale'].forEach(k=>Object.assign(o.mesh[k],s.mesh[k]));o.mesh.position.x+=.7;rebuild(o);n.push(o)});SO=new Set(n);setSel(n[n.length-1])}
