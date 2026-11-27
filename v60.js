/* v60：禁擴音地點（學校／醫院／圖書館）。車掃時一眼看出不能擴音的地方。
   大安、文山；校園範圍＝國土測繪中心「各級學校範圍圖」；醫院＝衛生局「公私立醫院」；
   圖書館＝市圖「各分館暨民眾閱覽室」。不改其他類別。垃圾車／車掃兩種模式都顯示。 */
(function () {
  const STYLE = {
    school:   { fill: '#f59f00', stroke: '#9a5b00', halo: '#fff3bf', tag: '校', badge: '#f08c00' },
    hospital: { fill: '#e03131', stroke: '#8a1010', halo: '#ffe3e3', tag: '醫', badge: '#c92a2a', r: 45 },
    library:  { fill: '#0c8599', stroke: '#0b4f5c', halo: '#d0ebff', tag: '圖', badge: '#0b7285', r: 35 }
  };
  const SRC = {
    school: '校園範圍：內政部國土測繪中心「各級學校範圍圖_121分帶」1151110（data.gov.tw/dataset/174606）；校名對照臺北市教育局「各級學校分布圖」（data.taipei，2026-10-05）。',
    hospital: '衛生局「臺北市公私立醫院」（data.taipei，2026-11-11）。僅醫院，不含診所。',
    library: '教育局／臺北市立圖書館「各分館暨民眾閱覽室」（data.taipei，2026-06-10）。已排除資料集標示已閉館者。'
  };

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function shortName(it) {
    let n = it.name || '';
    n = n.replace(/^臺北市立圖書館/, '市圖').replace(/^臺北市立/, '').replace(/^臺北市/, '');
    n = n.replace(/^國立/, '').replace(/^市立/, '').replace(/^私立/, '');
    n = n.replace(/醫療社團法人|醫療財團法人/g, '');
    n = n.replace(/-委託臺北醫學大學辦理/, '');
    n = n.replace(/中心診所醫療財團法人/, '');
    return n;
  }
  function css() {
    const s = document.createElement('style');
    s.textContent =
      '.qz-mk{display:flex;flex-direction:column;align-items:center;pointer-events:none;transform:translate(-50%,-50%);white-space:nowrap}' +
      '.qz-badge{display:flex;align-items:center;justify-content:center;font:900 12px/1 "Noto Sans TC",system-ui,sans-serif;color:#fff;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45);letter-spacing:0}' +
      '.qz-mk.school .qz-badge{width:22px;height:22px;border-radius:5px;background:#f08c00}' +
      '.qz-mk.hospital .qz-badge{width:24px;height:24px;border-radius:50%;background:#c92a2a}' +
      '.qz-mk.library .qz-badge{width:22px;height:18px;border-radius:4px 4px 6px 6px;background:#0b7285}' +
      '.qz-lb{margin-top:2px;font:800 12px/1.15 "Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif;color:#111;background:rgba(255,255,255,.88);padding:1px 5px;border-radius:4px;border:1px solid rgba(0,0,0,.2);text-shadow:0 0 4px #fff;max-width:11em;overflow:hidden;text-overflow:ellipsis}' +
      'body.m-sw .qz-lb{font-size:13px;background:rgba(255,255,255,.94);border-width:1.5px}' +
      'body.m-sw .qz-badge{transform:scale(1.08)}' +
      '.lz12 .qz-mk,.lz13 .qz-lb{display:none}' +
      '.lz13 .qz-badge{transform:scale(.85)}' +
      '.lz14 .qz-lb{font-size:11px}' +
      '.lz16 .qz-lb,.lz17 .qz-lb{font-size:13px}' +
      '.qz-pp b.k{display:inline-block;min-width:1.6em;text-align:center;color:#fff;border-radius:4px;padding:1px 5px;margin-right:6px;font-size:12px}' +
      '.qz-pp b.k.school{background:#f08c00}.qz-pp b.k.hospital{background:#c92a2a}.qz-pp b.k.library{background:#0b7285}' +
      '.qz-pp .warn{color:#c92a2a;font-weight:800;margin:6px 0 4px}' +
      '.qz-pp .src{font-size:11px;color:#868e96;margin-top:6px}' +
      '#chip-qz.on{background:#c92a2a;border-color:#c92a2a;color:#fff}' +
      '#qztip{font-size:11px;line-height:1.4;opacity:.9;margin:4px 0 2px}' +
      '#qztip i{display:inline-block;width:10px;height:10px;border-radius:2px;margin:0 4px 0 2px;vertical-align:-1px;border:1px solid #333}' +
      '#qztip i.h{border-radius:50%;background:#c92a2a}#qztip i.s{background:#f08c00}#qztip i.l{background:#0b7285}.qz-fill{fill-opacity:.36;stroke-opacity:1}body.m-sw .qz-fill{fill-opacity:.5}';
    document.head.appendChild(s);
  }
  function pop(it) {
    const tag = STYLE[it.kind].tag;
    const kindLb = { school: '學校', hospital: '醫院', library: '圖書館' }[it.kind];
    return `<div class="qz-pp"><b class="k ${it.kind}">${tag}</b><b>${esc(it.name)}</b>` +
      `<div class="warn">車掃時請勿擴音</div>` +
      `<div class="pp-g"><span>類別</span><b>${kindLb}${it.level && it.level !== kindLb ? '／' + esc(it.level) : ''}</b>` +
      (it.d ? `<span>行政區</span><b>${esc(it.d)}區</b>` : '') +
      (it.addr ? `<span>地址</span><span>${esc(it.addr)}</span>` : '') +
      (it.tel ? `<span>電話</span><span>${esc(it.tel)}</span>` : '') +
      `</div><div class="src">來源：${SRC[it.kind]}</div></div>`;
  }
  function icon(it) {
    const tag = STYLE[it.kind].tag;
    const nm = shortName(it);
    return L.divIcon({
      className: '',
      iconSize: [1, 1],
      iconAnchor: [0, 0],
      popupAnchor: [0, -16],
      html: `<div class="qz-mk ${it.kind}" data-kind="${it.kind}" data-name="${esc(it.name)}"><span class="qz-badge">${tag}</span><span class="qz-lb">${esc(nm)}</span></div>`
    });
  }

  function go() {
    const m = window.__map || window.map;
    if (!m || !document.getElementById('chips')) return setTimeout(go, 200);
    css();
    m.createPane('qzFill').style.zIndex = 350;
    m.createPane('qzMk').style.zIndex = 640;
    const fill = L.layerGroup();
    const mk = L.layerGroup();
    const G = L.layerGroup([fill, mk]);

    fetch('quiet-zones.json').then(function (r) { return r.json(); }).then(function (data) {
      const items = (data && data.items) || [];
      items.forEach(function (it) {
        const st = STYLE[it.kind];
        if (it.kind === 'school' && it.geom) {
          L.geoJSON({ type: 'Feature', geometry: it.geom, properties: it }, {
            pane: 'qzFill',
            style: function () {
              return { color: st.stroke, weight: 2, fillColor: st.fill, fillOpacity: 0.38, interactive: true, className: 'qz-fill school' };
            },
            onEachFeature: function (feat, layer) {
              layer.bindPopup(pop(it), { maxWidth: 300 });
            }
          }).addTo(fill);
        } else {
          L.circle([it.lat, it.lng], {
            pane: 'qzFill', radius: st.r || 40,
            color: st.stroke, weight: 2, fillColor: st.fill, fillOpacity: 0.28, className: 'qz-fill '+it.kind
          }).bindPopup(pop(it), { maxWidth: 300 }).addTo(fill);
        }
        L.marker([it.lat, it.lng], {
          pane: 'qzMk', keyboard: false, title: it.name + '（禁擴音）',
          icon: icon(it), zIndexOffset: it.kind === 'hospital' ? 20 : it.kind === 'library' ? 10 : 0
        }).bindPopup(pop(it), { maxWidth: 300 }).addTo(mk);
      });

      // search index
      try {
        if (window.IX && Array.isArray(window.IX)) {
          items.forEach(function (it) {
            window.IX.push({ t: '禁擴音', n: shortName(it), s: (it.kind === 'school' ? '學校' : it.kind === 'hospital' ? '醫院' : '圖書館') + ' ' + (it.addr || ''), ll: [it.lat, it.lng], qz: it });
          });
        }
      } catch (e) {}

      window.__v60 = {
        ready: function () { return true; },
        data: data,
        G: G,
        items: items,
        counts: (data.meta && data.meta.counts) || {},
        state: function () { return !!(window.__map || window.map).hasLayer(G); },
        labels: function () {
          return items.map(function (it) {
            return { kind: it.kind, name: it.name, short: shortName(it), lat: it.lat, lng: it.lng, d: it.d };
          });
        }
      };
    }).catch(function (e) {
      console.error('v60 quiet-zones', e);
    });

    const C = document.getElementById('chips');
    if (C && !document.getElementById('chip-qz')) {
      C.insertAdjacentHTML('beforeend', '<button type="button" id="chip-qz" data-c="qz" aria-pressed="true"><span class="dot"></span>禁擴音</button>');
    }
    const b = document.getElementById('chip-qz');
    const sync = function () {
      const on = m.hasLayer(G);
      if (b) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }
    };
    const set = function (on) {
      if (on) G.addTo(m); else m.removeLayer(G);
      try { localStorage.setItem('swQZ1', on ? '1' : '0'); } catch (e) {}
      sync();
    };
    if (b) b.onclick = function () { set(!m.hasLayer(G)); };
    let s0 = true;
    try { const v = localStorage.getItem('swQZ1'); if (v === '0') s0 = false; } catch (e) {}
    if (s0) G.addTo(m);
    sync();
    // keep visible when switching 垃圾車／車掃
    m.on('layeradd layerremove', sync);

    // legend
    const tipHost = document.getElementById('abctip');
    if (tipHost && !document.getElementById('qztip')) {
      tipHost.insertAdjacentHTML('afterend',
        '<div id="qztip"><b>禁擴音（車掃時請勿擴音）</b>　<i class="s"></i>學校（校園範圍）　<i class="h"></i>醫院　<i class="l"></i>圖書館<br>' +
        '來源：教育局各級學校名錄＋國土測繪學校範圍圖、衛生局公私立醫院、市圖分館暨閱覽室。不含診所、幼兒園；缺和平實小範圍（名錄有地址、範圍圖無此校）。</div>');
    }

    if (!window.__v60) window.__v60 = { ready: function () { return !!(this.items && this.items.length); }, G: G, set: set, state: function () { return m.hasLayer(G); } };
    else window.__v60.set = set;
  }
  go();
})();
