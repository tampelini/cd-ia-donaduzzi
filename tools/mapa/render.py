import pickle, math, sys, collections, json
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
M,layers,byh=pickle.load(open('ms.pkl','rb'))
H=lambda h: h[-1] if isinstance(h,list) else h
L=lambda o: layers.get(H(o['layer'])) if 'layer' in o else '?'
def segs(o):
    t=o.get('entity')
    if t=='LINE': return [[o['start'][:2],o['end'][:2]]]
    if t=='LWPOLYLINE':
        p=[q[:2] for q in o['points']]
        if o.get('flag',0)&1 and p: p=p+[p[0]]
        return [p]
    if t in ('ARC','CIRCLE'):
        c=o['center']; r=o['radius']; a0=o.get('start_angle',0); a1=o.get('end_angle',2*math.pi)
        if a1<a0: a1+=2*math.pi
        n=max(8,int((a1-a0)*r/2)); n=min(n,200)
        return [[[c[0]+r*math.cos(a0+(a1-a0)*i/n), c[1]+r*math.sin(a0+(a1-a0)*i/n)] for i in range(n+1)]]
    return []
out=collections.defaultdict(list)
for o in M:
    try:
        for s in segs(o): out[L(o)].append(s)
    except Exception as e: pass
pickle.dump(dict(out),open('segs.pkl','wb'))
xs=[p[0] for l in out.values() for s in l for p in s]; ys=[p[1] for l in out.values() for s in l for p in s]
import numpy as np
print('x',np.percentile(xs,[0,1,50,99,100]),'y',np.percentile(ys,[0,1,50,99,100]))
