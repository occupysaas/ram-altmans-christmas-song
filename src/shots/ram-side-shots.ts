/** Ram (side puppet) acting shots: 10, 24, 25, 26, 27, 39, 63. Positions in still px, sized from each still. */
import {type P, add, easeOutBack, easeInOut, clamp01, lerp, followThrough, hoseEndAngle} from '../puppet/geom.ts';
import {PARTS} from '../puppet/parts.ts';
import impact from '../timing/impact.json' with {type: 'json'};
import audio from '../timing/audio.json' with {type: 'json'};
import shots from '../shots.json' with {type: 'json'};
import {hash} from '../fx/particles.ts';
import type {Choreo, Item} from './types.ts';
import {stand, scaleFor, beat, beatHit, wordAt, twos} from './kit.ts';
import {slamTimes, crowdItems, STAMP_AT} from './townsfolk.ts';

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

/** 24 (1:33): the round vault door rolls across the doorway like a stone; Ram, on its right, shoves it left a little
 *  more on every beat while kicks knock it back. RAM sticks and chips spill out of the gap and pile up on the floor. */
const DOOR = {cy: 510, r: 290, open: 1070, shut: 590, left: 300};
const kickHit = (t: number) => { let k = -1; for (const [x] of audio.kicks) { if (x <= t) k = x; else break; } return k < 0 ? 0 : Math.exp(-(t - k) / 0.12); };
const s24 = () => shots.find(x => x.id === '24')!;
/** Door centre x: pushed shut in beat-sized shoves, knocked back on kicks, never quite closed. */
export function vaultDoorX(t: number): number {
  const sh = s24(), p = clamp01((t - sh.start) / (sh.end - sh.start));
  const b = beat(t), shove = 1 - Math.exp(-b.since / 0.08);
  const steps = Math.max(0, b.i - beat(sh.start).i - 1 + shove);
  const prog = Math.min(0.86, 0.3 + 0.06 * steps + 0.08 * p);
  return lerp(DOOR.open, DOOR.shut, prog) + 28 * kickHit(t);
}
type Spill = {sprite: string; at: P; rot: number; landed: boolean};
const DT = 0.07, FLOOR_TOP = 900;
function spills(t: number): Spill[] {
  const sh = s24(), out: Spill[] = [];
  for (let j = 0; ; j++) {
    const te = sh.start + 0.3 + j * DT; if (te > t) break;
    const gapR = vaultDoorX(te) - DOOR.r; if (gapR - DOOR.left < 40) continue;
    const x0 = lerp(DOOR.left + 30, gapR - 10, hash(j * 1.3)), y0 = DOOR.cy + (hash(j * 2.9) - 0.5) * 360;
    const vx = 120 + 260 * hash(j * 5.1), vy = -260 * hash(j * 7.3), floorY = FLOOR_TOP + 230 * hash(j * 3.7);
    const T = (-vy + Math.sqrt(vy * vy + 2 * 2000 * (floorY - y0))) / 2000, a = Math.min(t - te, T);
    out.push({sprite: j % 3 ? 'ram-stick' : 'chip', at: [x0 + vx * a, y0 + vy * a + 1000 * a * a], rot: (a < T ? 700 * a : 0) + 360 * hash(j), landed: t - te >= T});
  }
  return out;
}
export const spillLanded = (t: number) => spills(t).filter(s => s.landed).length;

export const shot24: Choreo = (_t, frame) => {
  const t = twos(frame), S = scaleFor(W, 480), floor = 960, hit = beatHit(t), dx = vaultDoorX(t);
  const turn = (DOOR.open - dx) / DOOR.r * 180 / Math.PI;   // rolls as it slides
  const doorEdge = dx + DOOR.r;
  const pose = stand(W, {t, x: doorEdge + 170 - 20 * hit, floor, S, flip: true, lean: 28 + 10 * hit, head: 'head-grin', headRot: 6 * hit, spread: 200,
    feet: {near: [doorEdge + 190, floor], far: [doorEdge + 330, floor]},
    hands: () => ({near: [doorEdge - 8, DOOR.cy + 150], far: [doorEdge + 4, DOOR.cy + 240], nearPart: 'hand-near-open', farPart: 'hand-far-open'})});
  const items: Item[] = [{sprite: 'sprites/vault/door', at: [dx, DOOR.cy], scale: 2 * DOOR.r / 560, rot: -turn, size: [560, 560]}];
  for (const sp of spills(t)) items.push(prop(sp.sprite, sp.at, sp.sprite === 'chip' ? 0.32 : 0.26, sp.rot));
  items.push({who: W, pose, scale: S});
  return items;
};

/** 25 (1:38): a generic electronics store. Ram sweeps the RAM boxes off the shelf into an armful that teeters past his
 *  chin, three a beat, while a girl behind him reaches for a box and is left facing a bare shelf. */
const SHELVES = [370, 586, 760, 974], BOX_X = [150, 285, 420, 555, 690], BOX_S = 0.6;
const BOXES = SHELVES.flatMap((y, r) => BOX_X.map((x, c) => ({x: x + (r % 2 ? 20 : 0), y, k: r * 5 + (4 - c)}))).sort((a, b) => a.k - b.k);
const s25 = () => shots.find(x => x.id === '25')!;
/** How many boxes have been grabbed by time t: an even share on every beat in the shot, so the shelf is bare by the end. */
function grabbed(t: number) {
  const sh = s25(), b0 = beat(sh.start + 0.05).i, bN = beat(sh.end - 0.3).i, b = beat(t);
  const per = Math.ceil(BOXES.length / Math.max(1, bN - b0));
  if (b.i <= b0) return 0;
  return Math.min(BOXES.length, (b.i - b0) * per - (b.since < 0.12 ? Math.round(per * (1 - b.since / 0.12)) : 0));
}
export const shelfLeft = (t: number) => BOXES.length - Math.min(BOXES.length, grabbed(t));

export const shot25: Choreo = (_t, frame) => {
  const t = twos(frame), S = scaleFor(W, 640), floor = 1120, x = 1010, n = Math.min(BOXES.length, grabbed(t)), hit = beatHit(t);
  const items: Item[] = [];
  BOXES.slice(n).forEach(bx => items.push({sprite: 'sprites/store/ram-box', at: [bx.x, bx.y], scale: BOX_S, size: [220, 150], anchor: [110, 145]}));
  // the girl, behind him: reaches for a box, then droops as the shelf empties
  const gS = scaleFor('girl', 430), droop = clamp01(1 - shelfLeft(t) / BOXES.length);
  const girl = stand('girl', {t, x: 1380, floor: 1040, S: gS, flip: true, lean: 6 + 14 * droop, head: droop > 0.7 ? 'head-X' : 'head-A', spread: 90,
    hands: sh => ({near: add(sh.near, [lerp(-200, -60, droop) * gS, lerp(-20, 200, droop) * gS]), far: add(sh.far, [20 * gS, 230 * gS]), nearPart: 'hand-near-open', farPart: 'hand-far-open'})});
  items.push({who: 'girl', pose: girl, scale: gS});
  // Ram: arms out to the shelf on each beat, then hugging the growing stack
  const reach = hit, stackBase: P = [x - 70, floor - 470 * S * 1.15];
  const pose = stand(W, {t, x, floor, S, flip: true, lean: 18 * reach - 6, head: 'head-grin', headRot: -8 * reach, spread: 200,
    hands: () => ({near: [lerp(stackBase[0] - 40, 720, reach), lerp(stackBase[1] + 30, 640, reach)], far: [lerp(stackBase[0] + 40, 760, reach), lerp(stackBase[1] + 40, 700, reach)],
      nearPart: reach > 0.4 ? 'hand-near-open' : 'hand-near-grab', farPart: reach > 0.4 ? 'hand-far-open' : 'hand-far-grab'})});
  const shown = Math.min(n, 9);   // the armful is drawn behind him, so his face and arms read in front of it
  for (let i = 0; i < shown; i++) {
    const wob = Math.sin(t * 6 + i * 0.7) * i * 1.4;
    items.push({sprite: 'sprites/store/ram-box', at: [stackBase[0] + wob, stackBase[1] - i * 52], scale: 0.5, size: [220, 150], anchor: [110, 145], rot: wob * 0.6});
  }
  items.push({who: W, pose, scale: S});
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

/** 39: "Squashing all the little guys" — Ram slams the stamp every two beats while the town square panics around
 *  him (crowd in townsfolk.ts); anyone caught under it is flattened. */
export const shot39: Choreo = (_t, frame, shot) => {
  const t = twos(frame), S = scaleFor(W, 468), floor = 528, slams = slamTimes(shot);
  const last = slams.filter(x => x <= t).pop(), next = slams.find(x => x > t);
  const down = last !== undefined ? clamp01((t - last) / 0.1) * (1 - clamp01((t - last - 0.3) / 0.35)) : 0;
  const raise = next !== undefined ? easeInOut(clamp01(1 - (next - t) / 0.5)) : 0;
  const stampY = down > 0 ? lerp(160, 470, down) : lerp(300, 120, raise), stampX = lerp(820, 860, Math.max(down, raise * 0.5));
  const pose = stand(W, {t, x: 700, floor, S, lean: lerp(-6, 22, down), head: down > 0 ? 'head-grin' : 'head-squint', spread: 160,
    hipBob: last !== undefined && down > 0 ? 18 * Math.exp(-(t - last) * 6) : 0,
    hands: () => ({near: [stampX - 20, stampY + 40], far: [stampX - 60, stampY + 50], nearPart: 'hand-near-fist', farPart: 'hand-far-fist'})});
  const crowd = crowdItems(t, shot), items: Item[] = [...crowd.behind, {who: W, pose, scale: S}, prop('stamp', [stampX, stampY], 0.55, lerp(-10, 0, down))];
  if (last !== undefined && t - last < 0.3) for (let k = 0; k < 10; k++) {   // snow puff on impact
    const a = t - last, th = Math.PI * (k / 9), r = 60 + 420 * a;
    items.push({draw: {kind: 'dot', at: [STAMP_AT[0] + Math.cos(th) * r * (k % 2 ? 1 : -1), STAMP_AT[1] - Math.sin(th) * r * 0.25], size: 22 - 40 * a, color: '#f4f2ff', opacity: 1 - a / 0.3}});
  }
  return [...items, ...crowd.front];
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
