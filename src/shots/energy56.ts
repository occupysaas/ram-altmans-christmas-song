/** 56 (3:34) "Give us back our energy, water and LAND!": the water pours from the pipe into the glass tank (streaming
 *  dashes, ripples, splashes) while the town's windows black out one by one — a flicker, then dark — a power outage
 *  spreading as Ram's tower drinks it all. (Windmill rotors join once their cut-out art exists.) */
import {type P} from '../puppet/geom.ts';
import {hash} from '../fx/particles.ts';
import regions from '../../docs/fx-regions.json' with {type: 'json'};
import {twos} from './kit.ts';
import type {Choreo, Item} from './types.ts';

const ROTORS: [number, number, number][] = [[125, 630, 88], [270, 710, 62], [384, 768, 44]];   // windmill hubs (still px) and blade length
const WIN = (regions as Record<string, {windows?: number[][]}>)['56'].windows ?? [];
const PIPE: P = [650, 672], CTRL: P = [628, 690], TANK: P = [606, 806], POOL: P = [600, 850];
const q = (u: number): P => [(1 - u) ** 2 * PIPE[0] + 2 * (1 - u) * u * CTRL[0] + u * u * TANK[0], (1 - u) ** 2 * PIPE[1] + 2 * (1 - u) * u * CTRL[1] + u * u * TANK[1]];

export const shot56: Choreo = (_t, frame, shot) => {
  const t = twos(frame), lt = t - shot.start, span = shot.end - shot.start, items: Item[] = [];
  for (let k = 0; k < 8; k++) {   // water dashes running down the stream
    const u = (k / 8 + lt * 1.6) % 1, a = q(u), b = q(Math.min(1, u + 0.06)), side = (k % 3 - 1) * 9;
    items.push({draw: {kind: 'line', at: [a[0] + side, a[1]], to: [b[0] + side, b[1]], size: 5, color: '#eafaff', opacity: 0.85}});
  }
  for (let k = 0; k < 3; k++) {   // ripples spreading in the tank
    const age = (lt * 0.9 + k / 3) % 1;
    items.push({draw: {kind: 'ring', at: POOL, size: 20 + 110 * age, color: '#dff6ff', opacity: 0.6 * (1 - age)}});
  }
  for (let k = 0; k < 6; k++) {   // splashes
    const age = (lt * 2.2 + hash(k)) % 1, vx = (hash(k * 3.1) - 0.5) * 160;
    items.push({draw: {kind: 'dot', at: [TANK[0] + vx * age, TANK[1] - 70 * Math.sin(Math.PI * age)], size: 5, color: '#ffffff', opacity: 1 - age}});
  }
  WIN.forEach(([x, y, w, h], i) => {   // the outage: windows go dark one by one through the shot; only every 4th gives one blink first
    const off = 0.6 + (span - 1.2) * hash(i * 7.3), a = lt - off;
    if (a < 0) return;
    const blink = i % 4 === 0 && a >= 0.08 && a < 0.17;   // a single brief relight, then dark for good
    if (!blink) items.push({draw: {kind: 'rect', at: [x, y], size: 0, w: w + 4, h: h + 4, color: '#161b35', opacity: 0.88}});
  });
  for (const [hx, hy, r] of ROTORS) items.push({sprite: 'sprites/windmill/rotor', at: [hx, hy], scale: r / 190, size: [400, 400], anchor: [200, 200], rot: (_t * 160 + hx) % 360});   // smooth time: no strobing
  return items;
};
