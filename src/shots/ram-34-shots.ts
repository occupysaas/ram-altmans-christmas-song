/** Three-quarter puppet shots: 08 (Sam → Ram), 21 (token fling), 22 (cackle), 43 (chest clutch). Sized from each still. */
import {type P, add, clamp01, easeOutBack, easeInOut, lerp} from '../puppet/geom.ts';
import {PARTS} from '../puppet/parts.ts';
import audio from '../timing/audio.json' with {type: 'json'};
import {hash} from '../fx/particles.ts';
import type {Choreo, Item} from './types.ts';
import {stand, scaleFor, beat, beatHit, twos} from './kit.ts';

const prop = (sprite: string, at: P, scale: number, rot = 0, opacity = 1): Item => ({sprite: `sprites/props/${sprite}`, at, scale, rot, opacity});
const snareHit = (t: number) => { let k = -1; for (const [st] of audio.snares) { if (st <= t) k = st; else break; } return k < 0 ? 0 : Math.exp(-(t - k) / 0.15); };

/** 08: Sam turns, his face greens over, the hat and scarf drop on, and he pops into Ram Altman. */
export const shot08: Choreo = (_t, frame, shot) => {
  const t = twos(frame), lt = t - shot.start, SWAP = 1.05;
  const ram = lt >= SWAP, who = ram ? 'ram-34' : 'sam-34';
  const S = scaleFor(who, 900), floor = 1500, x = 930;
  const pop = ram ? 1 + 0.18 * Math.exp(-(lt - SWAP) * 9) * Math.cos((lt - SWAP) * 30) : 1;
  const head = ram ? 'head-grin' : lt < 0.25 ? 'head-smile' : lt < 0.55 ? 'head-shock' : 'head-mid';
  const pose = stand(who, {t, x, floor, S, lean: ram ? 4 : 0, head, headRot: ram ? 0 : 6 * Math.sin(lt * 20) * clamp01((lt - 0.4) / 0.3), spread: 120,
    hands: sh => ram
      ? {near: add(sh.near, [160 * S, 180 * S]), far: add(sh.far, [-140 * S, 200 * S]), nearPart: 'hand-near-grab', farPart: 'hand-far-grab'}
      : {near: add(sh.near, [60 * S, -120 * S * clamp01(lt / 0.5)]), far: add(sh.far, [-60 * S, -100 * S * clamp01(lt / 0.5)]), nearPart: 'hand-near-open', farPart: 'hand-far-open'}});
  pose.squash *= 1 / pop;
  const items: Item[] = [{who, pose, scale: S}];
  if (!ram) {
    const fall = easeInOut(clamp01((lt - 0.45) / (SWAP - 0.45)));
    items.push(prop('scarf', [x + 40, lerp(-200, pose.hip[1] - 420 * S, fall)], S * 1.1, lerp(-30, 0, fall)));
    items.push(prop('hat', [x + 20, lerp(-300, pose.hip[1] - 1000 * S, fall)], S * 1.1, lerp(40, 0, fall)));
  }
  for (let i = 0; i < 10 && lt > 0.4 && lt < SWAP + 0.5; i++) {   // magic sparkles
    const a = hash(i) * 6.28, r = 120 + 260 * clamp01((lt - 0.4) / 1.1) * (0.5 + hash(i + 3));
    items.push({shade: {x: x + Math.cos(a + lt * 3) * r - 12, y: 820 + Math.sin(a + lt * 3) * r * 0.7 - 12, w: 24, h: 24, opacity: 0.9, color: '#fff6b0', round: true}});
  }
  return items;
};

/** 21: "Selling tokens by the thousand" — flings tokens up on every beat. */
export const shot21: Choreo = (_t, frame, shot) => {
  const t = twos(frame), who = 'ram-34', S = scaleFor(who, 470), floor = 888, x = 620, hit = beatHit(t, 0.22);
  const pose = stand(who, {t, x, floor, S, lean: -6 * hit, head: 'head-grin', headRot: -8 * hit, spread: 200,
    hands: sh => ({near: add(sh.near, [120 * S, lerp(220, -380, hit) * S]), far: add(sh.far, [-120 * S, lerp(240, -360, hit) * S]),
      nearPart: hit > 0.3 ? 'hand-near-open' : 'hand-near-fist', farPart: hit > 0.3 ? 'hand-far-open' : 'hand-far-fist'})});
  const items: Item[] = [{who, pose, scale: S}];
  const b = beat(t);
  for (let k = 0; k < 3; k++) {                                  // coins from the last three beats, arcing up and away
    const since = b.since + k * b.period; if (since > 1.6) continue;
    for (let i = 0; i < 6; i++) {
      const seed = (b.i - k) * 13 + i, vx = (hash(seed) - 0.5) * 900, vy = -700 - 400 * hash(seed + 1);
      items.push(prop('coin', [x + vx * since, 520 + vy * since + 900 * since * since], 0.22, since * 600 * (hash(seed + 2) - 0.5)));
    }
  }
  return items;
};

/** 22: "he laughs right out loud" — a full-body cackle, head snapping back on the snares. */
export const shot22: Choreo = (_t, frame) => {
  const t = twos(frame), who = 'ram-34', S = scaleFor(who, 340), floor = 560, x = 560, sn = snareHit(t);
  const shake = Math.sin(t * 2 * Math.PI * 9) * 5;
  const pose = stand(who, {t, x: x + shake * 0.4, floor, S, lean: -10 - 8 * sn, head: 'head-cackle', headRot: -14 * sn, spread: 140, hipBob: shake,
    hands: sh => ({near: add(sh.near, [200 * S, (-60 + 30 * Math.sin(t * 18)) * S]), far: add(sh.far, [-200 * S, (-40 - 30 * Math.sin(t * 18)) * S]),
      nearPart: 'hand-near-open', farPart: 'hand-far-open'})});
  return [{who, pose, scale: S}];
};

/** 43: "your heart is two DIMMs too small" — clutches his chest in panic while the tiny green heart pulses. */
export const shot43: Choreo = (_t, frame, shot) => {
  const t = twos(frame), lt = t - shot.start, who = 'ram-34', S = scaleFor(who, 760), floor = 1310, x = 1300;
  const pulse = 0.5 + 0.5 * Math.sin(lt * 2 * Math.PI * 1.4);
  const pose = stand(who, {t, x, floor, S, flip: true, lean: 6 + 3 * Math.sin(lt * 3), head: 'head-panic', headRot: 4 * Math.sin(lt * 5), spread: 120,
    hands: sh => ({near: add(sh.neck, [-20 * S, 300 * S]), far: add(sh.neck, [60 * S, 330 * S]), nearPart: 'hand-near-grab', farPart: 'hand-far-grab'})});
  const heart = add(pose.hip, [-10, -330 * S]);
  return [{who, pose, scale: S}, {shade: {x: heart[0] - 70 - 30 * pulse, y: heart[1] - 60 - 25 * pulse, w: 140 + 60 * pulse, h: 120 + 50 * pulse, opacity: 0.55 + 0.35 * pulse, color: '#6dff7a', round: true}}];
};
