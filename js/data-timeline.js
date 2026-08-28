(function () {
  'use strict';

  var canvas = document.getElementById('data-timeline-canvas');
  if (!canvas) return;

  var dateNode = document.getElementById('data-timeline-date');
  var caption = document.getElementById('data-timeline-caption');
  var toggle = document.getElementById('data-timeline-toggle');
  var progress = document.getElementById('data-timeline-progress');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var channels = [
    { key: 'tmax', label: 'Maximum temperature', short: 'Max temp.', unit: '\u00b0C', colour: '#8C2F4A' },
    { key: 'tmin', label: 'Minimum temperature', short: 'Min temp.', unit: '\u00b0C', colour: '#C2761F' },
    { key: 'rhmax', label: 'Maximum relative humidity', short: 'Max humidity', unit: '%', colour: '#3F6B4A' },
    { key: 'rhmin', label: 'Minimum relative humidity', short: 'Min humidity', unit: '%', colour: '#4A6670' },
    { key: 'wind', label: 'Wind speed', short: 'Wind speed', unit: 'm/s', colour: '#8C6B2F' },
    { key: 'precip', label: 'Precipitation', short: 'Precipitation', unit: 'mm', colour: '#466A91' }
  ];

  var state = {
    data: null,
    scales: null,
    start: 0,
    playing: !reducedMotion,
    lastTime: 0,
    duration: 120000,
    windowDays: 365,
    width: 0,
    height: 0
  };

  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name);
    return value && value.trim() ? value.trim() : fallback;
  }

  function quantile(values, q) {
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var position = (sorted.length - 1) * q;
    var lower = Math.floor(position);
    var upper = Math.ceil(position);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
  }

  function buildScales(data) {
    var result = {};
    channels.forEach(function (channel) {
      var values = data.obs[channel.key];
      var low = channel.key === 'precip' ? 0 : quantile(values, 0.01);
      var high = quantile(values, channel.key === 'precip' ? 0.995 : 0.99);
      var padding = Math.max((high - low) * 0.08, 0.01);
      result[channel.key] = { low: low - (channel.key === 'precip' ? 0 : padding), high: high + padding };
    });
    return result;
  }

  function dateLabel(index, data) {
    var dayIndex = Math.max(0, Math.min(data.n - 1, Math.floor(index)));
    var year = data.start_year + Math.floor(dayIndex / data.days_per_year);
    var day = dayIndex % data.days_per_year;
    var monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var month = 11;
    for (var i = 1; i < monthStarts.length; i++) {
      if (day < monthStarts[i]) { month = i - 1; break; }
    }
    return months[month] + ' ' + year;
  }

  function resize() {
    var bounds = canvas.getBoundingClientRect();
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    state.width = bounds.width;
    state.height = bounds.height;
    canvas.width = Math.round(bounds.width * ratio);
    canvas.height = Math.round(bounds.height * ratio);
    canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function interpolate(values, position) {
    var left = Math.max(0, Math.min(values.length - 1, Math.floor(position)));
    var right = Math.min(values.length - 1, left + 1);
    var fraction = position - left;
    return values[left] + (values[right] - values[left]) * fraction;
  }

  function draw() {
    var ctx = canvas.getContext('2d');
    var width = state.width;
    var height = state.height;
    if (!width || !height) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = cssVar('--paper', '#FBF8F4');
    ctx.fillRect(0, 0, width, height);

    if (!state.data) {
      ctx.fillStyle = cssVar('--muted', '#6B5D63');
      ctx.font = '12px ' + cssVar('--font', 'sans-serif');
      ctx.textAlign = 'center';
      ctx.fillText('Loading the daily series...', width / 2, height / 2);
      return;
    }

    var data = state.data;
    var labelWidth = width < 560 ? 94 : 148;
    var rightPad = 12;
    var plotWidth = width - labelWidth - rightPad;
    var panelHeight = height / channels.length;
    var end = Math.min(data.n - 1, state.start + state.windowDays - 1);
    var border = cssVar('--border', '#E0D6C9');
    var muted = cssVar('--muted', '#6B5D63');
    var heading = cssVar('--heading', '#461A2B');
    var font = cssVar('--font', 'sans-serif');

    dateNode.textContent = dateLabel(state.start, data) + ' to ' + dateLabel(end, data);
    progress.style.width = (100 * state.start / Math.max(1, data.n - state.windowDays)).toFixed(2) + '%';

    channels.forEach(function (channel, channelIndex) {
      var top = channelIndex * panelHeight;
      var bottom = top + panelHeight;
      var values = data.obs[channel.key];
      var scale = state.scales[channel.key];
      var innerTop = top + 8;
      var innerBottom = bottom - 8;

      if (channelIndex % 2 === 1) {
        ctx.fillStyle = 'rgba(97, 34, 59, 0.025)';
        ctx.fillRect(0, top, width, panelHeight);
      }
      if (channelIndex > 0) {
        ctx.strokeStyle = border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, top + 0.5);
        ctx.lineTo(width, top + 0.5);
        ctx.stroke();
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = heading;
      ctx.font = '600 ' + (width < 560 ? '10px ' : '11px ') + font;
      ctx.fillText(width < 560 ? channel.short : channel.label, 10, top + 22);
      ctx.fillStyle = muted;
      ctx.font = '10px ' + font;
      ctx.fillText(channel.unit, 10, top + 37);

      ctx.save();
      ctx.beginPath();
      ctx.rect(labelWidth, top + 2, plotWidth, panelHeight - 4);
      ctx.clip();
      ctx.strokeStyle = channel.colour;
      ctx.lineWidth = channel.key === 'precip' ? 1.25 : 1.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();

      for (var pixel = 0; pixel <= plotWidth; pixel++) {
        var fraction = pixel / Math.max(1, plotWidth);
        var position = state.start + fraction * (state.windowDays - 1);
        var value = interpolate(values, position);
        value = Math.max(scale.low, Math.min(scale.high, value));
        var normalised = (value - scale.low) / Math.max(0.0001, scale.high - scale.low);
        var x = labelWidth + pixel;
        var y = innerBottom - normalised * (innerBottom - innerTop);
        if (pixel === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    });
  }

  function animate(time) {
    if (!state.lastTime) state.lastTime = time;
    var elapsed = time - state.lastTime;
    state.lastTime = time;

    if (state.playing && state.data) {
      var maximumStart = Math.max(0, state.data.n - state.windowDays);
      state.start += elapsed * maximumStart / state.duration;
      if (state.start >= maximumStart) state.start = 0;
      draw();
    }
    window.requestAnimationFrame(animate);
  }

  toggle.addEventListener('click', function () {
    state.playing = !state.playing;
    toggle.textContent = state.playing ? 'Pause' : 'Play';
    toggle.setAttribute('aria-pressed', String(!state.playing));
  });

  if (reducedMotion) {
    toggle.textContent = 'Play';
    toggle.setAttribute('aria-pressed', 'true');
  }

  fetch('data/recon_median.json')
    .then(function (response) {
      if (!response.ok) throw new Error('Could not load the time series.');
      return response.json();
    })
    .then(function (data) {
      state.data = data;
      state.scales = buildScales(data);
      var latitude = Math.abs(data.lat).toFixed(3) + '\u00b0 ' + (data.lat < 0 ? 'S' : 'N');
      var longitude = Math.abs(data.lon).toFixed(3) + '\u00b0 ' + (data.lon < 0 ? 'W' : 'E');
      caption.textContent = 'Observed daily values from one held-out grid site at ' + latitude + ', ' + longitude + '. Each strip uses its own physical scale, and the moving window traverses the complete 2006 to 2024 record.';
      resize();
    })
    .catch(function () {
      dateNode.textContent = 'Record unavailable';
      caption.textContent = 'The example daily record could not be loaded.';
      toggle.disabled = true;
    });

  if ('ResizeObserver' in window) {
    new ResizeObserver(resize).observe(canvas);
  } else {
    window.addEventListener('resize', resize);
  }
  resize();
  window.requestAnimationFrame(animate);
})();
