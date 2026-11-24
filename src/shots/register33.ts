/** 33 (2:10) "And he's charging per token for Christmas this year!": the golden typewriter-cash-register comes alive.
 *  Each sung word is typed: its keys clack down one per letter; a blank tile on top pops up a "$" flag like an old
 *  register (one per word, all of them flashing at the end); dollar signs float up out of the machine; and the
 *  register rings "DING!" on "year!" (with a bell sound effect). */
import {type P} from '../puppet/geom.ts';
import {hash} from '../fx/particles.ts';
import lyrics from '../timing/lyrics-aligned.json' with {type: 'json'};
import regions from '../../docs/fx-regions.json' with {type: 'json'};
import {twos} from './kit.ts';
import type {Choreo, Item} from './types.ts';

const R = (regions as Record<string, {keys?: number[][]; tiles?: number[][]}>)['33'];
const KEYS = R.keys ?? [], TILES = R.tiles ?? [], WORDS = lyrics[25].words, LETTER = 0.065, DOWN = 0.055;

export const shot33: Choreo = (_t, frame) => {
  const t = twos(frame), items: Item[] = [];
  // keys: one clack per letter of the word being sung
  WORDS.forEach((w, k) => {
    const n = w.w.replace(/[^A-Za-z']/g, '').length;
    for (let j = 0; j < n; j++) {
      const t0 = w.s + j * LETTER, a = t - t0;
      if (a < -0.02 || a > DOWN + 0.02) continue;   // (held frames can run a hair early)
      const [x, y, kw, kh] = KEYS[Math.floor(hash(k * 13.7 + j * 3.1) * KEYS.length)];
      items.push({draw: {kind: 'ellipse', at: [x, y], size: 0, w: kw * 0.9, h: kh * 0.8, color: '#4a2f0a', opacity: 0.85}});              // the hole the cap left
      items.push({draw: {kind: 'ellipse', at: [x, y + 11], size: 0, w: kw, h: kh, color: '#f6e7c4', pressed: true}});                      // the cap, pushed down
    }
  });
  // $ flags popping up on the tiles, one per word; the last words flash them all
  WORDS.forEach((w, k) => {
    if (t < w.s) return;
    const tiles = k < TILES.length ? [TILES[k]] : TILES, pop = Math.min(1, (t - w.s) / 0.1);
    const flash = k >= TILES.length ? (Math.floor((t - w.s) * 12) % 2 ? 1 : 0.5) : 1;
    for (const [x, y, tw, th] of tiles) items.push({draw: {kind: 'text', at: [x, y + 6], size: th * 0.85 * pop, text: '$', color: '#1f7a3a', ink: '#fff6d8', opacity: flash, tile: true}});
  });
  // dollar signs floating up out of the machine on each word
  WORDS.forEach((w, k) => {
    const a = t - w.s; if (a < 0 || a > 1.1) return;
    for (let i = 0; i < 3; i++) {
      const x0 = 420 + 680 * hash(k * 5.3 + i), p: P = [x0 + 40 * Math.sin(a * 6 + i), 640 - 380 * a];
      items.push({draw: {kind: 'text', at: p, size: 46 + 18 * hash(k + i), text: '$', color: '#2fae55', ink: '#10301a', opacity: 1 - a / 1.1, rot: 20 * Math.sin(a * 5 + i)}});
    }
  });
  const year = WORDS[WORDS.length - 1].s, d = t - year;
  if (d >= 0 && d < 0.8) items.push({draw: {kind: 'text', at: [690, 330 - 60 * d], size: 120 * Math.min(1, 0.6 + d * 4), text: 'DING!', color: '#ffe27a', ink: '#5a3a08', rot: -8, opacity: 1 - Math.max(0, d - 0.5) / 0.3}});
  return items;
};
