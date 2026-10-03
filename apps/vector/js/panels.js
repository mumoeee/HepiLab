/* panels.js — panel stroke/fill, posisi-ukuran, rotasi, alignment, hapus/duplikat. */
function props(){const ss=selS(),st=ss.find(s=>s.t==='p')||ss[0];if(st){$('#vf').value=st.fill&&st.fill[0]==='#'?st.fill:'#e6c48a';$('#vnf').checked=!st.fill;$('#vstk').value=st.stroke&&st.stroke[0]==='#'?st.stroke:'#2a2118';$('#vsw').value=st.sw||1;$('#vdash').checked=!!st.dash}
 $('#vtxt').style.display=ss.length===1&&ss[0].t==='text'?'grid':'none';if(ss.length===1&&ss[0].t==='text')$('#vtx').value=ss[0].txt;
 if(ss.length){const b=bbAll(ss);[['x',b[0]],['y',b[1]],['w',b[2]-b[0]],['h',b[3]-b[1]]].forEach(([k,v])=>$(`[data-b=${k}]`).value=Math.round(v*10)/10)}else $$('[data-b]').forEach(i=>i.value='')}
function styleSel(){const g={fill:$('#vnf').checked?null:$('#vf').value,stroke:$('#vstk').value,sw:+$('#vsw').value,dash:$('#vdash').checked};Object.assign(V.st,{fill:$('#vf').value,nf:$('#vnf').checked,stroke:g.stroke,sw:g.sw||1});
 selS().forEach(s=>{if(s.t==='text')s.fill=$('#vf').value;else{s.fill=s.c?g.fill:null;s.stroke=g.stroke;s.sw=g.sw;s.dash=g.dash}});vr()}
['vf','vnf','vstk','vsw','vdash'].forEach(i=>$('#'+i).oninput=styleSel);
$('#vsides').oninput=e=>V.sides=clamp(+e.target.value||6,3,20);$('#vtx').oninput=e=>{const s=selS()[0];if(s){s.txt=e.target.value;vr()}};
$$('[data-b]').forEach(i=>i.onchange=()=>{const ss=selS(),v=parseFloat(i.value);if(!ss.length||isNaN(v))return;const b=bbAll(ss),k=i.dataset.b,sx=k==='w'?v/((b[2]-b[0])||1):1,sy=k==='h'?v/((b[3]-b[1])||1):1;
 ss.forEach(s=>xf(s,q=>[k==='x'?q[0]+v-b[0]:b[0]+(q[0]-b[0])*sx,k==='y'?q[1]+v-b[1]:b[1]+(q[1]-b[1])*sy],(sx*sy)));vr();props()});
$$('[data-rot]').forEach(b=>b.onclick=()=>{const ss=selS();if(!ss.length)return;const B=bbAll(ss),cx=(B[0]+B[2])/2,cy=(B[1]+B[3])/2,a=+b.dataset.rot*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 ss.forEach(o=>xf(o,q=>[cx+(q[0]-cx)*c-(q[1]-cy)*s,cy+(q[0]-cx)*s+(q[1]-cy)*c],1,+b.dataset.rot));vr();props()});
$$('[data-al]').forEach(b=>b.onclick=()=>{const ss=selS(),k=b.dataset.al;if(!ss.length)return;const B=ss.length>1?bbAll(ss):[0,0,1000,700];
 ss.forEach(s=>{const c=bb(s);let dx=0,dy=0;if(k==='l')dx=B[0]-c[0];if(k==='r')dx=B[2]-c[2];if(k==='cx')dx=(B[0]+B[2]-c[0]-c[2])/2;if(k==='t')dy=B[1]-c[1];if(k==='b')dy=B[3]-c[3];if(k==='cy')dy=(B[1]+B[3]-c[1]-c[3])/2;xf(s,q=>[q[0]+dx,q[1]+dy])});vr();props()});
function vdel(){const s0=selS()[0];if(V.tool==='n'&&V.node>=0&&s0&&s0.p&&s0.p.length>2){s0.p.splice(V.node,1);V.node=-1;vr();return}V.sh=V.sh.filter(s=>!V.sel.has(s.id));V.sel.clear();vr();props()}
function vdup(){const n=selS().map(s=>{const c=JSON.parse(JSON.stringify(s));c.id=V.nid++;xf(c,q=>[q[0]+20,q[1]+20]);V.sh.push(c);return c.id});V.sel=new Set(n);vr();props()}
$('#vdel').onclick=vdel;$('#vdup').onclick=vdup;
