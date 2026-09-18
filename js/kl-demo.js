(() => {
  const root=document.getElementById('kl-demo'); if(!root)return;
  const mean=document.getElementById('kl-mean'),sd=document.getElementById('kl-sd'),button=document.getElementById('kl-play');
  let playing=false,last=0,phase=0;
  const density=(x,m,s)=>Math.exp(-.5*((x-m)/s)**2)/(s*Math.sqrt(2*Math.PI));
  function draw(){
    const m=+mean.value,s=+sd.value;
    document.getElementById('kl-mean-value').textContent=m.toFixed(2);
    document.getElementById('kl-sd-value').textContent=s.toFixed(2);
    const path=(mu,sigma)=>Array.from({length:401},(_,i)=>{const x=-8+i*.04;return `${i?'L':'M'}${(55+i*1.25).toFixed(2)},${(250-150*density(x,mu,sigma)).toFixed(2)}`;}).join(' ');
    document.getElementById('kl-p-path').setAttribute('d',path(0,1));
    document.getElementById('kl-q-path').setAttribute('d',path(m,s));
    const forward=Math.log(s)+(1+m*m)/(2*s*s)-.5;
    const reverse=-Math.log(s)+(s*s+m*m)/2-.5;
    document.getElementById('kl-forward').textContent=Math.max(0,forward).toFixed(3)+' nats';
    document.getElementById('kl-reverse').textContent=Math.max(0,reverse).toFixed(3)+' nats';
    document.getElementById('kl-reading').textContent=forward<1e-9?'The distributions coincide: both divergences are zero.':Math.abs(s-1)<1e-9?'The means differ, but the variances match. In this Gaussian example the two directions happen to give the same value.':s<1?'Q is narrower than P. It assigns little density to parts of the range where P still places probability, increasing the penalty in DKL(P‖Q).':'Q is wider than P. Reversing the comparison changes which distribution weights the mismatch, so the two divergences differ.';
  }
  function stop(){playing=false;button.textContent='Animate mean';}
  [mean,sd].forEach(input=>input.addEventListener('input',()=>{stop();draw();}));
  button.addEventListener('click',()=>{playing=!playing;button.textContent=playing?'Pause':'Animate mean';});
  document.getElementById('kl-match').addEventListener('click',()=>{stop();mean.value=0;sd.value=1;draw();});
  function frame(t){if(playing&&t-last>50&&!document.hidden){phase+=.025;mean.value=(3*Math.sin(phase)).toFixed(2);draw();last=t;}requestAnimationFrame(frame);}
  draw();requestAnimationFrame(frame);
})();
