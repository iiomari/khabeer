/**
 * Deterministic avatar identity: every person gets a stable gradient derived from
 * their id, drawn from a curated palette that harmonises with the brand navy/bronze
 * instead of random hues.
 */
const PALETTE = [
  ["oklch(0.52 0.09 255)", "oklch(0.33 0.07 265)"], // navy
  ["oklch(0.62 0.10 60)", "oklch(0.44 0.08 45)"], // bronze
  ["oklch(0.55 0.08 200)", "oklch(0.36 0.07 215)"], // steel blue
  ["oklch(0.56 0.08 160)", "oklch(0.37 0.07 170)"], // teal
  ["oklch(0.55 0.08 310)", "oklch(0.36 0.07 300)"], // plum
  ["oklch(0.58 0.09 95)", "oklch(0.40 0.07 80)"], // olive gold
  ["oklch(0.54 0.09 20)", "oklch(0.36 0.08 15)"], // clay
  ["oklch(0.50 0.07 230)", "oklch(0.32 0.06 245)"], // indigo
] as const;

export function avatarGradient(seed: string): string {
  let hash = 7;
  for (let index = 0; index < seed.length; index++) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  const [from, to] = PALETTE[hash % PALETTE.length];
  return `linear-gradient(140deg, ${from}, ${to})`;
}
