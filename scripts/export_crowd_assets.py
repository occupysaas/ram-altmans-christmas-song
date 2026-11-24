#!/usr/bin/env python3
"""Extract the reviewed ImageGen sheets, key magenta, and write rig metadata."""
import json
import shutil
import tempfile
from pathlib import Path

from PIL import Image, ImageOps
from key_magenta import key_magenta

def save_image(image, destination):
    temporary = destination.with_name(destination.stem + '.export-tmp.png')
    image.save(temporary)
    temporary.replace(destination)

def save_json(destination, data):
    temporary = destination.with_suffix('.export-tmp.json')
    temporary.write_text(json.dumps(data,indent=2)+'\n')
    temporary.replace(destination)

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/home/thomas/.codex/generated_images/01a20bf4-e5f4-7d42-87fc-2a6575a2df4f')
SHEETS = ROOT / 'out/sheets'
SHEETS.mkdir(parents=True, exist_ok=True)
FILES = {
    'dad': '9b846bdd-4543-42c6-82de-4226f16856f3',
    'mum': '6f855e47-d605-4e61-8262-6004838a6435',
    'kid1': 'e4755b5a-a17d-4d57-a6d7-43df4300f688',
    'kid2': '1143e260-7364-4f8d-9940-bb0f137aade7',
    'elf': 'd79d86d0-4388-4a82-a5c2-5ae615fa6ba2',
    'props': 'd181bf5c-5465-484e-8673-4cc360f6c544',
    'plate40': '0e4fa061-6ba8-4bc4-984a-11ede8e3dc81',
    'plate49': '3de6fde8-7022-42fc-8a38-39f1f3c44add',
    'plate61': 'a3191262-ec78-4fa6-bbc2-83ad1b27b5e0',
    'elf-worried': '9bff4719-6f68-4ae5-87e5-f0fde2428465',
    'lantern': '8a39bd41-65c3-427e-81ba-634a37bad630',
}
for name, identifier in FILES.items():
    target=SHEETS / f'crowd-{name}.png'
    try:
        with Image.open(target) as candidate: candidate.verify()
    except (OSError, SyntaxError):
        temporary=target.with_suffix('.copy-tmp.png')
        temporary.write_bytes((SOURCE / f'exec-{identifier}.png').read_bytes())
        temporary.replace(target)

def extract(image, rect, dest, height=None, width=None, glow=False):
    """Crop cells, use project's keyer, resize proportionally, retain 10px margin."""
    with tempfile.TemporaryDirectory() as tmp:
        raw, keyed = Path(tmp)/'raw.png', Path(tmp)/'keyed.png'
        image.crop(rect).save(raw)
        key_magenta(raw, keyed, margin=0, preserve_purple=not glow, warm_glow=glow)
        part = Image.open(keyed).convert('RGBA')
        if height:
            part = part.resize((round(part.width*(height-20)/part.height), height-20), Image.Resampling.LANCZOS)
        elif width:
            part = part.resize((width-20, round(part.height*(width-20)/part.width)), Image.Resampling.LANCZOS)
        part = ImageOps.expand(part, border=10, fill=(0,0,0,0))
        dest.parent.mkdir(parents=True, exist_ok=True)
        save_image(part,dest)
        return part

def preview(paths, dest, cols=3, cell=(360,420)):
    rows=(len(paths)+cols-1)//cols
    canvas=Image.new('RGB',(cols*cell[0], rows*cell[1]), '#dedbd3')
    for i,path in enumerate(paths):
        im=Image.open(path).convert('RGBA')
        im.thumbnail((cell[0]-30,cell[1]-30),Image.Resampling.LANCZOS)
        canvas.paste(im,((i%cols)*cell[0]+(cell[0]-im.width)//2,(i//cols)*cell[1]+(cell[1]-im.height)//2),im)
    save_image(canvas,dest)

names=['torso','head-happy','head-worried','hand-near-open','hand-far-open','hand-near-grab','foot-near','foot-far']
config={
    'dad': (600,350,150,240, '#37646a','#2c5055', '#37646a','#2c5055',420,590),
    'mum': (560,330,140,215, '#bb3b2b','#942f23', '#b6a3b0','#91828d',360,460),
    'kid1':(360,280,105,160, '#c74432','#9d3628', '#c74432','#9d3628',240,285),
    'kid2':(360,280,105,160, '#ac91c1','#89749a', '#ac91c1','#89749a',240,285),
    'elf': (330,300,110,180, '#abb855','#899345', '#b63827','#912d1f',230,280),
}
row_bounds={'dad':[0,490,815,1086],'mum':[0,460,760,1024],
            'kid1':[0,450,790,1086],'kid2':[0,430,760,1024],
            'elf':[0,425,715,1024]}
for actor, (torsoh,headh,handw,footw,sleeve,sleevefar,leg,legfar,armlen,leglen) in config.items():
    sheet=Image.open(SHEETS/f'crowd-{actor}.png')
    folder=ROOT/'public/puppets'/actor
    actor_names=names.copy()
    if actor=='elf': actor_names[2]='head-focus'; actor_names.append('hand-near-box')
    metadata={}
    for i,name in enumerate(actor_names):
        col,row=i%3,i//3
        rect=(round(col*sheet.width/3), row_bounds[actor][row],round((col+1)*sheet.width/3),row_bounds[actor][row+1])
        path=folder/f'{name}.png'
        part=extract(sheet,rect,path,height=torsoh if name=='torso' else headh if name.startswith('head') else None,width=footw if name.startswith('foot') else handw*2 if name=='hand-near-box' else handw if name.startswith('hand') else None)
        w,h=part.size
        entry={'size':[w,h]}
        point=lambda x,y:[round(10+(w-20)*x),round(10+(h-20)*y)]
        if name=='torso':
            entry.update(neck=point(.53,.05),shoulderNear=point(.36,.19),shoulderFar=point(.72,.19),hipNear=point(.60,.91),hipFar=point(.38,.91))
        elif name.startswith('head'): entry['neck']=point(.49 if actor=='dad' else .59 if actor=='mum' else .51 if actor=='kid1' else .60 if actor=='kid2' else .56,.97)
        elif name.startswith('hand'): entry['wrist']=point(.04,.57 if name!='hand-near-box' else .26)
        else: entry['ankle']=point(.29,.10)
        metadata[name]=entry
    if actor=='elf':
        im=Image.open(SHEETS/'crowd-elf-worried.png')
        part=extract(im,(0,0,*im.size),folder/'head-worried.png',height=headh)
        metadata['head-worried']={'size':list(part.size),'neck':[round(10+(part.width-20)*.56),part.height-18]}
    metadata['_rig']={'armLen':armlen,'legLen':leglen,'armW':max(24,round(torsoh*.085)),'legW':max(26,round(torsoh*.09)),'reach':round(armlen*.85),'hipHeight':leglen,'lift':round(leglen*.3),'colors':{'sleeve':sleeve,'sleeveFar':sleevefar,'leg':leg,'legFar':legfar,'ink':'#17121c'}}
    save_json(folder/'parts.json',metadata)
    preview([folder/f'{n}.png' for n in metadata if n!='_rig'],folder/'preview.png')

folder=ROOT/'public/sprites/props'
data=json.loads((folder/'props.json').read_text())
sheet=Image.open(SHEETS/'crowd-props.png')
for i,name in enumerate(['lantern','box','box-open']):
    left,right=[(0,650),(700,1350),(1380,2172)][i]
    source=Image.open(SHEETS/'crowd-lantern.png') if name=='lantern' else sheet
    rect=(0,0,*source.size) if name=='lantern' else (left,0,right,sheet.height)
    part=extract(source,rect,folder/f'{name}.png',height=360 if name=='lantern' else None,width=None if name=='lantern' else 430,glow=name=='lantern')
    w,h=part.size
    data[name]={'size':[w,h],'grip':[round(w*.48),round(h*.18)] if name=='lantern' else [round(w*.24),round(h*.5)]}
save_json(folder/'props.json',data)
preview([folder/f'{name}.png' for name in ['lantern','box','box-open']],folder/'preview.png',cols=3,cell=(360,420))

plates=ROOT/'public/plates'
for shot in [40,49,61]:
    im=Image.open(SHEETS/f'crowd-plate{shot}.png').convert('RGB')
    save_image(ImageOps.fit(im,(1600,1200),method=Image.Resampling.LANCZOS),plates/f'{shot}.png')
preview([plates/f'{shot}.png' for shot in [40,49,61]],SHEETS/'plates-crowd.png',cols=3,cell=(640,480))
