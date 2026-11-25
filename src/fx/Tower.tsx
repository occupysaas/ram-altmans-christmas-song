import React from 'react';
import {Img, staticFile} from 'remotion';
import towers from '../../docs/towers.json';
import layers from '../../public/sprites/layers/layers.json';
const LAYERS = layers as Record<string, {x: number; y: number; w: number; h: number}>;
import {STILL_W, STILL_H} from '../layout';
import {towerBump, towerFlash, towerGrowth} from './towerMath';
import {cycle, hash} from './particles';
import {explode} from './fxMath';

type TowerSpec = {poly: number[][]; base: number[]; top: number[]};
const TW = towers as Record<string, TowerSpec>;

/** Feathered mask for the tower region (SVG data URI, blurred edges so the scaled layer blends into the sky). */
function maskUrl(poly: number[][]) {
  const pts = poly.map(([x, y]) => `${x * STILL_W},${y * STILL_H}`).join(' ');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${STILL_W}' height='${STILL_H}'><filter id='b'><feGaussianBlur stdDeviation='22'/></filter><polygon points='${pts}' fill='white' filter='url(#b)'/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

/** Smoke puffs and sparks from the tower top; both ramp with stage and song time (design §7a). */
function Emitters({top, stage, t, scale}: {top: [number, number]; stage: number; t: number; scale: number}) {
  const ramp = 0.6 + 0.4 * Math.min(1, t / 250);
  const puffs = Math.round((3 + 3 * stage) * ramp), sparks = stage < 2 ? 0 : Math.round(5 * stage * ramp);
  const dark = stage >= 4;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < puffs; i++) {
    const c = cycle(i, t, 3.2), seed = c.seed;
    const age = c.age;
    const r = (20 + 50 * age) * (0.7 + 0.15 * stage) * scale;
    const x = top[0] + (hash(seed) - 0.5) * 40 + age * 160 * (0.5 + hash(seed + 1));
    const y = top[1] - age * 260 * scale;
    out.push(<circle key={'p' + i} cx={x} cy={y} r={r} fill={dark ? '#3a3640' : '#d9d4e6'} opacity={(1 - age) * (dark ? 0.75 : 0.5)} />);
  }
  for (let i = 0; i < sparks; i++) {
    const {age, seed} = cycle(i + 500, t, 1.1);
    const vx = (hash(seed) - 0.5) * 420, vy = -200 - 260 * hash(seed + 2);
    const x = top[0] + vx * age, y = top[1] + vy * age + 500 * age * age;
    out.push(<circle key={'s' + i} cx={x} cy={y} r={3 + 3 * (1 - age)} fill={hash(seed + 3) > 0.5 ? '#ffe27a' : '#7df9ff'} opacity={1 - age} />);
  }
  return <>{out}</>;
}

/** The growing, drum-bumping tower layer, drawn in still space inside the camera transform. */
export function Tower({shot, t}: {shot: {id: string; still: string; towerStage: number | null; fx?: string[]}; t: number}) {
  const spec = TW[shot.id];
  if (!spec) return null;
  const stage = shot.towerStage ?? 1;
  const g = towerGrowth(t), b = towerBump(t, stage), flash = towerFlash(t);
  const bx = spec.base[0] * STILL_W, by = spec.base[1] * STILL_H;
  const ex = shot.fx?.includes('explode') ? explode(t) : null;
  if (ex && ex.phase !== 'swell') return null;                      // blown to bits: plate 65 has no tower
  const swell = ex ? ex.scale : 1, jit = ex ? ex.shake * (hash(Math.floor(t * 24)) - 0.5) : 0;
  const sy = (1 + g + b) * swell, sx = (1 + g + b * 0.5) * swell;   // stretch up more than out on each kick
  const top: [number, number] = [bx + (spec.top[0] * STILL_W - bx) * sx, by + (spec.top[1] * STILL_H - by) * sy];
  if ((shot as {towerCut?: boolean}).towerCut) {
    // the tower is its own cut-out layer over a tower-free plate: the WHOLE building bumps, the sky stays still
    // towerDy: seat it on its hill; towerScale: enlarge it about its base (so it fully covers any painted original)
    const L = LAYERS[`${shot.id}/tower`], dyT = (shot as {towerDy?: number}).towerDy ?? 0, kT = (shot as {towerScale?: number}).towerScale ?? 1;
    return <>
      <div style={{position: 'absolute', left: 0, top: 0, width: STILL_W, height: STILL_H, transformOrigin: `${bx}px ${by + dyT}px`,
        transform: `translateX(${jit}px) scale(${sx * kT}, ${sy * kT})`, filter: ex ? `brightness(${1 + flash + 0.08 * ex.glow})` : `brightness(${1 + flash})`}}>
        <Img src={staticFile(`sprites/layers/${shot.id}/tower.png`)} style={{position: 'absolute', left: L.x, top: L.y + dyT, width: L.w, height: L.h}} />
      </div>
      <svg width={STILL_W} height={STILL_H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <Emitters top={top} stage={ex ? 5 + Math.round(3 * ex.glow) : stage} t={t} scale={Math.max(0.6, (spec.poly[2][1] - spec.poly[0][1]))} />
      </svg>
      {(shot as {towerBehind?: boolean}).towerBehind && <Img src={staticFile(`plates/${shot.id}-front.png`)} style={{position: 'absolute', left: 0, top: 0, width: STILL_W, height: STILL_H}} />}
    </>;
  }
  const tm = (shot as {towerMask?: string}).towerMask, mask = tm ? `url(${staticFile(tm)})` : maskUrl(spec.poly);
  return (
    <>
      <div style={{position: 'absolute', left: 0, top: 0, width: STILL_W, height: STILL_H, transformOrigin: `${bx}px ${by}px`,
        transform: `translateX(${jit}px) rotate(${jit * 0.08}deg) scale(${sx}, ${sy})`,
        filter: ex ? `brightness(${1 + flash + 0.08 * ex.glow}) drop-shadow(0 0 ${40 * ex.glow}px rgba(255,70,30,${0.9 * ex.glow}))` : `brightness(${1 + flash})`,
        WebkitMaskImage: mask, maskImage: mask,
        WebkitMaskSize: '100% 100%', maskSize: '100% 100%'}}>
        <Img src={staticFile(shot.still)} style={{width: STILL_W, height: STILL_H, display: 'block'}} />
      </div>
      <svg width={STILL_W} height={STILL_H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <Emitters top={top} stage={ex ? 5 + Math.round(3 * ex.glow) : stage} t={t} scale={Math.max(0.6, (spec.poly[2][1] - spec.poly[0][1]))} />
      </svg>
    </>
  );
}
