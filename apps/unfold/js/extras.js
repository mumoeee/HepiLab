/* extras.js — fitur "produk": gaya garis (warna/tebal/tanpa isi), teks buatan pengguna pada pola, dan dialog ekspor (header/footer + pratinjau halaman).
   Data (STY, TXT, PDFO) ada di core.js; ekspor-nya di main.js (SVG) & pdf.js (PDF). Dimuat sebelum main.js. */
const okc=c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c); // hanya #rrggbb (aman disisipkan ke SVG/PDF)
const cssVars=()=>{const s=document.documentElement.style;s.setProperty('--lc-cut',STY.cut);s.setProperty('--lc-val',STY.val);s.setProperty('--lc-mtn',STY.mtn)};
const dlgOpen=()=>!$('#dlg').hidden;
let pvT=0,PVI=0,editing=false;

/* Bersihkan data dari file/penyimpanan (bisa dari sumber luar) sebelum dipakai. */
function cleanExtras(){
  for(const k of['cut','val','mtn','face','tab'])if(!okc(STY[k]))STY[k]=STY0[k];
  for(const k of['wc','wf'])STY[k]=Number.isFinite(+STY[k])?clamp(+STY[k],.05,3):STY0[k];
  STY.lineOnly=!!STY.lineOnly;STY.num=STY.num!==false;
  for(const k of['hd','ft'])PDFO[k]=typeof PDFO[k]==='string'?PDFO[k].slice(0,200):PDFO0[k];
  for(const k of['hs','fs'])PDFO[k]=Number.isFinite(+PDFO[k])?clamp(+PDFO[k],1,6):PDFO0[k];
  for(const k of['ha','fa'])if(typeof PDFO[k]!=='string'||PDFO[k].length!==1||!'lcr'.includes(PDFO[k]))PDFO[k]='l';
  for(const k of['hc','fc'])if(!okc(PDFO[k]))PDFO[k]=PDFO0[k];
  PDFO.mg=PDFO.mg!==false;PDFO.hb=PDFO.hb!==false}
/* Dipanggil load(): gaya & opsi ekspor hanya diganti bila ada di data; teks selalu mengikuti model (kosong bila tidak ada). */
function loadExtras(d){
  if(d.sty&&typeof d.sty==='object')Object.assign(STY,d.sty);
  if(d.pdfo&&typeof d.pdfo==='object')Object.assign(PDFO,d.pdfo);
  cleanExtras();TXT.length=0;TSEL=-1;
  if(Array.isArray(d.txt))d.txt.slice(0,100).forEach(t=>{if(t&&typeof t.s==='string'&&Number.isFinite(t.x)&&Number.isFinite(t.y))
    TXT.push({s:t.s.slice(0,200),x:t.x,y:t.y,sz:clamp(+t.sz||4,.5,100),c:okc(t.c)?t.c:'#222222',rot:Number.isFinite(+t.rot)?+t.rot:0,b:!!t.b})});
  syncExtras()}
function syncExtras(){renderTxt();syncSty();cssVars()}

/* ---------- Gaya garis (panel samping + dialog ekspor memakai markup yang sama) ---------- */
function styHTML(){const sw=(k,l)=>`<label><input type="color" data-sty="${k}"><span>${l}</span></label>`,
  num=(k,l)=>`<label><span>${l}</span><input type="number" data-sty="${k}" min=".05" max="3" step=".05"><em>mm</em></label>`;
  return `<div class="sh">Garis</div><div class="sw3">${sw('cut','Potongan')}${sw('val','Lembah')}${sw('mtn','Gunung')}</div>`
   +`<div class="nums">${num('wc','Tebal potong')}${num('wf','Tebal lipat')}</div>`
   +`<div class="sh">Isi</div><label class="chk"><input type="checkbox" data-sty="lineOnly"><span>Garis saja (tanpa warna isi)</span></label><div class="sw3 two">${sw('face','Face')}${sw('tab','Tab')}</div>`
   +`<label class="chk"><input type="checkbox" data-sty="num"><span>Nomor edge di ekspor</span></label><div class="gb" style="margin-top:8px"><button data-styreset>↺ Reset gaya</button></div>`}
function syncSty(skip){document.querySelectorAll('[data-sty]').forEach(el=>{if(el===skip)return;const v=STY[el.dataset.sty];if(el.type==='checkbox')el.checked=!!v;else el.value=v});
  document.querySelectorAll('[data-sty=face],[data-sty=tab]').forEach(el=>el.disabled=STY.lineOnly)}
function applySty(){cssVars();need2();saveSoon();schedPv()}
$('#styBox').innerHTML=styHTML();
document.addEventListener('input',e=>{const el=e.target,k=el.dataset&&el.dataset.sty;if(!k)return;
  let v=el.type==='checkbox'?el.checked:el.type==='number'?+el.value:el.value;
  if(el.type==='number'){if(!(v>0))return;v=clamp(v,.05,3)}
  STY[k]=v;syncSty(el);applySty()});
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('[data-styreset]')){Object.assign(STY,STY0);syncSty();applySty()}});

/* ---------- Teks pada pola ---------- */
function renderTxt(){const L=$('#txtList');if(!L)return;
  L.innerHTML=TXT.map((t,i)=>`<div class="trow${i===TSEL?' on':''}" data-i="${i}"><input type="text" data-t="s" value="${xe(t.s)}" maxlength="200" placeholder="Tulis teks…">
   <div class="trow2"><input type="number" data-t="sz" value="${t.sz}" min=".5" max="100" step=".5" title="Tinggi huruf (mm)"><input type="number" data-t="rot" value="${t.rot}" step="5" title="Putar (derajat, searah jarum jam)">
   <input type="color" data-t="c" value="${t.c}"><label title="Tebal" style="display:inline-flex;gap:3px;align-items:center"><input type="checkbox" data-t="b"${t.b?' checked':''}><b>B</b></label><button data-t="del" title="Hapus teks">✕</button></div></div>`).join('')
   ||'<div class="mu" style="font-size:11px;margin-top:6px">Belum ada teks. Tambah lalu seret di pola 2D untuk memindahkan.</div>';
  const on=L.querySelector('.trow.on');if(on)on.scrollIntoView({block:'nearest'})}
function addTxt(){if(!U.res)return;snap();const w=s2w(W2/2,H2/2);TXT.push({s:'Teks',x:w[0],y:w[1],sz:4,c:'#222222',rot:0,b:false});TSEL=TXT.length-1;
  renderTxt();need2();saveSoon();const i=document.querySelector(`#txtList .trow[data-i="${TSEL}"] [data-t=s]`);if(i){i.focus();i.select()}}
function delTxt(i){if(!TXT[i])return;snap();TXT.splice(i,1);TSEL=-1;renderTxt();need2();saveSoon();schedPv()}
$('#bTxtAdd').onclick=addTxt;
$('#bTxt').onclick=()=>{addTxt();$('#wU').classList.add('sp')}; // HP: buka laci panel untuk mengetik
{const L=$('#txtList');
 L.addEventListener('focusin',e=>{const r=e.target.closest('.trow');if(!r)return;const i=+r.dataset.i;
   if(i!==TSEL){TSEL=i;L.querySelectorAll('.trow').forEach(x=>x.classList.toggle('on',+x.dataset.i===i));need2()}});
 L.addEventListener('focusout',()=>{editing=false});
 L.addEventListener('input',e=>{const el=e.target,r=el.closest('.trow'),k=el.dataset.t;if(!r||!k)return;const t=TXT[+r.dataset.i];if(!t)return;
   if(!editing){snap();editing=true}                       // satu langkah undo per sesi mengetik
   if(k==='s')t.s=el.value;
   else if(k==='sz'){const v=+el.value;if(!(v>0))return;t.sz=clamp(v,.5,100)}
   else if(k==='rot'){const v=+el.value;if(!Number.isFinite(v))return;t.rot=v}
   else if(k==='c')t.c=el.value;else if(k==='b')t.b=el.checked;
   need2();saveSoon();schedPv()});
 L.addEventListener('click',e=>{const b=e.target.closest('[data-t=del]');if(b)delTxt(+b.closest('.trow').dataset.i)})}
addEventListener('keydown',e=>{if(e.key==='Escape'&&dlgOpen()){e.preventDefault();closeExport();return}
  if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  if((e.key==='Delete'||e.key==='Backspace')&&TSEL>=0){e.preventDefault();delTxt(TSEL)}});

/* Ukuran & hit-test teks (satuan model). Lebar diperkirakan dari tabel Helvetica yang sama dengan PDF. */
const txtW=t=>tw(t.s,t.sz,t.b)/MMU, txtR=t=>Math.max(tw(t.s,t.sz,t.b)/2,t.sz)/MMU;
function hitTxt(w){for(let i=TXT.length-1;i>=0;i--){const t=TXT[i];if(!t.s)continue;const a=-(t.rot||0)*Math.PI/180,dx=w[0]-t.x,dy=w[1]-t.y,
    lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);
  if(Math.abs(lx)<=txtW(t)/2+6/V2.s&&Math.abs(ly)<=t.sz/MMU*.6+6/V2.s)return i}return-1}
/* Digambar di dalam transform dunia 2D (dipanggil dari draw2). Skala lokal 100px agar font tidak terlalu kecil bagi canvas. */
function drawTxt2(){const px=1/V2.s;x2.setLineDash([]);x2.textAlign='center';x2.textBaseline='middle';
  TXT.forEach((t,i)=>{if(!t.s)return;const h=t.sz/MMU,k=h/100;x2.save();x2.translate(t.x,t.y);x2.rotate((t.rot||0)*Math.PI/180);x2.scale(k,k);
    x2.font=`${t.b?'bold ':''}100px Helvetica,Arial,sans-serif`;const w=x2.measureText(t.s).width,p=3*px/k;
    x2.fillStyle='rgba(255,255,255,.16)';x2.fillRect(-w/2-p,-60-p,w+2*p,120+2*p);   // alas tipis agar teks gelap tetap terbaca di kanvas gelap (tidak ikut ekspor)
    x2.fillStyle=t.c;x2.fillText(t.s,0,0);
    if(i===TSEL){x2.strokeStyle='#5fc4b5';x2.lineWidth=1.4*px/k;x2.setLineDash([6*px/k,4*px/k]);x2.strokeRect(-w/2-p,-60-p,w+2*p,120+2*p)}
    x2.restore()})}

/* ---------- Dialog ekspor: header/footer, warna, pratinjau halaman, lalu unduh ---------- */
function schedPv(){if(!dlgOpen())return;clearTimeout(pvT);pvT=setTimeout(drawPv,120)}
function drawPv(){if(!U.res||!dlgOpen())return;const g=pageGrid(),b=bounds2(),pad=5/g.mm+U.rad*.15,n=g.cols*g.rows;
  PVI=clamp(PVI,0,n-1);$('#pv').innerHTML=pageSvg(g,svgBody(g.mm,b,pad),PVI,n,true);$('#pvL').textContent=`Hal ${PVI+1} / ${n}`}
function closeExport(){const D=$('#dlg');D.hidden=true;D.innerHTML=''}
function openExport(){if(!U.res)return;$('#wU').classList.remove('sp');const D=$('#dlg');
  const al=k=>`<select data-p="${k}"><option value="l">Kiri</option><option value="c">Tengah</option><option value="r">Kanan</option></select>`;
  D.innerHTML=`<div class="dlgp" role="dialog" aria-label="Ekspor halaman"><div class="dlgh"><b>Ekspor halaman (PDF / SVG)</b><button id="dX" title="Tutup (Esc)">✕</button></div>
   <div class="dlgb"><div>
    <fieldset><legend>Header</legend><input type="text" data-p="hd" maxlength="200" placeholder="Judul di atas tiap halaman">
     <div class="dr"><input type="number" data-p="hs" min="1" max="6" step=".5" title="Tinggi huruf (mm)"><span class="mu">mm</span>${al('ha')}<input type="color" data-p="hc"><label class="chk" style="margin:0"><input type="checkbox" data-p="hb"><span>Tebal</span></label></div></fieldset>
    <fieldset><legend>Footer</legend><input type="text" data-p="ft" maxlength="200" placeholder="Catatan di bawah tiap halaman">
     <div class="dr"><input type="number" data-p="fs" min="1" max="6" step=".5" title="Tinggi huruf (mm)"><span class="mu">mm</span>${al('fa')}<input type="color" data-p="fc"></div></fieldset>
    <div class="mu" style="font-size:11px;margin:-4px 0 10px">Token: {nama} {hal} {total} {tgl} {skala} {ukuran}. Kosongkan kolom untuk menyembunyikan.</div>
    <fieldset><legend>Halaman</legend><div class="dr" style="margin-top:0"><span>Kertas</span><select data-paper>${$('#paper').innerHTML}</select></div>
     <label class="chk"><input type="checkbox" data-p="mg"><span>Garis margin cetak</span></label></fieldset>
    <fieldset><legend>Gaya garis</legend><div id="dlgSty">${styHTML()}</div></fieldset>
   </div><div><div class="pvbar"><button id="pvP">‹</button><span id="pvL" class="mu"></span><button id="pvN">›</button></div><div id="pv"></div>
    <div class="mu" style="font-size:11px;margin-top:6px">Pratinjau ±, garis margin cetak & teks pola (tambah dari panel "Teks") ikut terekspor.</div></div></div>
   <div class="dlgf2"><button id="dClose">Tutup</button><button id="dSvg">⇩ SVG per halaman</button><button id="dPdf" class="pri">⇩ Unduh PDF</button></div></div>`;
  D.hidden=false;
  D.querySelectorAll('[data-p]').forEach(el=>{const v=PDFO[el.dataset.p];if(el.type==='checkbox')el.checked=!!v;else el.value=v});
  D.querySelector('[data-paper]').value=$('#paper').value;syncSty();PVI=0;drawPv()}
$('#dlg').addEventListener('click',e=>{const t=e.target;
  if(t.id==='dlg'||t.id==='dX'||t.id==='dClose')closeExport();
  else if(t.id==='dPdf')exportPdf();else if(t.id==='dSvg')exportPages();
  else if(t.id==='pvP'){PVI--;drawPv()}else if(t.id==='pvN'){PVI++;drawPv()}});
document.addEventListener('input',e=>{const el=e.target,k=el.dataset&&el.dataset.p;if(!k)return;
  let v=el.type==='checkbox'?el.checked:el.type==='number'?+el.value:el.value;
  if(el.type==='number'){if(!(v>0))return;v=clamp(v,1,6)}
  PDFO[k]=v;saveSoon();schedPv()});
document.addEventListener('change',e=>{if(e.target.dataset&&e.target.dataset.paper!==undefined){$('#paper').value=e.target.value;need2();PVI=0;schedPv()}});
syncExtras();
