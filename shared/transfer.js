/* transfer.js — jembatan data antar-app lewat localStorage (mis. pola Unfold dari 3D → Vector).
   Pengirim : HL.send('nama', data)  lalu buka app tujuan dengan  ?import=nama
   Penerima : HL.take('nama')  → data (dibaca SEKALI lalu dihapus), atau null bila tidak ada/kedaluwarsa (>10 menit). */
HL.send=(key,data)=>{try{localStorage.setItem('hepilab_xfer',JSON.stringify({key,t:Date.now(),data}));return true}catch(e){return false}};
HL.take=key=>{try{const r=JSON.parse(localStorage.getItem('hepilab_xfer')||'null');localStorage.removeItem('hepilab_xfer');return r&&r.key===key&&Date.now()-r.t<6e5?r.data:null}catch(e){return null}};
