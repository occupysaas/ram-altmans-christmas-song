/** Sleigh flights (15, 16, 31, 34, 46, 47, 48). A team = 2 reindeer (rubber-hose legs, gallop) + reins + sleigh + seated Ram,
 *  moving along a per-shot path. Everything faces the direction of travel: flip = moving left. */
import {type P, add, lerp, clamp01, easeInOut} from '../puppet/geom.ts';
import lyrics from '../timing/lyrics-aligned.json' with {type: 'json'};
import audio from '../timing/audio.json' with {type: 'json'};
import type {Item} from './types.ts';

export type PathState = {pos: P; angle: number; flip: boolean; frozen?: boolean; crash?: number; sag?: number; laugh?: number};
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
const snareHit = (t: number) => { let k = -1; for (const [st] of audio.snares) { if (st <= t) k = st; else break; } return k < 0 ? 0 : Math.exp(-(t - k) / 0.15); };
const buffering = lyrics[23].words.find(w => w.w === 'buffering')!.s;

export const SLEIGH_PATHS: Record<string, Path> = {
  // shopping spree: low fast pass right-to-left over the shop street, pouring coins
  '21': (t, s) => moving(v => [lerp(1900, -700, v), 400 + 30 * Math.sin(v * 8)], u(t, s)),
  // hovers over the (mirrored) street, cackling; drifts left
  '22': (t, s) => { const st = moving(v => [lerp(980, 820, v), 400 + 22 * Math.sin(v * 7)], u(t, s)); return {...st, laugh: snareHit(t)}; },
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
  '47': (t, s) => moving(v => [lerp(1300, 1080, v), 600 + 30 * Math.sin(v * 14)], u(t, s), {sag: 1}),   // far enough right that the deer pulling ahead stay in frame
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
    const items: Item[] = [{sleighTeam: {state: st, scale, t, deer: true}}];
    return extra ? [...items, ...extra(t, st, shot)] : items;
  };

/** RAM sticks streaming up out of the chimneys into the sleigh (16). */
const ramStream = (t: number, st: PathState): Item[] => Array.from({length: 10}, (_, i) => {
  const k = ((t * 1.5 + hash(i)) % 1), x0 = 200 + 140 * i, y0 = 900;
  return {sprite: 'sprites/props/ram-stick', at: [lerp(x0, st.pos[0] + 60, k), lerp(y0, st.pos[1] - 40, k) - 120 * Math.sin(Math.PI * k)] as P, scale: 0.18, rot: 360 * k, opacity: 1 - k * 0.3};
});
/** Pixelated "buffering" haze + a big classic loading spinner over the frozen team (31): 12 dots, one step per held frame. */
const buffer = (t: number, st: PathState): Item[] => {
  if (!st.frozen) return [];
  const s = 0.42, dir = st.flip ? -1 : 1, c: P = [st.pos[0] + dir * 560 * s * 1.1, st.pos[1] - 40];
  const out: Item[] = [{shade: {x: c[0] - 520, y: c[1] - 220, w: 1040, h: 420, opacity: 0.35}}];
  out.push({draw: {kind: 'dot', at: c, size: 150, color: '#0b0a1c', opacity: 0.45}});
  const step = Math.floor(t * 12) % 12;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 2 * Math.PI - Math.PI / 2, lit = (i - step + 12) % 12;   // the lead dot is brightest, the tail fades
    out.push({draw: {kind: 'dot', at: [c[0] + Math.cos(a) * 110, c[1] + Math.sin(a) * 110], size: 18, color: '#ffffff', opacity: 0.15 + 0.85 * (lit / 11)}});
  }
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

/** Shop signboards on plates 21 (22 is the mirror image): centre and size, still px. */
export const SHOP_SIGNS: [number, number, number, number][] = [[195, 810, 176, 58], [475, 818, 156, 69], [788, 818, 251, 76], [1095, 827, 152, 72], [1410, 838, 203, 64]];
/** 21: no coins (tokens aren't coins) — as the sleigh passes, the shops below flip to SOLD one per beat,
 *  right to left behind it. */
const soldSigns = (_id: string) => (t: number, _st: PathState, shot: Shot2): Item[] => {
  const b0 = audio.beats.findIndex(b => b > shot.start), items: Item[] = [];
  [...SHOP_SIGNS].sort((p, q) => q[0] - p[0]).forEach(([x, y, w, h], k) => {
    const tk = audio.beats[b0 + k]; if (tk === undefined || t < tk) return;
    const pop = Math.min(1, (t - tk) / 0.12);
    items.push({draw: {kind: 'text', at: [x, y + 4], size: Math.min(h * 0.85, w / 3) * (1.5 - 0.5 * pop), text: 'SOLD', color: '#c8102e', ink: '#fff6e0', rot: -6}});
  });
  return items;
};
const prop2 = (sprite: string, at: P, scale: number, rot: number): Item => ({sprite: `sprites/props/${sprite}`, at, scale, rot});
/** 22: every shop already SOLD (mirrored signs) and "HA!"s popping on snares as he leans back. */
const cackle = (t: number, st: PathState, shot: Shot2): Item[] => {
  const items: Item[] = SHOP_SIGNS.map(([x, y, w, h]) => ({draw: {kind: 'text', at: [1600 - x, y + 4] as P, size: Math.min(h * 0.85, w / 3), text: 'SOLD', color: '#c8102e', ink: '#fff6e0', rot: 6}} as Item));
  const k = audio.snares.filter(sn => sn[0] <= t && sn[0] >= shot.start).slice(-3);
  k.forEach(([sn], i) => { const a = t - sn; if (a < 0.6) items.push({draw: {kind: 'text', at: [st.pos[0] + 160 + 120 * i - 60 * a, st.pos[1] - 260 - 160 * a], size: 70 * (1 + 0.3 * Math.min(1, a * 6)), text: 'HA!', color: '#ffe27a', ink: '#17121c', rot: -10 + 10 * i, opacity: 1 - a / 0.6}}); });
  return items;
};

/** RAM sticks tumbling off the back of the overloaded sleigh: two per beat, falling and spinning (46, 47, 48). */
const ramDrop = (t: number, _st: PathState, shot: Shot2): Item[] => {
  const out: Item[] = [];
  for (const b of audio.beats) {
    if (b < shot.start - 1.2 || b > t) continue;
    const a = t - b; if (a > 1.6) continue;
    const st = SLEIGH_PATHS[(shot as {id?: string}).id ?? '46'](Math.max(b, shot.start), shot as Shot), back = st.flip ? 1 : -1;
    for (let i = 0; i < 2; i++) {
      const seed = Math.round(b * 100) + i * 7, vx = back * (60 + 140 * hash(seed)), vy = -120 * hash(seed + 1);
      out.push({sprite: 'sprites/props/ram-stick', at: [st.pos[0] + back * (200 + 40 * i) + vx * a, st.pos[1] - 60 + vy * a + 900 * a * a] as P, scale: 0.22, rot: 500 * a * (hash(seed + 2) - 0.5) + 40 * i});
    }
  }
  return out;
};
const both = (...fs: ((t: number, st: PathState, shot: Shot2) => Item[])[]) => (t: number, st: PathState, shot: Shot2) => fs.flatMap(f => f(t, st, shot));

export const SLEIGH_CHOREO = {
  '21': T('21', 0.4, soldSigns('21')), '22': T('22', 0.55, cackle),
  '15': T('15', 0.42), '16': T('16', 0.5, ramStream), '31': T('31', 0.42, buffer), '34': T('34', 0.36),
  '46': T('46', 0.5, ramDrop), '47': T('47', 0.6, ramDrop), '48': T('48', 0.45, both(ramDrop, fountain)),
};
