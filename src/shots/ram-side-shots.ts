/** Ram (side puppet) acting shots: 10, 24, 25, 26, 27, 39, 63. Positions in still px, sized from each still. */
import {type P, add, easeOutBack, easeInOut, clamp01, lerp, followThrough, hoseEndAngle} from '../puppet/geom.ts';
import {PARTS} from '../puppet/parts.ts';
import impact from '../timing/impact.json' with {type: 'json'};
import type {Choreo, Item} from './types.ts';
import {stand, scaleFor, beatHit, wordAt, twos} from './kit.ts';

const W = 'ram-side';
const rig = () => PARTS[W]._rig;
const prop = (sprite: string, at: P, scale: number, rot = 0): Item => ({sprite: `sprites/props/${sprite}`, at, scale, rot});

/** 10: "Every stick, every chip, every byte in the store!" — arms snake in from off-screen and snatch one item per word. */
export const shot10: Choreo = (_t, frame) => {
  const t = twos(frame), S = 0.42, r = rig(), c = r.colors;
  const targets: [number, P, string][] = [[wordAt(5, 1), [440, 540], 'ram-stick'], [wordAt(5, 3), [718, 555], 'chip'], [wordAt(5, 5), [950, 580], 'byte']]   // the painted shelf items;
  const items: Item[] = [];
  targets.forEach(([at, tgt, what], i) => {
    const near = i % 2 === 0, root: P = near ? [-60, 120] : [-60, 260];
    const u = clamp01((t - (at - 0.35)) / 0.35), back = clamp01((t - at - 0.12) / 0.5);
    if (t < at - 0.35 || back >= 1) return;
    const out = easeOutBack(u), ret = easeInOut(back);
    const hand: P = [lerp(root[0] + 120, tgt[0], out) + lerp(0, -tgt[0] - 200, ret), lerp(root[1] + 60, tgt[1], out) + lerp(0, -200, ret)];
    const L = r.armLen * S * 2.6;
    items.push({hose: {a: root, b: hand, L, side: 1, width: r.armW * S, fill: near ? c.sleeve : c.sleeveFar, ink: c.ink}});
    if (back > 0) items.push(prop(what, add(hand, [30, 10]), 0.5));
    const hp = back > 0 ? 'hand-near-grab' : 'hand-near-open';
    items.push({sprite: `puppets/ram-side/${hp}`, at: hand, scale: S, rot: hoseEndAngle(root, hand, L, 1), anchor: PARTS[W][hp].wrist, size: PARTS[W][hp].size});
  });
  return items;
};

/** 24: shoulder-pushes the vault door, heaving on every beat. */
export const shot24: Choreo = (_t, frame) => {
  const t = twos(frame), S = scaleFor(W, 516), floor = 876, hit = beatHit(t);
  const pose = stand(W, {t, x: 210 + 18 * hit, floor, S, lean: 24 + 8 * hit, head: 'head-grin', headRot: -6 * hit, spread: 220,
    feet: {near: [300, floor], far: [70, floor]},
    hands: () => ({near: [418, 600 - 10 * hit], far: [412, 700], nearPart: 'hand-near-open', farPart: 'hand-far-open'})});
  return [{who: W, pose, scale: S}];
};

/** 25: "He grabbed all the VRAM, he snatched all the cache" — rubber arms stretch to the shelf and yank back. */
export const shot25: Choreo = (_t, frame, shot) => {
  const t = twos(frame), S = scaleFor(W, 648), floor = 1104;
  const grab = wordAt(18, 3), snatch = wordAt(18, 6);
  const reach = easeOutBack(clamp01((t - shot.start) / 0.5));
  const pull = clamp01((t - snatch) / 0.45), pullE = easeOutBack(pull, 2.4);
  const holding = t > grab;
  const tgtN: P = [600, 660], tgtF: P = [650, 800], homeN: P = [330, 700], homeF: P = [300, 780];
  const handN: P = [lerp(lerp(260, tgtN[0], reach), homeN[0], pullE), lerp(lerp(720, tgtN[1], reach), homeN[1], pullE)];
  const handF: P = [lerp(lerp(240, tgtF[0], reach), homeF[0], pullE), lerp(lerp(800, tgtF[1], reach), homeF[1], pullE)];
  const lean = lerp(14, -16, pullE) + followThrough(t - snatch - 0.45, 6, 10, 4);
  const pose = stand(W, {t, x: 200, floor, S, lean, head: pull > 0 ? 'head-grin' : 'head-smirk', spread: 200,
    hands: () => ({near: handN, far: handF, nearPart: holding ? 'hand-near-grab' : 'hand-near-open', farPart: holding ? 'hand-far-grab' : 'hand-far-open'})});
  const items: Item[] = [];
  if (holding) items.push(prop('cache-jar', add(handF, [40, 10]), 0.55));
  items.push({who: W, pose, scale: S});
  if (holding) items.push(prop('gpu', add(handN, [50, 0]), 0.6));
  return items;
};

/** 26: shoves SSDs into the sack on the beats; on "umm, stash" he freezes and squints at the camera. */
export const shot26: Choreo = (_t, frame) => {
  const t = twos(frame), S = scaleFor(W, 1068), floor = 1128, frozen = t >= impact.stash;
  const hit = frozen ? 0 : beatHit(t);
  const pose = stand(W, {t, x: 1250, floor, S, flip: true, lean: frozen ? 4 : 10 + 10 * hit, spread: 160,
    head: frozen ? 'head-camera' : 'head-grin', headRot: frozen ? 0 : -5 * hit,
    hands: () => ({near: [1060 - 40 * hit, 760 + 60 * hit], far: [1290, 860], nearPart: 'hand-near-fist', farPart: 'hand-far-grab'})});
  const items: Item[] = [prop('sack', [1180, 900], 0.95), {who: W, pose, scale: S}];
  if (!frozen) items.push(prop('ssd', [1060 - 40 * hit, 740 + 60 * hit], 0.5, -20));
  return items;
};

/** 27: jabs a pointing finger at the chart on every beat. */
export const shot27: Choreo = (_t, frame) => {
  const t = twos(frame), S = scaleFor(W, 564), floor = 960, hit = beatHit(t);
  const pose = stand(W, {t, x: 1420, floor, S, flip: true, lean: 8 + 6 * hit, head: 'head-grin', headRot: -4 * hit, spread: 150,
    hands: sh => ({near: [1190 - 40 * hit, 590], far: add(sh.far, [-20, 150 * S * 1.2]), nearPart: 'hand-near-point', farPart: 'hand-far-open'})});
  return [{who: W, pose, scale: S}];
};

/** 39: "Squashing all the little guys" — the stamp goes up, then slams down on "Squashing". */
export const shot39: Choreo = (_t, frame, shot) => {
  const t = twos(frame), S = scaleFor(W, 468), floor = 528, slam = wordAt(31, 0);
  const up = easeInOut(clamp01((t - shot.start) / 0.6)), down = clamp01((t - slam) / 0.12);
  const stampY = lerp(lerp(380, 120, up), 470, down), stampX = lerp(820, 860, down);
  const pose = stand(W, {t, x: 700, floor, S, lean: lerp(-6, 22, down), head: down > 0 ? 'head-grin' : 'head-squint', spread: 160,
    hipBob: down > 0 ? 18 * Math.exp(-(t - slam) * 6) : 0,
    hands: () => ({near: [stampX - 20, stampY + 40], far: [stampX - 60, stampY + 50], nearPart: 'hand-near-fist', farPart: 'hand-far-fist'})});
  return [{who: W, pose, scale: S}, prop('stamp', [stampX, stampY], 0.55, lerp(-10, 0, down))];
};

/** 63: "But Sam, you're the best!" — a deep theatrical bow with a hat tip, then back up. */
export const shot63: Choreo = (_t, frame, shot) => {
  const t = twos(frame), S = scaleFor(W, 520), floor = 912;
  const bow = Math.sin(Math.PI * clamp01((t - shot.start - 0.3) / 2.4));
  const pose = stand(W, {t, x: 760, floor, S, lean: 58 * bow, head: bow > 0.5 ? 'head-fake-smile' : 'head-smirk', spread: 140,
    // near hand sweeps the hat down and out to the hip; far hand hangs at the side (both below the shoulders)
    hands: sh => ({near: add(sh.near, [lerp(40, 150, bow) * S, lerp(300, 200, bow) * S]), far: add(sh.far, [-40 * S, 300 * S]),
      nearPart: 'hand-near-open', farPart: 'hand-far-open'})});
  return [{who: W, pose, scale: S}];
};
