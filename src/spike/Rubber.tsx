/** THROWAWAY SPIKE: rubber-hose Ram for shot 13. Limbs are bendy SVG tubes between painted parts;
 *  poses change on twos; the whole body squashes on kicks; outlines "boil" via a 3-frame turbulence cycle. */
import React from 'react';
import {staticFile} from 'remotion';
import parts from './parts.json';
import audio from '../timing/audio.json';

type P = [number, number];
type Part = {size: [number, number]; [k: string]: any};
const PT = parts as Record<string, Part>;
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
const mul = (a: P, k: number): P => [a[0] * k, a[1] * k];
const len = (a: P) => Math.hypot(a[0], a[1]);
const easeBack = (u: number) => { const c = 1.7; const x = Math.min(1, Math.max(0, u)) - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
const anchor = (name: string, key: string): P => PT[name][key] as P;

/** A rubber-hose limb: a quadratic tube from a to b whose sag keeps its length ~L (no elbows), bending to `side`. */
function Hose({a, b, L, side, width, fill, ink}: {a: P; b: P; L: number; side: 1 | -1; width: number; fill: string; ink: string}) {
  const d = sub(b, a), dl = Math.max(1, len(d)), n: P = [-d[1] / dl * side, d[0] / dl * side];
  const sag = Math.sqrt(Math.max(0, L * L - dl * dl)) * 0.55;
  const c = add(mul(add(a, b), 0.5), mul(n, sag));
  const path = `M${a[0]},${a[1]} Q${c[0]},${c[1]} ${b[0]},${b[1]}`;
  return <g>
    <path d={path} stroke={ink} strokeWidth={width + 9} fill="none" strokeLinecap="round" />
    <path d={path} stroke={fill} strokeWidth={width} fill="none" strokeLinecap="round" />
  </g>;
}
/** Tangent angle (deg) at the end of the hose, for orienting a hand or foot. */
const endAngle = (a: P, b: P, L: number, side: 1 | -1) => {
  const d = sub(b, a), dl = Math.max(1, len(d)), n: P = [-d[1] / dl * side, d[0] / dl * side];
  const c = add(mul(add(a, b), 0.5), mul(n, Math.sqrt(Math.max(0, L * L - dl * dl)) * 0.55));
  const tg = sub(b, c); return Math.atan2(tg[1], tg[0]) * 180 / Math.PI;
};

function Sprite({name, at, anchorKey, rot = 0, scale, flip = false}: {name: string; at: P; anchorKey: string; rot?: number; scale: number; flip?: boolean}) {
  const [w, h] = PT[name].size, an = anchor(name, anchorKey);
  return <g transform={`translate(${at[0]},${at[1]}) rotate(${rot}) scale(${flip ? -scale : scale},${scale}) translate(${-an[0]},${-an[1]})`}>
    <image href={staticFile(`rubber/${name}.png`)} width={w} height={h} />
  </g>;
}

/** Kick-drum squash: 1 at rest, dips toward 0.9 right after each kick (no stacking: nearest kick only). */
export function squash(t: number) {
  let k = -1; for (const [kt] of audio.kicks) { if (kt <= t) k = kt; else break; }
  return k < 0 ? 1 : 1 - 0.09 * Math.exp(-(t - k) / 0.08);
}

/** Shot-13 choreography in still pixels. `t` is song time; poses are evaluated on twos. */
export function RubberRam({t, frame, shotStart, scale = 0.36}: {t: number; frame: number; shotStart: number; scale?: number}) {
  const tq = Math.floor(frame / 2) * 2 / 24;            // on twos
  const lt = tq - (frame / 24 - t) - shotStart;          // local time on twos
  const FLOOR = 1030, X0 = 170;
  const D = 0.31, STEPS = 6, T_STOP = D * STEPS;      // six steps, then both feet are planted
  const v = 600 / T_STOP;                             // px/s while walking
  const X = (tt: number) => X0 + v * Math.min(tt, T_STOP);
  const u0 = Math.max(0, lt - T_STOP);                 // time since the feet stopped
  // follow-through: the body keeps going after the feet plant, overshoots and springs back
  const spring = (amp: number, w: number, k: number, lag = 0) => {
    const u = Math.max(0, u0 - lag); return lt < T_STOP ? 0 : amp * Math.sin(w * u) * Math.exp(-k * u);
  };
  const x = X(lt) + spring(38, 11, 4.5);
  const walking = lt < T_STOP;
  const stepPhase = (lt / D) % 1;                      // hip dip once per step
  const sq = squash(t);
  const hipY = FLOOR - 300 * scale / 0.62 + (walking ? -24 * Math.sin(Math.PI * stepPhase) : -spring(10, 11, 4.5, 0.04));
  const peer = lt > T_STOP + 0.45;
  const lean = walking ? 7 : (peer ? 16 : 7) + spring(9, 11, 4.5, 0.03);
  const torsoAt: P = [x, hipY];
  const tS = scale;
  const T = (key: string): P => add(torsoAt, mul(sub(anchor('torso', key), anchor('torso', 'hipNear')), tS));
  const hipNear = T('hipNear'), hipFar = T('hipFar');
  const R = (q: P): P => { const a = lean * Math.PI / 180, d = sub(q, hipNear);
    return add(hipNear, [d[0] * Math.cos(a) - d[1] * Math.sin(a), d[0] * Math.sin(a) + d[1] * Math.cos(a)]); };
  const neck = R(T('neck')), shN = R(T('shoulderNear')), shF = R(T('shoulderFar'));
  // planted footsteps: stance for D (foot fixed on the floor), swing for D (arc to the next plant)
  const LIFT = 110 * tS / 0.62;
  const foot = (off: number): P => {
    const tt = Math.min(lt, T_STOP) + off, C = 2 * D, u = ((tt % C) + C) % C, land = tt - u;
    const plant = (tl: number) => X(Math.max(0, tl - off)) + v * D / 2;
    if (lt >= T_STOP && u >= D) return [plant(land + C), FLOOR];   // the lifting foot lands beside the other
    if (u < D) return [plant(land), FLOOR];
    const k = (u - D) / D, a = plant(land), bb = plant(land + C);
    return [a + (bb - a) * (1 - Math.cos(Math.PI * k)) / 2, FLOOR - LIFT * Math.sin(Math.PI * k)];
  };
  const footN = foot(0), footF = foot(D);
  // arms hang at the sides and swing opposite to the same-side leg; after the stop they swing on and settle
  const armReach = 200 * tS / 0.62;
  const legSwing = (off: number) => Math.cos(Math.PI * (((Math.min(lt, T_STOP) + off) / D) % 2));
  const swingN = walking ? -26 * legSwing(0) : spring(-22, 9, 3.5, 0.06);
  const swingF = walking ? -26 * legSwing(D) : spring(18, 9, 3.5, 0.1);
  const hang = (sh: P, deg: number, fwd: number): P => {
    const a = (deg + lean) * Math.PI / 180; return add(sh, [Math.sin(a) * armReach + fwd, Math.cos(a) * armReach]);
  };
  const rub = Math.sin(lt * 16) * 8;
  const handN = peer ? add(shN, [90 * tS / 0.62 + rub, 120 * tS / 0.62]) : hang(shN, swingN, 0);
  const handF = peer ? add(shF, [110 * tS / 0.62 - rub, 115 * tS / 0.62]) : hang(shF, swingF, 0);
  const head = peer ? 'head-squint' : 'head-smirk';
  const armL = 230 * tS / 0.62, legL = 360 * tS / 0.62;
  const arm = 34 * tS / 0.62, leg = 40 * tS / 0.62;
  const boilSeed = Math.floor(frame / 2) % 3;
  const SLEEVE = '#8e8b93', SLEEVE_FAR = '#6f6c75', TROU = '#2e2a33', TROU_FAR = '#211e26', INK = '#17121c';
  return (
    <svg width={1600} height={1200} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <filter id="boil" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={boilSeed} />
          <feDisplacementMap in="SourceGraphic" scale="4" />
        </filter>
      </defs>
      <g filter="url(#boil)" transform={`translate(${x},${FLOOR}) scale(${1 / sq},${sq}) translate(${-x},${-FLOOR})`}>
        {/* far limbs behind the torso */}
        <Hose a={hipFar} b={footF} L={legL} side={-1} width={leg} fill={TROU_FAR} ink={INK} />
        <Sprite name="foot-far" at={footF} anchorKey="ankle" scale={tS} />
        <Hose a={shF} b={handF} L={armL} side={1} width={arm} fill={SLEEVE_FAR} ink={INK} />
        <Sprite name="hand-far-open" at={handF} anchorKey="wrist" rot={endAngle(shF, handF, armL, 1)} scale={tS} />
        <g transform={`rotate(${lean},${hipNear[0]},${hipNear[1]})`}>
          <Sprite name="torso" at={hipNear} anchorKey="hipNear" scale={tS} />
        </g>
        <Sprite name={head} at={neck} anchorKey="neck" rot={lean + (peer ? 12 : 0) + spring(-10, 10, 4, 0.08)} scale={tS} />
        {/* near limbs in front */}
        <Hose a={hipNear} b={footN} L={legL} side={-1} width={leg} fill={TROU} ink={INK} />
        <Sprite name="foot-near" at={footN} anchorKey="ankle" scale={tS} />
        <Hose a={shN} b={handN} L={armL} side={1} width={arm} fill={SLEEVE} ink={INK} />
        <Sprite name={peer ? 'hand-near-grab' : 'hand-near-open'} at={handN} anchorKey="wrist" rot={endAngle(shN, handN, armL, 1)} scale={tS} />
      </g>
    </svg>
  );
}
