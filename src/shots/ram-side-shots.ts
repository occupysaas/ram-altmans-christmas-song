/** Ram (side puppet) acting shots: 10, 24, 25, 26, 27, 39, 63. Positions in still px, sized from each still. */
import {type P, add, easeOutBack, easeInOut, clamp01, lerp, followThrough, hoseEndAngle, hoseControl} from '../puppet/geom.ts';
import {PARTS} from '../puppet/parts.ts';
import {shoulders} from '../puppet/body.ts';
import impact from '../timing/impact.json' with {type: 'json'};
import audio from '../timing/audio.json' with {type: 'json'};
import shots from '../shots.json' with {type: 'json'};
import {hash} from '../fx/particles.ts';
import type {Choreo, Item} from './types.ts';
import {stand, scaleFor, beat, beatHit, wordAt, twos} from './kit.ts';
import {slamTimes, crowdItems, STAMP_AT, RAM39} from './townsfolk.ts';

const W = 'ram-side';
const rig = () => PARTS[W]._rig;
const prop = (sprite: string, at: P, scale: number, rot = 0): Item => ({sprite: `sprites/props/${sprite}`, at, scale, rot});

/** 10: "Every stick, every chip, every byte in the store!" — the shelf (plate 10, emptied) is stocked with RAM sticks, a
 *  chip and a byte; rubber arms snake in from off-screen and take them one by one, each item leaving with the hand. */
export const SHELF10: {sprite: string; pos: P; rot: number; scale: number; at: number}[] = [
  {sprite: 'ram-stick', pos: [95, 612], rot: -72, scale: 0.62, at: wordAt(5, 1)},   // stick
  {sprite: 'ram-stick', pos: [205, 612], rot: -72, scale: 0.62, at: wordAt(5, 3)},   // chip
  {sprite: 'chip', pos: [718, 562], rot: 0, scale: 0.85, at: wordAt(5, 4)},
  {sprite: 'byte', pos: [952, 570], rot: 0, scale: 0.7, at: wordAt(5, 5)},   // byte
  {sprite: 'ram-stick', pos: [420, 612], rot: -72, scale: 0.62, at: wordAt(5, 6)},
  {sprite: 'ram-stick', pos: [530, 612], rot: -72, scale: 0.62, at: wordAt(5, 8)},   // store
];
export const shot10: Choreo = (_t, frame) => {
  const t = twos(frame), S = 0.42, r = rig(), c = r.colors;
  const items: Item[] = [];
  for (const it of SHELF10) if (t < it.at) items.push({...prop(it.sprite, it.pos, it.scale, it.rot), shelf: true} as Item);
  SHELF10.forEach((it, i) => {
    // grab each item 80 px up from its foot (its middle); the item then hangs from the hand
    const near = i % 2 === 0, root: P = near ? [-60, 120] : [-60, 260], tgt: P = [it.pos[0], it.pos[1] - 80];
    const u = clamp01((t - (it.at - 0.3)) / 0.3), back = clamp01((t - it.at - 0.08) / 0.4);
    if (t < it.at - 0.3 || back >= 1) return;
    const out = easeOutBack(u), ret = easeInOut(back);
    const hand: P = [lerp(root[0] + 120, tgt[0], out) + lerp(0, -tgt[0] - 260, ret), lerp(root[1] + 60, tgt[1], out) + lerp(0, -200, ret)];
    const L = r.armLen * S * 2.6;
    items.push({hose: {a: root, b: hand, L, side: 1, width: r.armW * S, fill: near ? c.sleeve : c.sleeveFar, ink: c.ink}});
    if (t >= it.at) items.push(prop(it.sprite, add(hand, [0, 80]), it.scale, it.rot + 30 * back));
    const hp = t >= it.at ? 'hand-near-grab' : 'hand-near-open';
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

/** 25 geometry (pass 3): a GIANT bloated canister vacuum (5x) stands on the floor behind Ram, belly bulging on every
 *  beat; its fat hose runs from the socket on top to the nozzle wand he aims at the shelf row being emptied. */
const R25 = {x: 1080, floor: 1120}, CAN_S = 2.75, NOZ_S = 1.6, CAN_AT: P = [1390, 1150];
export function vacuum25(t: number, shot: {start: number; end: number}) {
  const n = Math.min(BOXES.length, grabbed(t)), row = Math.min(3, Math.floor(n / 5)), hit = beatHit(t), S = scaleFor(W, 640);
  const aimY = lerp(SHELVES[0] + 10, SHELVES[3] - 30, row / 3) + 6 * Math.sin(t * 9);
  const wandEnd: P = [R25.x - 120, lerp(aimY, 700, 0.4)];
  const grip: P = [wandEnd[0] - 70, wandEnd[1] + 6];
  const mouth: P = [wandEnd[0] - 330 * NOZ_S, aimY];
  const pose = stand(W, {t, x: R25.x, floor: R25.floor, S, flip: true, lean: 12 + 8 * hit, head: 'head-grin', headRot: -4 * hit, spread: 220,
    hands: () => ({near: grip, far: add(wandEnd, [14, 16]), nearPart: 'hand-near-grab', farPart: 'hand-far-grab'})});
  const belly = 1 + 0.1 * hit;                                   // the tank swells on each beat
  // the spout is at sprite x≈185 (the body is centred at 200, the anchor)
  const socket: P = [CAN_AT[0] + (185 - 200) * CAN_S * 0.45 * belly, CAN_AT[1] - 380 * CAN_S * (2 - belly) * 0.95];
  const b0 = beat(shot.start + 0.05).i, bN = beat(shot.end - 0.3).i;
  return {socket, wandEnd, grip, mouth, aimY, pose, S, belly, lastBeat: audio.beats[bN], b0, n};
}

export const shot25: Choreo = (_t, frame, shot) => {
  const t = twos(frame), g = vacuum25(t, shot), S = g.S;
  const items: Item[] = [];
  BOXES.slice(g.n).forEach(bx => items.push({sprite: 'sprites/store/ram-box', at: [bx.x, bx.y], scale: BOX_S, size: [220, 150], anchor: [110, 145]}));
  // suction: wind lines from all over the shelf streaming into the nozzle mouth
  for (let k = 0; k < 16; k++) {
    const u = (t * 1.4 + hash(k * 3.3)) % 1, from: P = [120 + 650 * hash(k * 1.7), 300 + 700 * hash(k * 5.1)];
    const p: P = [lerp(from[0], g.mouth[0], u * u), lerp(from[1], g.mouth[1], u * u)], q: P = [lerp(p[0], g.mouth[0], 0.25), lerp(p[1], g.mouth[1], 0.25)];
    items.push({draw: {kind: 'line', at: p, to: q, size: 9, color: '#ffffff', opacity: Math.min(1, 1.3 * Math.sin(Math.PI * u))}});
  }
  // the giant canister, bloated and bouncing, then Ram in front of it, the fat hose and the nozzle
  // a tall narrow tank (45% of the old width), no backpack straps
  items.push({sprite: 'sprites/vacuum/canister-nostrap', at: CAN_AT, scale: CAN_S, size: [300, 380], anchor: [200, 380], sx: 0.45 * g.belly, sy: 2 - g.belly} as Item);
  items.push({who: W, pose: g.pose, scale: S});
  const d = Math.hypot(g.wandEnd[0] - g.socket[0], g.wandEnd[1] - g.socket[1]);
  items.push({hose: {a: g.socket, b: g.wandEnd, L: d * 1.06, side: 1, width: 64, fill: '#6e5536', ink: '#17121c'}});
  // each swallowed box rides up the hose as a bulge, ON the hose's actual curve (the same quadratic the Hose draws)
  const hc = hoseControl(g.socket, g.wandEnd, d * 1.06, 1);
  for (let k = Math.max(0, g.n - 6); k < g.n; k++) {
    const u = 1 - (t - grabTime(k, shot) - 0.3) / 0.45;
    if (u > 0 && u < 1) {
      const x = (1 - u) ** 2 * g.socket[0] + 2 * (1 - u) * u * hc[0] + u * u * g.wandEnd[0], y = (1 - u) ** 2 * g.socket[1] + 2 * (1 - u) * u * hc[1] + u * u * g.wandEnd[1];
      items.push({draw: {kind: 'dot', at: [x, y], size: 44, color: '#7d6140', ink: '#17121c', gulp: true}});
    }
  }
  const ang = Math.atan2(g.mouth[1] - g.wandEnd[1], g.wandEnd[0] - g.mouth[0]) * 180 / Math.PI;
  // a leaf-blower tube: straight rigid red tube with brass bands, its round opening facing left at the shelf
  items.push({draw: {kind: 'line', at: g.wandEnd, to: g.mouth, size: 78, color: '#17121c'}});
  items.push({draw: {kind: 'line', at: g.wandEnd, to: g.mouth, size: 68, color: '#c8102e'}});
  for (const u of [0.15, 0.55, 0.92]) items.push({draw: {kind: 'line', at: [lerp(g.wandEnd[0], g.mouth[0], u) - 7, lerp(g.wandEnd[1], g.mouth[1], u)], to: [lerp(g.wandEnd[0], g.mouth[0], u) + 7, lerp(g.wandEnd[1], g.mouth[1], u)], size: 74, color: '#e0b040'}});
  items.push({draw: {kind: 'ellipse', at: g.mouth, size: 0, w: 46, h: 96, color: '#e0b040', rot: -ang}});
  items.push({draw: {kind: 'ellipse', at: [g.mouth[0] - 4, g.mouth[1]], size: 0, w: 30, h: 76, color: '#1b0f08', rot: -ang, mouth: true}});
  for (let k = Math.max(0, g.n - 6); k < g.n; k++) {   // boxes whooshing off the shelf into the mouth
    const bx = BOXES[k], u = clamp01((t - grabTime(k, shot)) / 0.3);
    if (u >= 1) continue;
    items.push({sprite: 'sprites/store/ram-box', at: [lerp(bx.x, g.mouth[0], u * u), lerp(bx.y - 70, g.mouth[1], u)], scale: BOX_S * (1 - 0.75 * u), size: [220, 150], anchor: [110, 75], rot: 300 * u});
  }
  return items;
};
/** When box k leaves the shelf. */
function grabTime(k: number, shot: {start: number; end: number}): number {
  const b0 = beat(shot.start + 0.05).i, bN = beat(shot.end - 0.3).i, per = Math.ceil(BOXES.length / Math.max(1, bN - b0));
  return audio.beats[b0 + 1 + Math.floor(k / per)];
}

/** 26: shoves SSDs into the sack on the beats; on "umm, stash" he freezes and squints at the camera. */
export const shot26: Choreo = (_t, frame) => {
  const t = twos(frame), S = scaleFor(W, 1068), floor = 1128, frozen = t >= impact.stash;
  const hit = frozen ? 0 : beatHit(t);
  const pose = stand(W, {t, x: 1250, floor, S, flip: true, lean: frozen ? 4 : 10 + 10 * hit, spread: 160,
    head: frozen ? 'head-camera' : 'head-grin', headRot: frozen ? 0 : -5 * hit,
    hands: () => ({near: [1060 - 40 * hit, 760 + 60 * hit], far: [1290, 860], nearPart: 'hand-near-fist', farPart: 'hand-far-grab'})});
  // a mountain of RAM heaped beside the sack (the stash he's shovelling from)
  const items: Item[] = [{sprite: 'sprites/props/ram-pile', at: [800, 1150], scale: 1.35, size: [520, 420], anchor: [260, 410]}, prop('sack', [1180, 900], 0.95), {who: W, pose, scale: S}];
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
  const t = twos(frame), S = scaleFor(W, 600), floor = RAM39.floor, slams = slamTimes(shot);
  const last = slams.filter(x => x <= t).pop(), next = slams.find(x => x > t);
  const down = last !== undefined ? clamp01((t - last) / 0.1) * (1 - clamp01((t - last - 0.3) / 0.35)) : 0;
  const raise = next !== undefined ? easeInOut(clamp01(1 - (next - t) / 0.5)) : 0;
  const stampY = down > 0 ? lerp(300, STAMP_AT[1] - 70, down) : lerp(420, 260, raise), stampX = lerp(STAMP_AT[0] - 60, STAMP_AT[0], Math.max(down, raise * 0.5));
  const pose = stand(W, {t, x: RAM39.x, floor, S, lean: lerp(-6, 22, down), head: down > 0 ? 'head-grin' : 'head-squint', spread: 160,
    hipBob: last !== undefined && down > 0 ? 18 * Math.exp(-(t - last) * 6) : 0,
    hands: () => ({near: [stampX - 20, stampY + 40], far: [stampX - 60, stampY + 50], nearPart: 'hand-near-fist', farPart: 'hand-far-fist'})});
  const crowd = crowdItems(t, shot), items: Item[] = [...crowd.behind, {who: W, pose, scale: S}, prop('stamp', [stampX, stampY], 0.7, lerp(-10, 0, down))];
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
