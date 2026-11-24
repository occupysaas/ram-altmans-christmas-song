/** Face close-ups brought to life with cut-out layers.
 *  09 (0:40) "…is memory! More!": the push-in grin turns into a head-back cackle on "memory!", bouncing on snares.
 *  64 (4:10) "Ebenezer Scrooge!": after "Scrooge!" Ram bursts out laughing, HA HA HA popping out of his mouth. */
import {type P, clamp01} from '../puppet/geom.ts';
import lyrics from '../timing/lyrics-aligned.json' with {type: 'json'};
import audio from '../timing/audio.json' with {type: 'json'};
import layers from '../../public/sprites/layers/layers.json' with {type: 'json'};
import {twos} from './kit.ts';
import type {Choreo, Item} from './types.ts';

const IDX = layers as Record<string, {x: number; y: number; w: number; h: number}>;
const snareHit = (t: number) => { let k = -1; for (const [s] of audio.snares) { if (s <= t) k = s; else break; } return k < 0 ? 0 : Math.exp(-(t - k) / 0.12); };

/** HA!s puffing out of a mouth: one every `gap` s from `t0`, drifting up and away, each living 0.9 s. */
function has(t: number, t0: number, mouth: P, dir: P, size: number, gap: number, text = 'HA'): Item[] {
  const out: Item[] = [];
  for (let k = 0; t0 + k * gap <= t; k++) {
    const a = t - (t0 + k * gap); if (a > 0.9) continue;
    const pop = Math.min(1, a / 0.1);
    out.push({draw: {kind: 'text', at: [mouth[0] + dir[0] * a * 300 + (k % 2 ? 40 : -40), mouth[1] + dir[1] * a * 300 - 30 * k % 90], size: size * (0.6 + 0.4 * pop),
      text, color: '#ffe27a', ink: '#17121c', rot: k % 2 ? 12 : -10, opacity: 1 - clamp01((a - 0.6) / 0.3)}});
  }
  return out;
}

export const shot09: Choreo = (_t, frame) => {
  const t = twos(frame), memory = lyrics[4].words.find(w => w.w === 'memory!')!.s;
  if (t < memory) return [{layer: '09/grin', dy: 4 * Math.sin(t * 5), pivot: [900, 1200]}];
  const sn = snareHit(t), L = IDX['09/laugh'];
  return [{layer: '09/laugh', dy: -16 * sn - 6 * Math.abs(Math.sin((t - memory) * 14)), rot: -0.8 * sn, pivot: [L.x + L.w * 0.6, L.y + L.h]},
    ...has(t, memory + 0.15, [560, 640], [-0.7, -0.6], 160, 0.3)];   // sound-effect HA!s in the night sky beside his face (it fills the frame)
};

export const shot64: Choreo = (_t, frame) => {
  // on a clean plate: Ram's face (smirk, then laughing after "Scrooge!"), then the card and his hand IN FRONT of him
  const t = twos(frame), scrooge = lyrics[52].words.find(w => w.w === 'Scrooge!')!.s, t0 = scrooge + 0.35, L = IDX['64/face-laugh'];
  if (t < t0) return [{layer: '64/face'}, {layer: '64/card'}];
  const k = Math.floor((t - t0) / 0.26), open = k % 2 === 0;
  return [{layer: open ? '64/face-laugh' : '64/face', dy: open ? -10 : 0, rot: open ? -2 : 0, pivot: [L.x + L.w * 0.5, L.y + L.h]},
    {layer: '64/card'}, ...has(t, t0, [1020, 480], [0.7, -0.6], 130, 0.26)];
};
