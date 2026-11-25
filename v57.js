/* v57：道路資訊更清楚。預設淺色底圖改為 OSM（巷弄路名較完整）；國土測繪中心通用版可在圖層控制切換。
   另依縮放降低里底色透明度，避免高倍時色塊蓋住路名。不改既有功能。 */
(function () {
  function fill(kind, z) {
    if (kind === 'vote') {
      if (z <= 13) return 0.5;
      if (z >= 17) return 0.18;
      return Math.round((0.5 - (z - 13) * (0.5 - 0.18) / 4) * 1000) / 1000;
    }
    if (z <= 13) return 0.45;
    if (z >= 17) return 0.16;
    return Math.round((0.45 - (z - 13) * (0.45 - 0.16) / 4) * 1000) / 1000;
  }
  function wrap(layer, kind) {
    const orig = layer.options.style;
    layer.options.style = function (f) {
      const s = typeof orig === 'function' ? orig(f) : Object.assign({}, orig || {});
      const z = (window.map && map.getZoom) ? map.getZoom() : 13;
      s.fillOpacity = fill(kind, z);
      if (z >= 16) s.weight = Math.min(s.weight == null ? 1 : s.weight, 0.8);
      return s;
    };
  }
  function restyle() {
    const m = window.map, vote = window.vote, abc = window.abc;
    if (!m || !vote || !abc) return false;
    if (!vote.__v57) {
      wrap(vote, 'vote');
      wrap(abc, 'abc');
      vote.__v57 = 1;
      m.on('zoomend overlayadd', function () {
        if (m.hasLayer(vote)) vote.eachLayer(function (l) { vote.resetStyle(l); });
        if (m.hasLayer(abc)) abc.eachLayer(function (l) { abc.resetStyle(l); });
      });
    }
    if (m.hasLayer(vote)) vote.eachLayer(function (l) { vote.resetStyle(l); });
    if (m.hasLayer(abc)) abc.eachLayer(function (l) { abc.resetStyle(l); });
    return true;
  }
  function boot() { if (restyle()) return; setTimeout(boot, 200); }
  boot();
  window.__v57 = { fill: fill, ready: function () { return !!(window.vote && window.vote.__v57); } };
})();
