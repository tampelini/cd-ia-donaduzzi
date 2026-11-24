import pickle, math, json
M,layers,byh=pickle.load(open('ms.pkl','rb'))
H=lambda h: h[-1] if isinstance(h,list) else h
L=lambda o: layers.get(H(o['layer'])) if 'layer' in o else '?'
Z={}
for o in M:
    if o.get('entity')!='HATCH': continue
    l=L(o)
    if not l or not l.startswith('01 '): continue
    for p in o.get('paths',[]):
        pts=[]
        if p.get('polyline_paths'): pts=[q['point'][:2] for q in p['polyline_paths']]
        for s in p.get('segs',[]) or []:
            if 'first_endpoint' in s: pts.append(s['first_endpoint'][:2])
            elif 'start' in s: pts.append(s['start'][:2])
            elif 'center' in s:
                c=s['center']; r=s['radius']; a0=s['start_angle']; a1=s['end_angle']
                for k in range(9): t=a0+(a1-a0)*k/8; pts.append([c[0]+r*math.cos(t), c[1]+r*math.sin(t)])
        if len(pts)>=3:
            Z.setdefault(l,[]).append([[x, y-5000] for x,y in pts])
print({k:len(v) for k,v in Z.items()})
s=[o for o in M if o.get('entity')=='HATCH' and L(o)=='01 SR1 Residencial'][0]['paths'][0]['segs'][0]; print(s)
json.dump(Z,open('zonas.json','w'))
