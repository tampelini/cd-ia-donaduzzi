import numpy as np, cv2, json, math, pickle, re
from shapely.geometry import Point, Polygon
img=np.load('bar.npy'); lab=np.load('lab.npy'); mx=np.load('mx.npy'); area=np.load('area.npy')
X0,X1,Y0,Y1=224700,226400,7268760,7270280; RES=0.5
Hh,W=img.shape
S=0.5
ALFA=0.093; CA,SA=math.cos(-ALFA),math.sin(-ALFA)
def G(X,Y):
    dx,dy=X-225487,Y-7269747; rx,ry=dx*CA-dy*SA, dx*SA+dy*CA
    return (round(16+rx*S,2), round(-85.5-ry*S,2))
def PX(px,py): return (X0+px*RES, Y1-py*RES)
def gp(px,py): return G(*PX(px,py))
n=len(area); free=(img==0)
mxm=mx*RES
# ---- classificação
cls=np.zeros(n,np.uint8)  # 0 barreira,1 rua,2 calcada,3 lote,4 area,5 ilha,6 fora
stats=cv2.connectedComponentsWithStats(free.astype(np.uint8),connectivity=4)[2]
for i in range(1,n):
    a=area[i]; m=mxm[i]
    if i==1: cls[i]=6; continue
    if m<2.0: cls[i]=2; continue
    ratio=a/(math.pi*max(m,0.1)**2)
    if a>2500 and m<26 and ratio>12: cls[i]=1; continue
    if a<3000 and ratio<1.45: cls[i]=5; continue
    if a<1800: cls[i]=3; continue
    cls[i]=4
# PR-182: faixa do "fora" dentro do corredor
C=cls[lab]
rua=(C==1)
cols=np.arange(W)[None,:]; rows=np.arange(Hh)[:,None]
corr=(lab==1)&(cols>1240)&(cols<1460)&(rows>300)
rua|=corr
print('classes', np.bincount(cls,minlength=7))
# fechar frestas (linhas de 2px entre faixas da mesma rua)
k=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(5,5))
ruaM=cv2.morphologyEx(rua.astype(np.uint8)*255,cv2.MORPH_CLOSE,k)
def contornos(mask, eps=1.0, minA=40):
    cs,hier=cv2.findContours(mask,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_SIMPLE)
    out=[]
    if hier is None: return out
    hier=hier[0]
    for i,c in enumerate(cs):
        if hier[i][3]!=-1: continue
        if cv2.contourArea(c)<minA: continue
        ext=cv2.approxPolyDP(c,eps,True)[:,0]
        holes=[]; j=hier[i][2]
        while j!=-1:
            if cv2.contourArea(cs[j])>=minA: holes.append(cv2.approxPolyDP(cs[j],eps,True)[:,0])
            j=hier[j][0]
        out.append([[gp(*p) for p in ext]]+[[gp(*p) for p in h] for h in holes])
    return out
ruas=contornos(ruaM,1.2,60)
calcM=cv2.dilate(((C==2)*255).astype(np.uint8),np.ones((5,5),np.uint8)); calcM[ruaM>0]=0
calc=contornos(calcM,1.2,30)
print('ruas',len(ruas),sum(len(r[0]) + sum(len(h) for h in r[1:]) for r in ruas),'calc',len(calc))
# ---- zonas
Z=json.load(open('zonas.json'))
zpol=[]
for k,v in Z.items():
    t={'01 SU1 Universitario':'univ','01 SU2 Universitario':'univ','01 SR1 Residencial':'resid','01 SR2 Residencial':'resid','01 SCS2 Com. Serv. 2':'com','01 SCS1 Com. Serv. 1':'com'}[k]
    for p in v:
        try: P=Polygon(p).buffer(0); zpol.append((t,P))
        except: pass
def zona(X,Y):
    pt=Point(X,Y)
    for t,P in zpol:
        if P.contains(pt): return t
    if X>225480: return 'univ'
    if Y>7269420: return 'com'
    return 'ind'
# ---- lotes (retângulo mínimo de cada componente)
lotes=[]; areas=[]; ilhas=[]
ys,xs=np.nonzero(lab>0)
order=np.argsort(lab[ys,xs]); L_=lab[ys,xs][order]; ys=ys[order]; xs=xs[order]
idx=np.r_[0,np.flatnonzero(np.diff(L_))+1,len(L_)]
for a,b in zip(idx[:-1],idx[1:]):
    i=L_[a]; c=cls[i]
    if c not in (3,4,5): continue
    pts=np.stack([xs[a:b],ys[a:b]],1).astype(np.float32)
    if c==5:
        x0b,y0b=max(0,xs[a:b].min()-8),max(0,ys[a:b].min()-8); x1b,y1b=min(W,xs[a:b].max()+9),min(Hh,ys[a:b].max()+9)
        sub=np.zeros((y1b-y0b,x1b-x0b),np.uint8); sub[ys[a:b]-y0b,xs[a:b]-x0b]=1
        anel=cv2.dilate(sub,np.ones((11,11),np.uint8))-cv2.dilate(sub,np.ones((5,5),np.uint8))
        fr=(ruaM[y0b:y1b,x0b:x1b][anel>0]>0).mean() if anel.any() else 0
        if fr>0.5:
            (cx,cy),r=cv2.minEnclosingCircle(pts); X,Y=PX(cx,cy); g=G(X,Y); ilhas.append([g[0],g[1],round(r*RES*S,2)]); continue
        c=3
    if c==3:
        rect=cv2.minAreaRect(pts); (cx,cy),(w,h),ang=rect; X,Y=PX(cx,cy); g=G(X,Y)
        bp=[gp(*q) for q in cv2.boxPoints(((cx,cy),(w+1.5,h+1.5),ang))]
        gw=math.dist(bp[0],bp[1]); gh=math.dist(bp[1],bp[2]); ga=math.atan2(bp[1][1]-bp[0][1],bp[1][0]-bp[0][0])
        fino=min(w,h)*RES<4.5 or max(w,h)/max(min(w,h),1)>7
        lotes.append([g[0],g[1],round(gw,2),round(gh,2),round(ga,3),'canteiro' if fino else zona(X,Y)])
    if c==4:
        m=np.zeros((stats[i,3]+4,stats[i,2]+4),np.uint8); ox,oy=stats[i,0]-2,stats[i,1]-2
        m[ys[a:b]-oy,xs[a:b]-ox]=255
        m=cv2.dilate(m,np.ones((3,3),np.uint8))
        cs,_=cv2.findContours(m,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE); c0=max(cs,key=cv2.contourArea)
        poly=[gp(p[0]+ox,p[1]+oy) for p in cv2.approxPolyDP(c0,1.5,True)[:,0]]
        X,Y=PX(*cv2.minAreaRect(pts)[0])
        areas.append({'p':poly,'a':round(float(area[i])),'c':[*G(X,Y)],'z':zona(X,Y)})
print('lotes',len(lotes),'areas',len(areas),'ilhas',len(ilhas))
pickle.dump(dict(ruas=ruas,calc=calc,lotes=lotes,areas=areas,ilhas=ilhas,cls=cls),open('mapa.pkl','wb'))
