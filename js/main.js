/* main.js — pintasan keyboard + inisialisasi awal + render loop. Dimuat TERAKHIR. */
/* keyboard */
addEventListener('keydown',e=>{const tg=e.target.tagName;if(tg==='INPUT'&&e.key!=='Escape')return;const k=e.key.toLowerCase();if((e.ctrlKey||e.metaKey)&&!(ws==='v'&&(k==='d'||k==='a')))return;
 if(ws==='3d'){if(k==='tab'){e.preventDefault();setMode(mode==='obj'?'edit':'obj')}
  else if(mode==='edit'&&'123'.includes(k)&&k.length===1)setSm('vef'['123'.indexOf(k)]);
  else if(k==='g'||k==='r'||k==='s'){tool={g:'move',r:'rotate',s:'scale'}[k];syncUI()}
  else if(k==='e')extrude();else if(k==='f'&&e.shiftKey)fillHoles();else if(k==='f')fill();else if(k==='x'||k==='delete')del();else if(k==='d'&&e.shiftKey)dup();
  else if(k==='a'&&mode==='edit'&&sel){const s=S[sm];if(sm==='v')sel.v.forEach((_,i)=>s.add(i));if(sm==='f')sel.f.forEach((_,i)=>s.add(i));if(sm==='e')edges(sel).forEach(x=>s.add(x[2]));drawEdit();syncUI()}}
 else{if(e.code==='Space'){spc=true;e.preventDefault()}
  else if('vnrclypt'.includes(k)&&k.length===1&&!e.ctrlKey&&!e.metaKey)vtool(k);
  else if(k==='delete'||k==='backspace'){const s=selS()[0];if(V.tool==='n'&&V.node>=0&&s&&s.p.length>2){s.p.splice(V.node,1);V.node=-1;vr()}else vdel()}
  else if(k==='enter'||k==='escape'){if(V.pen){finishPen();vtool('v')}else{V.sel.clear();vr();props()}}
  else if(k==='a'&&(e.ctrlKey||e.metaKey)){e.preventDefault();V.sel=new Set(V.sh.filter(s=>{const l=V.ly.find(l=>l.id===s.ly);return l&&l.v&&!l.l}).map(s=>s.id));vr();props()}
  else if(k==='d'&&(e.ctrlKey||e.metaKey)){e.preventDefault();vdup()}}});
addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(b&&e.detail>0)b.blur()});
addEventListener('keyup',e=>{if(e.code==='Space')spc=false});

/* =============== INIT =============== */
(function(){if(!loadAuto()){const a=mk('cube','#d9b382');a.name='Kubus';setP(a,0,.5,0);setSel(a)}cup();histInit();vupd();vtool('v');vr();props();
 if(coarse){$('#h3').textContent='1 jari: orbit / pilih · 2 jari: cubit = zoom, geser = pan · tarik gizmo untuk memindah';$('#vhint').textContent='2 jari: zoom & geser · seret area kosong: geser · ketuk 2x: selesai pen / tambah node'}
 (function loop(){requestAnimationFrame(loop);if(ws==='3d'&&dirty)draw()})()})();
