// What incoming damage does to a player character, by the Daggerheart rules.
//
// Players used to do this at the table by hand: compare the number to their
// thresholds, decide whether to burn an Armor Slot, then tap HP pips. The
// encounter tracker already did the adversary side (thresholdDamage.js); this
// is the PC side. Pure — no React, no Firebase — so the rules can be tested
// against the rulebook's own examples.
//
// From dh-rulebook.txt:
//   · Resistance halves damage BEFORE it's compared to thresholds.
//   · Damage of 0 or less marks nothing.
//   · Below Major is Minor → 1 HP; Major → 2 HP; Severe → 3 HP.
//   · Optional Massive rule: damage of at least double Severe → 4 HP.
//   · Marking one Armor Slot (at most one per attack) drops the severity one
//     step: Severe → Major → Minor → None.

import { hpSlotsOf } from './daggerheartVitals';

export const SEVERITIES = ['none', 'minor', 'major', 'severe', 'massive'];
const MARKS = { none: 0, minor: 1, major: 2, severe: 3, massive: 4 };

function severityFor(damage, { major, severe, massiveRule }) {
  if (damage <= 0) return 'none';
  if (massiveRule && severe > 0 && damage >= severe * 2) return 'massive';
  if (severe > 0 && damage >= severe) return 'severe';
  if (major > 0 && damage >= major) return 'major';
  return 'minor';
}

/**
 * @param {number} damage - the incoming damage, before resistance
 * @param {object} opts
 * @param {number} opts.major - Major threshold
 * @param {number} opts.severe - Severe threshold
 * @param {boolean} [opts.resistant] - halve the damage first (rounded down)
 * @param {boolean} [opts.massiveRule] - the table uses the optional Massive rule
 * @param {boolean} [opts.useArmor] - the player wants to mark an Armor Slot
 * @param {number} [opts.armorAvailable] - unmarked Armor Slots
 * @returns {{ taken: number, rawSeverity: string, severity: string, marks: number, armorUsed: boolean }}
 */
export function damageOutcome(damage, { major = 0, severe = 0, resistant = false, massiveRule = false, useArmor = false, armorAvailable = 0 } = {}) {
  const raw = Math.max(0, Math.floor(Number(damage) || 0));
  const taken = resistant ? Math.floor(raw / 2) : raw;
  const rawSeverity = severityFor(taken, { major: Number(major) || 0, severe: Number(severe) || 0, massiveRule });

  // An Armor Slot only helps if there's something to reduce.
  const armorUsed = !!useArmor && armorAvailable > 0 && rawSeverity !== 'none';
  const severity = armorUsed ? SEVERITIES[SEVERITIES.indexOf(rawSeverity) - 1] : rawSeverity;

  return { taken, rawSeverity, severity, marks: MARKS[severity], armorUsed };
}

/**
 * The character updates for an outcome: HP marked and, if used, one Armor Slot.
 *
 * hpSlots holds HP REMAINING (true = still have it), so marking HP turns the
 * last remaining slots off — the same end the sheets clear from. armorSlots
 * holds slots MARKED, so using armor turns the first free slot on.
 *
 * @param {object} character
 * @param {{ marks: number, armorUsed: boolean }} outcome
 * @param {number} [armorTotal] - the armor track's real length (armorSlotCount)
 * @returns {{ updates: object|null, hpMarked: number, hpLeft: number }}
 */
export function applyDamage(character, outcome, armorTotal = 0) {
  const updates = {};
  const hp = [...hpSlotsOf(character)];
  let hpMarked = 0;
  for (let i = hp.length - 1; i >= 0 && hpMarked < (outcome?.marks || 0); i -= 1) {
    if (hp[i]) { hp[i] = false; hpMarked += 1; }
  }
  if (hpMarked > 0) updates.hpSlots = hp;

  if (outcome?.armorUsed) {
    const { stored, usable } = armorTrack(character, armorTotal);
    // Keep the stored array's full length: shortening it is the bug that once
    // destroyed marks past the Armor Score (see PortalCharacterSheet).
    const armor = Array.from({ length: Math.max(stored.length, usable) }, (_, i) => !!stored[i]);
    const free = armor.slice(0, usable).indexOf(false);
    if (free !== -1) {
      armor[free] = true;
      updates.armorSlots = armor;
    }
  }

  return {
    updates: Object.keys(updates).length > 0 ? updates : null,
    hpMarked,
    hpLeft: hp.filter(Boolean).length,
  };
}

// The slots a player can actually mark are the first `armorTotal` (the count
// the sheets display, from armorSlotCount); with no total, the stored length.
function armorTrack(character, armorTotal) {
  const stored = Array.isArray(character?.armorSlots) ? character.armorSlots : [];
  const total = Number(armorTotal) || 0;
  return { stored, usable: total > 0 ? total : stored.length };
}

/** Unmarked Armor Slots the player can still use. */
export function armorSlotsFree(character, armorTotal = 0) {
  const { stored, usable } = armorTrack(character, armorTotal);
  let free = 0;
  for (let i = 0; i < usable; i += 1) if (!stored[i]) free += 1;
  return free;
}
