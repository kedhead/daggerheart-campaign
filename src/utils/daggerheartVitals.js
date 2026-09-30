// Reading a Daggerheart character's vital tracks — HP and Stress — the same way
// everywhere.
//
// The tracks do NOT share a meaning, which is the whole reason this module
// exists:
//
//   hpSlots     true = Hit Point REMAINING. A new character is created all-true
//               (CharacterCreationWizard), and a missing array means full health.
//   stressSlots true = Stress MARKED. A new character is all-false.
//
// The full sheet, RestModal and the PDF export all agree on that. The Player
// Portal's Death Move check read hpSlots as damage marked instead, so it offered
// the Death Move to a character at full health and hid it from one at zero. And
// the GM Screen's party panel read `currentHp`, a field no Daggerheart character
// has, so it showed "—" for everyone. Both now go through here.
//
// Pure: no React, no Firebase, so it can be unit tested.

export const DEFAULT_HP_SLOTS = 6;
export const DEFAULT_STRESS_SLOTS = 6;

/** The HP track as the character stores it, defaulting to full health. */
export function hpSlotsOf(character) {
  const slots = character?.hpSlots;
  if (Array.isArray(slots) && slots.length > 0) return slots;
  return Array(DEFAULT_HP_SLOTS).fill(true);
}

/** The Stress track, defaulting to none marked. */
export function stressSlotsOf(character) {
  const slots = character?.stressSlots;
  if (Array.isArray(slots) && slots.length > 0) return slots;
  return Array(DEFAULT_STRESS_SLOTS).fill(false);
}

export function hpRemaining(character) {
  return hpSlotsOf(character).filter(Boolean).length;
}

export function hpMax(character) {
  return hpSlotsOf(character).length;
}

export function stressMarked(character) {
  return stressSlotsOf(character).filter(Boolean).length;
}

export function stressMax(character) {
  return stressSlotsOf(character).length;
}

/**
 * A character is at death's door when they have no Hit Points left — i.e. every
 * HP slot has been marked. Not when every slot is `true`: that's full health.
 */
export function isAtDeathsDoor(character) {
  return hpMax(character) > 0 && hpRemaining(character) === 0;
}

/**
 * HP and Stress for an at-a-glance party view.
 *
 * Daggerheart characters carry slot arrays. Other systems (and some very old
 * records) carry plain numbers instead, so those are honoured as a fallback
 * rather than being overwritten with made-up slot counts.
 */
export function partyVitals(character) {
  const hasSlots = Array.isArray(character?.hpSlots) || Array.isArray(character?.stressSlots);
  if (hasSlots) {
    return {
      hp: hpRemaining(character),
      maxHp: hpMax(character),
      stress: stressMarked(character),
      maxStress: stressMax(character),
    };
  }
  return {
    hp: character?.currentHp ?? character?.maxHp ?? null,
    maxHp: character?.maxHp ?? null,
    stress: character?.currentStress ?? 0,
    maxStress: character?.maxStress ?? DEFAULT_STRESS_SLOTS,
  };
}

/**
 * The modifier on a weapon ATTACK roll: the weapon's trait, and nothing else.
 *
 * Proficiency is not an attack bonus. It is the number of damage dice you roll
 * (rulebook: "record your damage dice with the Proficiency value already written
 * in (like '1d6+3' instead of 'd6+3')", and "A damage roll is composed of two
 * parts: your Proficiency and damage dice"). The Player Portal was adding it to
 * the attack roll, which inflated every attack made from a phone by 1 at tier 1
 * and up to 4 or more at tier 4 — enough to change whether hits land. The full
 * character sheet always had it right.
 */
export function weaponAttackModifier(traits, weapon) {
  const key = String(weapon?.systemData?.trait || 'agility').toLowerCase();
  return Number(traits?.[key]) || 0;
}
