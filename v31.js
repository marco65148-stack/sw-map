/* v31：可編輯圖層（拜票點／全聯／市場／公園）＋到訪時間。資料存在本瀏覽器 localStorage（key: swPOI1），可匯出／匯入 JSON。無 API key。 */
(function(){
const KEY='swPOI1',CATS={cv:'拜票點',px:'全聯',mk:'市場',pk:'公園'},ICON={cv:'📌',px:'🛒',mk:'🏪',pk:'🌳'};
let st=null,DEF={cv:[],px:null,mk:null,pk:null},LY={},pkMin=3000,addCat=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function go(){const m=window.__map;if(!m||!window.__pxL||!window.__PXD)return setTimeout(go,200);
 DEF.px=window.__PXD.map((s,i)=>({id:'px'+i,name:s.name,lat:s.lat,lon:s.lon,addr:s.address,hours:s.hours,phone:s.phone,src:'全聯官網門市查詢（pxmart.com.tw，2026-10-21 擷取）'}));
 Promise.all([fetch('markets.json').then(r=>r.json()),fetch('parks.json').then(r=>r.json())]).then(([mk,pk])=>{
  DEF.mk=mk.map(x=>({...x,src:x.src+'（2026-10-28 擷取）'}));
  DEF.pk=pk.map(x=>({id:x.id,name:x.name,lat:x.lat,lon:x.lon,area:x.area,addr:x.d+' '+x.li,osm:x.osm,src:'OpenStreetMap leisure=park（2026-10-28 擷取；面積依 OSM 輪廓估算）'}));
  init(m)}).catch(e=>{console.error('poi',e)})}
function load(){try{const j=JSON.parse(localStorage.getItem(KEY)||'null');if(j&&j.items)return j}catch(e){}return null}
function save(){st.saved=new Date().toISOString();try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){alert('儲存失敗：'+e.message)}}
function seed(){const s=load()||{v:1,items:{},on:{cv:true,px:true,mk:true,pk:true},pkMin:3000};for(const c in CATS)if(!s.items[c])s.items[c]=JSON.parse(JSON.stringify(DEF[c]||[]));s.on=s.on||{};if(s.pkMin==null)s.pkMin=3000;return s}
function all(){const a=[];for(const c in CATS)st.items[c].forEach(x=>a.push({...x,cat:c}));return a}
function find(id){for(const c in CATS){const x=st.items[c].find(y=>y.id===id);if(x)return[c,x]}return[null,null]}
function icon(c,x){const t=x.time?`<i>${esc(x.time)}</i>`:'';
 if(c==='px')return L.divIcon({className:'',iconSize:[52,30],iconAnchor:[26,15],popupAnchor:[0,-14],html:`<div class="pxb">全聯${t}</div>`});
 const small=c==='pk'&&!x.time&&(x.area||0)<10000;const lab=c==='pk'&&small?'🌳':(ICON[c]+' '+esc(c==='cv'?x.name:(x.name||'').replace(/攤販集中場$/,'')));
 return L.divIcon({className:'',iconSize:[24,24],iconAnchor:[12,12],popupAnchor:[0,-12],html:`<div class="poi-mk poi-${c==='mk'?'mk-mk':c}${small?' small':''}" title="${esc(x.name)}">${lab}${t}</div>`})}
function pop(c,x){const info=[x.date&&('日期：'+esc(x.date)),x.time&&('<b>到訪時間：'+esc(x.time)+'</b>'),x.addr&&('地址：'+esc(x.addr)),x.hours&&('營業：'+esc(x.hours)),x.kind&&('類型：'+esc(x.kind)),x.area&&('面積約 '+Math.round(x.area).toLocaleString()+' ㎡'),x.note&&('備註：'+esc(x.note)),x.src&&('<small style="opacity:.6">來源：'+esc(x.src)+'</small>'),x.osm&&('<small><a href="'+esc(x.osm)+'" target="_blank" rel="noopener">OSM</a></small>')].filter(Boolean).join('<br>');
 return `<div class="poi-pop" data-id="${esc(x.id)}"><b>${ICON[c]} ${esc(x.name)}</b><br><small>${CATS[c]}</small><br>${info}<br><button type="button" onclick="__poi.edit('${esc(x.id)}')">✏️ 編輯／時間</button><button type="button" onclick="__poi.del('${esc(x.id)}')">🗑 刪除</button></div>`}
function draw(){const m=window.__map;for(const c in CATS){const g=LY[c];g.clearLayers();st.items[c].forEach(x=>{if(c==='pk'&&!x.time&&!x.user&&(x.area||0)<st.pkMin)return;
  const mk=L.marker([x.lat,x.lon],{icon:icon(c,x),zIndexOffset:x.time?800:0});mk.__id=x.id;mk.bindPopup(pop(c,x),{maxWidth:280});g.addLayer(mk)})}
 list();sync()}
function sync(){const m=window.__map;for(const c in CATS){const on=m.hasLayer(LY[c]);const cb=document.getElementById('poiOn-'+c);if(cb)cb.checked=on}}
function hm(t){if(!t)return 1e9;const[a,b]=t.split(':').map(Number);return a*60+b}
function list(){const el=document.getElementById('poiL');if(!el)return;const f=document.getElementById('poiCat').value;const now=hm((document.getElementById('f0')||{}).value||'');
 let a=all().filter(x=>f==='timed'?!!x.time:x.cat===f);if(f==='pk')a=a.filter(x=>x.time||x.user||(x.area||0)>=st.pkMin);
 a.sort((p,q)=>((p.date||'')+String(hm(p.time)).padStart(5,'0')).localeCompare((q.date||'')+String(hm(q.time)).padStart(5,'0'))||p.name.localeCompare(q.name,'zh-Hant'));
 let nx=false;el.innerHTML=a.length?a.map(x=>{let cl='';if(f==='timed'&&now<1e9&&x.time){if(hm(x.time)<now)cl='past';else if(!nx){cl='next';nx=true}}
  return `<div class="it ${cl}" data-id="${esc(x.id)}"><span class="tm">${esc(x.time||'—')}</span><span class="n"><b>${ICON[x.cat]} ${esc(x.name)}</b><small>${esc([x.date,x.addr||x.note].filter(Boolean).join('｜'))}</small></span><button type="button" data-a="e">✏️</button><button type="button" data-a="d">🗑</button></div>`}).join(''):'<div style="opacity:.7;padding:8px 0">（尚無資料'+(f==='cv'?'，按「＋新增」在地圖上加拜票點':'')+(f==='timed'?'；在任一點按「編輯」填到訪時間即會出現在這裡':'')+'）</div>';
 document.getElementById('poiN').textContent=a.length+' 筆'}
function fly(id){const[c,x]=find(id);if(!x)return;const m=window.__map;if(!m.hasLayer(LY[c]))LY[c].addTo(m);m.setView([x.lat,x.lon],Math.max(m.getZoom(),17));setTimeout(()=>{LY[c].eachLayer(l=>{if(l.__id===id)l.openPopup()})},350);if(innerWidth<=760)document.getElementById('poi').classList.remove('on')}
function form(c,x,isNew){const F=document.getElementById('poiF');F.innerHTML=`<form><b>${isNew?'新增':'編輯'}${CATS[c]}</b>
 <label>名稱 <input name="name" required value="${esc(x.name||'')}" style="flex:1"></label>
 <label>日期 <input type="date" name="date" value="${esc(x.date||'')}"></label>
 <label>到訪時間 <input type="time" name="time" value="${esc(x.time||'')}"> <button type="button" data-a="clr">清除時間</button></label>
 <label>備註 <textarea name="note" rows="2" style="flex:1">${esc(x.note||'')}</textarea></label>
 <small style="opacity:.7">位置：${(+x.lat).toFixed(5)}, ${(+x.lon).toFixed(5)}</small>
 <div class="btns">${isNew?'':'<button type="button" data-a="del" style="color:#b91c1c">🗑 刪除</button>'}<button type="button" data-a="cancel">取消</button><button type="submit" style="background:#2563eb;color:#fff">💾 儲存</button></div></form>`;
 F.classList.add('on');const fm=F.querySelector('form');fm.name.focus();
 fm.querySelector('[data-a=clr]').onclick=()=>{fm.time.value=''};fm.querySelector('[data-a=cancel]').onclick=()=>F.classList.remove('on');
 const d=fm.querySelector('[data-a=del]');if(d)d.onclick=()=>{F.classList.remove('on');del(x.id)};
 fm.onsubmit=e=>{e.preventDefault();const nm=fm.name.value.trim();if(!nm){fm.name.focus();return}Object.assign(x,{name:nm,date:fm.date.value,time:fm.time.value,note:fm.note.value.trim()});
  if(isNew){x.user=1;st.items[c].push(x)}save();window.__map.closePopup();draw();F.classList.remove('on');toast((isNew?'已新增：':'已儲存：')+nm)}}
function edit(id){const[c,x]=find(id);if(x)form(c,x,false)}
function del(id){const[c,x]=find(id);if(!x)return;if(!confirm('確定刪除「'+x.name+'」？（可用「還原預設」找回內建點）'))return;st.items[c]=st.items[c].filter(y=>y.id!==id);save();window.__map.closePopup();draw();toast('已刪除：'+x.name)}
function toast(t){const h=document.getElementById('poiHint');if(addCat)return;h.textContent=t;h.classList.add('on');clearTimeout(h.__t);h.__t=setTimeout(()=>h.classList.remove('on'),1800)}
function startAdd(c){addCat=c;const h=document.getElementById('poiHint');clearTimeout(h.__t);h.innerHTML=`點地圖放置新的${CATS[c]}<br><button type="button" id="poiCtr">用畫面中心</button><button type="button" id="poiCx">取消</button>`;h.classList.add('on');
 document.getElementById('poiCx').onclick=stopAdd;document.getElementById('poiCtr').onclick=()=>{const p=window.__map.getCenter();place(p)};
 window.__map.getContainer().style.cursor='crosshair';if(innerWidth<=760)document.getElementById('poi').classList.remove('on')}
function stopAdd(){addCat=null;document.getElementById('poiHint').classList.remove('on');window.__map.getContainer().style.cursor=''}
function place(ll){const c=addCat;stopAdd();if(!c)return;form(c,{id:c+'u'+Date.now().toString(36),name:'',lat:+ll.lat.toFixed(6),lon:+ll.lng.toFixed(6)},true)}
function exp(){const b=new Blob([JSON.stringify(st,null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='聖文地圖-行程點-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function imp(file){const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result);if(!j.items)throw Error('格式不符');if(!confirm('匯入會取代目前本機資料，確定？'))return;for(const c in CATS)if(!Array.isArray(j.items[c]))j.items[c]=st.items[c];st=j;save();draw();toast('已匯入')}catch(e){alert('匯入失敗：'+e.message)}};r.readAsText(file)}
function reset(){if(!confirm('還原預設會清除你新增的點、填的時間與刪除紀錄（建議先匯出），確定？'))return;localStorage.removeItem(KEY);st=seed();save();draw();toast('已還原預設')}
function init(m){st=seed();
 LY.px=window.__pxL;LY.cv=L.layerGroup();LY.mk=L.layerGroup();LY.pk=L.layerGroup();
 for(const c of['cv','mk','pk'])if(st.on[c]!==false)LY[c].addTo(m);
 m.createPane&&0;
 const t=document.getElementById('tools');t.insertAdjacentHTML('beforeend','<button id="bpoi" class="glass" title="拜票點／全聯／市場／公園：開關、到訪時間、新增刪除">📍</button>');
 document.body.insertAdjacentHTML('beforeend',`<div id="poi" class="glass"><h3>📍 行程點 <span><small id="poiN"></small> <button type="button" id="poiX">✕</button></span></h3>
 <div class="row">${Object.keys(CATS).map(c=>`<label><input type="checkbox" id="poiOn-${c}">${ICON[c]}${CATS[c]}</label>`).join('')}</div>
 <div class="row"><label>公園顯示 <select id="poiPk"><option value="10000">大型（≥1公頃）</option><option value="3000">中型以上（≥3000㎡）</option><option value="0">全部（含鄰里小公園）</option></select></label></div>
 <div class="row"><button type="button" data-add="cv">＋拜票點</button><button type="button" data-add="px">＋全聯</button><button type="button" data-add="mk">＋市場</button><button type="button" data-add="pk">＋公園</button></div>
 <div class="row"><label>清單 <select id="poiCat"><option value="timed">⏱ 有到訪時間（依時間）</option><option value="cv">📌 拜票點</option><option value="px">🛒 全聯</option><option value="mk">🏪 市場</option><option value="pk">🌳 公園</option></select></label></div>
 <div id="poiL"></div>
 <div class="row" style="margin-top:10px"><button type="button" id="poiExp">⬇️ 匯出</button><button type="button" id="poiImpB">⬆️ 匯入</button><input type="file" id="poiImp" accept="application/json,.json" hidden><button type="button" id="poiRst">↺ 還原預設</button></div>
 <small style="opacity:.7">資料只存在這台裝置的這個瀏覽器（重開仍在；換手機／換瀏覽器或清除網站資料就看不到）。要搬到別台請用「匯出／匯入」。「選時間」會標出已過（淡）與下一站（紅）。</small></div>
 <div id="poiHint" class="glass"></div><div id="poiF"></div>`);
 const P=document.getElementById('poi');document.getElementById('bpoi').onclick=()=>{P.classList.toggle('on');list()};document.getElementById('poiX').onclick=()=>P.classList.remove('on');
 for(const c in CATS)document.getElementById('poiOn-'+c).onchange=e=>{e.target.checked?LY[c].addTo(m):m.removeLayer(LY[c]);st.on[c]=e.target.checked;save()};
 const pk=document.getElementById('poiPk');pk.value=String(st.pkMin);pk.onchange=()=>{st.pkMin=+pk.value;save();draw()};
 P.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>startAdd(b.dataset.add));
 document.getElementById('poiCat').onchange=list;document.getElementById('poiL').onclick=e=>{const it=e.target.closest('.it');if(!it)return;const a=e.target.closest('button');if(a&&a.dataset.a==='e')edit(it.dataset.id);else if(a&&a.dataset.a==='d')del(it.dataset.id);else fly(it.dataset.id)};
 document.getElementById('poiExp').onclick=exp;document.getElementById('poiImpB').onclick=()=>document.getElementById('poiImp').click();document.getElementById('poiImp').onchange=e=>{if(e.target.files[0])imp(e.target.files[0]);e.target.value=''};document.getElementById('poiRst').onclick=reset;
 const f0=document.getElementById('f0');if(f0)f0.addEventListener('change',list);
 const ct=m.getContainer();ct.addEventListener('click',e=>{if(!addCat)return;if(e.target.closest('.leaflet-control,#poi,#poiHint,#tools,#mode,.glass'))return;e.stopPropagation();e.preventDefault();place(m.mouseEventToLatLng(e))},true);
 m.on('layeradd layerremove',e=>{for(const c in CATS)if(e.layer===LY[c]){sync();if(c==='px'){st.on.px=m.hasLayer(LY.px);save()}}});
 if(st.on.px===false)m.removeLayer(LY.px);
 draw();window.__poi={edit,del,st:()=>st,LY,draw,fly};}
go()})();
