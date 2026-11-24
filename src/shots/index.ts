import type {Choreo} from './types.ts';
import {shot07} from './07.ts';
import {shot33} from './register33.ts';
import {shot56} from './energy56.ts';
import {shot50, shot51, shot52, shot53, shot54} from './elves-town.ts';
import {shot17} from './wink17.ts';
import {shot09, shot64} from './faces.ts';
import {shot65} from './ending65.ts';
import {shot30} from './elves-topdown.ts';
import {shot35, shot36} from './townsfolk.ts';
import {shot18, shot19} from './sad-shots.ts';
import {shot13} from './13.ts';
import {shot13b} from './13b.ts';
import {SLEIGH_CHOREO} from './sleigh.ts';
import {shot58, shot59} from './ending.ts';
import {shot40, shot49, shot61} from './crowd.ts';
import {shot08, shot43} from './ram-34-shots.ts';
import {shot10, shot24, shot25, shot26, shot27, shot39, shot63} from './ram-side-shots.ts';

/** Tier-A shots that have choreography; others still show their painted still. */
export const CHOREO: Record<string, Choreo> = {
  ...SLEIGH_CHOREO, '58': shot58, '59': shot59, '40': shot40, '49': shot49, '61': shot61,
  '07': shot07, '33': shot33, '56': shot56, '50': shot50, '51': shot51, '52': shot52, '53': shot53, '54': shot54, '17': shot17, '09': shot09, '64': shot64, '65': shot65, '30': shot30, '35': shot35, '36': shot36, '18': shot18, '19': shot19, '08': shot08, '43': shot43,
  '10': shot10, '13': shot13, '13b': shot13b, '24': shot24, '25': shot25, '26': shot26, '27': shot27, '39': shot39, '63': shot63,
};
