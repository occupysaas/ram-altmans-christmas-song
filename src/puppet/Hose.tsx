import React from 'react';
import {type P, hoseControl} from './geom';

/** A rubber-hose limb: an inked tube along a quadratic whose arc length stays L (no elbows or knees). */
export function Hose({a, b, L, side, width, fill, ink}: {a: P; b: P; L: number; side: 1 | -1; width: number; fill: string; ink: string}) {
  const c = hoseControl(a, b, L, side);
  const d = `M${a[0]},${a[1]} Q${c[0]},${c[1]} ${b[0]},${b[1]}`;
  return <g>
    <path d={d} stroke={ink} strokeWidth={width + Math.max(4, width * 0.28)} fill="none" strokeLinecap="round" />
    <path d={d} stroke={fill} strokeWidth={width} fill="none" strokeLinecap="round" />
  </g>;
}
