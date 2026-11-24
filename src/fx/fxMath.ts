/** Timing maths for the star (shot 32) and the victorious tower explosion (shot 65). Pure and testable; times in seconds. */
import lyrics from '../timing/lyrics-aligned.json' with {type: 'json'};
import impact from '../timing/impact.json' with {type: 'json'};
import shots from '../shots.json' with {type: 'json'};
import audio from '../timing/audio.json' with {type: 'json'};

export const TV_OFF = 258.0;                       // the picture collapses to a dot (Animatic)

const line = lyrics[24];                          // "The star on the tree is a premium tier,"
const SPIN0 = line.words.find(w => w.w === 'premium')!.s;  // spins to its cheap back ON "premium tier"
const SPIN = 0.35;
const TIP0 = line.end, TIP = 0.16;
const GLASS = ((shots as {id: string; sfx: unknown}[]).find(x => x.id === '32')!.sfx as {name: string; t: number}[]).find(x => x.name === 'glass-break')!.t;
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

/** The victorious ending (shot 65, in the closing silence): the tower swells to ~1.55x, shaking harder and glowing
 *  red, then BOOM — a white flash, a burst and a camera shake — and RAM rains down on the town until the TV goes off. */
const SWELL0 = impact.silence;
export const BOOM = SWELL0 + 1.6;
const FLASH = 0.125, BOOM_LEN = 0.35;
export type Explode = {phase: 'swell' | 'boom' | 'rain'; scale: number; shake: number; flash: number; glow: number; rainAge: number};
export function explode(t: number): Explode {
  if (t < BOOM) {
    const u = Math.min(1, Math.max(0, (t - SWELL0) / (BOOM - SWELL0)));
    return {phase: 'swell', scale: 1 + 0.55 * u ** 1.5, shake: 2 + 12 * u * u, flash: 0, glow: u, rainAge: 0};
  }
  const a = t - BOOM;
  return {phase: a < BOOM_LEN ? 'boom' : 'rain', scale: 0, shake: 26 * Math.max(0, 1 - a / 0.6), flash: a < FLASH ? 1 : Math.max(0, 1 - (a - FLASH) / 0.4),
    glow: 0, rainAge: a};
}

/** Whole-picture bump on every beat (shot 38's fan throne): +2.5% right on the beat, decaying in ~0.15 s. */
export function beatBumpScale(t: number): number {
  let k = -1; for (const b of audio.beats) { if (b <= t) k = b; else break; }
  if (k < 0) return 1;
  const s = t - k;
  return 1 + 0.025 * Math.exp(-s / 0.15) * Math.min(1, s / 0.03);
}

