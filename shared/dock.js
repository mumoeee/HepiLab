/* dock.js — panel samping ala Blender (dipakai app 3D; Unfold punya versi sendiri di ui.js).
   Dipanggil sekali:  HLDock.init({ws:'#w3', key:'3d', title:'Properti'})
   • Lanskap / desktop → kelas .dk di .ws: panel jadi kolom di kanan (bukan menimpa kanvas), judul + ✕, bagian bisa dilipat, lebar bisa ditarik.
   • Desktop: panel terbuka dari awal. HP: tertutup (buka lewat tombol ☰). Status buka/tutup, lebar, dan bagian terlipat diingat.
   • Potret (HP): tidak disentuh — tetap lembar bawah bawaan base.css.
   Dimuat setelah util.js. Butuh markup: <aside class="side"> berisi <details class="box" data-k="..."> . */
const HLDock={
 init(o){
  const w=$(o.ws),sd=w.querySelector('.side'),K='hepilab_'+o.key+'_',lq=matchMedia('(orientation:landscape)'),
   hd=document.createElement('div'),spl=document.createElement('div'),
   ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(K+k);localStorage.setItem(K+k,v)}catch(e){return null}},
   wide=()=>!coarse&&innerWidth>900&&innerHeight>540;     // desktop / tablet besar

  /* judul panel */
  hd.className='sd-h';hd.innerHTML=`<div class="r1"><b>${o.title||'Panel'}</b><span class="btns"><button id="spX" title="Tutup panel" aria-label="Tutup panel">\u2715</button></span></div>`;
  sd.prepend(hd);hd.querySelector('#spX').onclick=()=>w.classList.remove('sp');

  /* bagian lipat: ingat buka / tutup */
  let ui={};try{ui=JSON.parse(ls('ui')||'{}')||{}}catch(e){}
  sd.querySelectorAll('details.box[data-k]').forEach(d=>{const k=d.dataset.k;if(k in ui)d.open=!!ui[k];
   d.addEventListener('toggle',()=>{ui[k]=d.open;ls('ui',JSON.stringify(ui))})});

  /* lebar panel: tarik garis pemisah, ketuk 2× = lebar awal */
  const PW0=()=>Math.round(clamp(innerWidth*.22,240,300));let PW=+ls('pw')||PW0();
  const setPW=v=>{PW=clamp(v,200,Math.max(220,w.clientWidth-120));w.style.setProperty('--pw',PW+'px')};
  spl.id='spl';spl.title='Tarik: ubah lebar panel · ketuk 2×: lebar awal';w.appendChild(spl);
  let sx=null;
  spl.addEventListener('pointerdown',e=>{sx={x:e.clientX,p:PW};spl.setPointerCapture(e.pointerId);spl.classList.add('on');e.preventDefault()});
  spl.addEventListener('pointermove',e=>{if(sx)setPW(sx.p+(sx.x-e.clientX))});
  const end=()=>{if(sx){sx=null;spl.classList.remove('on');ls('pw',String(Math.round(PW)))}};
  spl.addEventListener('pointerup',end);spl.addEventListener('pointercancel',end);
  spl.addEventListener('dblclick',()=>{setPW(PW0());ls('pw',String(PW))});

  /* mode: dock di lanskap; buka/tutup awal menurut perangkat */
  let was=null;
  const mode=()=>{const D=lq.matches;w.classList.toggle('dk',D);
   if(D!==was){was=D;if(D){setPW(PW);const s=ls('open');w.classList.toggle('sp',wide()?s!=='0':false)}else w.classList.remove('sp')}};
  [lq].forEach(m=>m.addEventListener?m.addEventListener('change',mode):m.addListener(mode));mode();
  addEventListener('resize',()=>{if(lq.matches)setPW(PW)});
  new MutationObserver(()=>{if(w.classList.contains('dk')&&wide())ls('open',w.classList.contains('sp')?'1':'0')}).observe(w,{attributes:true,attributeFilter:['class']});
  return{open:()=>w.classList.add('sp'),close:()=>w.classList.remove('sp'),toggle:()=>w.classList.toggle('sp')}
 }
};
