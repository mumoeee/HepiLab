
/* ======== modal ======== */
/* modal.js — transform langsung ala Blender: G geser · R putar · S skala.
   Gerakkan mouse · X/Y/Z kunci sumbu (tekan lagi = lepas) · ketik angka · Enter / klik kiri = OK · Esc / klik kanan = batal.
   Dipanggil dari core.js (mdKey) dan memakai snap dari view.js. */
let LM=[0,0];   // posisi mouse terakhir di kanvas
const axisRot=(d,a)=>{const[x,y,z]=nor(d),c=Math.cos(a),s=Math.sin(a),t=1-c;return[[t*x*x+c,t*x*y-s*z,t*x*z+s*y],[t*x*y+s*z,t*y*y+c,t*y*z-s*x],[t*x*z-s*y,t*y*z+s*x,t*z*z+c]]},
 mv3=(R,r)=>R.map(row=>dot3(row,r)),
 eul=R=>{const y=Math.asin(clamp(R[0][2],-1,1));return Math.abs(R[0][2])<.9999999?{x:Math.atan2(-R[1][2],R[2][2]),y,z:Math.atan2(-R[0][1],R[0][0])}:{x:Math.atan2(R[2][1],R[1][1]),y,z:0}},
 nz=x=>Math.abs(x)<.001?(x<0?-.001:.001):x;
function mdStart(k){
 if(mode==='obj'?(!sel||!SO.size):(!sel||!selV().size))return toast(mode==='obj'?'Pilih objek dulu.':'Pilih vertex / edge / face dulu.');
 MD={k,ax:null,num:'',p:pivot(),s:[...LM],txt:'',
  org:mode==='obj'?[...SO].map(o=>({o,P:{...o.mesh.position},R:{...o.mesh.rotation},S:{...o.mesh.scale}})):[...selV()].map(i=>({i,v:[...sel.v[i]]}))};
 mdApply()}
function mdVal(){const M=MD,q=LM,p=M.p,c=scr(p),n=isFinite(parseFloat(M.num))?parseFloat(M.num):null;
 if(M.k==='g'){const ax=M.ax||(n!==null?'x':null);
  if(ax){const d=AXS[ax],b=scr(p.map((x,i)=>x+d[i])),sx=b[0]-c[0],sy=b[1]-c[1];let t=n!==null?n:((q[0]-M.s[0])*sx+(q[1]-M.s[1])*sy)/(sx*sx+sy*sy||1);
   if(n===null&&snapMode==='g'){const st=gridStep();t=Math.round(t/st)*st}M.txt='Geser '+ax.toUpperCase()+' '+t.toFixed(3);return d.map(x=>x*t)}
  const a=rayPlane(rayOf(M.s[0],M.s[1]),p),b=rayPlane(rayOf(q[0],q[1]),p);let w=a&&b?sub3(b,a):[0,0,0];
  if(snapMode!=='off')w=snapAdjust({p0:p},w,q);M.txt='Geser '+w.map(x=>x.toFixed(2)).join(', ');return w}
 if(M.k==='r'){const d=M.ax?AXS[M.ax]:CF;let a;
  if(n!==null)a=n*Math.PI/180;else{let t=Math.atan2(q[1]-c[1],q[0]-c[0])-Math.atan2(M.s[1]-c[1],M.s[0]-c[0]);t=Math.atan2(Math.sin(t),Math.cos(t));a=(dot3(d,CF)>0?1:-1)*t;
   if(snapMode==='g')a=Math.round(a/(Math.PI/36))*Math.PI/36}
  M.txt='Putar '+(M.ax?M.ax.toUpperCase():'tampilan')+' '+(a*180/Math.PI).toFixed(1)+'°';return{d,a}}
 const d0=Math.max(Math.hypot(M.s[0]-c[0],M.s[1]-c[1]),20);let f=n!==null?n:Math.hypot(q[0]-c[0],q[1]-c[1])/d0;
 if(n===null&&snapMode==='g')f=Math.round(f*10)/10;M.txt='Skala '+(M.ax?M.ax.toUpperCase()+' ':'')+f.toFixed(3);return{f,ax:M.ax}}
function mdApply(){const M=MD,v=mdVal(),p=M.p,k=M.k;
 const tr=(r)=>{   // r = posisi relatif pivot (dunia) -> posisi baru relatif pivot
  if(k==='g')return[r[0]+v[0],r[1]+v[1],r[2]+v[2]];
  if(k==='r')return mv3(axisRot(v.d,v.a),r);
  if(v.ax){const d=AXS[v.ax],t=dot3(r,d)*(v.f-1);return r.map((x,i)=>x+d[i]*t)}return r.map(x=>x*v.f)};
 if(mode==='obj')M.org.forEach(({o,P,R,S})=>{const m=o.mesh,n=tr([P.x-p[0],P.y-p[1],P.z-p[2]]);m.position.x=p[0]+n[0];m.position.y=p[1]+n[1];m.position.z=p[2]+n[2];
  if(k==='r')Object.assign(m.rotation,eul(mmul(axisRot(v.d,v.a),rotM(R))));
  else if(k==='s'){if(v.ax)m.scale[v.ax]=nz(S[v.ax]*v.f);else{m.scale.x=nz(S.x*v.f);m.scale.y=nz(S.y*v.f);m.scale.z=nz(S.z*v.f)}}});
 else M.org.forEach(({i,v:v0})=>{const n=tr(sub3(W(sel,v0),p));sel.v[i]=Wi(sel,[p[0]+n[0],p[1]+n[1],p[2]+n[2]])});
 $('#stm').textContent=M.txt+'   ·   X/Y/Z sumbu · ketik angka · Enter/klik = OK · Esc = batal';need();syncProps()}
function mdEnd(ok){if(!MD)return;const M=MD;
 if(!ok)M.org.forEach(a=>{if(mode==='obj'){Object.assign(a.o.mesh.position,a.P);Object.assign(a.o.mesh.rotation,a.R);Object.assign(a.o.mesh.scale,a.S)}else sel.v[a.i]=[...a.v]});
 MD=null;snapPt=null;need();syncProps();$('#stm').textContent=ok?'Selesai.':'Dibatalkan.';if(ok&&typeof commit3==='function')commit3()}
function mdKey(e){const k=e.key,st=()=>{e.preventDefault();e.stopImmediatePropagation()};
 if(k==='Escape'){st();mdEnd(false)}else if(k==='Enter'||k===' '){st();mdEnd(true)}
 else if(/^[xyz]$/i.test(k)&&!e.ctrlKey&&!e.metaKey){st();const a=k.toLowerCase();MD.ax=MD.ax===a?null:a;mdApply()}
 else if(/^[0-9.]$/.test(k)){st();MD.num+=k;mdApply()}
 else if(k==='-'){st();MD.num=MD.num[0]==='-'?MD.num.slice(1):'-'+MD.num;mdApply()}
 else if(k==='Backspace'){st();MD.num=MD.num.slice(0,-1);mdApply()}
 else if(!/^(Shift|Control|Alt|Meta)$/.test(k))st()}   // pintasan lain diblok selama modal
addEventListener('keydown',e=>{if(MD||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return;
 const k={KeyG:'g',KeyR:'r',KeyS:'s'}[e.code];if(k){e.preventDefault();e.stopImmediatePropagation();mdStart(k)}},true);
addEventListener('pointermove',e=>{if(MD&&coarse){if(MD.lx!==undefined&&e.target===cvEl){LM=[LM[0]+e.clientX-MD.lx,LM[1]+e.clientY-MD.ly];MD.lx=e.clientX;MD.ly=e.clientY;mdApply()}return}if(e.target===cvEl||MD)LM=loc(e);if(MD)mdApply()},true);
addEventListener('pointerup',()=>{if(MD)MD.lx=undefined},true);
addEventListener('pointerdown',e=>{if(!MD)return;const onC=e.target===cvEl;
 if(e.button===2&&onC){e.preventDefault();e.stopImmediatePropagation();mdEnd(false)}
 else if(e.button===0){if(onC){e.preventDefault();e.stopImmediatePropagation()}if(coarse){if(onC){MD.lx=e.clientX;MD.ly=e.clientY}}else mdEnd(true)}},true);
