/** Choreography kit: standing poses on a floor line, hand placement, beat timing (all on twos). */
import audio from '../timing/audio.json' with {type: 'json'};
import lyrics from '../timing/lyrics-aligned.json' with {type: 'json'};
import {type P, add, followThrough, squashAt, holdFrame} from '../puppet/geom.ts';
import {shoulders} from '../puppet/body.ts';
import {PARTS} from '../puppet/parts.ts';
import {groove} from '../puppet/groove.ts';
import type {Pose} from './types.ts';

/** Native puppet height from feet to hat top, for scaling a puppet to the size it is painted in a still. */
export function nativeHeight(who: string) {
  const s = PARTS[who], r = s._rig, t = s.torso, headKey = Object.keys(s).find(k => k.startsWith('head-'))!;
  return r.hipHeight + (t.hipNear[1] - t.neck[1]) + s[headKey].neck[1];
}
/** Scale that makes `who` stand `px` tall in still pixels. */
export const scaleFor = (who: string, px: number) => px / nativeHeight(who);

export type Stand = {x: number; floor: number; S: number; flip?: boolean; lean?: number; head: string; headRot?: number;
  spread?: number; hipBob?: number; hands: (sh: {near: P; far: P; neck: P}) => {near: P; far: P; nearPart: string; farPart: string};
  feet?: {near: P; far: P}; t: number; groove?: boolean};

/** Bob and sway sizes: hip dip (native px, scaled), lean and head counter-sway (degrees). */
export const GROOVE = {bob: 34, sway: 6, headCounter: 4};

/** A standing (or crouching, via hipBob) pose with feet planted either side of x. */
export function stand(who: string, o: Stand): Pose {
  const r = PARTS[who]._rig, fx = o.flip ? -1 : 1, spread = (o.spread ?? 90) * o.S;
  const g = groove(o.t, o.groove), on = g.active ? 1 : 0;
  const hip: P = [o.x, o.floor - r.hipHeight * o.S + (o.hipBob ?? 0) + on * GROOVE.bob * o.S * g.bob];
  const lean = (o.lean ?? 0) + on * GROOVE.sway * g.sway;
  const sh = shoulders(who, hip, lean, o.S, !!o.flip);
  const feet = o.feet ?? {near: [o.x + spread * 0.6 * fx, o.floor] as P, far: [o.x - spread * 0.6 * fx, o.floor] as P};
  return {hip, lean, head: o.head, headRot: (o.headRot ?? 0) - on * GROOVE.headCounter * g.sway, hands: o.hands(sh), feet, squash: squashAt(o.t), flip: !!o.flip};
}

/** Beat helpers: time since the latest beat, and the beat index. */
export function beat(t: number) {
  const b = audio.beats; let k = -1;
  for (let i = 0; i < b.length; i++) { if (b[i] <= t) k = i; else break; }
  return {i: k, since: k < 0 ? 99 : t - b[k], period: k > 0 ? b[k] - b[k - 1] : 0.53};
}
/** A punchy 0→1→0 hit that peaks `peak` s after each beat and fades. */
export const beatHit = (t: number, decay = 0.18) => { const s = beat(t).since; return Math.exp(-s / decay) * Math.min(1, s / 0.04); };
/** Aligned start time of word k of lyric line `line`. */
export const wordAt = (line: number, k: number) => lyrics[line].words[k].s;
/** Local time on twos. */
export const twos = (frame: number) => holdFrame(frame) / 24;
export {add, followThrough};
