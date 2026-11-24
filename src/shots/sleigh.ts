/** Sleigh flights (15, 16, 31, 34, 46, 47, 48). A team = 2 reindeer (rubber-hose legs, gallop) + reins + sleigh + seated Ram,
 *  moving along a per-shot path. Everything faces the direction of travel: flip = moving left. */
import {type P, add, lerp, clamp01, easeInOut} from '../puppet/geom.ts';
import lyrics from '../timing/lyrics-aligned.json' with {type: 'json'};
import type {Item} from './types.ts';

export type PathState = {pos: P; angle: number; flip: boolean; frozen?: boolean; crash?: number; sag?: number};
type Shot = {start: number; end: number};
type Path = (t: number, shot: Shot) => PathState;

const u = (t: number, s: Shot, a = 0, b = 1) => clamp01(((t - s.start) / (s.end - s.start) - a) / (b - a));
/** Direction comes from the path itself, so flip can never disagree with travel. */
function moving(f: (v: number) => P, v: number, extra: Partial<PathState> = {}): PathState {
  const p = f(v), q = f(Math.min(1, v + 0.01)), r = f(Math.max(0, v - 0.01));
  const dx = q[0] - r[0], dy = q[1] - r[1];
  const flip = dx < 0;
  // the team is drawn mirrored (scale(-1,1)) before this rotation, so the same sign works both ways; cap the tilt
  const ang = Math.max(-35, Math.min(35, Math.atan2(dy, Math.max(Math.abs(dx), 1e-6)) * 180 / Math.PI));
  return {pos: p, angle: ang, flip, ...extra};
}
const buffering = lyrics[23].words.find(w => w.w === 'buffering')!.s;

export const SLEIGH_PATHS: Record<string, Path> = {
  // launch off the tower roof (right), swooping up-left across the sky
  '15': (t, s) => moving(v => [lerp(1250, -500, v), 330 - 260 * Math.sin(Math.PI * v * 0.8) + 120 * v], easeInOut(u(t, s))),
  // low rooftop pass right-to-left
  '16': (t, s) => moving(v => [lerp(1900, -600, v), 640 + 30 * Math.sin(v * 9)], u(t, s)),
  // flies in from the right, then freezes on "buffering"
  '31': (t, s) => {
    const v = clamp01((t - s.start) / Math.max(0.1, buffering - s.start));
    const st = moving(w => [lerp(1900, 820, 1 - (1 - w) ** 3), 300 + 20 * Math.sin(w * 6)], Math.min(v, 0.995));   // decelerates, never reverses
    return {...st, flip: true, frozen: t >= buffering};
  },
  // left-to-right pass under the moon
  '34': (t, s) => moving(v => [lerp(-600, 1900, v), 560 - 80 * Math.sin(Math.PI * v)], u(t, s)),
  // overloaded: struggles off the tower roof, barely rising, right-to-left
  '46': (t, s) => moving(v => [lerp(1100, 200, v), 560 - 90 * v + 25 * Math.sin(v * 30)], u(t, s), {sag: 1}),
  // tipping and sputtering, mostly in place, drifting left
  '47': (t, s) => moving(v => [lerp(900, 600, v), 520 + 30 * Math.sin(v * 14)], u(t, s), {sag: 1}),
  // nose-dive down to the hill (bottom-left), impact at 70%
  '48': (t, s) => {
    const v = u(t, s), dive = clamp01(v / 0.7);
    const st = moving(w => [lerp(1400, 420, w), lerp(150, 980, w * w)], Math.min(dive, 0.995));
    return {...st, angle: Math.min(60, st.angle + 25 * dive), crash: v >= 0.7 ? (v - 0.7) / 0.3 : 0};
  },
};

import {hash} from '../fx/particles.ts';
import {twos} from './kit.ts';
type Shot2 = {id?: string; start: number; end: number};
const T = (id: string, scale: number, extra?: (t: number, st: PathState, shot: Shot2) => Item[]) =>
  (_t: number, frame: number, shot: Shot2): Item[] => {
    const t = twos(frame), st = SLEIGH_PATHS[id](t, shot);
    const items: Item[] = [{sleighTeam: {state: st, scale, t, deer: id !== '47'}}];
    return extra ? [...items, ...extra(t, st, shot)] : items;
  };

/** RAM sticks streaming up out of the chimneys into the sleigh (16). */
const ramStream = (t: number, st: PathState): Item[] => Array.from({length: 10}, (_, i) => {
  const k = ((t * 1.5 + hash(i)) % 1), x0 = 200 + 140 * i, y0 = 900;
  return {sprite: 'sprites/props/ram-stick', at: [lerp(x0, st.pos[0] + 60, k), lerp(y0, st.pos[1] - 40, k) - 120 * Math.sin(Math.PI * k)] as P, scale: 0.18, rot: 360 * k, opacity: 1 - k * 0.3};
});
/** Pixelated "buffering" blocks + spinner over the frozen team (31). */
const buffer = (t: number, st: PathState): Item[] => {
  if (!st.frozen) return [];
  const out: Item[] = [{shade: {x: st.pos[0] - 250, y: st.pos[1] - 240, w: 1050, h: 360, opacity: 0.25}}];
  for (let i = 0; i < 8; i++) { const a = i / 8 * 2 * Math.PI + t * 6;
    out.push({shade: {x: 1150 + Math.cos(a) * 60 - 12, y: 720 + Math.sin(a) * 60 - 12, w: 24, h: 24, opacity: 0.25 + 0.75 * (i / 8), color: '#ffffff', round: true}}); }
  return out;
};
/** Crash fountain of RAM sticks over Byteville (48). */
const fountain = (_t: number, st: PathState): Item[] => {
  const c = st.crash ?? 0; if (c <= 0) return [];
  return Array.from({length: 26}, (_, i) => {
    const vx = (hash(i) - 0.3) * 1500, vy = -900 - 700 * hash(i + 5), a = c * 1.4;
    return {sprite: 'sprites/props/ram-stick', at: [st.pos[0] + vx * a, st.pos[1] + vy * a + 1400 * a * a] as P, scale: 0.16, rot: 720 * a * (hash(i + 2) - 0.5), opacity: 1 - c * 0.5};
  });
};

export const SLEIGH_CHOREO = {
  '15': T('15', 0.42), '16': T('16', 0.5, ramStream), '31': T('31', 0.42, buffer), '34': T('34', 0.36),
  '46': T('46', 0.5), '47': T('47', 0.75), '48': T('48', 0.45, fountain),
};
