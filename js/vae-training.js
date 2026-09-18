(()=>{'use strict';
const D=window.VAE_TRAINING_DATA;if(!D||!document.getElementById('vt-space'))return;
const $=id=>document.getElementById('vt-'+id),frames=D.frames;
let frame=0,selected=0,playing=false,timer=null;
const colours=D.phase.map(p=>`hsl(${Math.round((p+Math.PI)/(2*Math.PI)*300)},45%,43%)`);
D.inputs.forEach((_,i)=>{const o=document.createElement('option');o.value=i;o.textContent='Observation '+(i+1);$('observation').append(o)});
function setup(id,w,h){const c=$(id),r=Math.min(devicePixelRatio||1,2);c.width=w*r;c.height=h*r;const ctx=c.getContext('2d');ctx.setTransform(r,0,0,r,0,0);ctx.font='15px sans-serif';return ctx}
function line(ctx,pts,colour,width=1,dash=[]){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle=colour;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([])}
const extent=Math.max(3,...frames.flatMap(f=>f.mu.flatMap((m,i)=>m.map((v,k)=>Math.abs(v)+f.sd[i][k]))));
function space(f){const c=setup('space',600,420);
 const zoom=+$('zoom').value;
 function project(v){return [300+v[0]*155/extent*zoom,210-v[1]*155/extent*zoom]}
 function path(vs,col,w=1,d=[]){line(c,vs.map(project),col,w,d)}
 for(let k=0;k<2;k++){let a=[0,0],b=[0,0];a[k]=-extent/zoom;b[k]=extent/zoom;path([a,b],'#b7b0ab');const p=project(b);c.fillStyle='#665b58';c.fillText(['z₁','z₂'][k],p[0]+3,p[1]-5)}
 function contour(m,s,col,dash=[]){const pts=[];for(let j=0;j<=64;j++)pts.push([m[0]+s[0]*Math.cos(j*Math.PI/32),m[1]+s[1]*Math.sin(j*Math.PI/32)]);path(pts,col,1.5,dash)}
 contour([0,0],[1,1],'#999',[5,5]);
 // Show the recent movement of the selected mean, without fabricating intermediate checkpoints.
 path(frames.slice(Math.max(0,frame-12),frame+1).map(f=>f.mu[selected]),colours[selected],2,[3,3]);
 f.mu.forEach((m,i)=>{const p=project(m);c.beginPath();c.arc(...p,i===selected?6:3,0,Math.PI*2);c.fillStyle=colours[i];c.fill();if(i===selected){c.strokeStyle='#222';c.stroke()}});
 contour(f.mu[selected],f.sd[selected],colours[selected]);
 const p=project(f.z[selected]);line(c,[[p[0]-5,p[1]-5],[p[0]+5,p[1]+5]],'#111',2);line(c,[[p[0]-5,p[1]+5],[p[0]+5,p[1]-5]],'#111',2);
}
function signal(f){const c=setup('signal',600,300),x=D.inputs[selected],y=f.output[selected];
 line(c,[[40,20],[40,265],[580,265]],'#bbb');line(c,[[40,142],[580,142]],'#ddd');
 const pts=a=>a.map((v,j)=>[40+j*540/23,142-v*48]);
 line(c,pts(x),'#8c2f4a',3);line(c,pts(y),'#287d81',3,[7,5]);c.fillStyle='#665b58';c.fillText('Time point',240,294);c.fillText('0',30,283);c.fillText('23',565,283);
 c.fillText('Synthetic value',45,17);for(const v of [-2,0,2])c.fillText(String(v),12,147-v*48);
}
function losses(){const c=setup('loss',900,200),max=Math.max(...frames.map(f=>f.reconstruction))*1.05;
 line(c,[[45,15],[45,165],[875,165]],'#aaa');
 const pts=key=>frames.slice(0,frame+1).map((f,i)=>[45+i*830/(frames.length-1),165-f[key]*(key==='kl'?D.beta:1)*145/max]);
 line(c,pts('reconstruction'),'#8c2f4a',2);line(c,pts('kl'),'#287d81',2);
 const x=45+frame*830/80;line(c,[[x,18],[x,165]],'#999',1,[4,4]);c.fillStyle='#8c2f4a';c.fillText('Reconstruction',55,20);c.fillStyle='#287d81';c.fillText('0.05 × KL',210,20);c.fillStyle='#665b58';c.fillText('0',28,184);c.fillText('1600 updates',780,190);c.fillText(max.toFixed(1),4,24);
}
function interpolate(a,b,t){return Array.isArray(a)?a.map((v,i)=>interpolate(v,b[i],t)):a+(b-a)*t}
function render(){const lower=Math.floor(frame),upper=Math.min(lower+1,frames.length-1),t=frame-lower;
const f=Object.fromEntries(Object.keys(frames[lower]).map(key=>[key,interpolate(frames[lower][key],frames[upper][key],t)]));$('step').value=frame;$('step-value').textContent=Math.round(f.step)+' / 1600';space(f);signal(f);losses();
 $('rec').textContent=f.reconstruction.toFixed(3);$('kl').textContent=f.kl.toFixed(3)+' nats';$('total').textContent=f.loss.toFixed(3);
}
function stop(){playing=false;cancelAnimationFrame(timer);timer=null;$('play').textContent='Play training';$('play').setAttribute('aria-pressed','false')}
const note='Smooth visual interpolation between recorded checkpoints; intermediate values are not additional training measurements.';
$('stage').textContent=note;
$('play').onclick=()=>{if(playing){stop();return}if(frame>=frames.length-1)frame=0;playing=true;$('play').textContent='Pause';$('play').setAttribute('aria-pressed','true');let last=performance.now();
function tick(now){if(!playing)return;frame=Math.min(frames.length-1,frame+Math.min(now-last,100)/980);last=now;render();if(frame>=frames.length-1){stop();return}timer=requestAnimationFrame(tick)}timer=requestAnimationFrame(tick)};
$('reset').onclick=()=>{stop();frame=0;render()};$('step').oninput=()=>{stop();frame=+$('step').value;render()};
$('observation').onchange=()=>{selected=+$('observation').value;render()};$('zoom').oninput=render;
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});render();
})();
