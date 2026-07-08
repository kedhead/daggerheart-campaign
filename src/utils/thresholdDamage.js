// Daggerheart damage-to-HP conversion for adversaries.
// An incoming attack marks HP by threshold, not by raw subtraction:
//   damage <  Major            → 1 HP
//   Major  <= damage < Severe   → 2 HP
//   damage >= Severe            → 3 HP
// Minions are defeated by any damage (they have no thresholds).
//
// NB: adversary thresholds are stored with legacy field names —
// `thresholds.minor` holds the MAJOR value, `thresholds.major` holds SEVERE.
export function marksForDamage(dmg, { major, severe, isMinion = false, minionHp = 1 } = {}) {
  const d = Number(dmg);
  if (!Number.isFinite(d) || d <= 0) return 0;
  if (isMinion) return Math.max(1, minionHp);
  if (severe && d >= severe) return 3;
  if (major && d >= major) return 2;
  return 1;
}
