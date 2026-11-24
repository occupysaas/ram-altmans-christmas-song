/** The still-space camera for a shot at song time t: the eased from→to move, plus an optional timed push-in
 *  (`camera.push`: at time `t` the view eases over `dur` s to `{x, y, zoom, rot}` and holds). Pure; used by Still. */
type Cam = {x: number; y: number; zoom: number; rot: number};
export type CameraSpec = {from: Cam; to: Cam; push?: Cam & {t: number; dur: number}};

const sinIn = (u: number) => 1 - Math.cos((u * Math.PI) / 2);                        // Remotion Easing.sin
const inOutSin = (u: number) => (u < 0.5 ? sinIn(2 * u) / 2 : 1 - sinIn(2 * (1 - u)) / 2);   // Easing.inOut(Easing.sin)
const clamp01 = (u: number) => Math.min(1, Math.max(0, u));

/** cx, cy: view centre (still fractions); h: half the view size (still fraction); rot: degrees. */
export function camAt(shot: {start: number; end: number; camera: CameraSpec}, t: number) {
  const {from: a, to: b, push} = shot.camera, p = inOutSin(clamp01((t - shot.start) / (shot.end - shot.start)));
  let h = 0.5 / a.zoom + (0.5 / b.zoom - 0.5 / a.zoom) * p;
  let cx = a.x + (b.x - a.x) * p, cy = a.y + (b.y - a.y) * p, rot = a.rot + (b.rot - a.rot) * p;
  if (push && t >= push.t) {
    const u = inOutSin(clamp01((t - push.t) / push.dur));
    h += (0.5 / push.zoom - h) * u; cx += (push.x - cx) * u; cy += (push.y - cy) * u; rot += (push.rot - rot) * u;
  }
  return {cx, cy, h, rot};
}
