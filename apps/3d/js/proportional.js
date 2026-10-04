/* proportional.js — Proportional Editing (O) ala Blender, di mode Edit.
   Titik terpilih bergerak penuh, titik di sekitarnya ikut dengan bobot menurun menurut jarak (falloff).
   Berlaku untuk G/R/S (modal), seret langsung di viewport, dan seret gizmo Move.
   Radius: scroll / PageUp-PageDown (desktop) atau tombol ◎− ◎+ di bar sentuh saat G/R/S aktif. Shift+O / tombol "Falloff" = ganti jenis falloff.
   Dimuat setelah workflow.js, sebelum main.js. Hook ke modal.js: peOrg(), peInit(), peW(). */
const PE={on:false,r:0,fo:'smooth'},PEF=['smooth','sphere','root','sharp','linear','konstan'],
 PEN={smooth:'Smooth',sphere:'Sphere',root:'Root',sharp:'Sharp',linear:'Linear',konstan:'Konstan'};
function peW(d,r,fo){if(d<=0)return 1;if(d>=r)return 0;const t=1-d/r;
 switch(fo){case'sphere':return Math.sqrt(2*t-t*t);case'root':return Math.sqrt(t);case'sharp':return t*t;case'linear':return t;case'konstan':return 1;default:return t*t*(3-2*t)}}
/* radius awal otomatis = ¼ diagonal mesh (dunia); sesudahnya mengikuti yang terakhir dipakai */
function peRadius(){if(PE.r>0)return PE.r;const o=sel,lv=liveVs(o),mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
 o.v.forEach((p,i)=>{if(lv&&!lv.has(i))return;const w=W(o,p);for(let k=0;k<3;k++){if(w[k]<mn[k])mn[k]=w[k];if(w[k]>mx[k])mx[k]=w[k]}});
 PE.r=Math.max(.05,Math.hypot(mx[0]-mn[0],mx[1]-mn[1],mx[2]-mn[2])*.25);return PE.r}
/* semua vertex yang kelihatan + jarak dunia ke vertex terpilih terdekat (0 = terpilih). Mesh sangat besar: pakai jarak ke pivot saja */
function peOrg(){if(!PE.on||mode!=='edit'||!sel)return null;const o=sel,sv=selV(),lv=liveVs(o),sw=[...sv].map(i=>W(o,o.v[i]));if(!sw.length)return null;
 const N=o.v.length,big=sw.length*N>3e6,c=pivot(),out=[];
 for(let i=0;i<N;i++){if(lv&&!lv.has(i))continue;const v=[...o.v[i]];let d=0;
  if(!sv.has(i)){const w=W(o,v);if(big)d=Math.hypot(w[0]-c[0],w[1]-c[1],w[2]-c[2]);
   else{d=Infinity;for(const s of sw){const x=w[0]-s[0],y=w[1]-s[1],z=w[2]-s[2],q=x*x+y*y+z*z;if(q<d)d=q}d=Math.sqrt(d)}}
  out.push({i,v,d})}
 return out}
function peInit(M){if(PE.on&&mode==='edit'&&M.org.length&&M.org[0].d!==undefined)M.pe={r:peRadius(),fo:PE.fo}}
function peScale(f){if(!MD||!MD.pe)return;MD.pe.r=clamp(MD.pe.r*f,.01,1000);PE.r=MD.pe.r;mdApply()}
function peCycle(){PE.fo=PEF[(PEF.indexOf(PE.fo)+1)%PEF.length];if(MD&&MD.pe){MD.pe.fo=PE.fo;mdApply()}peUI();toast('Falloff: '+PEN[PE.fo])}
const peUI=()=>$$('#t3 [data-a=pe]').forEach(b=>{b.classList.toggle('on',PE.on);b.title='Proporsional (O): '+(PE.on?'nyala · '+PEN[PE.fo]:'mati')+' — Shift+O ganti falloff'});
function peToggle(){if(mode!=='edit')return toast('Proporsional: masuk mode Edit dulu (Tab).');PE.on=!PE.on;peUI();
 toast(PE.on?'Proporsional nyala · '+PEN[PE.fo]+'. Saat G/R/S: scroll / PgUp-PgDn / tombol ◎− ◎+ = radius.':'Proporsional mati.')}
MM.pe=peToggle;MM.pef=peCycle;

/* ---------- Seret langsung di viewport & gizmo Move ---------- */
{const _fs=freeStart;freeStart=function(q){const d=_fs(q);if(d&&mode==='edit'&&PE.on){const all=peOrg();if(all)d.pe={r:peRadius(),fo:PE.fo,all,sel:new Set(d.org.map(x=>x[0]))}}return d}}
{const _fm=freeMove;freeMove=function(d,q){_fm(d,q);if(!d.pe||mode!=='edit'||!d.org.length)return;
 const[i0,p0]=d.org[0],dl=sel.v[i0].map((x,k)=>x-p0[k]);
 d.pe.all.forEach(({i,v,d:dist})=>{if(d.pe.sel.has(i))return;const w=peW(dist,d.pe.r,d.pe.fo);sel.v[i]=w>0?v.map((x,k)=>x+dl[k]*w):[...v]});need()}}
{const _g=gzDrag;gzDrag=function(dx,dy){
 if(!(PE.on&&mode==='edit'&&et()==='move'&&dr&&'xyz'.includes(dr.a)&&sel))return _g(dx,dy);
 if(!dr.pe){const all=peOrg();dr.pe=all?{r:peRadius(),fo:PE.fo,all,sel:selV()}:{all:null}}
 if(!dr.pe.all)return _g(dx,dy);
 const sv=dr.pe.sel,i0=[...sv][0],b=[...sel.v[i0]];_g(dx,dy);const dl=sel.v[i0].map((x,k)=>x-b[k]);
 dr.pe.all.forEach(({i,d:dist})=>{if(sv.has(i))return;const w=peW(dist,dr.pe.r,dr.pe.fo);if(w>0){const p=sel.v[i];p[0]+=dl[0]*w;p[1]+=dl[1]*w;p[2]+=dl[2]*w}});need()}}

/* ---------- Lingkaran radius saat G/R/S ---------- */
{const _d=draw;draw=function(){_d();if(MD&&MD.pe&&mode==='edit'&&toC(MD.p)[2]>=NEAR){const c=scr(MD.p),e=scr([0,1,2].map(k=>MD.p[k]+CR[k]*MD.pe.r)),r=Math.hypot(e[0]-c[0],e[1]-c[1]);
 g2.save();g2.strokeStyle='rgba(255,255,255,.7)';g2.lineWidth=1.2;g2.setLineDash([6,5]);g2.beginPath();g2.arc(c[0],c[1],r,0,6.283);g2.stroke();g2.restore()}}}

/* ---------- Kontrol: scroll, PgUp/PgDn (di modal.js), tombol sentuh, tombol O ---------- */
addEventListener('wheel',e=>{if(MD&&MD.pe&&e.target===cvEl){e.preventDefault();e.stopImmediatePropagation();peScale(e.deltaY<0?1.1:1/1.1)}},{capture:true,passive:false});
$('#mb2 [data-ax=n]').insertAdjacentHTML('afterend','<button data-pe="-" style="display:none" title="Radius lebih kecil">◎−</button><button data-pe="+" style="display:none" title="Radius lebih besar">◎+</button><button data-pe="f" style="display:none" title="Ganti falloff">Falloff</button>');
$('#mbar').addEventListener('click',e=>{const b=e.target.closest('[data-pe]');if(!b||!MD||!MD.pe)return;const t=b.dataset.pe;t==='f'?peCycle():peScale(t==='+'?1.2:1/1.2)});
{const _s=mdStart;mdStart=function(k){_s(k);const on=!!(MD&&MD.pe);$$('#mb2 [data-pe]').forEach(b=>b.style.display=on?'':'none')}}
{const _e=mdEnd;mdEnd=function(ok){const M=MD;_e(ok);if(M&&M.pe)PE.r=M.pe.r}}
$('#t3 [data-a=exti]').insertAdjacentHTML('afterend','<button data-a="pe" title="Proporsional (O)">◎</button>');$('#t3 [data-a=pe]').onclick=peToggle;peUI();
{const m=$('#mMesh');m.querySelector('optgroup[label="Mode Edit"]').insertAdjacentHTML('beforeend','<option value="pe">Proporsional editing (O)</option><option value="pef">Proporsional: ganti falloff (Shift+O)</option>')}
addEventListener('keydown',e=>{if(MD||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey||e.code!=='KeyO')return;
 e.preventDefault();e.stopImmediatePropagation();e.shiftKey?(PE.on?peCycle():peToggle()):peToggle()},true);
syncUI();
