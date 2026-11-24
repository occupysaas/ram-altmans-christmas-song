import React from 'react';
import {TITLE} from './titles';

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const bounce = (x: number) => { // ease-out bounce
  const n = 7.5625, d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
};
const hash = (n: number) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
const outline = (c: string, r: number) => Array.from({length: 16}, (_, i) => {
  const a = i / 16 * Math.PI * 2; return `${(Math.cos(a) * r).toFixed(1)}px ${(Math.sin(a) * r).toFixed(1)}px 0 ${c}`;
}).join(', ');

/** "RAM ALTMAN'S / CHRISTMAS": letters drop in one by one with a bounce, then a snow-dust sparkle. */
export function Title({t, w}: {t: number; w: number}) {
  if (t < TITLE.start || t >= TITLE.end) return null;
  const lt = t - TITLE.start, fade = clamp((TITLE.end - t) / 0.4);
  const rows = [{text: "RAM ALTMAN'S", size: 70, y: 70}, {text: 'CHRISTMAS', size: 104, y: 150}];
  let k = 0;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, opacity: fade}}>
      {rows.map((r, ri) => (
        <div key={ri} style={{position: 'absolute', top: r.y, width: w, textAlign: 'center', whiteSpace: 'pre',
          fontFamily: "'Mountains of Christmas Bold'", fontSize: r.size, color: '#c8102e',
          textShadow: outline('#fdf6e3', 5) + ', 0 8px 0 #1b1424'}}>
          {r.text.split('').map((ch, i) => {
            const at = 0.06 * k++, u = clamp((lt - at) / 0.55);
            return <span key={i} style={{display: 'inline-block', transform: `translateY(${(1 - bounce(u)) * -260}px)`, opacity: u > 0 ? 1 : 0}}>{ch}</span>;
          })}
        </div>
      ))}
      {Array.from({length: 26}, (_, i) => {
        const at = 1.4 + hash(i) * 2, u = clamp((lt - at) / 0.6);
        if (u <= 0 || u >= 1) return null;
        return <div key={i} style={{position: 'absolute', left: w * (0.15 + 0.7 * hash(i + 3)), top: 60 + 170 * hash(i + 7),
          width: 6, height: 6, borderRadius: '50%', background: '#fff', opacity: 1 - u, boxShadow: '0 0 8px 3px rgba(255,255,255,.8)',
          transform: `scale(${1 + 2 * u})`}} />;
      })}
    </div>
  );
}
