/* Building blocks of the architectures.
 *
 * Small, self-contained animations for each operator used in the thesis,
 * drawn at a toy scale where individual values and kernel positions are
 * readable. The full architecture diagrams run at 6,935 timesteps, where none
 * of this detail survives.
 */
(function () {
  'use strict';

  function cssVar(n, f) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(n);
    return (v && v.trim()) || f;
  }
  function fmt(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function gelu(x) {
    return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x)));
  }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  function cell(ctx, x, y, w, h, colour, alpha, label, labelColour) {
    ctx.fillStyle = colour;
    ctx.globalAlpha = alpha;
    roundRect(ctx, x, y, w, h, 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (label !== undefined && label !== null && w > 16) {
      ctx.fillStyle = labelColour || cssVar('--ink', '#2B1F24');
      ctx.font = '8px ' + cssVar('--mono', 'monospace');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + w / 2, y + h / 2);
      ctx.textBaseline = 'alphabetic';
    }
  }
  function arrow(ctx, x1, y1, x2, y2, colour, alpha) {
    ctx.strokeStyle = colour;
    ctx.globalAlpha = alpha === undefined ? 0.7 : alpha;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.stroke();
    var a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 5 * Math.cos(a - 0.4), y2 - 5 * Math.sin(a - 0.4));
    ctx.lineTo(x2 - 5 * Math.cos(a + 0.4), y2 - 5 * Math.sin(a + 0.4));
    ctx.closePath();
    ctx.fillStyle = colour;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  function caption(ctx, W, H, text) {
    ctx.fillStyle = cssVar('--ink', '#2B1F24');
    ctx.font = '600 10px ' + cssVar('--font', 'sans-serif');
    ctx.textAlign = 'left';
    ctx.fillText(text, 12, H - 9);
  }
  function title(ctx, text, x, y) {
    ctx.fillStyle = cssVar('--muted', '#6B5D63');
    ctx.font = '9px ' + cssVar('--mono', 'monospace');
    ctx.textAlign = 'left';
    ctx.fillText(text, x, y);
  }

  /* ---------- toy data, fixed so a redraw is identical ---------- */

  var X = [
    [0.62, 0.71, 0.80, 0.74, 0.58, 0.41, 0.33, 0.38, 0.52, 0.67, 0.79, 0.72],
    [0.20, 0.05, 0.00, 0.35, 0.60, 0.15, 0.00, 0.00, 0.28, 0.44, 0.10, 0.02]
  ];
  var Kq = [
    [[0.5, -0.2, 0.3], [0.1, 0.6, -0.4]],
    [[-0.3, 0.7, 0.2], [0.4, -0.1, 0.5]]
  ];
  var BIAS = [0.05, -0.02];

  function convAt(q, t) {
    var s = BIAS[q];
    for (var c = 0; c < 2; c++) {
      for (var j = 0; j < 3; j++) {
        var idx = t + j - 1;
        var v = idx < 0 || idx >= 12 ? 0 : X[c][idx];
        s += Kq[q][c][j] * v;
      }
    }
    return s;
  }

  /* ---------- individual blocks ---------- */

  var BLOCKS = {};

  /* 1. basic multichannel convolution, with GELU */
  BLOCKS.conv = function (ctx, W, H, t) {
    var ink = cssVar('--ink', '#2B1F24'), muted = cssVar('--muted', '#6B5D63');
    var accent = cssVar('--accent', '#8C2F4A');
    var cS = cssVar('--d-strided', '#61223B'), cD = cssVar('--d-dilated', '#8C6B2F');
    var n = 12, labelW = 48;
    var avail = W - labelW - 20;
    var cw = Math.min(42, avail / n), ch = 20;
    var pad = labelW + Math.max(0, (avail - cw * n) / 2);
    var contentH = 2 * (ch + 2) + 52 + 2 * (ch + 2);
    var yIn = Math.max(30, 22 + (H - 46 - contentH) / 2);
    var yOut = yIn + 2 * (ch + 2) + 52;
    var pos = Math.floor(t * n) % n;
    var sub = t * n - Math.floor(t * n);

    title(ctx, 'input, 2 variables x 12 days', pad, yIn - 8);
    for (var c = 0; c < 2; c++) {
      for (var i = 0; i < n; i++) {
        var inWin = Math.abs(i - pos) <= 1;
        cell(ctx, pad + i * cw, yIn + c * (ch + 2), cw - 2, ch,
             c === 0 ? cS : cD, inWin ? 0.75 : 0.16, X[c][i].toFixed(2),
             inWin ? '#fff' : muted);
      }
      ctx.fillStyle = muted;
      ctx.font = '8px ' + cssVar('--mono', 'monospace');
      ctx.textAlign = 'right';
      ctx.fillText(c === 0 ? 'tmax' : 'rain', pad - 5, yIn + c * (ch + 2) + 12);
    }

    /* the kernel window */
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.4;
    var wx = pad + (pos - 1) * cw;
    ctx.strokeRect(wx, yIn - 2, cw * 3 - 2, (ch + 2) * 2);

    /* output feature maps */
    title(ctx, 'feature maps, 2 learned kernels x 12 positions', pad, yOut - 8);
    for (var q = 0; q < 2; q++) {
      for (i = 0; i < n; i++) {
        var done = i < pos || (i === pos && sub > 0.4);
        var a = convAt(q, i);
        var h = gelu(a);
        cell(ctx, pad + i * cw, yOut + q * (ch + 2), cw - 2, ch,
             q === 0 ? cS : cD, done ? 0.30 + 0.45 * Math.min(1, Math.abs(h)) : 0.08,
             done ? h.toFixed(2) : '', ink);
      }
      ctx.fillStyle = muted;
      ctx.font = '8px ' + cssVar('--mono', 'monospace');
      ctx.textAlign = 'right';
      ctx.fillText('q' + (q + 1), pad - 5, yOut + q * (ch + 2) + 12);
    }
    arrow(ctx, pad + pos * cw + cw / 2, yIn + (ch + 2) * 2 + 5,
          pad + pos * cw + cw / 2, yOut - 18, accent, 0.85);

    var a0 = convAt(0, pos);
    caption(ctx, W, H,
      'position ' + (pos + 1) + ':  a = b + sum over both variables and 3 taps = ' +
      a0.toFixed(2) + ',   GELU(a) = ' + gelu(a0).toFixed(2));
    ctx.fillStyle = muted;
    ctx.font = '9px ' + cssVar('--font', 'sans-serif');
    ctx.textAlign = 'left';
    ctx.fillText('one kernel reads every variable at once, so a feature map is not a reconstructed variable',
                 12, H - 24);
  };

  /* 2. strided convolution with same-padding */
  BLOCKS.strided = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), accent = cssVar('--accent', '#8C2F4A');
    var colour = cssVar('--d-strided', '#61223B');
    var n = 17, k = 7, s = 2, p = 3;
    var nOut = Math.floor((n + 2 * p - (k - 1) - 1) / s) + 1;
    var pad = 26, cw = (W - pad * 2) / (n + 2 * p), chh = 16;
    var yIn = 34, yOut = H - 62;
    var step = Math.floor(t * nOut) % nOut;
    var centre = step * s;

    title(ctx, 'input with 3 padding cells at each end', pad, yIn - 9);
    for (var i = -p; i < n + p; i++) {
      var isPad = i < 0 || i >= n;
      var inWin = i >= centre - (k - 1) / 2 + 0 && i <= centre + (k - 1) / 2;
      var x = pad + (i + p) * cw;
      cell(ctx, x, yIn, cw - 1.5, chh, isPad ? muted : colour,
           isPad ? (inWin ? 0.34 : 0.12) : (inWin ? 0.8 : 0.18));
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.3;
    ctx.strokeRect(pad + (centre - 3 + p) * cw - 1, yIn - 2, cw * k, chh + 4);

    title(ctx, 'output, one position per two inputs', pad, yOut - 9);
    var ow = (W - pad * 2) / nOut;
    for (i = 0; i < nOut; i++) {
      cell(ctx, pad + i * ow, yOut, ow - 2, chh, colour, i < step ? 0.62 : (i === step ? 0.8 : 0.1));
    }
    arrow(ctx, pad + (centre + p) * cw + cw / 2, yIn + chh + 4,
          pad + step * ow + ow / 2, yOut - 5, accent, 0.8);

    caption(ctx, W, H, 'L_out = floor((L_in + 2p - d(k-1) - 1) / s) + 1,  with k=7, s=2, d=1, p=3 this is ceil(L_in / 2)');
  };

  /* 3. dilated convolution, cycling the rate */
  BLOCKS.dilated = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), accent = cssVar('--accent', '#8C2F4A');
    var colour = cssVar('--d-dilated', '#8C6B2F');
    var rates = [1, 2, 4, 8];
    var phase = t * rates.length;
    var d = rates[Math.floor(phase) % rates.length];
    var k = 7, n = 57;
    var pad = 20, cw = (W - pad * 2) / n, chh = 16;
    var yIn = 40, yOut = H - 62;
    var centre = Math.round(n / 2);
    var span = d * (k - 1) + 1;

    title(ctx, 'input, stride 1 so the length never changes', pad, yIn - 9);
    var taps = [];
    for (var j = 0; j < k; j++) taps.push(centre + (j - (k - 1) / 2) * d);
    for (var i = 0; i < n; i++) {
      var isTap = taps.indexOf(i) !== -1;
      var inSpan = i >= taps[0] && i <= taps[k - 1];
      cell(ctx, pad + i * cw, yIn, Math.max(1.5, cw - 1.2), chh, colour,
           isTap ? 0.85 : (inSpan ? 0.10 : 0.16));
    }
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad + taps[0] * cw, yIn - 5);
    ctx.lineTo(pad + (taps[k - 1] + 1) * cw, yIn - 5);
    ctx.stroke();
    ctx.globalAlpha = 1;

    title(ctx, 'output, same length', pad, yOut - 9);
    for (i = 0; i < n; i++) {
      cell(ctx, pad + i * cw, yOut, Math.max(1.5, cw - 1.2), chh, colour,
           i === centre ? 0.85 : 0.14);
    }
    for (j = 0; j < k; j++) {
      if (taps[j] < 0 || taps[j] >= n) continue;
      arrow(ctx, pad + taps[j] * cw + cw / 2, yIn + chh + 3,
            pad + centre * cw + cw / 2, yOut - 4, accent, 0.28);
    }

    ctx.fillStyle = cssVar('--ink', '#2B1F24');
    ctx.font = '600 10px ' + cssVar('--font', 'sans-serif');
    ctx.textAlign = 'left';
    ctx.fillText('dilation d = ' + d + ':  weights still 7,   kernel span d(k-1)+1 = ' + span +
                 ',   output length unchanged', 12, H - 9);
    ctx.fillStyle = muted;
    ctx.font = '9px ' + cssVar('--font', 'sans-serif');
    ctx.fillText('stacking rates 1, 2, 4, 8 is what carries the selected model to a 763-day receptive field',
                 12, H - 24);
  };

  /* 4. adaptive average pooling */
  BLOCKS.pool = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), accent = cssVar('--accent', '#8C2F4A');
    var colour = cssVar('--d-pool', '#4A6670');
    var nIn = 16, nOut = 4, chan = 4;
    var pad = 42, cw = (W - pad * 2) / nIn, chh = 13;
    var yIn = 30, yOut = H - 76;
    var bin = Math.floor(t * nOut) % nOut;

    title(ctx, 'feature tensor, 4 channels x 16 positions', pad, yIn - 9);
    for (var c = 0; c < chan; c++) {
      for (var i = 0; i < nIn; i++) {
        var inBin = Math.floor(i / (nIn / nOut)) === bin;
        cell(ctx, pad + i * cw, yIn + c * (chh + 2), cw - 2, chh, colour, inBin ? 0.72 : 0.15);
      }
    }
    var ow = (W - pad * 2) / nOut;
    title(ctx, 'pooled, 4 channels x 4 positions, channels unchanged', pad, yOut - 9);
    for (c = 0; c < chan; c++) {
      for (i = 0; i < nOut; i++) {
        cell(ctx, pad + i * ow, yOut + c * (chh + 2), ow - 3, chh, colour,
             i < bin ? 0.55 : (i === bin ? 0.75 : 0.12));
      }
    }
    arrow(ctx, pad + (bin + 0.5) * (nIn / nOut) * cw, yIn + chan * (chh + 2) + 2,
          pad + bin * ow + ow / 2, yOut - 5, accent, 0.8);

    caption(ctx, W, H, 'each output position averages the input positions in its bin, and the number of channels does not change');
    ctx.fillStyle = muted;
    ctx.font = '9px ' + cssVar('--font', 'sans-serif');
    ctx.textAlign = 'left';
    ctx.fillText('global average pooling is the same idea with one bin, so the position of a feature is no longer represented explicitly',
                 12, H - 24);
  };

  /* 5. flatten and the fully connected bridge, with a toy network */
  BLOCKS.bridge = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), ink = cssVar('--ink', '#2B1F24');
    var accent = cssVar('--accent', '#8C2F4A'), cM = cssVar('--d-mlp', '#3F6B4A');
    var cL = cssVar('--d-latent', '#C2761F');

    /* shape chain across the top */
    var shapes = ['256 x 109', '27,904', '128', '5'];
    var labels = ['feature tensor', 'flattened', 'hidden', 'embedding'];
    var bw = Math.min(96, (W - 60) / 4 - 18), y0 = 24, bh = 26;
    var gap = (W - 30 - bw * 4) / 3;
    var stage = Math.min(3, Math.floor(t * 4));
    for (var i = 0; i < 4; i++) {
      var x = 15 + i * (bw + gap);
      cell(ctx, x, y0, bw, bh, i === 3 ? cL : cM, i <= stage ? 0.45 : 0.13);
      ctx.fillStyle = i <= stage ? ink : muted;
      ctx.font = '600 9.5px ' + cssVar('--mono', 'monospace');
      ctx.textAlign = 'center';
      ctx.fillText(shapes[i], x + bw / 2, y0 + 17);
      ctx.fillStyle = muted;
      ctx.font = '8px ' + cssVar('--font', 'sans-serif');
      ctx.fillText(labels[i], x + bw / 2, y0 - 6);
      if (i < 3) arrow(ctx, x + bw + 3, y0 + bh / 2, x + bw + gap - 3, y0 + bh / 2, muted, i < stage ? 0.8 : 0.3);
    }

    /* toy network below: 4 inputs, 3 hidden with GELU, 2 outputs */
    var vIn = [0.80, -0.35, 0.42, 0.11];
    var W1 = [[0.6, -0.4, 0.2, 0.5], [-0.3, 0.8, 0.1, -0.2], [0.2, 0.3, -0.7, 0.4]];
    var b1 = [0.05, -0.1, 0.2];
    var W2 = [[0.7, -0.5, 0.3], [-0.2, 0.6, 0.4]];
    var b2 = [0.0, 0.1];
    var hid = W1.map(function (row, j) {
      return gelu(row.reduce(function (s, w, i2) { return s + w * vIn[i2]; }, b1[j]));
    });
    var out = W2.map(function (row, j) {
      return row.reduce(function (s, w, i2) { return s + w * hid[i2]; }, b2[j]);
    });

    var yTop = y0 + bh + 34, yBot = H - 34;
    var colX = [W * 0.16, W * 0.46, W * 0.76];
    var phase = t * 3;

    function nodes(count, x, vals, colour, showFrom) {
      var pts = [];
      for (var j = 0; j < count; j++) {
        var cy = yTop + ((yBot - yTop) * (j + 0.5)) / count;
        var lit = phase > showFrom;
        ctx.beginPath();
        ctx.arc(x, cy, 11, 0, Math.PI * 2);
        ctx.fillStyle = colour;
        ctx.globalAlpha = lit ? 0.55 : 0.15;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = lit ? '#fff' : muted;
        ctx.font = '8px ' + cssVar('--mono', 'monospace');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(vals[j].toFixed(2), x, cy);
        ctx.textBaseline = 'alphabetic';
        pts.push({ x: x, y: cy });
      }
      return pts;
    }

    function edges(a, b, weights, lit) {
      for (var i2 = 0; i2 < a.length; i2++) {
        for (var j = 0; j < b.length; j++) {
          var w = weights[j][i2];
          ctx.strokeStyle = w >= 0 ? cM : accent;
          ctx.globalAlpha = lit ? 0.15 + Math.min(0.55, Math.abs(w) * 0.7) : 0.08;
          ctx.lineWidth = 0.5 + Math.abs(w) * 1.6;
          ctx.beginPath();
          ctx.moveTo(a[i2].x + 11, a[i2].y);
          ctx.lineTo(b[j].x - 11, b[j].y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    var pIn = nodes(4, colX[0], vIn, cM, -1);
    var pHid = nodes(3, colX[1], hid, cM, 1);
    var pOut = nodes(2, colX[2], out, cL, 2);
    edges(pIn, pHid, W1, phase > 1);
    edges(pHid, pOut, W2, phase > 2);

    ctx.fillStyle = muted;
    ctx.font = '8.5px ' + cssVar('--font', 'sans-serif');
    ctx.textAlign = 'center';
    ctx.fillText('inputs', colX[0], yTop - 8);
    ctx.fillText('hidden, GELU', colX[1], yTop - 8);
    ctx.fillText('embedding', colX[2], yTop - 8);

    caption(ctx, W, H, 'h = GELU(W1 v + b1),   z = W2 h + b2:  the bridge turns features at many positions into one vector per site');
  };

  /* 6. decoder bridge and reshape */
  BLOCKS.decbridge = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), ink = cssVar('--ink', '#2B1F24');
    var cM = cssVar('--d-mlp', '#3F6B4A'), cL = cssVar('--d-latent', '#C2761F');
    var shapes = ['5', '128', '27,904', '256 x 109'];
    var labels = ['embedding', 'hidden', 'flat vector', 'feature tensor'];
    var bw = Math.min(104, (W - 60) / 4 - 18), y0 = H / 2 - 22, bh = 34;
    var gap = (W - 30 - bw * 4) / 3;
    var stage = Math.min(3, Math.floor(t * 4));
    for (var i = 0; i < 4; i++) {
      var x = 15 + i * (bw + gap);
      cell(ctx, x, y0, bw, bh, i === 0 ? cL : cM, i <= stage ? 0.45 : 0.13);
      ctx.fillStyle = i <= stage ? ink : muted;
      ctx.font = '600 10px ' + cssVar('--mono', 'monospace');
      ctx.textAlign = 'center';
      ctx.fillText(shapes[i], x + bw / 2, y0 + 21);
      ctx.fillStyle = muted;
      ctx.font = '8px ' + cssVar('--font', 'sans-serif');
      ctx.fillText(labels[i], x + bw / 2, y0 - 7);
      if (i < 3) arrow(ctx, x + bw + 3, y0 + bh / 2, x + bw + gap - 3, y0 + bh / 2, muted, i < stage ? 0.85 : 0.3);
    }
    caption(ctx, W, H, 'the decoder bridge is a separately learned mapping, not the inverse of the encoder bridge');
  };

  /* 7. linear interpolation */
  BLOCKS.interp = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), accent = cssVar('--accent', '#8C2F4A');
    var colour = cssVar('--d-pool', '#4A6670');
    var known = [0.25, 0.72, 0.45, 0.83, 0.35];
    var pad = 46, span = W - pad * 2;
    var yBase = H - 66, hgt = H - 130;
    var reveal = Math.min(1, t * 1.4);

    title(ctx, 'known feature values', pad, 22);
    ctx.strokeStyle = colour;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (var i = 0; i < known.length; i++) {
      var x = pad + (span * i) / (known.length - 1);
      var y = yBase - known[i] * hgt;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    /* interpolated points appearing between the known ones */
    var per = 4;
    for (i = 0; i < known.length - 1; i++) {
      for (var j = 1; j < per; j++) {
        var f = j / per;
        var gx = pad + (span * (i + f)) / (known.length - 1);
        var gv = known[i] * (1 - f) + known[i + 1] * f;
        var gy = yBase - gv * hgt;
        var appear = (i * (per - 1) + j) / ((known.length - 1) * (per - 1));
        if (appear > reveal) continue;
        ctx.beginPath();
        ctx.arc(gx, gy, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    for (i = 0; i < known.length; i++) {
      var kx = pad + (span * i) / (known.length - 1);
      var ky = yBase - known[i] * hgt;
      ctx.beginPath();
      ctx.arc(kx, ky, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = colour;
      ctx.fill();
    }

    caption(ctx, W, H, 'linear interpolation carries no weights, changes only the temporal resolution, and does not recover discarded values');
  };

  /* 8. transposed convolution */
  BLOCKS.transposed = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), accent = cssVar('--accent', '#8C2F4A');
    var colour = cssVar('--d-strided', '#61223B');
    var nIn = 5, k = 4, s = 2;
    var kern = [0.6, 0.9, 0.5, 0.2];
    var inVals = [0.7, 0.4, 0.9, 0.3, 0.6];
    var nOut = (nIn - 1) * s + k;
    var pad = 40, iw = (W - pad * 2) / nIn, ow = (W - pad * 2) / nOut;
    var yIn = 34, yOut = H - 78, chh = 16;
    var cur = Math.floor(t * nIn) % nIn;

    title(ctx, 'input positions, each one multiplies the whole kernel', pad, yIn - 9);
    for (var i = 0; i < nIn; i++) {
      cell(ctx, pad + i * iw, yIn, iw - 4, chh, colour, i === cur ? 0.85 : (i < cur ? 0.35 : 0.13),
           inVals[i].toFixed(1), i === cur ? '#fff' : muted);
    }

    /* accumulate contributions into the output */
    var acc = new Array(nOut).fill(0);
    for (i = 0; i <= cur; i++) {
      for (var j = 0; j < k; j++) acc[i * s + j] += inVals[i] * kern[j];
    }
    var maxV = Math.max.apply(null, acc.concat([1]));
    title(ctx, 'output, overlapping contributions are added', pad, yOut - 9);
    for (i = 0; i < nOut; i++) {
      var touched = i >= cur * s && i < cur * s + k;
      cell(ctx, pad + i * ow, yOut, ow - 3, chh, colour,
           acc[i] > 0 ? 0.18 + 0.6 * (acc[i] / maxV) : 0.08,
           acc[i] > 0 ? acc[i].toFixed(2) : '', touched ? '#fff' : muted);
      if (touched) {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(pad + i * ow, yOut, ow - 3, chh);
      }
    }
    for (j = 0; j < k; j++) {
      arrow(ctx, pad + cur * iw + iw / 2, yIn + chh + 3,
            pad + (cur * s + j) * ow + ow / 2, yOut - 4, accent, 0.4);
    }

    caption(ctx, W, H, 'L_out = (L_in - 1)s - 2p + d(k-1) + p_out + 1,  and the weights are learned, not copied from the encoder');
    ctx.fillStyle = muted;
    ctx.font = '9px ' + cssVar('--font', 'sans-serif');
    ctx.textAlign = 'left';
    ctx.fillText('a transposed convolution increases length when the stride exceeds one, but cannot recover information lost by downsampling',
                 12, H - 24);
  };

  /* 9. parallel-branch fusion, with the 1x1 convolution inset */
  BLOCKS.fusion = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), ink = cssVar('--ink', '#2B1F24');
    var cS = cssVar('--d-strided', '#61223B'), cD = cssVar('--d-dilated', '#8C6B2F');
    var cL = cssVar('--d-latent', '#C2761F'), cM = cssVar('--d-mlp', '#3F6B4A');
    var half = W / 2;
    var phase = t * 2;

    ctx.strokeStyle = cssVar('--border', '#E0D6C9');
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(half, 20); ctx.lineTo(half, H - 34); ctx.stroke();

    function branchPair(cx, y, lit) {
      cell(ctx, cx - 54, y, 48, 16, cS, lit ? 0.6 : 0.18, '128 x 109', '#fff');
      cell(ctx, cx + 6, y, 48, 16, cD, lit ? 0.6 : 0.18, '128 x 109', '#fff');
    }

    /* left: concatenation then 1x1 */
    ctx.fillStyle = ink;
    ctx.font = '600 10px ' + cssVar('--font', 'sans-serif');
    ctx.textAlign = 'center';
    ctx.fillText('concatenation fusion', half / 2, 24);
    branchPair(half / 2, 38, phase > 0.3);
    cell(ctx, half / 2 - 54, 70, 108, 16, muted, phase > 0.6 ? 0.5 : 0.15, '256 x 109', '#fff');
    cell(ctx, half / 2 - 40, 100, 80, 16, cM, phase > 0.9 ? 0.55 : 0.15, '1x1 conv', '#fff');
    cell(ctx, half / 2 - 40, 130, 80, 16, cM, phase > 1.1 ? 0.5 : 0.15, '128 x 109', '#fff');
    ctx.fillStyle = muted;
    ctx.font = '8.5px ' + cssVar('--font', 'sans-serif');
    ctx.fillText('mixes channels at each position,', half / 2, 160);
    ctx.fillText('without widening the receptive field', half / 2, 172);

    /* right: latent summation */
    ctx.fillStyle = ink;
    ctx.font = '600 10px ' + cssVar('--font', 'sans-serif');
    ctx.fillText('latent summation', half + half / 2, 24);
    branchPair(half + half / 2, 38, phase > 0.3);
    cell(ctx, half + half / 2 - 54, 70, 48, 16, cM, phase > 0.6 ? 0.5 : 0.15, 'MLP', '#fff');
    cell(ctx, half + half / 2 + 6, 70, 48, 16, cM, phase > 0.6 ? 0.5 : 0.15, 'MLP', '#fff');
    cell(ctx, half + half / 2 - 54, 100, 48, 16, cL, phase > 0.9 ? 0.55 : 0.15, 'z_A', '#fff');
    cell(ctx, half + half / 2 + 6, 100, 48, 16, cL, phase > 0.9 ? 0.55 : 0.15, 'z_B', '#fff');
    cell(ctx, half + half / 2 - 24, 130, 48, 16, cL, phase > 1.2 ? 0.6 : 0.15, 'z', '#fff');
    ctx.fillStyle = muted;
    ctx.font = '8.5px ' + cssVar('--font', 'sans-serif');
    ctx.fillText('each branch gets its own bridge,', half + half / 2, 160);
    ctx.fillText('and the two latents are added', half + half / 2, 172);

    caption(ctx, W, H, 'the fusion choice is why the two parallel architectures differ in bridge size and parameter count');
  };

  /* 10. variational sampling */
  BLOCKS.vae = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), ink = cssVar('--ink', '#2B1F24');
    var cM = cssVar('--d-mlp', '#3F6B4A'), cL = cssVar('--d-latent', '#C2761F');
    var accent = cssVar('--accent', '#8C2F4A');
    var mu = [0.35, -0.20, 0.62, 0.05, -0.44];
    var sd = [0.22, 0.31, 0.18, 0.27, 0.24];
    var draw = Math.floor(t * 4);
    var yTop = 46, rowH = (H - yTop - 52) / 5;

    ctx.fillStyle = muted;
    ctx.font = '8.5px ' + cssVar('--font', 'sans-serif');
    ctx.textAlign = 'center';
    ctx.fillText('mean', W * 0.20, yTop - 12);
    ctx.fillText('standard deviation', W * 0.42, yTop - 12);
    ctx.fillText('sampled embedding', W * 0.76, yTop - 12);

    for (var i = 0; i < 5; i++) {
      var y = yTop + rowH * (i + 0.5);
      cell(ctx, W * 0.20 - 26, y - 8, 52, 16, cM, 0.45, mu[i].toFixed(2), '#fff');
      cell(ctx, W * 0.42 - 26, y - 8, 52, 16, cM, 0.30, sd[i].toFixed(2), ink);
      /* a deterministic pseudo-noise per draw so the value visibly jitters */
      var eps = Math.sin((i + 1) * 12.9898 + draw * 4.1414) * 43758.5453;
      eps = (eps - Math.floor(eps)) * 2 - 1;
      var z = mu[i] + sd[i] * eps;
      var bx = W * 0.62;
      var bw = W * 0.28;
      ctx.strokeStyle = cssVar('--border', '#E0D6C9');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx, y); ctx.lineTo(bx + bw, y);
      ctx.stroke();
      /* the plus or minus one standard deviation band */
      ctx.fillStyle = cL;
      ctx.globalAlpha = 0.16;
      ctx.fillRect(bx + bw * (0.5 + (mu[i] - sd[i]) / 3), y - 7, bw * (2 * sd[i] / 3), 14);
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(bx + bw * (0.5 + mu[i] / 3), y, 3, 0, Math.PI * 2);
      ctx.fillStyle = muted;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bx + bw * (0.5 + z / 3), y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
    }

    caption(ctx, W, H, 'z = mu + sigma * epsilon,  epsilon drawn from a standard normal, which is the only structural difference from the deterministic models');
  };

  /* ---------- mounting ---------- */

  function mount(canvas, kind, period) {
    var drawFn = BLOCKS[kind];
    if (!drawFn) return null;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, t = 0, raf = null, playing = false, last = 0;
    period = period || 6;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      if (!W || !H) return;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render();
    }
    function render() {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);
      ctx.textBaseline = 'alphabetic';
      drawFn(ctx, W, H, t);
    }
    function tick(now) {
      if (!playing) return;
      if (!last) last = now;
      t += Math.min(0.05, (now - last) / 1000) / period;
      last = now;
      if (t >= 1) t = 0;
      render();
      raf = requestAnimationFrame(tick);
    }
    function play() { if (!playing) { playing = true; last = 0; raf = requestAnimationFrame(tick); } }
    function pause() { playing = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) play(); else pause(); });
    }, { threshold: 0.25 });
    io.observe(canvas);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    window.addEventListener('resize', resize);
    resize();
    return { play: play, pause: pause, redraw: render };
  }

  function init() {
    document.querySelectorAll('canvas[data-block]').forEach(function (c) {
      mount(c, c.dataset.block, Number(c.dataset.period) || 6);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.Blocks = { mount: mount, kinds: Object.keys(BLOCKS) };
})();
