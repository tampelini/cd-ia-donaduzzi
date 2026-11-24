import numpy as np, math, sys, json, pickle
lab=np.load('lab.npy'); d=pickle.load(open('mapa.pkl','rb')); cls=d['cls']
X0,X1,Y0,Y1=224700,226400,7268760,7270280; RES=0.5
ALFA=0.093; S=0.5
def inv(gx,gz):
    rx=(gx-16)/S; ry=-(gz+85.5)/S
    ca,sa=math.cos(ALFA),math.sin(ALFA)
    dx=rx*ca-ry*sa; dy=rx*sa+ry*ca
    return 225487+dx, 7269747+dy
NOMES={0:'barreira',1:'rua',2:'calcada',3:'lote',4:'area',5:'ilha',6:'fora'}
def tipo(gx,gz):
    X,Y=inv(gx,gz); px=int((X-X0)/RES); py=int((Y1-Y)/RES)
    if not(0<=px<lab.shape[1] and 0<=py<lab.shape[0]): return 'fora-janela'
    l=lab[py,px]
    if l==1 and 1240<px<1460 and py>300: return 'rua(PR)'
    return NOMES[int(cls[l])]
for a in sys.argv[1:]:
    x,z=map(float,a.split(',')); print(a, tipo(x,z))
