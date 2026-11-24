export type P = [number, number];
export type Pose = {hip: P; lean: number; head: string; headRot: number;
  hands: {near: P; far: P; nearPart: string; farPart: string}; feet: {near: P; far: P}; squash: number; flip: boolean};
export type Placed = {who: string; pose: Pose; scale: number};
/** A free sprite (prop in a hand, falling hat, coins…), drawn in array order with the puppets. */
/** `sprite` is a path under public/ without .png, e.g. 'sprites/props/gpu'. */
export type SpriteItem = {sprite: string; at: P; rot?: number; scale: number; opacity?: number; anchor?: P; flip?: boolean; size?: P; sx?: number; sy?: number};
/** A free rubber-hose limb (e.g. arms reaching in from off-screen). */
export type HoseItem = {hose: {a: P; b: P; L: number; side: 1 | -1; width: number; fill: string; ink: string}};
/** A soft dark wash over a region (e.g. a town's lights dimming). */
export type ShadeItem = {shade: {x: number; y: number; w: number; h: number; opacity: number; color?: string; round?: boolean}};
import type {PathState} from './sleigh.ts';
export type TeamItem = {sleighTeam: {state: PathState; scale: number; t: number; deer: boolean}};
/** Redraw the shot's plate below `y` (still px) in front of what came before — e.g. a counter or belt the puppets stand behind. */
export type FrontItem = {front: {y: number}};
/** A character layer cut from a still (public/sprites/layers/<key>.png, placed by layers.json), moved about `pivot`. */
export type LayerItem = {layer: string; dx?: number; dy?: number; rot?: number; sx?: number; sy?: number; pivot?: P; opacity?: number};
/** Small vector marks drawn in code: cursor, click ring, tear, music note, speed line, text, dot, snowflake. */
export type DrawKind = 'cursor' | 'ring' | 'drop' | 'note' | 'line' | 'text' | 'dot' | 'flake' | 'rect' | 'ellipse';
export type DrawItem = {draw: {kind: DrawKind; at: P; size: number; to?: P; w?: number; h?: number; pressed?: boolean; tile?: boolean; mouth?: boolean; rot?: number; color?: string; ink?: string; opacity?: number; text?: string; font?: string}};
export type Item = Placed | SpriteItem | HoseItem | ShadeItem | TeamItem | FrontItem | LayerItem | DrawItem;
export const isLayer = (i: Item): i is LayerItem => (i as LayerItem).layer !== undefined;
export const isDraw = (i: Item): i is DrawItem => (i as DrawItem).draw !== undefined;
export const isFront = (i: Item): i is FrontItem => (i as FrontItem).front !== undefined;
export const isTeam = (i: Item): i is TeamItem => (i as TeamItem).sleighTeam !== undefined;
export const isShade = (i: Item): i is ShadeItem => (i as ShadeItem).shade !== undefined;
export const isHose = (i: Item): i is HoseItem => (i as HoseItem).hose !== undefined;
export const isSprite = (i: Item): i is SpriteItem => (i as SpriteItem).sprite !== undefined;
export const isPuppet = (i: Item): i is Placed => (i as Placed).who !== undefined;
/** A shot's choreography: song time t, frame, the shot's start/end → puppets to draw (still space). */
export type Choreo = (t: number, frame: number, shot: {start: number; end: number}) => Item[];
