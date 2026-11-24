import React from 'react';
import {Img, staticFile} from 'remotion';
import {STILL_H, STILL_W} from '../layout';
import {starState} from './fxMath';
import {hash} from './particles';

/** Where the star sits on still 32, and its drawn width (still px). */
export const STAR = {x: 0.393, y: 0.08, w: 340};

/** Shot 32: the star spins to its pixelated back, tips, falls out of frame and shatters at the bottom edge. */
export function Star({t}: {t: number}) {
  const s = starState(t);
  const cx = STAR.x * STILL_W, cy = STAR.y * STILL_H;
  const shards = s.phase === 'shatter' ? Array.from({length: 18}, (_, i) => {
    const a = s.shardAge, vx = 120 + 900 * hash(i), vy = -500 - 700 * hash(i + 9);   // burst left to right
    const x = cx - 120 + vx * a * 0.6, y = cy + s.y + vy * a * 0.6 + 1400 * a * a;   // burst where it lands
    const r = 34 + 46 * hash(i + 4);
    return <polygon key={i} points={`${x},${y - r} ${x + r * 0.8},${y + r * 0.6} ${x - r * 0.7},${y + r * 0.4}`}
      transform={`rotate(${720 * a * (hash(i + 2) - 0.5)},${x},${y})`} fill={i % 3 ? '#ffe9a3' : '#fffdf5'} stroke="#7a5b12" strokeWidth={2} opacity={1 - a} />;
  }) : null;
  const flash = s.phase === 'shatter' ? Math.max(0, 1 - s.shardAge * 2.5) : 0;
  return (
    <>
      {s.phase !== 'shatter' && s.phase !== 'gone' && (
        <div style={{position: 'absolute', left: cx - STAR.w / 2, top: cy - STAR.w / 2 + s.y, width: STAR.w, height: STAR.w,
          transform: `rotate(${s.rot}deg) scaleX(${Math.max(0.02, s.scaleX)})`}}>
          <Img src={staticFile(s.face === 'front' ? 'sprites/star-front.png' : 'sprites/star-back.png')}
            style={{width: '100%', height: '100%', objectFit: 'contain', imageRendering: s.face === 'back' ? 'pixelated' : 'auto'}} />
        </div>
      )}
      {shards && <svg width={STILL_W} height={STILL_H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>{shards}</svg>}
      {flash > 0 && <div style={{position: 'absolute', left: cx - 400, top: cy + s.y - 300, width: 800, height: 600,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,240,0.95), rgba(255,255,240,0) 65%)', opacity: flash}} />}
    </>
  );
}
