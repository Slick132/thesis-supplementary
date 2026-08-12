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
    if (label !== undefined && label !== null && w > 10) {
      ctx.fillStyle = labelColour || cssVar('--ink', '#2B1F24');
      /* shrink rather than vanish, so values survive a phone-width canvas */
      var fs = Math.max(6, Math.min(8, w * 0.42));
      ctx.font = fs + 'px ' + cssVar('--mono', 'monospace');
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
  var CAP = 40;            /* reserved band at the foot of every canvas */

  /* Captions shrink to fit rather than being clipped at the canvas edge,
     which matters most on a narrow phone where a long sub-line would
     otherwise lose half its words with no indication anything is missing. */
  function fitText(ctx, text, avail, sizes, weight) {
    for (var i = 0; i < sizes.length; i++) {
      ctx.font = (weight || '') + sizes[i] + 'px ' + cssVar('--font', 'sans-serif');
      if (ctx.measureText(text).width <= avail) return true;
    }
    return false;
  }

  function fitMono(ctx, text, avail) {
    var sizes = [9, 8.5, 8, 7.5, 7];
    for (var i = 0; i < sizes.length; i++) {
      ctx.font = sizes[i] + 'px ' + cssVar('--mono', 'monospace');
      if (ctx.measureText(text).width <= avail) return true;
    }
    return false;
  }

  function caption(ctx, W, H, text, sub) {
    var avail = W - 24;
    ctx.textAlign = 'left';
    if (sub) {
      ctx.fillStyle = cssVar('--muted', '#6B5D63');
      if (!fitText(ctx, sub, avail, [9, 8.5, 8, 7.5])) {
        var cut = sub;
        while (cut.length > 12 && ctx.measureText(cut + '...').width > avail) {
          cut = cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : cut.length - 1);
        }
        sub = cut + '...';
      }
      ctx.fillText(sub, 12, H - 24);
    }
    ctx.fillStyle = cssVar('--ink', '#2B1F24');
    if (!fitText(ctx, text, avail, [10, 9.5, 9, 8.5, 8], '600 ')) {
      var cut2 = text;
      while (cut2.length > 12 && ctx.measureText(cut2 + '...').width > avail) {
        cut2 = cut2.slice(0, cut2.lastIndexOf(' ') > 0 ? cut2.lastIndexOf(' ') : cut2.length - 1);
      }
      text = cut2 + '...';
    }
    ctx.fillText(text, 12, H - 9);
  }
  function title(ctx, text, x, y, W) {
    ctx.fillStyle = cssVar('--muted', '#6B5D63');
    ctx.textAlign = 'left';
    var sizes = [9, 8.5, 8, 7.5, 7];
    var avail = (W || 0) > 0 ? W - x - 8 : Infinity;
    for (var i = 0; i < sizes.length; i++) {
      ctx.font = sizes[i] + 'px ' + cssVar('--mono', 'monospace');
      if (ctx.measureText(text).width <= avail) break;
    }
    ctx.fillText(text, x, y);
  }

  /* ---------- toy data, fixed so a redraw is identical ---------- */

  var X = [
    [0.62, 0.71, 0.80, 0.74, 0.58, 0.41, 0.33, 0.38, 0.52, 0.67, 0.79, 0.72],
    [0.20, 0.05, 0.00, 0.35, 0.60, 0.15, 0.00, 0.00, 0.28, 0.44, 0.10, 0.02]
  ];
  var Kq = [
    [[0.5, -0.2, 0.3], [0.1, 0.6, -0.4]],
    [[-0.3, 0.7, 0.2], [0.4, -0.1, 0.5]],
    [[0.2, 0.4, -0.6], [-0.5, 0.2, 0.3]]
  ];
  var BIAS = [0.05, -0.02, 0.10];

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

  /* Width encodes how many values a stage holds, on a log scale. Every block
     that draws a shape chain uses this, so a wide box always means more
     values and the reader never has to relearn the grammar. */
  function widthFor(n, maxW) {
    return 16 + (maxW - 16) * (Math.log(n) / Math.log(27904));
  }

  /* 1. basic multichannel convolution, with GELU */
  BLOCKS.conv = function (ctx, W, H, t) {
    var ink = cssVar('--ink', '#2B1F24'), muted = cssVar('--muted', '#6B5D63');
    var accent = cssVar('--accent', '#8C2F4A');
    var cS = cssVar('--d-strided', '#61223B'), cD = cssVar('--d-dilated', '#8C6B2F');
    var n = 12, labelW = 48;
    var avail = W - labelW - 20;
    var cw = Math.min(42, avail / (n + 2)), ch = 20;
    var pad = labelW + cw + Math.max(0, (avail - cw * (n + 2)) / 2);
    var contentH = 2 * (ch + 2) + 52 + Kq.length * (ch + 2);
    var yIn = Math.max(28, 20 + (H - CAP - 20 - contentH) / 2);
    var yOut = yIn + 2 * (ch + 2) + 52;
    var pos = Math.floor(t * n) % n;
    var sub = t * n - Math.floor(t * n);

    title(ctx, 'input, 2 variables x 12 days', pad, yIn - 8, W);
    var neutral = cssVar('--ink', '#2B1F24');
    for (var c = 0; c < 2; c++) {
      /* the implicit zero padding the kernel reads at the two ends */
      cell(ctx, pad - cw, yIn + c * (ch + 2), cw - 2, ch, muted, 0.10);
      cell(ctx, pad + n * cw, yIn + c * (ch + 2), cw - 2, ch, muted, 0.10);
      for (var i = 0; i < n; i++) {
        var inWin = Math.abs(i - pos) <= 1;
        cell(ctx, pad + i * cw, yIn + c * (ch + 2), cw - 2, ch,
             neutral, inWin ? 0.62 : 0.13, X[c][i].toFixed(2),
             inWin ? '#fff' : muted);
      }
      ctx.fillStyle = muted;
      ctx.font = '8px ' + cssVar('--mono', 'monospace');
      ctx.textAlign = 'right';
      ctx.fillText(c === 0 ? 'tmax' : 'rain', pad - cw - 5, yIn + c * (ch + 2) + 12);
    }

    /* the kernel window */
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.4;
    var wx = pad + (pos - 1) * cw;
    ctx.strokeRect(wx, yIn - 2, cw * 3 - 2, (ch + 2) * 2);

    /* output feature maps */
    title(ctx, 'feature maps, ' + Kq.length + ' learned filters x 12 positions', pad, yOut - 8, W);
    for (var q = 0; q < Kq.length; q++) {
      for (i = 0; i < n; i++) {
        /* Paint the active column immediately, because the caption already
           states its value and an empty cell inside the highlight reads as
           a mismatch between the arithmetic and the picture. */
        var done = i <= pos;
        var a = convAt(q, i);
        var h = gelu(a);
        cell(ctx, pad + i * cw, yOut + q * (ch + 2), cw - 2, ch,
             cS, done ? 0.26 + 0.42 * Math.min(1, Math.abs(h)) : 0.08,
             done ? h.toFixed(2) : '', ink);
      }
      ctx.fillStyle = muted;
      ctx.font = '8px ' + cssVar('--mono', 'monospace');
      ctx.textAlign = 'right';
      ctx.fillText('q' + (q + 1), pad - cw - 5, yOut + q * (ch + 2) + 12);
    }
    arrow(ctx, pad + pos * cw + cw / 2, yIn + (ch + 2) * 2 + 5,
          pad + pos * cw + cw / 2, yOut - 18, accent, 0.85);
    /* the window centred on pos produces exactly this column of outputs */
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(pad + pos * cw - 1, yOut - 2,
                   cw, Kq.length * (ch + 2));

    var a0 = convAt(0, pos);
    caption(ctx, W, H,
      'position ' + (pos + 1) + ':  pre-activation ' + a0.toFixed(2) +
      ',  after GELU ' + gelu(a0).toFixed(2),
      'two variables in, three feature maps out: the channel count is set by the number of filters');
  };

  /* 2. strided convolution with same-padding */
  BLOCKS.strided = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), accent = cssVar('--accent', '#8C2F4A');
    var colour = cssVar('--d-strided', '#61223B');
    var n = 17, k = 7, s = 2, p = 3;
    var nOut = Math.floor((n + 2 * p - (k - 1) - 1) / s) + 1;
    var pad = 26, cw = (W - pad * 2) / (n + 2 * p), chh = 16;
    var yIn = 34, yOut = H - CAP - 22;
    var step = Math.floor(t * nOut) % nOut;
    var centre = step * s;

    title(ctx, 'input, 17 positions with 3 padding cells at each end', pad, yIn - 9, W);
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

    title(ctx, 'output, ' + nOut + ' positions, one per two inputs   (the model halves 1,734 to 867)',
          pad, yOut - 9, W);
    var ow = cw;                       /* same pitch, so the row is visibly shorter */
    var oPad = pad + p * cw;           /* start under the first real input */
    for (i = 0; i < nOut; i++) {
      cell(ctx, oPad + i * ow, yOut, ow - 1.5, chh, colour, i < step ? 0.62 : (i === step ? 0.8 : 0.1));
    }
    arrow(ctx, pad + (centre + p) * cw + cw / 2, yIn + chh + 4,
          oPad + step * ow + ow / 2, yOut - 5, accent, 0.8);

    caption(ctx, W, H,
            'the window steps two positions at a time, so consecutive windows overlap by five',
            'the pale cells at each end are the padding that lets the kernel centre reach the first and last day');
  };

  /* 3. dilated convolution, cycling the rate */
  BLOCKS.dilated = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), accent = cssVar('--accent', '#8C2F4A');
    var colour = cssVar('--d-dilated', '#8C6B2F');
    var rates = [1, 2, 4, 8];
    var phase = t * rates.length;
    var idx = Math.floor(phase) % rates.length;
    var d = rates[idx];
    /* Ease the tap spacing between rates so the kernel visibly opens out
       instead of teleporting, while the labels stay on the exact rate. */
    var local = phase - Math.floor(phase);
    var nxt = rates[(idx + 1) % rates.length];
    /* The loop dwells near t = 1, so the last slot must not morph back to
       d = 1 or the frame held longest is the one that looks like an ordinary
       convolution. Earlier slots start their fan-out sooner as well. */
    var lastSlot = idx === rates.length - 1;
    var ease = lastSlot ? 0 : (local < 0.45 ? 0 : (local - 0.45) / 0.55);
    var eased = ease * ease * (3 - 2 * ease);
    var dEff = d + (nxt - d) * eased;
    var k = 7, n = 57;
    var pad = 20, cw = (W - pad * 2) / n, chh = 16;
    var yIn = 40, yOut = H - CAP - 22;
    var centre = Math.round(n / 2);
    /* name the rate the taps have actually reached, not the one just left */
    var dShown = eased > 0.5 ? nxt : d;
    var span = dShown * (k - 1) + 1;

    title(ctx, 'input, stride 1 so the length never changes', pad, yIn - 9, W);
    var taps = [];        /* integer cells for the highlight */
    var tapsF = [];       /* continuous positions for the moving marks */
    for (var j = 0; j < k; j++) {
      taps.push(Math.round(centre + (j - (k - 1) / 2) * dEff));
      tapsF.push(centre + (j - (k - 1) / 2) * dEff);
    }
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
    ctx.moveTo(pad + tapsF[0] * cw, yIn - 5);
    ctx.lineTo(pad + (tapsF[k - 1] + 1) * cw, yIn - 5);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.font = '600 8.5px ' + cssVar('--mono', 'monospace');
    ctx.textAlign = 'center';
    ctx.fillText(k + ' weights',
                 pad + ((tapsF[0] + tapsF[k - 1] + 1) / 2) * cw, yIn - 10);
    /* the unspread span, kept on screen so the widening is always comparative */
    var refLo = centre - (k - 1) / 2, refHi = centre + (k - 1) / 2;
    ctx.strokeStyle = muted;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad + refLo * cw, yIn + chh + 16);
    ctx.lineTo(pad + (refHi + 1) * cw, yIn + chh + 16);
    ctx.moveTo(pad + refLo * cw, yIn + chh + 13);
    ctx.lineTo(pad + refLo * cw, yIn + chh + 19);
    ctx.moveTo(pad + (refHi + 1) * cw, yIn + chh + 13);
    ctx.lineTo(pad + (refHi + 1) * cw, yIn + chh + 19);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = muted;
    ctx.font = '8px ' + cssVar('--mono', 'monospace');
    ctx.fillText('d=1 span 7', pad + (centre + 0.5) * cw, yIn + chh + 29);
    ctx.globalAlpha = 1;

    title(ctx, 'output, same length', pad, yOut - 9, W);
    for (i = 0; i < n; i++) {
      cell(ctx, pad + i * cw, yOut, Math.max(1.5, cw - 1.2), chh, colour,
           i === centre ? 0.85 : 0.14);
    }
    for (j = 0; j < k; j++) {
      if (tapsF[j] < 0 || tapsF[j] >= n) continue;
      arrow(ctx, pad + tapsF[j] * cw + cw / 2, yIn + chh + 3,
            pad + centre * cw + cw / 2, yOut - 4, accent, 0.28);
    }

    caption(ctx, W, H,
            'dilation ' + dShown + ':  seven weights spread over ' + span + ' positions, output length unchanged',
            'stacking rates 1, 2, 4 and 8 is what carries the selected model to a 763-day receptive field');
  };

  /* 4. adaptive average pooling */
  var POOLV = [0.42, 0.61, 0.35, 0.28, 0.77, 0.64, 0.52, 0.81,
               0.19, 0.33, 0.47, 0.25, 0.68, 0.72, 0.55, 0.60];

  BLOCKS.pool = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), accent = cssVar('--accent', '#8C2F4A');
    var colour = cssVar('--d-pool', '#4A6670');
    var nIn = 16, nOut = 4, chan = 4;
    var pad = 42, cw = (W - pad * 2) / nIn, chh = 13;
    var yIn = 28, yOut = H - CAP - 4 * (13 + 2) - 6;
    var bin = Math.floor(t * nOut) % nOut;

    title(ctx, 'feature tensor, 4 channels x 16 positions', pad, yIn - 9, W);
    for (var c = 0; c < chan; c++) {
      for (var i = 0; i < nIn; i++) {
        var inBin = Math.floor(i / (nIn / nOut)) === bin;
        var val = POOLV[(i + c * 3) % nIn];
        cell(ctx, pad + i * cw, yIn + c * (chh + 2), cw - 2, chh, colour,
             inBin ? 0.72 : 0.15, c === 0 ? val.toFixed(2) : '',
             inBin ? '#fff' : muted);
      }
    }
    var ow = (W - pad * 2) / nOut;
    title(ctx, 'pooled, 4 channels x 4 positions   (the model pools 867 to 109)', pad, yOut - 9, W);
    var perBin = nIn / nOut;
    for (c = 0; c < chan; c++) {
      for (i = 0; i < nOut; i++) {
        var mean = 0;
        for (var q = 0; q < perBin; q++) mean += POOLV[(i * perBin + q + c * 3) % nIn];
        mean /= perBin;
        cell(ctx, pad + i * ow, yOut + c * (chh + 2), ow - 3, chh, colour,
             i < bin ? 0.55 : (i === bin ? 0.75 : 0.12),
             (c === 0 && i <= bin) ? mean.toFixed(2) : '',
             i === bin ? '#fff' : muted);
      }
    }
    arrow(ctx, pad + (bin + 0.5) * (nIn / nOut) * cw, yIn + chan * (chh + 2) + 2,
          pad + bin * ow + ow / 2, yOut - 5, accent, 0.8);

    caption(ctx, W, H,
            'each output position averages the input positions in its bin, and the channel count does not change',
            'global average pooling is the same idea with one bin, so feature position is no longer represented explicitly');
  };

  /* 5. flatten and the fully connected bridge, with a toy network */
  BLOCKS.bridge = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), ink = cssVar('--ink', '#2B1F24');
    var accent = cssVar('--accent', '#8C2F4A'), cM = cssVar('--d-mlp', '#3F6B4A');
    var cL = cssVar('--d-latent', '#C2761F'), border = cssVar('--border', '#E0D6C9');

    /* the real shape chain of the selected model, across the top */
    var shapes = ['256 x 109', '27,904', '128', '5'];
    var names = ['feature tensor', 'flattened', 'hidden', 'embedding'];
    var counts = [27904, 27904, 128, 5];
    var y0 = 18, bh = 24;
    var maxW = Math.min(150, (W - 70) / 3.1);
    var ws = counts.map(function (n) { return widthFor(n, maxW); });
    var total = ws[0] + ws[1] + ws[2] + ws[3];
    var gap = (W - 30 - total) / 3;
    var xrun = 15;
    for (var i = 0; i < 4; i++) {
      var bw = ws[i];
      var x = xrun;
      xrun += bw + gap;
      cell(ctx, x, y0, bw, bh, i === 3 ? cL : cM, 0.34);
      ctx.fillStyle = ink;
      ctx.textAlign = 'center';
      var fs2 = 10;
      do {
        ctx.font = '600 ' + fs2 + 'px ' + cssVar('--mono', 'monospace');
        fs2 -= 0.5;
      } while (fs2 > 6 && ctx.measureText(shapes[i]).width > bw - 6);
      ctx.fillText(shapes[i], x + bw / 2, y0 + 16);
      ctx.fillStyle = muted;
      ctx.font = '8px ' + cssVar('--font', 'sans-serif');
      ctx.fillText(names[i], x + bw / 2, y0 - 5);
      if (i < 3) arrow(ctx, x + bw + 3, y0 + bh / 2, x + bw + gap - 3, y0 + bh / 2, muted, 0.55);
      ctx.textAlign = 'center';
    }

    /* toy network, computed one unit at a time so the sum is visible */
    var vIn = [0.80, -0.35, 0.42, 0.11];
    var W1 = [[0.60, -0.40, 0.20, 0.50], [-0.30, 0.80, 0.10, -0.20], [0.20, 0.30, -0.70, 0.40]];
    var b1 = [0.05, -0.10, 0.20];
    var W2 = [[0.70, -0.50, 0.30], [-0.20, 0.60, 0.40]];
    var b2 = [0.00, 0.10];
    var pre = W1.map(function (row, j) {
      return row.reduce(function (a, w, i2) { return a + w * vIn[i2]; }, b1[j]);
    });
    var hid = pre.map(gelu);
    var out = W2.map(function (row, j) {
      return row.reduce(function (a, w, i2) { return a + w * hid[i2]; }, b2[j]);
    });

    var yTop = y0 + bh + 40, yBot = H - CAP - 26;
    var colX = [W * 0.15, W * 0.45, W * 0.78];
    var R = Math.min(19, (yBot - yTop) / 9);

    /* Six stages: three hidden units, two outputs, then a hold so the
       finished embedding is actually on screen long enough to read. */
    var STAGES = 6;
    var stage = Math.min(STAGES - 1, Math.floor(t * STAGES));
    var hold = stage === 5;
    var frac = hold ? 1 : Math.min(1, (t * STAGES) - stage);
    var active = Math.min(4, stage);
    var target = active < 3 ? active : active - 3;
    var inHidden = !hold && active < 3;

    function pts(count, x) {
      var out2 = [];
      for (var j = 0; j < count; j++) {
        out2.push({ x: x, y: yTop + ((yBot - yTop) * (j + 0.5)) / count });
      }
      return out2;
    }
    var pIn = pts(4, colX[0]), pHid = pts(3, colX[1]), pOut = pts(2, colX[2]);

    /* edges: the active unit reveals its terms one at a time */
    function drawEdges(a, b, Wm, activeJ, reveal, done) {
      for (var j = 0; j < b.length; j++) {
        for (var i2 = 0; i2 < a.length; i2++) {
          var w = Wm[j][i2];
          var live = (j === activeJ && i2 < reveal) || done[j];
          ctx.strokeStyle = w >= 0 ? cM : accent;
          ctx.globalAlpha = live ? 0.30 + Math.min(0.55, Math.abs(w)) : 0.07;
          ctx.lineWidth = live ? 0.8 + Math.abs(w) * 2.2 : 0.6;
          ctx.beginPath();
          ctx.moveTo(a[i2].x + R, a[i2].y);
          ctx.lineTo(b[j].x - R, b[j].y);
          ctx.stroke();
          if (j === activeJ && i2 === reveal - 1) {
            var mx = (a[i2].x + R + b[j].x - R) / 2, my = (a[i2].y + b[j].y) / 2;
            ctx.fillStyle = w >= 0 ? cM : accent;
            ctx.font = '600 8.5px ' + cssVar('--mono', 'monospace');
            ctx.textAlign = 'center';
            ctx.fillText(w.toFixed(2), mx, my - 3);
          }
        }
      }
      ctx.globalAlpha = 1;
    }
    /* one reveal count drives both the edges and the written arithmetic */
    var revealH = Math.min(4, Math.floor(frac * 4 / 0.7));
    var revealO = Math.min(3, Math.floor(frac * 3 / 0.7));
    var hidDone = [hold || stage > 0, hold || stage > 1, hold || stage > 2];
    var outDone = [hold || stage > 3, hold];
    drawEdges(pIn, pHid, W1, inHidden ? target : -1,
              inHidden ? revealH : 4, hidDone);
    drawEdges(pHid, pOut, W2, (hold || inHidden) ? -1 : target,
              inHidden ? 0 : revealO, outDone);

    function nodes(p, vals, colour, lit, label) {
      for (var j = 0; j < p.length; j++) {
        ctx.beginPath();
        ctx.arc(p[j].x, p[j].y, R, 0, Math.PI * 2);
        ctx.fillStyle = colour;
        ctx.globalAlpha = lit[j] ? 0.62 : 0.14;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = lit[j] ? colour : border;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = lit[j] ? '#fff' : muted;
        ctx.font = '600 10px ' + cssVar('--mono', 'monospace');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(lit[j] ? vals[j].toFixed(2) : '?', p[j].x, p[j].y);
        ctx.textBaseline = 'alphabetic';
      }
      ctx.fillStyle = muted;
      ctx.font = '9px ' + cssVar('--font', 'sans-serif');
      ctx.textAlign = 'center';
      ctx.fillText(label, p[0].x, yTop - 14);
    }
    nodes(pIn, vIn, cM, [true, true, true, true], 'inputs');
    nodes(pHid, hid, cM,
          [hidDone[0] || (inHidden && target === 0 && frac > 0.92),
           hidDone[1] || (inHidden && target === 1 && frac > 0.92),
           hidDone[2] || (inHidden && target === 2 && frac > 0.92)], 'hidden, GELU');
    nodes(pOut, out, cL,
          [outDone[0] || (!hold && !inHidden && target === 0 && frac > 0.92),
           outDone[1] || (!hold && !inHidden && target === 1 && frac > 0.92)], 'embedding');

    /* the running arithmetic for the unit being computed */
    var terms = [], sum;
    if (hold) {
      caption(ctx, W, H,
              'the four inputs are now two numbers: ' + out[0].toFixed(2) + ' and ' + out[1].toFixed(2),
              'the real model carries 27,904 values down to five in exactly this way');
    } else if (inHidden) {
      var kk = revealH;
      for (i = 0; i < kk; i++) {
        terms.push(W1[target][i].toFixed(2) + '(' + vIn[i].toFixed(2) + ')');
      }
      sum = b1[target];
      for (i = 0; i < kk; i++) sum += W1[target][i] * vIn[i];
      var line = W < 520
        ? 'h' + (target + 1) + ' = GELU(sum of ' + kk + ' terms + ' + b1[target].toFixed(2) + ')'
        : 'h' + (target + 1) + ' = GELU(' + (terms.length ? terms.join(' + ') + ' + ' : '') +
          b1[target].toFixed(2) + ')';
      if (kk === 4) line += ' = GELU(' + pre[target].toFixed(2) + ') = ' + hid[target].toFixed(2);
      caption(ctx, W, H, line, 'each hidden unit sums every input, adds a bias, then passes through GELU');
    } else {
      var mm = revealO;
      for (i = 0; i < mm; i++) {
        terms.push(W2[target][i].toFixed(2) + '(' + hid[i].toFixed(2) + ')');
      }
      var line2 = 'z' + (target + 1) + ' = ' + (terms.length ? terms.join(' + ') + ' + ' : '') +
                  b2[target].toFixed(2);
      if (mm === 3) line2 += ' = ' + out[target].toFixed(2);
      caption(ctx, W, H, line2, 'the final layer is linear, so the embedding is not squashed by an activation');
    }
  };

  /* 6. decoder bridge and reshape */
  BLOCKS.decbridge = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), ink = cssVar('--ink', '#2B1F24');
    var cM = cssVar('--d-mlp', '#3F6B4A'), cL = cssVar('--d-latent', '#C2761F');
    var accent = cssVar('--accent', '#8C2F4A');

    /* Box width encodes how many values the stage holds, on a log scale, so
       the expansion from five numbers to a full feature tensor is the thing
       the eye actually sees. */
    var counts = [5, 128, 27904, 27904];
    var shapes = ['5', '128', '27,904', '256 x 109'];
    var names = ['embedding', 'hidden', 'flat vector', 'feature tensor'];
    var maxW = Math.min(150, (W - 70) / 3.1);
    function bwFor(n) { return widthFor(n, maxW); }

    var stage = Math.min(3, Math.floor(t * 4));
    var frac = Math.min(1, t * 4 - stage);
    var e = frac * frac * (3 - 2 * frac);

    var bh = 30;
    var cy = (H - CAP) / 2 + 4;
    var gap = (W - 24 - bwFor(counts[0]) - bwFor(counts[1]) - bwFor(counts[2]) - bwFor(counts[3])) / 3;
    var xs = [], x = 12;
    for (var i = 0; i < 4; i++) { xs.push(x); x += bwFor(counts[i]) + gap; }

    /* fan of connections, drawn as the current stage opens out */
    for (i = 0; i < 3; i++) {
      var on = i < stage ? 1 : (i === stage ? e : 0);
      if (on <= 0) continue;
      var ax = xs[i] + bwFor(counts[i]), bx = xs[i + 1];
      var lines = 9;
      ctx.strokeStyle = i === 2 ? accent : cM;
      for (var j = 0; j < lines; j++) {
        var by = cy - bh / 2 + (bh * (j + 0.5)) / lines;
        ctx.globalAlpha = 0.10 + 0.35 * on;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(ax, cy + ((j / (lines - 1)) - 0.5) * bh * 0.25);
        ctx.lineTo(ax + (bx - ax) * on, by);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    for (i = 0; i < 4; i++) {
      var w = bwFor(counts[i]);
      var lit = i <= stage;
      /* The box keeps its width, which is what encodes the value count, and
         fills by a wipe. Growing the width would make it collapse to a third
         at every stage boundary and drag the label outside the rectangle. */
      cell(ctx, xs[i], cy - bh / 2, w, bh, i === 0 ? cL : cM, lit ? 0.14 : 0.10);
      if (lit) {
        var fillW = i === stage ? w * e : w;
        ctx.save();
        ctx.beginPath();
        ctx.rect(xs[i], cy - bh / 2, fillW, bh);
        ctx.clip();
        cell(ctx, xs[i], cy - bh / 2, w, bh, i === 0 ? cL : cM, 0.5);
        ctx.restore();
      }
      ctx.fillStyle = lit ? ink : muted;
      ctx.textAlign = 'center';
      var fs = 10;
      do {
        ctx.font = '600 ' + fs + 'px ' + cssVar('--mono', 'monospace');
        fs -= 0.5;
      } while (fs > 6 && ctx.measureText(shapes[i]).width > w - 6);
      ctx.fillText(shapes[i], xs[i] + w / 2, cy + 4);
      ctx.fillStyle = muted;
      ctx.font = '8px ' + cssVar('--font', 'sans-serif');
      ctx.fillText(names[i], xs[i] + w / 2, cy - bh / 2 - 7);
    }

    caption(ctx, W, H,
      'five numbers are expanded back into a full feature tensor before any convolution runs',
      'the widths above are drawn on a log scale, and these weights are learned separately rather than reused from the encoder');
  };

  /* 7. linear interpolation */
  BLOCKS.interp = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), accent = cssVar('--accent', '#8C2F4A');
    var colour = cssVar('--d-pool', '#4A6670'), ink = cssVar('--ink', '#2B1F24');
    var known = [0.30, 0.78, 0.44, 0.86, 0.38];
    var per = 4;                         /* new positions inserted per gap */
    var nOut = (known.length - 1) * per + 1;
    var pad = 40, span = W - pad * 2;
    var base = H - CAP - 16, hgt = H - CAP - 92;

    /* axis */
    ctx.strokeStyle = cssVar('--border', '#E0D6C9');
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, base); ctx.lineTo(pad + span, base); ctx.stroke();

    var gaps = known.length - 1;
    var prog = t * gaps;                  /* which gap is being filled */
    var g = Math.min(gaps - 1, Math.floor(prog));
    var f = prog - g;

    function kx(i) { return pad + (span * i) / (known.length - 1); }
    function oy(v) { return base - v * hgt; }

    /* straight segments between known values, revealed as we go */
    for (var i = 0; i < gaps; i++) {
      var shown = i < g ? 1 : (i === g ? f : 0);
      if (shown <= 0) continue;
      ctx.strokeStyle = colour;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(kx(i), oy(known[i]));
      ctx.lineTo(kx(i) + (kx(i + 1) - kx(i)) * shown,
                 oy(known[i] + (known[i + 1] - known[i]) * shown));
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    /* inserted positions as small bars, so the change in resolution is visible */
    for (i = 0; i < gaps; i++) {
      for (var j = 1; j < per; j++) {
        var ff = j / per;
        var shown2 = i < g || (i === g && f > ff);
        if (!shown2) continue;
        var x = kx(i) + (kx(i + 1) - kx(i)) * ff;
        var v = known[i] * (1 - ff) + known[i + 1] * ff;
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.20;
        ctx.fillRect(x - 2, oy(v), 4, base - oy(v));
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, oy(v), 3, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.fill();
      }
    }

    /* known values as tall bars with their numbers */
    for (i = 0; i < known.length; i++) {
      ctx.fillStyle = colour;
      ctx.globalAlpha = 0.22;
      ctx.fillRect(kx(i) - 4, oy(known[i]), 8, base - oy(known[i]));
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(kx(i), oy(known[i]), 5.5, 0, Math.PI * 2);
      ctx.fillStyle = colour;
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.font = '600 9px ' + cssVar('--mono', 'monospace');
      ctx.textAlign = 'center';
      ctx.fillText(known[i].toFixed(2), kx(i), oy(known[i]) - 10);
    }

    /* the moving blend marker between the current pair */
    var mx = kx(g) + (kx(g + 1) - kx(g)) * f;
    var mv = known[g] * (1 - f) + known[g + 1] * f;
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.55;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(mx, oy(mv)); ctx.lineTo(mx, base); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(mx, oy(mv), 5, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();

    title(ctx, known.length + ' known values become ' + nOut +
          ' positions   (the model expands 109 back to 867)', pad, 20, W);
    var fq = Math.floor(f * per) / per;
    var mvq = known[g] * (1 - fq) + known[g + 1] * fq;
    caption(ctx, W, H,
      'new value = (1 - f) x ' + known[g].toFixed(2) + ' + f x ' + known[g + 1].toFixed(2) +
      ',  with f = ' + fq.toFixed(2) + ' giving ' + mvq.toFixed(2),
      'the inserted points lie exactly on the straight line between two known values, so no new information is created');
  };

  /* 8. transposed convolution */
  BLOCKS.transposed = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), accent = cssVar('--accent', '#8C2F4A');
    var colour = cssVar('--d-strided', '#61223B');
    var nIn = 5, k = 4, s = 2;
    var kern = [0.6, 0.9, 0.5, 0.2];
    var inVals = [0.7, 0.4, 0.9, 0.3, 0.6];
    var nOut = (nIn - 1) * s + k;
    var pad = 40, ow = (W - pad * 2) / nOut, iw = ow * s;   /* input spans less */
    var yIn = 34, yOut = H - CAP - 26, chh = 16;
    var cur = Math.floor(t * nIn) % nIn;

    title(ctx, 'input, ' + nIn + ' positions, each multiplies the whole kernel', pad, yIn - 9, W);
    /* the kernel itself, so the scatter has something visible to scatter */
    var kx0 = pad, kyy = yIn + chh + 14, kcw = Math.min(26, (W - pad * 2) / 18);
    ctx.fillStyle = muted;
    ctx.font = '8px ' + cssVar('--mono', 'monospace');
    ctx.textAlign = 'right';
    ctx.fillText('kernel', kx0 - 6, kyy + 9);
    for (var kk2 = 0; kk2 < k; kk2++) {
      cell(ctx, kx0 + kk2 * kcw, kyy, kcw - 2, 13, accent,
           0.25 + 0.5 * kern[kk2], kern[kk2].toFixed(1), '#fff');
    }
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
    title(ctx, 'output, ' + nOut + ' positions, overlapping contributions are added', pad, yOut - 9, W);
    for (i = 0; i < nOut; i++) {
      var touched = i >= cur * s && i < cur * s + k;
      cell(ctx, pad + i * ow, yOut, ow - 3, chh, colour,
           acc[i] > 0 ? 0.18 + 0.6 * (acc[i] / maxV) : 0.08,
           acc[i] > 0 ? acc[i].toFixed(2) : '',
           acc[i] / maxV > 0.55 ? '#fff' : cssVar('--ink', '#2B1F24'));
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

    caption(ctx, W, H,
            'each input scatters across the kernel, and the overlaps are added, so the sequence lengthens',
            'the weights are learned rather than copied from the encoder, and information lost by downsampling is not recovered');
  };

  /* 9. parallel-branch fusion, with the 1x1 convolution inset */
  BLOCKS.fusion = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), ink = cssVar('--ink', '#2B1F24');
    var cS = cssVar('--d-strided', '#61223B'), cD = cssVar('--d-dilated', '#8C6B2F');
    var cL = cssVar('--d-latent', '#C2761F'), cM = cssVar('--d-mlp', '#3F6B4A');
    var border = cssVar('--border', '#E0D6C9');
    var half = W / 2;

    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(half, 18); ctx.lineTo(half, H - CAP - 4); ctx.stroke();

    var yTop = 42;
    var rows = 4;
    var pitch = (H - CAP - 14 - yTop) / rows;
    var bh = Math.min(18, pitch * 0.52);
    function ry(r) { return yTop + pitch * r; }

    /* reveals spread across the whole loop so nothing sits frozen at the end */
    function lit(at) { return t > at; }

    function box(cx, w, r, colour, on, label) {
      var x = cx - w / 2, y = ry(r);
      cell(ctx, x, y, w, bh, colour, on ? 0.55 : 0.13, label, on ? '#fff' : muted);
      return { x: x, y: y, w: w, h: bh, cx: cx, cy: y + bh / 2 };
    }
    function link(a, b, on) {
      arrow(ctx, a.cx, a.y + a.h, b.cx, b.y - 3, on ? muted : border, on ? 0.75 : 0.25);
    }

    /* ---- left: concatenation then a 1 x 1 convolution ---- */
    var lx = half / 2;
    ctx.fillStyle = ink;
    ctx.font = '600 10px ' + cssVar('--font', 'sans-serif');
    ctx.textAlign = 'center';
    ctx.fillText('concatenation fusion', lx, 24);

    var la = box(lx - 30, 56, 0, cS, lit(0.05), '128 x 109');
    var lb = box(lx + 30, 56, 0, cD, lit(0.05), '128 x 109');
    var lc = box(lx, 118, 1, muted, lit(0.28), '256 x 109');
    var ld = box(lx, 74, 2, cM, lit(0.5), '1x1 conv');
    var le = box(lx, 56, 3, cM, lit(0.72), '128 x 109');   /* back to 128 channels */
    link(la, lc, lit(0.28)); link(lb, lc, lit(0.28));
    link(lc, ld, lit(0.5)); link(ld, le, lit(0.72));

    /* ---- right: a bridge per branch, then the latents are added ---- */
    var rx = half + half / 2;
    ctx.fillStyle = ink;
    ctx.font = '600 10px ' + cssVar('--font', 'sans-serif');
    ctx.fillText('latent summation', rx, 24);

    var ra = box(rx - 32, 56, 0, cS, lit(0.05), '128 x 109');
    var rb = box(rx + 32, 56, 0, cD, lit(0.05), '128 x 109');
    var rc = box(rx - 32, 56, 1, cM, lit(0.28), 'MLP');
    var rd = box(rx + 32, 56, 1, cM, lit(0.28), 'MLP');
    var re = box(rx - 32, 46, 2, cL, lit(0.5), 'z_A');
    var rf2 = box(rx + 32, 46, 2, cL, lit(0.5), 'z_B');
    var rg = box(rx, 46, 3, cL, lit(0.72), 'z');
    link(ra, rc, lit(0.28)); link(rb, rd, lit(0.28));
    link(rc, re, lit(0.5)); link(rd, rf2, lit(0.5));
    link(re, rg, lit(0.72)); link(rf2, rg, lit(0.72));
    if (lit(0.72)) {
      ctx.fillStyle = cL;
      ctx.font = '600 11px ' + cssVar('--mono', 'monospace');
      ctx.textAlign = 'center';
      ctx.fillText('+', rx, ry(2) + bh + (pitch - bh) / 2 + 4);
    }

    ctx.fillStyle = muted;
    ctx.font = '8.5px ' + cssVar('--font', 'sans-serif');
    ctx.textAlign = 'center';
    ctx.fillText('mixes channels at each position', lx, H - CAP - 2);
    ctx.fillText('one bridge per branch, latents added', rx, H - CAP - 2);

    caption(ctx, W, H,
      'the fusion choice is why the two parallel architectures differ in bridge size and parameter count',
      'concatenation fuses before the bridge at 13,952 inputs, summation gives each branch its own bridge');
  };

  /* 10. variational sampling */
  BLOCKS.vae = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), ink = cssVar('--ink', '#2B1F24');
    var cM = cssVar('--d-mlp', '#3F6B4A'), cL = cssVar('--d-latent', '#C2761F');
    var accent = cssVar('--accent', '#8C2F4A');
    var mu = [0.35, -0.20, 0.62, 0.05, -0.44];
    var sd = [0.22, 0.31, 0.18, 0.27, 0.24];
    var draw = Math.floor(t * 4);
    var yTop = 46, rowH = (H - yTop - CAP - 12) / 5;

    ctx.fillStyle = muted;
    ctx.font = '8.5px ' + cssVar('--font', 'sans-serif');
    ctx.textAlign = 'center';
    ctx.fillText('mean', W * 0.11, yTop - 12);
    ctx.fillText('std dev', W * 0.25, yTop - 12);
    ctx.fillText('epsilon', W * 0.39, yTop - 12);
    ctx.fillText('sampled embedding, 5 dimensions', W * 0.75, yTop - 12);

    for (var i = 0; i < 5; i++) {
      var y = yTop + rowH * (i + 0.5);
      /* column pitch is 0.14W, so a fixed 52px box collides below W = 371 */
      var colW = Math.min(52, W * 0.14 - 5);
      cell(ctx, W * 0.11 - colW / 2, y - 8, colW, 16, cM, 0.45, mu[i].toFixed(2), '#fff');
      cell(ctx, W * 0.25 - colW / 2, y - 8, colW, 16, cM, 0.30, sd[i].toFixed(2), ink);
      /* a deterministic pseudo-noise per draw so the value visibly jitters */
      /* Sum of three uniforms on [-1,1) has unit variance, so draws leave the
         one-standard-deviation band at about the rate a normal would. */
      var eps = 0;
      for (var q = 0; q < 3; q++) {
        var r = Math.sin((i + 1) * 12.9898 + draw * 4.1414 + q * 7.233) * 43758.5453;
        eps += (r - Math.floor(r)) * 2 - 1;
      }
      var z = mu[i] + sd[i] * eps;
      var bx = W * 0.55;
      var bw = W * 0.40;
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
      /* epsilon, the term the equation above the canvas turns on */
      cell(ctx, W * 0.39 - colW / 2, y - 8, colW, 16, accent, 0.30, eps.toFixed(2), ink);
      /* the zero line, so the sampled value can be read against a scale */
      ctx.strokeStyle = cssVar('--border', '#E0D6C9');
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(bx + bw * 0.5, y - 9); ctx.lineTo(bx + bw * 0.5, y + 9);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(bx + bw * (0.5 + z / 3), y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.font = '600 8.5px ' + cssVar('--mono', 'monospace');
      ctx.textAlign = 'center';
      ctx.fillText(z.toFixed(2), bx + bw * (0.5 + z / 3), y - 10);
    }

    caption(ctx, W, H,
            'the embedding is drawn from a distribution rather than read off directly',
            'this sampling block is the only structural difference from the deterministic models');
  };

  BLOCKS.gelu = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), ink = cssVar('--ink', '#2B1F24');
    var accent = cssVar('--accent', '#8C2F4A'), cM = cssVar('--d-mlp', '#3F6B4A');
    var border = cssVar('--border', '#E0D6C9');
    var padL = 54, padR = 22, padT = 22;
    var x0 = padL, x1 = W - padR;
    var yb = H - CAP - 10, yt = padT;
    var XMIN = -4, XMAX = 4, YMIN = -1.2, YMAX = 4;

    function px(v) { return x0 + ((v - XMIN) / (XMAX - XMIN)) * (x1 - x0); }
    function py(v) { return yb - ((v - YMIN) / (YMAX - YMIN)) * (yb - yt); }

    /* axes */
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, py(0)); ctx.lineTo(x1, py(0));
    ctx.moveTo(px(0), yt); ctx.lineTo(px(0), yb);
    ctx.stroke();
    ctx.fillStyle = muted;
    ctx.font = '8px ' + cssVar('--mono', 'monospace');
    ctx.textAlign = 'center';
    for (var v = -4; v <= 4; v += 2) {
      if (v === 0) continue;
      ctx.fillText(String(v), px(v), py(0) + 12);
    }
    /* the vertical scale, in the gutter, so the dashed guide lands on a number */
    ctx.textAlign = 'right';
    for (var u = -1; u <= 4; u++) {
      if (u === 0) continue;
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0 - 3, py(u)); ctx.lineTo(x0, py(u));
      ctx.stroke();
      ctx.fillStyle = muted;
      ctx.fillText(String(u), x0 - 6, py(u) + 3);
    }
    ctx.textAlign = 'center';

    /* identity, for reference */
    ctx.strokeStyle = muted;
    ctx.globalAlpha = 0.45;
    ctx.setLineDash([4, 4]);
    var lo = Math.max(XMIN, YMIN), hi = Math.min(XMAX, YMAX);
    ctx.beginPath();
    ctx.moveTo(px(lo), py(lo)); ctx.lineTo(px(hi), py(hi));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    /* the curve */
    ctx.strokeStyle = cM;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i <= 220; i++) {
      var xv = XMIN + ((XMAX - XMIN) * i) / 220;
      var yv = gelu(xv);
      if (i === 0) ctx.moveTo(px(xv), py(yv)); else ctx.lineTo(px(xv), py(yv));
    }
    ctx.stroke();

    /* a value sweeping back and forth through the curve */
    /* a single left-to-right sweep, so the end-of-loop hold rests on the
       positive tail where the curve meets the identity line */
    var a = XMIN + (XMAX - XMIN) * t;
    var h = gelu(a);
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.6;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(px(a), py(0)); ctx.lineTo(px(a), py(h));
    ctx.lineTo(px(XMIN), py(h));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(px(a), py(h), 5.5, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();

    ctx.fillStyle = ink;
    ctx.font = '600 10px ' + cssVar('--mono', 'monospace');
    ctx.textAlign = 'left';
    var aShown = Math.round(a * 2) / 2;
    ctx.fillText('in  ' + aShown.toFixed(1), x0 + 6, yt + 12);
    ctx.fillText('out ' + gelu(aShown).toFixed(2), x0 + 6, yt + 26);
    ctx.fillStyle = cM;
    ctx.font = '9px ' + cssVar('--font', 'sans-serif');
    ctx.textAlign = 'right';
    ctx.fillText('GELU', x1 - 4, py(gelu(3.4)) - 6);
    ctx.fillStyle = muted;
    ctx.fillText('identity', x1 - 4, py(3.6) + 12);

    caption(ctx, W, H,
      'large positive values pass through almost unchanged, negatives are damped towards zero',
      'the curve is smooth and never perfectly flat, so a negative unit still passes a gradient and can recover during training');
  };

  BLOCKS.reshape = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), ink = cssVar('--ink', '#2B1F24');
    var cM = cssVar('--d-mlp', '#3F6B4A'), accent = cssVar('--accent', '#8C2F4A');
    var rows = 4, colsN = 8, n = rows * colsN;
    var pad = 30, avail = W - pad * 2;
    var gw = Math.min(34, avail / colsN), gh = 17;
    var gx = pad + (avail - gw * colsN) / 2;
    var gy = 40;
    var sw = avail / n, sh = 17;
    var sy = H - CAP - 42;

    /* one full cycle: grid to vector, then vector back to grid */
    var half = t < 0.5;
    var raw = half ? t * 2 : (t - 0.5) * 2;
    var e = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;   /* ease in out */
    var p = half ? e : 1 - e;

    for (var i = 0; i < n; i++) {
      var r = Math.floor(i / colsN), c = i % colsN;
      var ax = gx + c * gw, ay = gy + r * (gh + 2);
      var bx = pad + i * sw, by = sy;
      var x = ax + (bx - ax) * p;
      var y = ay + (by - ay) * p;
      var w = gw - 2 + ((sw - 1) - (gw - 2)) * p;
      var lag = Math.max(0, Math.min(1, (p - (i / n) * 0.25) / 0.75));
      cell(ctx, x, y, Math.max(1.5, w), gh, cM, 0.22 + 0.4 * (r / rows) + 0.1 * lag);
    }

    /* Two short lines rather than one long one, so the shapes stay readable
       at phone width, and the strip labels sit below the strip clear of the
       arrow. */
    ctx.fillStyle = muted;
    ctx.textAlign = 'center';
    var avail = W - 16;
    ctx.globalAlpha = 1 - p;
    fitMono(ctx, 'feature tensor, 4 channels x 8 positions', avail);
    ctx.fillText('feature tensor, 4 channels x 8 positions', W / 2, gy - 22);
    fitMono(ctx, 'the model uses 256 x 109', avail);
    ctx.fillText('the model uses 256 x 109', W / 2, gy - 12);
    ctx.globalAlpha = p;
    fitMono(ctx, 'one long vector, 32 values', avail);
    ctx.fillText('one long vector, 32 values', W / 2, sy + gh + 12);
    fitMono(ctx, 'the model uses 27,904', avail);
    ctx.fillText('the model uses 27,904', W / 2, sy + gh + 22);
    ctx.globalAlpha = 1;

    ctx.fillStyle = accent;
    ctx.font = '600 10px ' + cssVar('--font', 'sans-serif');
    ctx.textAlign = 'center';
    var gb = gy + (rows - 1) * (gh + 2) + gh;
    var ly = Math.max((gy + sy) / 2 + 4, gb + 22);
    ctx.textAlign = 'left';
    ctx.fillText(half ? 'flatten' : 'reshape', W / 2 + 10, ly + 4);
    ctx.textAlign = 'center';
    arrow(ctx, W / 2, half ? ly - 22 : ly + 22, W / 2, half ? ly + 14 : ly - 14, accent, 0.7);

    caption(ctx, W, H,
      half ? 'flattening lays the channels end to end so a fully connected layer can read them'
           : 'reshaping folds the vector back into channels and positions for the convolutions',
      'no value changes, only the arrangement, and the order is fixed so the operation is exactly reversible');
  };

  BLOCKS.rf = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), ink = cssVar('--ink', '#2B1F24');
    var accent = cssVar('--accent', '#8C2F4A');
    var cS = cssVar('--d-strided', '#61223B'), cD = cssVar('--d-dilated', '#8C6B2F');
    var layers = [
      { name: 'strided 1', rf: 7, type: 's' }, { name: 'strided 2', rf: 19, type: 's' },
      { name: 'strided 3', rf: 43, type: 's' }, { name: 'dilated d=1', rf: 91, type: 'd' },
      { name: 'dilated d=2', rf: 187, type: 'd' }, { name: 'dilated d=4', rf: 379, type: 'd' },
      { name: 'dilated d=8', rf: 763, type: 'd' }
    ];
    var TOTAL = 6935;
    var pad = 74, span = W - pad - 24;   /* gutter fits 'dilated d=8' */
    var top = 30, rowH = (H - CAP - top - 26) / (layers.length + 1);
    var step = Math.min(layers.length - 1, Math.floor(t * layers.length));
    /* the loop holds just short of t = 1, so scale the fraction to still
       resolve on the true final value rather than a hair under it */
    var frac = Math.min(1, (t * layers.length - step) / 0.98);
    var DEEPEST = layers[layers.length - 1].rf;

    title(ctx, 'span of the input record feeding one output position', pad - 34, 18, W);

    for (var i = 0; i < layers.length; i++) {
      var y = top + rowH * i;
      var shown = i < step ? 1 : (i === step ? frac : 0);
      /* the full record as a faint track */
      ctx.fillStyle = muted;
      ctx.globalAlpha = 0.10;
      ctx.fillRect(pad, y + rowH * 0.25, span, rowH * 0.42);
      ctx.globalAlpha = 1;
      if (shown > 0) {
        /* scaled to the deepest layer, so each bar is visibly twice the last */
        var wpx = span * (layers[i].rf / DEEPEST) * shown;
        ctx.fillStyle = layers[i].type === 's' ? cS : cD;
        ctx.globalAlpha = i === step ? 0.85 : 0.5;
        ctx.fillRect(pad, y + rowH * 0.25, Math.max(1.5, wpx), rowH * 0.42);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = i <= step ? ink : muted;
      ctx.font = '8.5px ' + cssVar('--mono', 'monospace');
      ctx.textAlign = 'right';
      ctx.fillText(layers[i].name, pad - 6, y + rowH * 0.62);
      if (shown > 0.08) {
        ctx.textAlign = 'left';
        ctx.fillStyle = i === step ? accent : muted;
        ctx.font = (i === step ? '600 ' : '') + '8.5px ' + cssVar('--mono', 'monospace');
        ctx.fillText(Math.round(layers[i].rf * shown) + ' days',
                     pad + Math.max(1.5, span * (layers[i].rf / DEEPEST) * shown) + 6,
                     y + rowH * 0.62);
      }
    }

    /* a separate strip keeps the comparison against the whole record, which
       the bar scale above can no longer carry */
    var ry2 = top + rowH * layers.length + 6;
    ctx.fillStyle = muted;
    ctx.globalAlpha = 0.14;
    ctx.fillRect(pad, ry2, span, rowH * 0.40);
    ctx.globalAlpha = 1;
    var tick = span * (DEEPEST / TOTAL);
    ctx.fillStyle = accent;
    ctx.fillRect(pad, ry2, Math.max(2, tick), rowH * 0.40);
    ctx.fillStyle = muted;
    ctx.font = '8.5px ' + cssVar('--mono', 'monospace');
    ctx.textAlign = 'right';
    ctx.fillText('full record', pad - 6, ry2 + rowH * 0.32);
    ctx.textAlign = 'left';
    ctx.fillText('763 of 6,935 days', pad + Math.max(2, tick) + 6, ry2 + rowH * 0.32);

    caption(ctx, W, H,
      'each layer roughly doubles the reach, ending at 763 days, about two annual cycles',
      'the bars above are drawn against the deepest layer, and the strip below places 763 days inside the full record');
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
    var dwell = 0;
    var DWELL = 1.1;      /* seconds to hold the finished frame before looping */

    function tick(now) {
      if (!playing) return;
      if (!last) last = now;
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (t >= 0.9999) {
        /* Hold just short of 1 rather than at 1, because several blocks drive
           themselves with Math.floor(t * n) and would wrap to their first
           frame exactly at t = 1, discarding the assembled diagram. */
        dwell += dt;
        t = 0.9999;
        if (dwell >= DWELL) { dwell = 0; t = 0; }
      } else {
        t = Math.min(0.9999, t + dt / period);
      }
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
