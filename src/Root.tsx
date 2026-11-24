import React from 'react';
import {Composition} from 'remotion';
import {Animatic, FPS} from './Animatic';
import audio from './timing/audio.json';
import {Spike13, SPIKE13} from './spike/Spike13';

export const Root = () => (
  <>
  <Composition id="Animatic" component={Animatic} fps={FPS} width={960} height={720}
    durationInFrames={Math.ceil(audio.duration * FPS)} />
  <Composition id="Spike13" component={Spike13} fps={FPS} width={960} height={720} durationInFrames={SPIKE13.frames} />
  </>
);
