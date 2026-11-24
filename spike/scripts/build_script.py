import json
S=json.load(open('spike/work/shot.json')); N=S['N']
st=[]; add=lambda c,**p: st.append({"command":c,"params":p})
# extend every scene layer to N frames (currently 192)
add("timeline.insert_frame",layers=[3,36,39,72],frame=191,count=N-192)
# parallax depths
add("layer.set_depth",layer=3,depth=160); add("layer.set_depth",layer=36,depth=-90); add("layer.set_depth",layer=39,depth=-140)
# head symbol: internal mouth timeline
add("symbol.edit",symbol=44)
add("timeline.insert_frame",layer=45,frame=2,count=N-3)
keys=dict(S['mouth'])
for f in (0,1,2): keys.setdefault(f, max([v for k,v in S['mouth'] if k<=f]))
for f,v in sorted(keys.items(), key=lambda kv:int(kv[0])):
    f=int(f)
    if f>2: add("timeline.insert_keyframe",layer=45,frame=f)
    add("timeline.goto",frame=f); add("element.select",ids=[22]); add("element.swap_bitmap",bitmap=S['bmp'][str(v)])
add("symbol.exit",all=True); add("symbol.set_kind",kind="movie_clip",symbol=44)
# lyric layer just above the background, same depth so it sits on the window glass
add("layer.select",layer=3); add("layer.new",name="lyrics"); add("layer.set_depth",depth=160)
for f,l1,l2 in S['lyrics']:
    add("timeline.insert_blank_keyframe",frame=f); add("timeline.goto",frame=f)
    add("text.create",text=l1,x=250,y=118,width=470,font="C059",size=26,bold=True,italic=True,color="#fdf6e3",align="center")
    if l2: add("text.create",text=l2,x=250,y=152,width=470,font="C059",size=26,bold=True,italic=True,color="#ffd75e",align="center")
lastf=S['lyrics'][-1][0]; add("timeline.insert_frame",frame=lastf,count=N-1-lastf)
# camera
add("camera.add")
for f,c in S['camera']:
    if f>0: add("timeline.insert_keyframe",frame=f)
    add("camera.set",frame=f,**c)
for f,c in S['camera'][:-1]: add("timeline.create_tween",frame=f,easing={"bezier":[0.42,0,0.58,1]})
# bone poses
st+=S['steps']
add("timeline.goto",frame=0)
json.dump(st,open('spike/work/run.json','w'))
print(len(st),'steps')
