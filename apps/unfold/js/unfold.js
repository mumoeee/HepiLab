/* unfold.js — algoritma: mesh 3D (U) → pola 2D (U.res). Murni data, tidak menyentuh DOM.
   unfold() mengembalikan { pl, iof, isl, fold }:
     pl[fi]  = {indeksTitik:[x,y]}  koordinat LOKAL face (sebelum digeser)
     iof[fi] = nomor island milik face
     isl[i]  = {faces, key, ox, oy, w, h}  ox/oy = geseran island
     fold    = Set edge yang menjadi LIPATAN (edge pohon). Selain itu = potongan (tempat lem/tab nanti). */
const PLACE=new Map; // posisi island buatan pengguna (kunci = nomor face terkecil island)
const inPoly=(q,g)=>{let c=false;for(let i=0,j=g.length-1;i<g.length;j=i++){const a=g[i],b=g[j];if((a[1]>q[1])!=(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
const cen=g=>[g.reduce((s,a)=>s+a[0],0)/g.length,g.reduce((s,a)=>s+a[1],0)/g.length];
const dseg=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,t=l?clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l,0,1):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)};
const cross2=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
const segX=(a,b,c,d)=>cross2(a,b,c)*cross2(a,b,d)<0&&cross2(c,d,a)*cross2(c,d,b)<0; // perpotongan SUNGGUHAN (bersentuhan tidak dihitung)
const shrink=(g,k)=>{const c=cen(g);return g.map(a=>[c[0]+(a[0]-c[0])*k,c[1]+(a[1]-c[1])*k])};
const bbox=g=>g.reduce((b,a)=>[Math.min(b[0],a[0]),Math.min(b[1],a[1]),Math.max(b[2],a[0]),Math.max(b[3],a[1])],[1/0,1/0,-1/0,-1/0]);

/* Dua poligon tumpang tindih? Sedikit dikecilkan agar face bertetangga (berbagi sisi) tidak dianggap bertabrakan. */
function overlap(g,h){
  const a=bbox(g),b=bbox(h);if(a[2]<b[0]||b[2]<a[0]||a[3]<b[1]||b[3]<a[1])return false;
  g=shrink(g,.96);h=shrink(h,.96);
  for(let i=0;i<g.length;i++)for(let j=0;j<h.length;j++)if(segX(g[i],g[(i+1)%g.length],h[j],h[(j+1)%h.length]))return true;
  return inPoly(cen(g),h)||inPoly(cen(h),g)||inPoly(g[0],h)||inPoly(h[0],g)}

function unfold(){
  const{v,f,em,fn}=U,pl=[],isl=[],fold=new Set,iof=new Array(f.length).fill(-1),poly=i=>f[i].map(a=>pl[i][a]);
  for(let r=0;r<f.length;r++){if(pl[r])continue;
    const fc=f[r],A=v[fc[0]],u=nor(sub3(v[fc[1]],A)),w=crs(u,fn[r]),c={}; // w = u×n → pola tampak dari LUAR (tidak terbalik)
    fc.forEach(a=>{const d=sub3(v[a],A);c[a]=[dot3(d,u),dot3(d,w)]});
    const id=isl.length,list=[r],q=[r];pl[r]=c;iof[r]=id;
    while(q.length){const p=q.shift(),pf=f[p];
      pf.forEach((a,k)=>{const b=pf[(k+1)%pf.length],key=ek(a,b),ad=em[key];
        if(ad.length!==2||U.cuts.has(key))return; // potongan / edge tepi / edge >2 face
        const ci=ad[0]===p?ad[1]:ad[0];if(pl[ci])return; // sudah terpasang (siklus) → jadi potongan
        const A2=pl[p][a],B2=pl[p][b];let ux=B2[0]-A2[0],uy=B2[1]-A2[1];const ul=Math.hypot(ux,uy)||1;ux/=ul;uy/=ul;
        const nx=-uy,ny=ux,pc=cen(poly(p)),s=Math.sign((pc[0]-A2[0])*nx+(pc[1]-A2[1])*ny)||1,eh=nor(sub3(v[b],v[a])),cc={};
        f[ci].forEach(x=>{const rr=sub3(v[x],v[a]),al=dot3(rr,eh),pv=Math.hypot(...sub3(rr,eh.map(t=>t*al)));cc[x]=[A2[0]+ux*al-s*nx*pv,A2[1]+uy*al-s*ny*pv]});
        const g=f[ci].map(x=>cc[x]);if(list.some(j=>overlap(g,poly(j))))return; // bertabrakan → face ini jadi island baru
        pl[ci]=cc;iof[ci]=id;list.push(ci);q.push(ci);fold.add(key)})}
    isl.push({faces:list,key:Math.min(...list),ox:0,oy:0,w:0,h:0})}
  const cutNo=new Map;let n=0;for(const k in em)if(em[k].length===2&&!fold.has(k))cutNo.set(k,++n); // nomor pasangan edge tempel
  /* Gunung/lembah: edge lipatan CEMBUNG (face tetangga ada di belakang bidang face ini) = gunung; selain itu lembah. Mengandalkan normal face mengarah keluar. */
  const mtn=new Set;fold.forEach(k=>{const[p,q]=em[k],cq=f[q].reduce((s,a)=>[s[0]+v[a][0],s[1]+v[a][1],s[2]+v[a][2]],[0,0,0]).map(x=>x/f[q].length);
    if(dot3(fn[p],sub3(cq,v[+k.split('_')[0]]))<-1e-9*U.rad)mtn.add(k)});
  const res={pl,iof,isl,fold,cutNo,mtn};layout(res);return res}

/* Tab lem: trapesium di luar edge k pada face ber-poligon P. Dipasang hanya di salah satu sisi pasangan (face ber-indeks lebih kecil). */
function tabPoly(P,k){const a=P[k],b=P[(k+1)%P.length],c=cen(P),dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);if(l<1e-9)return null;
  const ux=dx/l,uy=dy/l;let nx=-uy,ny=ux;if((c[0]-a[0])*nx+(c[1]-a[1])*ny>0){nx=-nx;ny=-ny}
  const d=Math.min(l*.5,U.rad*.15),m=Math.min(l*.22,d);
  return[a,[a[0]+ux*m+nx*d,a[1]+uy*m+ny*d],[b[0]-ux*m+nx*d,b[1]-uy*m+ny*d],b]}
/* Posisi label nomor: sedikit ke dalam face dari tengah edge. */
function lblPos(P,k){const a=P[k],b=P[(k+1)%P.length],c=cen(P),m=[(a[0]+b[0])/2,(a[1]+b[1])/2],d=Math.hypot(c[0]-m[0],c[1]-m[1])||1,t=Math.min(U.rad*.08,d*.4);
  return[m[0]+(c[0]-m[0])/d*t,m[1]+(c[1]-m[1])/d*t]}

/* Tata letak awal: island disusun per baris. Island yang pernah digeser pengguna memakai posisinya sendiri. */
function layout(res){const{pl,isl}=res,gap=U.rad*.15;
  isl.forEach(o=>{const b=bbox(o.faces.flatMap(i=>U.f[i].map(a=>pl[i][a])));o.bx=b[0];o.by=b[1];o.rot=0;o.w=b[2]-b[0];o.h=b[3]-b[1]});
  const area=isl.reduce((s,o)=>s+o.w*o.h,0),maxW=Math.max(Math.sqrt(area)*1.5,...isl.map(o=>o.w));let X=0,Y=0,rh=0;
  [...isl].sort((a,b)=>b.h-a.h).forEach(o=>{const p=PLACE.get(o.key);
    if(p){o.ox=p.ox;o.oy=p.oy;o.rot=p.rot||0;return}
    if(X>0&&X+o.w>maxW){X=0;Y+=rh+gap;rh=0}o.ox=X-o.bx;o.oy=Y-o.by;X+=o.w+gap;rh=Math.max(rh,o.h)})}

/* Auto-potong: pohon rentang maksimum pada graf face (bobot = seberapa datar sudut antar-face).
   Edge di luar pohon → potongan. */
function autoCuts(){const par=U.f.map((_,i)=>i),find=x=>par[x]===x?x:par[x]=find(par[x]),E=[];
  for(const k in U.em){const a=U.em[k];if(a.length===2)E.push([dot3(U.fn[a[0]],U.fn[a[1]]),k,a[0],a[1]])}
  E.sort((x,y)=>y[0]-x[0]);const cuts=new Set;
  for(const[,k,a,b]of E){const ra=find(a),rb=find(b);if(ra===rb)cuts.add(k);else par[ra]=rb}
  U.cuts=cuts}
