(() => {
  'use strict';
  const canvas=document.getElementById('vae-space');if(!canvas)return;
  const ctx=canvas.getContext('2d'),pick=document.getElementById('vae-observation'),kl=document.getElementById('vae-strength'),yaw=document.getElementById('vae-yaw'),pitch=document.getElementById('vae-pitch');
  const colours=['#8c2f4a','#4477aa','#39846a'];
  const means=[[-2,1,.6],[1.7,.3,-1.2],[.3,-1.8,1.3]],scales=[[.45,.8,.35],[.7,.35,.55],[.4,.55,.85]];
  let samples=[],drag=null,animation=null;
  const normal=()=>Math.sqrt(-2*Math.log(1-Math.random()))*Math.cos(2*Math.PI*Math.random());
  const parameters=i=>{const t=+kl.value;return {m:means[i].map(x=>x*(1-t)),s:scales[i].map(x=>Math.exp((1-t)*Math.log(x)))}};
  function project(v){const a=+yaw.value,b=+pitch.value;const x=v[0]*Math.cos(a)+v[2]*Math.sin(a),z=-v[0]*Math.sin(a)+v[2]*Math.cos(a);return [360+65*x,240-65*(v[1]*Math.cos(b)-z*Math.sin(b)),v[1]*Math.sin(b)+z*Math.cos(b)];}
  function line(points,colour,width=1,dash=[]){ctx.beginPath();points.forEach((v,i)=>{const p=project(v);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);});ctx.strokeStyle=colour;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}
  function draw(){
    const ratio=Math.min(devicePixelRatio||1,2);canvas.width=720*ratio;canvas.height=480*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,720,480);
    const ink=getComputedStyle(canvas).color;ctx.font='16px sans-serif';
    for(let d=0;d<3;d++){const a=[0,0,0],b=[0,0,0];a[d]=-3.7;b[d]=3.7;line([a,b],'#aaa');const p=project(b);ctx.fillStyle=ink;ctx.fillText(['z₁','z₂','z₃'][d],p[0]+5,p[1]);}
    // Radius-one Mahalanobis contours, not hard boundaries or 68% regions in 3D.
    for(let plane=0;plane<3;plane++){const ring=[];for(let j=0;j<=80;j++){const v=[0,0,0];v[plane]=Math.cos(j*Math.PI/40);v[(plane+1)%3]=Math.sin(j*Math.PI/40);ring.push(v);}line(ring,'#777',1.5,[5,5]);}
    const faces=[];
    for(let i=0;i<3;i++){const {m,s}=parameters(i),point=(u,v)=>m.map((x,d)=>x+s[d]*[Math.cos(v)*Math.cos(u),Math.sin(v),Math.cos(v)*Math.sin(u)][d]);
      for(let j=0;j<20;j++)for(let k=0;k<10;k++){const u=j*Math.PI/10,v=-Math.PI/2+k*Math.PI/10;const p=[point(u,v),point(u+Math.PI/10,v),point(u+Math.PI/10,v+Math.PI/10),point(u,v+Math.PI/10)].map(project);faces.push({p,c:colours[i],alpha:i===+pick.value?.13:.035,z:p.reduce((a,b)=>a+b[2],0)/4});}
    }
    faces.sort((a,b)=>a.z-b.z).forEach(f=>{ctx.beginPath();f.p.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.globalAlpha=f.alpha;ctx.fillStyle=f.c;ctx.fill();ctx.globalAlpha=f.alpha+.07;ctx.strokeStyle=f.c;ctx.stroke();});ctx.globalAlpha=1;
    for(let i=0;i<3;i++){const p=project(parameters(i).m);ctx.beginPath();ctx.arc(p[0],p[1],i===+pick.value?6:4,0,2*Math.PI);ctx.fillStyle=colours[i];ctx.fill();ctx.fillText(['A','B','C'][i],p[0]+9,p[1]-8);}
    const {m,s}=parameters(+pick.value);samples.forEach((e,j)=>{const p=project(e.map((x,d)=>m[d]+s[d]*x));ctx.beginPath();ctx.arc(p[0],p[1],j===samples.length-1?5:2.5,0,Math.PI*2);ctx.fillStyle=colours[+pick.value];ctx.fill();});
    const fmt=a=>'['+a.map(x=>x.toFixed(2)).join(', ')+']';
    document.getElementById('vae-parameters').textContent='μ = '+fmt(m)+'   σ = '+fmt(s);
    document.getElementById('vae-kl-value').textContent=(.5*m.reduce((sum,x,d)=>sum+x*x+s[d]*s[d]-1-2*Math.log(s[d]),0)).toFixed(3)+' nats';
    document.getElementById('vae-strength-value').textContent=Math.round(+kl.value*100)+'%';
    document.getElementById('vae-sample-value').textContent=samples.length?fmt(samples.at(-1).map((x,d)=>m[d]+s[d]*x)):'Draw a latent sample';
  }
  [pick,kl,yaw,pitch].forEach(el=>el.addEventListener('input',()=>{if(el===pick||el===kl)samples=[];draw();}));
  document.getElementById('vae-sample').addEventListener('click',()=>{samples.push([normal(),normal(),normal()]);if(samples.length>30)samples.shift();draw();});
  document.getElementById('vae-reset').addEventListener('click',()=>{cancelAnimationFrame(animation);animation=null;document.getElementById('vae-animate').textContent='Animate pull to prior';kl.value=0;pick.value=0;yaw.value=.6;pitch.value=.35;samples=[];draw();});
  const animate=document.getElementById('vae-animate');animate.addEventListener('click',()=>{if(animation){cancelAnimationFrame(animation);animation=null;animate.textContent='Animate pull to prior';return;}const start=performance.now();kl.value=0;samples=[];animate.textContent='Pause';function frame(t){kl.value=Math.min(1,(t-start)/6000);draw();if(+kl.value<1)animation=requestAnimationFrame(frame);else{animation=null;animate.textContent='Animate pull to prior';}}animation=requestAnimationFrame(frame);});
  canvas.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw.value=Math.max(-3.14,Math.min(3.14,+yaw.value+(e.clientX-drag[0])*.008));pitch.value=Math.max(-1.3,Math.min(1.3,+pitch.value+(e.clientY-drag[1])*.008));drag=[e.clientX,e.clientY];draw();});['pointerup','pointercancel'].forEach(name=>canvas.addEventListener(name,()=>drag=null));draw();
})();
