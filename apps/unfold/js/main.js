/* main.js — perekat: muat mesh, hubungkan tombol, jalankan ulang unfold tiap ada perubahan, ekspor. Dimuat PALING AKHIR. */
const HIST=[],REDO=[];let saveT=0;
/* Riwayat = potongan + posisi/rotasi semua bagian, jadi undo/redo juga membatalkan geser & putar. */
const cur=()=>({cuts:[...U.cuts],tabs:[...TABS],dual:TABDUAL,txt:TXT.map(t=>({...t})),place:U.res?U.res.isl.map(o=>[o.key,{ox:o.ox,oy:o.oy,rot:o.rot||0}]):[...PLACE].map(([k,p])=>[k,{...p}])});
function restore(s){TABDUAL=!!s.dual;if(s.txt){TXT.length=0;s.txt.forEach(t=>TXT.push({...t}));TSEL=-1;syncExtras()}$('#tabdual').checked=TABDUAL;U.cuts=new Set(s.cuts);TABS.clear();(s.tabs||[]).forEach(([k,v])=>TABS.set(k,v));PLACE.clear();s.place.forEach(([k,p])=>PLACE.set(k,{...p}));refresh()}
function snap(){HIST.push(cur());if(HIST.length>100)HIST.shift();REDO.length=0} // catat keadaan sebelum perubahan baru (membuang riwayat redo)
function saveSoon(){clearTimeout(saveT);saveT=setTimeout(persist,500)}
/* Status edge dibuat EKSPLISIT: setelah unfold, semua edge yang bukan lipatan dicatat sebagai potongan.
   Jadi memotong satu lipatan hanya membelah bagian tsb (tidak diam-diam tersambung lewat jalur lain). */
function refresh(){U.res=unfold();for(const k in U.em)if(U.em[k].length===2&&!U.res.fold.has(k))U.cuts.add(k);
  need2();need3();stat();saveSoon()}
function stat(q){const r=U.res;if(!r)return;const inner=Object.values(U.em).filter(a=>a.length===2).length,tb=tabInfo().filter(t=>t.bad).length;
  $('#info').innerHTML=`<b class="nm">${xe(U.name)}</b><div class="chips"><span>${U.v.length} titik</span><span>${U.f.length} face</span><span>${r.isl.length} bagian</span><span>${r.fold.size} lipatan</span><span>${inner-r.fold.size} tempel</span></div>${tb?`<div class="warn">⚠ ${tb} tab bertabrakan</div>`:''}`;
  q||toast(`${r.isl.length} bagian · ${r.fold.size} lipatan`)}
function load(d,msg){if(!fromData(d))return false;PLACE.clear();
  if(Array.isArray(d.place))d.place.forEach(q=>{if(Array.isArray(q)&&q.length>=3&&Number.isFinite(q[1])&&Number.isFinite(q[2]))PLACE.set(+q[0],{ox:q[1],oy:q[2],rot:Number.isFinite(q[3])?q[3]:0})});
  TABW=Number.isFinite(d.tabw)?clamp(d.tabw,0,1):1;$('#tabw').value=Math.round(TABW*100);TABDUAL=!!d.dual;$('#tabdual').checked=TABDUAL;
  if(Number.isFinite(d.mm)&&d.mm>0){MMU=d.mm;$('#mm').value=String(+MMU.toPrecision(6))}
  TABS.clear();if(Array.isArray(d.tabs))d.tabs.forEach(q=>{if(Array.isArray(q)&&Number.isInteger(q[1]))TABS.set(q[0],q[1])});
  if(Array.isArray(d.seams))U.seams0=new Set(d.seams.filter(k=>U.em[k]));loadExtras(d); // seam asli dari 3D ikut tersimpan di proyek
  HIST.length=0;REDO.length=0;SEL.f=-1;SEL.e=null;refresh();fit2();fit3();syncSize();toast(msg||('Dimuat: '+U.name));return true}
/* Ketuk di 2D/3D: edge → potong/tempel (unfold ulang langsung), face → sorot di kedua tampilan. */
/* Tab: ketuk sebuah tab untuk memindahkannya ke sisi seberang edge tempel. */
function flipTab(t){const a=U.em[t.key],dual=tabSides(t.key).length>1,alt=a[0]===t.i?a[1]:a[0];snap();TABS.set(t.key,alt);need2();need3();stat(true);
  toast(dual?'Tab di sisi ini dibuang (edge jadi tab satu sisi).':'Tab dipindah ke sisi seberang.')}
$('#bTab').onclick=()=>{if(!U.res)return;const n=()=>tabInfo().filter(t=>t.bad).length,b0=n();if(!b0)return toast('Tidak ada tab yang bertabrakan.');
  snap();for(const t of tabInfo().filter(t=>t.bad)){const a=U.em[t.key],alt=a[0]===t.i?a[1]:a[0],prev=TABS.get(t.key),before=n();
    TABS.set(t.key,alt);   // satu sisi: pindah ke seberang · dua sisi: buang tab yang bertabrakan
    if(n()>=before)prev===undefined?TABS.delete(t.key):TABS.set(t.key,prev)}
  need2();need3();stat();toast(`Tab bertabrakan: ${b0} → ${n()}`)};
/* Edit tab manual: tambah/hapus tab pada SATU sisi sebuah potongan. 0, 1, atau 2 tab per edge. */
function toggleTabSide(b){const cur=tabSides(b.key).slice(),ix=cur.indexOf(b.i);snap();ix>=0?cur.splice(ix,1):cur.push(b.i);
  TABS.set(b.key,cur.length>1?-1:cur.length?cur[0]:-2);need2();need3();stat(true);toast(`Edge ${U.res.cutNo.get(b.key)}: ${cur.length} tab`)}
function pickHit(h){
  if(h.tb)return toggleTabSide(h.tb);
  if(h.tx!==undefined){TSEL=h.tx;need2();startInline(h.tx);return}   // edit langsung di kanvas (bukan buka panel)
  if(h.t)return flipTab(h.t);
  if(h.e){SEL.e=h.e;SEL.f=-1;const n=(U.em[h.e]||[]).length;
    if(n!==2)toast(n===1?'Edge tepi — selalu potongan.':'Edge dipakai >2 face — selalu potongan.');else toggleCut(h.e)}
  else{SEL.f=h.f;SEL.e=null;toast('Face '+h.f)}need2();need3()}
function toggleCut(k){const r=U.res,fd=r.fold.has(k);
  if(!fd){const[a,b]=U.em[k];if(r.iof[a]===r.iof[b])return toast('Edge ini tempat lem di bagian yang sama — potong sebuah lipatan dulu.')}
  snap();TABS.delete(k);fd?U.cuts.add(k):U.cuts.delete(k);refresh();
  if(!fd&&!U.res.fold.has(k))toast('Gagal ditempel: pola jadi bertabrakan.')}
function undo(){const p=HIST.pop();if(!p)return toast('Tidak ada yang di-undo.');REDO.push(cur());restore(p)}
function redo(){const p=REDO.pop();if(!p)return toast('Tidak ada yang di-redo.');HIST.push(cur());restore(p)}
$('#bDemo').onclick=()=>load(DEMO);
$('#bOpen').onclick=()=>HL.pickFile((t,n)=>{try{
  if(/\.obj$/i.test(n)){const m=parseObj(t);m.name=n.replace(/\.obj$/i,'');
    if(m.f.length>1000&&!confirm('Model ini punya '+m.f.length+' face. Proses unfold bisa lambat/hang di HP. Lanjutkan?'))return toast('Dibatalkan.');
    if(!setMesh(m))return toast('OBJ tidak punya face yang valid.');
    autoCuts();U.seams0=new Set(U.cuts);TXT.length=0;TSEL=-1;syncExtras();PLACE.clear();TABS.clear();HIST.length=0;REDO.length=0;SEL.f=-1;SEL.e=null;refresh();fit2();fit3();syncSize();toast('OBJ dibuka: '+n);return}
  if(!load(JSON.parse(t),'Dibuka: '+n))toast('Bukan file mesh/proyek Unfold yang valid.')
}catch(e){toast('File tidak bisa dibaca.')}},'.json,.obj');
$('#bSave').onclick=()=>{if(U.f.length)HL.download(new Blob([JSON.stringify(projectData())],{type:'application/json'}),(U.name||'unfold')+'.unfold.json')};
/* Cadangan: sebelum Auto / Seam 3D menimpa potongan manual, keadaan sekarang disimpan (localStorage → tahan ditutup). Tombol ⟲ memulihkannya.
   Tidak ditimpa bila belum ada perubahan manual sejak Auto/Seam 3D terakhir (jadi klik Auto 2× tidak menghilangkan cadangan). */
const BAK=STORE+'_bak';let LASTGEN='';const genSig=()=>[...U.cuts].sort().join();
function backup(){if(genSig()===LASTGEN)return;try{localStorage.setItem(BAK,JSON.stringify({...cur(),name:U.name,nf:U.f.length}))}catch(e){}}
$('#bAuto').onclick=()=>{if(!U.f.length)return;backup();snap();autoCuts();PLACE.clear();refresh();LASTGEN=genSig();fit2();toast('Auto-potong. Salah? Undo, atau ⟲ Cadangan.')};
$('#bSeam0').onclick=()=>{backup();snap();U.cuts=new Set(U.seams0);refresh();LASTGEN=genSig()};
$('#bBak').onclick=()=>{let s=null;try{s=JSON.parse(localStorage.getItem(BAK)||'null')}catch(e){}
  if(!s||!Array.isArray(s.cuts)||s.nf!==U.f.length||s.name!==U.name)return toast('Belum ada cadangan untuk model ini.');
  snap();s.place=s.place||[];restore(s);toast('Dipulihkan ke keadaan sebelum Auto/Seam 3D terakhir.')};
$('#bLay').onclick=()=>{snap();PLACE.clear();refresh();fit2()};
/* Putar bagian yang berisi face terpilih (ketuk sebuah face dulu). Sudut positif = searah jarum jam. */
function rotIsl(deg){const r=U.res;if(!r||SEL.f<0)return toast('Ketuk sebuah face dulu untuk memilih bagian yang diputar.');
  snap();const o=r.isl[r.iof[SEL.f]];o.rot=(o.rot||0)+deg*Math.PI/180;PLACE.set(o.key,{ox:o.ox,oy:o.oy,rot:o.rot});need2();saveSoon()}
$('#bRl').onclick=()=>rotIsl(-15);$('#bRr').onclick=()=>rotIsl(15);$('#bRl9').onclick=()=>rotIsl(-90);$('#bRr9').onclick=()=>rotIsl(90);
$('#bUndo').onclick=undo;$('#bRedo').onclick=redo;$('#bFit').onclick=()=>{fit2();fit3()};
$('#menu').onclick=()=>$('#wU').classList.toggle('sp');
/* Laci panel (HP): menyentuh kanvas menutupnya. */
document.querySelectorAll('#v2,#v3').forEach(el=>el.addEventListener('pointerdown',()=>$('#wU').classList.remove('sp'),true));
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const k=e.key.toLowerCase();
  if(!(e.ctrlKey||e.metaKey)){if(k==='r')rotIsl(e.shiftKey?-15:15);else if(k==='f'){fit2();fit3()}return}
  if(k==='z'){e.preventDefault();e.shiftKey?redo():undo()}else if(k==='y'){e.preventDefault();redo()}});

/* Ekspor SVG berukuran nyata: 1 unit model = [mm] milimeter. Lipatan putus-putus, potongan solid. */
function svgBody(mm,b,pad){const r=U.res,tabs=tabInfo(),L=patLines(tabs);let body='';
  const T=p=>[r3((p[0]-b[0]+pad)*mm),r3((p[1]-b[1]+pad)*mm)],
   ln=(s,c,w,d)=>{const p=T(s.p[0]),q=T(s.p[1]);return `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${c}" stroke-width="${w}"${d?` stroke-dasharray="${d}"`:''} stroke-linecap="round"/>`};
  if(!STY.lineOnly){tabs.forEach(t=>body+=`<polygon points="${t.poly.map(p=>T(p).join(',')).join(' ')}" fill="${STY.tab}" stroke="none"/>`);
    U.f.forEach((fc,i)=>{body+=`<polygon points="${wp(i).map(p=>T(p).join(',')).join(' ')}" fill="${STY.face}" stroke="none"/>`})}
  L.cut.forEach(s=>body+=ln(s,STY.cut,STY.wc));                                                // potongan (semua sisi) di bawah
  L.fold.forEach(s=>body+=ln(s,s.t==='mtn'?STY.mtn:STY.val,STY.wf,s.t==='mtn'?'4 1 .6 1':'2 1.4')); // lipatan di atas
  if(STY.num)U.f.forEach((fc,i)=>{const P=wp(i);fc.forEach((a,k)=>{const n=r.cutNo.get(ek(a,fc[(k+1)%fc.length]));if(n==null)return;const p=T(lblPos(P,k));
    body+=`<text x="${p[0]}" y="${p[1]}" font-size="2.5" font-family="sans-serif" text-anchor="middle" dominant-baseline="central" fill="#222">${n}</text>`})});
  TXT.forEach(t=>{if(!t.s)return;const p=T([t.x,t.y]);
    body+=`<text transform="translate(${p[0]} ${p[1]}) rotate(${r3(t.rot||0)})" font-size="${r3(t.sz)}" font-family="Helvetica,Arial,sans-serif"${t.b?' font-weight="bold"':''} text-anchor="middle" dominant-baseline="central" fill="${t.c}">${xe(t.s)}</text>`});
  return body}
function exportSvg(){if(!U.res)return;const mm=+$('#mm').value||10,b=bounds2(),pad=5/mm+U.rad*.15,body=svgBody(mm,b,pad);
  const w=r3((b[2]-b[0]+2*pad)*mm),h=r3((b[3]-b[1]+2*pad)*mm);
  HL.download(new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">${body}</svg>`],{type:'image/svg+xml'}),(U.name||'pola')+'.svg')}
/* SVG satu halaman (ukuran asli) lengkap dengan header/footer/margin. pv = true → untuk pratinjau (lebar fleksibel, latar putih). */
function pageSvg(g,body,pi,n,pv){const c=pi%g.cols,q=(pi/g.cols)|0,vx=r3(c*g.cw*g.mm-MARG),vy=r3(q*g.ch*g.mm-MARG),
  hf=(txt,sz,al,col,y,bold)=>{if(!txt)return'';return `<text x="${r3(vx+(al==='c'?g.pw/2:al==='r'?g.pw-MARG:MARG))}" y="${r3(vy+y)}" font-size="${sz}" font-family="Helvetica,Arial,sans-serif"${bold?' font-weight="bold"':''} text-anchor="${al==='c'?'middle':al==='r'?'end':'start'}" fill="${col}">${xe(fmtTok(txt,pi,n))}</text>`},
  mg=PDFO.mg?`<rect x="${vx+MARG}" y="${vy+MARG}" width="${g.pw-2*MARG}" height="${g.ph-2*MARG}" fill="none" stroke="#bfbfbf" stroke-width=".3" stroke-dasharray="1 1"/>`:'',
  size=pv?`style="width:100%;height:auto;max-height:62vh;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.4)"`:`width="${g.pw}mm" height="${g.ph}mm"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" ${size} viewBox="${vx} ${vy} ${g.pw} ${g.ph}">${pv?`<rect x="${vx}" y="${vy}" width="${g.pw}" height="${g.ph}" fill="#fff"/>`:''}${body}${mg}${hf(PDFO.hd,PDFO.hs,PDFO.ha,PDFO.hc,HFY(),PDFO.hb)}${hf(PDFO.ft,PDFO.fs,PDFO.fa,PDFO.fc,g.ph-3,false)}</svg>`}
/* Satu SVG per halaman kertas, diunduh berurutan. */
function exportPages(){if(!U.res)return;const g=pageGrid(),b=bounds2(),pad=5/g.mm+U.rad*.15,body=svgBody(g.mm,b,pad),n=g.cols*g.rows;let i=0;
  toast(n+' halaman — izinkan unduhan ganda bila diminta browser.');
  (function next(){if(i>=n)return;HL.download(new Blob([pageSvg(g,body,i,n)],{type:'image/svg+xml'}),(U.name||'pola')+'-hal'+(i+1)+'.svg');i++;setTimeout(next,400)})()}
$('#bSvg').onclick=exportSvg;$('#bSvgP').onclick=()=>openExport();
$('#bPg').onclick=()=>{SHOWPG=!SHOWPG;need2();if(SHOWPG&&U.res){const g=pageGrid();toast(`${g.cols*g.rows} halaman (${g.cols}×${g.rows})`)}};
$('#tabw').oninput=()=>{TABW=$('#tabw').value/100;need2();need3();stat(true);saveSoon()};
$('#paper').onchange=()=>need2();
$('#bTabEd').onclick=()=>{TABEDIT=!TABEDIT;$('#bTabEd').setAttribute('aria-pressed',TABEDIT);if(TABEDIT&&TABW===0){TABW=1;$('#tabw').value=100}
  need2();toast(TABEDIT?'Edit tab: ketuk + untuk menambah, − untuk menghapus tab di sisi itu.':'Edit tab dimatikan.')};
$('#bTabReset').onclick=()=>{if(!TABS.size)return toast('Tab sudah default.');snap();TABS.clear();need2();need3();stat(true);toast('Tab manual dikembalikan ke default.')};
$('#tabdual').onchange=()=>{if(TABS.size&&!confirm('Mengubah mode ini menghapus pengaturan tab manual per edge. Lanjutkan?')){$('#tabdual').checked=TABDUAL;return}snap();TABDUAL=$('#tabdual').checked;TABS.clear();refresh();toast(TABDUAL?'Tab dua sisi: tempel tab ke tab. Ketuk sebuah tab untuk membuangnya.':'Tab satu sisi.')};
/* Ukuran jadi: skala SERAGAM. Mengubah salah satu sisi mengubah skala (1 unit = … mm) → pola unfold & ekspor ikut menyesuaikan. */
function syncSize(skip){const f=v=>String(+v.toFixed(3));
  [['dx',0],['dy',1],['dz',2]].forEach(([id,k])=>{const e=$('#'+id);e.disabled=!(U.ext[k]>1e-9);if(id!==skip)e.value=f(U.ext[k]*MMU)});
  if(skip!=='mm')$('#mm').value=String(+MMU.toPrecision(6));
  $('#dim').textContent='Jadi ≈ '+U.ext.map(x=>fmtMM(x*MMU)).join(' × ')+' mm (L×P×T)';need2();need3()}
$('#mm').oninput=()=>{MMU=+$('#mm').value>0?+$('#mm').value:10;syncSize('mm');saveSoon()};
[['dx',0],['dy',1],['dz',2]].forEach(([id,k])=>$('#'+id).oninput=()=>{const v=+$('#'+id).value;if(!(v>0)||!(U.ext[k]>1e-9))return;MMU=+(v/U.ext[k]).toPrecision(6);syncSize(id);saveSoon()});

/* Kirim pola ke Vector (format sama dengan tombol di app 3D). */
$('#bVec').onclick=()=>{if(!U.res)return;const K=+$('#mm').value||10,b=bounds2(),T=p=>[(p[0]-b[0])*K+60,(p[1]-b[1])*K+60],tabs=tabInfo(),L=patLines(tabs),
  l1={name:'Pola Unfold',shapes:[]},l2={name:'Garis potong',shapes:[]},l3={name:'Garis lipat',shapes:[]};
  if(!STY.lineOnly)tabs.forEach(t=>l1.shapes.push({p:t.poly.map(T),c:1,fill:STY.tab,stroke:STY.tab,sw:.5}));
  if(!STY.lineOnly)U.f.forEach((fc,i)=>l1.shapes.push({p:wp(i).map(T),c:1,fill:STY.face,stroke:STY.face,sw:.5}));
  L.cut.forEach(s=>l2.shapes.push({p:s.p.map(T),c:0,fill:null,stroke:STY.cut,sw:1.5}));
  L.fold.forEach(s=>l3.shapes.push({p:s.p.map(T),c:0,fill:null,stroke:s.t==='mtn'?STY.mtn:STY.val,sw:1.5,dash:1}));
  if(!HL.send('unfold',{layers:[l1,l2,l3]}))return toast('Gagal mengirim (penyimpanan penuh?).');location.href='../vector/?import=unfold'};

(function tick(){if(dirty2){dirty2=false;draw2()}if(dirty3){dirty3=false;draw3()}requestAnimationFrame(tick)})();

/* Sumber mesh, urut prioritas: kiriman dari app 3D (?import=unfold) → simpanan otomatis terakhir → kubus contoh. */
(function init(){let d=null,msg='';
  if(new URLSearchParams(location.search).get('import')==='unfold'){d=HL.take('unfold');msg='Mesh diterima dari 3D Workspace.';history.replaceState(null,'',location.pathname)}
  if(!d)try{d=JSON.parse(localStorage.getItem(STORE)||'null');msg='Proyek terakhir dipulihkan.'}catch(e){}
  if(!(d&&load(d,msg)))load(DEMO,'Belum ada model — memuat kubus contoh.')})();
