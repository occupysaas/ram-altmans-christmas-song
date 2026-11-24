/** 17 (1:08) "Loaded up his big sleigh with a wink and then scrammed!": the sleigh stays put while the starry sky
 *  streams past behind it (a seamless two-tile loop), Ram snaps the reins on every beat (arm layers rotate about the
 *  shoulders), a whip-crack flashes on snares, and he winks on "wink". */
import {type P, add, rotAbout} from '../puppet/geom.ts';
import {hash, cycle} from '../fx/particles.ts';
import lyrics from '../timing/lyrics-aligned.json' with {type: 'json'};
import audio from '../timing/audio.json' with {type: 'json'};
import {beat, twos} from './kit.ts';
import type {Choreo, Item} from './types.ts';

const SPEED = 600;   // px/s of sky past the sleigh (it flies left, so the sky moves right)
export const skyOffset = (t: number) => (t * SPEED) % 1600;
const ARMS = {near: {shoulder: [860, 440] as P, hand: [510, 465] as P}, far: {shoulder: [750, 455] as P, hand: [392, 482] as P}};
const WINK = lyrics[11].words.find(w => w.w.startsWith('wink'))!.s;
const snareSince = (t: number) => { let k = -1; for (const [s] of audio.snares) { if (s <= t) k = s; else break; } return k < 0 ? 9 : t - k; };

export const shot17: Choreo = (_t, frame) => {
  const t = twos(frame), b = beat(t), snap = b.i >= 0 ? Math.exp(-b.since / 0.16) : 0, bob = -6 * snap;
  const off = skyOffset(t), items: Item[] = [
    {sprite: 'plates/17', at: [off - 1600, 0], scale: 1, size: [1600, 1200], anchor: [0, 0]},
    {sprite: 'plates/17', at: [off, 0], scale: 1, size: [1600, 1200], anchor: [0, 0]},
  ];
  for (let k = 0; k < 16; k++) {   // snow streaking past
    const {age} = cycle(k + 700, t, 0.5), y = 60 + 1080 * hash(k * 3.7), x = -200 + 2000 * age;
    items.push({draw: {kind: 'line', at: [x, y], to: [x + 120, y], size: 4, color: '#f2f8ff', opacity: 0.7 * Math.sin(Math.PI * age)}});
  }
  const rot = -10 * snap;          // arms jerk up on the beat, settle back
  const hands = {near: rotAbout(ARMS.near.hand, ARMS.near.shoulder, rot), far: rotAbout(ARMS.far.hand, ARMS.far.shoulder, rot * 0.8)};
  for (const h of [hands.far, hands.near]) {   // reins run off the left edge, rippling on the snap
    const end: P = [-80, 640], d = Math.hypot(h[0] - end[0], h[1] - end[1]);
    items.push({hose: {a: h, b: end, L: d * (1.04 + 0.05 * snap), side: 1, width: 7, fill: '#c41e3a', ink: '#5a0d1a'}});
  }
  items.push({layer: '17/arm-far', dy: bob, rot: rot * 0.8, pivot: ARMS.far.shoulder});
  items.push({layer: '17/sleigh', dy: bob * 0.5});
  items.push({layer: t >= WINK - 0.02 && t < WINK + 0.45 ? '17/ram-wink' : '17/ram', dy: bob});
  items.push({layer: '17/arm-near', dy: bob, rot, pivot: ARMS.near.shoulder});
  const cs = snareSince(t);
  if (cs < 0.18) for (let k = 0; k < 7; k++) {   // whip crack where the reins leave frame
    const a = (k / 7) * 2 * Math.PI, c: P = [70, 600];
    items.push({draw: {kind: 'line', at: add(c, [Math.cos(a) * 30, Math.sin(a) * 30]), to: add(c, [Math.cos(a) * (60 + 300 * cs), Math.sin(a) * (60 + 300 * cs)]), size: 6, color: '#fff3b0', opacity: 1 - cs / 0.18}});
  }
  return items;
};
