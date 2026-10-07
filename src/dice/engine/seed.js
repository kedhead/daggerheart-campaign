// Seeds and timing for the dice engine. Kept apart from simulate.js so code
// that only needs these (diceSpec.js, renderer.js) doesn't pull in the
// physics library.

export const STEP = 1 / 60;
export const FRAME_STRIDE = 7; // x, y, z, qx, qy, qz, qw per die per frame

/** Small, fast, seedable PRNG (mulberry32): returns floats in [0, 1). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable 32-bit seed from a string (FNV-1a), for rolls saved without one. */
export function seedFrom(text) {
  let h = 0x811c9dc5;
  const s = String(text ?? '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

