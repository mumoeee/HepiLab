/* tools.js — pilih alat, pen, pembuat bentuk dasar. */
function vtool(t){finishPen();V.tool=t;V.node=-1;$$('#tV [data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===t));svg.style.cursor=t==='v'||t==='n'?'default':'crosshair';ui()}
$$('#tV [data-v]').forEach(b=>b.onclick=()=>vtool(b.dataset.v));
function finishPen(){const s=V.pen;if(!s)return;V.pen=null;s.p.pop();const n=s.p.length;if(n>1&&Math.hypot(s.p[n-1][0]-s.p[n-2][0],s.p[n-1][1]-s.p[n-2][1])<2)s.p.pop();if(s.p.length<2)V.sh=V.sh.filter(x=>x!==s);vr()}
function shapeFrom(t,a,b,s){if(t==='r')s.p=[[a[0],a[1]],[b[0],a[1]],[b[0],b[1]],[a[0],b[1]]];
 if(t==='c'){const rx=Math.abs(b[0]-a[0])/2,ry=Math.abs(b[1]-a[1])/2,cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2;s.p=Array.from({length:32},(_,i)=>[cx+rx*Math.cos(i/32*6.2832),cy+ry*Math.sin(i/32*6.2832)])}
 if(t==='l')s.p=[a,b];if(t==='y'){const r=Math.hypot(b[0]-a[0],b[1]-a[1]),n=V.sides;s.p=Array.from({length:n},(_,i)=>[a[0]+r*Math.cos(i/n*6.2832-1.5708),a[1]+r*Math.sin(i/n*6.2832-1.5708)])}}
