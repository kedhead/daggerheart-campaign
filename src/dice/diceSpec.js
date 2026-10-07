// Pure helpers for the 3D tray. Kept out of DiceTray.jsx so they can be
// tested without pulling in three.js or Firebase.

import { seedFrom } from './engine/seed.js';

// Ceiling on rolls tumbling at once. Past this extra rolls land as toasts
// instead; the table would be too crowded to read anyway.
export const MAX_CONCURRENT_ROLLS = 6;

/**
 * The dice to throw for a canonical roll document: one entry per die, in the
 * document's order, with the value it must land on and its colour (Hope,
 * Fear, advantage, or the roller's colour). The engine makes each die land on
 * exactly this value, so the faces always agree with the banner.
 */
export function throwSpec(roll) {
  return (roll?.dice || [])
    .filter(d => Number.isInteger(d?.sides) && Number.isInteger(d?.value))
    .map(d => ({ sides: d.sides, value: d.value, color: d.color || '#6366f1' }));
}

/**
 * The seed for a roll's throw. New rolls carry one (service.js); older ones
 * fall back to their document id, which is just as stable.
 */
export function throwSeed(roll) {
  const s = Number(roll?.animSeed);
  return Number.isInteger(s) && s >= 0 ? s >>> 0 : seedFrom(roll?.id);
}
