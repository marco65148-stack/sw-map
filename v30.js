/* v30：里界加粗高對比（深色外框＋淺色內線，隨縮放變粗），在建築之上、路線之下；2D 與 3D 共用 */
(function(){function go(){const m=window.__map,V=window.__V;if(!m||!V)return setTimeout(go,150);
 const p=m.createPane('liB');p.style.zIndex=390;p.style.pointerEvents='none';
 const W=z=>z>=17?[6,2.8]:z>=16?[4.5,2]:z>=14?[3,1.2]:[2,.8];
 const lt=()=>document.body.classList.contains('light');
 const st=()=>{const w=W(m.getZoom()),d=lt();return[{color:d?'#211D1D':'#000',opacity:d?.7:.85,weight:w[0],fill:false},{color:d?'#fff8f4':'#67e8f9',opacity:1,weight:w[1],fill:false}]};
 const s=st();const A=L.geoJSON(V,{pane:'liB',interactive:false,style:s[0]}).addTo(m),B=L.geoJSON(V,{pane:'liB',interactive:false,style:s[1]}).addTo(m);
 const up=()=>{const s=st();A.setStyle(s[0]);B.setStyle(s[1])};m.on('zoomend',up);new MutationObserver(up).observe(document.body,{attributes:true,attributeFilter:['class']});
 window.__liB={n:V.features.length,A,B};
 /* 3D：若 3D 已建立但里界資料晚到，補上 */
 const fix=()=>{const g=window.__gl;if(g&&g.getSource&&g.getSource('li'))g.getSource('li').setData(V)};fix();setTimeout(fix,1500)}
 go()})();
