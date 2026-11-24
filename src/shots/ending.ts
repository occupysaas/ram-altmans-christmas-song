/** Ending (58, 59): the girl asks (lip-sync lines 46-47), Ram answers (line 48) and they high-five. */
import {type P, add, clamp01, easeOutBack} from '../puppet/geom.ts';
import {mouthAt} from '../lipsync.ts';
import type {Choreo, Item} from './types.ts';
import {stand, scaleFor, wordAt, twos} from './kit.ts';

const head = (who: 'girl' | 'ram', t: number, rest: string) => { const m = mouthAt(who, t); return m === 'X' ? rest : `head-${m}`; };

/** 58: over Ram's shoulder (left, big, cut off) down to the girl on the step; she sways hopefully and lifts the trifold on "prize". */
export const shot58: Choreo = (_t, frame, shot) => {
  const t = twos(frame), lt = t - shot.start;
  const gS = scaleFor('girl', 470), rS = scaleFor('ram-34', 1500);
  const prize = wordAt(47, 9), lift = easeOutBack(clamp01((t - prize + 0.2) / 0.4));
  const sway = Math.sin(lt * 2.4) * 6;
  const girl = stand('girl', {t, x: 1000, floor: 1130, S: gS, lean: sway * 0.6, head: head('girl', t, 'head-X'), spread: 80, groove: false,
    hands: sh => ({near: add(sh.near, [-60 * gS, (120 - 200 * lift) * gS * 2]), far: add(sh.far, [60 * gS, (130 - 200 * lift) * gS * 2]),
      nearPart: 'hand-near-open', farPart: 'hand-far-open'})});
  const ram = stand('ram-34', {t, x: 160, floor: 2050, S: rS, lean: 8, head: 'head-fake-smile', spread: 100, groove: false,
    hands: sh => ({near: add(sh.near, [200 * rS, 500 * rS]), far: add(sh.far, [-100 * rS, 500 * rS]), nearPart: 'hand-near-open', farPart: 'hand-far-open'})});
  const board: P = add(girl.hands.near, [-30, 40]);
  return [{who: 'girl', pose: girl, scale: gS}, {sprite: 'sprites/props/trifold', at: board, scale: gS * 1.2, rot: -4 + sway * 0.3},
          {who: 'ram-34', pose: ram, scale: rS}];
};

/** 59: two-shot on the doorstep; Ram crouches, both reach up, palms meet on "hi-five!", sparkle; he says subscribe. */
export const shot59: Choreo = (_t, frame) => {
  const t = twos(frame);
  const gS = scaleFor('girl', 560), rS = scaleFor('ram-34', 760);
  const hi5 = wordAt(48, 1), up = clamp01((t - hi5 + 0.45) / 0.4), hit = t >= hi5 && t < hi5 + 0.35;
  const meet: P = [760, 420];
  const ram = stand('ram-34', {t, x: 470, floor: 1040, S: rS, lean: 10, head: head('ram', t, 'head-fake-smile'), spread: 200, hipBob: 160 * rS, groove: false,
    hands: sh => ({near: [sh.near[0] + (meet[0] - 30 - sh.near[0]) * up, sh.near[1] + (meet[1] - sh.near[1]) * up + 200 * (1 - up)],
      far: add(sh.far, [-80 * rS, 420 * rS]), nearPart: up > 0.6 ? 'hand-near-hi5' : 'hand-near-open', farPart: 'hand-far-open'})});
  const girl = stand('girl', {t, x: 1050, floor: 1050, S: gS, lean: -4, head: t > hi5 + 0.2 && mouthAt('ram', t) === 'X' ? 'head-delight' : head('girl', t, 'head-X'), spread: 80, groove: false,
    hands: sh => ({near: [sh.near[0] + (meet[0] + 30 - sh.near[0]) * up, sh.near[1] + (meet[1] - sh.near[1]) * up + 160 * (1 - up)],
      far: add(sh.far, [40 * gS, 240 * gS]), nearPart: up > 0.6 ? 'hand-near-hi5' : 'hand-near-open', farPart: 'hand-far-open'})});
  const items: Item[] = [{who: 'girl', pose: girl, scale: gS}, {who: 'ram-34', pose: ram, scale: rS}];
  if (hit) for (let i = 0; i < 8; i++) { const a = i / 8 * 2 * Math.PI, r = 40 + 260 * (t - hi5);
    items.push({shade: {x: meet[0] + Math.cos(a) * r - 14, y: meet[1] + Math.sin(a) * r - 14, w: 28, h: 28, opacity: 1 - (t - hi5) / 0.35, color: '#fff6b0', round: true}}); }
  return items;
};
