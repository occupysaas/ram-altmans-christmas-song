import type {Choreo} from './types.ts';
import {shot13} from './13.ts';
import {shot13b} from './13b.ts';
import {SLEIGH_CHOREO} from './sleigh.ts';
import {shot08, shot21, shot22, shot43} from './ram-34-shots.ts';
import {shot10, shot24, shot25, shot26, shot27, shot39, shot63} from './ram-side-shots.ts';

/** Tier-A shots that have choreography; others still show their painted still. */
export const CHOREO: Record<string, Choreo> = {
  ...SLEIGH_CHOREO,
  '08': shot08, '21': shot21, '22': shot22, '43': shot43,
  '10': shot10, '13': shot13, '13b': shot13b, '24': shot24, '25': shot25, '26': shot26, '27': shot27, '39': shot39, '63': shot63,
};
