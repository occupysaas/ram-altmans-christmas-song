import torch,torchaudio,librosa
from torchaudio.pipelines import MMS_FA as bundle
from pathlib import Path
torch.set_num_threads(4)
model=bundle.get_model(with_star=False).eval()
sr=bundle.sample_rate
y,_=librosa.load('stems/htdemucs/song/vocals.wav',sr=sr)
wav=torch.tensor(y).unsqueeze(0)
ems=[]
with torch.inference_mode():
 for pos in range(0,len(y),20*sr):
  a=max(0,pos-2*sr);b=min(len(y),pos+22*sr)
  e,_=model(wav[:,a:b]);fps=e.shape[1]/((b-a)/sr)
  f0=round((pos-a)/sr*fps);n=round(min(20*sr,len(y)-pos)/sr*fps)
  ems.append(e[:,f0:f0+n]);print(pos/sr,flush=True)
torch.save({'emission':torch.log_softmax(torch.cat(ems,dim=1),dim=-1),'duration':len(y)/sr},'src/timing/emission.pt')
assert abs(len(y)/sr-259.6)<0.01, f'unexpected duration {len(y)/sr}'
