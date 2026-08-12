/* Focused explainers for the three operators the architectures are built from.
 * Each one animates a single mechanism at a readable scale, because the
 * full-architecture diagrams run at 6,935 timesteps where individual kernel
 * positions cannot be resolved.
 */
(function () {
  'use strict';

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  function mount(canvas, mode) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1;
    var t = 0, raf = null, playing = false, lastTime = 0;

    var N_IN = 33;          /* input positions shown */
    var K = 7;

    function config() {
      if (mode === 'strided') {
        return { k: K, d: 1, stride: 2, nOut: Math.floor((N_IN - 1) / 2) + 1 };
      }
      if (mode === 'dilated') {
        return { k: K, d: 4, stride: 1, nOut: N_IN };
      }
      return { k: 8, d: 1, stride: 8, nOut: 4 };   /* pooling */
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

    function draw() {
      if (!W || !H) return;
      var cfg = config();
      var pad = 18;
      var cellW = (W - pad * 2) / N_IN;
      var cellH = Math.min(22, cellW * 1.3);
      var yIn = 34;
      var yOut = H - 46;

      var ink = cssVar('--ink', '#2B1F24');
      var muted = cssVar('--muted', '#6B5D63');
      var border = cssVar('--border', '#E0D6C9');
      var accent = cssVar('--accent', '#8C2F4A');
      var colour = mode === 'dilated' ? cssVar('--d-dilated', '#8C6B2F')
                 : mode === 'pool' ? cssVar('--d-pool', '#4A6670')
                 : cssVar('--d-strided', '#61223B');

      ctx.clearRect(0, 0, W, H);

      var step = Math.floor(t) % cfg.nOut;
      var frac = t - Math.floor(t);

      /* which input positions the current output position reads */
      var centre = mode === 'pool'
        ? step * cfg.stride + (cfg.k - 1) / 2
        : step * cfg.stride;
      var taps = [];
      for (var i = 0; i < cfg.k; i++) {
        var offset = (i - (cfg.k - 1) / 2) * cfg.d;
        taps.push(Math.round(centre + offset));
      }

      /* input row */
      ctx.font = '9px ' + cssVar('--mono', 'monospace');
      ctx.textAlign = 'left';
      ctx.fillStyle = muted;
      ctx.fillText(mode === 'pool' ? 'input, 867 positions (33 shown)' : 'input sequence', pad, yIn - 12);

      for (i = 0; i < N_IN; i++) {
        var x = pad + i * cellW;
        var isTap = taps.indexOf(i) !== -1;
        var inSpan = i >= Math.min.apply(null, taps) && i <= Math.max.apply(null, taps);
        ctx.fillStyle = colour;
        ctx.globalAlpha = isTap ? 0.85 : (inSpan && mode === 'dilated' ? 0.10 : 0.16);
        ctx.fillRect(x + 1, yIn, cellW - 2, cellH);
        ctx.globalAlpha = 1;
        if (isTap) {
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1.4;
          ctx.strokeRect(x + 1, yIn, cellW - 2, cellH);
        }
      }

      /* the span bracket, showing what one output position sees */
      var lo = pad + Math.max(0, Math.min.apply(null, taps)) * cellW + 1;
      var hi = pad + (Math.min(N_IN - 1, Math.max.apply(null, taps)) + 1) * cellW - 1;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(lo, yIn + cellH + 7);
      ctx.lineTo(hi, yIn + cellH + 7);
      ctx.moveTo(lo, yIn + cellH + 4); ctx.lineTo(lo, yIn + cellH + 10);
      ctx.moveTo(hi, yIn + cellH + 4); ctx.lineTo(hi, yIn + cellH + 10);
      ctx.stroke();
      ctx.globalAlpha = 1;

      /* fan lines from the taps into the output cell */
      var outCellW = (W - pad * 2) / cfg.nOut;
      var ox = pad + step * outCellW;
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 0.8;
      for (i = 0; i < taps.length; i++) {
        if (taps[i] < 0 || taps[i] >= N_IN) continue;
        ctx.beginPath();
        ctx.moveTo(pad + (taps[i] + 0.5) * cellW, yIn + cellH + 12);
        ctx.lineTo(ox + outCellW / 2, yOut - 4);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      /* output row */
      ctx.fillStyle = muted;
      ctx.font = '9px ' + cssVar('--mono', 'monospace');
      var outLabel = mode === 'strided' ? 'output, one position per two inputs'
        : mode === 'dilated' ? 'output, same length as the input'
        : 'output, 109 bins';
      ctx.fillText(outLabel, pad, yOut - 12);

      for (i = 0; i < cfg.nOut; i++) {
        var x2 = pad + i * outCellW;
        var done = i < step || (i === step && frac > 0.35);
        ctx.fillStyle = colour;
        ctx.globalAlpha = done ? 0.7 : 0.12;
        ctx.fillRect(x2 + 1, yOut, outCellW - 2, cellH);
        ctx.globalAlpha = 1;
        if (i === step) {
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1.4;
          ctx.strokeRect(x2 + 1, yOut, outCellW - 2, cellH);
        }
      }

      /* caption */
      ctx.textAlign = 'left';
      ctx.fillStyle = ink;
      ctx.font = '600 10.5px ' + cssVar('--font', 'sans-serif');
      var cap = mode === 'strided'
        ? 'k = 7, stride 2: consecutive windows overlap by five positions, so every input is still read'
        : mode === 'dilated'
        ? 'k = 7, dilation 4: seven weights spread over 25 positions, the other 18 are not consulted'
        : 'adaptive pool: each bin averages about eight positions, and neighbouring bins overlap by one';
      ctx.fillText(cap, pad, H - 12);
    }

    function tick(now) {
      if (!playing) return;
      if (!lastTime) lastTime = now;
      t += Math.min(0.05, (now - lastTime) / 1000) * 1.4;
      lastTime = now;
      draw();
      raf = requestAnimationFrame(tick);
    }

    function play() { if (!playing) { playing = true; lastTime = 0; raf = requestAnimationFrame(tick); } }
    function pause() { playing = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) play(); else pause(); });
    }, { threshold: 0.3 });
    io.observe(canvas);

    window.addEventListener('resize', resize);
    document.addEventListener('themechange', draw);
    resize();

    return { play: play, pause: pause, redraw: draw };
  }

  window.OperatorAnim = { mount: mount };
})();
