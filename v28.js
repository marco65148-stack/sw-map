/* v28: 2.5D oblique-extruded buildings from local OpenFreeMap/OSM-derived chunks (no API key) */
(function(){const map=window.__map;if(!map||!window.L)return;
let IDX=null;const C={},LD={};
fetch('b-idx.json').then(r=>r.json()).then(a=>{IDX=new Set(a);draw()}).catch(()=>{});
map.createPane('bld25');const pane=map.getPane('bld25');pane.style.zIndex=250;pane.style.pointerEvents='none';
const cv=document.createElement('canvas');cv.className='bld25 leaflet-zoom-hide';pane.appendChild(cv);const ctx=cv.getContext('2d');
window.__bld={drawn:0,chunks:0};
function need(){const b=map.getBounds();const ks=[];for(let x=Math.floor(b.getWest()*100);x<=Math.floor(b.getEast()*100);x++)for(let y=Math.floor(b.getSouth()*100);y<=Math.floor(b.getNorth()*100);y++){const k=x+'_'+y;if(IDX&&IDX.has(k))ks.push(k)}return ks}
function load(k){if(C[k]||LD[k])return;LD[k]=1;fetch('b-'+k+'.json').then(r=>r.json()).then(a=>{C[k]=a;sched()}).catch(()=>{LD[k]=0})}
let raf=0;function sched(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;draw()})}
function draw(){const t0=performance.now();try{draw0()}finally{window.__bld.ms=Math.round(performance.now()-t0)}}
function draw0(){const z=map.getZoom(),sz=map.getSize(),dpr=Math.min(devicePixelRatio||1,2);
 const tl=map.containerPointToLayerPoint([0,0]);L.DomUtil.setPosition(cv,tl);
 if(cv.width!=sz.x*dpr||cv.height!=sz.y*dpr){cv.width=sz.x*dpr;cv.height=sz.y*dpr;cv.style.width=sz.x+'px';cv.style.height=sz.y+'px'}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,sz.x,sz.y);window.__bld.drawn=0;
 if(z<15||!IDX)return;const ks=need();ks.forEach(load);
 const LT=document.body.classList.contains('light');
 const ppm=256*Math.pow(2,z)/(40075016*Math.cos(25*Math.PI/180));const k=ppm*(z>=17?.95:z>=16?.8:.5);
 const b=map.getBounds().pad(.15);const W=b.getWest(),E=b.getEast(),S=b.getSouth(),N=b.getNorth();
 const list=[];
 ks.forEach(key=>{const a=C[key];if(!a)return;for(const f of a){if(z<16&&f[0]<20)continue;const g=f[1];const x0=g[0],y0=g[1];if(x0<W||x0>E||y0<S||y0>N)continue;
   const pts=[];let my=-1e9;for(let i=0;i<g.length;i+=2){const p=map.latLngToContainerPoint([g[i+1],g[i]]);pts.push(p.x,p.y);if(p.y>my)my=p.y}
   list.push([my,f[0],pts])}});
 list.sort((a,b)=>a[0]-b[0]);const big=list.length>6000;
 const wall=LT?'rgba(148,163,184,.9)':'rgba(8,20,44,.92)',roof=LT?'rgba(226,232,240,.95)':'rgba(16,38,72,.92)',edge=LT?'rgba(100,116,139,.6)':'rgba(0,229,255,.55)',glow=LT?'rgba(0,0,0,0)':'rgba(0,229,255,.16)';
 ctx.lineJoin='round';
 for(const [my,h,p] of list){const dy=Math.min(h,120)*k,dx=dy*.18;const n=p.length;
  if(!big&&dy>1.5){ctx.fillStyle=wall;ctx.strokeStyle=edge;ctx.lineWidth=.6;
   for(let i=0;i<n-2;i+=2){const ax=p[i],ay=p[i+1],bx=p[i+2],by=p[i+3];if(bx-ax===0&&by-ay===0)continue;
    ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.lineTo(bx-dx,by-dy);ctx.lineTo(ax-dx,ay-dy);ctx.closePath();ctx.fill()}
   ctx.beginPath();for(let i=0;i<n;i+=2){ctx.moveTo(p[i],p[i+1]);ctx.lineTo(p[i]-dx,p[i+1]-dy)}ctx.stroke()}
  const ox=big?0:dx,oy=big?0:dy;ctx.beginPath();ctx.moveTo(p[0]-ox,p[1]-oy);for(let i=2;i<n;i+=2)ctx.lineTo(p[i]-ox,p[i+1]-oy);ctx.closePath();ctx.fillStyle=roof;ctx.fill();
  if(!LT){ctx.strokeStyle=glow;ctx.lineWidth=3;ctx.stroke()}ctx.strokeStyle=edge;ctx.lineWidth=LT?.7:1;ctx.stroke();window.__bld.drawn++}
 window.__bld.chunks=ks.filter(k=>C[k]).length;window.__bld.k=k}
map.on('moveend zoomend resize viewreset',sched);
new MutationObserver(sched).observe(document.body,{attributes:true,attributeFilter:['class']});
sched()})();
/* v28 mobile: one focus at a time — while the filter sheet is open, hide the 建議行程 card */
(function(){const P=document.getElementById('panel');if(!P)return;const f=()=>document.body.classList.toggle('pnl-open',!P.classList.contains('collapsed'));new MutationObserver(f).observe(P,{attributes:true,attributeFilter:['class']});f()})();
