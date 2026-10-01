/* core.js — helper khusus app 3D (dimuat setelah shared/util.js, sebelum file lain). */
const ws='3d';                                  // penanda workspace aktif (dipakai beberapa fungsi)
const ek=(a,b)=>a<b?a+'_'+b:b+'_'+a;            // kunci edge yang unik: ek(2,5) === ek(5,2) === '2_5'
