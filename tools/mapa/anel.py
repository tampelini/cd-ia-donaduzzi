import pickle, json, math, numpy as np, cv2
from shapely.geometry import Polygon, MultiPolygon, box, Point
from shapely.ops import unary_union
d=pickle.load(open('mapa.pkl','rb'))
lab=np.load('lab.npy'); img=np.load('bar.npy')
# ---------- 1) lotes cercados de rua (ilhas de rotatória, canteiros) não recebem casa
exec(open('checar.py').read().split("for a in sys.argv")[0].replace("import numpy as np, math, sys, json, pickle",""))
def polys(rs):
    out=[]
    for rings in rs:
        try:
            p=Polygon(rings[0],[h for h in rings[1:] if len(h)>=3]).buffer(0)
            if not p.is_empty: out.append(p)
        except Exception: pass
    return out
ruasP=unary_union(polys(d['ruas']))
def rect(x,z,w,h,a):
    c,s=math.cos(a),math.sin(a); return Polygon([(x+c*dx-s*dz, z+s*dx+c*dz) for dx,dz in [(-w/2,-h/2),(w/2,-h/2),(w/2,h/2),(-w/2,h/2)]])
mud=0
for L in d['lotes']:
    if L[5]=='canteiro': continue
    r=rect(*L[:5]); anel=r.buffer(2.2).difference(r.buffer(0.3))
    fr=anel.intersection(ruasP).area/max(anel.area,1e-6)
    if fr>0.45: L[5]='canteiro'; mud+=1
print('lotes viraram canteiro:',mud)
# ---------- 2) contorno do parque e rua perimetral
LIM=(-380,-330,470,410)
tudo=[ruasP]+polys(d['calc'])+[Polygon(a['p']).buffer(0) for a in d['areas']]+[rect(*L[:5]) for L in d['lotes']]
dev=unary_union([g.buffer(0.8) for g in tudo]).buffer(4).buffer(-4)
caixa=box(LIM[0]+24,LIM[1]+24,LIM[2]-24,LIM[3]-24)
dev=dev.intersection(caixa)
if dev.geom_type=='MultiPolygon': dev=max(dev.geoms,key=lambda g:g.area)
C=Polygon(dev.exterior).simplify(9).buffer(0)
C=C.buffer(-6,join_style=2).buffer(6,join_style=2)  # tira pontas finas
print('contorno', len(C.exterior.coords), [round(v) for v in C.bounds])
anelRua=C.buffer(11,join_style=1).difference(C.buffer(1,join_style=1))
anelCalc=C.buffer(13.5,join_style=1).difference(C.buffer(11,join_style=1))
# recortes
clipP=lambda g: g.intersection(C.buffer(1))
def aneis(g):
    out=[]
    gs=[g] if g.geom_type=='Polygon' else list(getattr(g,'geoms',[]))
    for p in gs:
        if p.geom_type!='Polygon' or p.area<2: continue
        out.append([[ (round(x,1),round(z,1)) for x,z in list(p.exterior.coords)[:-1]]]+[[ (round(x,1),round(z,1)) for x,z in list(h.coords)[:-1]] for h in p.interiors])
    return out
ruasN=aneis(unary_union([clipP(ruasP),anelRua]))
calcN=aneis(unary_union([clipP(unary_union(polys(d['calc']))),anelCalc]))
areasN=[{'p':[(round(x,1),round(z,1)) for x,z in list(C.exterior.coords)[:-1]],'base':1}]
for a in d['areas']:
    g=clipP(Polygon(a['p']).buffer(0))
    for rr in aneis(g):
        areasN.append(dict(a, p=rr[0]))
inC=C.buffer(-2)
lotesN=[L for L in d['lotes'] if rect(*L[:5]).within(C.buffer(0.5)) and max(L[2],L[3])<40]
ilhasN=[i for i in d['ilhas'] if inC.contains(Point(i[0],i[1]))]
nomesN=[n for n in d['nomes'] if C.contains(Point(n[1],n[2]))]
print('ruas',len(ruasN),'calc',len(calcN),'areas',len(areasN),'lotes',len(lotesN),'ilhas',len(ilhasN),'nomes',len(nomesN))
d2=dict(d, ruas=ruasN, calc=calcN, areas=areasN, lotes=lotesN, ilhas=ilhasN, nomes=nomesN, contorno=[(round(x,1),round(z,1)) for x,z in list(C.exterior.coords)[:-1]])
pickle.dump(d2,open('mapa2.pkl','wb'))
for nm,(x,z) in {'q1':(-325,300),'q2':(-325,318),'q3':(-330,280),'q4':(-318,300)}.items():
    print(nm, 'dentro' if C.contains(Point(x,z)) else 'fora', round(C.exterior.distance(Point(x,z)),1))
