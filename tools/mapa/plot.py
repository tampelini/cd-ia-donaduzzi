import pickle, sys
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
out=pickle.load(open('segs.pkl','rb'))
M,layers,byh=pickle.load(open('ms.pkl','rb'))
H=lambda h: h[-1] if isinstance(h,list) else h
L=lambda o: layers.get(H(o['layer'])) if 'layer' in o else '?'
x0,x1,y0,y1=map(float,sys.argv[1:5]); fn=sys.argv[5]; txt=len(sys.argv)>6
cores={'TX-FF':'#555','TX-F':'#c33','COTAS':'#aaa','Cota':'#bbb','SINALIZAÇÃO HORIZONTAL':'#e90','TEXT-AREAS':'#39c','DELIMITAÇÃO CHÁCARA':'#2a2','RIO_PERENE':'#06f','Arroio Guaçu':'#06f','SANGA':'#06f','T-ESTRADA':'#000','MEIO-FIO':'#000','HACH- APP':'#0a0','Vegetação':'#0a0','01-lotes':'#a0a','LOTES':'#a0a'}
W=(x1-x0); Hh=(y1-y0); f=plt.figure(figsize=(16,16*Hh/W)); ax=f.add_axes([0,0,1,1]); ax.set_xlim(x0,x1); ax.set_ylim(y0,y1); ax.set_aspect('equal'); ax.axis('off')
for l,ss in out.items():
    ss=[s for s in ss if any(x0<=p[0]<=x1 and y0<=p[1]<=y1 for p in s)]
    if not ss: continue
    ax.add_collection(LineCollection(ss, colors=cores.get(l,'#888'), linewidths=0.6 if l in cores else 0.3))
if txt:
    for o in M:
        if o.get('entity') in ('TEXT','MTEXT'):
            p=o.get('ins_pt'); t=(o.get('text_value') or o.get('text') or '')
            if p and x0<=p[0]<=x1 and y0<=p[1]<=y1 and len(t)<60:
                import re; t=re.sub(r'\\[A-Za-z][^;]*;|[{}]|\\P',' ',t).strip()
                ax.text(p[0],p[1],t,fontsize=6,color='#b00')
f.savefig(fn,dpi=110)
