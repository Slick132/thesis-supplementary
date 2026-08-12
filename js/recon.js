/* Reconstruction viewer.
 *
 * Plots the observed and reconstructed series for one real site over a
 * scrollable window of the 6,935-day record. The values are the model's actual
 * output on held-out test sites, converted back to physical units, so what the
 * reader sees is the reconstruction rather than an illustration of one.
 */
(function () {
  'use strict';

  var CH = [
    { key: 'tmax', name: 'Maximum temperature', unit: 'deg C', fvu: 0.0120 },
    { key: 'tmin', name: 'Minimum temperature', unit: 'deg C', fvu: 0.0167 },
    { key: 'rhmax', name: 'Maximum relative humidity', unit: 'per cent', fvu: 0.0160 },
    { key: 'rhmin', name: 'Minimum relative humidity', unit: 'per cent', fvu: 0.0287 },
    { key: 'wind', name: 'Wind speed', unit: 'm/s', fvu: 0.1054 },
    { key: 'precip', name: 'Precipitation', unit: 'mm', fvu: 0.2364 }
  ];

  var WINDOWS = [
    { label: '1 month', n: 30 },
    { label: '3 months', n: 90 },
    { label: '1 year', n: 365 },
    { label: '5 years', n: 1825 },
    { label: 'all 19 years', n: 6935 }
  ];

  function cssVar(n, f) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(n);
    return (v && v.trim()) || f;
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  /* the record is a fixed 365 days a year, so a day index maps cleanly */
  function label(i) {
    var y = 2006 + Math.floor(i / 365);
    var d = (i % 365) + 1;
    var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var cum = [31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
    var mi = 0;
    while (mi < 11 && d > cum[mi]) mi++;
    var dom = mi === 0 ? d : d - cum[mi - 1];
    return dom + ' ' + m[mi] + ' ' + y;
  }

  function mount(host) {
    var state = { site: null, start: 0, win: 365, data: null, loading: false };

    var controls = el('div', 'picker');
    var winRow = el('div', 'controls');
    var canvas = el('canvas', 'recon');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label',
      'Observed and reconstructed series for six environmental variables at one test site');
    var wrap = el('div', 'canvas-wrap');
    wrap.appendChild(canvas);

    var range = document.createElement('input');
    range.type = 'range';
    range.min = '0';
    range.value = '0';
    range.setAttribute('aria-label', 'Scroll through the record');
    var readout = el('span', 'phase-label', '');
    var meta = el('p', 'fig-note', '');

    host.appendChild(controls);
    host.appendChild(wrap);
    host.appendChild(winRow);
    host.appendChild(meta);

    var winPicker = el('div', 'picker');
    WINDOWS.forEach(function (w) {
      var b = el('button', null, w.label);
      b.addEventListener('click', function () {
        state.win = w.n;
        state.start = Math.min(state.start, Math.max(0, (state.data ? state.data.n : 6935) - w.n));
        syncWin();
        draw();
      });
      b.dataset.n = String(w.n);
      winPicker.appendChild(b);
    });
    winRow.appendChild(winPicker);
    winRow.appendChild(range);
    winRow.appendChild(readout);

    function syncWin() {
      winPicker.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(Number(b.dataset.n) === state.win));
      });
      var n = state.data ? state.data.n : 6935;
      range.max = String(Math.max(0, n - state.win));
      range.value = String(state.start);
      range.disabled = state.win >= n;
    }

    range.addEventListener('input', function () {
      state.start = Number(range.value);
      draw();
    });

    function loadSite(key) {
      if (state.loading) return;
      state.loading = true;
      controls.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.key === key));
      });
      fetch('data/recon_' + key + '.json')
        .then(function (r) { return r.json(); })
        .then(function (d) {
          state.data = d;
          state.site = key;
          state.loading = false;
          state.start = Math.min(state.start, Math.max(0, d.n - state.win));
          meta.textContent = d.label + ', ' + d.why + '. Site ' + d.site_id +
            ' at ' + d.lat.toFixed(3) + ', ' + d.lon.toFixed(3) +
            '. Channel-mean squared error on the scaled data ' +
            d.channel_mean_mse.toFixed(4) + '. This site was never used for training.';
          syncWin();
          draw();
        })
        .catch(function () {
          state.loading = false;
          meta.textContent = 'Could not load the series for this site.';
        });
    }

    var W = 0, H = 0;
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      if (!W || !H) return;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function draw() {
      if (!W || !H) return;
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      var muted = cssVar('--muted', '#6B5D63');
      var ink = cssVar('--ink', '#2B1F24');
      var border = cssVar('--border', '#E0D6C9');
      var accent = cssVar('--accent', '#8C2F4A');
      var obsCol = cssVar('--d-pool', '#4A6670');

      if (!state.data) {
        ctx.fillStyle = muted;
        ctx.font = '12px ' + cssVar('--font', 'sans-serif');
        ctx.textAlign = 'center';
        ctx.fillText('Loading the series...', W / 2, H / 2);
        return;
      }

      var d = state.data;
      var a = state.start, b = Math.min(d.n, a + state.win);
      var padL = 52, padR = 12, padT = 16, padB = 26;
      var panelH = (H - padT - padB) / CH.length;
      var plotW = W - padL - padR;

      readout.textContent = label(a) + ' to ' + label(b - 1);

      CH.forEach(function (c, ci) {
        var obs = d.obs[c.key], rec = d.rec[c.key];
        var y0 = padT + panelH * ci;
        var labelH = 12;                 /* keep the trace clear of the panel name */
        var ph = panelH - 8 - labelH;

        var lo = Infinity, hi = -Infinity;
        for (var i = a; i < b; i++) {
          if (obs[i] < lo) lo = obs[i];
          if (rec[i] < lo) lo = rec[i];
          if (obs[i] > hi) hi = obs[i];
          if (rec[i] > hi) hi = rec[i];
        }
        if (!isFinite(lo)) { lo = 0; hi = 1; }
        if (hi - lo < 1e-6) { hi = lo + 1; }
        var padv = (hi - lo) * 0.08;
        var floorAtZero = lo >= 0;       /* rain, humidity and wind cannot go negative */
        lo -= padv; hi += padv;
        if (floorAtZero && lo < 0) lo = 0;

        function px(i) { return padL + ((i - a) / Math.max(1, b - a - 1)) * plotW; }
        function py(v) { return y0 + labelH + ph - ((v - lo) / (hi - lo)) * ph; }

        ctx.strokeStyle = border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, y0 + labelH + ph); ctx.lineTo(padL + plotW, y0 + labelH + ph);
        ctx.stroke();

        /* step size keeps the line cheap when the window is years long */
        var step = Math.max(1, Math.floor((b - a) / (plotW * 2)));

        function line(arr, colour, width, alpha) {
          ctx.strokeStyle = colour;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = width;
          ctx.beginPath();
          var first = true;
          for (var i = a; i < b; i += step) {
            var x = px(i), y = py(arr[i]);
            if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        line(obs, obsCol, 1.1, 0.85);
        line(rec, accent, 1.1, 0.9);

        ctx.fillStyle = ink;
        ctx.font = '600 9px ' + cssVar('--font', 'sans-serif');
        ctx.textAlign = 'left';
        ctx.fillText(c.name + '  (' + c.unit + ')', padL + 2, y0 + 9);
        ctx.fillStyle = muted;
        ctx.font = '8px ' + cssVar('--mono', 'monospace');
        ctx.textAlign = 'right';
        ctx.fillText(hi.toFixed(0), padL - 5, y0 + labelH + 6);
        ctx.fillText(lo.toFixed(0), padL - 5, y0 + labelH + ph);
        ctx.fillText('FVU ' + c.fvu.toFixed(3), W - padR, y0 + 9);
      });

      ctx.fillStyle = muted;
      ctx.font = '9px ' + cssVar('--font', 'sans-serif');
      ctx.textAlign = 'left';
      ctx.fillText(label(a), padL, H - 8);
      ctx.textAlign = 'right';
      ctx.fillText(label(b - 1), W - padR, H - 8);
      ctx.textAlign = 'center';
      ctx.fillStyle = obsCol;
      ctx.fillText('observed', W / 2 - 34, H - 8);
      ctx.fillStyle = accent;
      ctx.fillText('reconstructed', W / 2 + 34, H - 8);
    }

    fetch('data/recon_index.json')
      .then(function (r) { return r.json(); })
      .then(function (idx) {
        idx.sites.forEach(function (s) {
          var b = el('button', null, s.label);
          b.dataset.key = s.key;
          b.addEventListener('click', function () { loadSite(s.key); });
          controls.appendChild(b);
        });
        loadSite('median');
      })
      .catch(function () {
        meta.textContent = 'Could not load the site index.';
      });

    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    syncWin();
    resize();
  }

  function init() {
    var host = document.getElementById('recon-viewer');
    if (host) mount(host);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
