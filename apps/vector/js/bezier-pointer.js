/* bezier-pointer.js — interaksi pointer untuk Bezier: seret handle, pen klik-seret (titik halus),
   node ikut membawa handle-nya, dan klik objek yang tergrup = pilih satu grup.
   Membungkus event pointer dari pointer.js. */
const pd0=svg.onpointerdown,pm0=svg.onpointermove,pu0=svg.onpointerup;
svg.onpointerdown=e=>{const t=e.target,q=t.dataset&&t.dataset.q;
 if(q&&V.tool==='n'&&VP.size===0&&e.button===0){svg.setPointerCapture(e.pointerId);VP.set(e.pointerId,[e.clientX,e.clientY]);dn={x:e.clientX,y:e.clientY};const[i,w]=q.split(':').map(Number);vdr={k:'hd',i,w};return}
 if(VP.size===0&&(V.tool==='v'||V.tool==='n')&&!e.shiftKey){const c=t.closest&&t.closest('[data-id]'),s=c&&byId(+c.dataset.id);if(s&&s.g&&!V.sel.has(s.id))V.sel=new Set(V.sh.filter(x=>x.g===s.g).map(x=>x.id))}
 pd0(e);
 if(V.tool==='p'&&V.pen&&!vdr&&VP.size===1&&e.button===0)vdr={k:'pendrag',s:V.pen,i:V.pen.p.length-2}};
svg.onpointermove=e=>{const d=vdr;
 if(d&&(d.k==='pendrag'||d.k==='hd'||d.k==='node')&&VP.size<2){
  if(VP.has(e.pointerId))VP.set(e.pointerId,[e.clientX,e.clientY]);const p=vpt(e);
  if(d.k==='pendrag'){const s=d.s,P0=s.p[d.i];if(P0){const H=fixH(s);H[d.i]=Math.hypot(p[0]-P0[0],p[1]-P0[1])>4/V.vw.z?{a:[2*P0[0]-p[0],2*P0[1]-p[1]],b:[...p],m:'s'}:null;vr()}}
  else{const s=selS()[0];if(s&&s.p&&s.p[d.i]){
   if(d.k==='hd'){const H=s.h&&s.h[d.i];if(H){const P0=s.p[d.i],k=d.w?'b':'a',o=d.w?'a':'b';H[k]=[...p];
     if(H.m!=='c'){const vx=p[0]-P0[0],vy=p[1]-P0[1],L=Math.hypot(vx,vy)||1,lo=H.m==='y'?L:Math.hypot(H[o][0]-P0[0],H[o][1]-P0[1]);H[o]=[P0[0]-vx/L*lo,P0[1]-vy/L*lo]}
     vr()}}
   else{const o=s.p[d.i];s.p[d.i]=p;const H=s.h&&s.h[d.i];if(H){const mv=q=>[p[0]+q[0]-o[0],p[1]+q[1]-o[1]];s.h[d.i]={a:mv(H.a),b:mv(H.b),m:H.m}}vr()}}}
  return}
 pm0(e)};
svg.onpointerup=svg.onpointercancel=e=>{pu0(e);grpExpand()};
