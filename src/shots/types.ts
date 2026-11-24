export type P = [number, number];
export type Pose = {hip: P; lean: number; head: string; headRot: number;
  hands: {near: P; far: P; nearPart: string; farPart: string}; feet: {near: P; far: P}; squash: number; flip: boolean};
export type Placed = {who: string; pose: Pose; scale: number};
/** A shot's choreography: song time t, frame, the shot's start/end → puppets to draw (still space). */
export type Choreo = (t: number, frame: number, shot: {start: number; end: number}) => Placed[];
