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
  /* derivative of the tanh-approximate GELU above, used by the backprop
     block; checked against a numerical gradient before use, see
     verify_backprop.py in the thesis analysis scripts */
  function geluGrad(x) {
    var c = Math.sqrt(2 / Math.PI);
    var inner = c * (x + 0.044715 * x * x * x);
    var th = Math.tanh(inner);
    var dinner = c * (1 + 3 * 0.044715 * x * x);
    return 0.5 * (1 + th) + 0.5 * x * (1 - th * th) * dinner;
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

  /* ---------- shared toy network for the forward/backward pair -----------
     Fixed so the two animations describe the same network, and the numbers
     were checked against a numerical (finite-difference) gradient before
     being used here; see verify_backprop.py in the thesis analysis scripts. */
  var FF_X = [0.80, -0.35, 0.55];
  var FF_W1 = [
    [0.60, -0.40, 0.20],
    [-0.30, 0.80, -0.10],
    [0.20, 0.30, -0.70],
    [-0.50, 0.10, 0.40]
  ];
  var FF_B1 = [0.05, -0.10, 0.20, 0.00];
  var FF_W2 = [0.70, -0.50, 0.30, 0.20];
  var FF_B2 = 0.10;
  var FF_TARGET = 1.20;

  function ffForward() {
    var z1 = FF_W1.map(function (row, j) {
      return row.reduce(function (s, w, i) { return s + w * FF_X[i]; }, FF_B1[j]);
    });
    var hid = z1.map(gelu);
    var out = FF_W2.reduce(function (s, w, j) { return s + w * hid[j]; }, FF_B2);
    return { z1: z1, hid: hid, out: out };
  }

  function ffBackward(fwd) {
    var dOut = fwd.out - FF_TARGET;                     /* d(0.5(out-y)^2)/d(out) */
    var dH = FF_W2.map(function (w) { return dOut * w; });
    var dZ1 = dH.map(function (v, j) { return v * geluGrad(fwd.z1[j]); });
    var dW1 = dZ1.map(function (dz) { return FF_X.map(function (x) { return dz * x; }); });
    var dW2 = fwd.hid.map(function (h) { return dOut * h; });
    return { dOut: dOut, dH: dH, dZ1: dZ1, dW1: dW1, dB1: dZ1, dW2: dW2, dB2: dOut };
  }

  /* shared node layout, so the forward and backward canvases place every
     input, hidden and output circle at the identical pixel position */
  function ffLayout(W, H) {
    var yTop = 34, yBot = H - CAP - 10;
    var colX = [W * 0.16, W * 0.5, W * 0.84];
    var R = Math.min(18, (yBot - yTop) / 9, W * 0.05);
    function pts(count, x) {
      var out = [];
      for (var j = 0; j < count; j++) {
        out.push({ x: x, y: yTop + ((yBot - yTop) * (j + 0.5)) / count });
      }
      return out;
    }
    return { yTop: yTop, yBot: yBot, colX: colX, R: R,
            pIn: pts(3, colX[0]), pHid: pts(4, colX[1]), pOut: pts(1, colX[2]) };
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

    title(ctx, 'input, 2 channels x 12 positions', pad, yIn - 8, W);
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
      ctx.fillText(c === 0 ? 'c1' : 'c2', pad - cw - 5, yIn + c * (ch + 2) + 12);
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
    var accent=cssVar('--accent','#8C2F4A'), colour=cssVar('--d-strided','#61223B');
    var n=17,k=7,s=2,nOut=Math.floor((n-k)/s)+1;
    var pad=40,cw=(W-2*pad)/n,yIn=45,yOut=H-CAP-58,ch=22;
    var step=Math.min(nOut-1,Math.floor(t*nOut)),start=step*s;
    title(ctx,'input: 17 positions, no padding; kernel 7, stride 2',pad,24,W);
    for(var i=0;i<n;i++)cell(ctx,pad+i*cw,yIn,cw-2,ch,colour,i>=start&&i<start+k?.8:.15,String(i+1),i>=start&&i<start+k?'#fff':cssVar('--ink','#222'));
    ctx.strokeStyle=accent;ctx.lineWidth=1.5;ctx.strokeRect(pad+start*cw-1,yIn-2,k*cw,ch+4);
    for(i=0;i<nOut;i++)cell(ctx,pad+i*cw,yOut,cw-2,ch,colour,i<=step?.7:.12,i<=step?String(i+1):'');
    arrow(ctx,pad+(start+k/2)*cw,yIn+ch+5,pad+(step+.5)*cw,yOut-6,accent,.7);
    title(ctx,'output: 6 positions',pad,yOut+ch+18,W);
    caption(ctx,W,H,'stride 2: each new window starts two input positions further right','17 inputs, kernel 7, no padding: floor((17 − 7) / 2) + 1 = 6 outputs');
  };

  /* 3. dilated convolution, cycling the rate */
  BLOCKS.dilated = function (ctx, W, H, t) {
    var accent=cssVar('--accent','#8C2F4A'),colour=cssVar('--d-dilated','#8C6B2F');
    var phase=Math.min(3.9999,t*4),d=[1,2,4,8][Math.floor(phase)],local=phase-Math.floor(phase);
    var k=7,n=65,span=(k-1)*d+1,nOut=n-span+1;
    var pos=Math.min(nOut-1,Math.floor(local*nOut));
    var pad=24,cw=(W-2*pad)/n,yIn=54,yOut=H-CAP-65,ch=19;
    title(ctx,'input: 65 positions · dilation '+d+' · seven weights · span '+span,pad,25,W);
    for(var i=0;i<n;i++){var tap=i>=pos&&i<=pos+span-1&&(i-pos)%d===0;cell(ctx,pad+i*cw,yIn,cw-1,ch,colour,tap?.9:.16);}
    ctx.strokeStyle=accent;ctx.lineWidth=1.4;ctx.strokeRect(pad+pos*cw-1,yIn-4,span*cw,ch+8);
    for(i=0;i<nOut;i++)cell(ctx,pad+i*cw,yOut,cw-1,ch,colour,i<=pos?.65:.12);
    for(var j=0;j<k;j++)arrow(ctx,pad+(pos+j*d+.5)*cw,yIn+ch+7,pad+(pos+.5)*cw,yOut-6,accent,.35);
    title(ctx,'output: '+nOut+' positions without padding',pad,yOut+ch+19,W);
    caption(ctx,W,H,'left-to-right pass with dilation '+d+'; the next pass uses a different rate','seven kernel weights at every rate · stride 1 · no padding in this illustration');
  };

  BLOCKS.dilatedSame = function (ctx, W, H, t) {
    var colour=cssVar('--d-dilated','#8C6B2F'),accent=cssVar('--accent','#8C2F4A');
    var muted=cssVar('--muted','#6B5D63'),ink=cssVar('--ink','#2B1F24');
    var n=12,p=6,k=7,d=2,margin=24,cw=(W-2*margin)/(n+2*p),ch=22;
    var pos=Math.min(n-1,Math.floor(t*n)),yIn=48,yOut=H-82;
    title(ctx,'6 padding zeros  |  12 input positions  |  6 padding zeros',margin,24,W);
    for(var i=-p;i<n+p;i++){
      var padding=i<0||i>=n,tap=i>=pos-p&&i<=pos+p&&(i-(pos-p))%d===0;
      var x=margin+(i+p)*cw;
      cell(ctx,x,yIn,cw-2,ch,padding?muted:colour,padding?.10:(tap?.8:.25),padding?'0':String(i+1),padding?muted:(tap?'#fff':ink));
      if(tap){ctx.strokeStyle=accent;ctx.lineWidth=1.5;ctx.strokeRect(x,yIn,cw-2,ch);}
    }
    for(i=0;i<n;i++)cell(ctx,margin+(i+p)*cw,yOut,cw-2,ch,colour,i<=pos?.75:.13,i<=pos?String(i+1):'',i<=pos?'#fff':ink);
    for(var j=0;j<k;j++)arrow(ctx,margin+(pos+j*d+.5)*cw,yIn+ch+4,margin+(pos+p+.5)*cw,yOut-5,accent,.4);
    title(ctx,'12 output positions: stride 1 preserves the resolution with same padding',margin,yOut+ch+18,W);
    caption(ctx,W,H,'kernel 7 · dilation 2 · stride 1 · padding 6 on each side','Numbers label positions; output cells do not show computed convolution values.');
  };

  /* 4. adaptive average pooling */
  var POOLV = [0.42, 0.61, 0.35, 0.28, 0.77, 0.64, 0.52, 0.81,
               0.19, 0.33, 0.47, 0.25, 0.68, 0.72, 0.55, 0.60];

  BLOCKS.pool = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), accent = cssVar('--accent', '#8C2F4A');
    var colour = cssVar('--d-pool', '#4A6670'), ink = cssVar('--ink', '#2B1F24');
    var nIn = 16, nOut = 4, perBin = nIn / nOut;
    var pad = 42, cw = (W - pad * 2) / nIn, ow = (W - pad * 2) / nOut;
    var chh = 24;
    var yIn = 40;
    var yOut = H - CAP - chh - 30;
    var bin = Math.floor(t * nOut) % nOut;

    title(ctx, 'one channel of 4, over 16 positions', pad, yIn - 10, W);
    for (var i = 0; i < nIn; i++) {
      var inBin = Math.floor(i / perBin) === bin;
      cell(ctx, pad + i * cw, yIn, cw - 2, chh, colour, inBin ? 0.72 : 0.15,
           POOLV[i].toFixed(2), inBin ? '#fff' : muted);
    }

    /* brackets showing which inputs feed which output position */
    var by = yIn + chh + 7;
    for (var b = 0; b < nOut; b++) {
      var x0 = pad + b * perBin * cw, x1 = pad + (b + 1) * perBin * cw - 2;
      ctx.strokeStyle = b === bin ? accent : muted;
      ctx.globalAlpha = b === bin ? 0.9 : 0.35;
      ctx.lineWidth = b === bin ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(x0, by); ctx.lineTo(x1, by);
      ctx.moveTo(x0, by - 3); ctx.lineTo(x0, by + 3);
      ctx.moveTo(x1, by - 3); ctx.lineTo(x1, by + 3);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    title(ctx, 'the same channel pooled to 4 positions',
          pad, yOut + chh + 18, W);
    for (i = 0; i < nOut; i++) {
      var mean = 0;
      for (var q = 0; q < perBin; q++) mean += POOLV[i * perBin + q];
      mean /= perBin;
      cell(ctx, pad + i * ow, yOut, ow - 3, chh, colour,
           i < bin ? 0.55 : (i === bin ? 0.78 : 0.12),
           i <= bin ? mean.toFixed(2) : '', i === bin ? '#fff' : ink);
    }

    /* the four values being averaged, converging on the cell they produce */
    for (q = 0; q < perBin; q++) {
      arrow(ctx, pad + (bin * perBin + q + 0.5) * cw, by + 5,
            pad + bin * ow + ow / 2, yOut - 5, accent, 0.30);
    }

    var terms = [];
    for (q = 0; q < perBin; q++) terms.push(POOLV[bin * perBin + q].toFixed(2));
    var m = 0;
    for (q = 0; q < perBin; q++) m += POOLV[bin * perBin + q];
    caption(ctx, W, H,
            '(' + terms.join(' + ') + ') / 4 = ' + (m / perBin).toFixed(2),
            'all four channels are pooled the same way and independently, so the channel count never changes');
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
              'a fully connected bridge learns combinations of the flattened values');
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
          ' positions   (linear interpolation within each channel)', pad, 20, W);
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
    var yIn = 34, yOut = H - CAP - 55, chh = 20;
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
    title(ctx, 'output, ' + nOut + ' positions, overlapping contributions are added', pad, yOut + chh + 18, W);
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
      var ax=pad+cur*iw+iw/2, ay=yIn+chh+3;
      var bx=pad+(cur*s+j)*ow+ow/2, by=yOut-4;
      arrow(ctx,ax,ay,bx,by,accent,.5);
      // Stagger multiplication labels along the arrows, away from their shared origin.
      var f=.40+j*.13,lx=ax+(bx-ax)*f,ly=ay+(by-ay)*f;
      var label=inVals[cur].toFixed(1)+' × '+kern[j].toFixed(1)+' = '+(inVals[cur]*kern[j]).toFixed(2);
      ctx.font='9px '+cssVar('--mono','monospace');ctx.textAlign='center';
      var tw=ctx.measureText(label).width;
      ctx.fillStyle=cssVar('--paper','#fff');ctx.fillRect(lx-tw/2-4,ly-10,tw+8,15);
      ctx.fillStyle=accent;ctx.fillText(label,lx,ly);
    }

    caption(ctx, W, H,
            'each input scatters across the kernel, and the overlaps are added, so the sequence lengthens',
            'the weights are learned rather than copied from the encoder, and information lost by downsampling is not recovered');
  };

  /* 9. pointwise 1 x 1 convolution */
  BLOCKS.pointwise = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63'), ink = cssVar('--ink', '#2B1F24');
    var accent = cssVar('--accent', '#8C2F4A'), colour = cssVar('--d-mlp', '#3F6B4A');
    var inputColour = cssVar('--d-dilated', '#8C6B2F');
    var inputChannels = 4, outputChannels = 3, positions = 10;
    var inputs = [
      [0.2, 0.4, 0.7, 0.8, 0.5, 0.1, -0.2, 0.0, 0.3, 0.6],
      [0.8, 0.6, 0.3, 0.1, 0.0, 0.2, 0.5, 0.7, 0.6, 0.4],
      [-0.3, 0.0, 0.2, 0.5, 0.7, 0.6, 0.2, -0.1, -0.2, 0.1],
      [0.1, 0.3, 0.2, -0.1, -0.3, 0.0, 0.4, 0.8, 0.7, 0.3]
    ];
    var weights = [
      [0.5, -0.2, 0.4, 0.3],
      [-0.1, 0.6, 0.2, -0.4],
      [0.3, 0.2, -0.5, 0.6]
    ];
    var bias = [0.05, -0.03, 0.08];
    var active = Math.min(positions - 1, Math.floor(t * positions));
    var labelW = W < 560 ? 34 : 52;
    var pad = labelW + 10;
    var cellW = Math.min(42, (W - pad - 18) / positions);
    var gridW = cellW * positions;
    var cellH = 15;
    var inputTop = 30;
    var outputTop = H - CAP - outputChannels * (cellH + 3) - 22;

    function outputAt(q, position) {
      var value = bias[q];
      for (var c = 0; c < inputChannels; c++) value += weights[q][c] * inputs[c][position];
      return value;
    }

    title(ctx, 'input feature maps, 4 channels x 10 positions', pad, 18, W);
    for (var c = 0; c < inputChannels; c++) {
      for (var i = 0; i < positions; i++) {
        cell(ctx, pad + i * cellW, inputTop + c * (cellH + 3), cellW - 2, cellH,
             inputColour, i === active ? 0.72 : 0.13, inputs[c][i].toFixed(1),
             i === active ? '#fff' : muted);
      }
      ctx.fillStyle = muted;
      ctx.font = '8px ' + cssVar('--mono', 'monospace');
      ctx.textAlign = 'right';
      ctx.fillText('c' + (c + 1), pad - 6, inputTop + c * (cellH + 3) + 11);
    }

    var highlightX = pad + active * cellW - 1;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(highlightX, inputTop - 2, cellW, inputChannels * (cellH + 3));

    var matrixTop = inputTop + inputChannels * (cellH + 3) + 35;
    var matrixW = Math.min(190, gridW * 0.48);
    var matrixX = pad + (gridW - matrixW) / 2;
    ctx.fillStyle = ink;
    ctx.font = '600 9px ' + cssVar('--font', 'sans-serif');
    ctx.textAlign = 'center';
    ctx.fillText('one learned 3 x 4 channel-mixing matrix', matrixX + matrixW / 2, matrixTop - 5);
    for (var q = 0; q < outputChannels; q++) {
      for (c = 0; c < inputChannels; c++) {
        cell(ctx, matrixX + c * matrixW / inputChannels,
             matrixTop + q * 17, matrixW / inputChannels - 2, 14,
             colour, 0.18 + Math.abs(weights[q][c]) * 0.75,
             weights[q][c].toFixed(1), ink);
      }
    }

    title(ctx, 'output feature maps, 3 channels x 10 positions', pad, outputTop + outputChannels * (cellH + 3) + 14, W);
    for (q = 0; q < outputChannels; q++) {
      for (i = 0; i < positions; i++) {
        var calculated = outputAt(q, i);
        var revealed = i <= active;
        cell(ctx, pad + i * cellW, outputTop + q * (cellH + 3), cellW - 2, cellH,
             colour, revealed ? 0.25 + Math.min(0.5, Math.abs(calculated) * 0.5) : 0.08,
             revealed ? calculated.toFixed(2) : '', ink);
      }
      ctx.fillStyle = muted;
      ctx.font = '8px ' + cssVar('--mono', 'monospace');
      ctx.textAlign = 'right';
      ctx.fillText('q' + (q + 1), pad - 6, outputTop + q * (cellH + 3) + 11);
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(highlightX, outputTop - 2, cellW, outputChannels * (cellH + 3));

    arrow(ctx, pad + active * cellW + cellW / 2,
          inputTop + inputChannels * (cellH + 3) + 2,
          matrixX + matrixW / 2, matrixTop - 20, accent, 0.75);
    arrow(ctx, matrixX + matrixW / 2, matrixTop + outputChannels * 17 + 2,
          pad + active * cellW + cellW / 2, outputTop - 5, accent, 0.75);

    caption(ctx, W, H,
      'position ' + (active + 1) + ': all input channels are mixed, while adjacent positions are untouched',
      'a 1 x 1 convolution changes the channel count without changing temporal length or receptive field');
  };

  /* 10. parallel-branch fusion, with the 1x1 convolution inset */
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
    var ink = cssVar('--ink', '#2B1F24'), muted = cssVar('--muted', '#6B5D63');
    var accent = cssVar('--accent', '#8C2F4A');
    var observations = [{name:'A', mu:-0.65, sd:0.25}, {name:'B', mu:0.55, sd:0.45}, {name:'C', mu:0.05, sd:0.18}];
    var phase = Math.min(2.9999, t * 3), index = Math.floor(phase), local = phase - index;
    var obs = observations[index];
    // One hand-selected illustrative noise value per observation.
    var noises = [0.35, -1.45, 1.20];
    var sampled = local >= 0.24;
    var eps = noises[index];
    var z = obs.mu + obs.sd * eps;
    function text(s,x,y,size,bold) {
      ctx.fillStyle=ink; ctx.font=(bold?'600 ':'')+size+'px '+cssVar('--font','sans-serif');
      ctx.textAlign='center'; ctx.fillText(s,x,y);
    }
    function box(x,y,w,title,value) {
      ctx.fillStyle=cssVar('--border','#E0D6C9'); roundRect(ctx,x,y,w,48,5); ctx.fill();
      text(title,x+w/2,y+18,W<450?11:14,false);
      text(value,x+w/2,y+38,W<450?13:16,true);
    }
    var gap=8, bw=(W-32-gap*2)/3;
    box(16,14,bw,'Observation '+obs.name,'input x');
    box(16+bw+gap,14,bw,'Encoder','x → μ, σ');
    box(16+2*(bw+gap),14,bw,'μ = '+obs.mu.toFixed(2),'σ = '+obs.sd.toFixed(2));
    text(sampled?'Sample: ε = '+eps.toFixed(2)+'   →   z = '+z.toFixed(2):'New observation: the encoder predicts μ and σ',W/2,90,W<450?12:16,true);
    var left=30,right=W-30,y=H*0.56;
    function px(v){return left+(v+2)/4*(right-left)}
    ctx.strokeStyle=muted; ctx.lineWidth=1; ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();
    for(var v=-2;v<=2;v++){ctx.beginPath();ctx.moveTo(px(v),y-4);ctx.lineTo(px(v),y+4);ctx.stroke();text(String(v),px(v),y+32,12,false)}
    ctx.fillStyle=accent;ctx.globalAlpha=.16;ctx.fillRect(px(obs.mu-obs.sd),y-13,px(obs.mu+obs.sd)-px(obs.mu-obs.sd),26);ctx.globalAlpha=1;
    ctx.fillStyle=muted;ctx.beginPath();ctx.arc(px(obs.mu),y,4,0,Math.PI*2);ctx.fill();
    if(sampled){ctx.fillStyle=accent;ctx.beginPath();ctx.arc(px(z),y,6,0,Math.PI*2);ctx.fill();text(z.toFixed(2),px(z),y-23,16,true)}
    text('One latent dimension · shaded band: μ ± σ',W/2,H-43,W<450?12:14,false);
    text('Illustrative values · parameters stay fixed for each observation',W/2,H-20,W<450?10:12,false);
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
    fitMono(ctx, 'example shape: 256 x 109', avail);
    ctx.fillText('example shape: 256 x 109', W / 2, gy - 12);
    ctx.globalAlpha = p;
    fitMono(ctx, 'one long vector, 32 values', avail);
    ctx.fillText('one long vector, 32 values', W / 2, sy + gh + 12);
    fitMono(ctx, 'example flattened length: 27,904', avail);
    ctx.fillText('example flattened length: 27,904', W / 2, sy + gh + 22);
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
    var ink = cssVar('--ink', '#2B1F24'), muted = cssVar('--muted', '#6B5D63');
    var configs = [
      {name:'Standard', detail:'stride 1, dilation 1', colour:'#61223B', strides:[1,1,1,1], dilations:[1,1,1,1]},
      {name:'Strided', detail:'stride 2, dilation 1', colour:'#4477AA', strides:[2,2,2,2], dilations:[1,1,1,1]},
      {name:'Dilated', detail:'stride 1, dilation 1,2,4,8', colour:'#39846A', strides:[1,1,1,1], dilations:[1,2,4,8]}
    ];
    var depth = Math.min(4, Math.floor(t * 5) + 1), col = (W-24)/3;
    title(ctx, 'One output position: input span grows with depth (filter width 3)', 12, 18, W);
    configs.forEach(function(config,index){
      var left=12+index*col, width=col-18, r=1, jump=1;
      ctx.fillStyle=config.colour; ctx.font='600 11px '+cssVar('--font','sans-serif');ctx.textAlign='left';ctx.fillText(config.name,left,42);
      fitMono(ctx,config.detail,width);ctx.fillText(config.detail,left,58);
      for(var layer=0;layer<4;layer++){
        r += 2*config.dilations[layer]*jump; jump *= config.strides[layer];
        var y=82+layer*(H-CAP-108)/4;
        ctx.fillStyle=muted;ctx.globalAlpha=.12;ctx.fillRect(left,y+14,width,12);ctx.globalAlpha=1;
        ctx.font='10px '+cssVar('--font','sans-serif');ctx.fillStyle=ink;ctx.fillText('Layer '+(layer+1),left,y+7);
        if(layer<depth){ctx.fillStyle=config.colour;ctx.fillRect(left,y+14,width*r/31,12);ctx.textAlign='right';ctx.fillText(r+' positions',left+width,y+7);ctx.textAlign='left';}
      }
    });
    caption(ctx,W,H,'All bars use the same scale: 31 input positions.',
      'Stride increases spacing for later layers; dilation spaces the positions read within a layer.');
  };

  /* 15. forward pass: a general feedforward network computing one
     prediction. Three inputs, one hidden layer of four GELU units, one
     linear output. Each unit is revealed in turn with the arithmetic it
     performs, matching the layer equation given earlier on the page. */
  BLOCKS.ffwd = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63');
    var accent = cssVar('--accent', '#8C2F4A'), cM = cssVar('--d-mlp', '#3F6B4A');
    var cL = cssVar('--d-latent', '#C2761F'), border = cssVar('--border', '#E0D6C9');
    var fwd = ffForward();
    var L = ffLayout(W, H);

    var STAGES = 6;      /* 4 hidden units, 1 output, 1 hold */
    var stage = Math.min(STAGES - 1, Math.floor(t * STAGES));
    var hold = stage === 5;
    var frac = hold ? 1 : Math.min(1, t * STAGES - stage);
    var inHidden = !hold && stage < 4;
    var atOutput = !hold && stage === 4;
    var targetH = inHidden ? stage : -1;

    function drawEdges(a, b, Wm, activeJ, reveal, done) {
      for (var j = 0; j < b.length; j++) {
        for (var i = 0; i < a.length; i++) {
          var w = Wm[j][i];
          var live = (j === activeJ && i < reveal) || done[j];
          ctx.strokeStyle = w >= 0 ? cM : accent;
          ctx.globalAlpha = live ? 0.30 + Math.min(0.55, Math.abs(w)) : 0.07;
          ctx.lineWidth = live ? 0.8 + Math.abs(w) * 2.2 : 0.6;
          ctx.beginPath();
          ctx.moveTo(a[i].x + L.R, a[i].y);
          ctx.lineTo(b[j].x - L.R, b[j].y);
          ctx.stroke();
          if (j === activeJ && i === reveal - 1) {
            var mx = (a[i].x + L.R + b[j].x - L.R) / 2, my = (a[i].y + b[j].y) / 2;
            ctx.fillStyle = w >= 0 ? cM : accent;
            ctx.font = '600 8.5px ' + cssVar('--mono', 'monospace');
            ctx.textAlign = 'center';
            ctx.fillText(w.toFixed(2), mx, my - 3);
          }
        }
      }
      ctx.globalAlpha = 1;
    }
    var hidDone = [0, 1, 2, 3].map(function (j) { return hold || stage > j; });
    var outDone = hold || stage > 4;
    var revealH = Math.min(3, Math.floor(frac * 3 / 0.7));
    var revealO = Math.min(4, Math.floor(frac * 4 / 0.7));
    drawEdges(L.pIn, L.pHid, FF_W1, targetH, inHidden ? revealH : 3, hidDone);
    drawEdges(L.pHid, L.pOut, [FF_W2], atOutput ? 0 : -1, atOutput ? revealO : (outDone ? 4 : 0), [outDone]);

    function nodes(p, vals, colour, lit, label) {
      for (var j = 0; j < p.length; j++) {
        ctx.beginPath();
        ctx.arc(p[j].x, p[j].y, L.R, 0, Math.PI * 2);
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
      ctx.fillText(label, p[0].x, L.yTop - 16);
    }
    nodes(L.pIn, FF_X, cM, [true, true, true], 'inputs');
    nodes(L.pHid, fwd.hid, cM,
          hidDone.map(function (d, j) { return d || (inHidden && targetH === j && frac > 0.92); }),
          'hidden units, GELU');
    nodes(L.pOut, [fwd.out], cL, [outDone || (atOutput && frac > 0.92)], 'output');

    if (hold) {
      caption(ctx, W, H,
              'output = ' + fwd.out.toFixed(2) + ', compared against a target of ' + FF_TARGET.toFixed(2) + ' during training',
              'the difference between the two drives every gradient in the animation below');
    } else if (inHidden) {
      var kk = revealH, terms = [];
      for (var i = 0; i < kk; i++) terms.push(FF_W1[targetH][i].toFixed(2) + '(' + FF_X[i].toFixed(2) + ')');
      var line = 'h' + (targetH + 1) + ' = GELU(' + (terms.length ? terms.join(' + ') + ' + ' : '') + FF_B1[targetH].toFixed(2) + ')';
      if (kk === 3) line += ' = GELU(' + fwd.z1[targetH].toFixed(2) + ') = ' + fwd.hid[targetH].toFixed(2);
      caption(ctx, W, H, line, 'each hidden unit sums its weighted inputs, adds a bias, then applies GELU');
    } else {
      var mm = revealO, terms2 = [];
      for (var i2 = 0; i2 < mm; i2++) terms2.push(FF_W2[i2].toFixed(2) + '(' + fwd.hid[i2].toFixed(2) + ')');
      var line2 = 'output = ' + (terms2.length ? terms2.join(' + ') + ' + ' : '') + FF_B2.toFixed(2);
      if (mm === 4) line2 += ' = ' + fwd.out.toFixed(2);
      caption(ctx, W, H, line2, 'the output layer is linear here, so the final sum is not passed through an activation');
    }
  };

  /* 16. backward pass: the same network, propagating the loss gradient
     from the output back to every weight. The chain rule is applied
     explicitly at each stage rather than only stated, and the numbers
     were checked against a numerical gradient before being fixed here. */
  BLOCKS.backprop = function (ctx, W, H, t) {
    var muted = cssVar('--muted', '#6B5D63');
    var bad = cssVar('--bad', '#93312C'), border = cssVar('--border', '#E0D6C9');
    var dim = cssVar('--d-pool', '#4A6670');
    var fwd = ffForward();
    var bwd = ffBackward(fwd);
    var L = ffLayout(W, H);

    var STAGES = 6;      /* the output gradient, 4 hidden units, 1 hold */
    var stage = Math.min(STAGES - 1, Math.floor(t * STAGES));
    var hold = stage === 5;
    var frac = hold ? 1 : Math.min(1, t * STAGES - stage);
    var atOutput = !hold && stage === 0;
    var inHidden = !hold && stage >= 1 && stage <= 4;
    var targetH = inHidden ? stage - 1 : -1;

    /* gradient edges are drawn with the arrowhead end unused deliberately;
       the highlighted stroke runs from the downstream (right) node back to
       the upstream (left) node, so the direction of travel visually
       reverses the forward pass without needing a separate arrow glyph */
    function gradEdge(a, b, grad, live, showLabel) {
      var mag = Math.min(1, Math.abs(grad) * 1.4);
      ctx.strokeStyle = bad;
      ctx.globalAlpha = live ? 0.25 + 0.6 * mag : 0.07;
      ctx.lineWidth = live ? 0.8 + mag * 2.4 : 0.6;
      ctx.beginPath();
      ctx.moveTo(b.x - L.R, b.y);
      ctx.lineTo(a.x + L.R, a.y);
      ctx.stroke();
      if (live && showLabel) {
        var mx = (a.x + L.R + b.x - L.R) / 2, my = (a.y + b.y) / 2;
        ctx.fillStyle = bad;
        ctx.font = '600 8.5px ' + cssVar('--mono', 'monospace');
        ctx.textAlign = 'center';
        ctx.fillText(grad.toFixed(2), mx, my - 3);
      }
      ctx.globalAlpha = 1;
    }
    var hidDone = [0, 1, 2, 3].map(function (j) { return hold || stage > j + 1; });
    var revealW1 = Math.min(3, Math.floor(frac * 3 / 0.7));
    for (var j = 0; j < 4; j++) {
      var liveNow = inHidden && targetH === j;
      for (var i = 0; i < 3; i++) {
        var showLabel = liveNow && i === revealW1 - 1;
        gradEdge(L.pIn[i], L.pHid[j], bwd.dW1[j][i], (liveNow && i < revealW1) || hidDone[j], showLabel);
      }
      gradEdge(L.pHid[j], L.pOut[0], bwd.dW2[j], hidDone[j] || liveNow || atOutput || hold, false);
    }

    function nodes(p, vals, colour, lit, fallback, label) {
      for (var k = 0; k < p.length; k++) {
        ctx.beginPath();
        ctx.arc(p[k].x, p[k].y, L.R, 0, Math.PI * 2);
        ctx.fillStyle = lit[k] ? colour : dim;
        ctx.globalAlpha = lit[k] ? 0.62 : 0.14;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = lit[k] ? colour : border;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = lit[k] ? '#fff' : muted;
        ctx.font = '600 9.5px ' + cssVar('--mono', 'monospace');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(lit[k] ? vals[k].toFixed(2) : fallback, p[k].x, p[k].y);
        ctx.textBaseline = 'alphabetic';
      }
      ctx.fillStyle = muted;
      ctx.font = '9px ' + cssVar('--font', 'sans-serif');
      ctx.textAlign = 'center';
      ctx.fillText(label, p[0].x, L.yTop - 16);
    }
    /* inputs are never assigned a gradient in this network, so they show a
       dash throughout rather than the "not yet computed" question mark
       used for hidden units still waiting for their turn */
    nodes(L.pIn, FF_X, dim, [false, false, false], '–', 'inputs');
    nodes(L.pHid, bwd.dZ1, bad,
          hidDone.map(function (d, j) { return d || (inHidden && targetH === j && frac > 0.92); }),
          '?', 'dL / d(pre-activation)');
    nodes(L.pOut, [bwd.dOut], bad, [true], '?', 'dL / d(output)');

    if (hold) {
      caption(ctx, W, H,
              'every weight gradient is now known, from dL/dW1 = ' + bwd.dW1[0][0].toFixed(2) + ' to dL/dW2 = ' + bwd.dW2[3].toFixed(2),
              'an optimiser subtracts a small multiple of each gradient from its weight to reduce the loss');
    } else if (atOutput) {
      caption(ctx, W, H,
              'dL/d(output) = output − target = ' + fwd.out.toFixed(2) + ' − ' + FF_TARGET.toFixed(2) + ' = ' + bwd.dOut.toFixed(2),
              'squared-error loss, so the gradient at the output is simply the prediction error');
    } else if (inHidden) {
      var j2 = targetH;
      var line = 'dL/dh' + (j2 + 1) + ' = dL/d(output) × w2 = ' + bwd.dOut.toFixed(2) + ' × ' + FF_W2[j2].toFixed(2) + ' = ' + bwd.dH[j2].toFixed(2);
      if (revealW1 >= 1) {
        line = 'dL/dz' + (j2 + 1) + ' = dL/dh' + (j2 + 1) + ' × GELU′(z' + (j2 + 1) + ') = ' + bwd.dZ1[j2].toFixed(2);
      }
      caption(ctx, W, H, line, 'the chain rule multiplies the gradient flowing in by the local derivative at each step');
    }
  };

  /* ---------- mounting ---------- */

  function mount(canvas, kind, period) {
    var drawFn = BLOCKS[kind];
    if (!drawFn) return null;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, t = 0, raf = null, playing = false, last = 0;
    period = period || 6;

    function resize() {
      var dpr = (kind === 'ffwd' || kind === 'backprop') ? Math.max(2, Math.min(window.devicePixelRatio || 1, 3)) : Math.min(window.devicePixelRatio || 1, 2);
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
      // Enlarge the diagram's geometry and type together on opt-in pages.
      // The canvas backing store still follows devicePixelRatio for crisp text.
      var displayScale = Number(canvas.dataset.displayScale) || 1;
      ctx.save();
      ctx.scale(displayScale, displayScale);
      drawFn(ctx, W / displayScale, H / displayScale, t);
      ctx.restore();
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
