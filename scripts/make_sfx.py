"""Synthesise the sound effects (deterministic, no third-party samples) → public/sfx/*.wav, 44.1 kHz stereo."""
import numpy as np, wave
SR = 44100
rng = np.random.default_rng(1225)
def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    st = np.stack([x, np.roll(x, 37)], 1)  # slight stereo spread
    with wave.open(f'public/sfx/{name}.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype('<i2').tobytes())
t = np.arange(int(SR * 1.6)) / SR
# glass break: a sharp noise crack, then a shower of decaying high pings (shards) and a tinkle tail
crack = rng.standard_normal(t.size) * np.exp(-t * 40)
crack = np.convolve(crack, np.array([1, -0.95]), 'same')  # high-pass-ish
pings = np.zeros_like(t)
for _ in range(38):
    t0 = abs(rng.normal(0.03, 0.18)); f = rng.uniform(2800, 9000); d = rng.uniform(25, 60)
    m = t >= t0; pings[m] += rng.uniform(0.2, 1) * np.sin(2 * np.pi * f * (t[m] - t0)) * np.exp(-(t[m] - t0) * d)
save('glass-break', crack * 1.2 + pings * 0.6)
# knock: knuckle on a heavy wooden door — a low thump plus a short woody click
t = np.arange(int(SR * 0.35)) / SR
thump = np.sin(2 * np.pi * 110 * t) * np.exp(-t * 28) + 0.5 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 40)
click = rng.standard_normal(t.size) * np.exp(-t * 260)
click = np.convolve(click, np.ones(6) / 6, 'same')
save('knock', thump + click * 0.8)
print('ok')
# boom: the tower exploding — a sub-bass thump, a crackling low noise burst and a long rumbling tail
t = np.arange(int(SR * 3.0)) / SR
rng = np.random.default_rng(7)
sub = np.sin(2 * np.pi * (55 * np.exp(-t * 1.5) + 28) * t) * np.exp(-t * 2.2)
noise = rng.standard_normal(t.size)
low = np.convolve(noise, np.ones(40) / 40, mode='same') * np.exp(-t * 1.6) * 3.0
crack = noise * np.exp(-t * 18) * 0.6
save('boom', np.tanh(1.6 * (sub * 1.1 + low + crack)) * 0.9)
# ding: an old cash-register bell — two bright partials with a long shimmering decay
t = np.arange(int(SR * 1.6)) / SR
bell = np.sin(2 * np.pi * 1760 * t) * np.exp(-t * 3.2) + 0.5 * np.sin(2 * np.pi * 2640 * t) * np.exp(-t * 4.5) + 0.25 * np.sin(2 * np.pi * 4410 * t) * np.exp(-t * 8)
save('ding', bell * 0.55)

