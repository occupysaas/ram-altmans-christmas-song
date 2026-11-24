/** "Bob and sway" (the user's dance rule for 2D characters):
 *  - bob: on every tick (beat) the body dips and springs back before the next beat;
 *  - sway: a lean that travels one way over 4 ticks (a bar) and back over the next 4, changing direction on the downbeat.
 *  Active in the verses and the bridge (per-shot override available). Pure and testable. */
import audio from '../timing/audio.json' with {type: 'json'};
import sections from '../timing/sections.json' with {type: 'json'};

const beats: number[] = audio.beats;
const kicks: number[][] = audio.kicks;

/** Which beat index mod 4 is the bar's downbeat: the one with the most kick energy on it. */
export const DOWNBEAT_OFFSET = (() => {
  const score = [0, 0, 0, 0];
  let j = 0;
  beats.forEach((b, i) => {
    while (j < kicks.length && kicks[j][0] < b - 0.07) j++;
    if (j < kicks.length && Math.abs(kicks[j][0] - b) <= 0.07) score[i % 4] += kicks[j][1];
  });
  return score.indexOf(Math.max(...score));
})();

const GROOVE_SECTIONS = new Set(['Verse 1', 'Verse 2', 'Bridge']);

function beatAt(t: number) {
  let lo = 0, hi = beats.length - 1, k = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (beats[m] <= t) { k = m; lo = m + 1; } else hi = m - 1; }
  if (k < 0) return {i: -1, phase: 0};
  const next = beats[k + 1] ?? beats[k] + (beats[k] - beats[k - 1]);
  return {i: k, phase: Math.min(1, (t - beats[k]) / (next - beats[k]))};
}

/** bob: 1 on the beat → 0 just before the next; sway: −1..1, a half-cycle per bar. */
export function groove(t: number, override?: boolean) {
  const sec = sections.find(s => t >= s.start && t < s.end);
  const active = override ?? (sec ? GROOVE_SECTIONS.has(sec.name) : false);
  const {i, phase} = beatAt(t);
  if (i < 0) return {active, bob: 0, sway: 0};
  const bob = (1 - phase) ** 2;
  const barPos = (i - DOWNBEAT_OFFSET + phase) / 4;          // bars since the reference downbeat
  const sway = Math.sin(Math.PI * barPos);                     // changes direction on every downbeat
  return {active, bob, sway};
}
