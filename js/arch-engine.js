/* Architecture animation engine.
 *
 * One renderer drives every architecture in the thesis. A specification lists
 * the encoder layers with their widths, kernel size, stride and dilation, and
 * the engine derives the geometry, the sequence-length trajectory and the
 * receptive field from the convolution arithmetic, so the drawing cannot
 * disagree with the numbers reported in the thesis.
 *
 * The encoder is drawn as one or more lanes. A shared encoder has a single
 * lane, the multi-head encoder has one lane per environmental variable, and
 * the parallel hybrids have one lane per branch. Lanes advance together and
 * then converge on the block that joins them, which is the part of those
 * designs a static diagram cannot show.
 *
 * Layout is a hairpin: encoder left to right along the top, latent at the
 * right, decoder right to left along the bottom, so the reconstruction
 * finishes directly beneath the input it is trying to reproduce.
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
    if (n === null || n === undefined || isNaN(n)) return '';
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function seeded(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function series(channel, n, smooth, variant) {
    var rnd = seeded(97 + channel * 7919);
    var out = [];
    variant = variant || 0;
    var phase = channel * 0.7 + variant * 0.04;
    var spiky = channel === 5;
    var drift = 0;
    for (var i = 0; i < n; i++) {
      var t = i / n;
      var seasonal = Math.sin(t * Math.PI * 2 * 3 + phase);
      var v;
      if (spiky) {
        var r = rnd();
        var threshold = smooth ? (variant ? 0.84 : 0.86) : 0.78;
        v = r > threshold ? r * (0.5 + 0.5 * (seasonal + 1) / 2) : 0.02;
        if (smooth) v = v * (variant ? 0.56 : 0.62) + (variant ? 0.075 : 0.06);
      } else {
        drift = drift * 0.86 + (rnd() - 0.5) * (smooth ? (variant ? 0.08 : 0.06) : 0.16);
        v = 0.5 + seasonal * (variant ? 0.31 : 0.34) + drift;
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

  /* ---------- columns ---------- */

  function lanesFor(spec) {
    if (spec.heads === 6) {
      var out = [];
      for (var i = 0; i < 6; i++) {
        out.push({ name: CHANNELS[i], layers: spec.layers || [], inputCh: i });
      }
      return out;
    }
    if (spec.parallel && (spec.layersB || []).length) {
      return [
        { name: 'strided path', layers: spec.layers || [] },
        { name: 'dilated path', layers: spec.layersB || [] }
      ];
    }
    return [{ name: null, layers: spec.layers || [] }];
  }

  function buildColumns(spec) {
    var lanes = lanesFor(spec);
    var depth = lanes.reduce(function (m, l) { return Math.max(m, l.layers.length); }, 0);
    var multi = lanes.length > 1;
    var top = [];

    top.push({ kind: 'input', type: 'io', label: 'input',
               sub: INPUT_CH + ' x ' + fmt(INPUT_LEN) });

    for (var c = 0; c < depth; c++) {
      var cells = lanes.map(function (lane) {
        var l = lane.layers[c];
        return l ? { width: l.width, len: l.len, k: l.k, d: l.d, type: l.type, rf: l.rf } : null;
      });
      var live = cells.filter(Boolean);
      if (!live.length) continue;
      var sameLen = live.every(function (x) { return x.len === live[0].len; });
      var mixed = !live.every(function (x) { return x.type === live[0].type; });
      top.push({
        kind: 'layer', type: live[0].type,
        label: mixed ? 'strided | dilated' : (live[0].type === 'strided' ? 'strided' : 'dilated'),
        sub: sameLen ? fmt(live[0].len) : live.map(function (x) { return fmt(x.len); }).join(' / '),
        cells: cells, k: live[0].k,
        d: mixed ? 0 : live[0].d,
        rf: Math.max.apply(null, live.map(function (x) { return x.rf || 1; }))
      });
    }

    if (spec.heads === 6) {
      top.push({ kind: 'merge', type: 'merge', label: 'concatenate',
                 sub: '6 x 27,904', detail: 'six heads joined' });
    } else if (spec.parallel) {
      var isSum = /summ?ed|\bsum\b/i.test(spec.reductionText || '') || spec.reduction === 'sum';
      top.push({ kind: 'merge', type: 'merge',
                 label: isSum ? 'sum branches' : 'concat + 1x1',
                 sub: 'both pooled to 109' });
    }

    var lastLayer = (lanes[0].layers[lanes[0].layers.length - 1]) || { len: INPUT_LEN, width: 256 };
    if (spec.reduction === 'adaptive') {
      top.push({ kind: 'pool', type: 'pool', label: 'adaptive pool',
                 sub: fmt(lastLayer.len) + ' to 109' });
    } else if (spec.reduction === 'gap') {
      top.push({ kind: 'pool', type: 'pool', label: 'global average',
                 sub: fmt(lastLayer.len) + ' to 1', lossy: true });
    }

    top.push({ kind: 'flatten', type: 'flat', label: 'flatten', sub: fmt(spec.bridgeIn) });
    top.push({ kind: 'mlp', type: 'mlp', label: 'MLP bridge',
               sub: fmt(spec.bridgeIn) + ' to ' + fmt(spec.bridgeHidden) });
    top.push({ kind: 'latent', type: 'latent',
               label: spec.pipeline === 'variational' ? 'latent, mu and logvar' : 'latent',
               sub: 'z = ' + spec.z });

    /* decoder mirrors the encoder */
    var bot = [];
    bot.push({ kind: 'mlp', type: 'mlp', label: 'MLP',
               sub: fmt(spec.bridgeHidden) + ' to ' + fmt(spec.bridgeIn) });
    bot.push({ kind: 'reshape', type: 'flat', label: 'reshape',
               sub: fmt(lastLayer.width) + ' x ' + fmt(spec.reduction === 'builtin' || spec.reduction === 'flatten' ? lastLayer.len : 109) });
    if (spec.heads === 6) {
      bot.push({ kind: 'merge', type: 'merge', label: 'split to 6 heads', sub: 'one per variable' });
    } else if (spec.parallel) {
      bot.push({ kind: 'merge', type: 'merge', label: 'split branches', sub: 'two paths' });
    }
    if (spec.reduction === 'adaptive' || spec.reduction === 'gap') {
      bot.push({ kind: 'interp', type: 'pool', label: 'interpolate',
                 sub: 'linear, no weights' });
    }
    for (var r = depth - 1; r >= 0; r--) {
      var dcells = lanes.map(function (lane) {
        var l = lane.layers[r];
        if (!l) return null;
        var prev = lane.layers[r - 1];
        var targetLen = l.type === 'strided' ? (prev ? prev.len : INPUT_LEN) : l.len;
        var targetW = prev ? prev.width : (spec.heads === 6 ? 1 : INPUT_CH);
        return { width: targetW, len: targetLen, k: l.k, d: l.d, type: l.type };
      });
      var dlive = dcells.filter(Boolean);
      if (!dlive.length) continue;
      var dsame = dlive.every(function (x) { return x.len === dlive[0].len; });
      bot.push({
        kind: 'layer', type: dlive[0].type,
        label: dlive[0].type === 'strided' ? 'transposed' : 'dilated',
        sub: dsame ? fmt(dlive[0].len) : dlive.map(function (x) { return fmt(x.len); }).join(' / '),
        cells: dcells, k: dlive[0].k, d: dlive[0].d
      });
    }
    bot.push({ kind: 'output', type: 'io',
               label: spec.parallel ? 'reconstructions' : 'reconstruction',
               sub: spec.parallel ? 'each ' + INPUT_CH + ' x ' + fmt(INPUT_LEN) : INPUT_CH + ' x ' + fmt(INPUT_LEN),
               branchOutputs: !!spec.parallel });

    return { top: top, bot: bot, lanes: lanes, multi: multi };
  }

  /* ---------- controller ---------- */

  function mount(canvas, spec, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var cols = buildColumns(spec);
    var total = cols.top.length + cols.bot.length;

    var playing = false, t = 0, raf = null, lastTime = 0;
    var speed = opts.speed || 0.85;
    var W = 0, H = 0, dpr = 1;

    var inSeries = [], outSeries = [], outSeriesB = [];
    for (var c = 0; c < INPUT_CH; c++) {
      inSeries.push(series(c, 130, false));
      outSeries.push(series(c, 130, true));
      outSeriesB.push(series(c, 130, true, 1));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function geom() {
      /* Labels sit outside their row, above the encoder and below the decoder,
         so the gap between the two rows never has to hold text. */
      var padX = cols.multi ? 48 : 16;   /* room for the lane names */
      var padTop = 52, padBottom = 36, rowGap = 20;
      var usable = H - padTop - padBottom;
      var rowH = (usable - rowGap) / 2;
      var nLanes = cols.lanes.length;
      var laneH = rowH / nLanes;

      function place(list, top) {
        var n = list.length;
        var avail = W - padX * 2;
        var slot = avail / n;
        var boxW = Math.min(slot * 0.70, 54);
        return list.map(function (col, i) {
          var cx = padX + slot * (i + 0.5);
          return { col: col, cx: cx, w: boxW, x: cx - boxW / 2, rowTop: top, rowH: rowH, laneH: laneH };
        });
      }
      return {
        top: place(cols.top, padTop),
        bot: place(cols.bot, padTop + rowH + rowGap),
        padX: padX, rowH: rowH, laneH: laneH, nLanes: nLanes
      };
    }

    function laneBox(g, laneIdx, width) {
      var band = g.rowTop + g.laneH * laneIdx;
      var inner = g.laneH * (g.laneH > 40 ? 0.78 : 0.72);
      var wRatio = Math.log2(Math.max(2, width || 2)) / Math.log2(256);
      var h = Math.max(7, inner * (0.34 + 0.66 * wRatio));
      return { x: g.x, y: band + (g.laneH - h) / 2, w: g.w, h: h };
    }

    function colourFor(type) {
      if (type === 'strided') return cssVar('--d-strided', '#61223B');
      if (type === 'dilated') return cssVar('--d-dilated', '#8C6B2F');
      if (type === 'pool') return cssVar('--d-pool', '#4A6670');
      if (type === 'mlp' || type === 'flat') return cssVar('--d-mlp', '#3F6B4A');
      if (type === 'latent') return cssVar('--d-latent', '#C2761F');
      return cssVar('--muted', '#6B5D63');
    }

    function drawSlab(b, colour, progress, active) {
      var bands = b.h < 14 ? 2 : Math.max(3, Math.min(7, Math.round(b.h / 7)));
      var bh = b.h / bands;
      for (var i = 0; i < bands; i++) {
        var lag = (i / bands) * 0.2;
        var p = Math.max(0, Math.min(1, (progress - lag) / (1 - lag || 1)));
        ctx.fillStyle = colour;
        ctx.globalAlpha = 0.18 + 0.48 * (i / Math.max(1, bands - 1));
        ctx.fillRect(b.x, b.y + i * bh + 0.4, b.w * p, bh - 0.8);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = active ? colour : cssVar('--border', '#E0D6C9');
      ctx.lineWidth = active ? 1.5 : 0.9;
      roundRect(ctx, b.x, b.y, b.w, b.h, 2.5);
      ctx.stroke();
    }

    function drawKernel(x, y, w, k, d, phase) {
      k = k || 7; d = d || 1;
      var span = Math.min(w * 1.7, 11 + (k - 1) * d * 1.7);
      var cx = x + 3 + (w - 6) * phase;
      ctx.strokeStyle = cssVar('--accent', '#8C2F4A');
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(cx - span / 2, y); ctx.lineTo(cx + span / 2, y);
      ctx.stroke();
      for (var i = 0; i < k; i++) {
        var tx = cx - span / 2 + (span * i) / (k - 1);
        ctx.beginPath();
        ctx.moveTo(tx, y - 2.5); ctx.lineTo(tx, y + 2.5);
        ctx.stroke();
      }
    }

    function drawSeriesBox(b, data, colour, progress, only) {
      var list = only === undefined ? data : [data[only]];
      var n = list[0].length;
      var chH = b.h / list.length;
      for (var c2 = 0; c2 < list.length; c2++) {
        var yTop = b.y + c2 * chH;
        ctx.save();
        ctx.beginPath();
        ctx.rect(b.x, yTop, b.w * progress, chH);
        ctx.clip();
        ctx.beginPath();
        for (var i = 0; i < n; i++) {
          var px = b.x + (i / (n - 1)) * b.w;
          var py = yTop + chH - 0.8 - list[c2][i] * (chH - 1.6);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = colour;
        ctx.globalAlpha = 0.78;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = cssVar('--border', '#E0D6C9');
      ctx.lineWidth = 0.9;
      roundRect(ctx, b.x, b.y, b.w, b.h, 2.5);
      ctx.stroke();
    }

    function drawMerge(g, progress, isSplit) {
      /* lanes converge into one tall block, or one block fans back out */
      var colour = cssVar('--muted', '#6B5D63');
      var targetH = Math.min(g.rowH * 0.62, 10 + g.rowH * 0.5);
      var ty = g.rowTop + (g.rowH - targetH) / 2;
      ctx.strokeStyle = colour;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 0.9;
      for (var i = 0; i < geomCache.nLanes; i++) {
        var band = g.rowTop + g.laneH * (i + 0.5);
        var slice = ty + (targetH / geomCache.nLanes) * (i + 0.5);
        var from = isSplit ? g.x + g.w : g.x;
        var to = isSplit ? g.x + g.w + 12 : g.x - 12;
        ctx.beginPath();
        ctx.moveTo(to, band);
        ctx.bezierCurveTo((to + from) / 2, band, (to + from) / 2, slice, from, slice);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      var seg = targetH / geomCache.nLanes;
      for (i = 0; i < geomCache.nLanes; i++) {
        var lag = (i / geomCache.nLanes) * 0.4;
        var p = Math.max(0, Math.min(1, (progress - lag) / (1 - lag || 1)));
        ctx.fillStyle = colour;
        ctx.globalAlpha = 0.20 + 0.40 * (i / Math.max(1, geomCache.nLanes - 1));
        ctx.fillRect(g.x, ty + i * seg + 0.4, g.w * p, seg - 0.8);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = cssVar('--border', '#E0D6C9');
      roundRect(ctx, g.x, ty, g.w, targetH, 2.5);
      ctx.stroke();
    }

    function drawLatent(g, progress) {
      var z = Math.max(1, Math.round(spec.z || 5));
      var colour = cssVar('--d-latent', '#C2761F');
      var h = Math.min(g.rowH * 0.5, z * 13);
      var y0 = g.rowTop + (g.rowH - h) / 2;
      var r = Math.min(5.5, h / (z * 2.3));
      for (var i = 0; i < z; i++) {
        var cy = y0 + (h * (i + 0.5)) / z;
        var lag = (i / z) * 0.5;
        var p = Math.max(0, Math.min(1, (progress - lag) / (1 - lag || 1)));
        ctx.beginPath();
        ctx.arc(g.cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = colour;
        ctx.globalAlpha = 0.22 + 0.78 * p;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function drawFan(g, progress) {
      var colour = cssVar('--d-mlp', '#3F6B4A');
      var h = g.rowH * 0.42;
      var y0 = g.rowTop + (g.rowH - h) / 2;
      ctx.strokeStyle = colour;
      ctx.lineWidth = 0.6;
      ctx.globalAlpha = 0.45;
      for (var i = 0; i < 6; i++) {
        for (var o = 0; o < 4; o++) {
          var y1 = y0 + (h * (i + 0.5)) / 6;
          var y2 = y0 + (h * (o + 0.5)) / 4;
          ctx.beginPath();
          ctx.moveTo(g.x, y1);
          ctx.lineTo(g.x + g.w * progress, y1 + (y2 - y1) * progress);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = cssVar('--border', '#E0D6C9');
      ctx.lineWidth = 0.9;
      roundRect(ctx, g.x, y0, g.w, h, 2.5);
      ctx.stroke();
    }

    var geomCache = null;

    function draw() {
      if (!W || !H) return;
      var G = geom();
      geomCache = G;
      var muted = cssVar('--muted', '#6B5D63');
      var ink = cssVar('--ink', '#2B1F24');
      var border = cssVar('--border', '#E0D6C9');
      var font = cssVar('--font', 'sans-serif');
      var mono = cssVar('--mono', 'monospace');

      ctx.clearRect(0, 0, W, H);

      function paintRow(list, offset, isBottom) {
        list.forEach(function (g, idx) {
          var col = g.col;
          var global = offset + idx;
          var progress = Math.max(0, Math.min(1, t - global));
          var active = t >= global && t < global + 1;
          var colour = colourFor(col.type);

          /* lane connectors into this column */
          if (col.kind === 'layer' && idx > 0) {
            ctx.strokeStyle = border;
            ctx.globalAlpha = t > global - 0.5 ? 0.8 : 0.3;
            ctx.lineWidth = 0.8;
            col.cells.forEach(function (cell, li) {
              if (!cell) return;
              var b = laneBox(g, li, cell.width);
              ctx.beginPath();
              ctx.moveTo(g.x - 11, b.y + b.h / 2);
              ctx.lineTo(g.x, b.y + b.h / 2);
              ctx.stroke();
            });
            ctx.globalAlpha = 1;
          }

          if (col.kind === 'input') {
            if (G.nLanes === 6) {
              /* one strip per variable, each feeding its own head */
              for (var li = 0; li < 6; li++) {
                var b = laneBox(g, li, 4);
                drawSeriesBox(b, inSeries, colour, progress, li);
                ctx.fillStyle = muted;
                ctx.font = '8px ' + mono;
                ctx.textAlign = 'right';
                ctx.fillText(CHANNELS[li], g.x - 5, b.y + b.h / 2 + 3);
              }
            } else if (G.nLanes === 2) {
              for (var lj = 0; lj < 2; lj++) {
                var b2 = laneBox(g, lj, 6);
                drawSeriesBox(b2, inSeries, colour, progress);
                ctx.fillStyle = muted;
                ctx.font = '8px ' + mono;
                ctx.textAlign = 'right';
                ctx.fillText(cols.lanes[lj].name.split(' ')[0], g.x - 5, b2.y + b2.h / 2 + 3);
              }
            } else {
              var b3 = laneBox(g, 0, 64);
              drawSeriesBox(b3, inSeries, colour, progress);
            }
            ctx.textAlign = 'center';
          } else if (col.kind === 'output') {
            if (col.branchOutputs && G.nLanes === 2) {
              for (var lo = 0; lo < 2; lo++) {
                var branchBox = laneBox(g, lo, 6);
                drawSeriesBox(branchBox,
                              lo === 0 ? outSeries : outSeriesB,
                              colourFor(lo === 0 ? 'strided' : 'dilated'),
                              progress);
              }
            } else {
              var bo = laneBox(g, 0, 64);
              if (G.nLanes > 1) bo = { x: g.x, y: g.rowTop + g.rowH * 0.2, w: g.w, h: g.rowH * 0.6 };
              drawSeriesBox(bo, outSeries, cssVar('--accent', '#8C2F4A'), progress);
            }
          } else if (col.kind === 'layer') {
            col.cells.forEach(function (cell, li) {
              if (!cell) return;
              var b = laneBox(g, li, cell.width);
              drawSlab(b, colourFor(cell.type), progress, active);
            });
            if (active) {
              if (G.nLanes <= 2) {
                /* few enough lanes to show each kernel with its own dilation */
                col.cells.forEach(function (cell, li) {
                  if (!cell) return;
                  var kb = laneBox(g, li, cell.width);
                  drawKernel(g.x, kb.y - 6, g.w, cell.k, cell.d, progress);
                });
              } else {
                var firstCell = col.cells.find(function (x) { return x; });
                var topBox = laneBox(g, col.cells.indexOf(firstCell), firstCell.width);
                drawKernel(g.x, topBox.y - 6, g.w, col.k, col.d, progress);
              }
            }
          } else if (col.kind === 'merge') {
            drawMerge(g, progress, isBottom);
          } else if (col.type === 'latent') {
            drawLatent(g, progress);
          } else if (col.type === 'mlp') {
            drawFan(g, progress);
          } else {
            var bb = { x: g.x, y: g.rowTop + g.rowH * 0.26, w: g.w, h: g.rowH * 0.48 };
            drawSlab(bb, colour, progress, active);
          }

          /* labels, always on the outward side of the row */
          ctx.textAlign = 'center';
          var labelY = isBottom ? g.rowTop + g.rowH + 13 : g.rowTop - 15;
          var subY = isBottom ? g.rowTop + g.rowH + 23 : g.rowTop - 5;
          ctx.fillStyle = active ? ink : muted;
          ctx.font = (active ? '600 ' : '') + '9px ' + font;
          ctx.fillText(col.label, g.cx, labelY);
          ctx.font = '8.5px ' + mono;
          ctx.fillStyle = muted;
          ctx.fillText(col.sub || '', g.cx, subY);
          if (col.d && col.d > 1 && !isBottom) {
            ctx.fillStyle = cssVar('--d-dilated', '#8C6B2F');
            ctx.font = '600 8px ' + mono;
            ctx.fillText('d=' + col.d, g.cx, g.rowTop - 26);
          }
        });
      }

      paintRow(G.top, 0, false);
      paintRow(G.bot, G.top.length, true);

      /* hairpin turn */
      var lastTop = G.top[G.top.length - 1];
      var firstBot = G.bot[0];
      ctx.strokeStyle = border;
      ctx.globalAlpha = t > G.top.length - 0.6 ? 0.85 : 0.3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lastTop.cx, lastTop.rowTop + lastTop.rowH * 0.78);
      ctx.bezierCurveTo(lastTop.cx, lastTop.rowTop + lastTop.rowH + 14,
                        firstBot.cx, firstBot.rowTop - 14,
                        firstBot.cx, firstBot.rowTop + firstBot.rowH * 0.3);
      ctx.stroke();
      ctx.globalAlpha = 1;

      /* status strip */
      var idxNow = Math.floor(t);
      var rf = 1;
      for (var i = 0; i < Math.min(idxNow + 1, G.top.length); i++) {
        if (G.top[i].col.rf) rf = G.top[i].col.rf;
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = muted;
      ctx.font = '9.5px ' + mono;
      ctx.fillText(idxNow >= G.top.length
        ? 'rebuilding ' + INPUT_CH + ' x ' + fmt(INPUT_LEN)
        : (rf <= 1 ? 'reading the raw daily record'
                   : 'receptive field ' + fmt(rf) + (rf === 1 ? ' day' : ' days')), 6, 12);
      ctx.textAlign = 'right';
      ctx.fillText(cols.lanes.length > 1
        ? cols.lanes.length + ' parallel ' + (spec.heads === 6 ? 'heads' : 'branches')
        : 'shared encoder', W - 6, 12);
      ctx.textAlign = 'left';
    }

    function tick(now) {
      if (!playing) return;
      if (!lastTime) lastTime = now;
      t += Math.min(0.05, (now - lastTime) / 1000) * speed;
      lastTime = now;
      if (t >= total) t = 0;
      draw();
      if (opts.onProgress) {
        var flat = cols.top.concat(cols.bot);
        opts.onProgress(t / total, flat[Math.min(flat.length - 1, Math.floor(t))]);
      }
      raf = requestAnimationFrame(tick);
    }

    function play() { if (!playing) { playing = true; lastTime = 0; raf = requestAnimationFrame(tick); } }
    function pause() { playing = false; if (raf) cancelAnimationFrame(raf); raf = null; }
    function seek(f) {
      t = Math.max(0, Math.min(total - 0.001, f * total));
      draw();
      if (opts.onProgress) {
        var flat = cols.top.concat(cols.bot);
        opts.onProgress(t / total, flat[Math.min(flat.length - 1, Math.floor(t))]);
      }
    }

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && opts.autoplay !== false) play(); else pause();
      });
    }, { threshold: 0.25 });
    io.observe(canvas);

    window.addEventListener('resize', resize);
    /* A canvas can be laid out after mounting, for example when the card is
       still hidden or the tab is in the background. Observing the element
       keeps the backing buffer correct without relying on animation frames. */
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { resize(); });
      ro.observe(canvas);
    }
    resize();

    return {
      play: play, pause: pause, seek: seek, redraw: draw, steps: total,
      isPlaying: function () { return playing; },
      setSpec: function (next) {
        spec = next; cols = buildColumns(spec);
        total = cols.top.length + cols.bot.length; t = 0; draw();
      },
      destroy: function () {
        pause(); io.disconnect();
        if (ro) ro.disconnect();
        window.removeEventListener('resize', resize);
      }
    };
  }

  window.ArchEngine = { mount: mount, buildColumns: buildColumns, fmt: fmt };
})();
