/** Vector maths, rubber-hose curves, springs and timing helpers for the puppets (pure, testable). */
import audio from '../timing/audio.json' with {type: 'json'};

export type P = [number, number];
export const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: P, k: number): P => [a[0] * k, a[1] * k];
export const len = (a: P) => Math.hypot(a[0], a[1]);
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const clamp01 = (u: number) => Math.min(1, Math.max(0, u));
export const rotAbout = (q: P, o: P, deg: number): P => {
  const a = deg * Math.PI / 180, d = sub(q, o);
  return add(o, [d[0] * Math.cos(a) - d[1] * Math.sin(a), d[0] * Math.sin(a) + d[1] * Math.cos(a)]);
};
export const easeInOut = (u: number) => { u = clamp01(u); return u * u * (3 - 2 * u); };
export const easeOutBack = (u: number, s = 1.7) => { u = clamp01(u) - 1; return 1 + (s + 1) * u * u * u + s * u * u; };

function quadLen(a: P, c: P, b: P) {
  let L = 0, prev = a;
  for (let i = 1; i <= 24; i++) {
    const u = i / 24, p: P = [(1 - u) ** 2 * a[0] + 2 * u * (1 - u) * c[0] + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * u * (1 - u) * c[1] + u * u * b[1]];
    L += len(sub(p, prev)); prev = p;
  }
  return L;
}

/** Control point of a rubber-hose limb from a to b whose arc length is ~L (no elbow); it bows toward `side`. */
export function hoseControl(a: P, b: P, L: number, side: 1 | -1): P {
  const d = sub(b, a), dl = Math.max(1e-6, len(d)), n: P = [-d[1] / dl * side, d[0] / dl * side], mid = mul(add(a, b), 0.5);
  if (dl >= L) return mid;
  let lo = 0, hi = L;
  for (let i = 0; i < 22; i++) { const h = (lo + hi) / 2; if (quadLen(a, add(mid, mul(n, h)), b) < L) lo = h; else hi = h; }
  return add(mid, mul(n, (lo + hi) / 2));
}
/** Tangent angle (degrees) at the b end of the hose, for orienting a hand or foot. */
export function hoseEndAngle(a: P, b: P, L: number, side: 1 | -1) {
  const c = hoseControl(a, b, L, side), t = sub(b, c);
  return Math.atan2(t[1], t[0]) * 180 / Math.PI;
}

/** Poses change on twos: frames 2k and 2k+1 share a pose. */
export const onTwos = (frame: number) => frame - (frame % 2);

/** Damped spring used for follow-through after a stop; 0 before `since` reaches lag. */
export function followThrough(since: number, amp: number, w: number, k: number, lag = 0) {
  const u = since - lag;
  return u < 0 ? 0 : amp * Math.sin(w * u) * Math.exp(-k * u);
}

/** Whole-body squash on kicks: 1 at rest, ~0.91 right after a kick; nearest kick only (no stacking). */
export function squashAt(t: number, kicks: number[][] = audio.kicks) {
  let lo = 0, hi = kicks.length - 1, k = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (kicks[m][0] <= t) { k = m; lo = m + 1; } else hi = m - 1; }
  return k < 0 ? 1 : 1 - 0.09 * Math.exp(-(t - kicks[k][0]) / 0.08);
}
