/* pointer.js — event pointer: gambar, geser, skala, rotasi, node, pan/zoom. */
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
