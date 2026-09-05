/**
 * Deterministic identity art helpers so accounts look distinct and consistent
 * without shipping binary assets.
 */

const PALETTES = [
  ["4F46E5", "06B6D4"],
  ["7C3AED", "2563EB"],
  ["06B6D4", "22C55E"],
  ["F59E0B", "EF4444"],
  ["EC4899", "8B5CF6"],
  ["14B8A6", "4F46E5"],
  ["3B82F6", "06B6D4"],
  ["A855F7", "EC4899"],
];

export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function paletteFor(seed: string): [string, string] {
  const p = PALETTES[hashSeed(seed) % PALETTES.length] ?? ["4F46E5", "06B6D4"];
  return [p[0] ?? "4F46E5", p[1] ?? "06B6D4"];
}

export function avatarUrl(seed: string): string {
  const [a, b] = paletteFor(seed);
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundColor=${a}&shape1Color=${b}&shape2Color=ffffff&shape3Color=${a}&radius=50`;
}

export function bannerUrl(seed: string): string {
  const [a, b] = paletteFor(seed);
  const rot = hashSeed(seed) % 180;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="320"><defs><linearGradient id="g" gradientTransform="rotate(${rot} .5 .5)"><stop offset="0%" stop-color="#${a}"/><stop offset="100%" stop-color="#${b}"/></linearGradient><radialGradient id="r"><stop offset="0%" stop-color="#ffffff" stop-opacity=".35"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="320" fill="#0F172A"/><rect width="1200" height="320" fill="url(#g)" opacity=".7"/><circle cx="${
    200 + (hashSeed(seed) % 700)
  }" cy="120" r="260" fill="url(#r)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function mediaUrl(seed: string, label: string): string {
  const [a, b] = paletteFor(seed);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="620"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#${a}"/><stop offset="100%" stop-color="#${b}"/></linearGradient></defs><rect width="1000" height="620" fill="#111827"/><rect width="1000" height="620" fill="url(#g)" opacity=".55"/><g fill="none" stroke="#ffffff" stroke-opacity=".28" stroke-width="2">${Array.from(
    { length: 7 },
    (_, i) => `<line x1="0" y1="${80 * (i + 1)}" x2="1000" y2="${80 * (i + 1)}"/>`,
  ).join(
    "",
  )}</g><text x="50" y="560" fill="#ffffff" fill-opacity=".9" font-family="Inter,sans-serif" font-size="42" font-weight="700">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
