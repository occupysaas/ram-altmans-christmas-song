/** Sleigh-team layout in team-local coordinates (origin = sleigh hitch, team faces +x): where the deer stand,
 *  where Ram's hands hold the reins, and the harness point on each deer's chest that each rein ends on. */
import {type P, add, rotAbout} from './geom.ts';
import deer from '../../public/puppets/reindeer/parts.json' with {type: 'json'};
import sleighJ from '../../public/sprites/sleigh/sleigh.json' with {type: 'json'};
import type {PathState} from '../shots/sleigh.ts';

type Part = {size: [number, number]; [k: string]: any};
const SL = sleighJ as Record<string, Part>, B = (deer as Record<string, Part>).body;
export const DEER_SCALE = 0.55;
export const DEER_TILT = 0.35;
const HARNESS: P = [600, 140];   // collar on the deer's chest, body-sprite px

export function teamGeometry(state: PathState, scale: number, t: number) {
  const s = scale, sl = state.sag ? SL['sleigh-loaded'] : SL.sleigh;
  const panic = (state.crash ?? 0) > 0 || !!state.sag && Math.sin(t * 7) > 0.6;
  const ram = panic ? SL['ram-seated-panic'] : SL['ram-seated'];
  const phase = (t * 2.2) % 1, gap = 560 * s;
  const bob = state.frozen ? 0 : 14 * s * Math.sin(2 * Math.PI * phase * 2);
  // The sleigh (and Ram) take the full path angle; the deer pulling ahead take only a third of it, so a tipping
  // sleigh doesn't swing the team across the frame. Everything here is in the flipped, unrotated team frame.
  const angle = state.angle, deerRot = angle * (state.crash !== undefined ? 1 : DEER_TILT);   // 48 (approved) keeps the rigid dive
  const deerAt: P[] = ([[gap * 1.15, -60 * s + bob], [gap * 2.15, -80 * s - bob]] as P[]).map(p => rotAbout(p, [0, 0], deerRot));
  const seat: P = rotAbout([(sl.seat[0] - sl.hitch[0]) * s, (sl.seat[1] - sl.hitch[1]) * s], [0, 0], angle);
  const handsLocal: P = [(sl.seat[0] - sl.hitch[0]) * s + (ram.hands[0] - ram.seat[0]) * s * 0.9, (sl.seat[1] - sl.hitch[1]) * s + (ram.hands[1] - ram.seat[1]) * s * 0.9];
  const hands = rotAbout(handsLocal, [0, 0], angle);
  const ds = s * DEER_SCALE;
  const harness = deerAt.map(p => add(p, rotAbout([(HARNESS[0] - B.neck[0]) * ds, (HARNESS[1] - B.neck[1]) * ds], [0, 0], deerRot)));
  const reins = harness.map(b => ({a: hands, b, c: [(hands[0] + b[0]) / 2, Math.max(hands[1], b[1]) + 60 * s] as P}));
  return {sl, ram, panic, phase, seat, hands, deerAt, deerRot, harness, reins};
}
