// Applying a level-up's choices to a character.
//
// PURE — no React, no Firestore, no DOM. This logic used to live in a closure
// inside LevelUpWizard, where nothing could test it; a purchased Proficiency
// advancement was silently erased on the following level-up for exactly that
// reason. The wizard now owns only the picking UI and calls in here to compute
// the update, so the rules can be asserted directly.
//
// Rules reference: the Tier 2/3/4 advancement columns of the official
// Daggerheart character guide.

import { getBaseProficiency, getProficiencyBonus } from '../data/systems/daggerheart';

export const TRAIT_NAMES = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'];

// A tier's bonuses land on its first level only.
export const TIER_BOUNDARY_LEVELS = { 2: 2, 3: 5, 4: 8 };

export const isTierBoundaryLevel = (level, tier) => TIER_BOUNDARY_LEVELS[tier] === level;

/** Advancement ids picked this level-up, from the wizard's "<tier>:<id>" keys. */
const advId = (key) => String(key).split(':')[1];
const advTier = (key) => Number(String(key).split(':')[0]);

/**
 * Build the character update for one level-up.
 *
 * @param {object} character
 * @param {object} opts
 * @param {number} opts.newLevel
 * @param {number} opts.newTier
 * @param {boolean} opts.isTierBoundary
 * @param {string[]} opts.advancements  - "<tier>:<id>" keys, one entry per pick
 * @param {object} opts.advDetails      - keyed by the same composite key
 * @param {string} [opts.newExperience] - name of the Experience gained on tier entry
 * @param {string|null} [opts.freeDomainCard]
 * @param {object|null} [opts.multiclass] - { class, subclass, domain }
 * @param {string|null} [opts.companionUpgrade]
 * @param {string} [opts.companionUpgradeDetail]
 * @returns {object} Firestore-ready partial update
 */
export function applyLevelUp(character, {
  newLevel,
  newTier,
  isTierBoundary,
  advancements = [],
  advDetails = {},
  newExperience = '',
  freeDomainCard = null,
  multiclass = null,
  companionUpgrade = null,
  companionUpgradeDetail = '',
} = {}) {
  const updates = {};
  const levelHistory = character.levelHistory || [];

  const achievements = ['thresholds'];
  if (isTierBoundary) {
    achievements.unshift('experience', 'proficiency');
    if (newTier >= 3) achievements.push('clearMarks');
  }

  const newLevelEntry = {
    level: newLevel,
    tier: newTier,
    achievements,
    advancements: advancements.map(key => ({
      id: advId(key),
      fromTier: advTier(key),
      details: advDetails[key] || {},
    })),
    domainCard: freeDomainCard,
    companionUpgrade,
  };

  updates.level = newLevel;
  updates.levelHistory = [...levelHistory, newLevelEntry];

  // Proficiency is base-for-tier plus every "+1 Proficiency" advancement ever
  // bought, INCLUDING this level's picks — which is why the new history entry is
  // appended first. Writing the tier base alone here is what used to delete the
  // bonus on the next level-up.
  updates.proficiency = getBaseProficiency(newLevel)
    + getProficiencyBonus({ levelHistory: updates.levelHistory });

  // ── Tier-entry achievements ──
  if (isTierBoundary && newExperience.trim()) {
    updates.experiences = [...(character.experiences || []), newExperience.trim()];
  }
  // Tiers 3 and 4 clear all trait marks on entry; tier 2 does not.
  if (isTierBoundary && newTier >= 3) {
    updates.markedTraits = [];
  }

  // ── Advancements ──
  let subclassChain = character.subclassLevel || 'foundation';
  advancements.forEach(key => {
    const id = advId(key);
    const details = advDetails[key] || {};
    switch (id) {
      case 'traits': {
        const traits = { ...(updates.traits || character.traits || {}) };
        // `updates.markedTraits` may already be [] from a tier 3/4 clear — an
        // empty array is truthy, so the clear correctly wins over the old marks.
        const marked = [...(updates.markedTraits || character.markedTraits || [])];
        (details.traits || []).forEach(t => {
          traits[t] = (traits[t] || 0) + 1;
          if (!marked.includes(t)) marked.push(t);
        });
        updates.traits = traits;
        updates.markedTraits = marked;
        break;
      }
      case 'hp': {
        // hpSlots stores HP REMAINING, so a new slot starts unmarked as `true`.
        const current = updates.hpSlots || character.hpSlots || [true, true, true, true, true, true];
        updates.hpSlots = [...current, true];
        break;
      }
      case 'stress': {
        // stressSlots stores MARKS, so a new slot starts unmarked as `false`.
        const current = updates.stressSlots || character.stressSlots || [false, false, false, false, false, false];
        updates.stressSlots = [...current, false];
        break;
      }
      case 'evasion': {
        updates.baseEvasionBonus = (updates.baseEvasionBonus || character.baseEvasionBonus || 0) + 1;
        break;
      }
      case 'experiences': {
        const boosts = { ...(updates.experienceBoosts || character.experienceBoosts || {}) };
        (details.experiences || []).forEach(exp => {
          boosts[exp] = (boosts[exp] || 0) + 1;
        });
        updates.experienceBoosts = boosts;
        break;
      }
      case 'subclassUpgrade': {
        subclassChain = subclassChain === 'foundation' ? 'specialization' : 'mastery';
        updates.subclassLevel = subclassChain;
        break;
      }
      case 'proficiency':
        // Already folded into updates.proficiency via the history entry above.
        break;
      case 'multiclass': {
        if (multiclass) updates.multiclass = { ...multiclass };
        break;
      }
      default:
        break;
    }
  });

  // ── Domain cards: the free one every level, plus any bought as advancements ──
  const cards = [...(character.domainCards || [])];
  if (freeDomainCard && !cards.includes(freeDomainCard)) cards.push(freeDomainCard);
  advancements.forEach(key => {
    if (advId(key) !== 'domainCard') return;
    const card = advDetails[key]?.card;
    if (card && !cards.includes(card)) cards.push(card);
  });
  if (cards.length !== (character.domainCards || []).length) {
    updates.domainCards = cards;
  }

  // ── Companion (Beastbound Ranger) ──
  if (companionUpgrade && character.companion) {
    const comp = { ...character.companion };
    comp.upgrades = [...(comp.upgrades || []), companionUpgrade];
    if (companionUpgrade === 'intelligent' && companionUpgradeDetail) {
      comp.upgradeDetails = { ...(comp.upgradeDetails || {}), intelligent: companionUpgradeDetail };
    }
    updates.companion = comp;
  }

  return updates;
}

/**
 * Highest domain card level a given advancement pick may take.
 *
 * The sheet caps the tier 2 domain-card box at level 4 and the tier 3 box at
 * level 7. Within their own tier that's implied by "your level or lower", but it
 * still binds when a later level spends an earlier tier's box.
 */
export function maxCardLevelFor(option, characterLevel) {
  const cap = option?.maxCardLevel;
  return cap == null ? characterLevel : Math.min(characterLevel, cap);
}
