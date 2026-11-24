/** Rhubarb mouth cues for the spoken ending. Lines 46-47 belong to the girl, line 48 to Ram. Cue times are local
 *  to each line's clip, which starts 0.1 s before the aligned line start (see the rhubarb run in docs). */
import lyrics from './timing/lyrics-aligned.json' with {type: 'json'};
import c46 from './timing/rhubarb/line46.json' with {type: 'json'};
import c47 from './timing/rhubarb/line47.json' with {type: 'json'};
import c48 from './timing/rhubarb/line48.json' with {type: 'json'};

type Cue = {start: number; end: number; value: string};
const PAD = 0.1;
const SPANS: {who: 'girl' | 'ram'; from: number; to: number; cues: Cue[]}[] = [
  {who: 'girl', from: lyrics[46].start - PAD, to: lyrics[46].end + 0.15, cues: c46.mouthCues},
  {who: 'girl', from: lyrics[47].start - PAD, to: Math.min(lyrics[47].end + 0.15, lyrics[48].start), cues: c47.mouthCues},   // ends when Ram starts
  {who: 'ram', from: lyrics[48].start - PAD, to: lyrics[48].end + 0.15, cues: c48.mouthCues},
];
export function mouthAt(who: 'girl' | 'ram', t: number): string {
  const sp = SPANS.find(s => s.who === who && t >= s.from && t < s.to);
  if (!sp) return 'X';
  const lt = t - sp.from, c = sp.cues.find(c => lt >= c.start && lt < c.end);
  return c ? c.value : 'X';
}
