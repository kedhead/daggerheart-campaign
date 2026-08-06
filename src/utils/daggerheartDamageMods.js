/**
 * Domain-card abilities that change HOW damage dice are rolled, as opposed to
 * the passive stat effects in daggerheartAbilityEffects.js.
 *
 * Only cards in the LOADOUT are active — a vaulted card does nothing until
 * it's recalled, so callers must pass loadout cards, not the whole collection.
 */

export const DAMAGE_DICE_ABILITIES = {
  // Blade L1 — "When you roll your damage dice, you can reroll any 1s or 2s."
  'Not Good Enough': {
    rerollBelow: 2,
    blurb: 'Rerolls any 1s and 2s on damage dice',
  },
};

/**
 * Fold a character's loadout down to the dice options rollDamage() takes.
 * Accepts card objects or bare names. Returns { rerollBelow, sources }; a
 * rerollBelow of 0 means "no ability applies", which rollGeneric ignores.
 */
export function getDamageDiceMods(loadoutCards = []) {
  let rerollBelow = 0;
  const sources = [];
  for (const card of loadoutCards) {
    const name = typeof card === 'string' ? card : card?.name;
    const ability = DAMAGE_DICE_ABILITIES[name];
    if (!ability) continue;
    // If two abilities ever overlap, the more generous threshold wins.
    if (ability.rerollBelow > rerollBelow) rerollBelow = ability.rerollBelow;
    sources.push(name);
  }
  return { rerollBelow, sources };
}

/**
 * Whether a card's free-form text describes a DAMAGE roll. Card dice buttons
 * are parsed out of description text, and plenty of those dice aren't damage —
 * Forager rolls a d6 on a foraging table. Rerolling those would be wrong, so
 * the reroll only rides along when the text actually says damage.
 */
export function isDamageDiceText(text) {
  return /\bdamage\b/i.test(String(text || ''));
}

/**
 * Human-readable note for a set of active mods, e.g. for a button tooltip.
 */
export function describeDamageDiceMods(mods) {
  if (!mods?.sources?.length) return '';
  return mods.sources
    .map(name => `${name}: ${DAMAGE_DICE_ABILITIES[name]?.blurb || ''}`.trim())
    .join(' · ');
}
