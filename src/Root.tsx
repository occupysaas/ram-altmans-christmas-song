import React from 'react';
import {Composition} from 'remotion';
import {Animatic, FPS} from './Animatic';
import audio from './timing/audio.json';

export const Root = () => (
  <Composition id="Animatic" component={Animatic} fps={FPS} width={960} height={720}
    durationInFrames={Math.ceil(audio.duration * FPS)} />
);
