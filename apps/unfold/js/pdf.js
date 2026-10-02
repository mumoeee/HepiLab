/* pdf.js — ekspor PDF tanpa library: satu halaman kertas per lembar, skala 1:1 (1 unit model = [mm] milimeter), vektor murni.
   Isi: tab lem, face, garis lipat (lembah putus-putus / gunung titik-garis), garis potong, nomor pasangan edge. Font bawaan Helvetica.
   Alur: pdfPrims() → daftar bentuk (mm) · pdfPage() → isi 1 halaman (hanya bentuk yang menyentuh halaman) · pdfBytes() → file PDF. */
const PDFK=72/25.4; // mm → poin

function pdfPrims(mm,b,pad){const r=U.res,P=[],done=new Set,T=p=>[(p[0]-b[0]+pad)*mm,(p[1]-b[1]+pad)*mm];
  const tabs=tabInfo(),L=patLines(tabs);tabs.forEach(t=>P.push({k:'p',pts:t.poly.map(T),fill:'#efe3c8',stroke:null,sw:0}));
  U.f.forEach((fc,i)=>P.push({k:'p',pts:wp(i).map(T),fill:'#fbf8f2',stroke:null,sw:0}));
  L.cut.forEach(s=>P.push({k:'l',pts:s.p.map(T),stroke:'#222222',sw:.4,dash:null}));   // potongan (semua sisi) di bawah
  L.fold.forEach(s=>P.push({k:'l',pts:s.p.map(T),stroke:'#e0457b',sw:.3,dash:s.t==='mtn'?[4,1,.6,1]:[2,1.4]})); // lipatan di atas
  U.f.forEach((fc,i)=>{const Q=wp(i);fc.forEach((a,k)=>{const n=r.cutNo.get(ek(a,fc[(k+1)%fc.length]));if(n==null)return;P.push({k:'t',pts:[T(lblPos(Q,k))],s:String(n),size:2.5})})});
  P.forEach(q=>{const xs=q.pts.map(p=>p[0]),ys=q.pts.map(p=>p[1]),m=q.k==='t'?4:0;q.bb=[Math.min(...xs)-m,Math.min(...ys)-m,Math.max(...xs)+m,Math.max(...ys)+m]});
  return P}

function pdfPage(P,vx,vy,pw,ph,label){const f=n=>r3(n*PDFK),X=x=>f(x-vx),Y=y=>f(ph-(y-vy)),
  col=(h,op)=>{const n=parseInt(h.slice(1),16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255].map(r3).join(' ')+' '+op};
  let c='1 j 1 J\n';
  c+=`0.75 0.75 0.75 RG 0.5 w [3 3] 0 d ${f(MARG)} ${f(MARG)} ${f(pw-2*MARG)} ${f(ph-2*MARG)} re S [] 0 d\n`; // garis margin cetak
  c+=`BT /F1 ${f(2.8)} Tf 0.5 0.5 0.5 rg ${f(MARG)} ${f(ph-4.5)} Td (${label} - skala 1:1, cetak 100% tanpa fit to page) Tj ET\n`;
  for(const q of P){if(q.bb[2]<vx||q.bb[0]>vx+pw||q.bb[3]<vy||q.bb[1]>vy+ph)continue;
    if(q.k==='t'){const p=q.pts[0];c+=`BT /F1 ${f(q.size)} Tf ${col('#222222','rg')} ${X(p[0]-q.s.length*.278*q.size)} ${Y(p[1]+q.size*.35)} Td (${q.s}) Tj ET\n`;continue}
    c+=(q.fill?col(q.fill,'rg')+' ':'')+(q.stroke?col(q.stroke,'RG')+' ':'')+`${f(q.sw)} w ${q.dash?'['+q.dash.map(f).join(' ')+'] 0 d':'[] 0 d'} `;
    c+=q.pts.map((p,i)=>`${X(p[0])} ${Y(p[1])} ${i?'l':'m'}`).join(' ');
    c+=q.k==='p'?(' h '+(q.fill&&q.stroke?'B':q.fill?'f':'S')):' S';c+='\n'}
  return c}

function pdfBytes(pages,pw,ph){const W=r3(pw*PDFK),H=r3(ph*PDFK),o=[],kids=[];
  o[1]='<< /Type /Catalog /Pages 2 0 R >>';o[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  pages.forEach((c,i)=>{const pg=4+i*2;kids.push(pg+' 0 R');
    o[pg]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${pg+1} 0 R >>`;
    o[pg+1]=`<< /Length ${c.length} >>\nstream\n${c}\nendstream`});
  o[2]=`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`;
  let s='%PDF-1.4\n';const off=[];for(let i=1;i<o.length;i++){off[i]=s.length;s+=`${i} 0 obj\n${o[i]}\nendobj\n`}
  const x=s.length;s+=`xref\n0 ${o.length}\n0000000000 65535 f \n`+off.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${o.length} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return new Blob([s],{type:'application/pdf'})}

function exportPdf(){if(!U.res)return;const g=pageGrid(),b=bounds2(),pad=5/g.mm+U.rad*.15,n=g.cols*g.rows;
  if(n>60&&!confirm(n+' halaman. Lanjutkan?'))return;
  const P=pdfPrims(g.mm,b,pad),pages=[];
  for(let i=0;i<n;i++){const c=i%g.cols,q=(i/g.cols)|0;pages.push(pdfPage(P,c*g.cw*g.mm-MARG,q*g.ch*g.mm-MARG,g.pw,g.ph,`Hal ${i+1}/${n}`))}
  HL.download(pdfBytes(pages,g.pw,g.ph),(U.name||'pola')+'.pdf');toast(n+' halaman PDF — cetak skala 100%.')}
$('#bPdf').onclick=exportPdf;
