import sys
exec(open('checar.py').read().split("for a in sys.argv")[0])
def faixas(fix, eixo, a0, a1):
    out=[]; cur=None
    for v in range(a0,a1):
        t=tipo(fix,v) if eixo=='z' else tipo(v,fix)
        r=t.startswith('rua')
        if r and cur is None: cur=v
        if not r and cur is not None: out.append((cur,v-1)); cur=None
    if cur is not None: out.append((cur,a1))
    return [f for f in out if f[1]-f[0]>=4]
for a in sys.argv[1:]:
    e,f=a.split('=') ; f=float(f)
    if e=='x': print('x=',f,'ruas em z:',faixas(f,'z',-340,420))
    else: print('z=',f,'ruas em x:',faixas(f,'x',-390,480))
