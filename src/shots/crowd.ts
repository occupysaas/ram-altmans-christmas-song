/** Crowd and elf shots (40, 49, 61): simple rubber-hose townsfolk using the shared walk cycle. */
import {type P, add, followThrough} from '../puppet/geom.ts';
import {walkCycle} from '../puppet/walk.ts';
import {hangHand, shoulders} from '../puppet/body.ts';
import {PARTS} from '../puppet/parts.ts';
import {squashAt} from '../puppet/geom.ts';
import type {Choreo, Item, Pose} from './types.ts';
import {beat, beatHit, scaleFor, stand, twos} from './kit.ts';

/** A walking/running figure along a (possibly sloped) floor: y = y0 + slope * (x - x0). */
function walker(who: string, lt: number, o: {x0: number; dist: number; y0: number; slope?: number; floorAt?: (x: number) => number; S: number; steps: number; stepDur: number; lean?: number;
  head?: string; hold?: string}): {pose: Pose; S: number} {
  const r = PARTS[who]._rig, slope = o.slope ?? 0;
  const w = walkCycle({t: lt, t0: 0, x0: o.x0, dist: o.dist, steps: o.steps, stepDur: o.stepDur, floor: 0, lift: r.lift * o.S});
  const yAt = o.floorAt ?? ((x: number) => o.y0 + slope * (x - o.x0));
  const feet = {near: [w.feet.near[0], yAt(w.feet.near[0]) + w.feet.near[1]] as P, far: [w.feet.far[0], yAt(w.feet.far[0]) + w.feet.far[1]] as P};
  const lean = (o.lean ?? 6) + (w.stopped ? followThrough(w.since, 8, 11, 4.5) : 0);
  const hip: P = [w.x + (w.stopped ? followThrough(w.since, 20, 11, 4.5) : 0), yAt(w.x) - r.hipHeight * o.S - 20 * o.S * w.hipDip];
  const sh = shoulders(who, hip, lean, o.S, false);
  const near = hangHand(sh.near, w.swing.near, r.reach * o.S, lean, false), far = hangHand(sh.far, w.swing.far, r.reach * o.S, lean, false);
  return {S: o.S, pose: {hip, lean, head: o.head ?? 'head-happy', headRot: 0, feet, squash: squashAt(lt),
    hands: {near, far, nearPart: o.hold ? 'hand-near-grab' : 'hand-near-open', farPart: 'hand-far-open'}, flip: false}};
}

/** Plate 40's staircase: the top of each carpeted tread (still px), stepping down left to right. */
const TREADS: [number, number][] = [[165, 900], [240, 932], [345, 968], [465, 1005], [585, 1040], [720, 1070], [900, 1105], [1045, 1140], [1165, 1170]];
export function stairs40(x: number): number {
  if (x < 100) return 900 - 0.33 * (100 - x);           // the flight continues up out of frame
  for (const [xe, y] of TREADS) if (x < xe) return y;
  return 1200;
}

/** 40: Christmas morning — the family runs down the stairs left to right, one after another, feet on the treads. */
export const shot40: Choreo = (_t, frame, shot) => {
  const lt = twos(frame) - shot.start;
  const fam: [string, number, number][] = [['kid2', 0.0, 300], ['kid1', 0.2, 300], ['mum', 0.45, 560], ['dad', 0.7, 600]];
  return fam.map(([who, delay, h], i) => {
    const w = walker(who, lt - delay, {x0: 60 - 120 * i, dist: 1900, y0: 0, floorAt: stairs40, S: scaleFor(who, h), steps: 16, stepDur: 0.12, lean: 12, head: 'head-happy'});   // runs on off the right edge
    return {who, pose: w.pose, scale: w.S};
  }).reverse();
};

/** 49: "we're taking it back!" — townsfolk and elves march up the hill left to right holding lanterns. */
export const shot49: Choreo = (_t, frame, shot) => {
  const lt = twos(frame) - shot.start, items: Item[] = [];
  const line: [string, number][] = [['elf', 360], ['dad', 560], ['kid1', 300], ['elf', 360], ['mum', 520], ['kid2', 300], ['elf', 360]];
  line.forEach(([who, h], i) => {
    const w = walker(who, lt, {x0: -200 + 260 * i - 300, dist: 700, y0: 1090 - 10 * (i % 2), S: scaleFor(who, h), steps: 10, stepDur: 0.3, lean: 3, hold: 'lantern'});
    const swing = Math.sin(lt * 6 + i) * 10;
    items.push({who, pose: w.pose, scale: w.S});
    items.push({sprite: 'sprites/props/lantern', at: w.pose.hands.near, scale: 0.28, rot: swing});
  });
  return items;
};

/** 61: elves pack boxes on the beat behind the belt (the belt is redrawn in front of them); boxes slide along. */
export const shot61: Choreo = (_t, frame, shot) => {
  const t = twos(frame), lt = t - shot.start, items: Item[] = [], BELT = 930, S = scaleFor('elf', 560);
  for (let i = 0; i < 4; i++) {
    const x = 270 + 360 * i, hit = beatHit(t + i * 0.13), b = beat(t);
    const pose = stand('elf', {t, x, floor: 1090, S, lean: 4 * hit, head: i % 2 ? 'head-focus' : 'head-happy', spread: 70,
      hands: sh => ({near: add(sh.near, [70 * S, (330 - 120 * hit) * S]), far: add(sh.far, [-40 * S, (330 - 100 * hit) * S]),
        nearPart: (b.i + i) % 2 ? 'hand-near-box' : 'hand-near-open', farPart: 'hand-far-open'})});
    items.push({who: 'elf', pose, scale: S});
  }
  items.push({front: {y: BELT}});
  for (let k = 0; k < 6; k++) {                                     // boxes slide right along the belt
    const x = ((lt * 160 + k * 300) % 1900) - 150;
    items.push({sprite: `sprites/props/${k % 2 ? 'box' : 'box-open'}`, at: [x, BELT + 10], scale: 0.42});
  }
  return items;
};
