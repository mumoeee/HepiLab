/* input.js — ray picking, event pointer (orbit, pan, zoom, pilih), find/pick. */
const rayOf=(x,y)=>nor(CF.map((f,i)=>f+CR[i]*(x-cw/2)/(ch/2)*TF-CU[i]*(y-ch/2)/(ch/2)*TF));
function tri(D,A,B,C){const e1=sub3(B,A),e2=sub3(C,A),p=crs(D,e2),det=dot3(e1,p);if(Math.abs(det)<1e-9)return-1;const iv=1/det,s=sub3(E,A),u=dot3(s,p)*iv;if(u<0||u>1)return-1;const q=crs(s,e1),v=dot3(D,q)*iv;if(v<0||u+v>1)return-1;return dot3(e2,q)*iv}
function hitRay(D,list){let best=null;list.forEach(o=>{const wv=o.v.map(p=>W(o,p));o.f.forEach((f,fi)=>{for(let k=1;k<f.length-1;k++){const t=tri(D,wv[f[0]],wv[f[k]],wv[f[k+1]]);if(t>0&&(!best||t<best.t))best={o,fi,t}}})});return best}
const sp=(o,p)=>scr(W(o,p));
const P=new Map();let dr=null,pin=null;const loc=e=>{const r=cvEl.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
function pan(dx,dy){const s=OB.r*2*TF/ch;OB.t=OB.t.map((v,i)=>v-CR[i]*dx*s+CU[i]*dy*s)}
cvEl.oncontextmenu=e=>e.preventDefault();
cvEl.onpointerdown=e=>{cvEl.setPointerCapture(e.pointerId);const q=loc(e);P.set(e.pointerId,q);
 if(P.size===2){dr=null;const[a,b]=[...P.values()];pin={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,m:[(a[0]+b[0])/2,(a[1]+b[1])/2]};return}if(P.size>2)return;
 if(e.button===2||e.button===1){dr={k:e.shiftKey?'pan':'orb',x:q[0],y:q[1]};return}
 const h=gzHit(q[0],q[1]);if(h){dr={k:'gz',a:h,x:q[0],y:q[1]};return}
 const hit=find(q[0],q[1]);
 if(hit!==null&&et()==='move'){const isSel=mode==='obj'?SO.has(hit):S[sm].has(hit);if(!isSel)applyHit(hit,e.shiftKey||multi);const f=sel&&freeStart(q);if(f){dr=f;return}}
 if(boxSel){dr={k:'box',x:q[0],y:q[1],sx:q[0],sy:q[1],sh:e.shiftKey||multi};return}
 dr={k:'click',x:q[0],y:q[1],sx:q[0],sy:q[1],sh:e.shiftKey}};
cvEl.onpointermove=e=>{if(!P.has(e.pointerId))return;const q=loc(e);P.set(e.pointerId,q);
 if(pin&&P.size===2){const[a,b]=[...P.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1])||1,m=[(a[0]+b[0])/2,(a[1]+b[1])/2];OB.r=clamp(OB.r*pin.d/d,1.5,60);pan(m[0]-pin.m[0],m[1]-pin.m[1]);pin={d,m};cup();return}
 if(!dr)return;if(dr.k==='free'){freeMove(dr,q);return}if(dr.k==='box'){dr.x=q[0];dr.y=q[1];need();return}const dx=q[0]-dr.x,dy=q[1]-dr.y;if(dr.k==='click'&&Math.hypot(q[0]-dr.sx,q[1]-dr.sy)>(coarse?10:4))dr.k='orb';
 if(dr.k==='orb'){OB.th-=dx*.008;OB.ph=clamp(OB.ph-dy*.008,.05,3.09);cup()}else if(dr.k==='pan'){pan(dx,dy);cup()}else if(dr.k==='gz')gzDrag(dx,dy);
 dr.x=q[0];dr.y=q[1]};
cvEl.onpointerup=cvEl.onpointercancel=e=>{const was=dr;P.delete(e.pointerId);if(P.size<2)pin=null;if(e.type==='pointerup'&&was&&was.k==='click'&&P.size===0)pick(loc(e),was.sh||multi);if(was&&was.k==='box')boxPick(was);if(was&&was.k==='free'){snapPt=null;need()}dr=null};
cvEl.onwheel=e=>{e.preventDefault();OB.r=clamp(OB.r*Math.exp(e.deltaY*.001),1.5,60);cup()};
function find(mx,my){const D=rayOf(mx,my);
 if(mode==='obj'){const h=hitRay(D,objs.filter(o=>o.vis));return h?h.o:null}
 const o=sel;let hit=null;
 if(sm==='v'){let b=coarse?28:14;o.v.forEach((p,i)=>{const s=sp(o,p),d=Math.hypot(s[0]-mx,s[1]-my);if(d<b){b=d;hit=i}})}
 else if(sm==='e'){let b=coarse?22:10;edges(o).forEach(([a,c,k])=>{const d=dseg(mx,my,sp(o,o.v[a]),sp(o,o.v[c]));if(d<b){b=d;hit=k}})}
 else{const h=hitRay(D,[o]);if(h)hit=h.fi}
 return hit}
function applyHit(hit,sh){
 if(mode==='obj'){selObj(hit,sh);return}
 const set=S[sm];if(hit===null){if(!sh)set.clear()}else if(sh){set.has(hit)?set.delete(hit):set.add(hit)}else{set.clear();set.add(hit)}
 need();syncUI()}
function pick(q,sh){applyHit(find(q[0],q[1]),sh)}
