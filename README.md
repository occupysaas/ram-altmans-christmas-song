# Ram Altman's Christmas Song

A parody Christmas music video in the style of a 1960s made-for-TV holiday special, playing on an old CRT set. A tech-CEO caricature becomes **Ram Altman**, a Scrooge-type miser who hoards the world's RAM until his overloaded sleigh comes down.

Made by **[Occupy Saas Inc](https://github.com/occupysaas)**. Everything here — the song, the art, the animation code and the pipeline — is open source under the [Apache License 2.0](LICENSE).

- 🎬 **Watch on YouTube:** https://www.youtube.com/watch?v=1pDum04a4V8
- 💼 **LinkedIn post:** https://lnkd.in/p/ej6VhFw8
- 🎧 **Listen:** coming to Spotify, Apple Music and other streaming services soon.
- ⬇️ **Download:** the finished video is attached to the [latest release](../../releases/latest).
- 🎵 **Song:** `Ram Altman's Christmas Song.mp3` (4:20).
- 📝 **Lyrics:** [`docs/lyrics.txt`](docs/lyrics.txt).

> **Parody.** Ram Altman is a fictional cartoon character. This video is satire and commentary. It isn't affiliated with, endorsed by or about the private life of any real person or company.

## How it's made

The video is built in code rather than in an editor. Every shot is a painted still brought to life with cut-out layers, beat-synced motion and on-screen lyrics:

```
song.mp3 ──► stems + beats + lyric timing ──► src/timing/*.json
painted stills + cut-out layers (public/) ─┐
docs/shotlist.yaml + docs/motion.yaml ─────┴─► scripts/build_shots.py ─► src/shots.json
src/ (Remotion + React) ──► out/programme.mp4 (960×720) ──► scripts/finish.py (CRT + TV set) ──► out/ram-altman.mp4 (1080p)
```

| Part | Where |
|---|---|
| Shot list (what's on screen, when, which camera, where the lyrics sit) | `docs/shotlist.yaml` |
| Motion per shot (plates, tower cut-outs, mood lighting, effects) | `docs/motion.yaml` |
| Choreography for each animated shot (puppets, layers, props) | `src/shots/*.ts` |
| Effects: tower bumps, snow, CRT static, whip-pans, explosion | `src/fx/` |
| Lyric layout with real font metrics | `src/layout.ts` |
| Art: stills, plates without characters, cut-out layers, sprites | `public/stills`, `public/plates`, `public/sprites` |
| CRT/TV finish (scanlines, bloom, curvature, TV set frame) | `scripts/finish.py` |
| Design notes and every review round | `docs/design.md`, `docs/review.md` |

### Animation style
- **Stop-motion holds:** motion is held on twos (12 fps poses at 24 fps), like a period TV special.
- **Cut-outs:** characters are separate layers cut from the paintings, so heads bob, arms move and towers bump on the kick drum without redrawing.
- **On the beat:** beats, snares and horn hits come from the song (`src/timing/`), and the choreography keys off them.

### Art
The paintings and cut-out layers were generated with an AI image model (via Codex image generation) from the written briefs in `docs/codex/*.md`. They were then keyed, cut and composited by the scripts here, and hand-fixed where needed. All characters are original designs.

## Build it yourself

You need Node 20+, Python 3.11+, ffmpeg and Chromium.

```bash
npm install
python -m venv .venv && .venv/bin/pip install -r requirements.txt

# the composition reads the song as public/song.wav
ffmpeg -i "Ram Altman's Christmas Song.mp3" public/song.wav

.venv/bin/python scripts/build_shots.py   # docs/*.yaml -> src/shots.json
npm test                                  # node --test tests/
npm run studio                            # preview in Remotion Studio

bash scripts/render.sh                    # -> out/programme.mp4 (960x720)
bash scripts/finish.sh out/ram-altman.mp4 # CRT + TV finish -> 1920x1080
```

`scripts/render.sh` passes `--browser-executable=/usr/bin/chromium`; change it if your Chromium lives somewhere else.

Redoing the timing (stems, beats, lyric alignment) needs the heavier audio packages in `requirements.txt` (Demucs, librosa, faster-whisper): `scripts/stems.sh`, `scripts/analyze.py` and `scripts/force_align.py`.

## Licence

- **This project** (code, song, lyrics, art, video): [Apache License 2.0](LICENSE), © 2026 Occupy Saas Inc. See [NOTICE](NOTICE).
- **Remotion** isn't Apache-licensed. It uses the [Remotion License](https://www.remotion.dev/license), which is free for individuals and companies of up to 3 people; larger companies need a company licence to render.
- **Fonts** in `public/fonts` keep their own licences (SIL OFL 1.1, plus Apache 2.0 for Mountains of Christmas). The licence texts are next to the fonts.
