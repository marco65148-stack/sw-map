/* v55：「📅 今日／明日行程」圖層＋「📋 行程清單」— 讀 today.json。
   格式：{updated, days:[{date:"YYYY-MM-DD", events:[...]}, ...]}（也相容舊單日格式 {date, updated, events}）。
   只顯示 date＝今天或明天（Asia/Taipei）的那幾天，其他一律丟掉；今天紅、明天藍；過午夜明天自動變今天、昨天自動消失。絕不顯示舊資料。 */
(function(){
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tpDate=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(d||new Date());
const tpHM=d=>new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Taipei',hour:'2-digit',minute:'2-digit',hour12:false}).format(d);
const tomorrow=()=>tpDate(new Date(Date.now()+864e5)); // 台北無日光節約
const WK='日一二三四五六',md=d=>d.slice(5,7)+'/'+d.slice(8,10),wk=d=>'週'+WK[new Date(d+'T12:00:00+08:00').getUTCDay()];
const NAME={today:'今日',tomorrow:'明日'},COL={today:'#d6336c',tomorrow:'#1971c2'};
function kind(date){if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;if(date===tpDate())return 'today';if(date===tomorrow())return 'tomorrow';return null}
function tm(v,day){if(v==null||v==='')return null;v=String(v).trim();let m=v.match(/^(\d{1,2}):(\d{2})$/);if(m)return {hm:m[1].padStart(2,'0')+':'+m[2],ok:true};
 const d=new Date(v);if(isNaN(d))return {hm:'',ok:false};return {hm:tpHM(d),ok:tpDate(d)===day}}
function evs(list,day){const out=[];(Array.isArray(list)?list:[]).forEach(e=>{if(!e||typeof e!=='object')return;const s=tm(e.start,day),en=tm(e.end,day);if((s&&!s.ok)||(en&&!en.ok))return;
  const lat=Number(e.lat),lng=Number(e.lng);const has=e.lat!=null&&e.lng!=null&&e.lat!==''&&e.lng!==''&&isFinite(lat)&&isFinite(lng)&&lat>21&&lat<26.5&&lng>118&&lng<123;
  out.push({s:s?s.hm:'',e:en?en.hm:'',title:e.title,place:e.place,address:e.address,note:e.note,ll:has?[lat,lng]:null})});
 out.sort((a,b)=>(a.s||'99:99').localeCompare(b.s||'99:99'));return out}
// 回傳 [{date,kind,E}]，只含今天／明天、有行程的天；今天在前
function parse(J){if(!J||typeof J!=='object')return [];const raw=Array.isArray(J.days)?J.days:(J.date!==undefined?[{date:J.date,events:J.events}]:[]);
 const seen={},out=[];raw.forEach(d=>{if(!d||typeof d!=='object')return;const k=kind(d.date);if(!k||seen[d.date])return;seen[d.date]=1;const E=evs(d.events,d.date);if(E.length)out.push({date:d.date,kind:k,E})});
 return out.sort((a,b)=>a.date.localeCompare(b.date))}
function go(){const m=window.__map;if(!m||!window.L||!document.getElementById('chips'))return setTimeout(go,250);init(m)}
function init(m){
 const st=document.createElement('style');st.textContent=
 '.td-mk{width:28px;height:28px;border-radius:50%;background:#d6336c;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5);color:#fff;display:flex;align-items:center;justify-content:center;font:800 14px/1 system-ui}'+
 '.td-mk.tmr{background:#1971c2}.td-mk.past{background:#868e96}.td-pp{font:13px/1.5 "Noto Sans TC",system-ui,sans-serif;max-width:260px}.td-pp .pp-h{font-weight:800;margin-bottom:4px}.td-pp .td-day{display:inline-block;font-size:12px;font-weight:800;color:#fff;background:#d6336c;border-radius:6px;padding:1px 6px;margin-bottom:3px}.td-pp .td-day.tmr{background:#1971c2}'+
 '.td-nav{display:inline-block;margin-top:4px;padding:3px 8px;border-radius:8px;background:#2f9e44;color:#fff!important;text-decoration:none;font-weight:700}.td-src{font-size:11px;color:#868e96;margin-top:6px}'+
 '#chip-td.on{background:#d6336c;border-color:#d6336c;color:#fff}#chip-td.on.tmr{background:#1971c2;border-color:#1971c2}#chip-td.on.both{background:linear-gradient(90deg,#d6336c,#1971c2);border-color:#fff}'+
 '@media (min-width:761px){#chips{flex-wrap:wrap;overflow:visible;row-gap:6px}}'+
 '#tdlb{position:absolute;left:66px;top:150px;z-index:1200;display:none;border:0;border-radius:14px;padding:7px 12px;font:800 13px/1 "Noto Sans TC",system-ui,sans-serif;background:#fff;color:#d6336c;box-shadow:0 1px 5px rgba(0,0,0,.35);cursor:pointer}#tdlb.tmr{color:#1971c2}#tdlb.both{color:#5f3dc4}'+
 '#tdlist{position:absolute;left:66px;z-index:1200;width:310px;max-height:60%;overflow:auto;display:none;background:#fff;color:#212529;border-radius:14px;box-shadow:0 2px 10px rgba(0,0,0,.35);padding:8px 10px}'+
 '#tdlist .tdl-x{position:sticky;top:0;float:right;border:0;background:#fff;font-size:16px;cursor:pointer;padding:2px 6px}'+
 '.tdl-h{font:800 14px/1.4 "Noto Sans TC",system-ui,sans-serif;margin:2px 0 4px}.tdl-h small{font-weight:600;color:#868e96}'+
 '.tdl-d{font:800 13px/1.4 "Noto Sans TC",system-ui,sans-serif;color:#fff;border-radius:8px;padding:3px 8px;margin:8px 0 2px;background:#d6336c}.tdl-d.tmr{background:#1971c2}.tdl-d small{font-weight:600;opacity:.9}'+
 '.td-li{display:flex;gap:8px;align-items:flex-start;width:100%;text-align:left;border:0;border-top:1px solid #e9ecef;background:none;color:inherit;padding:7px 2px;font:13px/1.45 "Noto Sans TC",system-ui,sans-serif}'+
 'button.td-li{cursor:pointer}button.td-li:hover{background:#f1f3f5}.td-li.past{opacity:.55}'+
 '.td-li .n{flex:0 0 auto;min-width:24px;height:24px;border-radius:12px;background:#d6336c;color:#fff;font:800 12px/24px system-ui;text-align:center}.td-li .n.tmr{background:#1971c2}.td-li .n.pst{background:#868e96}.td-li .n.na{background:#adb5bd;padding:0 6px;font-size:11px}'+
 '.td-li .t{font-weight:800}.td-li .p{color:#495057}.td-li .go{color:#1971c2;font-weight:700;font-size:12px}'+
 '#tdmsg{position:absolute;left:50%;top:150px;transform:translateX(-50%);z-index:1200;background:rgba(33,37,41,.88);color:#fff;padding:6px 12px;border-radius:14px;font:600 13px/1.4 system-ui,sans-serif;pointer-events:none;display:none;white-space:nowrap}';
 document.head.appendChild(st);
 m.createPane('tdP').style.zIndex=660;m.createPane('tdL').style.zIndex=640;
 const G=L.layerGroup();let J0=null,DAYS=[],MK={},sig='',tried=false,listOpen=false;
 const msg=document.createElement('div');msg.id='tdmsg';msg.textContent='沒有今日或明日的行程資料';m.getContainer().appendChild(msg);
 const C=document.getElementById('chips');C.insertAdjacentHTML('beforeend','<button type="button" id="chip-td" data-c="td" aria-pressed="false"><span class="dot"></span><span class="td-lb">📅 行程</span></button>');
 const b=document.getElementById('chip-td'),lb=b.querySelector('.td-lb');
 const btn=document.createElement('button');btn.type='button';btn.id='tdlb';m.getContainer().appendChild(btn);
 const pan=document.createElement('div');pan.id='tdlist';m.getContainer().appendChild(pan);
 [btn,pan].forEach(e=>{L.DomEvent.disableClickPropagation(e);L.DomEvent.disableScrollPropagation(e)});
 const isMob=()=>innerWidth<=700;
 const has=k=>DAYS.some(d=>d.kind===k),cnt=()=>DAYS.reduce((a,d)=>a+d.E.length,0),mkc=()=>DAYS.reduce((a,d)=>a+d.mk,0);
 const dk=()=>has('today')&&has('tomorrow')?'both':has('today')?'today':has('tomorrow')?'tomorrow':null;
 function label(){const T=DAYS.find(d=>d.kind==='today'),M=DAYS.find(d=>d.kind==='tomorrow');
  return T&&M?`📅 今明行程（${md(T.date)}・${md(M.date)}）`:T?`📅 今日行程（${md(T.date)}）`:M?`📅 明日行程（${md(M.date)}）`:'📅 行程'}
 const isPast=(e,k,now)=>k==='today'&&!!(e.e||e.s)&&(e.e||e.s)<now;
 function draw(){G.clearLayers();MK={};DAYS=J0?parse(J0):[];sig=DAYS.map(d=>d.date+':'+d.kind).join(',');const now=tpHM(new Date());
  DAYS.forEach(D=>{const k=D.kind,name=NAME[k],tag=`${name} ${md(D.date)}（${wk(D.date)}）`,pts=[];let n=0;
   D.E.forEach(e=>{e.n=0;if(!e.ll)return;e.n=++n;pts.push(e.ll);
    const nav=`https://www.google.com/maps/dir/?api=1&destination=${e.ll[0]},${e.ll[1]}`;
    const h=`<div class="td-pp"><div class="td-day${k==='tomorrow'?' tmr':''}">📅 ${esc(tag)}</div><div class="pp-h">${n}. ${esc(e.title||'（未命名行程）')}</div>`+
     `<div><b>時間</b>：${esc(md(D.date))} ${esc(e.s||'未寫')}${e.e?'–'+esc(e.e):''}</div>`+(e.place?`<div><b>地點</b>：${esc(e.place)}</div>`:'')+(e.address?`<div><b>地址</b>：${esc(e.address)}</div>`:'')+
     (e.note?`<div>ℹ ${esc(e.note)}</div>`:'')+`<a class="td-nav" href="${nav}" target="_blank" rel="noopener">🧭 導航到這裡</a>`+
     `<div class="td-src">${esc(name)}行程 ${esc(D.date)}${J0.updated?'・資料更新 '+esc(J0.updated):''}</div></div>`;
    const mkr=L.marker(e.ll,{pane:'tdP',title:`${name}行程 ${n}`,keyboard:false,zIndexOffset:k==='today'?1100:1000,icon:L.divIcon({className:'',iconSize:[28,28],iconAnchor:[14,14],popupAnchor:[0,-13],html:`<div class="td-mk${k==='tomorrow'?' tmr':''}${isPast(e,k,now)?' past':''}" data-day="${k}" data-n="${n}">${n}</div>`})}).bindPopup(h,{maxWidth:280}).addTo(G);
    mkr._tdEnd=k==='today'?(e.e||e.s||''):'';MK[D.date+':'+n]=mkr});
   D.mk=pts.length;
   if(pts.length>1)L.polyline(pts,{pane:'tdL',color:COL[k],weight:4,opacity:.85,dashArray:'8 7',interactive:false,className:'td-line-'+k}).addTo(G)})}
 function listHTML(){const now=tpHM(new Date()),na=cnt()-mkc();
  return `<div class="tdl-h">📋 行程清單<br><small>${DAYS.map(D=>`${NAME[D.kind]} ${D.E.length} 筆`).join('・')}${na?`；未定位 ${na} 筆（地圖上沒有點）`:''}</small></div>`+
   DAYS.map(D=>{const k=D.kind;return `<div class="tdl-d${k==='tomorrow'?' tmr':''}">${NAME[k]}（${esc(md(D.date))}）<small> ${esc(wk(D.date))}・${D.E.length} 筆</small></div>`+
    D.E.map(x=>{const p=isPast(x,k,now),tmv=`${esc(x.s||'未寫')}${x.e?'–'+esc(x.e):''}`,pl=[x.place,x.address].filter(Boolean).map(esc).join('｜');
     const inner=`<span class="n${x.n?(p?' pst':k==='tomorrow'?' tmr':''):' na'}">${x.n?x.n:'未定位'}</span><span><span class="t">${tmv}</span> ${esc(x.title||'（未命名行程）')}${p?'（已結束）':''}${pl?`<br><span class="p">${pl}</span>`:''}${x.n?'<br><span class="go">→ 在地圖上看</span>':''}</span>`;
     return x.n?`<button type="button" class="td-li${p?' past':''}" data-tdk="${D.date}:${x.n}">${inner}</button>`:`<div class="td-li${p?' past':''}">${inner}</div>`}).join('')}).join('')}
 function place(){const cr=C.getBoundingClientRect(),mr=m.getContainer().getBoundingClientRect();const t=Math.max(10,Math.round(cr.bottom-mr.top+8));
  msg.style.top=t+'px';btn.style.top=t+'px';const br=btn.getBoundingClientRect();pan.style.top=(t+Math.round(br.height||30)+8)+'px';pan.style.left=btn.style.left=Math.round(cr.left-mr.left)+'px'}
 function openList(){if(!cnt())return;if(isMob()){const sh=document.getElementById('sheet'),sb=document.getElementById('sbody');if(sh&&sb){sb.innerHTML='<div class="td-sheet">'+listHTML()+'</div>';sh.classList.add('on')}listOpen=false}else listOpen=true;sync()}
 function closeList(){listOpen=false;sync()}
 btn.onclick=()=>{if(!isMob()&&listOpen)closeList();else openList()};
 document.addEventListener('click',ev=>{const it=ev.target.closest&&ev.target.closest('[data-tdk]');if(!it)return;const L0=MK[it.dataset.tdk];if(!L0)return;
  if(isMob()){const sh=document.getElementById('sheet');sh&&sh.classList.remove('on')}
  m.setView(L0.getLatLng(),Math.max(m.getZoom(),17),{animate:false});setTimeout(()=>L0.openPopup(),60)});
 function sync(){const on=m.hasLayer(G),k=dk(),n=cnt(),mk=mkc();b.classList.toggle('on',on);['tmr','both'].forEach(c=>b.classList.toggle(c,(c==='tmr'&&k==='tomorrow')||(c==='both'&&k==='both')));
  b.setAttribute('aria-pressed',on);lb.textContent=label();
  msg.style.display=on&&tried&&!n?'block':'none';
  btn.style.display=on&&n?'block':'none';['tmr','both'].forEach(c=>btn.classList.toggle(c,(c==='tmr'&&k==='tomorrow')||(c==='both'&&k==='both')));
  btn.textContent='📋 行程清單（'+DAYS.map(D=>`${D.kind==='today'?'今':'明'} ${D.E.length}`).join('・')+'）'+(n>mk?`・未定位 ${n-mk}`:'');
  const showPan=on&&n&&listOpen&&!isMob();pan.style.display=showPan?'block':'none';
  if(showPan){const html='<button type="button" class="tdl-x" aria-label="關閉">✕</button>'+listHTML();if(pan.__h!==html){pan.innerHTML=html;pan.__h=html;pan.querySelector('.tdl-x').onclick=closeList}}else if(pan.__h){pan.innerHTML='';pan.__h=''}
  const sb=document.getElementById('sbody');if(sb&&sb.querySelector('.td-sheet')){if(on&&n)sb.firstChild.innerHTML=listHTML();else{const sh=document.getElementById('sheet');sh&&sh.classList.remove('on');sb.innerHTML=''}}
  place()}
 // 每 30 秒：日期變了（明天→今天、昨天消失）就重畫；否則只更新「已結束」變灰
 function tick(){if(!J0)return;const s2=parse(J0).map(d=>d.date+':'+d.kind).join(',');if(s2!==sig){draw();sync();return}
  const now=tpHM(new Date());G.eachLayer(l=>{if(l._tdEnd&&l._icon){const d=l._icon.querySelector('.td-mk');d&&d.classList.toggle('past',l._tdEnd<now)}});if(listOpen)sync()}
 let busy=false;
 async function load(){if(busy)return;busy=true;try{const r=await fetch('today.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw 0;J0=await r.json();draw()}catch(e){J0=null;draw()}finally{busy=false;tried=true;sync()}}
 const set=on=>{on?G.addTo(m):m.removeLayer(G);try{localStorage.setItem('swTD1',on?'1':'0')}catch(e){}sync();if(on)load()};
 b.onclick=()=>{const on=!m.hasLayer(G);if(on&&!isMob())listOpen=true;if(!on)listOpen=false;set(on)};
 setInterval(()=>{if(m.hasLayer(G))load()},5*60*1000);
 setInterval(tick,30*1000);
 addEventListener('resize',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()});
 let s0=false;try{s0=localStorage.getItem('swTD1')==='1'}catch(e){}if(s0){if(!isMob())listOpen=true;set(true)}else{sync();load()}
 window.__td={G,set,load,openList,closeList,parse,kind,tpDate,
  state:()=>({on:m.hasLayer(G),cnt:cnt(),mk:mkc(),days:DAYS.map(D=>({date:D.date,kind:D.kind,n:D.E.length,mk:D.mk})),dk:dk(),label:lb.textContent,listOpen,today:tpDate(),tomorrow:tomorrow(),msg:msg.style.display!=='none',msgText:msg.textContent})}}
go()})();
