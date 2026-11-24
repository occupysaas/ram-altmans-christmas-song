/** Lyric layout in still pixels (stills are 1600x1200; the camera and TV zoom scale them up on screen).
 *  Each entry is split into lead words and IMPACT words (src/impact.ts). Impact words are uppercased, drawn
 *  1.5x bigger in a rotating display font, and coloured; lead words rotate between storybook fonts.
 *  Pattern adapted from "We got the rights" (src/lyricStyle.mjs). */
import lyrics from './timing/lyrics-aligned.json' with {type: 'json'};
import {IMPACT} from './impact.ts';

export const STILL_W = 1600;
export const STILL_H = 1200;
/** Lead words never go below this; the median lead is about double the first animatic (see tests). */
export const MIN_LEAD = 64;
/** Small painted cards (the sampler, the gift tag) may go smaller so the text stays on the card. */
export const MIN_LEAD_SMALL = 52;
export const SMALL_CARDS = ['03', '18'];
const LEAD_MAX = 150;
const IMPACT_RATIO = 1.5;
const MIN_IMPACT_RATIO = 1.4; // tried before shrinking the lead words when one long impact word won't fit
const LINE_GAP = 1.06;

export type Style = 'narration' | 'hook' | 'tech' | 'aside';
export type Font = {family: string; em: number; upper: boolean; italic?: boolean};
const F = {
  fell: {family: 'IM Fell English', em: 0.48, upper: false},
  fellItalic: {family: 'IM Fell English', em: 0.46, upper: false, italic: true},
  mocReg: {family: 'Mountains of Christmas', em: 0.5, upper: false},
  mocBold: {family: 'Mountains of Christmas Bold', em: 0.66, upper: true},
  bowlby: {family: 'Bowlby One', em: 0.84, upper: true},
  swash: {family: 'Berkshire Swash', em: 0.7, upper: true},
  vt: {family: 'VT323', em: 0.5, upper: false},
  vtUp: {family: 'VT323', em: 0.5, upper: true},
} satisfies Record<string, Font>;

const LEAD: Record<Style, Font[]> = {narration: [F.fell, F.mocReg], hook: [F.mocReg, F.fell], tech: [F.vt], aside: [F.fellItalic]};
const IMP: Record<Style, Font[]> = {narration: [F.mocBold, F.bowlby, F.swash], hook: [F.mocBold, F.swash, F.bowlby], tech: [F.vtUp], aside: [F.swash, F.mocBold]};

import METRICS from './fontMetrics.json' with {type: 'json'};
const ADV = METRICS as Record<string, Record<string, number>>;
/** Real advance width in px (font metrics) plus room for the drawn outline. */
function measure(text: string, font: Font, size: number): number {
  const m = ADV[font.family + (font.italic ? ' Italic' : '')];
  return [...text].reduce((a, c) => a + (m?.[c] ?? 0.6), 0) * size + 0.12 * size;
}
/** Space between two neighbouring words: scaled to the bigger of the two so impact words never butt up. */
export const wordGap = (a: {size: number}, b: {size: number}) => 0.3 * Math.max(a.size, b.size);

export type LWord = {text: string; k: number; impact: boolean; font: Font; size: number; width: number};
export type Row = {words: LWord[]; width: number; height: number};
export type Layout = {leadSize: number; impactSize: number; rows: Row[]; height: number; words: LWord[]};

/** Which words (indices into the line) fall inside an impact phrase. */
export function impactWords(line: number): Set<number> {
  const text = lyrics[line].text, out = new Set<number>();
  const spans: [number, number][] = [];
  let at = 0;
  for (const w of lyrics[line].words) { const s = text.indexOf(w.w, at); spans.push([s, s + w.w.length]); at = s + w.w.length; }
  for (const p of IMPACT[line] ?? []) {
    const a = text.indexOf(p), b = a + p.length;
    if (a < 0) continue;
    spans.forEach(([s, e], k) => { if (s < b && e > a) out.add(k); });
  }
  return out;
}

export function layoutEntry(e: {line: number; from: number; to: number; style: Style}, box: {w: number; h: number}): Layout {
  const imp = impactWords(e.line);
  const lead = LEAD[e.style][e.line % LEAD[e.style].length], big = IMP[e.style][e.line % IMP[e.style].length];
  const src = lyrics[e.line].words.slice(e.from, e.to).map((w, i) => ({text: w.w, k: e.from + i, impact: imp.has(e.from + i)}));
  let best: Layout | null = null;
  for (let size = LEAD_MAX; size >= 36; size -= 2) for (const ratio of [IMPACT_RATIO, MIN_IMPACT_RATIO]) {
    const isz = Math.ceil(size * ratio);
    const words: LWord[] = src.map(w => {
      const font = w.impact ? big : lead, sz = w.impact ? isz : size;
      const acronym = (w.text.match(/[A-Z]/g) ?? []).length >= 2; // GPUs, SSDs, DIMMs keep their spelling
      const text = font.upper && !acronym ? w.text.toUpperCase() : w.text;
      return {...w, text, font, size: sz, width: measure(text, font, sz)};
    });
    const rows: Row[] = [];
    for (const w of words) {
      const r = rows.at(-1), gap = r ? wordGap(r.words.at(-1)!, w) : 0;
      if (r && r.width + gap + w.width <= box.w) { r.words.push(w); r.width += gap + w.width; r.height = Math.max(r.height, w.size * LINE_GAP); }
      else rows.push({words: [w], width: w.width, height: w.size * LINE_GAP});
    }
    const height = rows.reduce((a, r) => a + r.height, 0);
    best = {leadSize: size, impactSize: isz, rows, height, words};
    if (height <= box.h && rows.every(r => r.width <= box.w)) return best;
  }
  return best!;
}
