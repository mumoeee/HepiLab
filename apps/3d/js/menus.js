/* menus.js — menu header ala Blender: File · View · Select · Add · Mesh/Object (daftar rapat + pintasan di kanan, centang, geser antar-menu saat hover,
   panah ↑↓ Enter Esc). Shift+A membuka menu Add di posisi kursor. Segmen shading (Wire/Solid/X-ray/Render) di kanan header.
   Isi menu dibaca dari <select> tersembunyi (#addSel, #mMesh, #xFile, #snapSel, #xShade) → semua handler lama tetap dipakai.
   Dimuat setelah touch.js, sebelum main.js. */
(()=>{
const SC=/^((Ctrl|Alt|Shift)\+)*(Numpad )?[A-Za-z0-9]$|^Home$|^Tab$/;   // isi kurung yang dianggap pintasan
const parse=(o,s)=>{let t=o.textContent.trim(),k='';const m=t.match(/\s*\(([^)]*)\)\s*$/);if(m&&SC.test(m[1])){k=m[1];t=t.slice(0,m.index)}return{v:o.value,t,k,s}};
const fire=(s,v)=>{const e=$('#'+s);e.value=v;e.dispatchEvent(new Event('change'))};
const fromSel=(id,o={})=>{const s=$('#'+id),out=[],add=x=>{if(!x.value||x.disabled||x.hidden)return;const p=parse(x,id);out.push(o.map?Object.assign(p,o.map(p)):p)};
 [...s.children].forEach(c=>{if(c.tagName!=='OPTGROUP')return add(c);if(c.hidden||c.disabled||(o.skip||[]).includes(c.label))return;
  if(out.length)out.push({sep:1});out.push({h:c.label});[...c.children].forEach(add)});return out};
const groups=(id,gs)=>{const s=$('#'+id),out=[],known=gs.flat();
 gs.forEach(g=>{const it=g.map(v=>s.querySelector(`option[value="${v}"]`)).filter(Boolean).map(x=>parse(x,id));if(it.length){if(out.length)out.push({sep:1});out.push(...it)}});
 const rest=[...s.options].filter(x=>x.value&&!known.includes(x.value)).map(x=>parse(x,id));if(rest.length)out.push({sep:1},...rest);return out};

/* ---------- Isi menu ---------- */
const AI={plane:'▱',cube:'◻',cyl:'⬭',cone:'△',pyr:'▲',sphere:'●',torus:'◎',circle:'○',lsphere:'⬢',head:'☺',male:'♂',female:'♀'},AO=Object.keys(AI),SHO=['w','s','x','r'];
const safe=f=>{try{return f()}catch(e){return null}};
const vw=()=>{const cur=safe(viewName)||'',O=!!safe(()=>ORTHO),I=(v,t,k)=>({v,t,k,fn:()=>view3(v),chk:v===cur});
 return[I('frame','Fokus ke objek','Home'),{sep:1},{h:'Sudut pandang'},I('front','Depan','Numpad 1'),I('back','Belakang','Ctrl+Numpad 1'),I('right','Kanan','Numpad 3'),I('left','Kiri','Ctrl+Numpad 3'),I('top','Atas','Numpad 7'),I('bottom','Bawah','Ctrl+Numpad 7'),
  {sep:1},{h:'Proyeksi'},{v:'persp',t:'Perspektif',chk:!O,fn:()=>{if(O)view3('ortho')}},{v:'ortho',t:'Ortografik',k:'Numpad 5',chk:O,fn:()=>{if(!O)view3('ortho')}},
  {sep:1},{v:'reset',t:'Kembali ke sudut awal',fn:()=>view3('persp')},
  {sep:1},{h:'Overlay'},{t:'Garis topologi (Edit)',chk:!!safe(()=>wireEd),fn:()=>toggleWire()}]};
const sl=()=>[{t:'Pilih semua',k:'A',fn:()=>$('#t3 [data-x=all]').click()},{t:'Kosongkan pilihan',k:'Alt+A',fn:()=>$('#t3 [data-x=none]').click()},{sep:1},
 {t:'Balik pilihan',k:'Ctrl+I',fn:()=>MM.inv()},{t:'Perluas pilihan',fn:()=>MM.grow()},{t:'Pilih terhubung',k:'L',fn:()=>MM.link()},{sep:1},
 {t:'Seleksi kotak',chk:!!safe(()=>boxSel),fn:()=>$('#bBox').click()}];
const MN={
 xFile:()=>groups('xFile',[['save','open','new'],['isvg','iobj'],['obj','stl']]),
 xView:vw,sel:sl,
 addSel:()=>[{h:'Mesh'},...fromSel('addSel',{map:p=>({ic:AI[p.v]||''})}).sort((a,b)=>AO.indexOf(a.v)-AO.indexOf(b.v))],
 mMesh:()=>fromSel('mMesh',{skip:['Seleksi']}),
 snapSel:()=>fromSel('snapSel',{map:p=>({t:{off:'Tanpa snap',v:'Vertex',e:'Edge',ve:'Vertex + Edge',g:'Grid'}[p.v]||p.t,chk:$('#snapSel').value===p.v})}),
 xShade:()=>fromSel('xShade',{map:p=>({t:{s:'Solid',w:'Wireframe',x:'X-ray',r:'Render'}[p.v]||p.t,ic:'',chk:$('#xShade').value===p.v})}).sort((a,b)=>SHO.indexOf(a.v)-SHO.indexOf(b.v))};
const KEYS=['xFile','xView','sel','addSel','mMesh','snapSel','xShade'],BT=k=>$('#b_'+k);

/* ---------- Tombol header: urutan File · View · Select · Add · Mesh ---------- */
{const b=document.createElement('button');b.id='b_sel';b.className='pb';b.title='Select';$('#vh .vs').after(b)}
$('#vh .vs').after(...['xFile','xView','sel','addSel','mMesh'].map(BT));
const SH=[['w','▦','Wireframe'],['s','◼','Solid'],['x','◩','X-ray'],['r','●','Render (tanpa garis)']],shg=document.createElement('div');
shg.className='grp shg';shg.innerHTML=SH.map(([v,i,t])=>`<button data-sh="${v}" title="${t} (Z)">${i}</button>`).join('');
shg.onclick=e=>{const b=e.target.closest('button');if(b)setShade(b.dataset.sh)};
BT('snapSel').before($('#bOrtho'),shg);
const LB={xFile:['File','💾'],xView:['View','👁'],sel:['Select','☑'],addSel:['Add','＋'],mMesh:['Mesh','⬡']};
const lab=()=>Object.entries(LB).forEach(([k,[d]])=>{const t=k==='mMesh'?(mode==='edit'?'Mesh':'Object'):d,b=BT(k);if(b.textContent!==t)b.textContent=t});
let _sn='',_sh='',_md='';
updPb=function(){const a=$('#snapSel').selectedOptions[0].textContent;if(a!==_sn){_sn=a;BT('snapSel').textContent=a}
 if(shade!==_sh){_sh=shade;BT('xShade').textContent={s:'Solid',w:'Wire',x:'X-ray',r:'Render'}[shade];shg.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.sh===shade))}
 if(mode!==_md){_md=mode;lab()}};
lab();updPb();

/* ---------- Menu ---------- */
const el=Object.assign(document.createElement('div'),{id:'bm',hidden:true});el.setAttribute('role','menu');document.body.append(el);
let cur=null,hl=-1,items=[],MP=[innerWidth/2,innerHeight/2];
const setHl=i=>{hl=i;el.querySelectorAll('.bi').forEach(n=>n.classList.toggle('hl',+n.dataset.i===i))};
const run=it=>{close();it.fn?it.fn():fire(it.s,it.v);updPb()};
function close(){if(!cur)return;el.hidden=true;if(cur.btn)cur.btn.classList.remove('mo');cur=null}
function open(k,btn,at){close();items=MN[k]();el.textContent='';
 items.forEach((it,i)=>{const n=document.createElement('div');
  if(it.sep)n.className='bs';else if(it.h){n.className='bh';n.textContent=it.h}
  else{n.className='bi';n.dataset.i=i;n.setAttribute('role','menuitem');n.innerHTML='<span class="ic"></span><span class="tx"></span><span class="ks"></span>';
   n.children[0].textContent=it.chk?'✓':it.ic||'';n.children[1].textContent=it.t;n.children[2].textContent=it.k||''}
  el.append(n)});
 el.hidden=false;el.style.cssText='left:0;top:0;max-height:none';
 const w=el.offsetWidth,r=btn&&btn.getBoundingClientRect();let x=at?at[0]:r.left,y=at?at[1]:r.bottom+2;
 x=Math.max(4,Math.min(x,innerWidth-w-4));let mh=innerHeight-y-8;if(mh<220){y=Math.max(4,innerHeight-228);mh=innerHeight-y-8}
 el.style.cssText=`left:${x}px;top:${y}px;max-height:${mh}px`;
 cur={k,btn:at?null:btn};if(cur.btn)cur.btn.classList.add('mo');setHl(-1)}
el.addEventListener('click',e=>{const n=e.target.closest('.bi');if(n)run(items[+n.dataset.i])});
el.addEventListener('pointermove',e=>{const n=e.target.closest('.bi');if(n)setHl(+n.dataset.i)});
el.addEventListener('pointerleave',()=>setHl(-1));
KEYS.forEach(k=>{const b=BT(k);b.dataset.mn=k;
 b.onclick=e=>{e.stopPropagation();cur&&cur.k===k?close():open(k,b)};
 b.addEventListener('pointerenter',e=>{if(cur&&cur.k!==k&&e.pointerType==='mouse')open(k,b)})});   // menu terbuka: hover tombol lain = pindah menu

/* Shift+A (dan semua pemanggil openPop lama): di posisi kursor bila kursor ada di viewport, kalau tidak di bawah tombolnya */
openPop=function(s,b){const k=KEYS.find(k=>k!=='sel'&&$('#'+k)===s)||KEYS.find(k=>BT(k)===b),vr=$('#vp').getBoundingClientRect(),
 kb=window.event&&window.event.type==='keydown',inV=MP[0]>=vr.left&&MP[0]<=vr.right&&MP[1]>=vr.top&&MP[1]<=vr.bottom;
 open(k,b,kb&&inV?MP:null)};
addEventListener('pointermove',e=>{MP=[e.clientX,e.clientY]},true);
addEventListener('pointerdown',e=>{if(!cur||el.contains(e.target)||e.target.closest('[data-mn]'))return;close();if(e.target===cvEl){e.stopPropagation();e.preventDefault()}},true);
addEventListener('resize',close);
addEventListener('keydown',e=>{if(!cur)return;const st=()=>{e.preventDefault();e.stopImmediatePropagation()},ok=items.map((it,i)=>it.sep||it.h?-1:i).filter(i=>i>=0);
 if(e.key==='Escape'){st();close()}
 else if(e.key==='ArrowDown'||e.key==='ArrowUp'){st();const p=ok.indexOf(hl),n=e.key==='ArrowDown'?(p+1)%ok.length:(p<=0?ok.length-1:p-1);setHl(ok[n]);const t=el.querySelector(`.bi[data-i="${ok[n]}"]`);t&&t.scrollIntoView({block:'nearest'})}
 else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){st();const hdr=KEYS.filter(k=>!['snapSel','xShade'].includes(k)),i=hdr.indexOf(cur.k);if(i>=0){const k=hdr[(i+(e.key==='ArrowRight'?1:hdr.length-1))%hdr.length];open(k,BT(k))}}
 else if((e.key==='Enter'||e.key===' ')&&hl>=0){st();run(items[hl])}
 else if(!/^(Shift|Control|Alt|Meta)$/.test(e.key))close()},true);
})();
