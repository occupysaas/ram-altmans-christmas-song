import React from 'react';
import {Easing, Img, interpolate, staticFile} from 'remotion';
import {STILL_W, STILL_H, type Style} from './fitText';
import {LyricBlock} from './Lyric';

export const PROG_W = 960, PROG_H = 720;
type Cam = {x: number; y: number; zoom: number; rot: number};
export type Shot = {id: string; start: number; end: number; still: string; camera: {from: Cam; to: Cam};
  towerStage: number | null; lyrics: {line: number; from: number; to: number; carry?: boolean; style: Style;
  surface: {x: number; y: number; w: number; h: number; rot: number}}[]};

/** A still under an eased camera move, with its in-world lyrics painted onto it. */
export function Still({shot, t, frame}: {shot: Shot; t: number; frame: number}) {
  const p = interpolate(t, [shot.start, shot.end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.sin)});
  const {from: a, to: b} = shot.camera;
  const h = 0.5 / a.zoom + (0.5 / b.zoom - 0.5 / a.zoom) * p;   // half view size (still fraction), linear
  const cx = a.x + (b.x - a.x) * p, cy = a.y + (b.y - a.y) * p, rot = a.rot + (b.rot - a.rot) * p;
  const scale = PROG_W / (2 * h * STILL_W);
  const weave = {x: Math.sin(frame * 1.7) * 0.6, y: Math.cos(frame * 2.3) * 0.5};
  const inWorld = shot.lyrics.filter(e => !e.carry);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: STILL_W, height: STILL_H, transformOrigin: '0 0',
      transform: `translate(${PROG_W / 2 + weave.x}px, ${PROG_H / 2 + weave.y}px) rotate(${rot}deg) scale(${scale}) translate(${-cx * STILL_W}px, ${-cy * STILL_H}px)`}}>
      <Img src={staticFile(shot.still)} style={{width: STILL_W, height: STILL_H, display: 'block'}} />
      {inWorld.map((e, i) => {
        const s = e.surface, bh = s.h * STILL_H / inWorld.length;
        return (
          <div key={i} style={{position: 'absolute', left: s.x * STILL_W, top: s.y * STILL_H + i * bh,
                               transform: `rotate(${s.rot}deg)`}}>
            <LyricBlock entry={e} box={{w: s.w * STILL_W, h: bh}} t={t} />
          </div>
        );
      })}
    </div>
  );
}
