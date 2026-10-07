// Passive stat effects from class, subclass, ancestry and community features —
// the feature-side counterpart of ABILITY_EFFECTS (daggerheartAbilityEffects.js),
// in the same { applies, requires, effect } shape so computeAbilityDelta can
// apply both. Before this, a Stalwart's "+1 to your damage thresholds" or a
// Simiah's "+1 to your Evasion" was printed on the sheet but never counted.
//
// Only unconditional (or simply checked) bonuses are modelled. Choices made in
// play — Elemental Incarnation's element, Transcendence's benefits — and extra
// HP/Stress slots, which are taken once when the character is built, are left
// to the player.

import { SUBCLASSES, ANCESTRIES, COMMUNITIES } from './systems/daggerheart.js';

const always = () => true;

export const FEATURE_EFFECTS = {
  // Guardian — Stalwart. Each tier adds to the last (+1, then +2, then +3).
  'Unwavering':  { applies: always, effect: () => ({ majorBonus: 1, severeBonus: 1 }) },
  'Unrelenting': { applies: always, effect: () => ({ majorBonus: 2, severeBonus: 2 }) },
  'Undaunted':   { applies: always, effect: () => ({ majorBonus: 3, severeBonus: 3 }) },
  // Rogue — Nightwalker mastery.
  'Fleeting Shadow': { applies: always, effect: () => ({ evasionBonus: 1 }) },
  // Seraph — Winged Sentinel mastery.
  'Ascendant': { applies: always, effect: () => ({ severeBonus: 4 }) },
  // Wizard — School of War specialization: "While you have at least 2 Hope,
  // you add your Proficiency to your Evasion."
  'Conjure Shield': {
    requires: 'needs at least 2 Hope',
    applies: ctx => (ctx.hope ?? 0) >= 2,
    effect: ctx => ({ evasionBonus: ctx.proficiency || 0 }),
  },
  // Ancestries.
  'Shell':  { applies: always, effect: ctx => ({ majorBonus: ctx.proficiency || 0, severeBonus: ctx.proficiency || 0 }) }, // Galapa
  'Nimble': { applies: always, effect: () => ({ evasionBonus: 1 }) }, // Simiah
};

const SLOTS_BY_LEVEL = {
  foundation: ['foundation'],
  specialization: ['foundation', 'specialization'],
  mastery: ['foundation', 'specialization', 'mastery'],
};

// "Unwavering / Iron Will" → ['Unwavering', 'Iron Will'].
const namesIn = (feature) => String(feature?.name || '').split(' / ').map(n => n.trim()).filter(Boolean);

/**
 * Names of every class-side feature the character has: their subclass's
 * unlocked features, a multiclass foundation, and ancestry and community
 * features (including custom ones).
 */
export function ownedFeatureNames(character) {
  if (!character) return [];
  const names = [];
  const sub = (SUBCLASSES[character.class] || []).find(s => s.name === character.subclass);
  for (const slot of SLOTS_BY_LEVEL[character.subclassLevel] || SLOTS_BY_LEVEL.foundation) {
    names.push(...namesIn(sub?.[slot]));
  }
  const mc = character.multiclass;
  const mcSub = mc ? (SUBCLASSES[mc.class] || []).find(s => s.name === mc.subclass) : null;
  names.push(...namesIn(mcSub?.foundation));
  const ancestry = ANCESTRIES[character.ancestry] || character.customAncestryData;
  const community = COMMUNITIES[character.community] || character.customCommunityData;
  for (const f of [...(ancestry?.features || []), ...(community?.features || [])]) names.push(...namesIn(f));
  return [...new Set(names)];
}

/** The owned features that have a modelled passive effect, as { name } entries. */
export function passiveFeaturesOf(character) {
  return ownedFeatureNames(character)
    .filter(n => Object.prototype.hasOwnProperty.call(FEATURE_EFFECTS, n))
    .map(name => ({ name }));
}
