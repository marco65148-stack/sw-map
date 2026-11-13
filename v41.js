/* v41: 平面底圖輔助、清楚的 GPS 位置點、導航時「行進方向朝上」（heading-up）。不需任何 API key */
(function(){const map=window.__map;if(!map||!window.L)return;
/* 手機：篩選面板開啟時隱藏建議行程卡（原 v28 第二段，v41 拿掉 2.5D 建物後移到這裡） */
(function(){const P=document.getElementById('panel');if(!P)return;const f=()=>document.body.classList.toggle('pnl-open',!P.classList.contains('collapsed'));new MutationObserver(f).observe(P,{attributes:true,attributeFilter:['class']});f()})();
const $=id=>document.getElementById(id);
const mp=map.createPane('meP');mp.style.zIndex=690;mp.style.pointerEvents='none';
const ap=map.createPane('meAccP');ap.style.zIndex=640;ap.style.pointerEvents='none';
const R2D=180/Math.PI,D2R=Math.PI/180;
const wrap=a=>((a%360)+360)%360,dif=(a,b)=>((b-a)%360+540)%360-180;
function dist(a,b){const k=111320,x=(b[1]-a[1])*k*Math.cos(a[0]*D2R),y=(b[0]-a[0])*k;return Math.hypot(x,y)}
function brg(a,b){const p1=a[0]*D2R,p2=b[0]*D2R,dl=(b[1]-a[1])*D2R;return wrap(Math.atan2(Math.sin(dl)*Math.cos(p2),Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl))*R2D)}
/* ---- heading-up state ---- */
const HU={mode:'head',rot:0,bearing:null,anchor:null,follow:false,tracking:false,src:'',lastMoveT:0,cmp:null,cmpOn:false,n:0};
window.__hu=HU;
const rotOn=()=>HU.tracking&&HU.follow&&HU.mode=='head'&&HU.bearing!=null;
/* 旋轉時多載入四角的圖磚與向量範圍，避免轉角露白 */
const GP=L.GridLayer.prototype,_tpb=GP._getTiledPixelBounds;
GP._getTiledPixelBounds=function(c){const b=_tpb.call(this,c);if(!HU.wide)return b;const m=b.getCenter(),h=b.getSize().divideBy(2),r=Math.hypot(h.x,h.y);return L.bounds([m.x-r,m.y-r],[m.x+r,m.y+r])};
function setWide(on){if(HU.wide==on)return;HU.wide=on;const pad=on?.8:.1;if(map._renderer)map._renderer.options.padding=pad;Object.values(map._paneRenderers||{}).forEach(r=>r.options.padding=pad);
 ['stops','pxL'].forEach(k=>{const g=window[k];if(g&&g.options&&'removeOutsideVisibleBounds' in g.options){if(on){g.__rovb=g.options.removeOutsideVisibleBounds;g.options.removeOutsideVisibleBounds=false}else if(g.__rovb!=null)g.options.removeOutsideVisibleBounds=g.__rovb}});
 map.fire('moveend')}
function applyRot(deg,instant){const el=map.getPanes().mapPane,c=map.getContainer(),s=map.getSize();HU.rot=HU.rot+dif(HU.rot,deg);
 el.style.transformOrigin=`${s.x/2}px ${s.y/2}px`;el.style.transition=instant?'none':'rotate .6s ease-out';el.style.rotate=(-HU.rot)+'deg';
 c.style.setProperty('--hu',HU.rot+'deg');const r=wrap(HU.rot);c.classList.toggle('hu-rot',r>.5&&r<359.5);setWide(r>.5&&r<359.5||rotOn());ui()}
map.on('resize',()=>{const s=map.getSize();map.getPanes().mapPane.style.transformOrigin=`${s.x/2}px ${s.y/2}px`});
function sync(instant){applyRot(rotOn()?HU.bearing:0,instant)}
function setBearing(b,src){b=wrap(b);if(HU.bearing!=null&&Math.abs(dif(HU.bearing,b))<6)return;HU.bearing=b;HU.src=src;cone();if(rotOn())applyRot(b)}
/* ---- 位置點 ---- */
const ME={mk:null,acc:null};
function cone(){if(!ME.mk)return;const e=ME.mk.getElement();if(!e)return;const w=e.querySelector('.me41');const c=e.querySelector('.cone');const show=HU.bearing!=null&&(Date.now()-HU.lastMoveT<60000||HU.cmpOn);w.classList.toggle('hd',show);c.style.display=show?'':'none';if(show)c.style.transform=`rotate(${HU.bearing}deg)`}
window.__meDot={set(ll,acc){if(!ME.mk){ME.mk=L.marker(ll,{pane:'meP',interactive:false,keyboard:false,icon:L.divIcon({className:'me41-wrap',iconSize:[56,56],iconAnchor:[28,28],html:'<div class="me41"><i class="pl"></i><b class="cone" style="display:none"></b><i class="dt"></i></div>'})}).addTo(map);
  ME.acc=L.circle(ll,{pane:'meAccP',radius:acc||0,color:'#1a73e8',weight:1.5,opacity:.7,fillColor:'#1a73e8',fillOpacity:.12,interactive:false}).addTo(map)}else{ME.mk.setLatLng(ll);ME.acc.setLatLng(ll).setRadius(acc||0)}cone()},
 clear(){if(ME.mk){map.removeLayer(ME.mk);map.removeLayer(ME.acc);ME.mk=ME.acc=null}},get:()=>ME};
/* ---- 餵 GPS：用前後位置算行進方向；低速／靜止不轉 ---- */
HU.feed=function(p){const ll=[p.coords.latitude,p.coords.longitude],acc=p.coords.accuracy||0,sp=p.coords.speed,hd=p.coords.heading,t=Date.now();HU.n++;HU.tracking=true;HU.last=ll;
 if(!HU.anchor)HU.anchor=ll;const d=dist(HU.anchor,ll),th=Math.max(12,Math.min(acc,40)*.6);
 if(hd!=null&&!isNaN(hd)&&sp!=null&&sp>=1.5){HU.lastMoveT=t;setBearing(hd,'gps-heading');if(d>=th)HU.anchor=ll}
 else if(d>=th){HU.lastMoveT=t;setBearing(brg(HU.anchor,ll),'gps-course');HU.anchor=ll}
 cone();ui()};
HU.followTo=function(ll){HU.follow=true;const z=Math.max(map.getZoom(),17);if(rotOn()){const p=map.project(ll,z),off=map.getSize().y*.22,b=HU.bearing*D2R;map.setView(map.unproject(p.add([off*Math.sin(b),-off*Math.cos(b)]),z),z,{animate:true});if(Math.abs(dif(HU.rot,HU.bearing))>.5)applyRot(HU.bearing)}else{map.setView(ll,z,{animate:true});if(wrap(HU.rot)>.5&&wrap(HU.rot)<359.5)applyRot(0)}};
HU.pause=function(){if(!HU.follow)return;HU.follow=false;applyRot(0,true);ui()};
HU.stop=function(){HU.tracking=false;HU.follow=false;HU.anchor=null;HU.bearing=null;applyRot(0,true);window.__meDot.clear();ui()};
/* 使用者拖曳地圖：暫停跟隨並回到北朝上（否則旋轉中的拖曳方向會錯） */
map.on('dragstart',()=>{if(HU.tracking&&HU.follow){HU.pause();if(T.on){$('bloc').classList.remove('on');$('bloc').classList.add('paused');$('bloc').title='回到我的位置（跟隨）'}}});
/* ---- 裝置方位（羅盤）：只在靜止／低速時輔助，iOS 需使用者點按授權 ---- */
function onOri(e){let h=null;if(e.webkitCompassHeading!=null)h=e.webkitCompassHeading;else if(e.absolute&&e.alpha!=null)h=360-e.alpha;if(h==null||isNaN(h))return;
 const so=(screen.orientation&&screen.orientation.angle)||window.orientation||0;h=wrap(h+so);HU.cmpOn=true;
 HU.cmp=HU.cmp==null?h:wrap(HU.cmp+dif(HU.cmp,h)*.2);const now=Date.now();if(now-(HU.cmpT||0)<300)return;HU.cmpT=now;
 if(now-HU.lastMoveT>5000&&HU.tracking&&(HU.bearing==null||Math.abs(dif(HU.bearing,HU.cmp))>=12)){HU.bearing=null;setBearing(HU.cmp,'compass')}}
let oriOn=false;function listenOri(){if(oriOn)return;oriOn=true;if('ondeviceorientationabsolute' in window)addEventListener('deviceorientationabsolute',onOri);else addEventListener('deviceorientation',onOri)}
HU.askOri=function(){try{if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission=='function'){DeviceOrientationEvent.requestPermission().then(s=>{HU.oriPerm=s;if(s=='granted')listenOri()}).catch(e=>{HU.oriPerm='error'})}else if(window.DeviceOrientationEvent){HU.oriPerm='n/a';listenOri()}}catch(e){}};
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#bnorth'))HU.askOri()},true);
/* ---- 垃圾車模式的「我的位置」：持續定位＋跟隨＋行進方向朝上 ---- */
const T={on:false,id:null};window.__trk=T;
T.toggle=function(){HU.askOri();const b=$('bloc');if(!navigator.geolocation){alert('此瀏覽器不支援定位');return}
 if(T.on&&!HU.follow){HU.follow=true;b.classList.remove('paused');b.classList.add('on');if(HU.last)HU.followTo(HU.last);sync();return}
 if(T.on){T.stop();return}
 T.on=true;HU.follow=true;b.classList.add('on');b.title='跟隨中（再按停止）';
 T.id=navigator.geolocation.watchPosition(p=>{const ll=[p.coords.latitude,p.coords.longitude];window.__meDot.set(ll,p.coords.accuracy);HU.feed(p);if(HU.follow)HU.followTo(ll)},
  e=>{if(e.code==1){alert('無法取得定位（請允許位置權限）');T.stop()}},{enableHighAccuracy:true,maximumAge:2000,timeout:20000});ui()};
T.stop=function(){if(T.id!=null)navigator.geolocation.clearWatch(T.id);T.id=null;T.on=false;const b=$('bloc');b.classList.remove('on','paused');b.title='我的位置';HU.stop()};
/* ---- 北朝上／方向朝上 按鈕 ---- */
function ui(){const b=$('bnorth');if(!b)return;b.classList.toggle('show',HU.tracking);b.classList.toggle('head',HU.mode=='head');
 b.querySelector('.ndl').style.transform=`rotate(${-HU.rot}deg)`;b.querySelector('small').textContent=HU.mode=='head'?'朝前':'北';b.title=HU.mode=='head'?'目前：行進方向朝上（按一下改北朝上）':'目前：北朝上（按一下改行進方向朝上）'}
function mkBtn(){const tl=$('tools');if(!tl||$('bnorth'))return;const b=document.createElement('button');b.id='bnorth';b.className='glass';b.type='button';b.innerHTML='<span class="ndl"><b></b><i></i></span><small>朝前</small>';
 const ref=$('bloc');ref&&ref.nextSibling?tl.insertBefore(b,ref.nextSibling):tl.appendChild(b);
 b.onclick=()=>{HU.mode=HU.mode=='head'?'north':'head';try{localStorage.setItem('huMode41',HU.mode)}catch(e){}if(HU.mode=='head'&&HU.tracking&&!HU.follow){if(window.__MODE=='sw'&&$('swme'))$('swme').click();else if(T.on)T.toggle()}sync();ui()};ui()}
try{HU.mode=localStorage.getItem('huMode41')||'head'}catch(e){}
if(document.readyState=='loading')document.addEventListener('DOMContentLoaded',mkBtn);else mkBtn();setTimeout(mkBtn,1500);
})();
