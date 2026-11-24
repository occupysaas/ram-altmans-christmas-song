import React from 'react';
import {fitText, LINE_H, type Style} from './fitText';
import {FONTS} from './fonts';
import lyrics from './timing/lyrics-aligned.json';

const FPS = 24;
type Entry = {line: number; from: number; to: number; carry?: boolean; style: Style};

/** A solid outline built from text-shadows (renders reliably in headless Chrome). */
const outline = (c: string, r: number) => Array.from({length: 16}, (_, i) => {
  const a = i / 16 * Math.PI * 2; return `${(Math.cos(a) * r).toFixed(1)}px ${(Math.sin(a) * r).toFixed(1)}px 0 ${c}`;
}).join(', ');

const look: Record<Style, React.CSSProperties> = {
  narration: {fontFamily: FONTS.narration, color: '#fdf6e3', textShadow: outline('#1b1424', 4) + ', 0 5px 0 #1b1424, 0 0 16px rgba(20,10,30,.9)'},
  hook: {fontFamily: FONTS.hook, fontWeight: 700, color: '#c8102e', textShadow: outline('#fffaf0', 5) + ', 0 8px 0 rgba(20,10,30,.55)'},
  tech: {fontFamily: FONTS.tech, color: '#5ff6ff', textShadow: '0 0 10px #18c8ff, 0 0 2px #fff'},
  aside: {fontFamily: FONTS.narration, fontStyle: 'italic', color: '#f3e7ff', textShadow: outline('#1b1424', 4) + ', 0 5px 0 #1b1424, 0 0 14px rgba(20,10,30,.9)'},
};

/** One lyric entry laid out in a box (px), revealing each word at its aligned start. */
export function LyricBlock({entry, box, t}: {entry: Entry; box: {w: number; h: number}; t: number}) {
  const words = lyrics[entry.line].words.slice(entry.from, entry.to);
  const r = fitText(words.map(w => w.w).join(' '), box, entry.style);
  let k = 0;
  return (
    <div style={{width: box.w, height: box.h, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                 alignItems: 'center', fontSize: r.fontSize, lineHeight: LINE_H, whiteSpace: 'pre', ...look[entry.style]}}>
      {r.lines.map((line, li) => (
        <div key={li}>
          {line.split(' ').map((txt, wi) => {
            const w = words[k++];
            const age = t - w.s;
            const on = age >= 0;
            const bounce = entry.style === 'hook' && on && age < 6 / FPS ? 1 + 0.2 * (1 - age * FPS / 6) : 1;
            return <React.Fragment key={wi}>{wi > 0 ? ' ' : ''}<span style={{display: 'inline-block', opacity: on ? 1 : 0,
              transform: `scale(${bounce})`, transformOrigin: 'center bottom'}}>{txt}</span></React.Fragment>;
          })}
        </div>
      ))}
    </div>
  );
}
