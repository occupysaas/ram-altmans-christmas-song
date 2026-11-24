/** Reindeer with four rubber-hose legs and a gallop cycle, and the whole sleigh team. Drawn facing right; the team
 *  group is mirrored when flying left. Far legs are darker and behind the body. */
import React from 'react';
import {staticFile} from 'remotion';
import {type P, add} from './geom';
import {Hose} from './Hose';
import deer from '../../public/puppets/reindeer/parts.json';
import sleighJ from '../../public/sprites/sleigh/sleigh.json';
import type {PathState} from '../shots/sleigh';

type Part = {size: [number, number]; [k: string]: any};
const D = deer as Record<string, Part>, SL = sleighJ as Record<string, Part>;
const INK = '#17121c', LEG = '#7a4a2a', LEG_FAR = '#5c3820';

function Img({href, part, at, an, rot = 0, s}: {href: string; part: Part; at: P; an: P; rot?: number; s: number}) {
  return <g transform={`translate(${at[0]},${at[1]}) rotate(${rot}) scale(${s}) translate(${-an[0]},${-an[1]})`}>
    <image href={staticFile(href)} width={part.size[0]} height={part.size[1]} />
  </g>;
}

/** One reindeer at origin (body hip-line), gallop phase 0..1. Legs reach toward/away along x. */
export function Deer({phase, s, head, frozen}: {phase: number; s: number; head: string; frozen: boolean}) {
  const b = D.body, L = 230 * s, legW = 26 * s;
  const at = (k: string): P => [(b[k][0] - b.neck[0]) * s, (b[k][1] - b.neck[1]) * s];
  const front = at('hipFront'), back = at('hipBack');
  const leg = (hip: P, ph: number, dir: number): P => {               // gallop: an elliptical hoof path
    const a = 2 * Math.PI * (frozen ? 0.25 : ph);
    return add(hip, [dir * 120 * s * Math.cos(a), L * 0.9 - 60 * s * Math.max(0, Math.sin(a))]);
  };
  const pairs: [P, number, number, boolean][] = [[back, phase + 0.5, -1, true], [front, phase + 0.62, 1, true], [back, phase, -1, false], [front, phase + 0.12, 1, false]];
  return <g>
    {pairs.filter(p => p[3]).map(([hip, ph, dir], i) => { const h = leg(hip, ph, dir); return <g key={'f' + i}>
      <Hose a={hip} b={h} L={L} side={dir > 0 ? -1 : 1} width={legW} fill={LEG_FAR} ink={INK} />
      <Img href="puppets/reindeer/hoof-far.png" part={D['hoof-far']} at={h} an={D['hoof-far'].ankle} s={s} /></g>; })}
    <Img href="puppets/reindeer/body.png" part={b} at={[0, 0]} an={b.neck} s={s} />
    <Img href={`puppets/reindeer/${head}.png`} part={D[head]} at={[0, 0]} an={D[head].neck} s={s} rot={frozen ? 0 : 4 * Math.sin(2 * Math.PI * phase)} />
    {pairs.filter(p => !p[3]).map(([hip, ph, dir], i) => { const h = leg(hip, ph, dir); return <g key={'n' + i}>
      <Hose a={hip} b={h} L={L} side={dir > 0 ? -1 : 1} width={legW} fill={LEG} ink={INK} />
      <Img href="puppets/reindeer/hoof-near.png" part={D['hoof-near']} at={h} an={D['hoof-near'].ankle} s={s} /></g>; })}
  </g>;
}

/** The whole team at a path state: two reindeer ahead (in +x), reins, sleigh and seated Ram behind. */
export function SleighTeam({state, scale, t, deerOn = true}: {state: PathState; scale: number; t: number; deerOn?: boolean}) {
  const s = scale, sl = state.sag ? SL['sleigh-loaded'] : SL.sleigh, slName = state.sag ? 'sleigh-loaded' : 'sleigh';
  const panic = (state.crash ?? 0) > 0 || !!state.sag && Math.sin(t * 7) > 0.6;
  const ram = panic ? SL['ram-seated-panic'] : SL['ram-seated'], ramName = panic ? 'ram-seated-panic' : 'ram-seated';
  const phase = (t * 2.2) % 1, gap = 560 * s;
  const bob = state.frozen ? 0 : 14 * s * Math.sin(2 * Math.PI * phase * 2);
  const hitch: P = [0, 0];                                     // team origin = sleigh hitch
  const deerAt = [add(hitch, [gap * 1.15, -60 * s + bob]), add(hitch, [gap * 2.15, -80 * s - bob])];
  const seat = [ (sl.seat[0] - sl.hitch[0]) * s, (sl.seat[1] - sl.hitch[1]) * s ] as P;
  const hands = add(seat, [(ram.hands[0] - ram.seat[0]) * s * 0.9, (ram.hands[1] - ram.seat[1]) * s * 0.9]);
  const head = state.crash ? 'head-panic' : state.sag ? 'head-strain' : 'head';
  return (
    <g transform={`translate(${state.pos[0]},${state.pos[1]}) scale(${state.flip ? -1 : 1},1) rotate(${state.angle})`}>
      {deerOn && deerAt.map((p, i) => <path key={'r' + i} d={`M${hands[0]},${hands[1]} Q${(hands[0] + p[0]) / 2},${p[1] + 120 * s} ${p[0] + 40 * s},${p[1] - 30 * s}`}
        stroke="#b3122c" strokeWidth={6 * s} fill="none" />)}
      {deerOn && deerAt.map((p, i) => <g key={'d' + i} transform={`translate(${p[0]},${p[1]})`}><Deer phase={(phase + i * 0.17) % 1} s={s * 0.55} head={head} frozen={!!state.frozen} /></g>)}
      <Img href={`sprites/sleigh/${ramName}.png`} part={ram} at={seat} an={ram.seat} s={s * 0.9} rot={state.crash ? -20 * state.crash : 0} />
      <Img href={`sprites/sleigh/${slName}.png`} part={sl} at={hitch} an={sl.hitch} s={s} />
    </g>
  );
}
