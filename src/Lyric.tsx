import React from 'react';
import {layoutEntry, wordGapFor, type Style} from './layout';
import lyrics from './timing/lyrics-aligned.json';

const FPS = 24;
type Entry = {line: number; from: number; to: number; style: Style; tone: 'light' | 'dark'};

/** A solid outline built from text-shadows (renders reliably in headless Chrome). */
const outline = (c: string, r: number) => Array.from({length: 16}, (_, i) => {
  const a = i / 16 * Math.PI * 2; return `${(Math.cos(a) * r).toFixed(1)}px ${(Math.sin(a) * r).toFixed(1)}px 0 ${c}`;
}).join(', ');

const INK = '#24122c', CREAM = '#fdf6e3';
/** Lead and impact colours for text on dark art (tone 'dark') and on light art (tone 'light'). */
const PALETTE = {
  dark: {lead: CREAM, leadEdge: INK, impact: ['#ff3b4e', '#ffd34d', '#7dffb0'], impactEdge: INK, glow: 'rgba(10,5,20,.85)'},
  light: {lead: INK, leadEdge: CREAM, impact: ['#c8102e', '#1d6b3a', '#b8420c'], impactEdge: CREAM, glow: 'rgba(255,250,235,.7)'},
};
const TECH = {dark: {lead: '#5ff6ff', edge: '#03222c'}, light: {lead: '#04313d', edge: '#e9fdff'}};

/** One lyric entry laid out in a box (still px). Words appear at their aligned start; impact words pop in big. */
export function LyricBlock({entry, box, t, legacy = false}: {entry: Entry; box: {w: number; h: number}; t: number; legacy?: boolean}) {
  const L = layoutEntry(entry, box, legacy);
  const words = lyrics[entry.line].words;
  const pal = PALETTE[entry.tone];
  const impColor = pal.impact[entry.line % pal.impact.length];
  return (
    <div style={{width: box.w, height: box.h, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
      {L.rows.map((r, ri) => (
        <div key={ri} style={{display: 'flex', alignItems: 'baseline', whiteSpace: 'pre', lineHeight: 1.0, height: r.height}}>
          {r.words.map((w, wi) => {
            const age = t - words[w.k].s, on = age >= -0.02;
            const u = Math.min(1, Math.max(0, (age + 0.02) / (5 / FPS)));
            const ease = 1 - Math.pow(1 - u, 3);
            const tech = entry.style === 'tech';
            const color = tech ? TECH[entry.tone].lead : w.impact ? impColor : pal.lead;
            const edge = tech ? TECH[entry.tone].edge : w.impact ? pal.impactEdge : pal.leadEdge;
            const edgeW = w.impact ? Math.max(4, w.size * 0.055) : Math.max(3, w.size * 0.045);
            const scale = w.impact ? 1.45 - 0.45 * ease : 1;
            const rise = w.impact ? 0 : (1 - ease) * w.size * 0.25;
            return (
              <span key={wi} style={{display: 'inline-block', fontFamily: `'${w.font.family}'`, fontStyle: w.font.italic ? 'italic' : 'normal',
                fontSize: w.size, color, opacity: on ? ease : 0, marginLeft: wi ? wordGapFor(r.words[wi - 1], w, L, legacy) : 0,
                transform: `translateY(${rise}px) scale(${scale})`, transformOrigin: legacy ? '50% 80%' : '0% 80%',  // pops from its left edge so it never covers the word before it (01-06 keep the approved centre pop)
                textShadow: `${outline(edge, edgeW)}, 0 ${edgeW * 1.4}px 0 ${edge}, 0 0 ${w.size * 0.25}px ${pal.glow}`}}>{w.text}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
