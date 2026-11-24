/** The "taking it back" montage: cut-out elves and townsfolk that bob on every beat and sway on the bar, plus one
 *  action per shot. 50 (3:12) rope tug-of-war that snaps on "un-paywalled" and bursts tokens; 54 (3:25) the whole
 *  town holding hands in a ring around a giant glowing RAM stick rising out of the snow. */
import {type P, add, clamp01, easeOutBack, lerp, rotAbout} from '../puppet/geom.ts';
import {hash} from '../fx/particles.ts';
import lyrics from '../timing/lyrics-aligned.json' with {type: 'json'};
import layers from '../../public/sprites/layers/layers.json' with {type: 'json'};
import {groove} from '../puppet/groove.ts';
import {beat, twos} from './kit.ts';
import type {Choreo, Item} from './types.ts';

const IDX = layers as Record<string, {x: number; y: number; w: number; h: number}>;
const feetOf = (k: string): P => { const L = IDX[k]; return [L.x + L.w / 2, L.y + L.h]; };
/** Bob (dip on each beat) + sway (lean that turns on the bar) for one cut-out layer. */
export function bobbing(key: string, t: number, k = 0, extra: {dx?: number; rot?: number} = {}): Item {
  const b = beat(t), g = groove(t, true), dip = b.i >= 0 ? Math.exp(-b.since / 0.14) : 0;
  return {layer: key, dy: -10 * dip * (k % 2 ? 0.8 : 1), dx: extra.dx ?? 0, rot: 2 * g.sway * (k % 2 ? -1 : 1) + (extra.rot ?? 0), pivot: feetOf(key)};
}

export const ROPE_SNAP = lyrics[40].words.find(w => w.w === 'un-paywalled')!.s;
const HAND1: P = [383, 440], HAND4: P = [1204, 432], MID50: P = [(383 + 1204) / 2, 436];

export const shot50: Choreo = (_t, frame) => {
  const t = twos(frame), snapped = t >= ROPE_SNAP, a = t - ROPE_SNAP, fall = snapped ? easeOutBack(clamp01(a / 0.3)) : 0;
  const tug = snapped ? 0 : 3 * Math.sin(t * 9);
  const r1 = -6 + tug - 16 * fall, r4 = 6 - tug + 16 * fall, d1 = -45 * fall, d4 = 45 * fall;
  const h1 = add(rotAbout(HAND1, feetOf('50/char1'), r1), [d1, 0]), h4 = add(rotAbout(HAND4, feetOf('50/char4'), r4), [d4, 0]);
  const items: Item[] = [bobbing('50/char2', t, 1), bobbing('50/char3', t, 2)];
  if (!snapped) items.push({hose: {a: h1, b: h4, L: Math.hypot(h4[0] - h1[0], h4[1] - h1[1]) * 1.01, side: 1, width: 12, fill: '#c8102e', ink: '#5a0d1a'}});
  else for (const [h, dir] of [[h1, 1], [h4, -1]] as [P, number][]) {   // the two halves whip back and hang
    const k = clamp01(a / 0.35), end: P = [h[0] + dir * lerp(380, 60, k), h[1] + lerp(-40, 200, k)];
    items.push({hose: {a: h, b: end, L: Math.hypot(end[0] - h[0], end[1] - h[1]) * 1.15, side: dir > 0 ? 1 : -1, width: 12, fill: '#c8102e', ink: '#5a0d1a'}});
  }
  items.push(bobbing('50/char1', t, 3, {rot: r1, dx: d1}), bobbing('50/char4', t, 4, {rot: r4, dx: d4}));
  if (snapped && a < 1.6) for (let k = 0; k < 14; k++) {   // tokens burst out of the snap
    const th = -Math.PI * (0.1 + 0.8 * hash(k * 1.3)), v = 500 + 600 * hash(k * 2.9);
    items.push({sprite: 'sprites/props/coin', at: [MID50[0] + Math.cos(th) * v * a, MID50[1] + Math.sin(th) * v * a + 900 * a * a], scale: 0.24, rot: 700 * a * (hash(k) - 0.5)});
  }
  if (snapped && a < 0.25) items.push({draw: {kind: 'ring', at: MID50, size: 30 + 400 * a, color: '#fff3b0', opacity: 1 - a / 0.25}});
  return items;
};

/** 54: four pairs on the far side of the ring (facing us, singing), the RAM monument rising in the middle with a
 *  pulsing glow, snow redrawn in front of its base, then four pairs on the near side (backs to us). */
export const RING54 = {cx: 760, backY: 935, frontY: 1185, snow: 965};
const BACK: [number, number][] = [[1, -470], [2, -160], [3, 160], [4, 470]], FRONT: [number, number][] = [[1, -570], [2, -195], [3, 195], [4, 570]];
const RING_SIZE: Record<string, P> = {'back-1': [295, 321], 'back-2': [327, 321], 'back-3': [373, 320], 'back-4': [413, 320],
  'front-1': [420, 440], 'front-2': [472, 440], 'front-3': [524, 440], 'front-4': [436, 440]};
const SING = lyrics.flatMap(l => l.words.map(w => w.s));

export const shot54: Choreo = (_t, frame, shot) => {
  const t = twos(frame), g = groove(t, true), b = beat(t), dip = b.i >= 0 ? Math.exp(-b.since / 0.14) : 0;
  const drift = 30 * Math.sin((t - shot.start) * 0.9);   // the ring steps slowly round
  const pair = (side: 'back' | 'front', n: number, off: number, y: number, s: number, k: number): Item => {
    const sz = RING_SIZE[`${side}-${n}`], dir = side === 'back' ? 1 : -1;
    return {sprite: `sprites/townsfolk/ring-${side}-${n}`, at: [RING54.cx + off + dir * drift, y - 8 * dip * (k % 2 ? 0.7 : 1)], scale: s, size: sz,
      anchor: [sz[0] / 2, sz[1]], rot: 2.5 * g.sway * (k % 2 ? -1 : 1)};
  };
  const items: Item[] = BACK.map(([n, off], k) => pair('back', n, off, RING54.backY, 0.82, k));
  const rise = 1 - Math.pow(1 - clamp01((t - shot.start) / (shot.end - shot.start - 0.8)), 2), lastWord = SING.filter(w => w <= t + 0.1).pop() ?? 0;
  const glow = 0.5 + 0.3 * rise + 0.2 * Math.exp(-(t - lastWord) / 0.25);
  const base: P = [RING54.cx + 30, RING54.snow + 10 + lerp(560, 0, rise)];
  for (const [r, o] of [[330, 0.07], [240, 0.1], [160, 0.14]] as [number, number][]) items.push({draw: {kind: 'dot', at: [base[0] + 40, base[1] - 320], size: r * (0.85 + 0.25 * glow), color: '#e8ffb0', opacity: o * glow}});   // soft layered glow
  items.push({sprite: 'sprites/props/ram-stick', at: base, scale: 1.7, rot: -80, ramGiant: true} as Item);   // stood upright like a monument
  for (let k = 0; k < 10; k++) {   // sparkles around the monument
    const ph = (t * 1.3 + hash(k * 4.1)) % 1, th = 2 * Math.PI * hash(k * 2.3);
    items.push({draw: {kind: 'flake', at: [base[0] + Math.cos(th) * (180 + 120 * hash(k)), base[1] - 280 + Math.sin(th) * 260], size: 16 * Math.sin(Math.PI * ph), color: '#fffbe0', opacity: Math.sin(Math.PI * ph)}});
  }
  items.push({front: {y: RING54.snow}});
  items.push(...FRONT.map(([n, off], k) => pair('front', n, off, RING54.frontY, 0.95, k + 1)));
  return items;
};
