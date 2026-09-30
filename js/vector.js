/* vector.js — Workspace Vector (SVG): shape, layer, tool (pen/node/dll), panel stroke-fill, alignment. */
/* =============== VECTOR WORKSPACE =============== */
const V={sh:[],ly:[{id:1,n:'Layer 1',v:1,l:0}],act:1,sel:new Set,tool:'v',vw:{x:60,y:40,z:.85},nid:1,sides:6,node:-1,pen:null,st:{fill:'#e6c48a',stroke:'#2a2118',sw:2}};
const svg=$('#vsvg'),VW=$('#vw'),SH=$('#vsh'),UI=$('#vui'),byId=id=>V.sh.find(s=>s.id===id),selS=()=>V.sh.filter(s=>V.sel.has(s.id)),esc=t=>String(t).replace(/[<&>]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
let vdr=null,spc=false,lastP=[0,0],lid=1;
const vpt=e=>{const r=svg.getBoundingClientRect(),g=V.gs||0,k=v=>g?Math.round(v/g)*g:v;return[k((e.clientX-r.left-V.vw.x)/V.vw.z),k((e.clientY-r.top-V.vw.y)/V.vw.z)]};
const vupd=()=>{VW.setAttribute('transform',`translate(${V.vw.x} ${V.vw.y}) scale(${V.vw.z})`);ui()};
function newLayer(n){const id=++lid;V.ly.push({id,n:n||'Layer '+id,v:1,l:0});V.act=id;layers();return id}
function addShape(s){s.id=V.nid++;s.ly=s.ly||V.act;if(s.t==='p'){s.fill=s.fill===undefined?(s.c?(V.st.nf?null:V.st.fill):null):s.fill;s.stroke=s.stroke||V.st.stroke;s.sw=s.sw||V.st.sw}V.sh.push(s);return s}
function bb(s){if(s.t==='text')return[s.x,s.y-s.size,s.x+s.txt.length*s.size*.55,s.y+s.size*.25];const x=s.p.map(a=>a[0]),y=s.p.map(a=>a[1]);return[Math.min(...x),Math.min(...y),Math.max(...x),Math.max(...y)]}
const bbAll=l=>l.map(bb).reduce((a,b)=>[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[2],b[2]),Math.max(a[3],b[3])]);
function xf(s,fn,k=1,r=0){if(s.t==='text'){[s.x,s.y]=fn([s.x,s.y]);s.size*=k;s.rot=(s.rot||0)+r}else s.p=s.p.map(fn)}
const snap=()=>Object.fromEntries(selS().map(s=>[s.id,JSON.stringify(s)]));
function applyS(sn,fn,k,r){for(const id in sn){const s=Object.assign(byId(+id),JSON.parse(sn[id]));xf(s,fn,k,r)}vr()}
function shp(s,lk){const pe=`style="pointer-events:${lk?'none':'all'}"`;
 if(s.t==='text')return`<text data-id="${s.id}" x="${s.x}" y="${s.y}" font-size="${s.size}" font-family="Georgia,serif" transform="rotate(${s.rot||0} ${s.x} ${s.y})" fill="${s.fill||'#222'}" ${pe}>${esc(s.txt)}</text>`;
 return`<path data-id="${s.id}" d="M${s.p.map(a=>a.join(' ')).join('L')}${s.c?'Z':''}" fill="${s.fill||'none'}" stroke="${s.stroke||'none'}" stroke-width="${s.sw}"${s.dash?' stroke-dasharray="8 5"':''} stroke-linejoin="round" ${pe}/>`}
function vr(){$('#vbar').style.display=V.pen?'flex':'none';SH.innerHTML=V.ly.filter(l=>l.v).map(l=>`<g>${V.sh.filter(s=>s.ly===l.id).map(s=>shp(s,l.l)).join('')}</g>`).join('');ui();layers()}
function ui(){let h='';const ss=selS(),z=V.vw.z;
 if(ss.length){const b=bbAll(ss),r=(coarse?18:8)/z,w=1/z;h+=`<rect x="${b[0]}" y="${b[1]}" width="${b[2]-b[0]}" height="${b[3]-b[1]}" fill="none" stroke="#4cc3b3" stroke-width="${w}" stroke-dasharray="${4/z}" pointer-events="none"/>`;
  if(V.tool==='v'){[[b[0],b[1],'tl'],[b[2],b[1],'tr'],[b[0],b[3],'bl'],[b[2],b[3],'br']].forEach(([x,y,k])=>h+=`<rect data-h="${k}" x="${x-r/2}" y="${y-r/2}" width="${r}" height="${r}" fill="#fff" stroke="#4cc3b3" stroke-width="${w}"/>`);
   const cx=(b[0]+b[2])/2;h+=`<line x1="${cx}" y1="${b[1]}" x2="${cx}" y2="${b[1]-(coarse?44:26)/z}" stroke="#4cc3b3" stroke-width="${w}"/><circle data-h="rot" cx="${cx}" cy="${b[1]-(coarse?44:26)/z}" r="${r*.6}" fill="#4cc3b3"/>`}
  if(V.tool==='n'&&ss.length===1&&ss[0].p)ss[0].p.forEach((p,i)=>h+=`<circle data-n="${i}" cx="${p[0]}" cy="${p[1]}" r="${r*.6}" fill="${i===V.node?'#e8a33d':'#fff'}" stroke="#222" stroke-width="${w}"/>`)}
 if(vdr&&vdr.k==='box'&&vdr.q){const a=vdr.p,b=vdr.q;h+=`<rect x="${Math.min(a[0],b[0])}" y="${Math.min(a[1],b[1])}" width="${Math.abs(b[0]-a[0])}" height="${Math.abs(b[1]-a[1])}" fill="rgba(76,195,179,.12)" stroke="#4cc3b3" stroke-width="${1/z}" stroke-dasharray="${4/z}" pointer-events="none"/>`}
 UI.innerHTML=h}
function layers(){$('#lys').innerHTML=[...V.ly].reverse().map(l=>`<div class="row${l.id===V.act?' on':''}" data-l="${l.id}"><span class="eye" data-vis="${l.id}">${l.v?'◉':'○'}</span><span class="eye" data-lk="${l.id}" title="Kunci">${l.l?'🔒':'🔓'}</span>${l.n} <span class="mu">(${V.sh.filter(s=>s.ly===l.id).length})</span></div>`).join('')}
$('#lys').onclick=e=>{const d=e.target.dataset,r=e.target.closest('.row');if(d.vis){const l=V.ly.find(x=>x.id==d.vis);l.v=+!l.v}else if(d.lk){const l=V.ly.find(x=>x.id==d.lk);l.l=+!l.l}else if(r)V.act=+r.dataset.l;vr()};
$('#addL').onclick=()=>{newLayer();vr()};
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
function vtool(t){finishPen();V.tool=t;V.node=-1;$$('#tV [data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===t));svg.style.cursor=t==='v'||t==='n'?'default':'crosshair';ui()}
$$('#tV [data-v]').forEach(b=>b.onclick=()=>vtool(b.dataset.v));
function finishPen(){const s=V.pen;if(!s)return;V.pen=null;s.p.pop();const n=s.p.length;if(n>1&&Math.hypot(s.p[n-1][0]-s.p[n-2][0],s.p[n-1][1]-s.p[n-2][1])<2)s.p.pop();if(s.p.length<2)V.sh=V.sh.filter(x=>x!==s);vr()}
function shapeFrom(t,a,b,s){if(t==='r')s.p=[[a[0],a[1]],[b[0],a[1]],[b[0],b[1]],[a[0],b[1]]];
 if(t==='c'){const rx=Math.abs(b[0]-a[0])/2,ry=Math.abs(b[1]-a[1])/2,cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2;s.p=Array.from({length:32},(_,i)=>[cx+rx*Math.cos(i/32*6.2832),cy+ry*Math.sin(i/32*6.2832)])}
 if(t==='l')s.p=[a,b];if(t==='y'){const r=Math.hypot(b[0]-a[0],b[1]-a[1]),n=V.sides;s.p=Array.from({length:n},(_,i)=>[a[0]+r*Math.cos(i/n*6.2832-1.5708),a[1]+r*Math.sin(i/n*6.2832-1.5708)])}}
const VP=new Map();let vpin=null,dn=null,lt=null;const vpinch=()=>{const[a,b]=[...VP.values()];return{d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,m:[(a[0]+b[0])/2,(a[1]+b[1])/2]}};
svg.onpointerdown=e=>{svg.setPointerCapture(e.pointerId);VP.set(e.pointerId,[e.clientX,e.clientY]);
 if(VP.size===2){if(vdr&&vdr.k==='draw')V.sh=V.sh.filter(x=>x!==vdr.s);vdr=null;const q=vpinch(),r=svg.getBoundingClientRect();vpin={d:q.d,z:V.vw.z,x:V.vw.x,y:V.vw.y,mx:q.m[0]-r.left,my:q.m[1]-r.top};vr();return}
 if(VP.size>2)return;dn={x:e.clientX,y:e.clientY};const p=vpt(e),t=e.target,tl=V.tool,id=+((t.closest&&t.closest('[data-id]')||{dataset:{}}).dataset.id||0);
 if(e.button===1||spc){vdr={k:'pan',x:e.clientX,y:e.clientY};return}
 if(tl==='v'||tl==='n'){const hd=t.dataset&&t.dataset.h,nd=t.dataset&&t.dataset.n;
  if(hd){const sn=snap(),b=bbAll(selS());vdr={k:hd==='rot'?'rot':'sc',h:hd,p,b,s:sn};return}
  if(nd!==undefined){V.node=+nd;vdr={k:'node',i:+nd};ui();return}
  if(id){const s=byId(id);if(e.shiftKey)V.sel.has(id)?V.sel.delete(id):V.sel.add(id);else if(!V.sel.has(id)){V.sel.clear();V.sel.add(id);V.act=s.ly}V.node=-1;vdr={k:'mv',p,s:snap()};vr();props();return}
  if(!e.shiftKey){V.sel.clear();V.node=-1;vr();props()}vdr={k:'box',p,q:p,base:new Set(V.sel)};return}
 if(tl==='t'){const x=prompt('Teks:','HepiLab');if(x){const s=addShape({t:'text',x:p[0],y:p[1],txt:x,size:36,rot:0,fill:V.st.fill});V.sel=new Set([s.id]);vtool('v');vr();props()}return}
 if(tl==='p'){if(!V.pen){const s=addShape({t:'p',p:[p,[...p]],c:0,fill:null});V.pen=s;V.sel=new Set([s.id])}
  else{const s=V.pen,f=s.p[0];if(s.p.length>3&&Math.hypot(p[0]-f[0],p[1]-f[1])<(coarse?26:10)/V.vw.z){s.p.pop();s.c=1;s.fill=V.st.nf?null:V.st.fill;V.pen=null;vtool('v')}else{s.p[s.p.length-1]=[...p];s.p.push([...p])}}vr();return}
 const s=addShape({t:'p',p:[p,p],c:tl!=='l',fill:tl==='l'?null:undefined});V.sel=new Set([s.id]);vdr={k:'draw',s,p}};
svg.onpointermove=e=>{if(VP.has(e.pointerId))VP.set(e.pointerId,[e.clientX,e.clientY]);
 if(vpin&&VP.size>=2){const q=vpinch(),r=svg.getBoundingClientRect(),z=clamp(vpin.z*q.d/vpin.d,.1,12),wx=(vpin.mx-vpin.x)/vpin.z,wy=(vpin.my-vpin.y)/vpin.z;V.vw.x=q.m[0]-r.left-wx*z;V.vw.y=q.m[1]-r.top-wy*z;V.vw.z=z;vupd();return}
 const p=vpt(e);lastP=p;
 if(V.pen&&!vdr){V.pen.p[V.pen.p.length-1]=p;vr();return}if(!vdr)return;const d=vdr;
 if(d.k==='pan'){V.vw.x+=e.clientX-d.x;V.vw.y+=e.clientY-d.y;d.x=e.clientX;d.y=e.clientY;vupd()}
 else if(d.k==='draw'){shapeFrom(V.tool,d.p,p,d.s);vr()}
 else if(d.k==='mv')applyS(d.s,q=>[q[0]+p[0]-d.p[0],q[1]+p[1]-d.p[1]]);
 else if(d.k==='box'){d.q=p;const x0=Math.min(d.p[0],p[0]),x1=Math.max(d.p[0],p[0]),y0=Math.min(d.p[1],p[1]),y1=Math.max(d.p[1],p[1]);
  V.sel=new Set([...d.base,...V.sh.filter(s=>{const l=V.ly.find(l=>l.id===s.ly);if(!l||!l.v||l.l)return false;const b=bb(s);return b[0]<=x1&&b[2]>=x0&&b[1]<=y1&&b[3]>=y0}).map(s=>s.id)]);vr()}
 else if(d.k==='node'){const s=selS()[0];if(s){s.p[d.i]=p;vr()}}
 else if(d.k==='sc'){const b=d.b,h=d.h,ax=h.includes('l')?b[2]:b[0],ay=h[0]==='t'?b[3]:b[1],ox=h.includes('l')?b[0]:b[2],oy=h[0]==='t'?b[1]:b[3];let sx=(p[0]-ax)/((ox-ax)||1),sy=(p[1]-ay)/((oy-ay)||1);if(e.shiftKey)sx=sy=Math.max(sx,sy);
  applyS(d.s,q=>[ax+(q[0]-ax)*sx,ay+(q[1]-ay)*sy],(Math.abs(sx)+Math.abs(sy))/2)}
 else if(d.k==='rot'){const cx=(d.b[0]+d.b[2])/2,cy=(d.b[1]+d.b[3])/2,a=Math.atan2(p[1]-cy,p[0]-cx)-Math.atan2(d.p[1]-cy,d.p[0]-cx),c=Math.cos(a),s=Math.sin(a);
  applyS(d.s,q=>[cx+(q[0]-cx)*c-(q[1]-cy)*s,cy+(q[0]-cx)*s+(q[1]-cy)*c],1,a*180/Math.PI)}};
svg.onpointerup=svg.onpointercancel=e=>{VP.delete(e.pointerId);if(vpin){if(VP.size<2)vpin=null;vdr=null;return}
 if(e.type==='pointerup'&&dn&&Math.hypot(e.clientX-dn.x,e.clientY-dn.y)<8){const n=performance.now();if(lt&&n-lt.t<350&&Math.hypot(e.clientX-lt.x,e.clientY-lt.y)<30){lt=null;dbl(e)}else lt={x:e.clientX,y:e.clientY,t:n}}
 const d=vdr;vdr=null;if(d&&d.k==='draw'){const b=bb(d.s);if(b[2]-b[0]<3&&b[3]-b[1]<3)V.sh=V.sh.filter(x=>x!==d.s);else V.act=d.s.ly;vtool('v')}vr();props()};
function dbl(e){if(V.pen){finishPen();vtool('v');return}
 if(V.tool==='n'){const s=selS()[0];if(!s||!s.p)return;const p=vpt(e),n=s.p.length;let best=null,bd=10/V.vw.z;
  for(let i=0;i<(s.c?n:n-1);i++){const a=s.p[i],b=s.p[(i+1)%n],dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1),0,1),d=Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);if(d<bd){bd=d;best=[i,[a[0]+t*dx,a[1]+t*dy]]}}
  if(best){s.p.splice(best[0]+1,0,best[1]);vr()}}}
svg.onwheel=e=>{e.preventDefault();const r=svg.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,z0=V.vw.z,z=clamp(z0*Math.exp(-e.deltaY*.0012),.1,12);V.vw.x=mx-(mx-V.vw.x)*z/z0;V.vw.y=my-(my-V.vw.y)*z/z0;V.vw.z=z;vupd()};

$('#penOk').onclick=()=>{finishPen();vtool('v')};$('#penNo').onclick=()=>{if(V.pen){V.sh=V.sh.filter(x=>x!==V.pen);V.pen=null;V.sel.clear()}vtool('v');vr();props()};
