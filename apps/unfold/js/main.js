/* main.js — perekat: muat mesh, hubungkan tombol, jalankan ulang unfold tiap ada perubahan, ekspor. Dimuat PALING AKHIR. */
const HIST=[],REDO=[];let saveT=0;
function snap(){HIST.push([...U.cuts]);REDO.length=0} // catat keadaan sebelum perubahan baru (membuang riwayat redo)
function saveSoon(){clearTimeout(saveT);saveT=setTimeout(persist,500)}
/* Status edge dibuat EKSPLISIT: setelah unfold, semua edge yang bukan lipatan dicatat sebagai potongan.
   Jadi memotong satu lipatan hanya membelah bagian tsb (tidak diam-diam tersambung lewat jalur lain). */
function refresh(){U.res=unfold();for(const k in U.em)if(U.em[k].length===2&&!U.res.fold.has(k))U.cuts.add(k);
  need2();need3();stat();saveSoon()}
function stat(){const r=U.res;if(!r)return;const inner=Object.values(U.em).filter(a=>a.length===2).length;
  $('#info').innerHTML=`<b>${U.name}</b><br>${U.v.length} titik · ${U.f.length} face<br>${r.isl.length} bagian pola<br>${r.fold.size} lipatan · ${inner-r.fold.size} potongan tempel`;
  toast(`${r.isl.length} bagian · ${r.fold.size} lipatan`)}
function load(d,msg){if(!fromData(d))return false;PLACE.clear();
  if(Array.isArray(d.place))d.place.forEach(q=>{if(Array.isArray(q)&&q.length>=3&&Number.isFinite(q[1])&&Number.isFinite(q[2]))PLACE.set(+q[0],{ox:q[1],oy:q[2],rot:Number.isFinite(q[3])?q[3]:0})});
  HIST.length=0;REDO.length=0;SEL.f=-1;SEL.e=null;refresh();fit2();fit3();toast(msg||('Dimuat: '+U.name));return true}
/* Ketuk di 2D/3D: edge → potong/tempel (unfold ulang langsung), face → sorot di kedua tampilan. */
function pickHit(h){
  if(h.e){SEL.e=h.e;SEL.f=-1;const n=(U.em[h.e]||[]).length;
    if(n!==2)toast(n===1?'Edge tepi — selalu potongan.':'Edge dipakai >2 face — selalu potongan.');else toggleCut(h.e)}
  else{SEL.f=h.f;SEL.e=null;toast('Face '+h.f)}need2();need3()}
function toggleCut(k){const r=U.res,fd=r.fold.has(k);
  if(!fd){const[a,b]=U.em[k];if(r.iof[a]===r.iof[b])return toast('Edge ini tempat lem di bagian yang sama — potong sebuah lipatan dulu.')}
  snap();fd?U.cuts.add(k):U.cuts.delete(k);refresh();
  if(!fd&&!U.res.fold.has(k))toast('Gagal ditempel: pola jadi bertabrakan.')}
function undo(){const p=HIST.pop();if(!p)return toast('Tidak ada yang di-undo.');REDO.push([...U.cuts]);U.cuts=new Set(p);refresh()}
function redo(){const p=REDO.pop();if(!p)return toast('Tidak ada yang di-redo.');HIST.push([...U.cuts]);U.cuts=new Set(p);refresh()}
$('#bDemo').onclick=()=>load(DEMO);
$('#bOpen').onclick=()=>HL.pickFile((t,n)=>{try{
  if(/\.obj$/i.test(n)){const m=parseObj(t);m.name=n.replace(/\.obj$/i,'');
    if(m.f.length>1000&&!confirm('Model ini punya '+m.f.length+' face. Proses unfold bisa lambat/hang di HP. Lanjutkan?'))return toast('Dibatalkan.');
    if(!load(m,'OBJ dibuka: '+n))return toast('OBJ tidak punya face yang valid.');
    snap();autoCuts();PLACE.clear();refresh();fit2();return}
  if(!load(JSON.parse(t),'Dibuka: '+n))toast('Bukan file mesh/proyek Unfold yang valid.')
}catch(e){toast('File tidak bisa dibaca.')}},'.json,.obj');
$('#bSave').onclick=()=>{if(U.f.length)HL.download(new Blob([JSON.stringify(projectData())],{type:'application/json'}),(U.name||'unfold')+'.unfold.json')};
$('#bAuto').onclick=()=>{if(!U.f.length)return;snap();autoCuts();PLACE.clear();refresh();fit2()};
$('#bSeam0').onclick=()=>{snap();U.cuts=new Set(U.seams0);refresh()};
$('#bLay').onclick=()=>{PLACE.clear();refresh();fit2()};
/* Putar bagian yang berisi face terpilih (ketuk sebuah face dulu). Sudut positif = searah jarum jam. */
function rotIsl(deg){const r=U.res;if(!r||SEL.f<0)return toast('Ketuk sebuah face dulu untuk memilih bagian yang diputar.');
  const o=r.isl[r.iof[SEL.f]];o.rot=(o.rot||0)+deg*Math.PI/180;PLACE.set(o.key,{ox:o.ox,oy:o.oy,rot:o.rot});need2();saveSoon()}
$('#bRl').onclick=()=>rotIsl(-15);$('#bRr').onclick=()=>rotIsl(15);$('#bRl9').onclick=()=>rotIsl(-90);$('#bRr9').onclick=()=>rotIsl(90);
$('#bUndo').onclick=undo;$('#bRedo').onclick=redo;$('#bFit').onclick=()=>{fit2();fit3()};
$('#menu').onclick=()=>$('#wU').classList.toggle('sp');
addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey))return;const k=e.key.toLowerCase();
  if(k==='z'){e.preventDefault();e.shiftKey?redo():undo()}else if(k==='y'){e.preventDefault();redo()}});

/* Ekspor SVG berukuran nyata: 1 unit model = [mm] milimeter. Lipatan putus-putus, potongan solid. */
function svgBody(mm,b,pad){const r=U.res,done=new Set;let body='';
  const T=p=>[r3((p[0]-b[0]+pad)*mm),r3((p[1]-b[1]+pad)*mm)];
  U.f.forEach((fc,i)=>{const P=wp(i);fc.forEach((a,k)=>{const key=ek(a,fc[(k+1)%fc.length]);if(!r.cutNo.has(key)||U.em[key][0]!==i)return;const t=tabPoly(P,k);
    if(t)body+=`<polygon points="${t.map(p=>T(p).join(',')).join(' ')}" fill="#efe3c8" stroke="#222" stroke-width=".3" stroke-linejoin="round"/>`})});
  U.f.forEach((fc,i)=>{body+=`<polygon points="${wp(i).map(p=>T(p).join(',')).join(' ')}" fill="#fbf8f2" stroke="none"/>`});
  U.f.forEach((fc,i)=>{const P=wp(i);fc.forEach((a,k)=>{const b2=fc[(k+1)%fc.length],key=ek(a,b2),fd=r.fold.has(key);if(done.has(key))return;done.add(key);
    const p1=T(P[k]),p2=T(P[(k+1)%P.length]);
    body+=`<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="${fd?'#e0457b':'#222'}" stroke-width="${fd?.3:.4}"${fd?(r.mtn.has(key)?' stroke-dasharray="4 1 .6 1"':' stroke-dasharray="2 1.4"'):''} stroke-linecap="round"/>`})});
  U.f.forEach((fc,i)=>{const P=wp(i);fc.forEach((a,k)=>{const n=r.cutNo.get(ek(a,fc[(k+1)%fc.length]));if(n==null)return;const p=T(lblPos(P,k));
    body+=`<text x="${p[0]}" y="${p[1]}" font-size="2.5" font-family="sans-serif" text-anchor="middle" dominant-baseline="central" fill="#222">${n}</text>`})});
  return body}
function exportSvg(){if(!U.res)return;const mm=+$('#mm').value||10,b=bounds2(),pad=5/mm+U.rad*.15,body=svgBody(mm,b,pad);
  const w=r3((b[2]-b[0]+2*pad)*mm),h=r3((b[3]-b[1]+2*pad)*mm);
  HL.download(new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">${body}</svg>`],{type:'image/svg+xml'}),(U.name||'pola')+'.svg')}
/* Satu SVG per halaman kertas (ukuran asli, margin MARG mm). Diunduh berurutan. */
function exportPages(){if(!U.res)return;const g=pageGrid(),b=bounds2(),pad=5/g.mm+U.rad*.15,body=svgBody(g.mm,b,pad),n=g.cols*g.rows;let i=0;
  toast(n+' halaman — izinkan unduhan ganda bila diminta browser.');
  (function next(){if(i>=n)return;const c=i%g.cols,q=(i/g.cols)|0,vx=r3(c*g.cw*g.mm-MARG),vy=r3(q*g.ch*g.mm-MARG);
    HL.download(new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="${g.pw}mm" height="${g.ph}mm" viewBox="${vx} ${vy} ${g.pw} ${g.ph}">${body}<text x="${vx+3}" y="${vy+5}" font-size="3" font-family="sans-serif" fill="#888">Hal ${i+1}/${n}</text></svg>`],{type:'image/svg+xml'}),(U.name||'pola')+'-hal'+(i+1)+'.svg');
    i++;setTimeout(next,400)})()}
$('#bSvg').onclick=exportSvg;$('#bSvgP').onclick=exportPages;
$('#bPg').onclick=()=>{SHOWPG=!SHOWPG;need2();if(SHOWPG&&U.res){const g=pageGrid();toast(`${g.cols*g.rows} halaman (${g.cols}×${g.rows})`)}};
$('#paper').onchange=$('#mm').oninput=()=>need2();

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
