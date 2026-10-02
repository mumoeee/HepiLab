/* main.js — perekat: muat mesh, hubungkan tombol, jalankan ulang unfold tiap ada perubahan, ekspor. Dimuat PALING AKHIR. */
const HIST=[],REDO=[];let saveT=0;
/* Riwayat = potongan + posisi/rotasi semua bagian, jadi undo/redo juga membatalkan geser & putar. */
const cur=()=>({cuts:[...U.cuts],tabs:[...TABS],place:U.res?U.res.isl.map(o=>[o.key,{ox:o.ox,oy:o.oy,rot:o.rot||0}]):[...PLACE].map(([k,p])=>[k,{...p}])});
function restore(s){U.cuts=new Set(s.cuts);TABS.clear();(s.tabs||[]).forEach(([k,v])=>TABS.set(k,v));PLACE.clear();s.place.forEach(([k,p])=>PLACE.set(k,{...p}));refresh()}
function snap(){HIST.push(cur());if(HIST.length>100)HIST.shift();REDO.length=0} // catat keadaan sebelum perubahan baru (membuang riwayat redo)
function saveSoon(){clearTimeout(saveT);saveT=setTimeout(persist,500)}
/* Status edge dibuat EKSPLISIT: setelah unfold, semua edge yang bukan lipatan dicatat sebagai potongan.
   Jadi memotong satu lipatan hanya membelah bagian tsb (tidak diam-diam tersambung lewat jalur lain). */
function refresh(){U.res=unfold();for(const k in U.em)if(U.em[k].length===2&&!U.res.fold.has(k))U.cuts.add(k);
  need2();need3();stat();saveSoon()}
function stat(q){const r=U.res;if(!r)return;const inner=Object.values(U.em).filter(a=>a.length===2).length,tb=tabInfo().filter(t=>t.bad).length;
  $('#info').innerHTML=`<b>${U.name.replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';')}</b><br>${U.v.length} titik · ${U.f.length} face<br>${r.isl.length} bagian pola<br>${r.fold.size} lipatan · ${inner-r.fold.size} potongan tempel${tb?`<br><b style="color:#e88">⚠ ${tb} tab bertabrakan</b>`:''}`;
  q||toast(`${r.isl.length} bagian · ${r.fold.size} lipatan`)}
function load(d,msg){if(!fromData(d))return false;PLACE.clear();
  if(Array.isArray(d.place))d.place.forEach(q=>{if(Array.isArray(q)&&q.length>=3&&Number.isFinite(q[1])&&Number.isFinite(q[2]))PLACE.set(+q[0],{ox:q[1],oy:q[2],rot:Number.isFinite(q[3])?q[3]:0})});
  TABW=Number.isFinite(d.tabw)?clamp(d.tabw,0,1):1;$('#tabw').value=Math.round(TABW*100);
  TABS.clear();if(Array.isArray(d.tabs))d.tabs.forEach(q=>{if(Array.isArray(q)&&Number.isInteger(q[1]))TABS.set(q[0],q[1])});
  HIST.length=0;REDO.length=0;SEL.f=-1;SEL.e=null;refresh();fit2();fit3();toast(msg||('Dimuat: '+U.name));return true}
/* Ketuk di 2D/3D: edge → potong/tempel (unfold ulang langsung), face → sorot di kedua tampilan. */
/* Tab: ketuk sebuah tab untuk memindahkannya ke sisi seberang edge tempel. */
function flipTab(t){const a=U.em[t.key],cur=tabFace(t.key),alt=a[0]===cur?a[1]:a[0];snap();alt===a[0]?TABS.delete(t.key):TABS.set(t.key,alt);need2();toast('Tab dipindah ke sisi seberang.')}
$('#bTab').onclick=()=>{if(!U.res)return;const n=()=>tabInfo().filter(t=>t.bad).length,b0=n();if(!b0)return toast('Tidak ada tab yang bertabrakan.');
  snap();for(const key of tabInfo().filter(t=>t.bad).map(t=>t.key)){const a=U.em[key],cur=tabFace(key),alt=a[0]===cur?a[1]:a[0],before=n();TABS.set(key,alt);if(n()>=before)TABS.set(key,cur)}
  for(const[k,v]of[...TABS])if(v===U.em[k][0])TABS.delete(k);need2();stat();toast(`Tab bertabrakan: ${b0} → ${n()}`)};
function pickHit(h){
  if(h.t)return flipTab(h.t);
  if(h.e){SEL.e=h.e;SEL.f=-1;const n=(U.em[h.e]||[]).length;
    if(n!==2)toast(n===1?'Edge tepi — selalu potongan.':'Edge dipakai >2 face — selalu potongan.');else toggleCut(h.e)}
  else{SEL.f=h.f;SEL.e=null;toast('Face '+h.f)}need2();need3()}
function toggleCut(k){const r=U.res,fd=r.fold.has(k);
  if(!fd){const[a,b]=U.em[k];if(r.iof[a]===r.iof[b])return toast('Edge ini tempat lem di bagian yang sama — potong sebuah lipatan dulu.')}
  snap();fd?U.cuts.add(k):U.cuts.delete(k);refresh();
  if(!fd&&!U.res.fold.has(k))toast('Gagal ditempel: pola jadi bertabrakan.')}
function undo(){const p=HIST.pop();if(!p)return toast('Tidak ada yang di-undo.');REDO.push(cur());restore(p)}
function redo(){const p=REDO.pop();if(!p)return toast('Tidak ada yang di-redo.');HIST.push(cur());restore(p)}
$('#bDemo').onclick=()=>load(DEMO);
$('#bOpen').onclick=()=>HL.pickFile((t,n)=>{try{
  if(/\.obj$/i.test(n)){const m=parseObj(t);m.name=n.replace(/\.obj$/i,'');
    if(m.f.length>1000&&!confirm('Model ini punya '+m.f.length+' face. Proses unfold bisa lambat/hang di HP. Lanjutkan?'))return toast('Dibatalkan.');
    if(!setMesh(m))return toast('OBJ tidak punya face yang valid.');
    autoCuts();PLACE.clear();TABS.clear();HIST.length=0;REDO.length=0;SEL.f=-1;SEL.e=null;refresh();fit2();fit3();toast('OBJ dibuka: '+n);return}
  if(!load(JSON.parse(t),'Dibuka: '+n))toast('Bukan file mesh/proyek Unfold yang valid.')
}catch(e){toast('File tidak bisa dibaca.')}},'.json,.obj');
$('#bSave').onclick=()=>{if(U.f.length)HL.download(new Blob([JSON.stringify(projectData())],{type:'application/json'}),(U.name||'unfold')+'.unfold.json')};
$('#bAuto').onclick=()=>{if(!U.f.length)return;snap();autoCuts();PLACE.clear();refresh();fit2()};
$('#bSeam0').onclick=()=>{snap();U.cuts=new Set(U.seams0);refresh()};
$('#bLay').onclick=()=>{snap();PLACE.clear();refresh();fit2()};
/* Putar bagian yang berisi face terpilih (ketuk sebuah face dulu). Sudut positif = searah jarum jam. */
function rotIsl(deg){const r=U.res;if(!r||SEL.f<0)return toast('Ketuk sebuah face dulu untuk memilih bagian yang diputar.');
  snap();const o=r.isl[r.iof[SEL.f]];o.rot=(o.rot||0)+deg*Math.PI/180;PLACE.set(o.key,{ox:o.ox,oy:o.oy,rot:o.rot});need2();saveSoon()}
$('#bRl').onclick=()=>rotIsl(-15);$('#bRr').onclick=()=>rotIsl(15);$('#bRl9').onclick=()=>rotIsl(-90);$('#bRr9').onclick=()=>rotIsl(90);
$('#bUndo').onclick=undo;$('#bRedo').onclick=redo;$('#bFit').onclick=()=>{fit2();fit3()};
$('#menu').onclick=()=>$('#wU').classList.toggle('sp');
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const k=e.key.toLowerCase();
  if(!(e.ctrlKey||e.metaKey)){if(k==='r')rotIsl(e.shiftKey?-15:15);else if(k==='f'){fit2();fit3()}return}
  if(k==='z'){e.preventDefault();e.shiftKey?redo():undo()}else if(k==='y'){e.preventDefault();redo()}});

/* Ekspor SVG berukuran nyata: 1 unit model = [mm] milimeter. Lipatan putus-putus, potongan solid. */
function svgBody(mm,b,pad){const r=U.res,tabs=tabInfo(),L=patLines(tabs);let body='';
  const T=p=>[r3((p[0]-b[0]+pad)*mm),r3((p[1]-b[1]+pad)*mm)],
   ln=(s,c,w,d)=>{const p=T(s.p[0]),q=T(s.p[1]);return `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${c}" stroke-width="${w}"${d?` stroke-dasharray="${d}"`:''} stroke-linecap="round"/>`};
  tabs.forEach(t=>body+=`<polygon points="${t.poly.map(p=>T(p).join(',')).join(' ')}" fill="#efe3c8" stroke="none"/>`);
  U.f.forEach((fc,i)=>{body+=`<polygon points="${wp(i).map(p=>T(p).join(',')).join(' ')}" fill="#fbf8f2" stroke="none"/>`});
  L.cut.forEach(s=>body+=ln(s,'#222',.4));                                                   // potongan (semua sisi) di bawah
  L.fold.forEach(s=>body+=ln(s,'#e0457b',.3,s.t==='mtn'?'4 1 .6 1':'2 1.4'));               // lipatan di atas
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
$('#tabw').oninput=()=>{TABW=$('#tabw').value/100;need2();stat(true);saveSoon()};
$('#paper').onchange=$('#mm').oninput=()=>need2();

/* Kirim pola ke Vector (format sama dengan tombol di app 3D). */
$('#bVec').onclick=()=>{if(!U.res)return;const K=+$('#mm').value||10,b=bounds2(),T=p=>[(p[0]-b[0])*K+60,(p[1]-b[1])*K+60],tabs=tabInfo(),L=patLines(tabs),
  l1={name:'Pola Unfold',shapes:[]},l2={name:'Garis potong',shapes:[]},l3={name:'Garis lipat',shapes:[]};
  tabs.forEach(t=>l1.shapes.push({p:t.poly.map(T),c:1,fill:'#efe3c8',stroke:'#efe3c8',sw:.5}));
  U.f.forEach((fc,i)=>l1.shapes.push({p:wp(i).map(T),c:1,fill:'#e6c48a',stroke:'#e6c48a',sw:.5}));
  L.cut.forEach(s=>l2.shapes.push({p:s.p.map(T),c:0,fill:null,stroke:'#2a2118',sw:1.5}));
  L.fold.forEach(s=>l3.shapes.push({p:s.p.map(T),c:0,fill:null,stroke:'#e0457b',sw:1.5,dash:1}));
  if(!HL.send('unfold',{layers:[l1,l2,l3]}))return toast('Gagal mengirim (penyimpanan penuh?).');location.href='../vector/?import=unfold'};

(function tick(){if(dirty2){dirty2=false;draw2()}if(dirty3){dirty3=false;draw3()}requestAnimationFrame(tick)})();

/* Sumber mesh, urut prioritas: kiriman dari app 3D (?import=unfold) → simpanan otomatis terakhir → kubus contoh. */
(function init(){let d=null,msg='';
  if(new URLSearchParams(location.search).get('import')==='unfold'){d=HL.take('unfold');msg='Mesh diterima dari 3D Workspace.';history.replaceState(null,'',location.pathname)}
  if(!d)try{d=JSON.parse(localStorage.getItem(STORE)||'null');msg='Proyek terakhir dipulihkan.'}catch(e){}
  if(!(d&&load(d,msg)))load(DEMO,'Belum ada model — memuat kubus contoh.')})();
