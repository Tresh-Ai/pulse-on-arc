/**
 * Tiny seeded PRNG so mock data is stable between server render and hydration.
 * All time values are anchored to the top of the current hour for the same
 * reason: server and client must produce identical strings.
 */

export const NOW = Math.floor(Date.now() / 3_600_000) * 3_600_000;

export function createRng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

export type Rng = () => number;

export function pick<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)] as T;
}

export function pickMany<T>(items: readonly T[], count: number, rng: Rng): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < count && pool.length > 0) {
    const [item] = pool.splice(Math.floor(rng() * pool.length), 1);
    if (item !== undefined) out.push(item);
  }
  return out;
}

export function intBetween(min: number, max: number, rng: Rng): number {
  return Math.floor(min + rng() * (max - min + 1));
}

export function floatBetween(min: number, max: number, rng: Rng, digits = 2): number {
  return Number((min + rng() * (max - min)).toFixed(digits));
}

/** ISO timestamp `minutes` before the anchored now. */
export function agoMinutes(minutes: number): string {
  return new Date(NOW - minutes * 60_000).toISOString();
}

export function agoDays(days: number): string {
  return agoMinutes(days * 1440);
}

export function inDays(days: number): string {
  return new Date(NOW + days * 86_400_000).toISOString();
}

export function series(count: number, start: number, volatility: number, rng: Rng): number[] {
  const out: number[] = [];
  let value = start;
  for (let i = 0; i < count; i += 1) {
    value = Math.max(0.0001, value * (1 + (rng() - 0.48) * volatility));
    out.push(Number(value.toFixed(4)));
  }
  return out;
}
