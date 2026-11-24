/** Pure body helpers for choreography (no JSX, importable from node tests). */
import {type P, add, sub, rotAbout} from './geom.ts';
import {PARTS} from './parts.ts';

/** Where an arm hanging at `deg` from vertical (positive = toward facing) puts the hand. */
export function hangHand(sh: P, deg: number, reach: number, lean: number, flip: boolean): P {
  const a = (deg + lean) * Math.PI / 180, fx = flip ? -1 : 1;
  return add(sh, [Math.sin(a) * reach * fx, Math.cos(a) * reach]);
}
/** Shoulder positions for a pose (used by choreography to place hands relative to the body). */
export function shoulders(who: string, hip: P, lean: number, scale: number, flip: boolean) {
  const torso = PARTS[who].torso, hipA = torso.hipNear as P, fx = flip ? -1 : 1;
  const T = (key: string): P => { const o = sub(torso[key] as P, hipA); return add(hip, [o[0] * scale * fx, o[1] * scale]); };
  return {near: rotAbout(T('shoulderNear'), hip, lean * fx), far: rotAbout(T('shoulderFar'), hip, lean * fx), neck: rotAbout(T('neck'), hip, lean * fx)};
}
