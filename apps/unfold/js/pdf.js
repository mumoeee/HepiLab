/* pdf.js — ekspor PDF tanpa library: satu halaman kertas per lembar, skala 1:1 (1 unit model = [mm] milimeter), vektor murni.
   Isi: tab lem, face, garis lipat (lembah / gunung), garis potong, nomor pasangan edge, teks buatan pengguna, header & footer (opsi di dialog ekspor).
   Warna garis / isi / tebal garis mengikuti STY (core.js). Font bawaan Helvetica & Helvetica-Bold, encoding WinAnsi (Latin-1 + tanda baca umum).
   Alur: pdfPrims() → daftar bentuk (mm) · pdfPage() → isi 1 halaman (hanya bentuk yang menyentuh halaman) · pdfBytes() → file PDF. */
const PDFK=72/25.4; // mm → poin

/* Teks → string byte WinAnsi (karakter di luar jangkauan jadi '?'), siap diletakkan di dalam ( ) PDF. */
const WANSI={'\u2014':151,'\u2013':150,'\u2018':145,'\u2019':146,'\u201c':147,'\u201d':148,'\u2022':149,'\u2026':133,'\u20ac':128,'\u2122':153};
function pdfStr(s){let o='';for(const ch of String(s)){const c=ch.codePointAt(0);let b=63;
  if(WANSI[ch]!==undefined)b=WANSI[ch];else if((c>=32&&c<=126)||(c>=160&&c<=255))b=c;o+=String.fromCharCode(b)}
  return o.replace(/[\\()]/g,m=>'\\'+m)}
/* Lebar karakter Helvetica (per 1000 em) ASCII 32..126 — untuk rata kiri/tengah/kanan & kotak sentuh teks. Tebal ≈ ×1.07. */
const HW=[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,
 556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,
 667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,
 278,278,278,469,556,333,
 556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,
 334,260,334,584];
const tw=(s,sz,b)=>{let w=0;for(const ch of String(s)){const c=ch.charCodeAt(0);w+=c>=32&&c<=126?HW[c-32]:556}return w/1000*sz*(b?1.07:1)}; // lebar dalam satuan sz (mm)
/* Token di header/footer: {nama} {hal} {total} {tgl} {skala} {ukuran} */
const fmtTok=(s,i,n)=>String(s).replace(/\{(nama|hal|total|tgl|skala|ukuran)\}/g,(_,k)=>k==='nama'?U.name:k==='hal'?i+1:k==='total'?n:
  k==='tgl'?new Date().toLocaleDateString('id-ID'):k==='skala'?'1 unit = '+fmtMM(MMU)+' mm':U.ext.map(x=>fmtMM(x*MMU)).join(' x ')+' mm');
const HFY=()=>Math.min(MARG-1,PDFO.hs*.9+1.5); // baseline header (mm dari atas kertas), selalu di dalam margin

function pdfPrims(mm,b,pad){const r=U.res,P=[],T=p=>[(p[0]-b[0]+pad)*mm,(p[1]-b[1]+pad)*mm];
  const tabs=tabInfo(),L=patLines(tabs);
  if(!STY.lineOnly){tabs.forEach(t=>P.push({k:'p',pts:t.poly.map(T),fill:STY.tab,stroke:null,sw:0}));
    U.f.forEach((fc,i)=>P.push({k:'p',pts:wp(i).map(T),fill:STY.face,stroke:null,sw:0}))}
  L.cut.forEach(s=>P.push({k:'l',pts:s.p.map(T),stroke:STY.cut,sw:STY.wc,dash:null}));   // potongan (semua sisi) di bawah
  L.fold.forEach(s=>P.push({k:'l',pts:s.p.map(T),stroke:s.t==='mtn'?STY.mtn:STY.val,sw:STY.wf,dash:s.t==='mtn'?[4,1,.6,1]:[2,1.4]})); // lipatan di atas
  if(STY.num)U.f.forEach((fc,i)=>{const Q=wp(i);fc.forEach((a,k)=>{const n=r.cutNo.get(ek(a,fc[(k+1)%fc.length]));if(n==null)return;P.push({k:'t',pts:[T(lblPos(Q,k))],s:String(n),size:2.5})})});
  TXT.forEach(t=>{if(!t.s)return;const p=T([t.x,t.y]),R=Math.max(tw(t.s,t.sz,t.b)/2,t.sz)+1;P.push({k:'x',pts:[p],t,bb:[p[0]-R,p[1]-R,p[0]+R,p[1]+R]})});
  P.forEach(q=>{if(q.bb)return;const xs=q.pts.map(p=>p[0]),ys=q.pts.map(p=>p[1]),m=q.k==='t'?4:0;q.bb=[Math.min(...xs)-m,Math.min(...ys)-m,Math.max(...xs)+m,Math.max(...ys)+m]});
  return P}

function pdfPage(P,vx,vy,pw,ph,pi,n){const f=m=>r3(m*PDFK),X=x=>f(x-vx),Y=y=>f(ph-(y-vy)),
  col=(h,op)=>{const k=parseInt(h.slice(1),16);return[(k>>16&255)/255,(k>>8&255)/255,(k&255)/255].map(r3).join(' ')+' '+op},
  hf=(txt,sz,al,colr,yTop,bold)=>{if(!txt)return'';const s=fmtTok(txt,pi,n),w=tw(s,sz,bold),x=al==='c'?(pw-w)/2:al==='r'?pw-MARG-w:MARG;
    return`BT /F${bold?2:1} ${f(sz)} Tf ${col(colr,'rg')} ${f(x)} ${f(ph-yTop)} Td (${pdfStr(s)}) Tj ET\n`};
  let c='1 j 1 J\n';
  if(PDFO.mg)c+=`0.75 0.75 0.75 RG 0.5 w [3 3] 0 d ${f(MARG)} ${f(MARG)} ${f(pw-2*MARG)} ${f(ph-2*MARG)} re S [] 0 d\n`; // garis margin cetak
  c+=hf(PDFO.hd,PDFO.hs,PDFO.ha,PDFO.hc,HFY(),PDFO.hb)+hf(PDFO.ft,PDFO.fs,PDFO.fa,PDFO.fc,ph-3,false);
  for(const q of P){if(q.bb[2]<vx||q.bb[0]>vx+pw||q.bb[3]<vy||q.bb[1]>vy+ph)continue;
    if(q.k==='t'){const p=q.pts[0];c+=`BT /F1 ${f(q.size)} Tf ${col('#222222','rg')} ${X(p[0]-q.s.length*.278*q.size)} ${Y(p[1]+q.size*.35)} Td (${q.s}) Tj ET\n`;continue}
    if(q.k==='x'){const t=q.t,p=q.pts[0],w=tw(t.s,t.sz,t.b),a=-(t.rot||0)*Math.PI/180,co=Math.cos(a),si=Math.sin(a),cx=p[0]-vx,cy=ph-(p[1]-vy),ox=-w/2,oy=-t.sz*.35; // putar searah jarum jam (layar) = sudut negatif di PDF
      c+=`BT /F${t.b?2:1} ${f(t.sz)} Tf ${col(t.c,'rg')} ${r3(co)} ${r3(si)} ${r3(-si)} ${r3(co)} ${f(cx+ox*co-oy*si)} ${f(cy+ox*si+oy*co)} Tm (${pdfStr(t.s)}) Tj ET\n`;continue}
    c+=(q.fill?col(q.fill,'rg')+' ':'')+(q.stroke?col(q.stroke,'RG')+' ':'')+`${f(q.sw)} w ${q.dash?'['+q.dash.map(f).join(' ')+'] 0 d':'[] 0 d'} `;
    c+=q.pts.map((p,i)=>`${X(p[0])} ${Y(p[1])} ${i?'l':'m'}`).join(' ');
    c+=q.k==='p'?(' h '+(q.fill&&q.stroke?'B':q.fill?'f':'S')):' S';c+='\n'}
  return c}

function pdfBytes(pages,pw,ph){const W=r3(pw*PDFK),H=r3(ph*PDFK),o=[],kids=[],fb=4+pages.length*2;
  o[1]='<< /Type /Catalog /Pages 2 0 R >>';o[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  pages.forEach((c,i)=>{const pg=4+i*2;kids.push(pg+' 0 R');
    o[pg]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 ${fb} 0 R >> >> /Contents ${pg+1} 0 R >>`;
    o[pg+1]=`<< /Length ${c.length} >>\nstream\n${c}\nendstream`});
  o[fb]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  o[2]=`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`;
  let s='%PDF-1.4\n';const off=[];for(let i=1;i<o.length;i++){off[i]=s.length;s+=`${i} 0 obj\n${o[i]}\nendobj\n`}
  const x=s.length;s+=`xref\n0 ${o.length}\n0000000000 65535 f \n`+off.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${o.length} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i)&255;   // 1 karakter = 1 byte (offset xref tetap benar)
  return new Blob([u],{type:'application/pdf'})}

function exportPdf(){if(!U.res)return;const g=pageGrid(),b=bounds2(),pad=5/g.mm+U.rad*.15,n=g.cols*g.rows;
  if(n>60&&!confirm(n+' halaman. Lanjutkan?'))return;
  const P=pdfPrims(g.mm,b,pad),pages=[];
  for(let i=0;i<n;i++){const c=i%g.cols,q=(i/g.cols)|0;pages.push(pdfPage(P,c*g.cw*g.mm-MARG,q*g.ch*g.mm-MARG,g.pw,g.ph,i,n))}
  HL.download(pdfBytes(pages,g.pw,g.ph),(U.name||'pola')+'.pdf');toast(n+' halaman PDF — cetak skala 100%.')}
$('#bPdf').onclick=()=>openExport(); // dialog ekspor (extras.js): edit header/footer/warna, pratinjau, lalu unduh
