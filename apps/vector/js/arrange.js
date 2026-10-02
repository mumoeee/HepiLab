/* arrange.js — grup, urutan tumpukan (depan/belakang), balik, dan duplikat/hapus yang paham grup & kurva. */
const newG=()=>'g'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function group(){const ss=selS();if(ss.length<2)return toast('Pilih minimal 2 objek untuk dijadikan grup.');const g=newG();ss.forEach(s=>s.g=g);toast('Objek digrup.');vr()}
function ungroup(){const ss=selS();ss.forEach(s=>{delete s.g});toast('Grup dilepas.');vr()}
function grpExpand(){const gs=new Set(selS().map(s=>s.g).filter(Boolean));if(!gs.size)return;let ch=false;V.sh.forEach(s=>{if(s.g&&gs.has(s.g)&&!V.sel.has(s.id)){V.sel.add(s.id);ch=true}});if(ch){vr();props()}}
function zord(front){const mine=V.sh.filter(s=>V.sel.has(s.id)),rest=V.sh.filter(s=>!V.sel.has(s.id));if(!mine.length)return;V.sh=front?[...rest,...mine]:[...mine,...rest];vr()}
function flip(h){const ss=selS();if(!ss.length)return;const b=bbAll(ss),cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2;ss.forEach(s=>xf(s,q=>h?[2*cx-q[0],q[1]]:[q[0],2*cy-q[1]]));vr();props()}
vdup=function(){const gm={},n=selS().map(s=>{const c=JSON.parse(JSON.stringify(s));c.id=V.nid++;if(c.g){gm[c.g]=gm[c.g]||newG();c.g=gm[c.g]}xf(c,q=>[q[0]+20,q[1]+20]);V.sh.push(c);return c.id});V.sel=new Set(n);vr();props()};
$('#vdup').onclick=vdup;
$('#vdel').onclick=()=>{const s=selS()[0];if(V.tool==='n'&&V.node>=0&&s&&s.p&&s.p.length>2){delNode(s,V.node);V.node=-1;vr();return}V.sh=V.sh.filter(x=>!V.sel.has(x.id));V.sel.clear();vr();props()};
