/** GPU fan spin (shot 12): base 1.1 turns/s, kicked to 1.6 for ~0.2 s after each kick. Returns turns (angle/360).
 *  Kept under ~1.7 turns/s so a 7-blade rotor (51° apart) never steps more than half a blade per 24 fps frame,
 *  which would strobe it backwards; motion-blur ghosts, speed lines and frost sell the speed. */
import audio from '../timing/audio.json' with {type: 'json'};
const kicks: number[] = (audio.kicks as number[][]).map(k => k[0]);
const BASE = 1.1, BOOST = 0.5, HOLD = 0.2;

export function fanSpin(t: number): number {
  let turns = BASE * t;
  for (const k of kicks) {               // integral of the boost: full for HOLD s after each kick, then a quick fade
    if (k > t) break;
    const d = Math.min(t - k, HOLD + 0.1);
    turns += BOOST * (Math.min(d, HOLD) + (d > HOLD ? (d - HOLD) - (d - HOLD) ** 2 / 0.2 : 0));
  }
  return turns;
}
/** 0..1 how hard the fan is boosting right now (for wind strength). */
export function fanBoost(t: number): number {
  let b = 0;
  for (const k of kicks) { if (k > t) break; const d = t - k; b = Math.max(b, d < HOLD ? 1 : Math.max(0, 1 - (d - HOLD) / 0.1)); }
  return b;
}
