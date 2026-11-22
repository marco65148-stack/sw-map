/* v51：導航「朝前」旋轉地圖時，里名標籤／拜票點等圖示的位置修正。
   v41 原本用 CSS `rotate` 把圖示轉回正立，但 `rotate` 會套在 Leaflet 的 translate3d 位移「之後」，
   以圖層原點為軸旋轉，標籤被甩到錯的位置（甚至離開畫面），看起來里名跟所在位置對不上。
   改法：把反向旋轉接在 translate3d 之後寫進同一個 transform，並以圖示的錨點為軸，標籤只在原地轉正。 */
(function(){if(!window.L)return;
const st=document.createElement('style');st.textContent=
'.leaflet-container.hu-rot .leaflet-pane:not(.leaflet-meP-pane)>.leaflet-marker-icon,.leaflet-container.hu-rot .leaflet-tooltip-pane>.leaflet-tooltip,.leaflet-container.hu-rot .leaflet-popup-pane>.leaflet-popup{rotate:none!important}';
document.head.appendChild(st);
const R=' rotate(var(--hu,0deg))';
function add(el){if(el&&el.style.transform&&el.style.transform.indexOf('rotate(')<0)el.style.transform+=R}
function isLabel(el){if(!el||!el.parentNode)return false;const p=el.parentNode;if(p.classList&&p.classList.contains('leaflet-meP-pane'))return false;return !el.querySelector('.arw,.ow')}
const MP=L.Marker.prototype,_sp=MP._setPos;
MP._setPos=function(pos){_sp.call(this,pos);const e=this._icon;if(e&&isLabel(e)){e.style.transformOrigin=(-(parseFloat(e.style.marginLeft)||0))+'px '+(-(parseFloat(e.style.marginTop)||0))+'px';add(e)}};
const TP=L.Tooltip.prototype,_tsp=TP._setPosition;
const TO={top:'50% 100%',bottom:'50% 0',left:'100% 50%',right:'0 50%',center:'50% 50%',auto:'50% 50%'};
TP._setPosition=function(pos){_tsp.call(this,pos);const e=this._container;if(!e)return;const d=['top','bottom','left','right','center'].find(k=>e.classList.contains('leaflet-tooltip-'+k))||'center';e.style.transformOrigin=TO[d];add(e)};
const PP=L.Popup.prototype;['_updatePosition','_animateZoom'].forEach(k=>{const f=PP[k];if(!f)return;PP[k]=function(){const r=f.apply(this,arguments);const e=this._container;if(e){e.style.transformOrigin='50% 100%';add(e)}return r}});
window.__v51={ok:true};
})();
