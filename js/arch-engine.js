/* Architecture animation engine.
 *
 * One renderer drives every architecture in the thesis. A specification lists
 * the encoder layers with their widths, kernel size, stride and dilation, and
 * the engine derives the geometry, the sequence-length trajectory and the
 * receptive field from the convolution arithmetic, so the drawing cannot
 * disagree with the numbers reported in the thesis.
 *
 * Layout is a hairpin. The encoder runs left to right along the top, the
 * latent vector sits at the right, and the decoder runs right to left along
 * the bottom, so the reconstruction finishes directly beneath the input it is
 * trying to reproduce.
 */
(function () {
  'use strict';

  var INPUT_LEN = window.INPUT_LEN || 6935;
  var INPUT_CH = window.INPUT_CH || 6;

  var CHANNELS = ['tmax', 'tmin', 'rhmax', 'rhmin', 'wind', 'precip'];

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  function fmt(n) {
    if (n === null || n === undefined) return '';
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /* Deterministic pseudo-random so a redraw always looks identical. */
  function seeded(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* A climate-like trace: annual cycle plus texture. Precipitation is spiky. */
  function series(channel, n, smooth) {
    var rnd = seeded(97 + channel * 7919);
    var out = [];
    var phase = channel * 0.7;
    var spiky = channel === 5;
    var drift = 0;
    for (var i = 0; i < n; i++) {
      var t = i / n;
      var seasonal = Math.sin(t * Math.PI * 2 * 3 + phase);
      var v;
      if (spiky) {
        var r = rnd();
        v = r > (smooth ? 0.86 : 0.78) ? r * (0.5 + 0.5 * (seasonal + 1) / 2) : 0.02;
        if (smooth) v = v * 0.62 + 0.06;
      } else {
        drift = drift * 0.86 + (rnd() - 0.5) * (smooth ? 0.06 : 0.16);
        v = 0.5 + seasonal * 0.34 + drift;
      }
      out.push(Math.max(0, Math.min(1, v)));
    }
    return out;
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ---------- build the ordered node list from a specification ---------- */

  function buildNodes(spec) {
    var enc = [];
    var layers = spec.layers || [];

    enc.push({
      kind: 'input', label: 'input', sub: INPUT_CH + ' x ' + fmt(INPUT_LEN),
      width: INPUT_CH, len: INPUT_LEN, type: 'io'
    });

    if (spec.parallel) {
      enc.push({
        kind: 'split', label: 'split', sub: 'two branches', type: 'merge',
        width: INPUT_CH, len: INPUT_LEN
      });
    }

    layers.forEach(function (l, i) {
      enc.push({
        kind: 'enc', idx: i, label: l.type === 'strided' ? 'strided' : 'dilated',
        sub: fmt(l.len), width: l.width, len: l.len, k: l.k, d: l.d,
        stride: l.type === 'strided' ? 2 : 1, rf: l.rf, type: l.type
      });
    });

    if (spec.parallel && (spec.layersB || []).length) {
      var isSum = /summ?ed|\bsum\b/i.test(spec.reductionText || '') || spec.reduction === 'sum';
      enc.push({
        kind: 'fuse',
        label: isSum ? 'sum branches' : 'concat + 1x1',
        sub: 'both pooled to 109',
        type: 'merge', width: 256, len: 109
      });
    }

    if (spec.heads === 6) {
      enc.push({
        kind: 'concat', label: 'concatenate', sub: '6 heads', type: 'merge',
        width: 256, len: 109
      });
    }

    var last = layers.length ? layers[layers.length - 1] : { len: INPUT_LEN, width: 256 };
    if (spec.reduction === 'adaptive') {
      enc.push({
        kind: 'pool', label: 'adaptive pool', sub: fmt(last.len) + ' to 109',
        type: 'pool', width: last.width, len: 109
      });
    } else if (spec.reduction === 'gap') {
      enc.push({
        kind: 'gap', label: 'global average', sub: fmt(last.len) + ' to 1',
        type: 'pool', width: last.width, len: 1, lossy: true
      });
    }

    enc.push({
      kind: 'flatten', label: 'flatten', sub: fmt(spec.bridgeIn), type: 'flat',
      width: 1, len: 1
    });
    enc.push({
      kind: 'mlp', label: 'MLP bridge', sub: fmt(spec.bridgeIn) + ' to ' + fmt(spec.bridgeHidden),
      type: 'mlp', width: 1, len: 1
    });
    enc.push({
      kind: 'latent', label: spec.pipeline === 'variational' ? 'latent (mu, logvar)' : 'latent',
      sub: 'z = ' + spec.z, type: 'latent', width: spec.z, len: 1
    });

    /* Decoder mirrors the encoder. Drawn right to left along the bottom. */
    var dec = [];
    dec.push({ kind: 'demlp', label: 'MLP', sub: fmt(spec.bridgeHidden) + ' to ' + fmt(spec.bridgeIn), type: 'mlp', width: 1, len: 1 });
    dec.push({ kind: 'reshape', label: 'reshape', sub: fmt(last.width) + ' x ' + fmt(spec.reduction === 'builtin' ? last.len : 109), type: 'flat', width: last.width, len: 1 });
    if (spec.reduction === 'adaptive' || spec.reduction === 'gap') {
      dec.push({ kind: 'interp', label: 'interpolate', sub: 'linear, no weights', type: 'pool', width: last.width, len: last.len });
    }
    var rev = layers.slice().reverse();
    rev.forEach(function (l, i) {
      var target = i + 1 < rev.length ? rev[i + 1].len : INPUT_LEN;
      dec.push({
        kind: 'dec', idx: i,
        label: l.type === 'strided' ? 'transposed' : 'dilated',
        sub: fmt(l.type === 'strided' ? target : l.len),
        width: i + 1 < rev.length ? rev[i + 1].width : INPUT_CH,
        len: l.type === 'strided' ? target : l.len,
        k: l.k, d: l.d, type: l.type
      });
    });
    dec.push({
      kind: 'output', label: 'reconstruction', sub: INPUT_CH + ' x ' + fmt(INPUT_LEN),
      width: INPUT_CH, len: INPUT_LEN, type: 'io'
    });

    return { enc: enc, dec: dec };
  }

  /* ---------- the controller ---------- */

  function mount(canvas, spec, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var nodes = buildNodes(spec);
    var all = nodes.enc.concat(nodes.dec);
    var total = all.length;

    var playing = false;
    var t = 0;                 /* continuous position along the node list */
    var raf = null;
    var speed = opts.speed || 0.85;   /* nodes per second */
    var visible = false;
    var W = 0, H = 0, dpr = 1;

    var inputSeries = [];
    var outputSeries = [];
    for (var c = 0; c < INPUT_CH; c++) {
      inputSeries.push(series(c, 150, false));
      outputSeries.push(series(c, 150, true));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function geom() {
      var padX = 14, padTop = 34, padBottom = 34;
      var rowGap = 26;
      var usableH = H - padTop - padBottom;
      var rowH = (usableH - rowGap) / 2;
      var topAxis = padTop + rowH * 0.5;
      var botAxis = padTop + rowH + rowGap + rowH * 0.5;

      function place(list, axis, reverse) {
        var n = list.length;
        var avail = W - padX * 2;
        var slot = avail / n;
        var boxW = Math.min(slot * 0.74, 58);
        return list.map(function (node, i) {
          var idx = reverse ? n - 1 - i : i;
          var cx = padX + slot * (idx + 0.5);
          var wRatio = Math.log2(Math.max(2, node.width || 2)) / Math.log2(256);
          var h = Math.max(16, Math.min(rowH * 0.82, rowH * 0.30 + rowH * 0.52 * wRatio));
          if (node.type === 'latent') h = rowH * 0.5;
          if (node.type === 'flat' || node.type === 'mlp') h = rowH * 0.42;
          return {
            node: node, cx: cx, cy: axis, w: boxW, h: h,
            x: cx - boxW / 2, y: axis - h / 2
          };
        });
      }
      return {
        top: place(nodes.enc, topAxis, false),
        bot: place(nodes.dec, botAxis, true),
        rowH: rowH, topAxis: topAxis, botAxis: botAxis, padX: padX
      };
    }

    function colourFor(node) {
      if (node.type === 'strided') return cssVar('--d-strided', '#61223B');
      if (node.type === 'dilated') return cssVar('--d-dilated', '#8C6B2F');
      if (node.type === 'pool') return cssVar('--d-pool', '#4A6670');
      if (node.type === 'mlp' || node.type === 'flat') return cssVar('--d-mlp', '#3F6B4A');
      if (node.type === 'latent') return cssVar('--d-latent', '#C2761F');
      if (node.type === 'merge') return cssVar('--muted', '#6B5D63');
      return cssVar('--muted', '#6B5D63');
    }

    function drawSeriesBox(g, data, colour, progress) {
      var n = data[0].length;
      var chH = g.h / INPUT_CH;
      for (var c = 0; c < INPUT_CH; c++) {
        var yTop = g.y + c * chH;
        ctx.save();
        ctx.beginPath();
        ctx.rect(g.x, yTop, g.w * progress, chH);
        ctx.clip();
        ctx.beginPath();
        for (var i = 0; i < n; i++) {
          var px = g.x + (i / (n - 1)) * g.w;
          var py = yTop + chH - 1 - data[c][i] * (chH - 2);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = colour;
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = 0.9;
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = cssVar('--border', '#E0D6C9');
      ctx.lineWidth = 1;
      roundRect(ctx, g.x, g.y, g.w, g.h, 3);
      ctx.stroke();
    }

    /* Feature-map slab: horizontal bands, filling left to right as the
       kernel sweeps. Band count is a readable proxy for channel width. */
    function drawSlab(g, colour, progress, active) {
      var bands = Math.max(3, Math.min(9, Math.round(Math.log2(Math.max(2, g.node.width)) - 1)));
      var bh = g.h / bands;
      for (var b = 0; b < bands; b++) {
        var y = g.y + b * bh;
        var lag = (b / bands) * 0.22;
        var p = Math.max(0, Math.min(1, (progress - lag) / (1 - lag || 1)));
        ctx.fillStyle = colour;
        ctx.globalAlpha = 0.16 + 0.5 * (b / Math.max(1, bands - 1));
        ctx.fillRect(g.x, y + 0.6, g.w * p, bh - 1.2);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = active ? colour : cssVar('--border', '#E0D6C9');
      ctx.lineWidth = active ? 1.6 : 1;
      roundRect(ctx, g.x, g.y, g.w, g.h, 3);
      ctx.stroke();
    }

    /* The teaching element: k taps spaced by the dilation rate. At d = 1 the
       taps are adjacent, at d = 8 they fan out over 49 positions while the
       kernel still holds only 7 weights. */
    function drawKernel(g, k, d, phase) {
      k = k || 7;
      d = d || 1;
      var span = Math.min(g.w * 1.5, 12 + (k - 1) * d * 1.9);
      var travel = g.w - 6;
      var cx = g.x + 3 + travel * phase;
      var y = g.y - 11;
      ctx.strokeStyle = cssVar('--accent', '#8C2F4A');
      ctx.lineWidth = 1.1;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(cx - span / 2, y);
      ctx.lineTo(cx + span / 2, y);
      ctx.stroke();
      for (var i = 0; i < k; i++) {
        var tx = cx - span / 2 + (span * i) / (k - 1);
        ctx.beginPath();
        ctx.moveTo(tx, y - 3);
        ctx.lineTo(tx, y + 3);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function drawLatent(g, progress) {
      var z = Math.max(1, Math.round(spec.z || 5));
      var r = Math.min(6, g.h / (z * 2.4));
      var colour = cssVar('--d-latent', '#C2761F');
      for (var i = 0; i < z; i++) {
        var cy = g.y + (g.h * (i + 0.5)) / z;
        var lag = i / z * 0.5;
        var p = Math.max(0, Math.min(1, (progress - lag) / (1 - lag || 1)));
        ctx.beginPath();
        ctx.arc(g.cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = colour;
        ctx.globalAlpha = 0.25 + 0.75 * p;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    function drawMlpFan(g, progress) {
      var colour = cssVar('--d-mlp', '#3F6B4A');
      ctx.strokeStyle = colour;
      ctx.lineWidth = 0.7;
      ctx.globalAlpha = 0.5;
      var nIn = 6, nOut = 4;
      for (var i = 0; i < nIn; i++) {
        for (var o = 0; o < nOut; o++) {
          var y1 = g.y + (g.h * (i + 0.5)) / nIn;
          var y2 = g.y + (g.h * (o + 0.5)) / nOut;
          ctx.beginPath();
          ctx.moveTo(g.x, y1);
          ctx.lineTo(g.x + g.w * progress, y1 + (y2 - y1) * progress);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = cssVar('--border', '#E0D6C9');
      ctx.lineWidth = 1;
      roundRect(ctx, g.x, g.y, g.w, g.h, 3);
      ctx.stroke();
    }

    function drawHeads(g, colour, progress) {
      var n = 6;
      var hh = g.h / n;
      for (var i = 0; i < n; i++) {
        var y = g.y + i * hh;
        var lag = (i / n) * 0.3;
        var p = Math.max(0, Math.min(1, (progress - lag) / (1 - lag || 1)));
        ctx.fillStyle = colour;
        ctx.globalAlpha = 0.30 + 0.35 * (i / n);
        ctx.fillRect(g.x, y + 0.5, g.w * p, hh - 1);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = cssVar('--border', '#E0D6C9');
      roundRect(ctx, g.x, g.y, g.w, g.h, 3);
      ctx.stroke();
    }

    function connector(a, b, colour, alpha) {
      ctx.strokeStyle = colour;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x + a.w, a.cy);
      ctx.lineTo(b.x, b.cy);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    function draw() {
      if (!W || !H) return;
      var G = geom();
      var ink = cssVar('--ink', '#2B1F24');
      var muted = cssVar('--muted', '#6B5D63');
      var border = cssVar('--border', '#E0D6C9');

      ctx.clearRect(0, 0, W, H);

      /* connectors first so boxes sit on top */
      var i;
      for (i = 0; i < G.top.length - 1; i++) {
        connector(G.top[i], G.top[i + 1], border, t > i + 0.5 ? 0.9 : 0.35);
      }
      for (i = 0; i < G.bot.length - 1; i++) {
        connector(G.bot[i + 1], G.bot[i], border, t > G.top.length + i + 0.5 ? 0.9 : 0.35);
      }
      /* hairpin turn from latent down to the decoder */
      var lastTop = G.top[G.top.length - 1];
      var firstBot = G.bot[0];
      ctx.strokeStyle = border;
      ctx.globalAlpha = t > G.top.length - 0.5 ? 0.9 : 0.35;
      ctx.beginPath();
      ctx.moveTo(lastTop.cx, lastTop.y + lastTop.h);
      ctx.bezierCurveTo(lastTop.cx, lastTop.y + lastTop.h + 16,
                        firstBot.cx, firstBot.y - 16, firstBot.cx, firstBot.y);
      ctx.stroke();
      ctx.globalAlpha = 1;

      function paint(list, offset) {
        list.forEach(function (g, idx) {
          var node = g.node;
          var global = offset + idx;
          var progress = Math.max(0, Math.min(1, t - global));
          var active = t >= global && t < global + 1;
          var colour = colourFor(node);

          if (node.kind === 'input') {
            drawSeriesBox(g, inputSeries, colour, progress);
          } else if (node.kind === 'output') {
            drawSeriesBox(g, outputSeries, cssVar('--accent', '#8C2F4A'), progress);
          } else if (node.type === 'latent') {
            drawLatent(g, progress);
          } else if (node.type === 'mlp') {
            drawMlpFan(g, progress);
          } else if (node.kind === 'enc' && spec.heads === 6) {
            drawHeads(g, colour, progress);
          } else {
            drawSlab(g, colour, progress, active);
          }

          if (active && (node.kind === 'enc' || node.kind === 'dec')) {
            drawKernel(g, node.k, node.d, progress);
          }

          /* labels */
          ctx.textAlign = 'center';
          ctx.fillStyle = active ? ink : muted;
          ctx.font = (active ? '600 ' : '') + '9.5px ' + cssVar('--font', 'sans-serif');
          var labelY = offset === 0 ? g.y - (active && (node.kind === 'enc' || node.kind === 'dec') ? 20 : 8) : g.y - 8;
          ctx.fillText(node.label, g.cx, labelY);

          ctx.font = '9px ' + cssVar('--mono', 'monospace');
          ctx.fillStyle = muted;
          ctx.fillText(node.sub || '', g.cx, g.y + g.h + 12);

          if (node.d && node.d > 1 && node.kind === 'enc') {
            ctx.fillStyle = cssVar('--d-dilated', '#8C6B2F');
            ctx.font = '600 8.5px ' + cssVar('--mono', 'monospace');
            ctx.fillText('d=' + node.d, g.cx, g.y + g.h + 22);
          }
        });
      }

      paint(G.top, 0);
      paint(G.bot, G.top.length);

      /* running receptive field readout */
      var rf = 1;
      var idxNow = Math.floor(t);
      for (i = 0; i < Math.min(idxNow, G.top.length); i++) {
        if (G.top[i].node.rf) rf = G.top[i].node.rf;
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = muted;
      ctx.font = '10px ' + cssVar('--mono', 'monospace');
      if (idxNow < G.top.length) {
        ctx.fillText('receptive field ' + fmt(rf) + ' days', G.padX, 14);
      } else {
        ctx.fillText('reconstructing ' + INPUT_CH + ' x ' + fmt(INPUT_LEN), G.padX, 14);
      }
      ctx.textAlign = 'right';
      ctx.fillText(spec.name, W - G.padX, 14);
      ctx.textAlign = 'left';
    }

    var lastTime = 0;
    function tick(now) {
      if (!playing) return;
      if (!lastTime) lastTime = now;
      var dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      t += dt * speed;
      if (t >= total) t = 0;
      draw();
      if (opts.onProgress) opts.onProgress(t / total, all[Math.min(total - 1, Math.floor(t))]);
      raf = requestAnimationFrame(tick);
    }

    function play() {
      if (playing) return;
      playing = true;
      lastTime = 0;
      raf = requestAnimationFrame(tick);
    }
    function pause() {
      playing = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }
    function seek(fraction) {
      t = Math.max(0, Math.min(total - 0.001, fraction * total));
      draw();
      if (opts.onProgress) opts.onProgress(t / total, all[Math.min(total - 1, Math.floor(t))]);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        visible = e.isIntersecting;
        if (visible && opts.autoplay !== false) play();
        else pause();
      });
    }, { threshold: 0.25 });
    io.observe(canvas);

    window.addEventListener('resize', resize);
    document.addEventListener('themechange', draw);

    resize();

    return {
      play: play,
      pause: pause,
      seek: seek,
      isPlaying: function () { return playing; },
      steps: total,
      redraw: draw,
      setSpec: function (next) {
        spec = next;
        nodes = buildNodes(spec);
        all = nodes.enc.concat(nodes.dec);
        total = all.length;
        t = 0;
        draw();
      },
      destroy: function () {
        pause();
        io.disconnect();
        window.removeEventListener('resize', resize);
        document.removeEventListener('themechange', draw);
      }
    };
  }

  window.ArchEngine = { mount: mount, buildNodes: buildNodes, fmt: fmt };
})();
