import React from 'react';

/** Deterministic snowfall: flake i's path depends only on i and the frame number. */
const hash = (n: number) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
const LAYERS = [{n: 70, size: 2, speed: 1.1, alpha: 0.55}, {n: 45, size: 3.5, speed: 2.0, alpha: 0.75}, {n: 18, size: 6, speed: 3.4, alpha: 0.9}];

export function Snow({frame, w, h, density = 1}: {frame: number; w: number; h: number; density?: number}) {
  const flakes: React.ReactNode[] = [];
  LAYERS.forEach((L, li) => {
    for (let i = 0; i < Math.round(L.n * density); i++) {
      const id = li * 1000 + i;
      const x0 = hash(id) * w, y0 = hash(id + 0.5) * h, ph = hash(id + 0.25) * 6.28;
      const y = (y0 + frame * L.speed) % (h + 20) - 10;
      const x = (x0 + Math.sin(frame * 0.04 + ph) * 14 * L.speed + frame * 0.3) % w;
      flakes.push(<div key={id} style={{position: 'absolute', left: x, top: y, width: L.size, height: L.size,
        borderRadius: '50%', background: '#fff', opacity: L.alpha}} />);
    }
  });
  return <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>{flakes}</div>;
}
