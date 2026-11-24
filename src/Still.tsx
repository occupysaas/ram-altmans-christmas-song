import React from 'react';
import {Easing, Img, interpolate, staticFile} from 'remotion';
import {STILL_W, STILL_H, type Style} from './layout';
import {LyricBlock} from './Lyric';
import {Tower} from './fx/Tower';
import {Star} from './fx/Star';
import {CHOREO} from './shots';
import {Puppet} from './puppet/Puppet';
import {isSprite, isHose, isShade} from './shots/types';
import {Hose} from './puppet/Hose';
import props from '../public/sprites/props/props.json';

export const PROG_W = 960, PROG_H = 720;
type Cam = {x: number; y: number; zoom: number; rot: number};
export type Shot = {id: string; start: number; end: number; still: string; camera: {from: Cam; to: Cam};
  towerStage: number | null; fx?: string[]; plate?: string; lyrics: {line: number; from: number; to: number; style: Style; tone: 'light' | 'dark';
  surface: {x: number; y: number; w: number; h: number; rot: number}}[]};

/** A still under an eased camera move, with its in-world lyrics painted onto it. */
export function Still({shot, t, frame, image, children}: {shot: Shot; t: number; frame: number; image?: string; children?: React.ReactNode}) {
  const p = interpolate(t, [shot.start, shot.end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.sin)});
  const {from: a, to: b} = shot.camera;
  const h = 0.5 / a.zoom + (0.5 / b.zoom - 0.5 / a.zoom) * p;   // half view size (still fraction), linear
  const cx = a.x + (b.x - a.x) * p, cy = a.y + (b.y - a.y) * p, rot = a.rot + (b.rot - a.rot) * p;
  const scale = PROG_W / (2 * h * STILL_W);
  const weave = {x: Math.sin(frame * 1.7) * 0.6, y: Math.cos(frame * 2.3) * 0.5};
  const inWorld = shot.lyrics;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: STILL_W, height: STILL_H, transformOrigin: '0 0',
      transform: `translate(${PROG_W / 2 + weave.x}px, ${PROG_H / 2 + weave.y}px) rotate(${rot}deg) scale(${scale}) translate(${-cx * STILL_W}px, ${-cy * STILL_H}px)`}}>
      <Img src={staticFile(image ?? (CHOREO[shot.id] && shot.plate ? shot.plate : shot.fx?.includes('star') ? 'plates/32.png' : shot.fx?.includes('collapse') ? 'plates/65.png' : shot.still))} style={{width: STILL_W, height: STILL_H, display: 'block'}} />
      {shot.fx?.includes('tower') && <Tower shot={shot} t={t} />}
      {shot.fx?.includes('star') && <Star t={t} />}
      {CHOREO[shot.id] && <svg width={STILL_W} height={STILL_H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {CHOREO[shot.id](t, frame, shot).map((p, i) => {
          if (isHose(p)) return <Hose key={i} {...p.hose} />;
          if (isShade(p)) return p.shade.round
            ? <ellipse key={i} cx={p.shade.x + p.shade.w / 2} cy={p.shade.y + p.shade.h / 2} rx={p.shade.w / 2} ry={p.shade.h / 2} fill={p.shade.color ?? '#050414'} opacity={p.shade.opacity} style={{filter: 'blur(18px)'}} />
            : <rect key={i} x={p.shade.x} y={p.shade.y} width={p.shade.w} height={p.shade.h} rx={60} fill={p.shade.color ?? '#050414'} opacity={p.shade.opacity} style={{filter: 'blur(30px)'}} />;
          if (!isSprite(p)) return <Puppet key={i} who={p.who} pose={p.pose} scale={p.scale} frame={frame} />;
          const meta = p.sprite.startsWith('sprites/props/') ? (props as Record<string, {size: [number, number]; grip: [number, number]}>)[p.sprite.slice(14)] : undefined;
          const [w, h] = p.size ?? meta?.size ?? [200, 200], an = p.anchor ?? meta?.grip ?? [w / 2, h / 2];
          return <g key={i} opacity={p.opacity ?? 1} transform={`translate(${p.at[0]},${p.at[1]}) rotate(${p.rot ?? 0}) scale(${p.flip ? -p.scale : p.scale},${p.scale}) translate(${-an[0]},${-an[1]})`}>
            <image href={staticFile(`${p.sprite}.png`)} width={w} height={h} />
          </g>;
        })}
      </svg>}
      {children}
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
