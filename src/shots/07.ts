/** 07 (0:34-0:37): Sam at his desk, seen from behind, clicking around. The mouse darts to a new spot on each beat,
 *  his finger clicks on snares, and the cursor on the big screen follows (x4) and pops a ring. Painted arm layers. */
import {type P, add, rotAbout, easeInOut, clamp01} from '../puppet/geom.ts';
import {hash} from '../fx/particles.ts';
import audio from '../timing/audio.json' with {type: 'json'};
import {groove} from '../puppet/groove.ts';
import {twos} from './kit.ts';
import type {Choreo, Item} from './types.ts';

const beats: number[] = audio.beats, snares: number[] = (audio.snares as number[][]).map(s => s[0]);
// WRIST sits just inside the painted hand's wrist, so the cuff overlaps it
// SHOULDER: on the sweater seam, where the arm leaves the body
const SHOULDER: P = [850, 740], WRIST: P = [1010, 830], SEAT: P = [780, 900], SCREEN: P = [800, 336];
const DART = 0.1;

const spot = (i: number): P => [Math.round(90 * (hash(i * 3.1) - 0.5)), Math.round(30 * (hash(i * 7.7) - 0.5))];
const last = (arr: number[], t: number) => { let k = -1; for (let i = 0; i < arr.length && arr[i] <= t; i++) k = i; return k; };

/** Mouse offset from its painted spot (still px): eased dart over 0.1 s after each beat, then held. */
export function mouseOffset(t: number): P {
  const i = last(beats, t);
  if (i < 0) return [0, 0];
  const u = easeInOut(clamp01((t - beats[i]) / DART)), a = spot(i - 1), b = spot(i);
  return [Math.round(a[0] + (b[0] - a[0]) * u), Math.round(a[1] + (b[1] - a[1]) * u)];
}

export const shot07: Choreo = (_t, frame) => {
  const t = twos(frame), m = mouseOffset(t), g = groove(t), on = g.active ? 1 : 0.4;
  const k = last(snares, t), click = k >= 0 ? t - snares[k] : 9;
  const press = click < 0.08 ? 1 : 0, rot = 1.6 * g.sway * on, bob = 5 * g.bob * on;
  // the painted right arm (with hand + mouse) pivots at the shoulder toward the mouse's new spot, kept within
  // ±6° so the forearm stays lying on the desk; the cursor on the screen follows where the hand actually is
  const want = add(WRIST, m), ang = (p: P) => Math.atan2(p[1] - SHOULDER[1], p[0] - SHOULDER[0]) * 180 / Math.PI;
  const armRot = Math.max(-6, Math.min(6, ang(want) - ang(WRIST))), hand = rotAbout(WRIST, SHOULDER, armRot);
  const cursor = add(SCREEN, [(hand[0] - WRIST[0]) * 4, (hand[1] - WRIST[1]) * 5]), armDy = 0.6 * bob;
  // layering: plate (desk, keyboard) -> Sam without arms -> both painted arms on the desk -> chair back
  const items: Item[] = [
    {layer: '07/sam-noarms', dy: bob, rot, pivot: SEAT},
    {layer: '07/arm-left', dy: armDy},
    {layer: press ? '07/arm-mouse-click' : '07/arm-mouse', dy: armDy, rot: armRot, pivot: SHOULDER},
    {layer: '07/chair-back'},
    {draw: {kind: 'cursor', at: cursor, size: 46}},
  ];
  if (click < 0.3) items.push({draw: {kind: 'ring', at: add(cursor, [4, 4]), size: 10 + 70 * click, opacity: 1 - click / 0.3, color: '#fffbe0'}});
  return items;
};
