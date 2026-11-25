/** Whip-pan transition (the cut into the 3:04 crash): the outgoing shot (fx whipOut) smears upward over its last
 *  0.12 s, the incoming shot (fx whipIn) rises in from below and settles over 0.18 s, with a vertical motion blur.
 *  dy is a fraction of the picture height; the picture is scaled by >= 1 + 2|dy| so its edges never show. */
const OUT = 0.12, IN = 0.18, MAX = 0.14, BLUR = 28;
const none = {dy: 0, blur: 0, scale: 1};
export function whipAt(shot: {start: number; end: number; fx?: string[]}, t: number) {
  const fx = shot.fx ?? [];
  if (fx.includes('whipOut') && t > shot.end - OUT) {
    const u = (t - (shot.end - OUT)) / OUT, k = u * u;            // accelerating away
    return {dy: -MAX * k, blur: BLUR * k, scale: 1 + 2 * MAX * k + 0.02};
  }
  if (fx.includes('whipIn') && t < shot.start + IN) {
    const u = Math.max(0, (t - shot.start) / IN), k = (1 - u) * (1 - u);   // decelerating into place
    return {dy: MAX * k, blur: BLUR * k, scale: 1 + 2 * MAX * k + 0.02 * k};
  }
  return none;
}
