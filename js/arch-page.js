/* Builds the architecture page from the generated specifications. Every card
 * is produced from the same data the thesis reports, so adding or correcting a
 * specification updates the page without touching the markup. */
(function () {
  'use strict';

  var A = window.ARCHITECTURES || [];
  var fmt = window.ArchEngine.fmt;
  var byId = {};
  A.forEach(function (a) { byId[a.id] = a; });

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function metricRow(spec) {
    var m = spec.metrics || {};
    var rows = [
      ['Channel-mean FVU', m.mean_fvu_det, 4],
      ['Silhouette', m.silhouette_det, 3],
      ['Spatial coherence r', m.spatial_r_det, 3],
      ['Effective-rank ratio', m.erank_det, 3],
      ['Condition number', m.kappa_det, 2]
    ].filter(function (r) { return typeof r[1] === 'number'; });
    if (!rows.length) return null;

    var wrap = el('div', 'chips');
    rows.forEach(function (r) {
      var c = el('span', 'chip');
      c.appendChild(document.createTextNode(r[0] + ' '));
      var b = el('b', null, Number(r[1]).toFixed(r[2]));
      c.appendChild(b);
      wrap.appendChild(c);
    });
    return wrap;
  }

  function specChips(spec) {
    var wrap = el('div', 'chips');
    function add(k, v) {
      if (v === null || v === undefined || v === '') return;
      var c = el('span', 'chip');
      c.appendChild(document.createTextNode(k + ' '));
      c.appendChild(el('b', null, String(v)));
      wrap.appendChild(c);
    }
    add('layers', (spec.layers || []).length + (spec.parallel ? ' + ' + (spec.layersB || []).length : ''));
    add('receptive field', fmt(spec.rf) + ' d');
    add('bridge input', fmt(spec.bridgeIn));
    add('latent', 'z = ' + spec.z);
    var p = spec.paramsDet || spec.paramsVae;
    add('parameters', p ? fmt(p) : null);
    return wrap;
  }

  function trajectoryTable(spec) {
    var layers = (spec.layers || []).concat(spec.layersB || []);
    if (!layers.length) return null;
    var par = !!spec.parallel;
    var scroll = el('div', 'table-scroll');
    var t = el('table');
    var thead = el('thead');
    var hr = el('tr');
    var heads = par
      ? ['Layer', 'Branch', 'Operator', 'Channels', 'Kernel', 'Dilation', 'Length out', 'Receptive field']
      : ['Layer', 'Operator', 'Channels', 'Kernel', 'Dilation', 'Length out', 'Receptive field'];
    var numFrom = par ? 3 : 2;
    heads.forEach(function (h, i) {
      var th = el('th', i >= numFrom ? 'num' : null, h);
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    t.appendChild(thead);
    var tb = el('tbody');
    var inputRow = el('tr');
    var inputCells = ['input', 'raw series', '6', '', '', fmt(window.INPUT_LEN), '1'];
    if (par) inputCells.splice(1, 0, '');
    inputCells.forEach(function (c, j) {
      inputRow.appendChild(el('td', j >= numFrom ? 'num' : null, c));
    });
    tb.appendChild(inputRow);

    var counters = {};
    layers.forEach(function (l) {
      var br = l.branch === 'branch-b' ? 'B' : (l.branch === 'branch-a' ? 'A' : 'main');
      counters[br] = (counters[br] || 0) + 1;
      var tr = el('tr');
      var cells = [
        String(counters[br]),
        l.type === 'strided' ? 'strided, s=2' : 'dilated, s=1',
        String(l.width),
        String(l.k),
        String(l.d),
        fmt(l.len),
        fmt(l.rf)
      ];
      if (par) cells.splice(1, 0, br === 'B' ? 'B, dilated path' : 'A, strided path');
      cells.forEach(function (c, j) { tr.appendChild(el('td', j >= numFrom ? 'num' : null, c)); });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    scroll.appendChild(t);
    return scroll;
  }

  function makeCard(spec, opts) {
    opts = opts || {};
    var card = el('div', 'card arch-card');
    card.id = 'arch-' + spec.id;

    var head = el('div', 'arch-head');
    head.appendChild(el('h3', null, spec.name));
    var outcome = (spec.outcome || '').toLowerCase();
    head.appendChild(el('span', 'tag ' + outcome, outcome || 'evaluated'));
    if (spec.stage) head.appendChild(el('span', 'tag', spec.stage));
    if (spec.pipeline && spec.pipeline !== 'both') head.appendChild(el('span', 'tag', spec.pipeline));
    card.appendChild(head);

    if (spec.tagline) card.appendChild(el('p', 'arch-tagline', spec.tagline));

    var wrap = el('div', 'canvas-wrap');
    var canvas = el('canvas', 'arch');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label',
      'Animated diagram of the ' + spec.name + '. ' + (spec.tagline || ''));
    wrap.appendChild(canvas);
    card.appendChild(wrap);

    var controls = el('div', 'controls');
    var btn = el('button', null, 'Pause');
    var range = document.createElement('input');
    range.type = 'range';
    range.min = '0';
    range.max = '1000';
    range.value = '0';
    range.setAttribute('aria-label', 'Scrub the animation for ' + spec.name);
    var phase = el('span', 'phase-label', '');
    controls.appendChild(btn);
    controls.appendChild(range);
    controls.appendChild(phase);
    card.appendChild(controls);

    card.appendChild(specChips(spec));
    var m = metricRow(spec);
    if (m) card.appendChild(m);

    if (spec.why && !opts.hideWhy) {
      var note = el('div', 'note' + (outcome === 'eliminated' ? ' warn' : ''));
      var p = el('p');
      p.appendChild(el('strong', null, outcome === 'eliminated' ? 'Why it was eliminated. ' : 'Why it was kept. '));
      p.appendChild(document.createTextNode(spec.why.split('. ').slice(0, 3).join('. ')));
      note.appendChild(p);
      card.appendChild(note);
    }

    if (opts.withTable) {
      var tt = trajectoryTable(spec);
      if (tt) {
        card.appendChild(el('h3', null, 'Layer-by-layer trajectory'));
        card.appendChild(tt);
        card.appendChild(el('p', 'fig-note',
          'Lengths follow the same-padding rule, where each strided layer maps a length to its ceiling half and each dilated layer preserves the length. The receptive field is the span of input days feeding one output position at that depth.'));
      }
    }

    var ctrl = null;
    requestAnimationFrame(function () {
      ctrl = window.ArchEngine.mount(canvas, spec, {
        speed: opts.speed || 0.9,
        onProgress: function (frac, node) {
          if (document.activeElement !== range) range.value = String(Math.round(frac * 1000));
          phase.textContent = node ? (node.label + (node.sub ? '  ' + node.sub : '')) : '';
        }
      });
      btn.addEventListener('click', function () {
        if (ctrl.isPlaying()) { ctrl.pause(); btn.textContent = 'Play'; }
        else { ctrl.play(); btn.textContent = 'Pause'; }
      });
      range.addEventListener('input', function () {
        ctrl.pause();
        btn.textContent = 'Play';
        ctrl.seek(Number(range.value) / 1000);
      });
    });

    card.__setSpec = function (next) { if (ctrl) ctrl.setSpec(next); };
    return card;
  }

  /* ---------- assemble the page ---------- */

  function fill(containerId, ids, opts) {
    var host = document.getElementById(containerId);
    if (!host) return;
    ids.forEach(function (id) {
      var spec = byId[id];
      if (!spec) return;
      host.appendChild(makeCard(spec, opts));
    });
  }

  function group(prefixTest) {
    return A.filter(function (a) { return prefixTest(a.id); }).map(function (a) { return a.id; });
  }

  document.addEventListener('DOMContentLoaded', function () {
    fill('final-model', ['depth-dilated-4-final'], { withTable: true, speed: 0.8 });
    fill('stage1', ['stage1-single-head', 'stage1-multi-head'], { withTable: false });
    fill('stage2', [
      'strided-baseline', 'dilated-a', 'dilated-b', 'dilated-c', 'dilated-d',
      'hybrid-sequential', 'parallel-concat', 'parallel-sum'
    ], {});

    /* Stage 3 is a set of one-factor sweeps over the same skeleton, so the
       variants share a single canvas driven by a picker. */
    var sweeps = [
      { key: 'det-depth', label: 'Depth', ids: group(function (i) { return /^depth-/.test(i); }) },
      { key: 'det-width', label: 'Width', ids: ['depth-dilated-4-final'].concat(group(function (i) { return /^width-.*-det$/.test(i); })) },
      { key: 'det-latent', label: 'Latent size', ids: ['depth-dilated-4-final'].concat(group(function (i) { return /^latent-.*-det$/.test(i); })) },
      { key: 'det-kernel', label: 'Kernel size', ids: ['depth-dilated-4-final'].concat(group(function (i) { return /^kernel-.*-det$/.test(i); })) },
      { key: 'vae-depth', label: 'Variational depth', ids: group(function (i) { return /^vae-depth-/.test(i); }).concat(['vae-final-strided-6']) },
      { key: 'vae-width', label: 'Variational width', ids: group(function (i) { return /^vae-width-/.test(i); }).concat(['vae-final-strided-6']) },
      { key: 'vae-latent', label: 'Variational latent', ids: group(function (i) { return /^vae-latent-/.test(i); }).concat(['vae-final-strided-6']) },
      { key: 'vae-kernel', label: 'Variational kernel', ids: group(function (i) { return /^vae-kernel-/.test(i); }).concat(['vae-final-strided-6']) }
    ].filter(function (s) { return s.ids.length; });

    var host = document.getElementById('stage3');
    if (!host) return;

    var sweepPicker = el('div', 'picker');
    var variantPicker = el('div', 'picker');
    host.appendChild(sweepPicker);
    host.appendChild(variantPicker);

    var shared = el('div');
    host.appendChild(shared);

    var current = null;
    var currentCard = null;

    function showVariant(id) {
      var spec = byId[id];
      if (!spec) return;
      shared.innerHTML = '';
      currentCard = makeCard(spec, { withTable: true, speed: 0.9 });
      shared.appendChild(currentCard);
      variantPicker.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.id === id));
      });
    }

    function showSweep(sw) {
      current = sw;
      variantPicker.innerHTML = '';
      sw.ids.forEach(function (id) {
        var spec = byId[id];
        if (!spec) return;
        var b = el('button', null, spec.name.replace(/^Stage \d+[: ]*/, ''));
        b.dataset.id = id;
        b.addEventListener('click', function () { showVariant(id); });
        variantPicker.appendChild(b);
      });
      sweepPicker.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.key === sw.key));
      });
      showVariant(sw.ids[0]);
    }

    sweeps.forEach(function (sw) {
      var b = el('button', null, sw.label);
      b.dataset.key = sw.key;
      b.addEventListener('click', function () { showSweep(sw); });
      sweepPicker.appendChild(b);
    });
    showSweep(sweeps[0]);

    /* operator explainers */
    ['op-strided', 'op-dilated', 'op-pool'].forEach(function (id) {
      var c = document.getElementById(id);
      if (c) window.OperatorAnim.mount(c, id.replace('op-', ''));
    });

    /* count readout */
    var counter = document.getElementById('arch-count');
    if (counter) counter.textContent = String(A.length);
  });
})();
