/* main.js — perekat: muat mesh, hubungkan tombol, jalankan ulang unfold tiap ada perubahan, ekspor. Dimuat PALING AKHIR. */
const HIST=[];let saveT=0;
/* Status edge dibuat EKSPLISIT: setelah unfold, semua edge yang bukan lipatan dicatat sebagai potongan.
   Jadi memotong satu lipatan hanya membelah bagian tsb (tidak diam-diam tersambung lewat jalur lain). */
function refresh(){U.res=unfold();for(const k in U.em)if(U.em[k].length===2&&!U.res.fold.has(k))U.cuts.add(k);
  need2();need3();stat();clearTimeout(saveT);saveT=setTimeout(persist,500)}
function stat(){const r=U.res;if(!r)return;const inner=Object.values(U.em).filter(a=>a.length===2).length;
  $('#info').innerHTML=`<b>${U.name}</b><br>${U.v.length} titik · ${U.f.length} face<br>${r.isl.length} bagian pola<br>${r.fold.size} lipatan · ${inner-r.fold.size} potongan tempel`;
  toast(`${r.isl.length} bagian · ${r.fold.size} lipatan`)}
function load(d,msg){if(!fromData(d))return false;PLACE.clear();HIST.length=0;SEL.f=-1;SEL.e=null;refresh();fit2();fit3();toast(msg||('Dimuat: '+U.name));return true}
/* Ketuk di 2D/3D: edge → potong/tempel (unfold ulang langsung), face → sorot di kedua tampilan. */
function pickHit(h){
  if(h.e){SEL.e=h.e;SEL.f=-1;const n=(U.em[h.e]||[]).length;
    if(n!==2)toast(n===1?'Edge tepi — selalu potongan.':'Edge dipakai >2 face — selalu potongan.');else toggleCut(h.e)}
  else{SEL.f=h.f;SEL.e=null;toast('Face '+h.f)}need2();need3()}
function toggleCut(k){const r=U.res,fd=r.fold.has(k);
  if(!fd){const[a,b]=U.em[k];if(r.iof[a]===r.iof[b])return toast('Edge ini tempat lem di bagian yang sama — potong sebuah lipatan dulu.')}
  HIST.push([...U.cuts]);fd?U.cuts.add(k):U.cuts.delete(k);refresh();
  if(!fd&&!U.res.fold.has(k))toast('Gagal ditempel: pola jadi bertabrakan.')}
function undo(){const p=HIST.pop();if(!p)return toast('Tidak ada yang di-undo.');U.cuts=new Set(p);refresh()}
$('#bDemo').onclick=()=>load(DEMO);
$('#bOpen').onclick=()=>HL.pickFile((t,n)=>{try{if(!load(JSON.parse(t),'Dibuka: '+n))toast('Bukan file mesh/proyek Unfold yang valid.')}catch(e){toast('File bukan JSON yang valid.')}});
$('#bSave').onclick=()=>{if(U.f.length)HL.download(new Blob([JSON.stringify(projectData())],{type:'application/json'}),(U.name||'unfold')+'.unfold.json')};
$('#bAuto').onclick=()=>{if(!U.f.length)return;HIST.push([...U.cuts]);autoCuts();PLACE.clear();refresh();fit2()};
$('#bSeam0').onclick=()=>{HIST.push([...U.cuts]);U.cuts=new Set(U.seams0);refresh()};
$('#bLay').onclick=()=>{PLACE.clear();refresh();fit2()};
$('#bUndo').onclick=undo;$('#bFit').onclick=()=>{fit2();fit3()};
$('#menu').onclick=()=>$('#wU').classList.toggle('sp');
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undo()}});

/* Ekspor SVG berukuran nyata: 1 unit model = [mm] milimeter. Lipatan putus-putus, potongan solid. */
function exportSvg(){if(!U.res)return;const mm=+$('#mm').value||10,r=U.res,b=bounds2(),pad=5/mm,done=new Set;let body='';
  const T=p=>[r3((p[0]-b[0]+pad)*mm),r3((p[1]-b[1]+pad)*mm)];
  U.f.forEach((fc,i)=>{body+=`<polygon points="${wp(i).map(p=>T(p).join(',')).join(' ')}" fill="#fbf8f2" stroke="none"/>`});
  U.f.forEach((fc,i)=>{const P=wp(i);fc.forEach((a,k)=>{const b2=fc[(k+1)%fc.length],key=ek(a,b2),fd=r.fold.has(key);if(done.has(key))return;done.add(key);
    const p1=T(P[k]),p2=T(P[(k+1)%P.length]);
    body+=`<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="${fd?'#e0457b':'#222'}" stroke-width="${fd?.3:.4}"${fd?' stroke-dasharray="2 1.4"':''} stroke-linecap="round"/>`})});
  const w=r3((b[2]-b[0]+2*pad)*mm),h=r3((b[3]-b[1]+2*pad)*mm);
  HL.download(new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">${body}</svg>`],{type:'image/svg+xml'}),(U.name||'pola')+'.svg')}
$('#bSvg').onclick=exportSvg;

/* Kirim pola ke Vector (format sama dengan tombol di app 3D). */
$('#bVec').onclick=()=>{if(!U.res)return;const K=+$('#mm').value||10,r=U.res,b=bounds2(),l1={name:'Pola Unfold',shapes:[]},l2={name:'Garis lipat',shapes:[]},done=new Set,T=p=>[(p[0]-b[0])*K+60,(p[1]-b[1])*K+60];
  U.f.forEach((fc,i)=>{const P=wp(i).map(T);l1.shapes.push({p:P,c:1,fill:'#e6c48a',stroke:'#2a2118',sw:1.5});
    fc.forEach((a,k)=>{const key=ek(a,fc[(k+1)%fc.length]);if(r.fold.has(key)&&!done.has(key)){done.add(key);l2.shapes.push({p:[P[k],P[(k+1)%P.length]],c:0,fill:null,stroke:'#e0457b',sw:1.5,dash:1})}})});
  if(!HL.send('unfold',{layers:[l1,l2]}))return toast('Gagal mengirim (penyimpanan penuh?).');location.href='../vector/?import=unfold'};

(function tick(){if(dirty2){dirty2=false;draw2()}if(dirty3){dirty3=false;draw3()}requestAnimationFrame(tick)})();

/* Sumber mesh, urut prioritas: kiriman dari app 3D (?import=unfold) → simpanan otomatis terakhir → kubus contoh. */
(function init(){let d=null,msg='';
  if(new URLSearchParams(location.search).get('import')==='unfold'){d=HL.take('unfold');msg='Mesh diterima dari 3D Workspace.';history.replaceState(null,'',location.pathname)}
  if(!d)try{d=JSON.parse(localStorage.getItem(STORE)||'null');msg='Proyek terakhir dipulihkan.'}catch(e){}
  if(!(d&&load(d,msg)))load(DEMO,'Belum ada model — memuat kubus contoh.')})();
