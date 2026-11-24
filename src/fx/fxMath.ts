/** Timing maths for the star (shot 32) and the tower collapse (shot 65). Pure and testable; times in seconds. */
import lyrics from '../timing/lyrics-aligned.json' with {type: 'json'};
import impact from '../timing/impact.json' with {type: 'json'};
import shots from '../shots.json' with {type: 'json'};

export const TV_OFF = 258.0;                       // the picture collapses to a dot (Animatic)

const line = lyrics[24];                          // "The star on the tree is a premium tier,"
const SPIN0 = line.words.find(w => w.w === 'premium')!.s;  // spins to its cheap back ON "premium tier"
const SPIN = 0.35;
const TIP0 = line.end, TIP = 0.16;
const GLASS = (shots[31].sfx as {name: string; t: number}[]).find(x => x.name === 'glass-break')!.t;
const FALL0 = TIP0 + TIP, FALL_DROP = 640;         // px in still space: from the treetop onto the big snow mound (stays in view)
const G = 2 * FALL_DROP / ((GLASS - FALL0) ** 2);  // gravity chosen so it leaves frame exactly on the glass break
const SHATTER = 0.7;

export type StarState = {phase: 'shine' | 'spin' | 'fall' | 'shatter' | 'gone'; face: 'front' | 'back'; scaleX: number; y: number; rot: number; shardAge: number};

export function starState(t: number): StarState {
  if (t < SPIN0) return {phase: 'shine', face: 'front', scaleX: 1, y: 0, rot: 0, shardAge: 0};
  if (t < SPIN0 + SPIN) {
    const a = Math.PI * (t - SPIN0) / SPIN;        // 0..180 degrees around Y
    return {phase: 'spin', face: a < Math.PI / 2 ? 'front' : 'back', scaleX: Math.abs(Math.cos(a)), y: 0, rot: 0, shardAge: 0};
  }
  if (t < TIP0) return {phase: 'spin', face: 'back', scaleX: 1, y: 0, rot: 0, shardAge: 0};
  if (t < FALL0) return {phase: 'fall', face: 'back', scaleX: 1, y: 0, rot: 25 * (t - TIP0) / TIP, shardAge: 0};
  if (t < GLASS) { const d = t - FALL0; return {phase: 'fall', face: 'back', scaleX: 1, y: 0.5 * G * d * d, rot: 25 + 220 * d, shardAge: 0}; }
  if (t < GLASS + SHATTER) return {phase: 'shatter', face: 'back', scaleX: 1, y: FALL_DROP, rot: 0, shardAge: (t - GLASS) / SHATTER};
  return {phase: 'gone', face: 'back', scaleX: 1, y: FALL_DROP, rot: 0, shardAge: 1};
}

/** Floor-by-floor telescoping collapse over the instrumental tail. */
const C0 = impact.silence, C1 = TV_OFF - 0.3, FLOORS = 6;
export function collapse(t: number) {
  if (t < C0) return {sy: 1, sx: 1, wobble: 0, smokeIn: 0, rubble: 0, u: 0};
  const u = Math.min(1, (t - C0) / (C1 - C0));
  const k = u * FLOORS, step = Math.floor(k), frac = k - step;
  const stepped = Math.min(1, (step + Math.min(1, frac / 0.35)) / FLOORS);   // each floor drops quickly, then a beat's pause
  const sy = 1 - 0.88 * stepped;
  return {sy, sx: 1 + 0.06 * Math.sin(Math.PI * stepped), wobble: 1.5 * Math.sin(t * 9) * (1 - u), smokeIn: u, rubble: Math.min(1, Math.max(0, (u - 0.5) / 0.5)), u};
}
