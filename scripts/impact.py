"""Stop points → src/timing/impact.json (times in seconds).
The recording differs from the lyric sheet's stage notes (measured, see docs/sync-review.md):
  stash   : no full music stop exists; the freeze is the breath between "his..." and the whispered "umm"
            (= end of the word "his...").
  knocks  : no audible knocks; the drums stop at the last drum onset before "Merry Christmas", and three
            knock SFX are placed evenly in the gap between that drum stop and "Merry" (finished in SFX mix).
  silence : the recording has no closing silence; this is the end of "Scrooge!", after which only the
            instrumental tail plays to 259.6 s. The tower collapse plays over that tail.
"""
import json
a = json.load(open('src/timing/lyrics-aligned.json'))
au = json.load(open('src/timing/audio.json'))
words = [w for l in a for w in l['words']]
his = next(i for i, w in enumerate(words) if w['w'].lower().startswith('umm')) - 1
stash = words[his]['e']
merry = next(l for l in a if l['text'].startswith('Merry Christmas'))['start']
drum_stop = max(t for t, _ in au['kicks'] + au['snares'] if t < merry) + 0.15
gap = merry - drum_stop; knocks = [round(drum_stop + gap * k, 3) for k in (0.1, 0.4, 0.7)]
silence = a[-1]['words'][-1]['e']
out = {'stash': round(stash, 3), 'knocks': knocks, 'silence': round(silence, 3), 'drumStop': round(drum_stop, 3)}
json.dump(out, open('src/timing/impact.json', 'w'), indent=1); print(out)
