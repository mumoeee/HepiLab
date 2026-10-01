/* mesh.js — data objek, generator primitif (kubus, silinder, ...), edge, helper seleksi. */
let objs=[],sel=null,mode='obj',sm='v',tool='move',uid=1,S={v:new Set,e:new Set,f:new Set};
const et=()=>mode==='edit'?'move':tool;
/* generator mesh: {v:[[x,y,z]], f:[[idx..]]} — wajah = polygon (n-gon), cocok untuk craft */
const GEN={
 cube:()=>({v:Array.from({length:8},(_,i)=>[i&1?.5:-.5,i&2?.5:-.5,i&4?.5:-.5]),f:[[1,3,7,5],[0,4,6,2],[2,6,7,3],[0,1,5,4],[4,5,7,6],[0,2,3,1]]}),
 plane:()=>({v:[[-.5,0,-.5],[-.5,0,.5],[.5,0,.5],[.5,0,-.5]],f:[[0,1,2,3]]}),
 cyl:(n=8)=>{const v=[],f=[],R=i=>i/n*Math.PI*2;for(let i=0;i<n;i++)v.push([Math.cos(R(i))*.5,-.5,Math.sin(R(i))*.5]);for(let i=0;i<n;i++)v.push([Math.cos(R(i))*.5,.5,Math.sin(R(i))*.5]);
  for(let i=0;i<n;i++){const j=(i+1)%n;f.push([i,n+i,n+j,j])}f.push([...Array(n).keys()],[...Array(n).keys()].map(i=>n+i).reverse());return{v,f}},
 cone:(n=8)=>{const v=[[0,.5,0]],f=[],R=i=>i/n*Math.PI*2;for(let i=0;i<n;i++)v.push([Math.cos(R(i))*.5,-.5,Math.sin(R(i))*.5]);
  for(let i=0;i<n;i++)f.push([1+i,0,1+(i+1)%n]);f.push([...Array(n).keys()].map(i=>1+i));return{v,f}}
};
GEN.pyr=()=>GEN.cone(4);
const NAMES={cube:'Kubus',cyl:'Silinder',cone:'Kerucut',pyr:'Piramida',plane:'Bidang'};
function mk(key,color='#d9b382'){const g=GEN[key](),id=uid++,o={id,name:NAMES[key]+' '+id,v:g.v,f:g.f,color,vis:true,mesh:{position:{x:0,y:0,z:0},rotation:{x:0,y:0,z:0},scale:{x:1,y:1,z:1}}};objs.push(o);need();return o}
const rebuild=need,setP=(o,x,y,z)=>Object.assign(o.mesh.position,{x,y,z}),drawEdit=need,tipShape=need;
function edges(o){const m=new Map();o.f.forEach(f=>f.forEach((a,k)=>{const b=f[(k+1)%f.length],key=ek(a,b);if(!m.has(key))m.set(key,[a,b,key])}));return[...m.values()]}
const selV=()=>{const o=sel,s=new Set;if(!o)return s;if(sm==='v')S.v.forEach(i=>s.add(i));if(sm==='e')S.e.forEach(k=>k.split('_').forEach(i=>s.add(+i)));if(sm==='f')S.f.forEach(i=>o.f[i]&&o.f[i].forEach(v=>s.add(v)));return s};
