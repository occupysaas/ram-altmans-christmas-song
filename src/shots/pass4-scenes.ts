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
const HORNS06: [P, number][] = [[[330, 470], -1], [[1270, 470], 1]];
export const shot06: Choreo = (_t, frame) => {
  const t = twos(frame), t0 = lyrics[2].start, a = t - t0;
  if (a < 0) return [];
  const b = beat(t), blast = b.i >= 0 ? Math.exp(-b.since / 0.16) : 0, out = easeOutBack(clamp01(a / 0.45));
  const items: Item[] = [];
  HORNS06.forEach(([at, dir], i) => {
    const pos: P = [at[0] + dir * lerp(-160, 60, out), at[1] - 20 * blast];
    items.push({sprite: `sprites/horn/${blast > 0.4 ? 'horn-b' : 'horn'}`, at: pos, scale: 0.85 * (1 + 0.06 * blast), size: [520, 260], anchor: [40, 130], flip: dir < 0, rot: dir * (-14 - 6 * blast)});
    const bell: P = [pos[0] + dir * 400, pos[1] - 110];
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
export const SCROLL18 = {x: 800, y: 760, scale: 0.6};
export const shot18: Choreo = (t, frame, shot) => {
  const items = sad18(t, frame, shot).filter(i => (i as {layer?: string}).layer !== '18/tag');
  const sway = 1.2 * Math.sin(twos(frame) * 1.4);
  return [{sprite: 'sprites/scroll/scroll', at: [SCROLL18.x, SCROLL18.y], scale: SCROLL18.scale, size: [1400, 420], rot: sway}, ...items];
};
