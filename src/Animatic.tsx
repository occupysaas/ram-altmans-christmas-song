import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import shotsJson from './shots.json';
import {loadFonts} from './fonts';
import {Snow} from './Snow';
import {snowDensity} from './fx/snowRule';
import {Ident} from './fx/Ident';
import {Title} from './fx/Title';
import {PROG_H, PROG_W, Still, type Shot} from './Still';

export const FPS = 24;
const shots = shotsJson as Shot[];
import {TV_OFF} from './fx/fxMath';
import impact from './timing/impact.json';

/** Old-TV switch-off: squash to a bright horizontal line, then to a dot that fades. */
function tvOff(t: number): {sx: number; sy: number; glow: number; dot: number} {
  const u = t - TV_OFF;
  if (u < 0) return {sx: 1, sy: 1, glow: 0, dot: 0};
  if (u < 0.2) return {sx: 1, sy: Math.max(0.004, 1 - u / 0.2), glow: u / 0.2, dot: 0};
  if (u < 0.45) return {sx: Math.max(0.004, 1 - (u - 0.2) / 0.25), sy: 0.004, glow: 1, dot: 0};
  return {sx: 0, sy: 0, glow: 0, dot: Math.max(0, 1 - (u - 0.45) / 0.6)};
}

export function Animatic() {
  loadFonts();
  const frame = useCurrentFrame(), t = frame / FPS;
  const shot = shots.find(s => t >= s.start && t < s.end) ?? shots[shots.length - 1];
  const off = tvOff(t);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <Audio src={staticFile('song.wav')} />
      <AbsoluteFill style={{background: '#0b0d1a', transform: `scale(${off.sx}, ${off.sy})`,
        filter: `brightness(${1 + off.glow * 4})`}}>
      {(() => {
        // CRT vertical-hold roll for 0.35 s at the start of shots tagged vroll; micro-shake + flash on the "stash" freeze
        const vr = (shot as any).fx?.includes('vroll') ? Math.max(0, 1 - (t - shot.start) / 0.35) : 0;
        const st = t - impact.stash, shake = st >= 0 && st < 0.15 ? Math.sin(st * 160) * 6 : 0;
        return <div style={{position: 'absolute', inset: 0, transform: `translate(${shake}px, ${vr > 0 ? (1 - (1 - vr) ** 2) * PROG_H * 0.6 : 0}px)`}}>
          <Still shot={shot} t={t} frame={frame} />
          {vr > 0 && <div style={{position: 'absolute', left: 0, right: 0, top: -40, height: 40, background: '#000'}} />}
          {st >= 0 && st < 2 / 24 && <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: 0.85}} />}
        </div>;
      })()}
      {snowDensity(shot as {indoor?: boolean; towerStage?: number | null}) > 0 && <Snow frame={frame} w={PROG_W} h={PROG_H} density={snowDensity(shot as {indoor?: boolean; towerStage?: number | null})} />}
      <Title t={t} w={PROG_W} />
      <Ident t={t} frame={frame} w={PROG_W} h={PROG_H} />
      </AbsoluteFill>
      {off.dot > 0 && <div style={{position: 'absolute', left: PROG_W / 2 - 6, top: PROG_H / 2 - 6, width: 12, height: 12,
        borderRadius: '50%', background: '#fff', opacity: off.dot, boxShadow: `0 0 ${24 * off.dot}px 8px rgba(255,255,255,${off.dot})`}} />}
    </AbsoluteFill>
  );
}
