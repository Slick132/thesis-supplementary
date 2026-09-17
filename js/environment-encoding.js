(() => {
  'use strict';
  const demo = document.getElementById('environment-encoding');
  if (!demo) return;
  const colours = ['#8C2F4A', '#466A91', '#3F6B4A'];
  const vectors = [[.72,-.34,1.18,.09,-.61],[-.46,.91,.28,-.75,.42],[.13,.24,-.83,.67,1.02]];
  const labels = ['Max temperature','Min temperature','Max humidity','Min humidity','Wind speed','Precipitation'];
  const select = document.getElementById('encoding-location');
  const toggle = document.getElementById('encoding-toggle');
  const series = document.getElementById('encoding-series');
  const vector = document.getElementById('encoding-vector');
  let phase = 0, last = 0, playing = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  labels.forEach(label => {
    const text = document.createElement('span'); text.textContent = label; series.append(text);
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 240 35'); svg.setAttribute('aria-hidden','true');
    svg.append(document.createElementNS(svg.namespaceURI,'path')); series.append(svg);
  });
  function draw() {
    const location = Number(select.value);
    demo.style.setProperty('--location-colour',colours[location]);
    series.querySelectorAll('path').forEach((path,c) => {
      let d = '';
      for(let i=0;i<=120;i++) {
        const t = i/12 + phase;
        const signal = c === 5 ? Math.pow(Math.max(0,Math.sin(t*2.7+location)*Math.cos(t*.7)),4)*24 : 8*Math.sin(t*.9+location*.5+c*.2)+3*Math.sin(t*4.1+c+location);
        d += `${i?'L':'M'}${i*2},${(c===5?31-signal:17+signal).toFixed(2)} `;
      }
      path.setAttribute('d',d);
    });
  }
  function updateLocation() {
    vector.replaceChildren();
    vectors[Number(select.value)].forEach((value,i) => {
      const row = document.createElement('div'); row.className='encoding-coordinate';
      const label = document.createElement('span'); label.textContent=`z${'₁₂₃₄₅'[i]}`;
      const number = document.createElement('span'); number.textContent=value.toFixed(2);
      row.append(label,number); vector.append(row);
    });
    draw();
  }
  function controls() { toggle.textContent=playing?'Pause':'Play'; demo.classList.toggle('is-paused',!playing); }
  toggle.addEventListener('click',()=>{playing=!playing;controls();});
  select.addEventListener('change',updateLocation);
  function tick(time) {
    if(playing && time-last>40 && !document.hidden) {phase+=.035;draw();last=time;}
    requestAnimationFrame(tick);
  }
  updateLocation(); controls(); requestAnimationFrame(tick);
})();
