/* model.js — state V, model shape, layer, render SVG, kotak seleksi. */
const ws='v';  // penanda workspace aktif (dipakai beberapa fungsi lama)
/* =============== VECTOR WORKSPACE =============== */
const V={sh:[],ly:[{id:1,n:'Layer 1',v:1,l:0}],act:1,sel:new Set,tool:'v',vw:{x:60,y:40,z:.85},nid:1,sides:6,node:-1,pen:null,st:{fill:'#e6c48a',stroke:'#2a2118',sw:2}};
const svg=$('#vsvg'),VW=$('#vw'),SH=$('#vsh'),UI=$('#vui'),byId=id=>V.sh.find(s=>s.id===id),selS=()=>V.sh.filter(s=>V.sel.has(s.id)),esc=t=>String(t).replace(/[<&>]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
let vdr=null,spc=false,lastP=[0,0],lid=1;
const vpt=e=>{const r=svg.getBoundingClientRect(),g=V.gs||0,k=x=>g?Math.round(x/g)*g:x;return[k((e.clientX-r.left-V.vw.x)/V.vw.z),k((e.clientY-r.top-V.vw.y)/V.vw.z)]};  // V.gs = ukuran snap grid (0 = off)
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
