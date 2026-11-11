/* v36：新增「🚛 大安文山 11/11」車掃路線（明洲 2026-11-11 原稿，獨立一條，可切原稿版／建議版）。v35：新增「🚛 王世堅陪掃」規劃路線（全程不停車，標示重點經過點與預估經過時間）。v34：車隊掃街路線（大安／文山／大安文山），可切「原稿版／建議版」。🚛 標示＋水流動態顯示行進方向。路線依 OSM（Geofabrik 2026-11-08）路網照原稿逐段推算、遵守 OSM 禁轉，無 API key。 */
(function(){
const $=id=>document.getElementById(id);
const BASE=window.__SWBASE!=null?window.__SWBASE:'';
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const AR={'左轉':'⬅','右轉':'➡','直行':'⬆','迴轉':'↩','抵達':'🏁'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let VER='o',R=null,cur=null,map=null,LG=null,TR=null,truck=null,done=null,prog=0,play=!RM,cv,cx,P2=[],lastT=0,lastDone=0,zm=false,dpr=Math.min(2,devicePixelRatio||1),hold=0;
function go(){map=window.__map;if(!map||!$('swp')||!window.__swG)return setTimeout(go,200);init()}
function dark(){return !document.body.classList.contains('light')}
function init(){
 const h=$('swp').querySelector('.swp-h');
 h.insertAdjacentHTML('afterend',`<div id="mcbar" role="tablist" aria-label="車掃路線切換"><button type="button" data-r="" class="on" aria-pressed="true">🧹 各里</button><button type="button" data-r="daan" aria-pressed="false">🚛 大安</button><button type="button" data-r="wenshan" aria-pressed="false">🚛 文山</button><button type="button" data-r="dw" aria-pressed="false">🚛 大安文山</button><button type="button" data-r="wsj" aria-pressed="false">🚛 王世堅陪掃</button><button type="button" data-r="dw11" aria-pressed="false">🚛 大安文山 11/11</button></div><div id="mcb" class="swp-b"></div>`);
 $('mcbar').querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();pick(b.dataset.r)});
 LG=L.layerGroup();
 map.createPane('mcLine').style.zIndex=615;map.createPane('mcTop').style.zIndex=660;map.createPane('mcflowp').style.zIndex=630;map.getPane('mcflowp').style.pointerEvents='none';
 cv=document.createElement('canvas');cv.id='mcflowc';map.getPane('mcflowp').appendChild(cv);cx=cv.getContext('2d');
 map.on('resize',size);const zs=()=>document.body.classList.toggle('mc-zs',map.getZoom()<15);map.on('zoomend',zs);zs();map.on('moveend',proj);map.on('zoomstart',()=>{zm=true;cx.clearRect(0,0,cv.width,cv.height)});map.on('zoomend',()=>{zm=false;if(cur){drawArrows();proj()}});
 size();requestAnimationFrame(frame);
 new MutationObserver(()=>{if(cur&&!document.body.classList.contains('m-sw'))off(false)}).observe(document.body,{attributes:true,attributeFilter:['class']});
 const fli=$('fli');if(fli)fli.addEventListener('change',()=>{if(cur)off(true)});
 window.__mc={pick,ver:v=>cur&&pick(cur.id,v),state:()=>({on:!!cur,id:cur&&cur.id,v:cur&&cur.v,ver:VER,prog,play,km:cur&&cur.tot,pts:cur&&cur.pts.length,visible:P2.length}),routes:()=>R&&R.map(r=>({id:r.id,v:r.v,name:r.name,tot:r.tot,legs:r.legs.length,same:!!r.same}))};
}
async function load(){if(R)return R;const r=await fetch(BASE+'mc36.json');if(!r.ok)throw Error('HTTP '+r.status);R=await r.json();R.forEach(prep);return R}
function prep(r){const c=[0];for(let i=1;i<r.pts.length;i++)c.push(c[i-1]+map.distance(r.pts[i-1],r.pts[i]));r.cum=c}
function setBtns(id){$('mcbar').querySelectorAll('button').forEach(b=>{const o=b.dataset.r===(id||'');b.classList.toggle('on',o);b.setAttribute('aria-pressed',o)})}
async function pick(id,ver){if(ver)VER=ver;
 if(!id){off(true);return}
 if(window.__MODE!=='sw'){window.__setMode('sw');window.__chips&&__chips.sync()}
 let rs;try{rs=await load()}catch(e){$('mcb').innerHTML='<div class="mc-err">車隊路線載入失敗：'+esc(e.message)+'</div>';$('swp').classList.add('mc');return}
 const r=rs.find(x=>x.id===id&&x.v===VER)||rs.find(x=>x.id===id&&x.v==='o');if(!r)return;const same=cur&&cur.id===id;
 Object.values(window.__swG).forEach(g=>map.removeLayer(g));window.__mcOn=true;
 document.body.classList.add('mc-on');cur=r;prog=0;hold=0;play=!RM;setBtns(id);$('swp').classList.add('mc');$('swp').classList.remove('min');
 const nv=$('swnav');if(nv)nv.classList.add('mc-hide');
 draw();panel();if(!same||innerWidth>760)fit()}
function off(restore){
 if(!cur&&!window.__mcOn){setBtns('');return}
 cur=null;window.__mcOn=false;document.body.classList.remove('mc-on');LG.clearLayers();map.removeLayer(LG);P2=[];cx.clearRect(0,0,cv.width,cv.height);
 $('swp').classList.remove('mc');setBtns('');const nv=$('swnav');if(nv)nv.classList.remove('mc-hide');
 if(restore&&window.__MODE==='sw'){Object.values(window.__swG).forEach(g=>g.addTo(map));window.__swRender&&window.__swRender(true)}}
function fit(){const b=L.latLngBounds(cur.pts);const m=innerWidth<=760;const P=$('swp');if(m)P.classList.add('min');
 const sh=m?P.offsetHeight:0;const pn=$('panel');const pr=pn&&getComputedStyle(pn).display!=='none'?pn.getBoundingClientRect():null;const rp=!m&&pr&&pr.width>0&&pr.left>innerWidth/2?innerWidth-pr.left+16:70;
 map.fitBounds(b,{paddingTopLeft:[m?16:450,m?130:130],paddingBottomRight:[m?60:rp,m?sh+16:30],maxZoom:16})}
// ---- drawing ----
let arwG=null;
function pieces(r){const cut=new Set([0,r.pts.length-1]);const dash=[];r.legs.forEach(l=>{if(l.dash){cut.add(l.dash[0]);cut.add(l.dash[1]);dash.push(l.dash)}});
 const ks=[...cut].sort((a,b)=>a-b),out=[];for(let i=1;i<ks.length;i++){const a=ks[i-1],b=ks[i];if(b<=a)continue;out.push({g:r.pts.slice(a,b+1),d:dash.some(([x,y])=>a>=x&&b<=y),a,b})}return out}
function draw(){const r=cur;LG.clearLayers();LG.addTo(map);const z=map.getZoom();
 const W=7;pieces(r).forEach(p=>{
  L.polyline(p.g,{pane:'mcLine',color:'#111827',weight:W+6,opacity:.9,interactive:false,lineCap:'round',lineJoin:'round'}).addTo(LG);
  L.polyline(p.g,{pane:'mcLine',color:'#fff',weight:W+2,opacity:1,interactive:false,lineCap:'round',lineJoin:'round'}).addTo(LG);
  L.polyline(p.g,{pane:'mcLine',color:p.d?'#e8590c':r.color,weight:W-1,opacity:1,dashArray:p.d?'10 9':null,lineCap:p.d?'butt':'round',lineJoin:'round'}).bindPopup(`<div class="pp-h">🚛 車隊掃街｜${esc(r.name)}</div>${p.d?'⚠ 原稿寫法在路網上走不通或禁轉，這段是替代走法（虛線）':(r.stops?'規劃路線':r.v==='s'?'建議版路線':'照原稿路線')}`).addTo(LG)});
 done=L.polyline([],{pane:'mcLine',color:dark()?'#0b1220':'#ffffff',weight:W+4,opacity:.55,interactive:false,lineCap:'round',lineJoin:'round'}).addTo(LG);
 arwG=L.layerGroup().addTo(LG);drawArrows();
 r.legs.forEach((l,k)=>{if(k===r.legs.length-1)return;const p=r.pts[l.i1];
  L.marker(p,{pane:'mcTop',zIndexOffset:1500+l.n,icon:L.divIcon({className:'mc-tnw',iconSize:[22,22],iconAnchor:[11,11],html:`<div class="mc-tn" style="border-color:${r.color}">${l.n}</div>`})}).bindPopup(pop(l)).addTo(LG)});
 r.legs.forEach(l=>{if(!l.lv)return;L.marker(l.fp,{pane:'mcTop',zIndexOffset:5000,icon:L.divIcon({className:'',iconSize:[26,26],iconAnchor:[13,30],html:`<div class="mc-fl ${l.lv}"><span>${l.lv==='warn'?'!':'i'}</span></div>`})}).bindPopup(pop(l)).addTo(LG)});
 (r.stops||[]).forEach((s,k)=>{L.marker(s.ll,{pane:'mcTop',zIndexOffset:7000,title:s.name,icon:L.divIcon({className:'',iconSize:[0,0],html:`<div class="mc-stop ${s.kind}"><b>📍${k+1}</b><span>${esc(s.name)}・${esc(s.clock)}</span></div>`})}).bindPopup(spop(s,k)).addTo(LG)});
 L.marker(r.hq,{pane:'mcTop',interactive:false,zIndexOffset:6000,icon:L.divIcon({className:'',iconSize:[0,0],html:'<div class="flag st mc-hq"><i class="chk"></i>競選總部（起點＝終點）</div>'})}).addTo(LG);
 truck=L.marker(r.pts[0],{pane:'mcTop',interactive:false,keyboard:false,zIndexOffset:8000,icon:L.divIcon({className:'',iconSize:[34,34],iconAnchor:[17,17],html:`<div class="mc-truck" style="box-shadow:0 0 0 3px ${r.color},0 2px 8px #0009"><span>🚛</span></div>`})}).addTo(LG);
 TR=null;place();proj()}
function drawArrows(){if(!arwG||!cur)return;arwG.clearLayers();const z=map.getZoom();if(z<13)return;const gap=z>=17?80:z>=16?100:z>=15?120:150;const pts=cur.pts.map(p=>map.project(L.latLng(p),z));let acc=gap/2;
 for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],d=a.distanceTo(b);if(!d)continue;while(acc<=d){const t=acc/d,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI+90;
  L.marker(map.unproject(L.point(x,y),z),{pane:'mcTop',interactive:false,keyboard:false,icon:L.divIcon({className:'',iconSize:[10,10],iconAnchor:[5,5],html:`<div class="arw mc-arw" style="transform:rotate(${ang}deg)"></div>`})}).addTo(arwG);acc+=gap}acc-=d}}
function spop(s,k){return `<div class="pp-h">📍 經過點 ${k+1}｜${esc(s.name)}</div><div><b>預估 ${esc(s.clock)} 經過</b>（${esc(cur&&cur.dep||'16:00')} 出發、全程不停車、第 ${s.km} km）</div><div class="mc-via">${esc(s.why)}</div><div class="mc-via"><a href="${esc(s.src)}" target="_blank" rel="noopener">資料來源</a></div>`}
function pop(l){const ar=AR[l.turn]||'⬆';const diff=l.lv==='warn'&&l.got&&l.got!==l.turn&&l.got!=='抵達';
 return `<div class="pp-h">第 ${l.n} 步｜${ar} ${esc(l.turn)} ${esc(l.next)}</div><div class="mc-src">原稿：${esc(l.text)}</div>`+(diff?`<div><b>實際：${esc(l.got)}</b></div>`:'')+`<div class="mc-via">沿 ${l.roads.map(x=>esc(x[0])+' '+x[1]+' m').join('→')}</div>`+(l.note?`<div class="mc-note ${l.lv}">${l.lv==='warn'?'⚠':'ℹ'} ${esc(l.note)}</div>`:'')}
function panel(){const r=cur;const km=(r.tot/1000).toFixed(2);const min=Math.round(r.tot/1000/15*60);const nw=r.legs.filter(l=>l.lv==='warn').length,ni=r.legs.filter(l=>l.lv==='info').length;
 const VN=r.vname||(r.v==='s'?'建議版':'原稿版');const o=R.find(x=>x.id===r.id&&x.v==='o'),s=R.find(x=>x.id===r.id&&x.v==='s');
 $('swt').textContent=`車隊掃街｜${r.name}（${VN}）・${km} km`;
 const dk=s?((s.tot-o.tot)/1000):0,dl=s?(s.legs.length-o.legs.length):0;
 const vb=`<div id="mcver" role="group" aria-label="版本"><button type="button" data-v="o" class="${r.v==='o'?'on':''}" aria-pressed="${r.v==='o'}">📝 原稿版</button><button type="button" data-v="s" class="${r.v==='s'?'on':''}" aria-pressed="${r.v==='s'}" ${s?'':'disabled title="這條沒有建議版"'}>💡 建議版</button></div>`+
  (s?`<div class="mc-vd">${r.v==='s'?'建議版':'另有建議版'}：${(s.tot/1000).toFixed(2)} km・${s.legs.length} 步（比原稿版 ${dk>=0?'+':''}${dk.toFixed(2)} km、${dl>=0?'+':''}${dl} 步）${r.v==='s'?'；原稿版 '+(o.tot/1000).toFixed(2)+' km':''}</div>`:`<div class="mc-vd">這條檢查後沒有更省的合法走法，只有原稿版（已修正走不通的地方）。</div>`);
 const hm=m=>Math.floor(m/60)+' 小時 '+(m%60)+' 分';const isP=!!r.stops;
 $('mcb').innerHTML=(isP?`<div class="sw-big" style="color:${r.color}">${km} km・${hm(r.total_min)}<small>全程不停車・行車約 ${r.drive_min} 分（15 km/h）・經過 ${r.stops.length} 個重點・${r.legs.length} 步・起終點：景華街競選總部</small></div><div class="mc-tip mc-plan">🕓 ${esc(r.plan)}</div><div class="mc-stops"><div class="mc-sh">📍 重點經過點（預估經過時間，${esc(r.dep)} 出發，不停車）</div>`+r.stops.map((s,k)=>`<div class="mc-sr" data-k="${k}"><span class="mc-sn">${k+1}</span><div><b>${esc(s.name)}</b> <em>約 ${esc(s.clock)}</em><small>第 ${s.km} km・${esc(s.why)}</small></div></div>`).join('')+`</div>`:`<div class="sw-big" style="color:${r.color}">${km} km<small>約 ${min} 分（15 km/h，不含停留）・${r.legs.length} 步・起終點：景華街競選總部</small></div>`)+
 (isP?'':vb)+`<div id="mcprog"><button type="button" id="mcplay" title="播放／暫停">${play?'⏸':'▶'}</button><input type="range" id="mcpr" min="0" max="1000" value="0" aria-label="行駛進度"><span id="mcprt">0%</span></div>`+
 (r.note?`<div class="mc-tip">🚏 ${esc(r.note)}</div>`:'')+
 (nw||ni?`<div class="mc-sum">${nw?`<span class="warn">⚠ ${nw} 處需現場確認</span>`:''}${ni?`<span class="info">ℹ ${ni} 處推論／補充</span>`:''}</div>`:'')+
 `<div class="mc-list">`+r.legs.map(l=>{const diff=l.lv==='warn'&&l.got&&l.got!==l.turn&&l.got!=='抵達';return `<div class="mc-r ${l.lv||''}" data-n="${l.n}"><span class="mc-n" style="border-color:${r.color}">${l.n}</span><div><b>${AR[l.turn]||'⬆'} ${esc(l.turn)}${l.turn==='抵達'?'':' '+esc(l.next)}</b>${diff?` <em>實際${esc(l.got)}</em>`:''}<small>${l.roads.map(x=>esc(x[0])).join('→')}・${l.dist>=1000?(l.dist/1000).toFixed(2)+' km':l.dist+' m'}</small><small class="mc-src">原稿：${esc(l.text)}</small>${l.note?`<small class="mc-note ${l.lv}">${l.lv==='warn'?'⚠':'ℹ'} ${esc(l.note)}</small>`:''}</div></div>`}).join('')+`</div>`+
 `<div class="swlg"><span><i style="background:${r.color}"></i>${r.stops?'規劃路線':r.v==='s'?'建議版路線':'照原稿路線'}</span><span><i style="background:repeating-linear-gradient(90deg,#e8590c 0 6px,transparent 6px 10px)"></i>替代走法（虛線）</span><span>🚛 車隊位置</span><span><b>▲</b> 行進方向</span><span class="mc-fl warn sm">⚠</span>需確認<span class="mc-fl info sm">ℹ</span>推論</div>`+
 `<details class="swnote"><summary>${r.stops?'需求說明':'原稿全文'}</summary><div>${esc(r.src)}</div></details>`+
 `<details class="swnote"><summary>路線怎麼算的</summary><div>依原稿逐段，在 OpenStreetMap（Geofabrik 2026-11-08 擷取）車行路網上找「沿這條路直行到下一條路」的路線；單行道、禁止轉彎、行人專用路段都照 OSM 遵守；原稿走不通或禁轉的地方改用最短合法替代路線並畫虛線（⚠）。「建議版」只在有更順的合法走法時提供，原稿版保留不動。另比對臺北市道路挖掘管理中心（dig.taipei）11/10 的管制與預定施工資料。里程為路網推算，實際以現場為準。</div></details>`+
 `<a class="swgpx" href="${BASE}${r.gpx?encodeURIComponent(r.gpx):'gpx-車隊-'+encodeURIComponent(r.name+'-'+VN)+'.gpx'}" download="車隊掃街-${esc(r.name.replace(/\//g,''))}-${VN}.gpx">⬇ 下載 GPX（${VN}）</a>`;
 $('mcb').querySelectorAll('.mc-sr').forEach(el=>el.onclick=()=>{const s=cur.stops[+el.dataset.k];prog=cur.cum[s.i]/cur.tot;play=false;$('mcplay').textContent='▶';place();map.setView(s.ll,17);if(innerWidth<=760)$('swp').classList.add('min')});
 if($('mcver'))$('mcver').querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();if(!b.disabled&&b.dataset.v!==cur.v)pick(cur.id,b.dataset.v)});
 $('mcplay').onclick=()=>{play=!play;hold=0;$('mcplay').textContent=play?'⏸':'▶'};
 $('mcpr').oninput=e=>{play=false;$('mcplay').textContent='▶';prog=e.target.value/1000;place()};
 $('mcb').querySelectorAll('.mc-r').forEach(el=>el.onclick=()=>{const l=cur.legs[+el.dataset.n-1];prog=cur.cum[l.i0]/cur.tot;play=false;$('mcplay').textContent='▶';place();
  const b=L.latLngBounds(cur.pts.slice(l.i0,l.i1+1));map.fitBounds(b,{maxZoom:17,paddingTopLeft:[20,130],paddingBottomRight:[20,innerWidth<=760?$('swp').offsetHeight+10:20]});
  if(innerWidth<=760)$('swp').classList.add('min')})}
// ---- truck + flow ----
function at(s){const c=cur.cum;let lo=0,hi=c.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(c[m]<=s)lo=m;else hi=m}const a=cur.pts[lo],b=cur.pts[hi],d=c[hi]-c[lo],t=d?(s-c[lo])/d:0;return {ll:[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],i:lo,a,b}}
function place(){if(!cur||!truck)return;const s=prog*cur.tot,p=at(s);truck.setLatLng(p.ll);const el=truck.getElement();if(el){const q=el.querySelector('span');const pa=map.latLngToContainerPoint(p.a),pb=map.latLngToContainerPoint(p.b);if(q&&Math.abs(pb.x-pa.x)>.5)q.style.transform=pb.x>pa.x?'scaleX(-1)':'none'}
 const pr=$('mcpr'),pt=$('mcprt');if(pr&&document.activeElement!==pr)pr.value=Math.round(prog*1000);if(pt)pt.textContent=Math.round(prog*100)+'%';
 const now=performance.now();if(now-lastDone>200||!play){lastDone=now;done.setLatLngs(prog>0?cur.pts.slice(0,p.i+1).concat([p.ll]):[]);FR=cur.pts.slice(p.i).map((x,j)=>j?x:p.ll);proj()}}
let FR=[];
function size(){const s=map.getSize();cv.width=s.x*dpr;cv.height=s.y*dpr;cv.style.width=s.x+'px';cv.style.height=s.y+'px';proj()}
function proj(){if(!map._loaded)return;L.DomUtil.setPosition(cv,map.containerPointToLayerPoint([0,0]));P2=cur&&FR.length>1?[FR.map(ll=>map.latLngToContainerPoint(ll))]:[]}
let ft=0;
function frame(ts){requestAnimationFrame(frame);if(!cur){return}const dt=Math.min(100,ts-(lastT||ts));lastT=ts;
 if(play&&!zm&&!document.hidden){if(prog>=1){hold+=dt;if(hold>1500){prog=0;hold=0}}else prog=Math.min(1,prog+dt*0.4/cur.tot);place()}
 const fl=$('fflow');if((fl&&!fl.checked)||zm||document.hidden){cx.clearRect(0,0,cv.width,cv.height);return}
 ft=(ft+(RM?0:1.1))%36;cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,cv.width,cv.height);cx.lineCap='round';cx.lineJoin='round';
 P2.forEach(pts=>{cx.strokeStyle=dark()?'rgba(255,245,230,.95)':'rgba(255,255,255,.98)';cx.lineWidth=3;cx.setLineDash([3,15]);cx.lineDashOffset=-ft;if(dark()){cx.shadowColor='rgba(255,170,60,.9)';cx.shadowBlur=5}else cx.shadowBlur=0;cx.beginPath();pts.forEach((p,i)=>i?cx.lineTo(p.x,p.y):cx.moveTo(p.x,p.y));cx.stroke()})}
go()})();
