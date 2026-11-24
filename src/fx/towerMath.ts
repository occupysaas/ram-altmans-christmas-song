/** Tower motion maths (pure, testable). Times in seconds. */
import audio from '../timing/audio.json' with {type: 'json'};
import impact from '../timing/impact.json' with {type: 'json'};

type Hit = [number, number];
const DECAY = 0.12; // s; at 24 fps the first frame after a kick keeps >= 70% of the peak

export const bumpAmp = (stage: number) => 0.02 + 0.01 * stage;

/** Latest event at or before t (binary search); events are sorted by time. */
function latest(events: Hit[], t: number): number {
  let lo = 0, hi = events.length - 1, k = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (events[m][0] <= t) { k = m; lo = m + 1; } else hi = m - 1; }
  return k < 0 ? -Infinity : events[k][0];
}

/** Scale add-on from the most recent kick only (never stacks). */
export function towerBump(t: number, stage: number, kicks: Hit[] = audio.kicks as Hit[]): number {
  const k = latest(kicks, t);
  return k === -Infinity ? 0 : bumpAmp(stage) * Math.exp(-(t - k) / DECAY);
}

/** Window flash 0..0.25 on snares. */
export function towerFlash(t: number, snares: Hit[] = audio.snares as Hit[]): number {
  const k = latest(snares, t);
  return k === -Infinity ? 0 : 0.25 * Math.exp(-(t - k) / 0.1);
}

/** Slow growth over the whole song: 0 → 0.12 by the ending, never decreasing. */
export function towerGrowth(t: number): number {
  return 0.12 * Math.min(1, Math.max(0, t / impact.silence));
}
