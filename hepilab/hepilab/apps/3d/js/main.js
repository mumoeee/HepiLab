
/* ======== main ======== */
/* main.js — pintasan keyboard + inisialisasi awal + render loop. Dimuat TERAKHIR.
   (Ctrl+Z, A / Alt+A ada di extras.js.) */
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'&&e.key!=='Escape')return;if(e.ctrlKey||e.metaKey)return;const k=e.key.toLowerCase();
 if(k==='tab'){e.preventDefault();setMode(mode==='obj'?'edit':'obj')}
 else if(mode==='edit'&&'123'.includes(k)&&k.length===1)setSm('vef'['123'.indexOf(k)]);
 else if(k==='g'||k==='r'||k==='s'){tool={g:'move',r:'rotate',s:'scale'}[k];syncUI()}
 else if(k==='e')extrude();
 else if(k==='f'&&e.shiftKey)fillHoles();else if(k==='f')fill();
 else if(k==='x'||k==='delete')del();
 else if(k==='d'&&e.shiftKey)dup()});

/* =============== INIT =============== */
(function(){
 if(!loadAuto()){const a=mk('cube','#d9b382');a.name='Kubus';setP(a,0,0,.5);setSel(a)}   // proyek terakhir, atau kubus awal
 cup();histInit();
 if(coarse)$('#h3').textContent='1 jari: orbit / pilih · 2 jari: cubit = zoom, geser = pan · tombol G/R/S di toolbar atas';
 (function loop(){requestAnimationFrame(loop);if(dirty)draw()})()})();
