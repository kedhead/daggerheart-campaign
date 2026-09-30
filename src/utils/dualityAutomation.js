// What a Duality roll does to Hope, Fear and Stress — and nothing else.
//
// Before this, the dice worked out `outcome` and `isDoubles` and then nothing
// acted on them. Every roll "with Hope" meant the player tapping a Hope pip by
// hand; every roll "with Fear" meant the DM switching to the GM Screen to add a
// Fear. This module turns a roll into those changes. Pure — no React, no
// Firebase — so the rules can be tested as a truth table.
//
// The rules, from the Daggerheart rulebook:
//   · Action roll with Hope  → the player gains a Hope, to a maximum of 6.
//   · Action roll with Fear  → the GM gains a Fear, to a maximum of 12.
//     Both apply whether the roll succeeds or fails.
//   · Doubles (critical)     → gain a Hope AND clear a Stress; counts as Hope.
//   · Reaction rolls generate neither, and a critical reaction grants nothing.
//
// Only rolls explicitly tagged `kind: 'action'` count. That is deliberate:
// reaction rolls must not generate anything, the Death Move's "Risk It All" has
// its own resolution, and anything not yet classified is safer left manual than
// wrongly automated.

import { normalizeHopeSlots, usableHopeMax } from './daggerheartHope';

export const FEAR_MAX = 12;
// Roll ids already turned into Fear, kept so a roll seen by two DM devices is
// applied once. Fifty covers far more than any realistic burst of rolls.
export const FEAR_LEDGER_SIZE = 50;

const NO_EFFECT = Object.freeze({ hope: 0, fear: 0, clearStress: 0, crit: false });

/** Whether this campaign automates Hope and Fear. On unless the DM turned it off. */
export function isAutoHopeFearOn(campaign) {
  return campaign?.autoHopeFear !== false;
}

/**
 * The Hope / Fear / Stress consequences of one roll.
 * @param {object} roll - a canonical roll document (system, kind, outcome, flags)
 */
export function dualityEffects(roll) {
  if (!roll || roll.system !== 'daggerheart' || roll.kind !== 'action') return NO_EFFECT;
  if (roll.flags?.isDoubles) return { hope: 1, fear: 0, clearStress: 1, crit: true };
  if (roll.outcome === 'hope') return { hope: 1, fear: 0, clearStress: 0, crit: false };
  if (roll.outcome === 'fear') return { hope: 0, fear: 1, clearStress: 0, crit: false };
  return NO_EFFECT;
}

/**
 * Apply a roll's Hope and Stress effects to a character.
 *
 * Hope fills the first empty slot that isn't crossed out by a scar, so a
 * scarred character's cap is respected and any existing pattern of slots is
 * preserved. Stress clears the LAST marked slot, keeping the track packed from
 * the left the way both sheets draw it.
 *
 * @returns {{ updates: object|null, gainedHope: boolean, clearedStress: boolean }}
 *          `updates` is null when nothing changed (e.g. Hope already full).
 */
export function applyHopeStressGain(character, effects) {
  const result = { updates: null, gainedHope: false, clearedStress: false };
  if (!character || !effects) return result;
  const updates = {};

  if (effects.hope > 0) {
    const slots = normalizeHopeSlots(character.hopeSlots);
    const usable = usableHopeMax(character, slots);
    const next = [...slots];
    let gained = 0;
    for (let i = 0; i < usable && gained < effects.hope; i += 1) {
      if (!next[i]) { next[i] = true; gained += 1; }
    }
    if (gained > 0) {
      updates.hopeSlots = next;
      result.gainedHope = true;
    }
  }

  if (effects.clearStress > 0 && Array.isArray(character.stressSlots)) {
    const next = [...character.stressSlots];
    let cleared = 0;
    for (let i = next.length - 1; i >= 0 && cleared < effects.clearStress; i -= 1) {
      if (next[i]) { next[i] = false; cleared += 1; }
    }
    if (cleared > 0) {
      updates.stressSlots = next;
      result.clearedStress = true;
    }
  }

  if (Object.keys(updates).length > 0) result.updates = updates;
  return result;
}

/**
 * The Fear pool after a roll with Fear, or null if this roll was already
 * counted.
 *
 * The DM's client applies Fear (only the DM may write the pool), and a DM with
 * a laptop and a tablet open sees every roll twice. The ledger of applied roll
 * ids lives in the shared document and is checked inside a transaction, so the
 * second device finds the id already there and does nothing.
 */
export function nextFearState(state, rollId, { max = FEAR_MAX, keep = FEAR_LEDGER_SIZE } = {}) {
  if (!rollId) return null;
  const applied = Array.isArray(state?.fearAppliedRollIds) ? state.fearAppliedRollIds : [];
  if (applied.includes(rollId)) return null;
  const current = Number(state?.fearCount) || 0;
  return {
    fearCount: Math.min(max, current + 1),
    fearAppliedRollIds: [...applied, rollId].slice(-keep),
  };
}

/** Clamp a manually set Fear value into the legal range. */
export function clampFear(n, max = FEAR_MAX) {
  const v = Math.round(Number(n) || 0);
  return Math.max(0, Math.min(max, v));
}

/**
 * The fixed Fear cost printed on an adversary or environment feature, or 0.
 *
 * Matches only an explicit quantity — "Spend a Fear", "spend 2 Fear",
 * "spending a Fear" — 238 features in the core adversary catalog. Two phrasings
 * are deliberately NOT treated as a cost:
 *   · "Spend Fear as usual to spotlight them" is a rules reminder repeated on
 *     horde and minion entries, not the feature's own activation.
 *   · "spend a number of Fear equal to…" is variable, so no single button
 *     could be right.
 */
const FEAR_WORDS = { a: 1, an: 1, one: 1, two: 2, three: 3 };
export function fearCost(text) {
  if (!text) return 0;
  const m = String(text).match(/\bspend(?:ing)?\s+(a|an|one|two|three|\d+)\s+fear\b/i);
  if (!m) return 0;
  const q = m[1].toLowerCase();
  return FEAR_WORDS[q] ?? (parseInt(q, 10) || 0);
}
