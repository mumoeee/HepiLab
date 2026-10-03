/* gesture.js — satu penangan input untuk mouse & layar sentuh, dipakai view2d dan view3d.
   gesture(elemen,{drag(dx,dy,e,dua), zoom(k,x,y), tap(x,y,e)})
   • 1 pointer digeser → drag (e.buttons: 2=klik-kanan, 4=tengah)   • 2 jari → zoom (cubit) + drag(dua=true)
   • scroll mouse → zoom ke arah kursor                              • sentuh singkat tanpa bergeser → tap (Tahap 2: pilih edge/face) */
function gesture(el,o){
 const P=new Map;let mv=0,last=null;
 const pos=e=>{const r=el.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
 const two=()=>{const a=[...P.values()];return a.length>1?{x:(a[0][0]+a[1][0])/2,y:(a[0][1]+a[1][1])/2,d:Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1])}:null};
 el.addEventListener('pointerdown',e=>{el.setPointerCapture(e.pointerId);P.set(e.pointerId,pos(e));mv=0;if(P.size===1&&o.down)o.down(...pos(e),e);last=two();e.preventDefault()});
 el.addEventListener('pointermove',e=>{if(!P.has(e.pointerId))return;const p=pos(e),q=P.get(e.pointerId);P.set(e.pointerId,p);
  if(P.size===1){const dx=p[0]-q[0],dy=p[1]-q[1];mv+=Math.abs(dx)+Math.abs(dy);o.drag&&o.drag(dx,dy,e,false)}
  else{const t=two();mv+=9;if(last&&t){if(o.zoom&&last.d>0)o.zoom(t.d/last.d,t.x,t.y);o.drag&&o.drag(t.x-last.x,t.y-last.y,e,true)}last=t}});
 const up=e=>{if(!P.has(e.pointerId))return;if(P.size===1&&mv<6&&o.tap)o.tap(...pos(e),e);P.delete(e.pointerId);last=two()};
 el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
 el.addEventListener('wheel',e=>{e.preventDefault();const p=pos(e);o.zoom&&o.zoom(Math.exp(-e.deltaY*(e.deltaMode?.05:.0015)),p[0],p[1])},{passive:false});
 el.addEventListener('contextmenu',e=>e.preventDefault())}