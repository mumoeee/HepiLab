/* ui.js — kerapian tampilan: perbesar satu panel (2D / 3D), layar penuh browser, bagian panel samping yang bisa dilipat (ingat posisinya), petunjuk yang memudar.
   Hanya menyentuh DOM/CSS; tidak mengubah data. Dimuat sebelum main.js. */
const ICO={
  fit:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>',
  max:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  min:'<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  fs:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'};
const svgI=p=>`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
let MAXP=0,MT=false; // MT = panel sedang mode tab (HP): jangan simpan status buka/tutup bagian // 0 = dua panel · 2 = hanya pola 2D · 3 = hanya model 3D

function setMax(p){MAXP=p===MAXP?0:p;const w=$('#wU');w.classList.toggle('max2',MAXP===2);w.classList.toggle('max3',MAXP===3);
  KEEP2=true;setTimeout(()=>{KEEP2=false},400);   // pertahankan titik tengah & zoom pola 2D (bukan di-"pas"-kan ulang) saat ukuran kanvas berubah
  document.querySelectorAll('.pb [data-a=max]').forEach(b=>{const on=+b.closest('.pb').dataset.p===MAXP;b.innerHTML=svgI(on?ICO.min:ICO.max);b.title=on?'Kembali ke tampilan 2D + 3D (Esc)':'Perbesar panel ini (Esc: kembali)'});
  need2();need3()}
function toggleFs(){if(document.fullscreenElement)document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(()=>toast('Layar penuh tidak didukung browser ini.'))}

[[2,'#v2',()=>fit2()],[3,'#v3',()=>fit3()]].forEach(([p,sel,fit])=>{const cw=document.querySelector(sel+' .cw'),d=document.createElement('div');d.className='pb';d.dataset.p=p;
  d.innerHTML=`<button data-a="fit" title="Pas layar">${svgI(ICO.fit)}</button><button data-a="max" title="Perbesar panel ini (Esc: kembali)">${svgI(ICO.max)}</button>`
    +(document.fullscreenEnabled?`<button data-a="fs" title="Layar penuh browser">${svgI(ICO.fs)}</button>`:'');
  d.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.a;if(a==='fit')fit();else if(a==='max')setMax(p);else toggleFs()});
  cw.appendChild(d)});
addEventListener('keydown',e=>{if(e.key==='Escape'&&MAXP&&!e.defaultPrevented)setMax(0)});

/* Bagian panel samping: buka/tutup diingat antar sesi. */
{const KEY='hepilab_unf_ui';let ui={};try{ui=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}
 document.querySelectorAll('details.box[data-k]').forEach(d=>{const k=d.dataset.k;if(k in ui)d.open=!!ui[k];
   d.addEventListener('toggle',()=>{if(MT)return;ui[k]=d.open;try{localStorage.setItem(KEY,JSON.stringify(ui))}catch(e){}})})}
/* Petunjuk di kanvas memudar setelah disentuh pertama kali. */
document.querySelectorAll('.cw').forEach(cw=>{const l=cw.querySelector('.lab');if(l)cw.addEventListener('pointerdown',()=>l.classList.add('gone'),{once:true})});

/* Penjaga tata letak: fokus input / scrollIntoView pada elemen di luar layar (mis. laci panel) bisa MENGGULIR kontainer overflow:hidden
   → tampilan bergeser, ada ruang kosong, dan tak bisa dikembalikan. Apa pun yang menggulir kontainer utama langsung dikembalikan ke 0. */
{const fix=()=>{for(const el of[$('#wU'),$('#v2'),$('#v3'),document.body,document.documentElement])if(el&&(el.scrollLeft||el.scrollTop)){el.scrollLeft=0;el.scrollTop=0}if(scrollX||scrollY)scrollTo(0,0)};
 document.addEventListener('scroll',e=>{const t=e.target;if(t===document||t===document.body||t.id==='wU'||t.id==='v2'||t.id==='v3'||(t.classList&&t.classList.contains('cw')))fix()},true);
 addEventListener('scroll',fix);document.addEventListener('focusout',()=>setTimeout(fix,60));
 if(window.visualViewport)visualViewport.addEventListener('resize',()=>setTimeout(fix,60))}

/* Bilah alat ringkas: alat utama tetap terlihat, alat jarang-pakai masuk menu ⋯ (tombol aslinya dipindah, jadi semua handler tetap jalan). */
{const tb=document.querySelector('#v2 .tb'),v2=$('#v2'),g=id=>$('#'+id),sep=()=>{const h=document.createElement('hr');h.className='sep';return h},
  more=document.createElement('button'),pop=document.createElement('div');
 more.id='bMore';more.title='Alat lainnya: Seam 3D, Cadangan, Susun, Benahi tab, Halaman';more.setAttribute('aria-haspopup','true');more.setAttribute('aria-expanded','false');more.innerHTML='<i>\u22EF</i><span>Lainnya</span>';
 pop.className='tbm';['bSeam0','bBak','bLay','bTab','bPg'].forEach(id=>pop.appendChild(g(id)));
 tb.replaceChildren(g('bUndo'),g('bRedo'),sep(),g('bAuto'),g('bTabEd'),g('bTxt'),sep(),g('bFit'),more);v2.appendChild(pop);
 const shut=()=>{pop.classList.remove('on');more.setAttribute('aria-expanded','false')},
  open=()=>{pop.classList.add('on');more.setAttribute('aria-expanded','true');
   const a=more.getBoundingClientRect(),r=v2.getBoundingClientRect(),vert=getComputedStyle(tb).flexDirection==='column',pw=pop.offsetWidth,ph=pop.offsetHeight;
   let x=vert?a.right-r.left+4:a.right-r.left-pw,y=vert?a.top-r.top:a.bottom-r.top+4;
   pop.style.left=Math.max(4,Math.min(x,r.width-pw-4))+'px';pop.style.top=Math.max(4,Math.min(y,r.height-ph-4))+'px'};
 more.onclick=e=>{e.stopPropagation();pop.classList.contains('on')?shut():open()};
 pop.addEventListener('click',shut);   // setelah memilih alat, menu menutup
 document.addEventListener('pointerdown',e=>{if(pop.classList.contains('on')&&!pop.contains(e.target)&&!more.contains(e.target))shut()},true);
 addEventListener('keydown',e=>{if(e.key==='Escape'&&pop.classList.contains('on')){e.preventDefault();shut()}})}

/* Panel samping di HP.
   • POTRET: lembar dari bawah dengan TAB (satu bagian tampil), tinggi bisa ditarik (default 54%).
   • LANSKAP: panel DOCK ala Blender — kolom di kanan (bukan menimpa pola), bagian-bagian ringkas yang bisa dilipat, lebar bisa ditarik lewat garis pemisah, 
   • DESKTOP: akordeon biasa. */
{const w=$('#wU'),sd=w.querySelector('.side'),sc=document.createElement('div'),hd=document.createElement('div'),spl=document.createElement('div'),close=()=>w.classList.remove('sp'),
  PQ='(max-width:820px) and (orientation:portrait)',LQ='(orientation:landscape) and (max-height:540px),(orientation:landscape) and (max-width:900px)',
  LBL={model:'Model',size:'Ukuran',tab:'Tab lem',sty:'Gaya',txt:'Teks',rot:'Putar',file:'File',leg:'Legenda'},DEF={model:1,size:1,tab:1,file:1},MK='hepilab_unf_mt',PK='hepilab_unf_pw',
  boxes=[...sd.querySelectorAll('details.box[data-k]')];
 sc.id='scrim';w.appendChild(sc);sc.onclick=close;
 hd.className='sd-h';hd.innerHTML='<div class="r1"><i class="grab"></i><b>Panel</b><span class="btns"><button id="spX" title="Tutup panel" aria-label="Tutup panel">\u2715</button></span></div>'
  +'<div class="sd-t" role="tablist">'+boxes.map(b=>`<button role="tab" data-k="${b.dataset.k}"><span>${LBL[b.dataset.k]||b.dataset.k}</span></button>`).join('')+'</div>';
 sd.prepend(hd);hd.querySelector('#spX').onclick=close;
 let cur='model';try{cur=localStorage.getItem(MK)||cur}catch(e){}
 const pick=k=>{if(!boxes.some(b=>b.dataset.k===k))k=boxes[0].dataset.k;cur=k;try{localStorage.setItem(MK,k)}catch(e){}
   boxes.forEach(b=>{const on=b.dataset.k===k;b.classList.toggle('tabon',on);if(on)b.open=true});
   hd.querySelectorAll('.sd-t button').forEach(t=>{const on=t.dataset.k===k;t.classList.toggle('on',on);t.setAttribute('aria-selected',on)});sd.scrollTop=0};
 hd.querySelector('.sd-t').addEventListener('click',e=>{const b=e.target.closest('button');if(b)pick(b.dataset.k)});
 /* Lanskap: garis pemisah di tepi kiri panel — tarik untuk mengubah lebar (sampai hampir selebar layar), ketuk 2× untuk kembali ke lebar awal. */
 const PW0=()=>Math.round(clamp(innerWidth*.36,200,260));   // lebar awal menyesuaikan layar (HP kecil → panel lebih ramping)
 let PW=PW0();try{PW=+localStorage.getItem(PK)||PW}catch(e){}
 const setPW=v=>{PW=clamp(v,180,Math.max(200,w.clientWidth-60));w.style.setProperty('--pw',PW+'px')},savePW=()=>{try{localStorage.setItem(PK,String(Math.round(PW)))}catch(e){}};
 spl.id='spl';spl.title='Tarik: ubah lebar panel · ketuk 2×: lebar awal';w.appendChild(spl);
 let sx=null;spl.addEventListener('pointerdown',e=>{sx={x:e.clientX,p:PW};spl.setPointerCapture(e.pointerId);spl.classList.add('on');e.preventDefault()});
 spl.addEventListener('pointermove',e=>{if(sx)setPW(sx.p+(sx.x-e.clientX))});
 const spEnd=()=>{if(sx){sx=null;spl.classList.remove('on');savePW()}};spl.addEventListener('pointerup',spEnd);spl.addEventListener('pointercancel',spEnd);
 spl.addEventListener('dblclick',()=>{setPW(PW0());savePW()});
 /* Potret: tarik judul = ubah tinggi lembar (default 54%, sampai 92%, ke bawah banyak = tutup; ketuk = bolak-balik penuh/default). */
 const r1=hd.querySelector('.r1'),pm=matchMedia(PQ),lq=matchMedia(LQ);let dg=null;
 r1.addEventListener('pointerdown',e=>{if(!pm.matches||e.target.closest('#spX'))return;dg={y:e.clientY,h:sd.offsetHeight,mv:false,cur:null};r1.setPointerCapture(e.pointerId)});
 r1.addEventListener('pointermove',e=>{if(!dg)return;const dy=e.clientY-dg.y;if(Math.abs(dy)>5)dg.mv=true;
  if(dg.mv){const H=w.clientHeight;dg.cur=clamp(dg.h-dy,H*.15,H*.92);w.style.setProperty('--sh',dg.cur+'px')}});
 r1.addEventListener('pointerup',()=>{if(!dg)return;const d=dg,H=w.clientHeight;dg=null;
  if(!d.mv){const full=w.style.getPropertyValue('--sh')!=='';full?w.style.removeProperty('--sh'):w.style.setProperty('--sh',H*.9+'px');return}
  if(d.cur!==null&&d.cur<H*.28)close()});
 r1.addEventListener('pointercancel',()=>{dg=null});
 {let was=false;new MutationObserver(()=>{const on=w.classList.contains('sp');if(on&&!was)w.style.removeProperty('--sh');was=on}).observe(w,{attributes:true,attributeFilter:['class']})}
 const mode=()=>{const P=pm.matches,D=lq.matches;w.classList.toggle('dk',D);
  if(P){MT=true;w.classList.add('mt');pick(cur)}
  else{w.classList.remove('mt');let ui={};try{ui=JSON.parse(localStorage.getItem('hepilab_unf_ui')||'{}')||{}}catch(e){}
   boxes.forEach(b=>{b.classList.remove('tabon');b.open=b.dataset.k in ui?!!ui[b.dataset.k]:!!DEF[b.dataset.k]});setTimeout(()=>{MT=false},80)}
  if(D)setPW(PW)};
 [pm,lq].forEach(m=>m.addEventListener?m.addEventListener('change',mode):m.addListener(mode));mode();
 addEventListener('resize',()=>{if(lq.matches)setPW(PW)});
 addEventListener('keydown',e=>{if(e.key!=='Escape'||!w.classList.contains('sp')||e.defaultPrevented)return;close()})}
