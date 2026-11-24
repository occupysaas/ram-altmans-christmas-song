/** Planted-foot walk cycle with stop follow-through (rules from the user's review of the shot-13 test):
 *  feet are either planted (never sliding) or arcing to the next plant; arms hang and swing opposite the
 *  same-side leg; on the stop both feet land and stay, and the body/arms follow through and settle. */
import {type P, followThrough} from './geom.ts';

export type WalkSpec = {t: number; t0: number; x0: number; dist: number; steps: number; stepDur: number; floor: number; lift: number; dir?: 1 | -1};
export type WalkState = {x: number; feet: {near: P; far: P}; swing: {near: number; far: number}; hipDip: number; stopped: boolean; since: number};

const ARM_SWING = 26; // degrees at full stride

export function walkCycle(w: WalkSpec): WalkState {
  const dir = w.dir ?? 1, D = w.stepDur, T = D * w.steps, lt = w.t - w.t0;
  const v = w.dist / T;
  const X = (tt: number) => w.x0 + dir * v * Math.min(Math.max(tt, 0), T);
  const Xp = (tt: number) => w.x0 + dir * v * Math.min(tt, T);   // footstep positions extend back before the start
  const stopped = lt >= T, since = Math.max(0, lt - T);
  const foot = (off: number): P => {
    const tt = Math.min(Math.max(lt, 0), T) + off, C = 2 * D, u = ((tt % C) + C) % C, land = tt - u;
    const plant = (tl: number) => Xp(tl - off) + dir * v * D / 2;
    if (stopped && u >= D) return [plant(land + C), w.floor];       // the lifting foot lands beside the other
    if (u < D) return [plant(land), w.floor];
    const k = (u - D) / D, a = plant(land), b = plant(land + C);
    return [a + (b - a) * (1 - Math.cos(Math.PI * k)) / 2, w.floor - w.lift * Math.sin(Math.PI * k)];
  };
  const near = foot(0), far = foot(D), x = X(lt);
  const half = Math.max(1, v * D);                                   // half a stride
  const armFrom = (f: P) => -ARM_SWING * Math.max(-1, Math.min(1, ((f[0] - x) * dir) / half));
  const swing = stopped
    ? {near: followThrough(since, -22, 9, 3.5, 0.06), far: followThrough(since, 18, 9, 3.5, 0.1)}
    : {near: armFrom(near), far: armFrom(far)};
  const hipDip = stopped ? 0 : Math.sin(Math.PI * (((Math.max(lt, 0)) / D) % 1));
  return {x, feet: {near, far}, swing, hipDip, stopped, since};
}
