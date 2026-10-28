/* v32：地圖上方一列圖層開關（垃圾車／車掃／全聯／拜票點／公園／市場）。垃圾車與車掃為同一時間只顯示一種的模式。無 API key。 */
(function(){
const CH=[['gt','🚛','垃圾車'],['sw','🧹','車掃'],['px','🛒','全聯'],['cv','📌','拜票點'],['pk','🌳','公園'],['mk','🏪','市場']];
let gtOn=true;
function go(){const m=window.__map;if(!m||!window.__poi||!window.__gtL||!window.__setMode||!document.getElementById('mode'))return setTimeout(go,200);init(m)}
function cvBuiltOn(){const f=document.getElementById('fcv');return f?f.checked:false}
function state(c,m){const P=window.__poi.LY;
 if(c==='sw')return window.__MODE==='sw';
 if(c==='gt')return window.__MODE!=='sw'&&gtOn;
 if(c==='cv')return m.hasLayer(P.cv)||cvBuiltOn();
 return m.hasLayer(P[c])}
function setCv(on,m){const P=window.__poi.LY;const f=document.getElementById('fcv');
 if(f&&f.checked!==on){f.checked=on;f.dispatchEvent(new Event('change'))}
 on?P.cv.addTo(m):m.removeLayer(P.cv);const s=window.__poi.st();s.on.cv=on;try{localStorage.setItem('swPOI1',JSON.stringify(s))}catch(e){}}
function setGt(on,m){gtOn=on;window.__gtL.forEach(l=>on?l.addTo(m):m.removeLayer(l));document.body.classList.toggle('gt-off',!on)}
function tap(c,m){const P=window.__poi.LY,on=state(c,m);
 if(c==='sw'){window.__setMode(on?'gt':'sw');if(on)setGt(gtOn,m)}
 else if(c==='gt'){if(window.__MODE==='sw'){window.__setMode('gt');setGt(true,m)}else setGt(!gtOn,m)}
 else if(c==='cv')setCv(!on,m);
 else{const cb=document.getElementById('poiOn-'+c);on?m.removeLayer(P[c]):P[c].addTo(m);if(cb){cb.checked=!on;cb.dispatchEvent(new Event('change'))}}
 sync(m)}
function sync(m){CH.forEach(([c])=>{const b=document.getElementById('chip-'+c);if(!b)return;const on=state(c,m);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)})}
function place(){const r=document.getElementById('chips'),md=document.getElementById('mode');if(!r||!md)return;r.style.top=innerWidth<=760?getComputedStyle(md).top:""}
function init(m){
 const md=document.getElementById('mode');md.classList.add('v32-hidden');
 document.body.insertAdjacentHTML('beforeend','<div id="chips" class="glass" role="toolbar" aria-label="圖層開關">'+CH.map(([c,i,t])=>`<button type="button" id="chip-${c}" data-c="${c}" aria-pressed="false"><span class="dot"></span>${i} ${t}</button>`).join('')+'</div>');
 document.querySelectorAll('#chips button').forEach(b=>b.onclick=()=>tap(b.dataset.c,m));
 m.on('layeradd layerremove',()=>sync(m));const f=document.getElementById('fcv');if(f)f.addEventListener('change',()=>sync(m));
 document.querySelectorAll('#mode button[data-m]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>sync(m),0)));
 place();addEventListener('resize',place);sync(m);window.__chips={sync:()=>sync(m),state:c=>state(c,m)}}
go()})();
