/** 18 (1:12) and 19 (1:17): cut-out townsfolk layers brought to life.
 *  18: the family at the bare tree sob on alternating beats (sob-face swap + shoulder heave), tears fall from every
 *      face and splash on the floor, and the blank tag is drawn twice its painted size so the lyric reads big.
 *  19: shoppers bob up to the window, then recoil in shock as the red price sticker flips higher on each beat. */
import {type P, clamp01, easeOutBack, lerp} from '../puppet/geom.ts';
import {hash} from '../fx/particles.ts';
import {groove} from '../puppet/groove.ts';
import {beat, twos, wordAt} from './kit.ts';
import type {Choreo, Item} from './types.ts';
import layers from '../../public/sprites/layers/layers.json' with {type: 'json'};

const IDX = layers as Record<string, {x: number; y: number; w: number; h: number}>;
const foot = (k: string): P => { const L = IDX[k]; return [L.x + L.w / 2, L.y + L.h]; };

export const TAG18 = {scale: 2.0, pivot: [805, 600] as P};
/** Where tears start on each face (still px), the sob phase (beat parity) and whether it's a kid (bigger, faster tears). */
export const TEAR_EYES: Record<string, {eye: P; phase: number; kid: boolean}> = {
  dad: {eye: [240, 425], phase: 0, kid: false}, mum: {eye: [395, 525], phase: 1, kid: false},
  kid1: {eye: [1125, 750], phase: 1, kid: true}, kid2: {eye: [1325, 772], phase: 0, kid: true},
};

export const shot18: Choreo = (_t, frame) => {
  const t = twos(frame), b = beat(t), g = groove(t, true);
  const items: Item[] = [{layer: '18/tag', sx: TAG18.scale, sy: TAG18.scale, pivot: TAG18.pivot}];
  const tears: Item[] = [];
  for (const [who, p] of Object.entries(TEAR_EYES)) {
    const sob = b.i >= 0 && (b.i + p.phase) % 2 === 0, heave = sob ? Math.exp(-b.since / 0.18) : 0;
    const key = `18/${who}${sob ? '-sob' : ''}`, f = foot(`18/${who}`);
    items.push({layer: key, dy: 10 * heave, sy: 1 - 0.035 * heave, rot: 1.2 * g.sway, pivot: f});
    const n = 3, dur = p.kid ? 0.55 : 0.75, size = p.kid ? 15 : 11;
    for (let k = 0; k < n; k++) {
      const age = ((t + k * dur / n + hash(k + p.phase * 7)) % dur) / dur, side = k % 2 ? 1 : -1;
      const x = p.eye[0] + side * (8 + 30 * age), y = p.eye[1] + (f[1] - p.eye[1] - 10) * age * age;
      if (age < 0.92) tears.push({draw: {kind: 'drop', at: [x, y], size: size * (1 - 0.3 * age), opacity: 0.95}});
      else tears.push({draw: {kind: 'ring', at: [x, f[1] - 6], size: 10 + 120 * (age - 0.92), color: '#bfefff', opacity: 1 - (age - 0.92) / 0.08}});
    }
  }
  return [...items, ...tears];
};

const SHOPPERS = ['shopper1', 'shopper2', 'shopper3', 'shopper4'];
const PRICES = ['$99', '$999', '$9,999', '$99,999', 'A KIDNEY', '2 KIDNEYS', '3 KIDNEYS'];
const TAG19 = {x: 380, y: 390, w: 840, h: 440};

export const shot19: Choreo = (_t, frame, shot) => {
  const t = twos(frame), b = beat(t), g = groove(t, true), lt = t - shot.start;
  const shock0 = wordAt(13, 5);    // "costs"
  const flips = Math.max(0, b.i - beat(shot.start + 0.6).i);
  const items: Item[] = [];
  // the hanging sign the lyric is painted on, with its two strings
  items.push({draw: {kind: 'line', at: [TAG19.x + 140, 0], to: [TAG19.x + 140, TAG19.y + 10], size: 5, color: '#7a5b2a'}});
  items.push({draw: {kind: 'line', at: [TAG19.x + TAG19.w - 140, 0], to: [TAG19.x + TAG19.w - 140, TAG19.y + 10], size: 5, color: '#7a5b2a'}});
  const T = IDX['18/tag'];   // reuse the painted gift-tag paper as the hanging sign
  items.push({layer: '18/tag', sx: TAG19.w / T.w, sy: TAG19.h / T.h, pivot: [T.x, T.y], dx: TAG19.x - T.x, dy: TAG19.y - T.y});
  SHOPPERS.forEach((who, i) => {
    const left = i < 2, enter = easeOutBack(clamp01((lt - 0.1 * i) / 0.7)), walkBob = enter < 1 ? -12 * Math.abs(Math.sin(lt * 14)) : 0;
    const shocked = t >= shock0 + 0.08 * i, jolt = shocked ? Math.exp(-b.since / 0.15) : 0;
    const away = (left ? -1 : 1) * (lerp(260, 0, enter) + (shocked ? 40 + 18 * jolt : 0));
    items.push({layer: `19/${who}${shocked ? '-shock' : ''}`, dx: away, dy: walkBob - 14 * jolt, rot: (left ? -1 : 1) * (shocked ? 6 + 4 * jolt : 1.5 * g.sway), pivot: foot(`19/${who}`)});
  });
  // red price sticker that flips (scaleX through 0) to a bigger price on every beat
  const ph = clamp01(b.since / 0.18), sx = Math.abs(Math.cos(Math.PI * ph)) < 0.06 ? 0.06 : Math.abs(Math.cos(Math.PI * ph));
  const price = PRICES[Math.min(PRICES.length - 1, ph < 0.5 ? Math.max(0, flips - 1) : flips)];
  const at: P = [TAG19.x + TAG19.w - 70, TAG19.y + TAG19.h - 20];
  items.push({draw: {kind: 'dot', at, size: 70 * Math.max(0.1, sx), color: '#c8102e', opacity: 1}});
  items.push({draw: {kind: 'text', at, size: price.length > 6 ? 22 : 30, text: price, color: '#fff6e0', rot: -12, opacity: sx > 0.3 ? 1 : 0}});
  return items;
};
