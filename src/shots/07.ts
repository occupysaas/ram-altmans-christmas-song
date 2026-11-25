/** 07 (0:34-0:37): Sam at his desk, seen from behind, clicking around. The mouse darts to a new spot on each beat,
 *  his finger clicks on snares, the cursor on the big screen follows (x4) and pops a ring, and his head turns toward it. */
import {type P, add, rotAbout, easeInOut, clamp01} from '../puppet/geom.ts';
import {hash} from '../fx/particles.ts';
import audio from '../timing/audio.json' with {type: 'json'};
import {groove} from '../puppet/groove.ts';
import {twos} from './kit.ts';
import type {Choreo, Item} from './types.ts';

const beats: number[] = audio.beats, snares: number[] = (audio.snares as number[][]).map(s => s[0]);
// WRIST sits just inside the painted hand's wrist, so the cuff overlaps it
// SHOULDER: on the sweater seam, where the arm leaves the body
const SHOULDER: P = [835, 748], WRIST: P = [946, 836], SEAT: P = [780, 900], SCREEN: P = [800, 336];
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
  const shoulder = add(rotAbout(SHOULDER, SEAT, rot), [0, bob]);
  const wrist = add(WRIST, m), cursor = add(SCREEN, [m[0] * 4, m[1] * 5]);
  // the elbow rests on the desk near his side and slides a little with the mouse
  const elbow: P = [866 + 0.4 * m[0], wrist[1] + 2];
  const items: Item[] = [
    {layer: m[0] < -15 ? '07/sam-head-left' : '07/sam', dy: bob, rot, pivot: SEAT},
    // the arm as in the painting: upper arm down to an elbow at desk height (tucked behind the chair back),
    // then the forearm lying flat along the desk to the wrist; the hand over its end, a cuff band on the join
    {hose: {a: shoulder, b: elbow, L: Math.hypot(elbow[0] - shoulder[0], elbow[1] - shoulder[1]) * 1.02, side: 1, width: 32, fill: '#9a9aa0', ink: '#17121c'}},
    {hose: {a: elbow, b: wrist, L: Math.hypot(wrist[0] - elbow[0], wrist[1] - elbow[1]) * 1.01, side: 1, width: 30, fill: '#9a9aa0', ink: '#17121c'}},
    {layer: '07/hand', dx: m[0], dy: m[1] + 2 * press, sy: press ? 0.92 : 1, pivot: [1010, 860]},
    {draw: {kind: 'ellipse', at: add(wrist, [-6, 0]), size: 0, w: 22, h: 38, color: '#8a8a90', rot: Math.atan2(wrist[1] - shoulder[1], wrist[0] - shoulder[0]) * 180 / Math.PI, cuff: true}},
    {layer: '07/chair-back'},
    {draw: {kind: 'cursor', at: cursor, size: 46}},
  ];
  if (click < 0.3) items.push({draw: {kind: 'ring', at: add(cursor, [4, 4]), size: 10 + 70 * click, opacity: 1 - click / 0.3, color: '#fffbe0'}});
  return items;
};
