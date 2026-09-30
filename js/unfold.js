/* unfold.js — ubah mesh 3D jadi pola 2D (potong/lipat), modal hasil, dan tombol 'Kirim ke Vector Workspace'. */
/* =============== UNFOLD =============== */
let UF=null;
function unfold(){const o=sel;if(!o)return toast('Pilih objek dulu, lalu klik Unfold.');
 const F=mode==='edit'&&sm==='f'&&S.f.size?[...S.f]:o.f.map((_,i)=>i);
 const P=o.v.map(p=>new T.Vector3(...p).applyM(o)),em={};
 F.forEach(i=>{const f=o.f[i];f.forEach((a,k)=>{const key=ek(a,f[(k+1)%f.length]);(em[key]=em[key]||[]).push(i)})});
 const pl={},isl=[],fold=new Set(),poly=i=>o.f[i].map(v=>pl[i].c[v]);
 const inP=(q,g)=>{let c=false;for(let i=0,j=g.length-1;i<g.length;j=i++){const a=g[i],b=g[j];if((a[1]>q[1])!=(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
 const cen=g=>[g.reduce((s,a)=>s+a[0],0)/g.length,g.reduce((s,a)=>s+a[1],0)/g.length];
 const smp=g=>{const c=cen(g);return[c,...g.map(a=>[c[0]+(a[0]-c[0])*.85,c[1]+(a[1]-c[1])*.85])]};
 const hit=(g,h)=>smp(g).some(q=>inP(q,h))||smp(h).some(q=>inP(q,g));
 for(const r of F){if(pl[r])continue;
  const f=o.f[r],n=new T.Vector3();f.forEach((a,k)=>n.add(new T.Vector3().crossVectors(P[a],P[f[(k+1)%f.length]])));n.normalize();
  const u=P[f[1]].clone().sub(P[f[0]]).normalize(),w=new T.Vector3().crossVectors(n,u),c={};
  f.forEach(v=>{const d=P[v].clone().sub(P[f[0]]);c[v]=[d.dot(u),d.dot(w)]});
  const id=isl.length;isl.push([r]);pl[r]={c};const q=[r];
  while(q.length){const pI=q.shift(),pf=o.f[pI];
   pf.forEach((a,k)=>{const b=pf[(k+1)%pf.length],ci=em[ek(a,b)].find(x=>x!==pI);if(ci===undefined||pl[ci]||(o.seams||[]).includes(ek(a,b)))return;
    const cf=o.f[ci],A=pl[pI].c[a],B=pl[pI].c[b],e=P[b].clone().sub(P[a]),eh=e.clone().normalize();
    let ux=B[0]-A[0],uy=B[1]-A[1];const ul=Math.hypot(ux,uy);ux/=ul;uy/=ul;const nx=-uy,ny=ux,pc=cen(poly(pI)),s=Math.sign((pc[0]-A[0])*nx+(pc[1]-A[1])*ny)||1,cc={};
    cf.forEach(v=>{const rr=P[v].clone().sub(P[a]),al=rr.dot(eh),pv=rr.sub(eh.clone().multiplyScalar(al)).length();cc[v]=[A[0]+ux*al-s*nx*pv,A[1]+uy*al-s*ny*pv]});
    const g=cf.map(v=>cc[v]);if(isl[id].some(j=>hit(g,poly(j))))return;
    pl[ci]={c:cc};isl[id].push(ci);q.push(ci);fold.add(ek(a,b))})}}
 let X=0,Y=0,rh=0;const out=[];
 isl.forEach(list=>{const pts=list.flatMap(poly),x0=Math.min(...pts.map(a=>a[0])),y0=Math.min(...pts.map(a=>a[1])),w=Math.max(...pts.map(a=>a[0]))-x0,h=Math.max(...pts.map(a=>a[1]))-y0;
  if(X>0&&X+w>12){X=0;Y+=rh+.6;rh=0}out.push(list.map(i=>({f:o.f[i],pts:poly(i).map(a=>[a[0]-x0+X,a[1]-y0+Y])})));X+=w+.6;rh=Math.max(rh,h)});
 UF={out,fold};const all=out.flat().flatMap(x=>x.pts),mx=Math.max(...all.map(a=>a[0])),my=Math.max(...all.map(a=>a[1]));
 let body='',lines='';out.flat().forEach(({f,pts})=>{body+=`<polygon points="${pts.join(' ')}" fill="#e6c48a"/>`;
  f.forEach((a,k)=>{const b=(k+1)%f.length,isF=fold.has(ek(a,f[b]));lines+=`<line x1="${pts[k][0]}" y1="${pts[k][1]}" x2="${pts[b][0]}" y2="${pts[b][1]}" stroke="${isF?'#e0457b':'#2a2118'}" stroke-width="${isF?.035:.05}" ${isF?'stroke-dasharray=".14 .09"':''} stroke-linecap="round"/>`})});
 $('#usvg').setAttribute('viewBox',`-.5 -.5 ${mx+1} ${my+1}`);$('#usvg').innerHTML=body+lines;
 $('#ustat').textContent=`${out.length} bagian · ${out.flat().length} sisi · ${fold.size} lipatan`;$('#unf').hidden=false}
$('#bUnf').onclick=unfold;$('#uClose').onclick=()=>$('#unf').hidden=true;
$('#uSend').onclick=()=>{const l1=newLayer('Pola Unfold'),l2=newLayer('Garis lipat'),K=60;
 UF.out.flat().forEach(({f,pts})=>{const P=pts.map(a=>[a[0]*K+60,a[1]*K+60]);addShape({t:'p',p:P,c:1,fill:'#e6c48a',stroke:'#2a2118',sw:1.5,ly:l1});
  f.forEach((a,k)=>{const b=(k+1)%f.length;if(UF.fold.has(ek(a,f[b])))addShape({t:'p',p:[P[k],P[b]],c:0,fill:null,stroke:'#e0457b',sw:1.5,dash:1,ly:l2})})});
 V.act=l1;V.sel.clear();$('#unf').hidden=true;setWs('v');toast('Pola dikirim ke Vector Workspace — sekarang bisa diedit.')};
