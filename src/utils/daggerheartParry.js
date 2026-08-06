/**
 * Helpers for the Parrying Dagger's "Parry" feature.
 *
 * SRD: "When you are attacked, roll this weapon's damage dice. If any of the
 * attacker's damage dice rolled the same value as your dice, the matching
 * results are discarded from the attacker's damage dice before the damage you
 * take is totaled."
 *
 * The matching itself lives in dice/systems.js (resolveParry) so it runs
 * inside the canonical roll and gets persisted with it. What's here is the
 * item-side plumbing: which weapon can parry, what it rolls, and which rolls
 * are worth offering as targets.
 */

import { hasFeatureName } from './itemFeatures';
import { getTierForLevel } from '../data/systems/daggerheart';

export const PARRY_FEATURE = 'parry';

export function isParryWeapon(item) {
  return !!item && item.type === 'weapon' && hasFeatureName(item.systemData?.features, PARRY_FEATURE);
}

/**
 * The dice a parry rolls: the weapon's damage DICE at the character's tier,
 * one per point of Proficiency. The weapon's flat damage modifier is
 * deliberately left out — a parry compares die faces, and a +2 that can't
 * appear on any die could never match anything.
 * Returns { dieType, quantity } or null if the weapon has no dice at this tier.
 */
export function getParryDice(weapon, level = 1, proficiency = 1) {
  const sd = weapon?.systemData;
  if (!sd) return null;
  const tier = getTierForLevel(level);
  const die = sd[`damageTier${tier}Dice`];
  if (!die) return null;
  const dieType = parseInt(String(die).replace(/^d/i, ''), 10);
  if (!dieType) return null;
  return { dieType, quantity: Math.max(1, parseInt(proficiency, 10) || 1) };
}

export function formatParryDice(dice) {
  return dice ? `${dice.quantity}d${dice.dieType}` : '';
}

/**
 * Rolls worth offering as a parry target: a damage-style roll that still
 * carries its individual dice. Duality rolls are attack rolls, not damage,
 * and a previous parry isn't something you parry again.
 */
export function isParryableRoll(roll) {
  return !!roll
    && roll.system === 'generic'
    && Array.isArray(roll.dice)
    && roll.dice.length > 0
    && !roll.parry;
}

/** Canonical roll document → the target shape resolveParry expects. */
export function parryTargetFromRoll(roll) {
  if (!roll) return null;
  return {
    rollId: roll.id || null,
    label: roll.label || `${roll.rollerName || 'Attacker'}'s damage`,
    dice: (roll.dice || []).map(d => ({ value: d.value, sides: d.sides })),
    modifier: roll.modifier || 0,
    total: roll.total,
  };
}

/**
 * Fallback for damage the GM rolled with real dice at the table: parse the
 * faces out of "6, 4, 3" (commas, spaces or plus signs all work) and build a
 * target from them. Returns null when nothing numeric was typed.
 */
export function parryTargetFromManualDice(text, { label = 'Incoming damage', modifier = 0 } = {}) {
  const values = String(text || '')
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map(n => parseInt(n, 10))
    .filter(n => Number.isFinite(n) && n > 0);
  if (!values.length) return null;
  const mod = parseInt(modifier, 10) || 0;
  return {
    rollId: null,
    label,
    dice: values.map(value => ({ value, sides: null })),
    modifier: mod,
    total: values.reduce((s, v) => s + v, 0) + mod,
  };
}
