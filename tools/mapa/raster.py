import pickle, math, numpy as np, cv2, collections
M,layers,byh=pickle.load(open('ms.pkl','rb'))
H=lambda h: h[-1] if isinstance(h,list) else h
L=lambda o: layers.get(H(o['layer'])) if 'layer' in o else '?'
X0,X1,Y0,Y1=224700,226400,7268760,7270280
RES=0.5
W=int((X1-X0)/RES); Hh=int((Y1-Y0)/RES)
px=lambda x,y:(int(round((x-X0)/RES)), int(round((Y1-y)/RES)))
BAR={'TX-FF','TX-F','MEIO-FIO','T-ESTRADA','DELIMITAÇÃO CHÁCARA','LOTES','01-lotes','TX-M','TX-GM','PROJEÇÃO'}
img=np.zeros((Hh,W),np.uint8)
def arcpts(c,r,a0,a1):
    if a1<a0: a1+=2*math.pi
    n=max(6,int((a1-a0)*r/1.0)); return [(c[0]+r*math.cos(a0+(a1-a0)*i/n), c[1]+r*math.sin(a0+(a1-a0)*i/n)) for i in range(n+1)]
def bulge_pts(p,b,closed):
    out=[]; n=len(p); m=n if closed else n-1
    for i in range(m):
        a=p[i]; c=p[(i+1)%n]; bb=b[i] if i<len(b) else 0
        out.append(a)
        if abs(bb)>1e-6:
            th=4*math.atan(bb); ch=math.dist(a,c)
            if ch<1e-6: continue
            r=ch/(2*math.sin(abs(th)/2)); mx,my=(a[0]+c[0])/2,(a[1]+c[1])/2; dx,dy=(c[0]-a[0])/ch,(c[1]-a[1])/ch
            h=math.sqrt(max(r*r-ch*ch/4,0))*(1 if bb>0 else -1)*(1 if abs(th)<math.pi else -1)
            cx,cy=mx-dy*h,my+dx*h
            a0=math.atan2(a[1]-cy,a[0]-cx); a1=math.atan2(c[1]-cy,c[0]-cx)
            if bb>0:
                if a1<a0: a1+=2*math.pi
            else:
                if a1>a0: a1-=2*math.pi
            k=max(4,int(abs(a1-a0)*r)); 
            for j in range(1,k): t=a0+(a1-a0)*j/k; out.append((cx+r*math.cos(t),cy+r*math.sin(t)))
    if not closed: out.append(p[-1])
    else: out.append(p[0])
    return out
geo=collections.defaultdict(list)
for o in M:
    l=L(o); t=o.get('entity')
    try:
        if t=='LINE': s=[o['start'][:2],o['end'][:2]]
        elif t=='LWPOLYLINE':
            p=[q[:2] for q in o['points']]; cl=bool(o.get('flag',0)&1)
            s=bulge_pts(p,o.get('bulges') or [],cl)
        elif t=='ARC': s=arcpts(o['center'],o['radius'],o['start_angle'],o['end_angle'])
        elif t=='CIRCLE': s=arcpts(o['center'],o['radius'],0,2*math.pi)
        else: continue
    except Exception as e: continue
    if not any(X0<=x<=X1 and Y0<=y<=Y1 for x,y in s): continue
    geo[l].append(s)
    if l in BAR:
        pts=np.array([px(x,y) for x,y in s],np.int32)
        cv2.polylines(img,[pts],False,255,2)
pickle.dump(dict(geo),open('geo.pkl','wb'))
cv2.imwrite('/home/claude/shots/bar.png',img[::2,::2])
np.save('bar.npy',img)
print(W,Hh,{k:len(v) for k,v in geo.items()})
