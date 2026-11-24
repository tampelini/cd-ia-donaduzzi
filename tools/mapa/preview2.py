import pickle, json, base64, numpy as np, math, sys
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as MP, PathPatch, Circle
from matplotlib.path import Path
from matplotlib.collections import PolyCollection
d=pickle.load(open('mapa2.pkl','rb'))
lim=[float(v) for v in sys.argv[1:5]] if len(sys.argv)>4 else [-360,450,-340,420]
f=plt.figure(figsize=(14,14*(lim[3]-lim[2])/(lim[1]-lim[0]))); ax=f.add_axes([0,0,1,1]); ax.set_xlim(lim[0],lim[1]); ax.set_ylim(lim[3],lim[2]); ax.set_aspect('equal'); ax.axis('off')
ax.add_patch(plt.Rectangle((lim[0],lim[2]),lim[1]-lim[0],lim[3]-lim[2],color='#e9a35a'))
def poly(rings,cor,z=1):
    verts=[];codes=[]
    for r in rings:
        verts+=r+[r[0]]; codes+=[Path.MOVETO]+[Path.LINETO]*(len(r)-1)+[Path.CLOSEPOLY]
    ax.add_patch(PathPatch(Path(verts,codes),fc=cor,ec='none',zorder=z))
ZC={'canteiro':'#7fbf6a','univ':'#9db9e6','resid':'#e6d23c','com':'#d8424c','ind':'#bf4cb3'}
for a in d['areas']: poly([a['p']],'#cfe6b8',2)
for r in d['calc']: poly(r,'#f3ead8',2)
for r in d['ruas']: poly(r,'#60646c',3)
for x,z,w,h,ang,zn in d['lotes']:
    c,s=math.cos(ang),math.sin(ang); pts=[(x+c*dx-s*dz, z+s*dx+c*dz) for dx,dz in [(-w/2,-h/2),(w/2,-h/2),(w/2,h/2),(-w/2,h/2)]]
    ax.add_patch(MP(pts,fc=ZC[zn],ec='#ffffff',lw=0.3,zorder=4))
for x,z,r in d['ilhas']: ax.add_patch(Circle((x,z),r,fc='#3fae5c',zorder=5))
if len(sys.argv)>5:
    C=json.load(open('/home/claude/site/campus.json'))
    for pt in C['partes']:
        q=np.frombuffer(base64.b64decode(pt['p']),dtype=np.int16).reshape(-1,3)/100
        idx=np.frombuffer(base64.b64decode(pt['i']),dtype=np.uint32 if pt.get('u32') else np.uint16).reshape(-1,3)
        ax.add_collection(PolyCollection([[(q[i][0],q[i][2]) for i in t] for t in idx],facecolors=pt['c'],edgecolors='none',alpha=0.85,zorder=6))
    for n,x0,z0,x1,z1,h in C['caixas']: ax.add_patch(plt.Rectangle((x0,z0),x1-x0,z1-z0,fill=False,ec='r',zorder=7))
import numpy as _np
for gx in range(int(lim[0]//50*50),int(lim[1])+1,50): ax.axvline(gx,color='k',lw=0.4,alpha=0.35,zorder=9); ax.text(gx+1,lim[2]+8,str(gx),fontsize=7,zorder=9)
for gz in range(int(lim[2]//50*50),int(lim[3])+1,50): ax.axhline(gz,color='k',lw=0.4,alpha=0.35,zorder=9); ax.text(lim[0]+2,gz-2,str(gz),fontsize=7,zorder=9)
for n,x,z,r in d['nomes']: ax.text(x,z,n,fontsize=6,color='w',zorder=10)
f.savefig(sys.argv[6] if len(sys.argv)>6 else '/home/claude/shots/mapa_prev.png',dpi=80)
