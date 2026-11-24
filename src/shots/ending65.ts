/** 65: the victorious ending. While the tower swells (Tower.tsx) nothing else moves; on the BOOM a white flash, a
 *  shock ring and flung debris; then RAM sticks rain over the whole town and the townsfolk run in to catch them,
 *  jumping and cheering with their arms up — everyone gets free RAM. */
import {type P, add, clamp01, easeOutBack, lerp} from '../puppet/geom.ts';
import {hash} from '../fx/particles.ts';
import {explode, BOOM} from '../fx/fxMath.ts';
import {shoulders} from '../puppet/body.ts';
import {PARTS} from '../puppet/parts.ts';
import towers from '../../docs/towers.json' with {type: 'json'};
import {beat, scaleFor, twos} from './kit.ts';
import type {Choreo, Item, Pose} from './types.ts';

const T65 = (towers as Record<string, {base: number[]; top: number[]}>)['65'];
const CENTER: P = [T65.base[0] * 1600, ((T65.base[1] + T65.top[1]) / 2) * 1200];
const stick = (at: P, scale: number, rot: number, opacity = 1): Item => ({sprite: 'sprites/props/ram-stick', at, scale, rot, opacity});

const CROWD: [string, number, number, number][] = [   // who, height px, final x, entry side
  ['kid1', 260, 330, -1], ['dad', 470, 520, -1], ['elf', 300, 700, -1], ['mum', 440, 900, 1], ['kid2', 260, 1080, 1], ['elf', 300, 1250, 1]];
const FLOOR = 1050;

function cheer(who: string, x: number, S: number, t: number, i: number, run: number): Pose {
  const rig = PARTS[who]._rig, b = beat(t), hop = run < 1 ? Math.abs(Math.sin(t * 16)) * 20 * S : Math.max(0, Math.sin(Math.PI * Math.min(1, b.since / 0.42))) * 70 * S * (1 + (i % 2) * 0.3);
  const hip: P = [x, FLOOR - rig.hipHeight * S - hop], lean = run < 1 ? 10 : -4, sh = shoulders(who, hip, lean, S, false);
  const reach = rig.armLen * S * 0.95, wave = Math.sin(t * 9 + i) * 25 * S;
  const step = run < 1 ? Math.sin(t * 16) * 50 * S : 0;
  return {hip, lean, head: who === 'elf' ? 'head-happy' : 'head-happy', headRot: -6, flip: false, squash: 1,
    feet: {near: [x + 40 * S + step, FLOOR - hop], far: [x - 40 * S - step, FLOOR - hop]},
    hands: {near: add(sh.near, [40 * S + wave, -reach]), far: add(sh.far, [-40 * S - wave, -reach]), nearPart: 'hand-near-open', farPart: 'hand-far-open'}};
}

export const shot65: Choreo = (_t, frame) => {
  const t = twos(frame), e = explode(t), items: Item[] = [];
  if (e.phase === 'swell') return items;
  const a = e.rainAge;
  // flung debris + shock ring right after the boom
  if (a < 1.2) {
    for (let k = 0; k < 18; k++) {
      const th = 2 * Math.PI * hash(k * 1.9), v = 700 + 900 * hash(k * 3.1);
      items.push(stick([CENTER[0] + Math.cos(th) * v * a, CENTER[1] + Math.sin(th) * v * a * 0.8 + 900 * a * a], 0.2 + 0.1 * hash(k), 900 * a * (hash(k) - 0.5), 1 - a / 1.2));
    }
    items.push({draw: {kind: 'ring', at: CENTER, size: 60 + 1500 * a, color: '#fff3c4', opacity: Math.max(0, 1 - a / 0.7)}});
    items.push({draw: {kind: 'dot', at: CENTER, size: 260 * Math.max(0, 1 - a / 0.5) + 1, color: '#ffe9a8', opacity: Math.max(0, 1 - a / 0.5)}});
  }
  // RAM rain: sticks tumbling down across the whole frame, each starting at its own delay after the boom
  for (let k = 0; k < 40; k++) {
    const delay = 0.15 + 1.2 * hash(k * 7.7), age = a - delay;
    if (age <= 0) continue;
    const x = 40 + 1520 * hash(k * 4.3) + 60 * Math.sin(age * 3 + k), y = -80 + 560 * age * (0.8 + 0.4 * hash(k));
    if (y > FLOOR + 60) continue;
    items.push(stick([x, y], 0.22 + 0.1 * hash(k * 2.3), age * 300 * (hash(k) - 0.5) + 30 * Math.sin(age * 6)));
  }
  // townsfolk run in from both sides and jump, arms up, catching the rain
  CROWD.forEach(([who, h, x1, side], i) => {
    const S = scaleFor(who, h), run = clamp01((a - 0.3 - 0.12 * i) / 0.7), x = lerp(x1 + side * 900, x1, 1 - (1 - run) ** 2);
    const pose = cheer(who, x, S, t, i, run);
    if (side > 0) { pose.flip = run < 1; }
    items.push({who, pose, scale: S});
    if (run >= 1 && Math.floor((t + i * 0.3) / 0.8) % 2) items.push(stick(add(pose.hands.near, [0, -20]), 0.16, 20 * Math.sin(t * 5 + i)));   // caught one!
  });
  // confetti
  for (let k = 0; k < 24; k++) {
    const age = a - 0.4 - 0.5 * hash(k * 9.9); if (age <= 0) continue;
    items.push({draw: {kind: 'dot', at: [100 + 1400 * hash(k * 6.1) + 40 * Math.sin(age * 4 + k), -20 + 300 * age], size: 7, color: ['#e33b4f', '#ffd447', '#5fd35a', '#5fc8ff'][k % 4]}});
  }
  // the boom's white flash, over everything
  if (e.flash > 0) items.push({shade: {x: -400, y: -400, w: 2400, h: 2000, opacity: e.flash, color: '#fffbe8'}});
  return items;
};
