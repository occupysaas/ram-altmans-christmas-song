"""Generate AniCraft command batches for the spike shot (54.6s-63.4s of the song)."""
import json, math
FPS=24; T0=54.6; N=212
fr=lambda t: max(0,min(N-1,round((t-T0)*FPS)))
words=[("But",54.95,55.3),("he",55.32,55.48),("never",55.48,55.72),("once",55.72,55.98),("asked",55.98,56.5),
("all",56.5,56.84),("the",56.84,56.96),("folks",56.96,57.26),("down",57.26,57.74),("below,",57.74,58.1),
("Hey,",58.54,59.2),("is",59.4,59.72),("your",59.72,59.92),("little",59.92,60.16),("laptop",60.16,60.68),
("now",60.68,61.3),("running",61.5,62.1),("slow?",62.2,62.86)]
STRESS={"asked","below,","Hey,","laptop","slow?","now"}
B=dict(neck=71,shB=73,elB=74,shF=75,elF=76,hipB=77,knB=78,hipF=79,knF=80)
ARM=72
# ---- character x path (torso pivot x; rest = 140) & state
def xpos(f):
    if f<=70: return 180+(430-180)*f/70
    if f<=150: return 430
    return 430+(780-430)*((f-150)/61)
def sneak_pose(f,ph0=0):
    p=((f-ph0)%24)/24; s=math.sin(2*math.pi*p); sb=math.sin(2*math.pi*(p+.5))
    return dict(hipF=-30*s, knF=10+45*max(0,math.sin(2*math.pi*p+0.7)),
                hipB=-30*sb, knB=10+45*max(0,math.sin(2*math.pi*(p+.5)+0.7)),
                shF=-10+8*sb, elF=-6*s, shB=-6+8*s, elB=-6*sb, neck=3*math.sin(4*math.pi*p)), -9*abs(s)
def pose(f):
    if f<=70: a,dy=sneak_pose(f)
    elif f>=150: a,dy=sneak_pose(f,150)
    else:
        a=dict(hipF=-6,knF=8,hipB=6,knB=8,shF=-10,elF=0,shB=-6,elB=0,neck=0); dy=0
        if 56<=f<92:   # gazing down at the town
            k=min(1,(f-56)/8); a['neck']=14*k; a['shF']=-25*k; a['elF']=-20*k
        if 92<=f<116:  # "Hey!" cackle: rear back
            k=min(1,(f-92)/4); a['neck']=-14*k; dy=-14*k*abs(math.sin((f-92)/3)); a['shF']=-40; a['shB']=-30; a['elF']=-30; a['elB']=-25
        if 116<=f<150: # rubbing hands, scheming
            w=math.sin((f-116)*math.pi/3); a.update(shF=-35+4*w,elF=-35+18*w,shB=-30-4*w,elB=-30-18*w,neck=-4+3*w)
    return a,dy
steps=[]; prev=None
for f in range(0,N,2):
    a,dy=pose(f)
    for k,v in a.items(): steps.append({"command":"bone.pose","params":{"bone":B[k],"angle":round(v,2),"frame":f}})
    tgt=(xpos(f),dy)
    d=(tgt[0]-140,tgt[1]) if prev is None else (tgt[0]-prev[0],tgt[1]-prev[1])
    if abs(d[0])>0.01 or abs(d[1])>0.01:
        steps.append({"command":"bone.pose","params":{"layer":ARM,"dx":round(d[0],2),"dy":round(d[1],2),"frame":f}})
    prev=tgt
# ---- mouth schedule (head symbol internal frames): 0 closed(bmp20) 1 open(81) 2 wide(82)
BMP={0:20,1:81,2:82}
m=[0]*N
for w,s,e in words:
    a,b=fr(s),fr(e); big=2 if w in STRESS else 1
    for f in range(a,max(a+2,b)):
        m[f]= big if ((f-a)//3)%2==0 else (1 if big==2 else 0)
for f in range(92,112): m[f]=2  # cackle
mouth=[]; cur=None
for f,v in enumerate(m):
    if v!=cur: mouth.append((f,v)); cur=v
# ---- lyrics: cumulative text keys
lyr=[]; G=[(0,5),(5,10),(10,15),(15,18)]
for i,(w,s_,e) in enumerate(words):
    gi=[k for k,(a,b) in enumerate(G) if a<=i<b][0]; pair=gi//2*2
    a0,b0=G[pair]; a1,b1=G[pair+1]
    l1=" ".join(x for x,_,_ in words[a0:min(b0,i+1)])
    l2=" ".join(x for x,_,_ in words[a1:i+1]) if i>=a1 else ""
    lyr.append((fr(s_),l1,l2))
camera=[(0,dict(x=440,y=380,zoom=108,rotation=0)),(56,dict(x=500,y=360,zoom=114,rotation=0)),(90,dict(x=520,y=350,zoom=122,rotation=0)),
        (94,dict(x=470,y=330,zoom=165,rotation=-4)),(116,dict(x=470,y=335,zoom=158,rotation=-3)),(150,dict(x=520,y=360,zoom=120,rotation=0)),(211,dict(x=660,y=380,zoom=104,rotation=0))]
json.dump(dict(steps=steps,mouth=mouth,bmp=BMP,lyrics=lyr,camera=camera,N=N),open('spike/work/shot.json','w'))
print(len(steps),'pose steps;',len(mouth),'mouth keys;',len(lyr),'lyric keys')
