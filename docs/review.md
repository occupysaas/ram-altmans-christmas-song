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
