/** Shot 12: three GPU fans blasting frosty air, anime-style. Blades spin on smooth time (fanMath); wind, frost and
 *  ice crystals run on the held animation time. Each fan region is [cx, cy, rx, ry] in still fractions (an ellipse). */
import React from 'react';
import {staticFile} from 'remotion';
import {STILL_W as W, STILL_H as H} from '../layout';
import {fanSpin, fanBoost} from './fanMath';
import {hash, cycle} from './particles';

const BLADE = 600;   // sprite px

export function FrostFans({fans, t, ts}: {fans: number[][]; t: number; ts: number}) {
  const turns = fanSpin(ts), boost = fanBoost(ts), held = fanBoost(t);
  return <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
    {fans.map(([fx, fy, frx, fry], i) => {
      const cx = fx * W + (held > 0.5 ? 2 * (hash(i + Math.floor(t * 24)) - 0.5) * 2 : 0), cy = fy * H, rx = frx * W, ry = fry * H;
      const ang = 360 * turns + i * 23, sx = 2 * rx * 0.97 / BLADE, sy = 2 * ry * 0.97 / BLADE;
      const blade = (a: number, op: number, k: string) => <g key={k} opacity={op} transform={`translate(${cx},${cy}) scale(${sx},${sy}) rotate(${a})`}>
        <image href={staticFile('sprites/fan/blade.png')} x={-BLADE / 2} y={-BLADE / 2} width={BLADE} height={BLADE} /></g>;
      // ice-wind: radial speed lines bursting out of the rim toward the viewer
      const lines = Array.from({length: 26}, (_, k) => {
        const {age} = cycle(i * 40 + k, t, 0.4), th = 2 * Math.PI * hash(i * 17 + k) + t * 0.6;
        const r0 = 0.75 + 1.1 * age, r1 = r0 + 0.45 + 0.7 * held;
        return <line key={'l' + k} x1={cx + Math.cos(th) * rx * r0} y1={cy + Math.sin(th) * ry * r0} x2={cx + Math.cos(th) * rx * r1} y2={cy + Math.sin(th) * ry * r1}
          stroke={k % 3 ? '#ffffff' : '#9feeff'} strokeWidth={6 + 16 * age} strokeLinecap="round" opacity={Math.min(1, (1 - age) * (0.75 + 0.5 * held))} />;
      });
      // snow crystals streaming out and growing as they come at the camera
      const flakes = Array.from({length: 14}, (_, k) => {
        const {age} = cycle(i * 90 + k + 300, t, 0.9), th = 2 * Math.PI * hash(i * 31 + k + 5);
        const r = 0.3 + 1.6 * age, s = 6 + 26 * age, x = cx + Math.cos(th) * rx * r, y = cy + Math.sin(th) * ry * r;
        return <g key={'f' + k} transform={`translate(${x},${y}) rotate(${200 * age + k * 30})`} opacity={1 - age} stroke="#eafcff" strokeWidth={Math.max(2, s * 0.16)} strokeLinecap="round">
          {[0, 60, 120].map(a => <line key={a} transform={`rotate(${a})`} x1={-s} y1={0} x2={s} y2={0} />)}</g>;
      });
      // frosty mist blowing out of the fan face
      const mist = Array.from({length: 5}, (_, k) => { const {age} = cycle(i * 7 + k + 900, t, 1.2);
        return <ellipse key={'m' + k} cx={cx + (hash(k + i) - 0.5) * rx} cy={cy + (hash(k + i + 3) - 0.5) * ry * 0.6 - age * ry * 0.5} rx={rx * (0.5 + age)} ry={ry * (0.35 + 0.6 * age)}
          fill="#e9fbff" opacity={(1 - age) * (0.22 + 0.2 * held)} style={{filter: 'blur(14px)'}} />; });
      return <g key={i}>
        {blade(ang - 16, 0.18, 'g2')}{blade(ang - 8, 0.35, 'g1')}{blade(ang, 1, 'b')}
        <ellipse cx={cx} cy={cy} rx={rx * 0.62} ry={ry * 0.62} fill="none" stroke="#ffffff" strokeWidth={5} strokeDasharray="40 70" opacity={0.25 + 0.35 * boost}
          transform={`rotate(${-ang * 0.5},${cx},${cy})`} />
        <ellipse cx={cx} cy={cy} rx={rx * 1.01} ry={ry * 1.01} fill="none" stroke="#f2fdff" strokeWidth={14 + 8 * held} strokeDasharray="18 10 6 14" opacity={0.55 + 0.3 * held} />
        {mist}{lines}{flakes}
      </g>;
    })}
  </svg>;
}
