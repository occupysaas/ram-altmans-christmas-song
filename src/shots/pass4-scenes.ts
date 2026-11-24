/** Pass-4 scene animations on existing stills.
 *  03 (0:10) the family asleep: snow falls only in the window, the data center glows and smokes out there, and the
 *     cat sleeps on the rug, breathing. 06 (0:24) the tower blasts two horns on "He lived in a tower".
 *  14 (0:58) the laptop girl blinks. 18 (1:12) the lyric is written on a scroll between the tree and the family. */
import {type P, clamp01, easeOutBack, lerp} from '../puppet/geom.ts';
import {hash, cycle} from '../fx/particles.ts';
import lyrics from '../timing/lyrics-aligned.json' with {type: 'json'};
import layers from '../../public/sprites/layers/layers.json' with {type: 'json'};
import {beat, twos} from './kit.ts';
import type {Choreo, Item} from './types.ts';

const IDX = layers as Record<string, {x: number; y: number; w: number; h: number}>;

// 03 — the window spans x 1030-1395, y 140-520 in the still; the data center's lit floors are near (1325, 450)
const WIN03 = {x0: 1030, x1: 1395, y0: 140, y1: 520}, TOWER03: P = [1325, 452];
export const shot03: Choreo = (_t, frame) => {
  const t = twos(frame), b = beat(t), items: Item[] = [];
  const pulse = b.i >= 0 ? Math.exp(-b.since / 0.3) : 0;
  items.push({draw: {kind: 'dot', at: TOWER03, size: 46 + 14 * pulse, color: '#fff2a8', opacity: 0.35 + 0.35 * pulse}});   // tower windows pulse
  for (let k = 0; k < 4; k++) {   // smoke curling up from its chimney
    const {age} = cycle(k + 30, t, 2.4);
    items.push({draw: {kind: 'dot', at: [1330 + 30 * age + 8 * Math.sin(age * 6), 370 - 180 * age], size: 8 + 20 * age, color: '#e8e4f2', opacity: 0.55 * (1 - age)}});
  }
  for (let k = 0; k < 26; k++) {   // snow falling only in the window
    const x = WIN03.x0 + 10 + (WIN03.x1 - WIN03.x0 - 20) * hash(k * 3.3) + 10 * Math.sin(t * 1.3 + k), sp = 60 + 50 * hash(k * 1.9);
    const y = WIN03.y0 + 10 + ((t * sp + hash(k * 7.1) * 400) % (WIN03.y1 - WIN03.y0 - 20));
    items.push({draw: {kind: 'dot', at: [x, y], size: 2.5 + 2 * hash(k), color: '#ffffff', opacity: 0.9, snow: true}});
  }
  const breath = 0.5 + 0.5 * Math.sin(2 * Math.PI * t / 1.6), C = IDX['03/cat-sleep'];   // a slow breath every 1.6 s
  items.push({layer: breath > 0.5 ? '03/cat-sleep-b' : '03/cat-sleep', sy: 1 + 0.025 * breath, sx: 1 - 0.01 * breath, pivot: [C.x + C.w / 2, C.y + C.h]});
  if (Math.floor(t / 1.6) % 2 === 0) { const a = (t % 1.6) / 1.6;   // a little "z" every other breath
    items.push({draw: {kind: 'text', at: [C.x + C.w * 0.75 + 30 * a, C.y - 10 - 60 * a], size: 34 + 10 * a, text: 'z', color: '#fffbe6', ink: '#17121c', opacity: Math.sin(Math.PI * a)}}); }
  return items;
};

// 06 — two brass horns slide out from the tower's sides on "He lived in a tower" and blast on every beat
const HORNS06: [P, number][] = [[[455, 390], -1], [[1145, 390], 1]];   // mouthpieces at the dome's upper sides (view is x 133-1467)
// the intro horn blasts (detected in the 'other' stem by scripts/horn_hits.py): out just before the first, a blast on
// each one, then on the beat through the verse
import HORN_HITS from '../timing/horns.json' with {type: 'json'};
// they pop out ON the first horn hit and stay until the shot cuts away
const HORN_OUT = (HORN_HITS as number[])[0] - 0.04, HORN_IN = 9999, HORN_IN_DUR = 0.35;
export const shot06: Choreo = (_t, frame) => {
  // +0.04: held frames lag, so blasts land on the hit
  const t = twos(frame) + 0.04, a = t - HORN_OUT, back = clamp01((t - HORN_IN) / HORN_IN_DUR);
  if (a < 0 || back >= 1) return [];
  const hits = HORN_HITS as number[], last = hits.filter(h => h <= t).pop();
  const b = beat(t), onHit = last !== undefined && t - last < 0.2, sinceHit = last !== undefined ? t - last : 9;
  const blast = t < hits[hits.length - 1] + 0.3 ? (onHit ? Math.exp(-sinceHit / 0.09) : 0) : (b.i >= 0 ? Math.exp(-b.since / 0.16) : 0);
  const out = easeOutBack(clamp01(a / 0.12)) * (1 - back * back);
  const items: Item[] = [];
  HORNS06.forEach(([at, dir], i) => {
    const pos: P = [at[0] + dir * lerp(-120, 0, out), at[1] - 14 * blast], ang = -(26 + 6 * blast), len = 470 * 0.56;
    // the blast pose is held for at least one stop-motion hold, so no hit is skipped
    items.push({sprite: `sprites/horn/${blast > 0.4 || (sinceHit < 0.15 && t < hits[hits.length - 1] + 0.3) ? 'horn-b' : 'horn'}`, at: pos, scale: 0.56 * (1 + 0.06 * blast) * out, size: [520, 260], anchor: [40, 130], flip: dir < 0, rot: dir * ang});
    const bell: P = [pos[0] + dir * len * Math.cos(ang * Math.PI / 180), pos[1] + len * Math.sin(ang * Math.PI / 180)];
    for (let k = 0; k < 4; k++) {   // notes and blast lines out of the bell
      const {age} = cycle(i * 10 + k + 60, t, 0.8);
      items.push({draw: {kind: 'note', at: [bell[0] + dir * 160 * age, bell[1] - 140 * age + 20 * Math.sin(age * 9 + k)], size: 54, text: k % 2 ? '♪' : '♫', color: '#fff6d0', opacity: Math.sin(Math.PI * age)}});
    }
    if (blast > 0.2) for (let k = 0; k < 3; k++) items.push({draw: {kind: 'line', at: [bell[0] + dir * 20, bell[1] + (k - 1) * 40], to: [bell[0] + dir * (80 + 120 * blast), bell[1] + (k - 1) * 60], size: 7, color: '#fff3b0', opacity: blast}});
  });
  return items;
};

// 14 — the girl blinks for 0.12 s every 2-3 s
const BLINKS14 = [0.9, 3.2];
export const shot14: Choreo = (_t, frame, shot) => {
  const lt = twos(frame) - shot.start, blink = BLINKS14.some(b => lt >= b && lt < b + 0.125);
  return [{layer: blink ? '14/girl-blink' : '14/girl'}];
};

// 18 — the sad family, as before, but the lyric is on a parchment scroll hung between the tree and the people
import {shot18 as sad18} from './sad-shots.ts';
// paper spans about x 100-1500, y 524-815: it covers the tree's painted tag
export const SCROLL18 = {x: 800, y: 640, scale: 1.25, sx: 0.84};   // 33% narrower than before, same height
export const shot18: Choreo = (t, frame, shot) => {
  const items = sad18(t, frame, shot).filter(i => (i as {layer?: string}).layer !== '18/tag');
  const sway = 1.2 * Math.sin(twos(frame) * 1.4);
  return [{sprite: 'sprites/scroll/scroll', at: [SCROLL18.x, SCROLL18.y], scale: SCROLL18.scale, sx: SCROLL18.sx, size: [1400, 420], rot: sway}, ...items];
};

// 11 (0:46) "So he coded all night…": the city behind bounces on the beat (squash/stretch from its base, so no gap
// opens under it), Ram's eyes squint and pop open in two-beat spells, and his hands hammer the keys on the half-beat.
export const shot11: Choreo = (_t, frame) => {
  const t = twos(frame), b = beat(t), hit = b.i >= 0 ? Math.exp(-b.since / 0.14) : 0, B = IDX['11/buildings'];
  const squint = b.i >= 0 && Math.floor(b.i / 2) % 2 === 1, half = b.since > 0.25 ? 1 : 0, hands = (b.i * 2 + half) % 2 ? 'b' : 'a';
  return [
    {layer: '11/buildings', sy: 1 + 0.035 * hit, sx: 1 - 0.01 * hit, pivot: [B.x + B.w / 2, B.y + B.h]},
    {layer: squint ? '11/ram-squint' : '11/ram', dy: 4 * hit},
    {layer: `11/hands-${hands}`, dy: hands === 'b' ? 6 : 0},
  ];
};

// 44 (2:53) "Your kernel's in panic…": Ram's jaw flaps open and shut in shock every couple of frames while he trembles.
export const shot44: Choreo = (_t, frame) => {
  const open = Math.floor(frame / 2) % 2 === 0, dx = 6 * Math.sin(frame * 2.9) + 3 * Math.sin(frame * 6.1), R = IDX['44/ram'];
  return [{layer: open ? '44/ram-open' : '44/ram', dx, dy: 2 * Math.sin(frame * 4.3), pivot: [R.x + R.w / 2, R.y + R.h]}];
};
