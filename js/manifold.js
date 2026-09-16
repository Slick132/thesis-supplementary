(() => {
  const rollSvg = document.getElementById('manifold-roll');
  const sheetSvg = document.getElementById('manifold-sheet');
  if (!rollSvg || !sheetSvg) return;
  const unfoldInput = document.getElementById('unfold');
  const rotateXInput = document.getElementById('rotate-x');
  const rotateYInput = document.getElementById('rotate-y');
  const unfoldOutput = document.getElementById('unfold-value');
  const rotateXOutput = document.getElementById('rotate-x-value');
  const rotateYOutput = document.getElementById('rotate-y-value');
  const readout = document.getElementById('point-readout');
  const NS = 'http://www.w3.org/2000/svg';
  const columns = 18;
  const rows = 8;
  const sampleCount = columns * rows;
  const crossSectionCount = 160;
  const maxT = Math.PI * 4.2;
  const a = 1.15;
  const b = 0.22;
  const halfHeight = 6;
  const points = [];
  let selected = 72;
  let unfolding = 0;
  let rotationX = -0.42;
  let rotationY = 0.62;
  let dragStart = null;

  const make = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  };
  const colour = (t) => `hsl(${Math.round(12 + 218 * t)}, 67%, 47%)`;
  const speed = (t) => Math.sqrt((b * Math.cos(t) - (a + b * t) * Math.sin(t)) ** 2 + (b * Math.sin(t) + (a + b * t) * Math.cos(t)) ** 2);
  // Unwrapped tangent angle avoids discontinuities at each full turn.
  const tangentAngle = (t) => t + Math.atan2(a + b * t, b);
  const arcLength = (t) => {
    const steps = Math.max(2, Math.ceil(crossSectionCount * t / maxT));
    let length = 0;
    for (let i = 1; i <= steps; i += 1) {
      const left = t * (i - 1) / steps;
      const right = t * i / steps;
      length += (speed(left) + speed(right)) * (right - left) / 2;
    }
    return length;
  };
  const maxArc = arcLength(maxT);
  const jitter = (seed) => (Math.sin(seed * 12.9898) * 43758.5453) % 1;
  for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
    const i = row * columns + column;
    const t = maxT * (column + 0.5 + 0.22 * jitter(i + 1)) / columns;
    const height = halfHeight * (-1 + 2 * (row + 0.5 + 0.22 * jitter(i + 91)) / rows);
    const r = a + b * t;
    points.push({ i, t, x1: r * Math.cos(t), x2: height, x3: r * Math.sin(t), z1: arcLength(t), z2: height });
  }

  const integrateCrossSection = (u) => {
    const result = [{ t: 0, x: 0, y: 0 }];
    let x = 0; let y = 0;
    for (let i = 1; i < crossSectionCount; i += 1) {
      const left = maxT * (i - 1) / (crossSectionCount - 1);
      const right = maxT * i / (crossSectionCount - 1);
      const mid = (left + right) / 2;
      const angle = (1 - u) * tangentAngle(mid);
      const step = speed(mid) * (right - left);
      x += step * Math.cos(angle); y += step * Math.sin(angle);
      result.push({ t: right, x, y });
    }
    const meanX = result.reduce((sum, q) => sum + q.x, 0) / result.length;
    const meanY = result.reduce((sum, q) => sum + q.y, 0) / result.length;
    return result.map(q => ({ t: q.t, x: q.x - meanX, y: q.y - meanY }));
  };
  const crossAt = (cross, t) => {
    const position = t / maxT * (cross.length - 1);
    const i = Math.min(cross.length - 2, Math.floor(position));
    const fraction = position - i;
    return {x: cross[i].x + fraction * (cross[i + 1].x - cross[i].x), y: cross[i].y + fraction * (cross[i + 1].y - cross[i].y)};
  };
  const rotate3d = (p) => {
    const cy = Math.cos(rotationY); const sy = Math.sin(rotationY);
    const cx = Math.cos(rotationX); const sx = Math.sin(rotationX);
    const x = p.x1 * cy - p.x3 * sy;
    const depth = p.x1 * sy + p.x3 * cy;
    return { x, y: p.x2 * cx - depth * sx, depth: p.x2 * sx + depth * cx };
  };
  const bounds = (items) => ({ minX: Math.min(...items.map(q => q.x)), maxX: Math.max(...items.map(q => q.x)), minY: Math.min(...items.map(q => q.y)), maxY: Math.max(...items.map(q => q.y)) });
  const mapper = (items, box) => {
    const bnd = bounds(items); const width = Math.max(.01, bnd.maxX - bnd.minX); const height = Math.max(.01, bnd.maxY - bnd.minY);
    const scale = Math.min((box.width - 64) / width, (box.height - 86) / height);
    const cx = (bnd.minX + bnd.maxX) / 2; const cy = (bnd.minY + bnd.maxY) / 2;
    return q => ({ x: box.x + box.width / 2 + (q.x - cx) * scale, y: box.y + box.height / 2 - (q.y - cy) * scale });
  };
  const path = (svg, values, map, className) => make('path', { d: values.map((q, i) => { const p = map(q); return `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`; }).join(' '), class: className }, svg);
  const setSelected = (index, focus = false) => {
    selected = (index + sampleCount) % sampleCount;
    document.querySelectorAll('.manifold-point').forEach(node => { const active = Number(node.dataset.index) === selected; node.classList.toggle('is-selected', active); node.setAttribute('r', active ? '6.2' : '4.1'); node.setAttribute('tabindex', active ? '0' : '-1'); });
    const p = points[selected];
    readout.innerHTML = `<strong>Observation ${p.i + 1}</strong> · original coordinates: <code>(x₁, x₂, x₃) = (${p.x1.toFixed(2)}, ${p.x2.toFixed(2)}, ${p.x3.toFixed(2)})</code> · intrinsic coordinates: <code>(z₁, z₂) = (${p.z1.toFixed(2)}, ${p.z2.toFixed(2)})</code>`;
    if (focus) document.querySelector(`.manifold-point[data-index="${selected}"][data-panel="roll"]`).focus();
  };
  const addPoint = (svg, q, p, panel, map) => {
    const pos = map(q);
    const node = make('circle', { cx: pos.x, cy: pos.y, r: p.i === selected ? 6.2 : 4.1, fill: colour(p.t / maxT), class: `manifold-point${p.i === selected ? ' is-selected' : ''}`, tabindex: p.i === selected ? '0' : '-1', 'aria-label': `Observation ${p.i + 1}`, 'data-index': p.i, 'data-panel': panel }, svg);
    node.addEventListener('mouseenter', () => setSelected(p.i));
    node.addEventListener('focus', () => setSelected(p.i));
    node.addEventListener('click', () => setSelected(p.i));
    node.addEventListener('keydown', event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); setSelected(selected + (event.key === 'ArrowRight' ? 1 : -1), true); } });
  };
  const render = () => {
    const cross = integrateCrossSection(unfolding);
    rollSvg.innerHTML = '<title id="manifold-roll-title">Swiss-roll observations</title><desc id="manifold-roll-desc">A projected three-dimensional surface that progressively unrolls using integrated tangent directions.</desc>';
    sheetSvg.innerHTML = '<title id="manifold-sheet-title">Intrinsic coordinate sheet</title><desc id="manifold-sheet-desc">The same coloured observations on a fixed rectangle using arc-length and height coordinates.</desc>';
    const rollPoint = p => { const c = crossAt(cross, p.t); return rotate3d({x1: c.x, x2: p.x2, x3: c.y}); };
    const rollTriad = { origin: rotate3d({ x1: 0, x2: 0, x3: 0 }), x: rotate3d({ x1: 1, x2: 0, x3: 0 }), y: rotate3d({ x1: 0, x2: 1, x3: 0 }), z: rotate3d({ x1: 0, x2: 0, x3: 1 }) };
    const rollPoints = points.map(rollPoint); const sheetPoints = points.map(p => ({ x: p.z1, y: p.z2 }));
    const gridPoint = (t, height) => rollPoint({t, x2: height});
    const rollGrid = []; for (let row = 0; row < 8; row += 1) for (let column = 0; column < 81; column += 1) rollGrid.push(gridPoint(maxT * column / 80, halfHeight * (-1 + 2 * row / 7)));
    const rollMap = mapper([...rollPoints, ...rollGrid, rollTriad.origin, rollTriad.x, rollTriad.y, rollTriad.z], { x: 18, y: 58, width: 484, height: 276 });
    const sheetMap = mapper([...sheetPoints, { x: 0, y: -halfHeight }, { x: maxArc, y: halfHeight }], { x: 18, y: 58, width: 484, height: 276 });
    make('text', { x: 18, y: 25, class: 'panel-title' }, rollSvg).textContent = 'Ambient space: the Swiss roll';
    make('text', { x: 18, y: 43, class: 'panel-subtitle' }, rollSvg).textContent = unfolding === 0 ? 'Three measured coordinates (x₁, x₂, x₃)' : `Integrated unrolling: ${Math.round(unfolding * 100)}%`;
    make('text', { x: 18, y: 25, class: 'panel-title' }, sheetSvg).textContent = 'Two-dimensional coordinates';
    make('text', { x: 18, y: 43, class: 'panel-subtitle' }, sheetSvg).textContent = 'Fixed rectangle using z₁ (arc length) and z₂ (height)';
    for (let row = 0; row < 8; row += 1) { const values = []; for (let column = 0; column < 81; column += 1) values.push(gridPoint(maxT * column / 80, halfHeight * (-1 + 2 * row / 7))); path(rollSvg, values, rollMap, 'grid-line'); }
    for (let column = 0; column < 19; column += 1) path(rollSvg, [gridPoint(maxT * column / 18, -halfHeight), gridPoint(maxT * column / 18, halfHeight)], rollMap, 'grid-line');
    for (let row = 0; row < 6; row += 1) path(sheetSvg, [{ x: 0, y: halfHeight * (-1 + 2 * row / 5) }, { x: maxArc, y: halfHeight * (-1 + 2 * row / 5) }], sheetMap, 'grid-line');
    for (let column = 0; column < 9; column += 1) { const x = maxArc * column / 8; path(sheetSvg, [{ x, y: -halfHeight }, { x, y: halfHeight }], sheetMap, 'grid-line'); }
    const bottom = sheetMap({x: maxArc / 2, y: -halfHeight});
    make('text', {x: bottom.x, y: bottom.y + 24, 'text-anchor':'middle', class:'axis-label'}, sheetSvg).textContent = 'z₁: distance along the roll';
    const side = sheetMap({x: 0, y: 0});
    make('text', {x: side.x - 12, y: side.y, transform:`rotate(-90 ${side.x - 12} ${side.y})`, 'text-anchor':'middle', class:'axis-label'}, sheetSvg).textContent = 'z₂: height';
    [[rollTriad.x, 'x₁'], [rollTriad.y, 'x₂'], [rollTriad.z, 'x₃']].forEach(([end, label]) => { const origin = rollMap(rollTriad.origin); const target = rollMap(end); make('line', { x1: origin.x, y1: origin.y, x2: target.x, y2: target.y, class: 'axis' }, rollSvg); make('text', { x: target.x + 5, y: target.y + 4, class: 'axis-label' }, rollSvg).textContent = label; });
    points.forEach((p, i) => { addPoint(rollSvg, rollPoints[i], p, 'roll', rollMap); addPoint(sheetSvg, sheetPoints[i], p, 'sheet', sheetMap); });
    setSelected(selected);
  };
  const sync = () => { unfolding = Number(unfoldInput.value); rotationX = Number(rotateXInput.value); rotationY = Number(rotateYInput.value); unfoldOutput.value = `${Math.round(unfolding * 100)}%`; rotateXOutput.value = `${Math.round(rotationX * 57.3)}°`; rotateYOutput.value = `${Math.round(rotationY * 57.3)}°`; render(); };
  [unfoldInput, rotateXInput, rotateYInput].forEach(input => input.addEventListener('input', sync));
  document.getElementById('reset-view').addEventListener('click', () => { unfoldInput.value = 0; rotateXInput.value = -.42; rotateYInput.value = .62; sync(); });
  [rollSvg, sheetSvg].forEach(svg => {
    svg.addEventListener('pointerdown', event => { if (event.target.closest('.manifold-point')) return; dragStart = { x: event.clientX, y: event.clientY, rx: rotationX, ry: rotationY }; });
    svg.addEventListener('pointermove', event => { if (!dragStart) return; rotateYInput.value = Math.max(-1.5, Math.min(1.5, dragStart.ry + (event.clientX - dragStart.x) * .01)); rotateXInput.value = Math.max(-1.5, Math.min(1.5, dragStart.rx + (event.clientY - dragStart.y) * .01)); sync(); });
    svg.addEventListener('pointerup', () => { dragStart = null; });
    svg.addEventListener('pointerleave', () => { dragStart = null; });
  });
  sync();
})();
