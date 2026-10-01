/* core.js — helper khusus app 3D (dimuat setelah shared/util.js, sebelum file lain). */
const ws='3d';                                  // penanda workspace aktif (dipakai beberapa fungsi)
const ek=(a,b)=>a<b?a+'_'+b:b+'_'+a;            // kunci edge yang unik: ek(2,5) === ek(5,2) === '2_5'
let EXD=.4,INS=.3;   // parameter Extrude & Inset (diatur lewat panel operator di blender.js)
/* Transform modal (G/R/S ala Blender) — logikanya ada di modal.js.
   Pencegat tombol ditaruh di sini (file pertama dimuat) supaya jalan SEBELUM pintasan lain saat modal aktif. */
let MD=null;
addEventListener('keydown',e=>{if(MD)mdKey(e)},true);
