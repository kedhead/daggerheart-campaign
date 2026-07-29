// Hope track maths, in one place.
//
// A scar permanently crosses out a Hope slot. The Hope track itself is always
// CANONICAL_HOPE_SLOTS long — scars are never removed from the stored array,
// they are subtracted at read time. Keeping it derived is what makes removing
// a scar possible: decrement `scars` and the slot comes back, no migration.
//
// This module exists because the same subtraction used to be copy-pasted in
// six components, and the copies disagreed. Two bugs came out of that: the
// player portal persisted the scar-reduced array on every Hope tap, shrinking
// the real track a slot at a time, and the DM sheet counted scarred slots in
// the numerator but not the denominator ("6/5").

export const CANONICAL_HOPE_SLOTS = 6;

/** Scars a character carries, tolerant of the field being absent. */
export function scarCount(character) {
  const n = Number(character?.scars);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/**
 * The stored Hope track, repaired to canonical length.
 *
 * Characters damaged by the old portal bug have a short array (5, 4, …). Once
 * they are read through here their track is whole again, and the next write
 * persists the repair. Extra slots beyond canonical length are preserved in
 * case a future feature grants them.
 */
export function normalizeHopeSlots(hopeSlots, length = CANONICAL_HOPE_SLOTS) {
  const arr = Array.isArray(hopeSlots) ? hopeSlots : [];
  if (arr.length >= length) return arr.map(Boolean);
  return [...arr.map(Boolean), ...Array(length - arr.length).fill(false)];
}

/** How many Hope slots the character can actually use — scars crossed out. */
export function usableHopeMax(character, hopeSlots) {
  const slots = normalizeHopeSlots(hopeSlots ?? character?.hopeSlots);
  return Math.max(0, slots.length - scarCount(character));
}

/**
 * Hope currently held, ignoring anything sitting in a scarred slot.
 * Scarred slots are the TRAILING ones, matching how the sheet renders them.
 */
export function usableHopeFilled(character, hopeSlots) {
  const slots = normalizeHopeSlots(hopeSlots ?? character?.hopeSlots);
  return slots.slice(0, usableHopeMax(character, slots)).filter(Boolean).length;
}

/** True if slot `index` is crossed out by a scar. */
export function isScarredSlot(index, character, hopeSlots) {
  return index >= usableHopeMax(character, hopeSlots);
}
