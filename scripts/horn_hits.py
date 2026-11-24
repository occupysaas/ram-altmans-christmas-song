#!/usr/bin/env python3
"""Find the intro horn blasts (the staccato run before the first verse) in the Demucs 'other' stem and write
src/timing/horns.json: [seconds, ...]. The 8 bright hits between 28.0 s and 29.4 s (the horn bar before the first verse)."""
import json
import librosa
OFF, DUR = 20.0, 16.0
y, sr = librosa.load('stems/htdemucs/song/other.wav', sr=22050, offset=OFF, duration=DUR)
import numpy as np
# the horn bar is the bright run (spectral centroid > 2800 Hz) of 8 hits right before the vocals; the softer
# mid-range run before it (26.1-28.0 s) is the violins
on = librosa.onset.onset_detect(y=y, sr=sr, units='time', delta=0.1)
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=512)); fr = librosa.fft_frequencies(sr=sr, n_fft=2048)
tt = librosa.frames_to_time(np.arange(S.shape[1]), sr=sr, hop_length=512)
def centroid(t):
    i = np.searchsorted(tt, t + 0.05); sp = S[:, i:i + 4].mean(1); return float((sp * fr).sum() / sp.sum())
hits = [round(OFF + float(t), 3) for t in on if 28.0 <= OFF + t <= 29.4 and centroid(t) > 2800]
json.dump(hits, open('src/timing/horns.json', 'w'))
print(hits)
