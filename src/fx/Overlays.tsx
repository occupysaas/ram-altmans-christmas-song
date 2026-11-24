/** Per-shot effect overlays drawn in still space (inside the camera transform). Deterministic, frame-derived,
 *  driven by beats/kicks/snares. Regions come from docs/fx-regions.json (still fractions). */
import React from 'react';
import {Img, staticFile} from 'remotion';
import regions from '../../docs/fx-regions.json';
import audio from '../timing/audio.json';
import {STILL_W as W, STILL_H as H} from '../layout';
import {hash, cycle} from './particles';

const R = regions as Record<string, Record<string, any>>;
const since = (ev: number[][], t: number) => { let k = -1; for (const [x] of ev) { if (x <= t) k = x; else break; } return k < 0 ? 99 : t - k; };
const beatSince = (t: number) => { let k = -1; for (const b of audio.beats) { if (b <= t) k = b; else break; } return k < 0 ? 99 : t - k; };
const pulse = (s: number, d = 0.15) => Math.exp(-s / d);
const box = (r: number[]) => ({left: r[0] * W, top: r[1] * H, width: r[2] * W, height: r[3] * H});

type P = {id: string; t: number; still: string};
const FX: Record<string, (p: P & {r: any}) => React.ReactNode> = {
  chimneySmoke: ({t, r}) => <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>{(r as number[][]).flatMap(([x, y], c) =>
    Array.from({length: 5}, (_, i) => { const {age} = cycle(c * 10 + i, t, 2.6);
      return <circle key={c + '-' + i} cx={x * W + age * 60} cy={y * H - age * 180} r={10 + 30 * age} fill="#e8e4f2" opacity={0.55 * (1 - age)} />; }))}</svg>,
  dust: ({t, r}) => <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>{Array.from({length: 40}, (_, i) => {
    const x = (r[0] + r[2] * hash(i)) * W + 30 * Math.sin(t * 0.7 + i), y = (r[1] + r[3] * ((hash(i + 9) + t * 0.03) % 1)) * H;
    return <circle key={i} cx={x} cy={y} r={2 + 2 * hash(i + 3)} fill="#fffbe6" opacity={0.35 + 0.4 * Math.sin(t * 2 + i) ** 2} />; })}</svg>,
  gpuHum: ({t, r}) => <div style={{position: 'absolute', ...box(r), background: 'radial-gradient(ellipse, rgba(110,255,240,.55), rgba(110,255,240,0) 70%)',
    opacity: 0.25 + 0.6 * pulse(beatSince(t)), mixBlendMode: 'screen'}} />,
  terminal: ({t, r}) => <div style={{position: 'absolute', ...box(r), overflow: 'hidden'}}>{Array.from({length: 9}, (_, row) =>
    <div key={row} style={{height: r[3] * H / 9, display: 'flex', gap: 8, alignItems: 'center', transform: `translateY(${-(t * 60 % (r[3] * H / 9))}px)`}}>
      {Array.from({length: 5 + Math.floor(hash(row + Math.floor(t * 4)) * 6)}, (_, k) => <div key={k} style={{height: 12, width: 20 + 50 * hash(row * 7 + k),
        background: '#5ff6ff', opacity: 0.75, boxShadow: '0 0 6px #18c8ff'}} />)}</div>)}</div>,
  fans: ({t, r}) => <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>{(r as number[][]).map(([x, y, rad], i) =>
    <g key={i} transform={`translate(${x * W},${y * H}) rotate(${t * 900 + i * 40})`} opacity={0.55}>
      {[0, 1, 2, 3, 4].map(k => <path key={k} d={`M0,0 Q${rad * W * 0.5},${-rad * W * 0.2} ${rad * W * 0.9},0 Q${rad * W * 0.5},${rad * W * 0.15} 0,0`}
        transform={`rotate(${k * 72})`} fill="#c9d3e8" stroke="#2b2a3a" strokeWidth={3} />)}</g>)}</svg>,
  spinner: ({t, r}) => <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>{Array.from({length: 8}, (_, i) => {
    const a = i / 8 * 2 * Math.PI + Math.floor(t * 10) * Math.PI / 4;
    return <circle key={i} cx={r[0] * W + Math.cos(a) * r[2] * W} cy={r[1] * H + Math.sin(a) * r[2] * W} r={6} fill="#ffffff" opacity={0.2 + 0.8 * i / 8} />; })}</svg>,
  tagFlip: ({t, r, still}) => { const s = beatSince(t), flip = Math.cos(Math.min(1, s / 0.25) * Math.PI);
    return <div style={{position: 'absolute', ...box(r), transform: `scaleX(${Math.abs(flip) < 0.05 ? 0.05 : flip})`, overflow: 'hidden'}}>
      <Img src={staticFile(still)} style={{position: 'absolute', left: -r[0] * W, top: -r[1] * H, width: W, height: H}} /></div>; },
  receipt: ({t, r}) => <div style={{position: 'absolute', ...box(r), overflow: 'hidden', opacity: 0.6}}>{Array.from({length: 14}, (_, i) =>
    <div key={i} style={{position: 'absolute', left: '10%', width: '60%', height: 6, background: '#6d5f55', top: ((i * 40 + t * 120) % (r[3] * H)), transform: 'rotate(-28deg)'}} />)}</div>,
  jpg: ({id, t, r, still}) => { const steps = Math.min(5, Math.floor(Math.max(0, t - 0) * 2) % 6), px = [1, 0.25, 0.12, 0.07, 0.05, 0.035][steps];
    return <div style={{position: 'absolute', ...box(r), overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: r[2] * W * px, height: r[3] * H * px, transform: `scale(${1 / px})`, transformOrigin: '0 0', overflow: 'hidden'}}>
        <Img src={staticFile(still)} style={{position: 'absolute', left: -r[0] * W * px, top: -r[1] * H * px, width: W * px, height: H * px, imageRendering: 'pixelated'}} />
      </div></div>; },
  register: ({t, r, still}) => <div style={{position: 'absolute', ...box(r), overflow: 'hidden', transform: `translateY(${18 * pulse(beatSince(t), 0.1)}px)`}}>
    <Img src={staticFile(still)} style={{position: 'absolute', left: -r[0] * W, top: -r[1] * H, width: W, height: H}} /></div>,
  clamChomp: ({t, r, still}) => <div style={{position: 'absolute', ...box(r), overflow: 'hidden', transformOrigin: '20% 30%',
    transform: `rotate(${-10 * pulse(beatSince(t), 0.12)}deg)`}}><Img src={staticFile(still)} style={{position: 'absolute', left: -r[0] * W, top: -r[1] * H, width: W, height: H}} /></div>,
  panic: ({t, r}) => <div style={{position: 'absolute', ...box(r), background: '#ff1020', mixBlendMode: 'screen', opacity: 0.55 * pulse(since(audio.snares, t), 0.12)}} />,
  lightsOut: ({id, t}) => { const s = beatSince(t), n = Math.floor((t * 1.9) % 6);
    return <div style={{position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(5,4,20,${0.12 * n}) ${100 - n * 15}%, rgba(5,4,20,${0.1 * n}))`, opacity: 0.6 + 0.4 * pulse(s)}} />; },
  coins: ({t, r}) => <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>{Array.from({length: 16}, (_, i) => {
    const {age, seed} = cycle(i, t, 1.2), x = (r[0] + r[2] * hash(seed)) * W, y = (r[1] + r[3] * age) * H - 200 * Math.sin(Math.PI * age);
    return <g key={i} transform={`translate(${x},${y}) scale(${Math.cos(age * 12)},1)`}><circle r={16} fill="#ffcf3f" stroke="#7a5b12" strokeWidth={3} /></g>; })}</svg>,
  confetti: ({t, r}) => <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>{Array.from({length: 90}, (_, i) => {
    const {age, seed} = cycle(i, t, 2.4), x = (r[0] + r[2] * hash(seed)) * W + 40 * Math.sin(t * 3 + i), y = (r[1] + r[3] * age) * H;
    const c = ['#ff3b4e', '#ffd34d', '#7dffb0', '#7db7ff', '#ff8be0'][i % 5];
    return <rect key={i} x={x} y={y} width={14} height={8} fill={c} transform={`rotate(${age * 720 + i * 37},${x},${y})`} />; })}</svg>,
  giftDrop: ({t, r}) => <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>{Array.from({length: 4}, (_, i) => {
    const s = (t * 0.9 + i * 0.25) % 1, x = (r[0] + r[2] * (i + 0.5) / 4) * W, y = r[1] * H - 300 + 300 * Math.min(1, s * 3) ** 2;
    const c = ['#c8102e', '#1d6b3a', '#2a5ba8', '#d9a21b'][i];
    return <g key={i} transform={`translate(${x},${y + (s * 3 > 1 ? -12 * Math.exp(-(s * 3 - 1) * 8) : 0)})`}><rect x={-34} y={-34} width={68} height={68} fill={c} stroke="#17121c" strokeWidth={4} />
      <rect x={-6} y={-34} width={12} height={68} fill="#fff1c9" /><rect x={-34} y={-6} width={68} height={12} fill="#fff1c9" /></g>; })}</svg>,
  marquee: ({t, r}) => { const [x, y, w, h] = [r[0] * W, r[1] * H, r[2] * W, r[3] * H], n = 34;
    return <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>{Array.from({length: n}, (_, i) => {
      const u = i / n, per = 2 * (w + h), d = u * per;
      const p = d < w ? [x + d, y] : d < w + h ? [x + w, y + d - w] : d < 2 * w + h ? [x + w - (d - w - h), y + h] : [x, y + h - (d - 2 * w - h)];
      const on = (i + Math.floor(t * 8)) % 3 === 0;
      return <circle key={i} cx={p[0]} cy={p[1]} r={9} fill={on ? '#fff6c2' : '#7a5b12'} opacity={on ? 1 : 0.6} style={on ? {filter: 'drop-shadow(0 0 8px #ffe27a)'} : undefined} />; })}</svg>; },
};

export function Overlays({shot, t}: {shot: {id: string; fx?: string[]; still: string}; t: number}) {
  return <>{(shot.fx ?? []).filter(f => FX[f] && R[shot.id]?.[f]).map(f =>
    <React.Fragment key={f}>{FX[f]({id: shot.id, t, still: shot.still, r: R[shot.id][f]})}</React.Fragment>)}</>;
}
