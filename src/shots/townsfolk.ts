/** 36 (2:23) carolers that actually sing, and 39 (2:35) the town square in a panic while Ram stamps. */
import {type P, add, clamp01, easeOutBack, lerp} from '../puppet/geom.ts';
import {hash, cycle} from '../fx/particles.ts';
import {groove} from '../puppet/groove.ts';
import {shoulders} from '../puppet/body.ts';
import {PARTS} from '../puppet/parts.ts';
import lyrics from '../timing/lyrics-aligned.json' with {type: 'json'};
import audio from '../timing/audio.json' with {type: 'json'};
import layers from '../../public/sprites/layers/layers.json' with {type: 'json'};
import {beat, scaleFor, twos, wordAt} from './kit.ts';
import type {Choreo, Item, Pose} from './types.ts';

type Shot = {start: number; end: number};
const IDX = layers as Record<string, {x: number; y: number; w: number; h: number}>;

/** 36: six carolers sway on the bar and bob on the beat; on every sung word their mouths open wide ("O"), the
 *  songbook tips, and music notes float up out of the group. Not lip-sync: one open shape per word onset. */
const WORD_TIMES = lyrics.flatMap(l => l.words.map(w => w.s));
export const shot36: Choreo = (_t, frame, shot) => {
  const t = twos(frame), g = groove(t, true), items: Item[] = [];
  const lastWord = WORD_TIMES.filter(w => w <= t + 0.12 && w >= shot.start - 0.3).pop();   // +0.12: held frames can sit up to 3 frames early
  for (let i = 1; i <= 6; i++) {
    const key = `36/caroler${i}`, L = IDX[key], feet: P = [L.x + L.w / 2, L.y + L.h];
    const singing = lastWord !== undefined && t - lastWord < 0.3 + 0.02 * (i % 3);
    const book = i === 4 ? 3 * Math.sin(t * 7) : 0;
    items.push({layer: singing ? `${key}-sing` : key, dy: -7 * g.bob, rot: 2.2 * g.sway * (i % 2 ? 1 : 0.8) + book, pivot: feet});
  }
  for (let k = 0; k < 9; k++) {
    const {age} = cycle(k + 50, t, 1.6), who = IDX[`36/caroler${1 + (k % 6)}`];
    const x = who.x + who.w * 0.6 + 60 * Math.sin(age * 5 + k) + 40 * age, y = who.y + who.h * 0.12 - 320 * age;
    items.push({draw: {kind: 'note', at: [x, y], size: 54 + 20 * hash(k), text: k % 3 ? '♪' : '♫', opacity: Math.sin(Math.PI * age), rot: 15 * Math.sin(age * 6 + k)}});
  }
  return items;
};

/** 39: Ram stamps every two beats; 14 townsfolk run around the square in panic (arms up), scattering away from each
 *  slam; three are caught under the stamp, flattened into pancakes, then pop back up and run. */
export function slamTimes(shot: Shot): number[] {
  const first = wordAt(31, 0), out: number[] = [];
  for (const b of audio.beats) if (b >= first - 0.05 && b < shot.end - 0.3 && (out.length === 0 || b - out[out.length - 1] > 0.9)) out.push(b);
  return out;
}
/** Ram stands centre stage; the stamp lands well out in front of him (rubber arms), on his right. */
export const RAM39 = {x: 800, floor: 760};
export const STAMP_AT: P = [1100, 760];
const WHO = ['dad', 'mum', 'kid1', 'kid2', 'elf'];
type Runner = {who: string; x: number; y: number; vx: number; vy: number; flip: boolean; flat: boolean; flatAge: number; dist: number};
const FLAT = 0.6;

/** The crowd circles Ram on ellipses (some clockwise, some not), never closer than 260 px (y counted double for depth).
 *  On every slam the whole ring bursts outward and drifts back. Runner 0 is timed to be under the first stamp. */
export function shot39crowd(t: number, shot: Shot): Runner[] {
  const slams = slamTimes(shot), rs: Runner[] = [];
  const burst = (q: number) => slams.reduce((k, s) => k + (q >= s ? 0.55 * Math.exp(-(q - s) / 0.5) * Math.min(1, (q - s) / 0.08) : 0), 0);
  for (let i = 0; i < 14; i++) {
    const victim = i === 0;
    const rx = victim ? 300 : 400 + 260 * hash(i * 3.3), ry = victim ? 160 : 190 + 90 * hash(i * 5.9);
    const w = (victim ? -1 : hash(i * 1.7) < 0.5 ? -1 : 1) * (0.7 + 0.6 * hash(i * 2.2));
    const th0 = victim ? -w * (slams[0] - shot.start) : 2 * Math.PI * hash(i * 9.1);   // victim: at angle 0 (the stamp) on the first slam
    const flatAge = victim && t >= slams[0] ? t - slams[0] : -1, flat = flatAge >= 0 && flatAge < FLAT;
    const lt = t - shot.start - (victim && flatAge >= 0 ? Math.min(flatAge, FLAT) : 0);   // the flattened one is stuck for FLAT s
    const th = th0 + w * lt, k = 1 + burst(t);
    const x = RAM39.x + rx * k * Math.cos(th), y = RAM39.floor + ry * k * Math.sin(th);
    const vx = -rx * k * w * Math.sin(th), vy = ry * k * w * Math.cos(th);
    rs.push({who: WHO[i % 5], x, y, vx, vy, flip: vx < 0, flat, flatAge, dist: Math.abs(w) * (rx + ry) * 0.5 * lt});
  }
  return rs;
}

/** Panicked running pose: legs scissor with distance travelled, both arms flung up. */
function runPose(r: Runner, S: number, t: number): Pose {
  const rig = PARTS[r.who]._rig, dir = r.flip ? -1 : 1, ph = r.dist / (rig.legLen * S * 1.2), stride = rig.legLen * S * 0.7;
  const lift = rig.lift * S * 0.8, bob = Math.abs(Math.sin(ph * Math.PI)) * 12 * S;
  const hip: P = [r.x, r.y - rig.hipHeight * S - bob], lean = 12;
  const sh = shoulders(r.who, hip, lean, S, r.flip);
  const f = (s: number): P => [r.x + dir * stride * 0.5 * Math.sin(Math.PI * ph + s), r.y - lift * Math.max(0, Math.cos(Math.PI * ph + s))];
  const flail = Math.sin(t * 22 + r.x) * 30 * S;
  const pop = r.flatAge >= FLAT ? easeOutBack(clamp01((r.flatAge - FLAT) / 0.2)) : 1;
  return {hip, lean, head: r.who === 'elf' ? 'head-focus' : 'head-worried', headRot: 0, flip: r.flip,
    feet: {near: f(0), far: f(Math.PI)},
    hands: {near: add(sh.near, [dir * 30 * S, -rig.armLen * S * 0.9 + flail]), far: add(sh.far, [-dir * 40 * S, -rig.armLen * S * 0.85 - flail]), nearPart: 'hand-near-open', farPart: 'hand-far-open'},
    squash: r.flat ? 0.22 : lerp(0.7, 1, pop)};
}

/** Puppet items for the crowd, back to front; `behind` = those further back than Ram's floor line. */
export function crowdItems(t: number, shot: Shot): {behind: Item[]; front: Item[]} {
  const behind: Item[] = [], front: Item[] = [];
  for (const r of shot39crowd(t, shot).sort((a, b) => a.y - b.y)) {
    const depth = clamp01((r.y - (RAM39.floor - 340)) / 680), kid = r.who.startsWith('kid') || r.who === 'elf';
    const S = scaleFor(r.who, lerp(200, 520, depth) * (kid ? 0.62 : 1));
    const item: Item = {who: r.who, pose: runPose(r, S, t), scale: S};
    (r.y < RAM39.floor ? behind : front).push(item);
  }
  return {behind, front};
}

/** 35 (2:19) "Fed it all to a model that's dumb as a clam": Ram (cut-out poses) shovels on a two-beat cycle —
 *  scoop, lift, TOSS — and the RAM arcs into the golden creature's open mouth. The creature (one layer, so the whole
 *  body moves) snaps shut on every beat with a squash; once fed, its open mouth is stuffed and RAM spills out of it
 *  onto the floor on every chomp. */
const MOUTH35: P = [690, 800], BLADE35: P = [820, 760], LIP35: P = [640, 860], FLOOR35 = 1110;
export const shot35: Choreo = (_t, frame, shot) => {
  const t = twos(frame), b = beat(t), L = IDX['35/creature'], feet: P = [L.x + L.w / 2, L.y + L.h];
  const b0 = beat(shot.start + 0.05).i, rel = b.i - b0, half = b.since > 0.27;
  const pose = rel % 2 === 0 ? (half ? 'lift' : 'scoop') : 'toss';
  const firstToss = audio.beats[b0 + 1], fed = t >= firstToss + 0.35;
  const shut = b.i >= 0 && b.since < 0.18, k = shut ? 1 - b.since / 0.18 : Math.exp(-(b.since - 0.18) / 0.12);
  const sy = shut ? 1 - 0.1 * k : 1 + 0.06 * k, sx = shut ? 1 + 0.07 * k : 1 - 0.03 * k;
  const items: Item[] = [{layer: '35/cart'}, {layer: `35/ram-${pose}`, dy: pose === 'lift' ? -6 : 0}];
  items.push({layer: shut ? '35/creature-shut' : fed ? '35/creature-full' : '35/creature', sx, sy, pivot: feet, rot: shut ? -1.5 * k : 0});
  // the load in flight: from the blade at the toss into the open mouth
  if (pose === 'toss') for (let i = 0; i < 5; i++) {
    const u = Math.min(1, b.since / 0.32), x = BLADE35[0] + (MOUTH35[0] - BLADE35[0]) * u + 30 * (i - 2), y = BLADE35[1] + (MOUTH35[1] - BLADE35[1]) * u - 140 * Math.sin(Math.PI * u) + 12 * i;
    if (u < 1) items.push({sprite: 'sprites/props/ram-stick', at: [x, y], scale: 0.2, rot: 200 * u + 40 * i});
  }
  // spills from the stuffed mouth on each chomp
  if (fed && b.i >= b0 + 2) for (let i = 0; i < 4; i++) {
    const a = b.since, x = LIP35[0] - 40 - 70 * a * (1 + i) + 15 * i, y = Math.min(FLOOR35 - 10 * i, LIP35[1] + 300 * a + 1400 * a * a);
    items.push({sprite: 'sprites/props/ram-stick', at: [x, y], scale: 0.19, rot: 60 * i + (y < FLOOR35 - 10 * i ? 500 * a : 0)});
  }
  return items;
};
