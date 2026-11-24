# Stills animatic review (out/animatic.mp4)

**Output:** 1920×1080, 24 fps, H.264 + AAC, 259.600 s (ffprobe). 6231 programme frames. The final 0.7 s fades out (the recording has no closing silence; see the Task 3 ruling).

**Checks run**
- `node --test tests/`: 27/27 pass (lyrics, timing, shots, assets, lyric fitting).
- Sync: 15 sampled words land on sung vocals (`docs/sync-review.md`).
- SFX audible: the glass break adds +4.2 dB in the >2.5 kHz band at 129.6 s; each knock adds +4.4 dB in the <250 Hz band at 218.16 s, compared with the SFX-free programme.
- Contact sheets: `out/sheets/<section>.png`, 8 frames per section, all viewed.

**Working**
- The painted stills are on-model, in the 1960s style, and contain no generated text.
- In-world lyrics land on the painted blanks (screens, banner, scroll, marquee, the Scrooge card) and are readable through the CRT.
- The TV push-in, CRT look, snow, carry-over captions and the TV switch-off all work.

**Known limits of a stills animatic (Phase 2 items)**
- No character motion: the star's spin, fall and shatter (shot 32), the transformation (8), the sleigh crash (48) and the tower collapse (65) are single paintings. The collapse shot shows the tower standing.
- The tower's drum bump, the smoke and spark build-up, and the stash freeze are not in the animatic.
- Some narration lines render small because their painted space is small (e.g. shot 6, "He lived in a tower…").
- In a few shots the lyric box overlaps busy art (shot 43, Ram's hat). Phase 2 can nudge the surfaces per still.
- Carry-over captions sit in a lower-third band and sometimes cross painted detail (e.g. shot 61, the elves' legs).

## Pass 2: cleanup from the 2026-11-24 review (render 2026-11-24)

`out/ram-altman.mp4`: 1920x1080, 24 fps, AAC, 259.600 s. Preview `out/ram-altman-preview.mp4` (24.6 MB). Tests: 78/78.
Plan: `docs/superpowers/plans/2026-11-24-cleanup-pass.md`.

| Note | Shot | Done |
|---|---|---|
| 1 first 33 s S tier | 01-06 | frozen by tests (shots.json + lyric layout fixture) |
| 2 Sam clicks around | 07 | cut-out layers, mouse darts on beats, clicks on snares, cursor + rings, head turn |
| 3 grabs too high | 10 | hands land on the painted items |
| 4 fans | 12 | code fans: blur ghosts, ice-wind lines, crystals, mist, frost rims; boost on kicks; wider camera |
| 6 sad family / small tag | 18 | sobs on alternating beats, tears + splashes, tag drawn 2x |
| 7 text clipping / people | 19 | real font metrics + tag box; shoppers recoil, price sticker flips |
| 8 sleigh + coins | 21, 22 | coin-pouring sleigh over a shop street, SOLD signs; cackle with HA!s |
| 9 vault | 24 | rolling door pushed from the right, RAM spills and piles on the floor |
| 10 store | 25 | generic electronics store, shelf swept bare, girl left behind |
| 12 elves | 30 | top-down, 4 lanes x 4 same-job elves, piston merges each into a 4-armed elf |
| 13 spinner | 31 | big 12-dot spinner over the frozen team |
| 14 star | 32 | camera opens on the star (front ~1.6 s) before the flip |
| 16 AI creature | 35 | new plate + open/shut layers: the whole body chomps |
| 17 carolers | 36 | sway/bob, mouths open on sung words, music notes |
| 18 stamp | 39 | clean plate, 14 panicked runners scatter, 3 flattened; stamps every ~2 beats |
| 19 stairs | 40 | feet on the treads (test), camera shows the staircase |
| 20, 21 reins / deer | 46, 47 | reins end on each deer's harness (test); deer back in 47 |
| bow hands | 63 | hands below the shoulders (test) |
| 23 ending | 65 | tower swells, explodes (boom SFX), RAM rains, townsfolk cheer |

Open for later: in 10 the grabbed item stays painted on the shelf; in 25 the armful is a simple column.
