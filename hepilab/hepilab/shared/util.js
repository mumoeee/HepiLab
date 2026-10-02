/* util.js — helper kecil yang dipakai semua app. Dimuat PERTAMA (setelah apps/registry.js). */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const toast=m=>{const e=$('#stm');if(e)e.textContent=m};          // pesan di status bar bawah
const coarse=matchMedia('(pointer:coarse)').matches;               // true di layar sentuh (HP/tablet)

const HL={   // "HepiLab" — kotak peralatan bersama
 download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)},
 pickFile(cb){let i=HL._fi;if(!i){i=HL._fi=document.createElement('input');i.type='file';i.accept='.json,application/json';i.hidden=true;document.body.appendChild(i)}   // buka dialog pilih file .json → cb(teks, namaFile)
  i.onchange=()=>{const f=i.files[0];i.value='';if(!f)return;const r=new FileReader();r.onload=()=>cb(r.result,f.name);r.readAsText(f)};i.click()}
};

addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(b&&e.detail>0)b.blur()});   // tombol tidak "menempel" fokus setelah diklik
