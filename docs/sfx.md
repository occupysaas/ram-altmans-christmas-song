# Sound effects

All effects are synthesised by `scripts/make_sfx.py` (numpy, fixed seed) — no third-party samples, no licence obligations.

| File | Used in | How it is made |
|---|---|---|
| `public/sfx/glass-break.wav` | Shot 32 (the star shatters), 0.6 s after "premium tier" | noise crack + 38 decaying high sine "shards" |
| `public/sfx/knock.wav` | Shot 57, three knocks at `impact.knocks` (the recording has none) | 110/190 Hz decaying thump + filtered noise click |

Mixed by `scripts/finish.sh` at -8 dB under the song.
