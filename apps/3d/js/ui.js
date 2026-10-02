
/* ======== ui ======== */
/* ui.js — outliner, panel transform, tombol toolbar. */
/* UI sync */
function outl(){$('#outl').innerHTML=objs.map(o=>`<div class="row${o===sel?' on':''}" data-id="${o.id}"><span class="eye" data-eye="${o.id}">${o.vis?'◉':'○'}</span><span class="sw" style="background:${o.color}"></span>${o.name}</div>`).join('')||'<div class="mu">Belum ada objek</div>'}
$('#outl').onclick=e=>{const ey=e.target.dataset.eye;if(ey){const o=objs.find(x=>x.id==ey);o.vis=!o.vis;need();outl();return}const r=e.target.closest('.row');if(r){const o=objs.find(x=>x.id==r.dataset.id);if(e.shiftKey||e.ctrlKey)selObj(o,true);else{SO=new Set([o]);setSel(o)}}};
function syncProps(){const M=sel&&sel.mesh;$$('#props3 input[data-p]').forEach(i=>{const[g,k]=[i.dataset.p[0],+i.dataset.p[1]],a='xyz'[k];i.disabled=!sel;if(!sel){i.value='';return}
  if(document.activeElement===i)return;i.value=+(g==='p'?M.position[a]:g==='r'?M.rotation[a]*180/Math.PI:M.scale[a]).toFixed(2)});
 if(sel){if(document.activeElement!==$('#oname'))$('#oname').value=sel.name;$('#ocol').value=sel.color;$('#mstat').textContent=`Vertex ${sel.v.length} · Edge ${edges(sel).length} · Face ${sel.f.length}`}else $('#mstat').textContent='Tidak ada objek terpilih'}
$$('#props3 input[data-p]').forEach(i=>i.oninput=()=>{const v=parseFloat(i.value);if(!sel||isNaN(v))return;const g=i.dataset.p[0],a='xyz'[+i.dataset.p[1]],M=sel.mesh;
 if(g==='p')M.position[a]=v;else if(g==='r')M.rotation[a]=v*Math.PI/180;else M.scale[a]=Math.max(.01,v);need()});
$('#oname').oninput=e=>{if(sel){sel.name=e.target.value;outl()}};$('#ocol').oninput=e=>{if(sel){sel.color=e.target.value;need();outl()}};
function syncUI(){$('#mObj').classList.toggle('on',mode==='obj');$('#mEdit').classList.toggle('on',mode==='edit');$('#smg').style.display=mode==='edit'?'flex':'none';
 $$('#smg button').forEach(b=>b.classList.toggle('on',b.dataset.s===sm));$$('#t3 [data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===et()));
 $('#bUnf').textContent=mode==='edit'&&sm==='f'&&S.f.size?`✂ Unfold ${S.f.size} face terpilih`:'✂ Unfold → Pola 2D';tipShape();outl();syncProps()}
$('#bMulti').onclick=()=>{multi=!multi;$('#bMulti').classList.toggle('on',multi)};$('#menu').onclick=()=>$('#w3').classList.toggle('sp');
$('#mObj').onclick=()=>setMode('obj');$('#mEdit').onclick=()=>setMode('edit');
$$('#smg button').forEach(b=>b.onclick=()=>setSm(b.dataset.s));$('#addSel').onchange=e=>{if(e.target.value)add(e.target.value);e.target.value=''};
$$('#t3 [data-t]').forEach(b=>b.onclick=()=>{tool=b.dataset.t;syncUI()});
$('#t3 [data-a=ext]').onclick=extrude;$('#t3 [data-a=fill]').onclick=fill;$('#t3 [data-a=fillh]').onclick=fillHoles;$('#bBox').onclick=()=>{boxSel=!boxSel;$('#bBox').classList.toggle('on',boxSel)};$('#snapSel').onchange=e=>{snapMode=e.target.value};$('#t3 [data-a=del]').onclick=del;$('#t3 [data-a=dup]').onclick=dup;

/* ======== ui2 ======== */
/* ui2.js — panel kanan bisa dilipat, Shift+A (tambah objek), Home (fokus), Esc menutup hasil Unfold. */
$$('.box h4').forEach(h=>h.onclick=()=>h.parentNode.classList.toggle('cl'));
addEventListener('keydown',e=>{if(MD||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const st=()=>{e.preventDefault();e.stopImmediatePropagation()};
 if(e.shiftKey&&!e.ctrlKey&&!e.metaKey&&e.code==='KeyA'){st();pop.dataset.f='addSel';openPop($('#addSel'),$('#b_addSel'))}
 else if(e.code==='Home'){st();view3('frame')}
 else if(e.key==='Escape'&&!$('#unf').hidden){$('#unf').hidden=true}},true);

/* ======== ui3 ======== */
/* ui3.js — menu ringkas: dropdown header jadi tombol ikon; klik = popover berisi pilihan (grid, bisa scroll). Dimuat setelah mobile.js. */
const POPS=[['addSel','＋','Tambah objek (Shift+A)'],['mMesh','⬡','Alat Mesh'],['xView','👁','Tampilan kamera'],['xFile','💾','File'],['snapSel','','Snap / magnet'],['xShade','','Tampilan (Z)']];
const pop=Object.assign(document.createElement('div'),{id:'pop',hidden:true});document.body.append(pop);
const closePop=()=>{pop.hidden=true};
function openPop(s,b){pop.textContent='';let g=null;
 const grid=l=>{if(l){const h=document.createElement('h5');h.textContent=l;pop.append(h)}g=document.createElement('div');g.className='g';pop.append(g)};
 const item=o=>{if(!o.value||o.disabled||o.hidden)return;const i=document.createElement('button');i.textContent=o.textContent;if(s.value===o.value)i.className='on';
  i.onclick=()=>{closePop();s.value=o.value;s.dispatchEvent(new Event('change'));updPb()};g.append(i)};
 [...s.children].forEach(c=>{if(c.tagName==='OPTGROUP'){if(c.hidden||c.disabled)return;grid(c.label);[...c.children].forEach(item)}else{if(!g)grid();item(c)}});
 pop.hidden=false;const r=b.getBoundingClientRect();
 pop.style.cssText=innerWidth<820?'left:8px;right:8px;top:auto;bottom:calc(16px + env(safe-area-inset-bottom,0px))':`top:${r.bottom+4}px;bottom:auto;right:auto;left:${Math.max(8,Math.min(r.left,innerWidth-pop.offsetWidth-8))}px`}
POPS.forEach(([id,ic,t])=>{const s=$('#'+id),b=document.createElement('button');b.id='b_'+id;b.className='pb';b.title=t;b.textContent=ic;
 b.onclick=()=>{if(!pop.hidden&&pop.dataset.f===id)return closePop();pop.dataset.f=id;openPop(s,b)};s.before(b);s.style.display='none'});
addEventListener('pointerdown',e=>{if(!pop.hidden&&!pop.contains(e.target)&&!e.target.closest('.pb'))closePop()},true);
addEventListener('keydown',e=>{if(e.key==='Escape'&&!pop.hidden)closePop()},true);
let _lb='';function updPb(){const a=$('#snapSel').selectedOptions[0].textContent,b=$('#xShade').selectedOptions[0].textContent[0],k=a+b;if(k===_lb)return;_lb=k;$('#b_snapSel').textContent=a;$('#b_xShade').textContent=b}
const _dU=draw;draw=function(){_dU();updPb()};
/* Unfold ringkas + panel Pintasan terlipat (isi dibungkus agar teks ikut tersembunyi) */
const _su5=syncUI;syncUI=function(){_su5();const n=mode==='edit'&&sm==='f'&&S.f.size;$('#bUnf').textContent=n?`✂ ${n} face`:'✂ Unfold';$('#bUnf').title='Unfold → pola 2D'+(n?` (${n} face terpilih)`:'');updPb()};
{const b=document.querySelector('.side .box.mu'),d=document.createElement('div');while(b.childNodes.length>1)d.append(b.childNodes[1]);b.append(d);b.classList.add('cl')}
syncUI();

/* ---------- HP: ketuk kanvas = tutup panel bawah ---------- */
cvEl.addEventListener('pointerdown',()=>$('#w3').classList.remove('sp'));
