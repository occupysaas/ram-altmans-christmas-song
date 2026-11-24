#!/usr/bin/env python3
"""Find the intro horn blasts (the staccato run before the first verse) in the Demucs 'other' stem and write
src/timing/horns.json: [seconds, ...]. Onsets between 25.9 s and 28.6 s (the run the user means: 7-8 blasts)."""
import json
import librosa
OFF, DUR = 18.0, 12.0
y, sr = librosa.load('stems/htdemucs/song/other.wav', sr=22050, offset=OFF, duration=DUR)
on = librosa.onset.onset_detect(y=y, sr=sr, units='time', delta=0.2)
hits = [round(OFF + float(t), 3) for t in on if 25.9 <= OFF + t <= 28.6]
json.dump(hits, open('src/timing/horns.json', 'w'))
print(hits)
