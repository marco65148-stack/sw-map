/* v59：里心標籤改為兩行——上行聖文 ABC（維持原顏色），下行賴 ABC（中性文字、不上色）；
   整組以既有里心點置中。賴 ABC 依 2024 得票率區內名次，A／B／C 人數比照聖文名單。
   不改里填色（得票率熱圖／聖文色塊）。保留 v58 全部功能。 */
(function () {
  window.__v59 = {
    ready: function () {
      return !!(window.lbl && window.V && window.__laiCuts);
    },
    cuts: function () { return window.__laiCuts || null; },
    labels: function () {
      const src = window.lbl;
      if (!src || !src.getLayers) return [];
      return src.getLayers().map(function (m) {
        const el = m.getElement && m.getElement();
        const lb = el && el.querySelector('.li-lb');
        const ll = m.getLatLng && m.getLatLng();
        const r = lb ? lb.getBoundingClientRect() : null;
        const sw = lb && lb.querySelector('.li-sw b');
        const lai = lb && lb.querySelector('.li-lai b');
        const name = lb && lb.querySelector('.li-name');
        function col(node) {
          if (!node) return null;
          const s = getComputedStyle(node);
          return s.color;
        }
        return {
          name: name ? name.textContent : null,
          nameShown: !!(name && getComputedStyle(name).display !== 'none'),
          sw: sw ? sw.textContent : null,
          swClass: sw ? sw.className : null,
          swColor: col(sw),
          lai: lai ? lai.textContent : null,
          laiColor: col(lai),
          lat: ll && +ll.lat.toFixed(6),
          lng: ll && +ll.lng.toFixed(6),
          box: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
                     cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2) } : null,
          visible: !!(r && r.width > 0 && r.height > 0 && getComputedStyle(lb).display !== 'none')
        };
      });
    },
    overlaps: function () {
      const vis = this.labels().filter(function (x) { return x.visible && x.box; });
      const hits = [];
      for (let i = 0; i < vis.length; i++) {
        for (let j = i + 1; j < vis.length; j++) {
          const a = vis[i].box, b = vis[j].box;
          const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
          const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
          if (ox > 2 && oy > 2) hits.push({ a: vis[i].name, b: vis[j].name, ox: ox, oy: oy });
        }
      }
      return hits;
    }
  };
})();
