/* v56m：手機優化小工具
   1) 畫面提示（取代 alert）＋定位失敗的友善說明
   2) 所有「點位」彈窗自動補「🧭 導航」按鈕（Google Maps 路線）；已經有導航連結的（今明行程、里辦公處）不重複加 */
(function(){
let tt=null;
window.__swToast=function(t,ms){let el=document.getElementById('swtoast');
 if(!el){el=document.createElement('div');el.id='swtoast';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el);
  const st=document.createElement('style');st.textContent='#swtoast{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:6000;max-width:min(92vw,420px);box-sizing:border-box;background:rgba(33,37,41,.94);color:#fff;padding:10px 14px;border-radius:14px;font:600 14px/1.5 "Noto Sans TC",system-ui,sans-serif;box-shadow:0 2px 12px rgba(0,0,0,.4);display:none;cursor:pointer}#swtoast.on{display:block}';document.head.appendChild(st);
  el.onclick=()=>el.classList.remove('on')}
 el.textContent=t;el.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>el.classList.remove('on'),ms||7000)};
window.__swGeoMsg=function(code){
 if(!window.isSecureContext)return '📍 定位需要 https 網址，請用 GitHub Pages 網址開啟';
 if(code==1)return '📍 沒有位置權限，所以無法顯示你的位置。要用的話：在瀏覽器設定把這個網站的「位置」改成允許（iPhone：設定 › 隱私權與安全性 › 定位服務 › Safari 網站），再按一次 ◎。不開也可以照常看地圖。';
 if(code==3)return '📍 定位逾時，還在繼續找；到窗邊或戶外比較快';
 return '📍 暫時抓不到位置（GPS／網路訊號弱），稍後會再試';};
function go(){const m=window.__map;if(!m||!window.L)return setTimeout(go,250);init(m)}
function init(m){
 const st=document.createElement('style');st.textContent='.sw-nav{display:inline-block;margin-top:6px;padding:6px 12px;border-radius:9px;background:#2f9e44;color:#fff!important;text-decoration:none;font:700 13px/1.2 "Noto Sans TC",system-ui,sans-serif}';document.head.appendChild(st);
 m.on('popupopen',e=>{const p=e.popup,s=p&&p._source;if(!s||typeof s.getLatLng!=='function'||typeof s.getLatLngs==='function')return;
  const el=p.getElement&&p.getElement();const c=el&&el.querySelector('.leaflet-popup-content');if(!c||c.querySelector('a[href*="google.com/maps/dir"]'))return;
  const ll=s.getLatLng();if(!ll||!isFinite(ll.lat)||!isFinite(ll.lng))return;
  const a=document.createElement('a');a.className='sw-nav';a.target='_blank';a.rel='noopener';a.textContent='🧭 導航到這裡';
  a.href='https://www.google.com/maps/dir/?api=1&destination='+ll.lat.toFixed(6)+','+ll.lng.toFixed(6);
  const w=document.createElement('div');w.appendChild(a);c.appendChild(w);try{p._updateLayout();p._updatePosition();p._adjustPan&&p._adjustPan()}catch(_){}
  // 手機版：index.html 會把彈窗內容搬到底部面板（#sheet），也要補上導航
  setTimeout(()=>{const sh=document.getElementById('sheet'),sb=document.getElementById('sbody');
  if(sh&&sb&&sh.classList.contains('on')&&!sb.querySelector('.td-sheet')&&!sb.querySelector('a[href*="google.com/maps/dir"]'))sb.appendChild(w.cloneNode(true))},0)});
}
go()})();
