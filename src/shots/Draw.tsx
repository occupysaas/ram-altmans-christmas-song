/** Renders LayerItem (cut-out character layers) and DrawItem (small vector marks) inside the still-space SVG. */
import React from 'react';
import {staticFile} from 'remotion';
import type {LayerItem, DrawItem} from './types';
import layers from '../../public/sprites/layers/layers.json';

const IDX = layers as Record<string, {x: number; y: number; w: number; h: number}>;

export function Layer({p}: {p: LayerItem}) {
  const L = IDX[p.layer];
  if (!L) return null;
  const pv = p.pivot ?? [L.x + L.w / 2, L.y + L.h];   // default pivot: bottom centre (the feet)
  return <g opacity={p.opacity ?? 1} transform={`translate(${(p.dx ?? 0) + pv[0]},${(p.dy ?? 0) + pv[1]}) rotate(${p.rot ?? 0}) scale(${p.sx ?? 1},${p.sy ?? 1}) translate(${-pv[0]},${-pv[1]})`}>
    <image href={staticFile(`sprites/layers/${p.layer}.png`)} x={L.x} y={L.y} width={L.w} height={L.h} />
  </g>;
}

export function Draw({p}: {p: DrawItem}) {
  const d = p.draw, [x, y] = d.at, s = d.size, ink = d.ink ?? '#17121c', op = d.opacity ?? 1;
  const T = `translate(${x},${y}) rotate(${d.rot ?? 0})`;
  switch (d.kind) {
    case 'cursor': return <path transform={`${T} scale(${s / 40})`} opacity={op} d="M0,0 L0,34 L9,26 L15,40 L21,37 L15,24 L27,24 Z" fill={d.color ?? '#fff'} stroke={ink} strokeWidth={3} strokeLinejoin="round" />;
    case 'ring': return <circle cx={x} cy={y} r={s} fill="none" stroke={d.color ?? '#fff'} strokeWidth={Math.max(2, s * 0.12)} opacity={op} />;
    case 'ellipse': return <ellipse transform={`rotate(${d.rot ?? 0},${x},${y})`} cx={x} cy={y} rx={(d.w ?? s) / 2} ry={(d.h ?? s) / 2} fill={d.color ?? '#f6e7c4'} stroke={ink} strokeWidth={3} opacity={op} />;
    case 'rect': return <rect x={x - (d.w ?? s) / 2} y={y - (d.h ?? s) / 2} width={d.w ?? s} height={d.h ?? s} rx={2} fill={d.color ?? '#141a33'} opacity={op} />;
    case 'dot': return <circle cx={x} cy={y} r={s} fill={d.color ?? '#fff'} opacity={op} />;
    case 'drop': return <path transform={`${T} scale(${s / 20})`} opacity={op} d="M0,-20 C6,-8 12,0 12,8 A12,12 0 0 1 -12,8 C-12,0 -6,-8 0,-20 Z" fill={d.color ?? '#9fe3ff'} stroke={ink} strokeWidth={2} />;
    case 'note': return <text transform={T} opacity={op} fontSize={s} fill={d.color ?? '#fff6d0'} stroke={ink} strokeWidth={s * 0.05} textAnchor="middle" fontFamily="serif">{d.text ?? '♪'}</text>;
    case 'line': return <line x1={x} y1={y} x2={d.to![0]} y2={d.to![1]} stroke={d.color ?? '#fff'} strokeWidth={s} strokeLinecap="round" opacity={op} />;
    case 'text': return <text transform={T} opacity={op} fontSize={s} fill={d.color ?? '#17121c'} textAnchor="middle" dominantBaseline="middle" fontFamily={`'${d.font ?? 'Bowlby One'}'`} stroke={d.ink} strokeWidth={d.ink ? s * 0.06 : 0} paintOrder="stroke">{d.text}</text>;
    case 'flake': return <g transform={T} opacity={op} stroke={d.color ?? '#eafcff'} strokeWidth={Math.max(1.5, s * 0.14)} strokeLinecap="round">
      {[0, 60, 120].map(a => <line key={a} transform={`rotate(${a})`} x1={-s} y1={0} x2={s} y2={0} />)}</g>;
  }
}
