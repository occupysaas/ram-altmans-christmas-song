/** Shot 57: the big door shakes on each knock (±6 px, decaying over ~0.25 s). */
import impact from '../timing/impact.json' with {type: 'json'};
export function doorShake(t: number): number {
  let k = -1; for (const x of impact.knocks) if (x <= t) k = x;
  if (k < 0) return 0;
  const u = t - k; return 6 * Math.exp(-u / 0.08) * Math.sin(u * 2 * Math.PI * 14 + Math.PI / 2);
}
