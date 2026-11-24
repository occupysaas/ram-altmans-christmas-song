/** Shot 13b ("…down below"): back shot from behind Ram at the tower window, looking head-on down at Byteville.
 *  He is scheming: hands clasped behind his back, bob and sway, a slow satisfied head tilt, and an evil-chuckle
 *  shoulder shake on "down below". The town's lights dim in steps on the beats. */
import parts from '../../public/sprites/ram-back/parts.json' with {type: 'json'};
import {groove} from '../puppet/groove.ts';
import {clamp01, squashAt} from '../puppet/geom.ts';
import type {Choreo, Item} from './types.ts';
import {beat, twos, wordAt} from './kit.ts';

const S = 1.1;                        // big: head and shoulders fill the lower foreground
const NECK_Y = 830;                   // collar about two-thirds down the frame
const FEET: [number, number] = [800, NECK_Y + (parts.body.feet[1] - parts.body.neck[1]) * S];   // feet far below frame; sway pivots there
export const shot13b: Choreo = (_t, frame, shot) => {
  const t = twos(frame), lt = t - shot.start;
  const g = groove(t), down = wordAt(8, 8), belowEnd = lyricsEnd();
  const chuckle = t >= down && t < belowEnd + 0.3 ? Math.sin((t - down) * 2 * Math.PI * 7) * 7 * (1 - clamp01((t - belowEnd) / 0.3)) : 0;
  const bob = (g.active ? 26 * g.bob : 0) * S, sway = g.active ? 2.2 * g.sway : 0;
  const tilt = 5 * clamp01(lt / 1.4) - 1.6 * sway;            // slow satisfied tilt, counter to the sway
  const sq = squashAt(t);
  const body = parts.body, head = parts.head;
  const bodyAt: [number, number] = [FEET[0], FEET[1] + bob + chuckle * 0.5];
  const neckWorld: [number, number] = [bodyAt[0] + (body.neck[0] - body.feet[0]) * S, bodyAt[1] + (body.neck[1] - body.feet[1]) * S * sq];
  const steps = beat(t).i - beat(shot.start).i;               // the town's lights go out a step per beat
  const items: Item[] = [{shade: {x: 0, y: 560, w: 1600, h: 640, opacity: Math.min(0.45, 0.07 * Math.max(0, steps))}}];
  items.push({sprite: 'sprites/ram-back/body', at: bodyAt, anchor: body.feet as [number, number], size: body.size as [number, number], scale: S, rot: sway});
  items.push({sprite: 'sprites/ram-back/head', size: head.size as [number, number], at: [neckWorld[0] + sway * 6, neckWorld[1] + chuckle], anchor: head.neck as [number, number], scale: S, rot: tilt});
  return items;
};
function lyricsEnd() { return wordAt(8, 9) + 0.5; }
