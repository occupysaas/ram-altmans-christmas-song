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

## Pass 3 (render 2026-11-24)

`out/ram-altman.mp4`: 1920x1080, 24 fps, AAC, 259.600 s. Preview 23.0 MB. Tests 102/102.
Plan: `docs/superpowers/plans/2026-11-24-pass-3.md` (+ mid-run requests).

- 0:14 line gap 0.8; 0:18 text 40 still px right; 0:34 hand+mouse 50 px up, under the cuff.
- 0:40 laugh from "memory!" with HA!s; 0:42 stocked shelf taken item by item.
- 1:10 wink sleigh: scrolling sky, rein snaps on beats, whip cracks, wink.
- Towers: cut-out layers bump whole over tower-free plates (20, 23, 28, 49, 52, 54, 56, 60, 62, 65); 54 lowered 150 px.
- 1:25 no coins, SOLD on beats; 1:38 giant bloated vacuum, suction lines, no girl; 1:42 RAM mountain + push-in, "umm, stash" below.
- 2:10 typewriter-register: key clacks, $ flags, floating dollars, DING; drawer glitch removed.
- 2:19 Ram shovels; stuffed mouth spills. 2:33 throne bumps. 2:35 packed square empties, fleeing + AAAH!, no slam bursts. 2:41 family runs off screen.
- 2:58-3:05 RAM falls off the sleigh. 3:12-3:21 elves bob + rope snap / band-aid / box brigade / balloon pop. 3:25 ring around the RAM monument.
- 3:34 windmills, water, calm blackout, chimney smoke. 3:38 door close-up removed. 4:10 HA HA HA. Ending: no dancers.
- Look: game-style bloom on every light; mood darkening lit by each scene's own lights in 07, 10, 18, 19, 24, 25, 26, 36, 51, 54, 60, 62.

## Pass 4 (render 2026-11-24)

`out/ram-altman.mp4`: 1920x1080, 24 fps, AAC, 259.600 s. Preview 23.1 MB. Tests 116/116.
Plan: `docs/superpowers/plans/2026-11-24-pass-4.md`.

- 0:10 cat asleep and breathing, snow only in the window, data center glowing and smoking out there; no indoor snow anywhere.
- 0:14 text up, 0:18 text right, 0:24 horns blow from the tower + smaller/lower text.
- 0:34 Sam's arm from shoulder to the hand on the desk. 0:46 coding: city bounces, eyes squint, hands type, words at the top.
- 0:51 fan text down. 0:55 sideways walk removed: Ram rises into the back shot, slow zoom over both lines. 0:58 girl blinks.
- 1:12 lyric on a twisted-end scroll. 1:17 text down. 1:38 leaf-blower tube opening left. 1:52 text down, lines removed, glow.
- 1:57 elves text on the middle belts. 2:06 star text up. 2:10 register text smaller. 2:48 shock mouth + shaking. 2:53 panic mouth + shaking.
- Mood darkness dialled back (0.28), every tree bulb glows. 3:25 mansion behind the town.

## Pass 5 (render 2026-11-24)

`out/ram-altman.mp4`: 1920x1080, 24 fps, AAC, 259.600 s. Preview 23.0 MB. Tests 122/122.
- 0:26 horns pop out on the first of the 8 intro horn hits (detected in the instrument stem, src/timing/horns.json), blast on each, retract at the verse (0:29.5).
- 0:42 grabs 80 px higher. 1:08 sleigh text 25% smaller. 1:12 scroll at 1.25x covers the tag, bigger text.
- 1:38 tank 45% as wide, no straps; swallowed boxes ride on the curved hose from the spout.
- 2:06 star text 15% smaller, centred on the snow. 3:12 background without painted coins.
- 3:25 mansion on its painted spot at 1.12x (no doubling), behind the town. 4:10 laugh on a clean plate behind the card.
