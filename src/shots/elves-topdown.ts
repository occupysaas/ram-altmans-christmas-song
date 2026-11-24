/** 30 (1:57) "The elves got compressed into one J.P.G.": a top-down view of the workshop floor, north to south.
 *  Four conveyor lanes; on each, four identical elves ride the belt doing the same job (wrap / tape / bow / label),
 *  looping on the beat. One lane at a time, a piston at the lane's west end slams in, shoves the four together, and
 *  they pop into ONE four-armed elf doing all four jobs at once (dust puff, squash). */
import {type P, clamp01, easeOutBack, lerp} from '../puppet/geom.ts';
import {hash} from '../fx/particles.ts';
import audio from '../timing/audio.json' with {type: 'json'};
import {beat, beatHit, twos} from './kit.ts';
import type {Choreo, Item} from './types.ts';

type Shot = {start: number; end: number};
export const LANES = [{y: 216, job: 'wrap'}, {y: 487, job: 'tape'}, {y: 754, job: 'bow'}, {y: 1021, job: 'label'}];
const ELF_S = 0.98, X0 = [470, 720, 970, 1220], PUSH_END = 850, MERGE_X = 1130, SLAM = 0.22;
const SIZES: Record<string, P> = {'wrap-a': [148, 170], 'wrap-b': [125, 170], 'tape-a': [125, 170], 'tape-b': [124, 170], 'bow-a': [146, 170], 'bow-b': [124, 170],
  'label-a': [136, 170], 'label-b': [124, 170], multi: [273, 220], 'multi-b': [273, 220], piston: [520, 120]};
const spr = (name: string, at: P, scale: number, extra: Partial<{rot: number; opacity: number}> = {}): Item =>
  ({sprite: `sprites/topdown-elf/${name}`, at, scale, size: SIZES[name], anchor: name === 'piston' ? [520, 60] : [SIZES[name][0] / 2, SIZES[name][1] / 2], ...extra});

/** When lane l's piston lands: four beats spread evenly over the shot, top lane first. */
export function laneMerge(l: number, shot: Shot): number {
  const bs = audio.beats.filter(b => b > shot.start + 0.5 && b < shot.end - 0.5);
  return bs[Math.round(l * (bs.length - 1) / 3)];
}

export const shot30: Choreo = (_t, frame, shot) => {
  const t = twos(frame), b = beat(t), hit = beatHit(t);
  const items: Item[] = [];
  LANES.forEach((lane, l) => {
    const tm = laneMerge(l, shot), pose = (b.i + l) % 2 ? 'b' : 'a';
    const ext = t < tm - SLAM ? 0 : t < tm ? ((t - tm + SLAM) / SLAM) ** 2 : 1 - clamp01((t - tm - 0.25) / 0.6);
    const px = lerp(150, PUSH_END, ext);
    items.push(spr('piston', [px, lane.y], 0.9));
    if (t < tm) {
      X0.forEach((x0, i) => {
        const x = Math.max(x0, px + 80 + i * 135), squeeze = x > x0 ? 0.9 : 1;
        items.push(spr(`${lane.job}-${pose}`, [x, lane.y + (x > x0 ? 0 : -4 * hit)], ELF_S * squeeze));
      });
    } else {
      const a = t - tm, pop = easeOutBack(clamp01(a / 0.25), 2.2);
      items.push(spr(b.i % 2 ? 'multi-b' : 'multi', [MERGE_X, lane.y - 6 * hit], ELF_S * lerp(0.6, 1, pop)));
      if (a < 0.5) for (let k = 0; k < 9; k++) {
        const th = 2 * Math.PI * (k / 9 + hash(k + l)), r = 80 + 260 * a;
        items.push({draw: {kind: 'dot', at: [MERGE_X + Math.cos(th) * r, lane.y + Math.sin(th) * r * 0.5], size: 26 * (1 - a * 1.6) + 6, color: '#efe6d8', opacity: 1 - a * 2}});
      }
    }
  });
  return items;
};
