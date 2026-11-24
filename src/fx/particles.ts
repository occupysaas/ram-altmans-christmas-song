/** Deterministic particle helpers: particle i's state depends only on i and t. */
export const hash = (n: number) => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

/** Recycled particles: each lives `life` s, phase-offset by its hash. Returns age 0..1 and a per-cycle seed. */
export function cycle(i: number, t: number, life: number) {
  const off = hash(i) * life, n = Math.floor((t + off) / life);
  return {age: ((t + off) % life) / life, seed: i * 7919 + n * 104729};
}
