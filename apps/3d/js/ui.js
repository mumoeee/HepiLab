/* ui.js — outliner, panel transform, tombol toolbar. */
/* UI sync */
function outl(){$('#outl').innerHTML=objs.map(o=>`<div class="row${o===sel?' on':''}" data-id="${o.id}"><span class="eye" data-eye="${o.id}">${o.vis?'◉':'○'}</span><span class="sw" style="background:${o.color}"></span>${o.name}</div>`).join('')||'<div class="mu">Belum ada objek</div>'}
$('#outl').onclick=e=>{const ey=e.target.dataset.eye;if(ey){const o=objs.find(x=>x.id==ey);o.vis=!o.vis;need();outl();return}const r=e.target.closest('.row');if(r){const o=objs.find(x=>x.id==r.dataset.id);if(e.shiftKey||e.ctrlKey)selObj(o,true);else{SO=new Set([o]);setSel(o)}}};
function syncProps(){const M=sel&&sel.mesh;$$('#props3 input[data-p]').forEach(i=>{const[g,k]=[i.dataset.p[0],+i.dataset.p[1]],a='xyz'[k];i.disabled=!sel;if(!sel){i.value='';return}
  if(document.activeElement===i)return;i.value=+(g==='p'?M.position[a]:g==='r'?M.rotation[a]*180/Math.PI:M.scale[a]).toFixed(2)});
 if(sel){if(document.activeElement!==$('#oname'))$('#oname').value=sel.name;$('#ocol').value=sel.color;$('#mstat').textContent=`Vertex ${sel.v.length} · Edge ${edges(sel).length} · Face ${sel.f.length}`}else $('#mstat').textContent='Tidak ada objek terpilih'}
$$('#props3 input[data-p]').forEach(i=>i.oninput=()=>{const v=parseFloat(i.value);if(!sel||isNaN(v))return;const g=i.dataset.p[0],a='xyz'[+i.dataset.p[1]],M=sel.mesh;
 if(g==='p')M.position[a]=v;else if(g==='r')M.rotation[a]=v*Math.PI/180;else M.scale[a]=Math.max(.01,v);need()});
$('#oname').oninput=e=>{if(sel){sel.name=e.target.value;outl()}};$('#ocol').oninput=e=>{if(sel){sel.color=e.target.value;need();outl()}};
function syncUI(){$('#mObj').classList.toggle('on',mode==='obj');$('#mEdit').classList.toggle('on',mode==='edit');$('#smg').style.display=mode==='edit'?'flex':'none';
 $$('#smg button').forEach(b=>b.classList.toggle('on',b.dataset.s===sm));$$('#t3 [data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===et()));
 $('#bUnf').textContent=mode==='edit'&&sm==='f'&&S.f.size?`✂ Unfold ${S.f.size} face terpilih`:'✂ Unfold → Pola 2D';tipShape();outl();syncProps()}
$('#bMulti').onclick=()=>{multi=!multi;$('#bMulti').classList.toggle('on',multi)};$('#menu').onclick=()=>$('#w3').classList.toggle('sp');
$('#mObj').onclick=()=>setMode('obj');$('#mEdit').onclick=()=>setMode('edit');
$$('#smg button').forEach(b=>b.onclick=()=>setSm(b.dataset.s));$('#addSel').onchange=e=>{if(e.target.value)add(e.target.value);e.target.value=''};
$$('#t3 [data-t]').forEach(b=>b.onclick=()=>{tool=b.dataset.t;syncUI()});
$('#t3 [data-a=ext]').onclick=extrude;$('#t3 [data-a=fill]').onclick=fill;$('#t3 [data-a=fillh]').onclick=fillHoles;$('#bBox').onclick=()=>{boxSel=!boxSel;$('#bBox').classList.toggle('on',boxSel)};$('#snapSel').onchange=e=>{snapMode=e.target.value};$('#t3 [data-a=del]').onclick=del;$('#t3 [data-a=dup]').onclick=dup;
