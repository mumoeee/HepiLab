/* controls.js — menyambung tombol di index.html ke fungsinya + pintasan keyboard tambahan.
   (Markup tombol ada di index.html; di sini hanya event-nya.) */
$('#tV [data-k=vundo]').onclick=vundo;$('#tV [data-k=vredo]').onclick=vredo;
$('#vxbar').onclick=e=>{const b=e.target.closest('button');if(b)nodeAct(b.dataset.na)};
const _vt0=vtool;vtool=function(t){_vt0(t);$('#vxbar').style.display=V.tool==='n'?'flex':'none'};   // bar node hanya tampil di alat Node

$('#vxFront').onclick=()=>zord(1);$('#vxBack').onclick=()=>zord(0);$('#vxFlipH').onclick=()=>flip(1);$('#vxFlipV').onclick=()=>flip(0);
$('#vxGrp').onclick=group;$('#vxUng').onclick=ungroup;
$('#vxSnap').onchange=e=>V.gs=+e.target.value;$('#vxRad').oninput=e=>V.rad=Math.max(0,+e.target.value||0);
$('#vxSave').onclick=fileSave;$('#vxOpen').onclick=fileOpen;$('#vxSvg').onclick=exportSvg;$('#vxPng').onclick=exportPng;$('#vxNew').onclick=fileNew;

/* Keyboard tambahan (fase capture: jalan lebih dulu dari main.js) */
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const c=e.ctrlKey||e.metaKey,k=e.code,stop=()=>{e.preventDefault();e.stopImmediatePropagation()};
 if(c&&k==='KeyZ'){stop();e.shiftKey?vredo():vundo()}
 else if(c&&k==='KeyY'){stop();vredo()}
 else if(c&&k==='KeyG'){stop();e.shiftKey?ungroup():group()}
 else if(!c&&!e.altKey&&k==='KeyS'){stop();vtool('s')}
 else if(!c&&!e.altKey&&k==='KeyU'){stop();vtool('u')}
 else if(!c&&k.startsWith('Arrow')&&selS().length){stop();const d=e.shiftKey?10:1,dx=k==='ArrowLeft'?-d:k==='ArrowRight'?d:0,dy=k==='ArrowUp'?-d:k==='ArrowDown'?d:0;selS().forEach(s=>xf(s,q=>[q[0]+dx,q[1]+dy]));vr();props()}
 else if((e.key==='Delete'||e.key==='Backspace')&&V.tool==='n'&&V.node>=0){const s=selS()[0];if(s&&s.p&&s.p.length>2){stop();delNode(s,V.node);V.node=-1;vr();props()}}},true);
