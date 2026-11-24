/** Generic rubber-hose biped. Painted limbless parts (torso, head, hands, feet) + code-drawn hose limbs.
 *  Layer order: far leg, far foot, far arm, far hand, torso, head, near leg, near foot, near arm, near hand.
 *  Pose positions are world (still-space) pixels; `flip` mirrors parts and limb bends for leftward facing. */
import React from 'react';
import {staticFile} from 'remotion';
import {type P, add, mul, sub, rotAbout, hoseEndAngle} from './geom';
import {Hose} from './Hose';
import {PARTS} from './parts';
import {hangHand, shoulders} from './body';

export type Pose = {hip: P; lean: number; head: string; headRot: number;
  hands: {near: P; far: P; nearPart: string; farPart: string}; feet: {near: P; far: P}; squash: number; flip: boolean};

function Sprite({who, name, at, anchorKey, rot = 0, scale, flip}: {who: string; name: string; at: P; anchorKey: string; rot?: number; scale: number; flip: boolean}) {
  const part = PARTS[who][name];
  if (!part) throw new Error(`puppet ${who} has no part ${name}`);
  const [w, h] = part.size, an = part[anchorKey] as P;
  return <g transform={`translate(${at[0]},${at[1]}) rotate(${rot}) scale(${flip ? -scale : scale},${scale}) translate(${-an[0]},${-an[1]})`}>
    <image href={staticFile(`puppets/${who}/${name}.png`)} width={w} height={h} />
  </g>;
}

export function Puppet({who, pose, scale, frame}: {who: string; pose: Pose; scale: number; frame: number}) {
  const sheet = PARTS[who], rig = sheet._rig, c = rig.colors, fx = pose.flip ? -1 : 1;
  const torso = sheet.torso, hipA = torso.hipNear as P;
  const T = (key: string): P => { const o = sub(torso[key] as P, hipA); return add(pose.hip, [o[0] * scale * fx, o[1] * scale]); };
  const lean = pose.lean * fx;
  const R = (q: P) => rotAbout(q, pose.hip, lean);
  const neck = R(T('neck')), shN = R(T('shoulderNear')), shF = R(T('shoulderFar')), hipF = T('hipFar');
  const armL = rig.armLen * scale, legL = rig.legLen * scale, armW = rig.armW * scale, legW = rig.legW * scale;
  const s = fx as 1 | -1;
  const floorY = Math.max(pose.feet.near[1], pose.feet.far[1]);
  const handRot = (sh: P, hd: P) => hoseEndAngle(sh, hd, armL, s) - (pose.flip ? 180 : 0);
  const boil = Math.floor(frame / 2) % 3;
  return (
    <g>
      <defs>
        <filter id={`boil-${who}-${boil}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={boil} />
          <feDisplacementMap in="SourceGraphic" scale="4" />
        </filter>
      </defs>
      <g filter={`url(#boil-${who}-${boil})`}
        transform={`translate(${pose.hip[0]},${floorY}) scale(${1 / pose.squash},${pose.squash}) translate(${-pose.hip[0]},${-floorY})`}>
        <Hose a={hipF} b={pose.feet.far} L={legL} side={(-s) as 1 | -1} width={legW} fill={c.legFar} ink={c.ink} />
        <Sprite who={who} name="foot-far" at={pose.feet.far} anchorKey="ankle" scale={scale} flip={pose.flip} />
        <Hose a={shF} b={pose.hands.far} L={armL} side={s} width={armW} fill={c.sleeveFar} ink={c.ink} />
        <Sprite who={who} name={pose.hands.farPart} at={pose.hands.far} anchorKey="wrist" rot={handRot(shF, pose.hands.far)} scale={scale} flip={pose.flip} />
        <g transform={`rotate(${lean},${pose.hip[0]},${pose.hip[1]})`}>
          <Sprite who={who} name="torso" at={pose.hip} anchorKey="hipNear" scale={scale} flip={pose.flip} />
        </g>
        <Sprite who={who} name={pose.head} at={neck} anchorKey="neck" rot={lean + pose.headRot * fx} scale={scale} flip={pose.flip} />
        <Hose a={pose.hip} b={pose.feet.near} L={legL} side={(-s) as 1 | -1} width={legW} fill={c.leg} ink={c.ink} />
        <Sprite who={who} name="foot-near" at={pose.feet.near} anchorKey="ankle" scale={scale} flip={pose.flip} />
        <Hose a={shN} b={pose.hands.near} L={armL} side={s} width={armW} fill={c.sleeve} ink={c.ink} />
        <Sprite who={who} name={pose.hands.nearPart} at={pose.hands.near} anchorKey="wrist" rot={handRot(shN, pose.hands.near)} scale={scale} flip={pose.flip} />
      </g>
    </g>
  );
}

export {hangHand, shoulders} from './body';
