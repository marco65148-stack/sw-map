/* v54：新增圖層「📅 今日行程」— 讀 today.json（每日早上上架、晚上清空）。
   規則：today.json 的 date 必須等於今天（Asia/Taipei），否則一律不顯示任何點，只顯示一句「今日無行程資料」。絕不顯示舊資料。 */
(function(){
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tpDate=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(d||new Date());
const tpHM=d=>new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Taipei',hour:'2-digit',minute:'2-digit',hour12:false}).format(d);
// start/end：接受 "HH:MM" 或含時區的 ISO（如 2026-11-23T09:00+08:00）。ISO 的台北日期不是 today 就整筆丟掉。
function tm(v,today){if(v==null||v==='')return null;v=String(v).trim();let m=v.match(/^(\d{1,2}):(\d{2})$/);if(m)return {hm:m[1].padStart(2,'0')+':'+m[2],ok:true};
 const d=new Date(v);if(isNaN(d))return {hm:'',ok:false};return {hm:tpHM(d),ok:tpDate(d)===today}}
function valid(J,today){if(!J||typeof J!=='object'||J.date!==today||!Array.isArray(J.events))return [];
 const out=[];J.events.forEach(e=>{if(!e||typeof e!=='object')return;const s=tm(e.start,today),en=tm(e.end,today);if((s&&!s.ok)||(en&&!en.ok))return;
  const lat=Number(e.lat),lng=Number(e.lng);const has=e.lat!=null&&e.lng!=null&&e.lat!==''&&e.lng!==''&&isFinite(lat)&&isFinite(lng)&&lat>21&&lat<26.5&&lng>118&&lng<123;
  out.push({s:s?s.hm:'',e:en?en.hm:'',title:e.title,place:e.place,address:e.address,note:e.note,ll:has?[lat,lng]:null})});
 out.sort((a,b)=>(a.s||'99:99').localeCompare(b.s||'99:99'));return out}
function go(){const m=window.__map;if(!m||!window.L||!document.getElementById('chips'))return setTimeout(go,250);init(m)}
function init(m){
 const st=document.createElement('style');st.textContent=
 '.td-mk{width:28px;height:28px;border-radius:50%;background:#d6336c;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5);color:#fff;display:flex;align-items:center;justify-content:center;font:800 14px/1 system-ui}'+
 '.td-mk.past{background:#868e96}.td-pp{font:13px/1.5 "Noto Sans TC",system-ui,sans-serif;max-width:260px}.td-pp .pp-h{font-weight:800;margin-bottom:4px}'+
 '.td-nav{display:inline-block;margin-top:4px;padding:3px 8px;border-radius:8px;background:#2f9e44;color:#fff!important;text-decoration:none;font-weight:700}.td-src{font-size:11px;color:#868e96;margin-top:6px}'+
 '#chip-td.on{background:#d6336c;border-color:#d6336c;color:#fff}'+
 '@media (min-width:761px){#chips{flex-wrap:wrap;overflow:visible;row-gap:6px}}'+
 '#tdmsg{position:absolute;left:50%;top:150px;transform:translateX(-50%);z-index:1200;background:rgba(33,37,41,.88);color:#fff;padding:6px 12px;border-radius:14px;font:600 13px/1.4 system-ui,sans-serif;pointer-events:none;display:none;white-space:nowrap}';
 document.head.appendChild(st);
 m.createPane('tdP').style.zIndex=660;m.createPane('tdL').style.zIndex=640;
 const G=L.layerGroup();let cnt=0,tried=false,updated='',loadedDate='';
 const msg=document.createElement('div');msg.id='tdmsg';msg.textContent='今日無行程資料';m.getContainer().appendChild(msg);
 const C=document.getElementById('chips');C.insertAdjacentHTML('beforeend','<button type="button" id="chip-td" data-c="td" aria-pressed="false"><span class="dot"></span>📅 今日行程</button>');
 const b=document.getElementById('chip-td');
 function clear(){G.clearLayers();cnt=0;loadedDate=''}
 function draw(J){clear();const today=tpDate();const E=valid(J,today);const now=tpHM(new Date());
  const pts=[];let n=0;
  E.forEach(e=>{if(!e.ll)return;n++;pts.push(e.ll);const past=(e.e||e.s)&&(e.e||e.s)<now;
   const nav=`https://www.google.com/maps/dir/?api=1&destination=${e.ll[0]},${e.ll[1]}`;
   const h=`<div class="td-pp"><div class="pp-h">📅 ${n}. ${esc(e.title||'（未命名行程）')}</div>`+
    `<div><b>時間</b>：${esc(e.s||'未寫')}${e.e?'–'+esc(e.e):''}</div>`+(e.place?`<div><b>地點</b>：${esc(e.place)}</div>`:'')+(e.address?`<div><b>地址</b>：${esc(e.address)}</div>`:'')+
    (e.note?`<div>ℹ ${esc(e.note)}</div>`:'')+`<a class="td-nav" href="${nav}" target="_blank" rel="noopener">🧭 導航到這裡</a>`+
    `<div class="td-src">今日行程 ${esc(today)}${J.updated?'・資料更新 '+esc(J.updated):''}</div></div>`;
   L.marker(e.ll,{pane:'tdP',title:`今日行程 ${n}`,keyboard:false,zIndexOffset:1000,icon:L.divIcon({className:'',iconSize:[28,28],iconAnchor:[14,14],popupAnchor:[0,-13],html:`<div class="td-mk${past?' past':''}" data-n="${n}">${n}</div>`})}).bindPopup(h,{maxWidth:280}).addTo(G)});
  if(pts.length>1)L.polyline(pts,{pane:'tdL',color:'#d6336c',weight:4,opacity:.85,dashArray:'8 7',interactive:false}).addTo(G);
  cnt=pts.length;if(cnt){loadedDate=today;updated=J.updated||''}sync()}
 function sync(){const on=m.hasLayer(G);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);
  const ok=cnt>0&&loadedDate===tpDate();if(!ok&&cnt)clear();msg.style.display=on&&tried&&!ok?'block':'none';if(msg.style.display==='block'){const cr=C.getBoundingClientRect(),mr=m.getContainer().getBoundingClientRect();msg.style.top=Math.max(10,Math.round(cr.bottom-mr.top+8))+'px'}}
 let busy=false;
 async function load(){if(busy)return;busy=true;try{const r=await fetch('today.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw 0;draw(await r.json())}catch(e){clear()}finally{busy=false;tried=true;sync()}}
 const set=on=>{on?G.addTo(m):m.removeLayer(G);try{localStorage.setItem('swTD1',on?'1':'0')}catch(e){}sync();if(on)load()};
 b.onclick=()=>set(!m.hasLayer(G));
 setInterval(()=>{if(m.hasLayer(G))load()},5*60*1000);
 setInterval(()=>{if(loadedDate&&loadedDate!==tpDate()){clear();sync()}},30*1000);
 addEventListener('resize',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&m.hasLayer(G))load()});
 let s0=false;try{s0=localStorage.getItem('swTD1')==='1'}catch(e){}if(s0)set(true);else sync();
 window.__td={G,set,load,state:()=>({on:m.hasLayer(G),cnt,loadedDate,today:tpDate(),msg:msg.style.display!=='none'}),valid,tpDate}}
go()})();
