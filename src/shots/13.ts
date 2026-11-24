/** Shot 13: "But he never once asked all the folks down below" — the approved rubber-hose sneak to the window,
 *  feet plant, body follows through, then he hunches, rubs his hands and squints down at the town. */
import {add, followThrough, onTwos, squashAt} from '../puppet/geom.ts';
import {walkCycle} from '../puppet/walk.ts';
import {hangHand, shoulders} from '../puppet/body.ts';
import {PARTS} from '../puppet/parts.ts';
import type {Choreo} from './types.ts';

const WHO = 'ram-side', S = 0.36, FLOOR = 1030;
export const shot13: Choreo = (_t, frame, shot) => {
  const rig = PARTS[WHO]._rig;
  const tq = onTwos(frame) / 24, lt = tq - shot.start;
  const w = walkCycle({t: lt, t0: 0, x0: 170, dist: 600, steps: 6, stepDur: 0.31, floor: FLOOR, lift: rig.lift * S});
  const since = w.since, peer = w.stopped && since > 0.45;
  const x = w.x + (w.stopped ? followThrough(since, 38, 11, 4.5) : 0);
  const hipY = FLOOR - rig.hipHeight * S + (w.stopped ? -followThrough(since, 10, 11, 4.5, 0.04) : -24 * w.hipDip);
  const lean = w.stopped ? (peer ? 16 : 7) + followThrough(since, 9, 11, 4.5, 0.03) : 7;
  const hip: [number, number] = [x, hipY];
  const sh = shoulders(WHO, hip, lean, S, false);
  const rub = Math.sin(lt * 16) * 8;
  const hands = peer
    ? {near: add(sh.near, [145 * S + rub, 194 * S]), far: add(sh.far, [177 * S - rub, 185 * S]), nearPart: 'hand-near-grab', farPart: 'hand-far-open'}
    : {near: hangHand(sh.near, w.swing.near, rig.reach * S, lean, false), far: hangHand(sh.far, w.swing.far, rig.reach * S, lean, false),
       nearPart: 'hand-near-open', farPart: 'hand-far-open'};
  return [{who: WHO, scale: S, pose: {hip, lean, head: peer ? 'head-squint' : 'head-smirk',
    headRot: (peer ? 12 : 0) + followThrough(since, -10, 10, 4, 0.08), hands, feet: w.feet, squash: squashAt(tq), flip: false}}];
};
