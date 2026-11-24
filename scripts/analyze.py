"""Stem analysis → src/timing/audio.json.
Needs Demucs stems in stems/htdemucs/song/{drums,bass,other,vocals}.wav (scripts/stems.sh).
  beats   : beat grid times from the full mix
  kicks   : [t, strength] onsets from the drum stem below ~150 Hz
  snares  : [t, strength] onsets from the drum stem 180 Hz-5 kHz (snare/clap)
  hats    : [t, strength] onsets from the drum stem above 6 kHz
  env     : per-video-frame (30 fps) RMS 0..1 for drums, bass, other, vocals
"""
import json
import numpy as np
import librosa

FPS = 24
SR = 22050
HOP = 256
D = 'stems/htdemucs/song'

mix, _ = librosa.load('public/song.wav', sr=SR, mono=True)
dur = len(mix) / SR
n_frames = int(np.ceil(dur * FPS))

tempo, bframes = librosa.beat.beat_track(y=mix, sr=SR, hop_length=HOP, units='frames')
beats = librosa.frames_to_time(bframes, sr=SR, hop_length=HOP)
tempo = float(np.atleast_1d(tempo)[0])

drums, _ = librosa.load(f'{D}/drums.wav', sr=SR, mono=True)
S = np.abs(librosa.stft(drums, n_fft=2048, hop_length=HOP))
freqs = librosa.fft_frequencies(sr=SR, n_fft=2048)

def band_onsets(lo, hi, wait_s, delta):
    band = S[(freqs >= lo) & (freqs < hi)]
    env = librosa.onset.onset_strength(S=librosa.amplitude_to_db(band, ref=np.max), sr=SR, hop_length=HOP)
    # gate by band energy so quiet bleed doesn't count
    energy = band.sum(axis=0)
    energy = energy / (np.percentile(energy, 98) + 1e-9)
    env = env * np.clip(energy[: len(env)], 0, 1.5)
    norm = np.percentile(env[env > 0], 97) if np.any(env > 0) else 1
    env = env / (norm + 1e-9)
    on = librosa.onset.onset_detect(onset_envelope=env, sr=SR, hop_length=HOP, units='frames',
                                    wait=int(wait_s * SR / HOP), delta=delta, pre_max=3, post_max=3, pre_avg=10, post_avg=10)
    # strength = the band's own peak energy just after the onset, relative to the loud hits
    raw = np.array([band[:, f:f + 4].sum(axis=0).max() for f in on]) if len(on) else np.array([])
    raw = raw / (np.percentile(raw, 90) + 1e-9) if len(raw) else raw
    out = [[round(float(librosa.frames_to_time(f, sr=SR, hop_length=HOP)), 3), round(float(min(1.0, v) ** 0.8), 3)] for f, v in zip(on, raw)]
    return [o for o in out if o[1] > 0.12]

kicks = band_onsets(20, 150, 0.12, 0.08)
snares = band_onsets(180, 5000, 0.12, 0.08)
hats = band_onsets(6000, 11000, 0.06, 0.06)

def env_of(name):
    y, _ = librosa.load(f'{D}/{name}.wav', sr=SR, mono=True)
    hop = SR // FPS
    r = librosa.feature.rms(y=y, frame_length=hop * 2, hop_length=hop, center=True)[0]
    r = r / (np.percentile(r, 97) + 1e-9)
    r = np.clip(r, 0, 1)[:n_frames]
    r = np.pad(r, (0, n_frames - len(r)))
    return [round(float(v), 3) for v in r]

out = {
    'fps': FPS, 'duration': round(dur, 3), 'tempo': round(tempo, 2),
    'beats': [round(float(b), 3) for b in beats],
    'kicks': kicks, 'snares': snares, 'hats': hats,
    'env': {k: env_of(k) for k in ['drums', 'bass', 'other', 'vocals']},
}
json.dump(out, open('src/timing/audio.json', 'w'), separators=(',', ':'))
print(f"dur {dur:.1f}s tempo {tempo:.1f} beats {len(beats)} kicks {len(kicks)} snares {len(snares)} hats {len(hats)}")
# drum density per 8s window, to see where the drum line sits
for a in range(0, int(dur), 8):
    k = sum(1 for t, _ in kicks if a <= t < a + 8); s = sum(1 for t, _ in snares if a <= t < a + 8)
    d = np.mean(out['env']['drums'][a * FPS:(a + 8) * FPS]); v = np.mean(out['env']['vocals'][a * FPS:(a + 8) * FPS])
    print(f"{a:4d}s kicks {k:3d} snares {s:3d} drumRMS {d:.2f} voxRMS {v:.2f}")
