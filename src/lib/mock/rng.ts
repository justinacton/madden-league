/** Deterministic PRNG (mulberry32) so mock data is stable across runs/builds. */
export function createRng(seed: number): () => number {
  let state = seed;
  return function rng() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pick<T>(rng: () => number, items: T[]): T {
  const index = Math.min(items.length - 1, Math.floor(rng() * items.length));
  return items[index] as T;
}

/** Generates a standard round-robin schedule (circle method). Returns n-1 rounds of n/2 pairs each. */
export function roundRobinRounds(teamIds: string[]): [string, string][][] {
  const n = teamIds.length;
  const fixed = teamIds[0] as string;
  let rotating = teamIds.slice(1);
  const rounds: [string, string][][] = [];

  for (let r = 0; r < n - 1; r += 1) {
    const arrangement = [fixed, ...rotating];
    const round: [string, string][] = [];
    for (let i = 0; i < n / 2; i += 1) {
      const a = arrangement[i] as string;
      const b = arrangement[n - 1 - i] as string;
      round.push([a, b]);
    }
    rounds.push(round);
    rotating = [rotating[rotating.length - 1] as string, ...rotating.slice(0, rotating.length - 1)];
  }

  return rounds;
}
