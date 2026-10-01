/* main.js — pintasan keyboard dasar + inisialisasi awal. Dimuat TERAKHIR.
   (Ctrl+Z, Ctrl+G, S, U, panah ada di controls.js.) */
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'&&e.key!=='Escape')return;const k=e.key.toLowerCase();if((e.ctrlKey||e.metaKey)&&k!=='d'&&k!=='a')return;
 if(e.code==='Space'){spc=true;e.preventDefault()}
 else if('vnrclypt'.includes(k)&&k.length===1&&!e.ctrlKey&&!e.metaKey)vtool(k);
 else if(k==='delete'||k==='backspace'){const s=selS()[0];if(V.tool==='n'&&V.node>=0&&s&&s.p.length>2){s.p.splice(V.node,1);V.node=-1;vr()}else vdel()}
 else if(k==='enter'||k==='escape'){if(V.pen){finishPen();vtool('v')}else{V.sel.clear();vr();props()}}
 else if(k==='a'&&(e.ctrlKey||e.metaKey)){e.preventDefault();V.sel=new Set(V.sh.filter(s=>{const l=V.ly.find(l=>l.id===s.ly);return l&&l.v&&!l.l}).map(s=>s.id));vr();props()}
 else if(k==='d'&&(e.ctrlKey||e.metaKey)){e.preventDefault();vdup()}});
addEventListener('keyup',e=>{if(e.code==='Space')spc=false});
$('#menu').onclick=()=>$('#wV').classList.toggle('sp');

/* Impor data dari app lain (mis. pola Unfold dari 3D) — lihat shared/transfer.js */
function importFromUrl(){const key=new URLSearchParams(location.search).get('import');if(!key)return;
 const d=HL.take(key);history.replaceState(null,'',location.pathname);
 if(!d||!d.layers)return toast('Tidak ada data untuk diimpor.');
 let first;d.layers.forEach(L=>{const id=newLayer(L.name);first=first||id;L.shapes.forEach(s=>addShape({...s,ly:id}))});
 V.act=first;V.sel.clear();vr();props();vcommit();toast('Pola dari 3D berhasil diimpor — sekarang bisa diedit.')}

/* =============== INIT =============== */
(function(){vupd();vtool('v');vr();props();importFromUrl();
 if(coarse)$('#vhint').textContent='2 jari: zoom & geser · seret area kosong: geser · ketuk 2x: selesai pen / tambah node'})();
