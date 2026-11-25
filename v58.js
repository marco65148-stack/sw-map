/* v58：導航／跟隨模式中，使用者拖曳、縮放或旋轉地圖時，暫停自動置中與自動轉向；
   地圖停在使用者移到的位置和角度，定位點照常更新。按「重新置中」或 ◎ 才恢復跟隨。
   不做倒數自動回彈。保留 v57 全部功能。 */
(function () {
  const map = window.__map || window.map;
  const HU = window.__hu;
  if (!map || !HU || HU.__v58) return;
  HU.__v58 = 1;

  function $(id) { return document.getElementById(id); }

  function markPaused() {
    const b = $('bloc');
    if (b) {
      b.classList.remove('on');
      b.classList.add('paused');
      b.title = '回到我的位置（重新置中）';
      b.setAttribute('aria-label', '重新置中');
    }
    const rec = $('brecenter');
    if (rec) rec.classList.add('show');
    const me = $('swme');
    if (me && me.classList.contains('on')) {
      me.className = 'paused';
      me.textContent = '📍 回到我的位置';
    }
  }

  function markFollow() {
    const rec = $('brecenter');
    if (rec) rec.classList.remove('show');
    const b = $('bloc');
    if (b) b.classList.remove('paused');
  }

  const origPause = HU.pause.bind(HU);
  /* 根因：舊 pause() 會 applyRot(0) 把地圖轉回正北；這裡只停跟隨，不改角度。 */
  HU.pause = function () {
    if (!HU.follow) return;
    HU.follow = false;
    if (typeof HU.ui === 'function') HU.ui();
    else {
      const b = $('bnorth');
      if (b && b.querySelector('.ndl')) {
        b.querySelector('.ndl').style.transform = 'rotate(' + (-HU.rot) + 'deg)';
      }
    }
    markPaused();
  };

  const origFollowTo = HU.followTo.bind(HU);
  HU.followTo = function (ll) {
    HU._auto = 1;
    markFollow();
    try {
      return origFollowTo(ll);
    } finally {
      var done = false;
      function clear() { if (done) return; done = true; HU._auto = 0; map.off('moveend', clear); map.off('zoomend', clear); }
      map.once('moveend', clear);
      map.once('zoomend', clear);
      setTimeout(clear, 900);
    }
  };

  const origStop = HU.stop.bind(HU);
  HU.stop = function () {
    markFollow();
    const rec = $('brecenter');
    if (rec) rec.classList.remove('show');
    return origStop();
  };

  function userBreak() {
    if (HU._auto) return;
    if (HU.tracking && HU.follow) HU.pause();
  }

  map.on('dragstart', userBreak);
  map.on('zoomstart', userBreak);
  /* Leaflet 沒有內建旋轉手勢；兩指觸控通常會進 zoomstart。再保險聽 touch。 */
  const el = map.getContainer();
  el.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches.length >= 2) userBreak();
  }, { passive: true, capture: true });

  function mkRecenter() {
    if ($('brecenter')) return;
    const tl = $('tools');
    if (!tl) return;
    const b = document.createElement('button');
    b.id = 'brecenter';
    b.className = 'glass';
    b.type = 'button';
    b.textContent = '重新置中';
    b.title = '回到我的位置並恢復跟隨';
    b.setAttribute('aria-label', '重新置中');
    const ref = $('bloc');
    if (ref && ref.nextSibling) tl.insertBefore(b, ref.nextSibling);
    else if (ref) tl.insertBefore(b, ref.nextSibling);
    else tl.appendChild(b);
    b.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      const trk = window.__trk;
      if (trk && trk.on && !HU.follow) { trk.toggle(); return; }
      const me = $('swme');
      if (me && (me.classList.contains('paused') || (window.__swnav && __swnav().on && !__swnav().follow))) {
        me.click();
        return;
      }
      if (HU.tracking && !HU.follow && HU.last) {
        HU.followTo(HU.last);
        if ($('bloc')) { $('bloc').classList.remove('paused'); $('bloc').classList.add('on'); }
        markFollow();
      }
    };
  }

  const st = document.createElement('style');
  st.id = 'v58css';
  st.textContent =
    '#bloc.paused{background:#f59e0b!important;color:#fff!important;outline:2px solid #fff;box-shadow:0 0 0 2px #f59e0b}' +
    '#brecenter{display:none;width:auto!important;max-width:none;height:auto!important;min-height:44px;padding:8px 10px!important;' +
    'font:700 12px/1.25 "Noto Sans TC",system-ui,sans-serif;white-space:nowrap;background:#f59e0b!important;color:#fff!important}' +
    '#tools{align-items:flex-end}' +
    '#brecenter.show{display:block}';
  document.head.appendChild(st);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mkRecenter);
  else mkRecenter();
  setTimeout(mkRecenter, 1500);

  window.__v58 = {
    ready: function () { return !!HU.__v58; },
    state: function () {
      const m = window.__map || window.map;
      const c = m && m.getCenter && m.getCenter();
      const rec = $('brecenter');
      return {
        tracking: !!HU.tracking,
        follow: !!HU.follow,
        rot: HU.rot,
        bearing: HU.bearing,
        mode: HU.mode,
        last: HU.last || null,
        blocPaused: !!( $('bloc') && $('bloc').classList.contains('paused') ),
        recenShow: !!(rec && rec.classList.contains('show')),
        recenText: rec ? rec.textContent : null,
        zoom: m && m.getZoom && m.getZoom(),
        center: c ? [+c.lat.toFixed(6), +c.lng.toFixed(6)] : null
      };
    }
  };
})();
