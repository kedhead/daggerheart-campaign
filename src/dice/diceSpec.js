// Pure helpers for the 3D tray. Kept out of DiceTray.jsx so they can be
// tested without pulling in dice-box or Firebase.

// Ceiling on dice groups tumbling at once. Past this the physics cost on a
// shared display isn't worth it; extra rolls land as toasts instead.
export const MAX_CONCURRENT_ROLLS = 6;

/**
 * Translate a canonical roll document into dice-box notation.
 * Consecutive dice sharing sides+colour collapse into one group so the engine
 * renders them together with locked face values via `value: [...]` — physics
 * tumbles cosmetically but always lands on the canonical face.
 */
export function diceSpec(roll) {
  const groups = [];
  let cur = null;
  for (const d of roll?.dice || []) {
    if (cur && cur.sides === d.sides && cur.themeColor === d.color) {
      cur.qty += 1;
      cur.value.push(d.value);
    } else {
      cur = {
        qty: 1,
        sides: d.sides,
        theme: 'magic',
        themeColor: d.color,
        value: [d.value],
      };
      groups.push(cur);
    }
  }
  return groups;
}
