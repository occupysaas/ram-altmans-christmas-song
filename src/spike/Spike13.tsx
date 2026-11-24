/** THROWAWAY SPIKE: shot 13 with the rubber-hose Ram over the clean plate. */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import shotsJson from '../shots.json';
import {loadFonts} from '../fonts';
import {Snow} from '../Snow';
import {PROG_H, PROG_W, Still, type Shot} from '../Still';
import {RubberRam} from './Rubber';

const shot = (shotsJson as Shot[])[12];
export const SPIKE13 = {start: shot.start, frames: Math.round((shot.end - shot.start) * 24)};

export function Spike13() {
  loadFonts();
  const f = useCurrentFrame(), frame = Math.round(shot.start * 24) + f, t = frame / 24;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <Audio src={staticFile('song.wav')} startFrom={Math.round(shot.start * 24)} />
      <Still shot={shot} t={t} frame={frame} image="plates/13.png">
        <RubberRam t={t} frame={frame} shotStart={shot.start} />
      </Still>
      <Snow frame={frame} w={PROG_W} h={PROG_H} density={0.25} />
    </AbsoluteFill>
  );
}
