/** "CRT snow": brief bursts of analog TV static (2-4 frames) with a brightness flicker and sometimes a rolling tear
 *  line. Every ~3 s on the calmer shots (still paintings, tower-only shots), every ~12 s elsewhere; never over the
 *  ident/title (first 8 s) or the ending explosion. Deterministic in song time. */
import {BOOM} from './fxMath.ts';

const hash = (n: number) => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const SLOT = 0.5;   // decide once per half-second slot whether a burst starts in it

export function staticAt(shot: {id: string; tier?: string; fx?: string[]}, t: number) {
  const off = {opacity: 0, frame: 0, tear: -1};
  if (t < 8 || t > BOOM - 0.5) return off;
  const calm = shot.tier === 'C' || (shot.tier === 'B' && (shot.fx ?? []).every(f => f === 'tower'));
  const k = Math.floor(t / SLOT), p = calm ? SLOT / 3 : SLOT / 12;
  if (hash(k * 1.7) >= p) return off;
  const start = k * SLOT + 0.4 * hash(k * 3.3) * SLOT, len = (2 + Math.floor(hash(k * 5.9) * 3)) / 24;   // 2-4 frames
  if (t < start || t >= start + len - 1e-6) return off;
  const fr = Math.floor((t - start) * 24);
  return {opacity: 0.26 + 0.26 * hash(k * 7.1 + fr), frame: Math.floor(hash(k * 9.3 + fr) * 4), tear: hash(k * 2.1) < 0.5 ? hash(k * 4.4 + fr) : -1};
}
