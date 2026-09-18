"""Reproducible toy VAE replay. NumPy only; no environmental observations.

Run with --output PATH to regenerate the browser data. 24 -> 32 tanh ->
two-dimensional diagonal Gaussian -> 32 tanh -> 24 linear outputs.
Objective: mean over observations of summed squared error + 0.05 * KL.
The reconstruction term is Gaussian NLL up to constants for variance 0.5.
This is a beta-VAE illustration, not an unweighted ELBO experiment.
"""
import argparse
import json
import numpy as np

rng = np.random.default_rng(21)
t = np.linspace(0, 2*np.pi, 24, endpoint=False)
amplitude = rng.uniform(.45, 1.35, 384)
phase = rng.uniform(-np.pi, np.pi, 384)
offset = rng.uniform(-.35, .35, 384)
x = amplitude[:, None]*np.sin(t+phase[:, None])+offset[:, None]
ids = np.arange(0, 384, 8)
P = {}
for name, shape in [('e',(24,32)),('m',(32,2)),('v',(32,2)),('d',(2,32)),('o',(32,24))]:
    P[name] = rng.normal(0, np.sqrt(1/shape[0]), shape)
    P['b'+name] = np.zeros(shape[1])
mom = {k:np.zeros_like(v) for k,v in P.items()}
vel = {k:np.zeros_like(v) for k,v in P.items()}
beta = .05
frames = []
fixed_eps = rng.normal(size=(8,len(ids),2))

def forward(a, eps):
    h=np.tanh(a@P['e']+P['be'])
    mu=h@P['m']+P['bm']; lv=h@P['v']+P['bv']
    sd=np.exp(lv/2); z=mu+sd*eps
    g=np.tanh(z@P['d']+P['bd']); y=g@P['o']+P['bo']
    return h,mu,lv,sd,z,g,y

def rounded(a): return np.round(a,5).tolist()

def record(step):
    a=x[ids]; h,mu,lv,sd,z,g,y=forward(a,fixed_eps[0])
    rec=np.mean([np.mean(np.sum((forward(a,eps)[-1]-a)**2,axis=1)) for eps in fixed_eps])
    kl=np.mean(.5*np.sum(mu**2+np.exp(lv)-1-lv,axis=1))
    frames.append(dict(step=step,mu=rounded(mu),sd=rounded(sd),z=rounded(z),output=rounded(y),reconstruction=float(rec),kl=float(kl),loss=float(rec+beta*kl)))

record(0)
for step in range(1,1601):
    a=x[rng.choice(len(x),64,replace=False)]; n=len(a)
    eps=rng.normal(size=(n,2)); h,mu,lv,sd,z,g,y=forward(a,eps)
    dy=2*(y-a)/n
    G={'o':g.T@dy,'bo':dy.sum(0)}
    dg=(dy@P['o'].T)*(1-g*g)
    G.update(d=z.T@dg,bd=dg.sum(0))
    dz=dg@P['d'].T
    dm=dz+beta*mu/n
    dv=dz*eps*sd*.5+beta*.5*(np.exp(lv)-1)/n
    G.update(m=h.T@dm,bm=dm.sum(0),v=h.T@dv,bv=dv.sum(0))
    dh=(dm@P['m'].T+dv@P['v'].T)*(1-h*h)
    G.update(e=a.T@dh,be=dh.sum(0))
    for k in P:
        mom[k]=.9*mom[k]+.1*G[k]; vel[k]=.999*vel[k]+.001*G[k]**2
        P[k]-=.003*(mom[k]/(1-.9**step))/(np.sqrt(vel[k]/(1-.999**step))+1e-8)
    if step%20==0: record(step)

data=dict(seed=21,beta=beta,inputs=rounded(x[ids]),phase=rounded(phase[ids]),epsilon=rounded(fixed_eps[0]),frames=frames)
assert all(np.isfinite(f['loss']) for f in frames)
assert frames[-1]['reconstruction']<frames[0]['reconstruction']*.2
parser=argparse.ArgumentParser(); parser.add_argument('--output',required=True)
args=parser.parse_args()
with open(args.output,'w',encoding='utf-8') as out:
    out.write('window.VAE_TRAINING_DATA='+json.dumps(data,separators=(',',':'))+';\n')
print(json.dumps({"snapshots":len(frames),"initial":frames[0]['reconstruction'],"final":frames[-1]['reconstruction'],"finalKL":frames[-1]['kl']}))
