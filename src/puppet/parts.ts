/** Registry of puppet part sheets: public/puppets/<who>/parts.json (anchors in part pixels + rig metrics). */
import ramSide from '../../public/puppets/ram-side/parts.json' with {type: 'json'};
import ram34 from '../../public/puppets/ram-34/parts.json' with {type: 'json'};
import sam34 from '../../public/puppets/sam-34/parts.json' with {type: 'json'};
import girl from '../../public/puppets/girl/parts.json' with {type: 'json'};

export type Rig = {armLen: number; legLen: number; armW: number; legW: number; reach: number; hipHeight: number; lift: number;
  colors: {sleeve: string; sleeveFar: string; leg: string; legFar: string; ink: string}};
export type PartSheet = Record<string, any> & {_rig: Rig};
export const PARTS: Record<string, PartSheet> = {'ram-side': ramSide as PartSheet, 'ram-34': ram34 as PartSheet, 'sam-34': sam34 as PartSheet, girl: girl as PartSheet};
