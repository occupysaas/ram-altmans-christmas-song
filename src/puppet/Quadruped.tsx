/** Reindeer with four rubber-hose legs and a gallop cycle, and the whole sleigh team. Drawn facing right; the team
 *  group is mirrored when flying left. Far legs are darker and behind the body. */
import React from 'react';
import {staticFile} from 'remotion';
import {type P, add, rotAbout} from './geom';
import {Hose} from './Hose';
import {teamGeometry, DEER_SCALE} from './team';
import deer from '../../public/puppets/reindeer/parts.json';
import type {PathState} from '../shots/sleigh';

type Part = {size: [number, number]; [k: string]: any};
const D = deer as Record<string, Part>;
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

/** The whole team at a path state: two reindeer ahead (in +x), reins to their chest harnesses, sleigh and seated Ram behind. */
export function SleighTeam({state, scale, t, deerOn = true}: {state: PathState; scale: number; t: number; deerOn?: boolean}) {
  const s = scale, g = teamGeometry(state, scale, t), slName = state.sag ? 'sleigh-loaded' : 'sleigh';
  const ramName = g.panic ? 'ram-seated-panic' : 'ram-seated';
  const head = state.crash ? 'head-panic' : state.sag ? 'head-strain' : 'head';
  return (
    <g transform={`translate(${state.pos[0]},${state.pos[1]}) scale(${state.flip ? -1 : 1},1)`}>
      {deerOn && g.deerAt.map((p, i) => <g key={'d' + i} transform={`translate(${p[0]},${p[1]}) rotate(${g.deerRot})`}><Deer phase={(g.phase + i * 0.17) % 1} s={s * DEER_SCALE} head={head} frozen={!!state.frozen} /></g>)}
      {deerOn && g.reins.map((r, i) => <path key={'r' + i} d={`M${r.a[0]},${r.a[1]} Q${r.c[0]},${r.c[1]} ${r.b[0]},${r.b[1]}`}
        stroke="#b3122c" strokeWidth={Math.max(3, 7 * s)} strokeLinecap="round" fill="none" />)}
      <g transform={`rotate(${state.angle})`}>
        <Img href={`sprites/sleigh/${ramName}.png`} part={g.ram} at={rotAbout(g.seat, [0, 0], -state.angle)} an={g.ram.seat} s={s * 0.9} rot={state.crash ? -20 * state.crash : -16 * (state.laugh ?? 0)} />
        <Img href={`sprites/sleigh/${slName}.png`} part={g.sl} at={[0, 0]} an={g.sl.hitch} s={s} />
      </g>
    </g>
  );
}
