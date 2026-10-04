/* primitives.js — primitif tambahan + panel opsi ala Blender ("Add" lalu atur Sisi/Segmen di panel kiri-bawah).
   Isi: Lingkaran, Bola Lowpoly (icosphere), Kepala Lowpoly & Detail (dengan telinga), Manusia Pria & Wanita.
   Skala dunia: 1 unit = 1 meter. Dimuat setelah menus.js, sebelum main.js. */

/* ---------- Panel opsi (muncul tepat setelah Add; hilang bila objek diubah/masuk Edit/ganti pilihan) ---------- */
const PAR={cyl:[['Sisi',3,64,8]],cone:[['Sisi',3,64,8]],circle:[['Sisi',3,64,12]],sphere:[['Segmen',3,64,12],['Ring',2,32,8]],torus:[['Segmen',3,64,12],['Tabung',3,32,8]]};
const PV={};let LA=null;   // PV = nilai terakhir dipakai per primitif, LA = objek yang baru ditambah
Object.keys(PAR).forEach(k=>PV[k]=PAR[k].map(p=>p[3]));
['cyl','cone','sphere','torus'].forEach(k=>{const f=GEN[k];GEN[k]=(...a)=>f(...(a.length?a:PV[k]))});   // Piramida tetap 4 sisi (argumen eksplisit)
GEN.circle=(n=PV.circle[0])=>({v:Array.from({length:n},(_,i)=>[Math.cos(i/n*6.2832)*.5,Math.sin(i/n*6.2832)*.5,0]),f:[[...Array(n).keys()]]});
{const f=GEN.circle;GEN.circle=(...a)=>f(...(a.length?a:PV.circle))}

vp.insertAdjacentHTML('beforeend','<div id="opp" hidden></div>');
const oppEl=$('#opp');
function showOpp(){oppEl.hidden=true;if(!LA)return;const k=LA.k;
 oppEl.innerHTML='<b>Add '+NAMES[k]+'</b>'+PAR[k].map((p,i)=>`<label>${p[0]} <input type="number" data-i="${i}" min="${p[1]}" max="${p[2]}" step="1" value="${PV[k][i]}"></label>`).join('');
 oppEl.querySelectorAll('input').forEach(inp=>inp.oninput=()=>{const i=+inp.dataset.i,v=Math.round(parseFloat(inp.value)),p=PAR[k][i];if(!(v>=p[1]))return;PV[k][i]=Math.min(p[2],v);
  const g=GEN[k]();LA.o.v=g.v;LA.o.f=g.f;LA.sig=JSON.stringify(g.v);need();syncProps()});
 oppEl.hidden=false}
function chkOpp(){if(!LA)return;if(!(sel===LA.o&&mode==='obj'&&objs.includes(LA.o)&&JSON.stringify(LA.o.v)===LA.sig)){LA=null;oppEl.hidden=true}}
const _suOpp=syncUI;syncUI=function(){_suOpp();chkOpp()};

/* ---------- Bola Lowpoly: icosphere 12 vertex / 20 segitiga, diameter 1 m ---------- */
GEN.lsphere=()=>{const t=(1+Math.sqrt(5))/2,v=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(p=>nor(p).map(x=>x*.5));
 const f=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
 return outward({v,f},()=>[0,0,0])};

/* ---------- Manusia referensi: SATU mesh menyambung (box-modeling): badan+leher+kepala = satu rangkaian cincin 8 titik;
   kaki di-extrude dari dasar pinggul (dibelah dua), lengan di-extrude dari 2 face bahu. Origin di telapak kaki, menghadap -Y, pose-A. ---------- */
/* Kepala: tiap cincin 16 titik. [z, ½lebar, jarak-depan, jarak-belakang, tonjolan hidung, penyempitan depan]. z relatif pusat kepala (tinggi total 23 cm). Menghadap -Y. */
const HR=[[-.145,.05,.045,.068],[-.128,.05,.054,.068,0,.8],[-.113,.05,.066,.068,0,.62],[-.094,.052,.088,.07,0,.62],[-.074,.058,.08,.074,0,.8],[-.058,.064,.089,.078],[-.04,.068,.087,.082],[-.02,.072,.087,.086,.028],[0,.074,.088,.09,.008],[.015,.075,.087,.093],[.03,.078,.094,.096],[.06,.077,.088,.096],[.09,.066,.076,.088],[.105,.05,.056,.07],[.115,.03,.03,.04]];
const EAR=[6,10];   // telinga: di-extrude dari 4 band (cincin 6..10) di sisi kiri & kanan kepala
function headPart(V,F,nb,z0,s){const m=HR.length,base=V.length,R=(j,i)=>base+j*16+(i%16);
 HR.forEach(([z,rx,f,b,bp=0,ft=1])=>{for(let i=0;i<16;i++){const th=i*Math.PI/8,c=Math.cos(th),sn=Math.sin(th);let x=rx*Math.sign(c)*Math.pow(Math.abs(c),.9),y=(sn>0?b:f)*Math.sign(sn)*Math.pow(Math.abs(sn),.9);
  if(Math.abs(c)<1e-9)x=0;if(sn<0)x*=1-(1-ft)*sn*sn;const d=Math.min(Math.abs(i-12),16-Math.abs(i-12));y-=bp*(d===0?1:d===1?.4:0);V.push([s*x,s*y,z0+s*z])}});
 for(let i=0;i<8;i++)F.push([nb+i,nb+(i+1)%8,R(0,2*i+2),R(0,2*i+1),R(0,2*i)]);   // sambungan leher (8 titik) → kepala (16 titik)
 for(let j=0;j<m-1;j++)for(let i=0;i<16;i++){if(j>=EAR[0]&&j<EAR[1]&&(i===0||i===7))continue;F.push([R(j,i),R(j,i+1),R(j+1,i+1),R(j+1,i)])}
 F.push(Array.from({length:16},(_,i)=>R(m-1,i)));
 [1,-1].forEach(sd=>{const a=sd>0?0:8,e=sd>0?1:7,L=[],rows=[];for(let j=EAR[0];j<=EAR[1];j++)rows.push(j);
  L.push(R(rows[0],a),R(rows[0],e));rows.slice(1).forEach(j=>L.push(R(j,e)));[...rows].reverse().slice(0,-1).forEach(j=>L.push(R(j,a)));
  const c=[0,1,2].map(k=>L.reduce((t,i)=>t+V[i][k],0)/L.length),dir=[sd*.97,.25,0];let prev=L;
  [[.012,1.25,1.06],[.021,1.05,.84]].forEach(([t,sy,sz])=>{const cur=L.map(i=>{const p=V[i];V.push([p[0]+dir[0]*t*s,c[1]+(p[1]-c[1])*sy+dir[1]*t*s,c[2]+(p[2]-c[2])*sz]);return V.length-1});
   for(let k=0;k<L.length;k++){const k2=(k+1)%L.length;F.push(sd>0?[prev[k],prev[k2],cur[k2],cur[k]]:[prev[k2],prev[k],cur[k],cur[k2]])}prev=cur});
  F.push(sd>0?prev.slice():prev.slice().reverse())})}
/* Kepala berdiri sendiri: kepala + leher pendek, satu mesh */
GEN.head=()=>{const V=[],F=[];[-.215,-.17].forEach(z=>{for(let i=0;i<8;i++){const th=i*Math.PI/4;let x=.05*Math.cos(th);if(Math.abs(x)<1e-9)x=0;V.push([x,.012+.057*Math.sin(th),z])}});
 for(let i=0;i<8;i++)F.push([i,(i+1)%8,8+(i+1)%8,8+i]);F.push(Array.from({length:8},(_,i)=>7-i));headPart(V,F,8,0,1);return{v:V,f:F}};
const RT=[[-1,-.8],[0,-1],[1,-.8],[1,.8],[0,1],[-1,.8]];
function body(P){const V=[],F=[],T=P.trunk,R=(j,i)=>j*8+(i%8),sw=P.s0;
 T.forEach(([z,rx,ry,cy=0,bp=0,bu=0])=>{for(let i=0;i<8;i++){const th=i*Math.PI/4;let x=rx*Math.cos(th);if(Math.abs(x)<1e-9)x=0;V.push([x,cy+ry*Math.sin(th)-(i===6?bp:0)-bu*(i===5||i===7?1:i===6?.35:0),z])}});   /* bu = dada: titik depan-kiri/kanan maju, tengah sedikit */
 for(let j=0;j<T.length-1;j++)for(let i=0;i<8;i++){if(j===sw&&[7,0,3,4].includes(i))continue;F.push([R(j,i),R(j,i+1),R(j+1,i+1),R(j+1,i)])}
 headPart(V,F,(T.length-1)*8,P.z0,P.hs);   // cincin leher terakhir disambung ke kepala
 /* kaki: dasar pinggul (cincin 0) dibelah di garis tengah → 2 face segilima, masing-masing di-extrude ke bawah */
 const r0=[R(0,6),R(0,7),R(0,0),R(0,1),R(0,2)],cx0=T[0][1]/2,cy0=T[0][3]||0,Q=r0.map(i=>[V[i][0]-cx0,V[i][1]-cy0]);
 [1,-1].forEach(s=>{let prev=s>0?r0:[R(0,2),R(0,3),R(0,4),R(0,5),R(0,6)];
  P.leg.forEach(([z,cx,cy,sx,sy])=>{const cur=[];for(let k=0;k<5;k++){const q=s>0?Q[k]:[-Q[4-k][0],Q[4-k][1]];
    V.push([s>0?cx+sx*q[0]:-(cx+sx*(-q[0])),cy+sy*q[1],z]);cur.push(V.length-1)}
   for(let k=0;k<5;k++)F.push([cur[k],cur[(k+1)%5],prev[(k+1)%5],prev[k]]);prev=cur});
  F.push(prev.slice().reverse())});
 /* lengan: 2 face bahu (di band s0) di-extrude keluar-bawah; tiap cincin 6 titik, bidangnya tegak lurus sumbu lengan */
 const ph=P.phi*Math.PI/180,cp=Math.cos(ph),sp=Math.sin(ph);
 [1,-1].forEach(s=>{let prev=(s>0?[[7,0],[0,0],[1,0],[1,1],[0,1],[7,1]]:[[5,0],[4,0],[3,0],[3,1],[4,1],[5,1]]).map(([i,o])=>R(sw+o,i));
  P.arm.forEach(([t,ru,rw])=>{const C=[s*P.S[0]+s*sp*t,0,P.S[1]-cp*t],cur=[];
   RT.forEach(([a,b])=>{V.push([C[0]+s*cp*b*rw,C[1]+a*ru,C[2]+sp*b*rw]);cur.push(V.length-1)});
   for(let k=0;k<6;k++)F.push(s>0?[prev[k],prev[(k+1)%6],cur[(k+1)%6],cur[k]]:[prev[(k+1)%6],prev[k],cur[k],cur[(k+1)%6]]);prev=cur});
  F.push(s>0?prev.slice():prev.slice().reverse())});
 return{v:V,f:F}}
const ARM=(ka,kr)=>[[.06,.062,.058],[.15,.05,.048],[.26,.042,.042],[.33,.037,.038],[.42,.04,.04],[.52,.032,.03],[.56,.027,.026],[.62,.045,.02],[.72,.04,.015],[.78,.02,.011]].map(([t,a,b])=>[t*ka,a*kr,b*kr]);
GEN.male=()=>body({s0:4,phi:14,S:[.17,1.365],
 trunk:[[.82,.158,.105],[.9,.16,.108],[1.04,.15,.1],[1.15,.145,.095],[1.3,.17,.115],[1.43,.2,.1],[1.45,.12,.08,.004],[1.468,.054,.058,.013]],z0:1.635,hs:1,
 leg:[[.68,.097,.005,.85,.85],[.5,.093,.005,.58,.55],[.3,.09,.012,.62,.62],[.1,.09,0,.38,.34],[.045,.09,-.03,.46,.85],[0,.09,-.05,.5,1.1]],arm:ARM(1,1.2)});
GEN.female=()=>body({s0:5,phi:14,S:[.16,1.28],
 trunk:[[.8,.158,.105],[.88,.17,.11],[1.02,.12,.086],[1.1,.13,.09,0,0,.02],[1.17,.15,.1,0,0,.058],[1.24,.155,.098,0,0,.015],[1.32,.175,.088],[1.335,.1,.068,.004],[1.352,.046,.052,.011]],z0:1.511,hs:.95,
 leg:[[.66,.093,.005,.82,.82],[.46,.09,.005,.56,.53],[.28,.087,.011,.6,.6],[.095,.087,0,.37,.33],[.042,.087,-.03,.44,.82],[0,.087,-.048,.48,1.05]],arm:ARM(.93,1.08)});

Object.assign(NAMES,{circle:'Lingkaran',lsphere:'Bola Lowpoly',head:'Kepala',male:'Pria',female:'Wanita'});
$('#addSel').insertAdjacentHTML('beforeend','<option value="circle">Lingkaran</option><option value="lsphere">Bola Lowpoly</option><option value="head">Kepala (ukuran asli)</option><option value="male">Manusia Pria 1,75 m</option><option value="female">Manusia Wanita 1,62 m</option>');

/* ---------- Posisi awal + tampilkan panel opsi ---------- */
const ZOFF={circle:0,head:.215,male:0,female:0};
const _addP=add;add=function(k){_addP(k);
 if(sel&&ZOFF[k]!==undefined){sel.mesh.position.z=CUR[2]+ZOFF[k];need();syncProps()}
 LA=PAR[k]&&sel?{o:sel,k,sig:JSON.stringify(sel.v)}:null;showOpp()};
