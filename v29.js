/* v29：MapLibre GL 3D 底（政策島風：暖色低彩島嶼、青綠水面、斜視 55°、可旋轉、日／夜光照），
   Leaflet 邏輯完整保留，所有 Leaflet 向量/標記即時鏡射到 3D；無 WebGL 自動退回 2D。無任何 API key。 */
(function(){
const Lm=()=>window.__map;
function hasGL(){try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'))}catch(e){return false}}
const ok=!!(hasGL()&&window.maplibregl);window.__3d={ok,on:false,feats:0,mk:0,bld:0};
if(!ok){document.body.classList.add('no3d');return}
const SRC='https://tiles.openfreemap.org/planet',GLY='https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
const P={day:{bg:'#f4eee3',land:'#efe6d4',park:'#bfd49b',wood:'#9fbf83',water:'#6fb3b8',wline:'#5a9ca3',road:'#ffffff',rcase:'#e3d6c0',b0:'#fff8f4',b1:'#f8e7d2',b2:'#e98a63',lab:'#211D1D',halo:'#fff8f4',sky:'#cfe6ee',liC:'#211D1D',liCo:.7,liI:'#fff8f4',lightc:'#fff1de',li:.45},
 night:{bg:'#14183a',land:'#1b2148',park:'#24345a',wood:'#22325a',water:'#0e1630',wline:'#1e2c58',road:'#3f4f80',rcase:'#1e2c58',b0:'#2b3566',b1:'#64566a',b2:'#ff9f6a',lab:'#eef6fa',halo:'#14183a',sky:'#1e2c58',liC:'#000000',liCo:.85,liI:'#67e8f9',lightc:'#b4c2ff',li:.3}};
function style(k){const c=P[k];return{version:8,glyphs:GLY,sources:{o:{type:'vector',url:SRC}},
 sky:{'sky-color':c.sky,'horizon-color':c.bg,'fog-color':c.bg,'sky-horizon-blend':.6,'horizon-fog-blend':.6,'fog-ground-blend':.4},
 light:{anchor:'viewport',color:c.lightc,intensity:c.li,position:[1.3,210,40]},
 layers:[{id:'bg',type:'background',paint:{'background-color':c.bg}},
 {id:'lc',type:'fill',source:'o','source-layer':'landcover',paint:{'fill-color':['match',['get','class'],'wood',c.wood,'grass',c.park,c.land],'fill-opacity':.8}},
 {id:'park',type:'fill',source:'o','source-layer':'park',paint:{'fill-color':c.park,'fill-opacity':.7}},
 {id:'water',type:'fill',source:'o','source-layer':'water',paint:{'fill-color':c.water}},
 {id:'ww',type:'line',source:'o','source-layer':'waterway',paint:{'line-color':c.wline,'line-width':['interpolate',['linear'],['zoom'],12,1,16,4]}},
 {id:'rc',type:'line',source:'o','source-layer':'transportation',filter:['!=',['get','class'],'rail'],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':c.rcase,'line-width':['interpolate',['exponential',1.6],['zoom'],12,1.5,17,16]}},
 {id:'rd',type:'line',source:'o','source-layer':'transportation',filter:['!=',['get','class'],'rail'],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':c.road,'line-width':['interpolate',['exponential',1.6],['zoom'],12,.8,17,12]}},
 {id:'bld3d',type:'fill-extrusion',source:'o','source-layer':'building',minzoom:13.5,paint:{
  'fill-extrusion-color':['interpolate',['linear'],['coalesce',['get','render_height'],8],0,c.b0,30,c.b1,90,c.b2],
  'fill-extrusion-height':['coalesce',['get','render_height'],8],'fill-extrusion-base':['coalesce',['get','render_min_height'],0],
  'fill-extrusion-opacity':['interpolate',['linear'],['zoom'],13.5,0,14.5,.92],'fill-extrusion-vertical-gradient':true}},
 {id:'pl',type:'symbol',source:'o','source-layer':'place',filter:['in',['get','class'],['literal',['suburb','quarter','neighbourhood','city','town']]],layout:{'text-field':['coalesce',['get','name:zh-Hant'],['get','name']],'text-font':['Noto Sans Regular'],'text-size':13},paint:{'text-color':c.lab,'text-halo-color':c.halo,'text-halo-width':2}},
 {id:'ov-fill',type:'fill',source:'ov',filter:['==',['get','t'],'poly'],paint:{'fill-color':['get','fc'],'fill-opacity':['*',['get','fo'],.4]}},
 {id:'li-case',type:'line',source:'li',layout:{'line-join':'round'},paint:{'line-color':c.liC,'line-opacity':c.liCo,'line-width':['interpolate',['linear'],['zoom'],12,2,14,3,16,4.5,18,6]}},
 {id:'li-in',type:'line',source:'li',layout:{'line-join':'round'},paint:{'line-color':c.liI,'line-width':['interpolate',['linear'],['zoom'],12,.8,14,1.2,16,2,18,2.8]}},
 {id:'ov-halo',type:'line',source:'ov',filter:['==',['get','t'],'line'],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':['get','c'],'line-width':['get','w'],'line-opacity':['get','o'],'line-blur':['get','bl']}},
 {id:'ov-pt',type:'circle',source:'ov',filter:['==',['get','t'],'pt'],paint:{'circle-radius':['get','r'],'circle-color':['get','fc'],'circle-stroke-color':['get','c'],'circle-stroke-width':['get','w'],'circle-opacity':['get','fo'],'circle-pitch-alignment':'map'}}
 ].map(l=>l.source==='ov'?l:l)}}
let gl=null,box=null,lock=0,tmr=0,doms=[],byId={};
function themeKey(){return document.body.classList.contains('light')?'day':'night'}
function ovSource(){return{type:'geojson',data:{type:'FeatureCollection',features:[]}}}
function mkStyle(){const s=style(themeKey());s.sources.ov=ovSource();s.sources.li={type:'geojson',data:window.__V||{type:'FeatureCollection',features:[]}};return s}
function ll(a){return[a.lng,a.lat]}
function collect(){const F=[],M=[];byId={};const m=Lm();
 m.eachLayer(l=>{if(l.options&&l.options.pane==='liB')return;const id=L.stamp(l);if(l instanceof L.Polyline){const o=l.options;if(o.opacity===0&&!(o.fillOpacity>0))return;byId[id]=l;
   if(l instanceof L.Polygon){let g=l.getLatLngs();const rings=x=>x.map(r=>{const c=r.map(ll);if(c.length)c.push(c[0]);return c});
    const isMulti=Array.isArray(g[0])&&Array.isArray(g[0][0]);const geom=isMulti?{type:'MultiPolygon',coordinates:g.map(rings)}:{type:'Polygon',coordinates:rings(g)};
    F.push({type:'Feature',geometry:geom,properties:{t:'poly',lid:id,fc:o.fillColor||o.color||'#888',fo:o.fill===false?0:(o.fillOpacity??.2)}});
    if(o.stroke!==false&&o.weight>0)F.push({type:'Feature',geometry:{type:isMulti?'MultiLineString':'MultiLineString',coordinates:isMulti?g.flatMap(p=>p.map(r=>r.map(ll))):g.map(r=>r.map(ll))},properties:{t:'line',lid:id,c:o.color||'#888',w:(o.weight||1)*.8,o:(o.opacity??1)*.8,bl:0}});return}
   let g=l.getLatLngs();const multi=Array.isArray(g[0]);const cn=o.className||'';
   F.push({type:'Feature',geometry:multi?{type:'MultiLineString',coordinates:g.map(r=>r.map(ll))}:{type:'LineString',coordinates:g.map(ll)},properties:{t:'line',lid:id,c:o.color||'#3388ff',w:(o.weight||3)*(/halo/.test(cn)?1.3:1),o:o.opacity??1,bl:/halo/.test(cn)?6:0}})}
  else if(l instanceof L.CircleMarker){byId[id]=l;const o=l.options;F.push({type:'Feature',geometry:{type:'Point',coordinates:ll(l.getLatLng())},properties:{t:'pt',lid:id,r:l.getRadius(),c:o.color||'#3388ff',w:o.weight??2,fc:o.fillColor||o.color||'#3388ff',fo:o.fillOpacity??.2}})}
  else if(l instanceof L.Marker&&l._icon){byId[id]=l;M.push(l)}});
 return{F,M}}
function pop(l,lnglat){const p=l.getPopup&&l.getPopup();if(p){let c=p.getContent();if(typeof c==='function')c=c(l);const el=typeof c==='string'?Object.assign(document.createElement('div'),{innerHTML:c}):c;new maplibregl.Popup({maxWidth:'320px'}).setLngLat(lnglat).setDOMContent(el.cloneNode?el.cloneNode(true):el).addTo(gl)}
 l.fire('click',{latlng:L.latLng(lnglat[1],lnglat[0]),originalEvent:{}})}
function resync(){if(!gl||!gl.isStyleLoaded()){clearTimeout(tmr);tmr=setTimeout(resync,150);return}
 const {F,M}=collect();gl.getSource('ov').setData({type:'FeatureCollection',features:F});
 doms.forEach(d=>d.remove());doms=[];const b=gl.getBounds();
 M.filter(l=>b.contains(ll(l.getLatLng()))).slice(0,350).forEach(l=>{const src=l._icon,el=src.cloneNode(true);el.style.cssText='';el.className=src.className.replace(/leaflet-\S+/g,'')+' m3';
  const o=l.options.icon&&l.options.icon.options||{};if(o.iconSize){el.style.width=o.iconSize[0]+'px';el.style.height=o.iconSize[1]+'px'}
  const an=o.iconAnchor&&o.iconSize?[o.iconSize[0]/2-o.iconAnchor[0],o.iconSize[1]/2-o.iconAnchor[1]]:[0,0];
  if(l.options.interactive!==false){el.style.cursor='pointer';el.addEventListener('click',e=>{e.stopPropagation();pop(l,ll(l.getLatLng()))})}else el.style.pointerEvents='none';
  doms.push(new maplibregl.Marker({element:el,offset:an,pitchAlignment:'viewport'}).setLngLat(ll(l.getLatLng())).addTo(gl))});
 Object.assign(window.__3d,{feats:F.length,mk:doms.length})}
const later=()=>{clearTimeout(tmr);tmr=setTimeout(resync,120)};
function fromLeaflet(){if(!gl||lock)return;const m=Lm(),c=m.getCenter();lock=1;gl.jumpTo({center:[c.lng,c.lat],zoom:m.getZoom()-1});lock=0;later()}
function toLeaflet(){if(lock)return;const c=gl.getCenter();lock=1;Lm().setView([c.lat,c.lng],Math.round(gl.getZoom()+1),{animate:false});lock=0;later()}
function build(){box=document.createElement('div');box.id='m3d';document.getElementById('map').appendChild(box);
 ['mousedown','touchstart','wheel','click','dblclick','pointerdown'].forEach(t=>box.addEventListener(t,e=>e.stopPropagation(),{passive:true}));
 const m=Lm(),c=m.getCenter();const mob=innerWidth<=760;
 gl=new maplibregl.Map({container:box,style:mkStyle(),center:[c.lng,c.lat],zoom:m.getZoom()-1,pitch:mob?52:58,bearing:-18,maxPitch:70,attributionControl:{compact:true,customAttribution:'© OpenFreeMap © OpenStreetMap'},localIdeographFontFamily:"'PingFang TC','Noto Sans TC','Microsoft JhengHei',sans-serif",fadeDuration:0,antialias:!mob,maxTileCacheSize:mob?60:200,pixelRatio:Math.min(devicePixelRatio,mob?2:1.5)});
 window.__gl=gl;gl.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'bottom-right');
 gl.on('load',()=>{resync();if(window.__V)gl.getSource('li').setData(window.__V);box.querySelectorAll('.maplibregl-compact-show').forEach(e=>e.classList.remove('maplibregl-compact-show'));gl.on('moveend',toLeaflet)});
 gl.on('click',e=>{const f=gl.queryRenderedFeatures(e.point,{layers:['ov-pt','ov-halo']}).find(f=>byId[f.properties.lid]&&byId[f.properties.lid].options.interactive!==false);if(f)pop(byId[f.properties.lid],[e.lngLat.lng,e.lngLat.lat])});
 gl.on('idle',()=>{try{window.__3d.bld=gl.queryRenderedFeatures({layers:['bld3d']}).length}catch(e){}});
 m.on('layeradd layerremove',later);m.on('moveend',fromLeaflet);m.on('popupopen',e=>{if(window.__3d.on){const ll2=e.popup.getLatLng();if(ll2&&!document.querySelector('.maplibregl-popup')){const el=e.popup.getElement&&e.popup._contentNode;if(el)new maplibregl.Popup({maxWidth:'320px'}).setLngLat([ll2.lng,ll2.lat]).setDOMContent(el.cloneNode(true)).addTo(gl)}}});
 new MutationObserver(()=>{if(gl){const k=themeKey();if(k!==gl.__k){gl.__k=k;gl.setStyle(mkStyle());gl.once('styledata',()=>later())}}}).observe(document.body,{attributes:true,attributeFilter:['class']});gl.__k=themeKey()}
function set(on){if(on&&!gl)build();document.body.classList.toggle('is3d',on);window.__3d.on=on;if(gl){box.style.display=on?'block':'none';if(on){gl.resize();fromLeaflet()}}try{Lm().fire('moveend')}catch(e){}
 const b=document.getElementById('b3d');if(b){b.textContent=on?'2D':'3D';b.title=on?'切回平面地圖':'立體鳥瞰（可旋轉）'}try{localStorage.setItem('gt3d',on?'1':'0')}catch(e){}}
window.__set3d=set;window.addEventListener('load',()=>{});
function boot(){if(!Lm())return setTimeout(boot,100);const t=document.getElementById('tools');if(t&&!document.getElementById('b3d')){const b=document.createElement('button');b.id='b3d';b.type='button';b.className=(t.querySelector('button')||{}).className||'';t.insertBefore(b,t.firstChild);b.onclick=()=>set(!window.__3d.on)}
 let v='1';try{v=localStorage.getItem('gt3d')??'1'}catch(e){}const go=()=>set(v==='1');document.getElementById('ld')?setTimeout(function w(){document.getElementById('ld')&&!document.getElementById('ld').classList.contains('done')?setTimeout(w,200):go()},200):go()}
boot();
})();
