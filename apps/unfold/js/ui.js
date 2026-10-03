/* ui.js — kerapian tampilan: perbesar satu panel (2D / 3D), layar penuh browser, bagian panel samping yang bisa dilipat (ingat posisinya), petunjuk yang memudar.
   Hanya menyentuh DOM/CSS; tidak mengubah data. Dimuat sebelum main.js. */
const ICO={
  fit:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>',
  max:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  min:'<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  fs:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'};
const svgI=p=>`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
let MAXP=0; // 0 = dua panel · 2 = hanya pola 2D · 3 = hanya model 3D

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
   d.addEventListener('toggle',()=>{ui[k]=d.open;try{localStorage.setItem(KEY,JSON.stringify(ui))}catch(e){}})})}
/* Petunjuk di kanvas memudar setelah disentuh pertama kali. */
document.querySelectorAll('.cw').forEach(cw=>{const l=cw.querySelector('.lab');if(l)cw.addEventListener('pointerdown',()=>l.classList.add('gone'),{once:true})});
