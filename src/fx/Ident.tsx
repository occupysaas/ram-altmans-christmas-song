import React from 'react';
import {IDENT} from './titles';

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const hash = (n: number) => { const x = Math.sin(n * 91.345) * 43758.5453; return x - Math.floor(x); };
const outline = (c: string, r: number) => Array.from({length: 12}, (_, i) => {
  const a = i / 12 * Math.PI * 2; return `${(Math.cos(a) * r).toFixed(1)}px ${(Math.sin(a) * r).toFixed(1)}px 0 ${c}`;
}).join(', ');

/** 1960s station-ident card: "Occupy SaaS presents" on a teal sunburst oval; fades out through a CRT flicker. */
export function Ident({t, frame, w, h}: {t: number; frame: number; w: number; h: number}) {
  if (t < IDENT.start || t >= IDENT.end) return null;
  const u = (t - IDENT.start) / (IDENT.end - IDENT.start);
  const zoom = 1 + 0.08 * u;
  const fadeIn = clamp((t - IDENT.start) / 0.35);
  const out = clamp((IDENT.end - t) / 0.35);
  const flicker = out < 1 ? (hash(frame) > 0.5 ? 1 : 0.35) * out : 1;
  const rays = Array.from({length: 24}, (_, i) => i);
  const spin = t * 8;
  return (
    <div style={{position: 'absolute', inset: 0, background: '#0d3b44', opacity: fadeIn * flicker, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '50% 50%'}}>
        <g transform={`translate(${w / 2},${h / 2}) rotate(${spin})`}>
          {rays.map(i => <path key={i} d={`M0,0 L${Math.cos(i / 12 * Math.PI) * 900},${Math.sin(i / 12 * Math.PI) * 900} L${Math.cos((i + 0.5) / 12 * Math.PI) * 900},${Math.sin((i + 0.5) / 12 * Math.PI) * 900} Z`}
            fill={i % 2 ? '#14525d' : '#0f4650'} />)}
        </g>
        <ellipse cx={w / 2} cy={h / 2} rx={w * 0.36} ry={h * 0.3} fill="#f4e6c4" stroke="#1b1424" strokeWidth={8} />
        <ellipse cx={w / 2} cy={h / 2} rx={w * 0.33} ry={h * 0.265} fill="none" stroke="#c8102e" strokeWidth={4} strokeDasharray="14 10" />
        {[0, 1, 2, 3].map(i => <line key={i} x1={w / 2 - w * 0.25} x2={w / 2 + w * 0.25} y1={h / 2 + 70 + i * 9} y2={h / 2 + 70 + i * 9} stroke="#1b1424" strokeWidth={2} opacity={0.25} />)}
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        transform: `scale(${zoom})`}}>
        <div style={{fontFamily: "'Bowlby One'", fontSize: 60, color: '#c8102e', textShadow: outline('#1b1424', 4) + ', 0 6px 0 #1b1424', letterSpacing: 2}}>Occupy SaaS</div>
        <div style={{fontFamily: "'IM Fell English'", fontStyle: 'italic', fontSize: 44, color: '#1b1424', marginTop: 4}}>presents</div>
      </div>
    </div>
  );
}
