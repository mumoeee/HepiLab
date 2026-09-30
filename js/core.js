/* core.js — helper umum + pindah tab (3D <-> Vector). Dimuat PERTAMA. */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const toast=m=>$('#stm').textContent=m,ek=(a,b)=>a<b?a+'_'+b:b+'_'+a;
let ws='3d';
function setWs(w){ws=w;$('#w3').classList.remove('sp');$('#wV').classList.remove('sp');$('#w3').style.display=w==='3d'?'grid':'none';$('#wV').style.display=w==='v'?'grid':'none';$('#tab3').classList.toggle('on',w==='3d');$('#tabV').classList.toggle('on',w==='v');if(w==='3d')rsz();else vr()}
$('#tab3').onclick=()=>setWs('3d');$('#tabV').onclick=()=>setWs('v');
