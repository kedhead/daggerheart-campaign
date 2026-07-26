// Pure helpers for the 3D tray. Kept out of DiceTray.jsx so they can be
// tested without pulling in dice-box or Firebase.

// Ceiling on dice groups tumbling at once. Past this the physics cost on a
// shared display isn't worth it; extra rolls land as toasts instead.
export const MAX_CONCURRENT_ROLLS = 6;

// Numbered faces. Only honest on the screen that rolls the real dice.
export const THEME_NUMBERED = 'default';
// Rune faces, carrying no number — used where the dice are decorative and
// physically cannot agree with the canonical result.
export const THEME_RUNES = 'magic';

/**
 * Translate a canonical roll document into dice-box notation.
 * Consecutive dice sharing sides+colour collapse into one group so the engine
 * renders them together.
 *
 * Note there is deliberately no `value:` here. dice-box determines a die's
 * result by ray-casting the face that ends up pointing at the ceiling
 * (Dice.js getRollResult) — a value passed in is read only by the non-3D
 * fallback path and is silently ignored for rendered dice. Whatever these
 * land on is the outcome, which is why only the authority screen shows
 * numbered faces.
 */
export function diceSpec(roll, theme = THEME_RUNES) {
  const groups = [];
  let cur = null;
  for (const d of roll?.dice || []) {
    if (cur && cur.sides === d.sides && cur.themeColor === d.color) {
      cur.qty += 1;
    } else {
      cur = {
        qty: 1,
        sides: d.sides,
        theme,
        themeColor: d.color,
      };
      groups.push(cur);
    }
  }
  return groups;
}
