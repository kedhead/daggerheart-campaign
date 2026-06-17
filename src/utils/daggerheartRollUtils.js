import { getTierForLevel } from '../data/systems/daggerheart';

export const TRAIT_ABBREV = {
  agility: 'AGI', strength: 'STR', finesse: 'FIN',
  instinct: 'INS', presence: 'PRE', knowledge: 'KNO',
};

export const TRAIT_NAMES = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'];

export function parseDamageString(dmgStr) {
  if (!dmgStr) return null;
  const match = dmgStr.match(/^(\d+)?d(\d+)(?:\+(\d+))?$/);
  if (!match) return null;
  return {
    quantity: parseInt(match[1] || '1', 10),
    dieType: parseInt(match[2], 10),
    modifier: parseInt(match[3] || '0', 10),
  };
}

export function extractCardDice(text) {
  if (!text) return null;
  const match = text.match(/(\d+)?d(\d+)(?:\+(\d+))?/);
  if (!match) return null;
  return {
    quantity: parseInt(match[1] || '1', 10),
    dieType: parseInt(match[2], 10),
    modifier: parseInt(match[3] || '0', 10),
  };
}

export function getWeaponDamage(weapon, level, proficiency) {
  const sd = weapon.systemData;
  if (!sd) return null;
  const tier = getTierForLevel(level);
  const dice = sd[`damageTier${tier}Dice`];
  const mod = sd[`damageTier${tier}Modifier`];
  if (!dice) return null;
  const qty = proficiency || 1;
  const diceStr = `${qty}${dice}`;
  return mod ? `${diceStr}+${mod}` : diceStr;
}

export function formatTraitValue(val) {
  return val > 0 ? `+${val}` : `${val}`;
}
