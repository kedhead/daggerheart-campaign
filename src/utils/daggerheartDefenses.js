// Single source of truth for a Daggerheart character's derived defenses:
// Armor Score, Evasion, and damage thresholds (Major / Severe / Massive).
//
// Both the full character sheet and the Player Portal stats tab call this so
// the numbers can never drift apart. All rules references are to the
// Daggerheart core rulebook.

import { CLASSES, getBaseProficiency, getTierForLevel } from '../data/systems/daggerheart';
import { computeAbilityDelta } from '../data/daggerheartAbilityEffects';
import { getCardByName } from '../data/daggerheartDomainCards';
import { DAGGERHEART_ARMOR, ALL_DAGGERHEART_ITEMS } from '../data/daggerheartItems';
import { getFeatureName, getFeatureDescription } from './itemFeatures';

// Fill in missing systemData fields from the official catalog (matched by name).
// Handles items imported before systemData was fully established, or items with
// empty features arrays that should have Protective / Barrier / Heavy / etc.
function enrichFromCatalog(item) {
  if (!item?.name) return item;
  const sd = item.systemData || {};
  const needsFeatures = !sd.features || sd.features.length === 0;
  const needsArmorScore = item.type === 'armor' && sd.armorScore == null;
  const needsTier = sd.tier == null;
  if (!needsFeatures && !needsArmorScore && !needsTier) return item;
  const match = ALL_DAGGERHEART_ITEMS.find(c => c.name.toLowerCase() === item.name.toLowerCase());
  if (!match?.systemData) return item;
  return {
    ...item,
    systemData: {
      ...sd,
      ...(needsFeatures && { features: match.systemData.features || [] }),
      ...(needsArmorScore && { armorScore: match.systemData.armorScore }),
      ...(needsTier && { tier: match.systemData.tier || 1 }),
    },
  };
}

// Armor prints two base numbers (Major base / Severe base), stored on items as
// `thresholds.minor` and `thresholds.major` for historical reasons — the values
// are correct, only the field names are legacy. Resolve from the equipped item's
// own systemData, falling back to a name-match against the built-in catalog
// (catches Demiplane imports / legacy custom armor missing the thresholds field).
export function resolveArmorBases(armor) {
  if (!armor) return null;
  const t = armor.systemData?.thresholds;
  if (t && (t.minor > 0 || t.major > 0)) return { major: t.minor || 0, severe: t.major || 0 };
  if (armor.name) {
    const match = DAGGERHEART_ARMOR.find(a => a.name.toLowerCase() === armor.name.toLowerCase());
    if (match?.systemData?.thresholds) {
      return { major: match.systemData.thresholds.minor || 0, severe: match.systemData.thresholds.major || 0 };
    }
  }
  return null;
}

/**
 * Compute a character's derived defenses.
 *
 * @param {object} character - the character record
 * @param {Array}  equippedItems - resolved, currently-equipped item objects
 *                 (full item shape with `systemData`), weapons and armor alike.
 * @returns {{armorScore:number, evasion:number, majorThreshold:number,
 *            severeThreshold:number, massiveThreshold:number}}
 */
export function computeDefenses(character, equippedItems = []) {
  equippedItems = equippedItems.map(enrichFromCatalog);
  const charClass = character?.class;
  const level = character?.level || 1;
  const traits = character?.traits || {};
  const proficiency = character?.proficiency || getBaseProficiency(level);

  // Domain cards are stored as plain names; enrich them to full card objects
  // (with `name` + `domain`) so passive ability effects can be matched.
  const domainCards = (character?.domainCards || [])
    .map(c => (typeof c === 'string' ? getCardByName(c) : (c?.name && c?.domain ? c : getCardByName(c?.name))))
    .filter(Boolean);

  const equippedArmorItems = equippedItems.filter(i => i.type === 'armor');
  const baseArmorScore = character?.armor ?? 0;

  // Base Armor Score from the equipped armor item (or the character's stored value).
  const baseEffectiveArmorScore = equippedArmorItems.length === 0
    ? baseArmorScore
    : Math.max(Math.max(...equippedArmorItems.map(a => a.systemData?.armorScore ?? 0)), baseArmorScore);

  // Armor-score / evasion bonuses from item features. Protective and Barrier are
  // secondary-weapon / shield features, so scan ALL equipped items, not just armor.
  // Protective: +Proficiency Armor Score (per rules — scales with level).
  // Barrier:    +Proficiency+1 Armor Score and -1 Evasion.
  // Double Duty: +1 Armor Score (flat).
  // Feature names whose mechanics are applied by name elsewhere in this file —
  // never re-parse their description text or the bonus would count twice.
  const NAMED_FEATURES = new Set([
    'protective', 'barrier', 'double duty', 'double-duty',
    'flexible', 'heavy', 'very heavy', 'very-heavy', 'fortified',
  ]);

  let armorScoreFeatureBonus = 0;
  let featureEvasionBonus = 0;
  let barrierEvasionPenalty = 0;
  equippedItems.forEach(item => {
    (item.systemData?.features || []).forEach(f => {
      const fl = getFeatureName(f).toLowerCase();
      if (fl === 'protective') armorScoreFeatureBonus += proficiency;
      else if (fl === 'barrier') { armorScoreFeatureBonus += proficiency + 1; barrierEvasionPenalty += 1; }
      else if (fl === 'double duty' || fl === 'double-duty') armorScoreFeatureBonus += 1;
      else if (!NAMED_FEATURES.has(fl)) {
        // Custom / AI-generated items spell their bonus out in text instead of
        // using a recognized feature name ("Armor Slot: +1 armor score",
        // "Ever Damp: +1 evasion") — parse it so those items actually count.
        const text = `${getFeatureName(f)} ${getFeatureDescription(f) || ''}`;
        const armorMatch = text.match(/([+-]\d+)\s*(?:to\s+)?armor(?:\s*(?:score|slots?))?\b/i);
        if (armorMatch) armorScoreFeatureBonus += parseInt(armorMatch[1], 10);
        const evasionMatch = text.match(/([+-]\d+)\s*(?:to\s+)?evasion\b/i);
        if (evasionMatch) featureEvasionBonus += parseInt(evasionMatch[1], 10);
      }
    });
  });

  // Base evasion: class base (or stored value), plus level-up evasion advancements.
  const baseEvasion = ((charClass && CLASSES[charClass]?.baseEvasion) || character?.evasion || 10)
    + (character?.baseEvasionBonus || 0);

  // Armor evasion features.
  let baseEffectiveEvasion = baseEvasion;
  equippedArmorItems.forEach(armor => {
    (armor.systemData?.features || []).forEach(f => {
      const fl = getFeatureName(f).toLowerCase();
      if (fl === 'flexible') baseEffectiveEvasion += 1;
      else if (fl === 'heavy') baseEffectiveEvasion -= 1;
      else if (fl === 'very-heavy' || fl === 'very heavy') baseEffectiveEvasion -= 2;
    });
  });
  baseEffectiveEvasion += featureEvasionBonus - barrierEvasionPenalty;

  // Passive domain-card ability effects (Bare Bones, Vitality, Untouchable, ...).
  const domainCardCounts = domainCards.reduce((acc, c) => {
    acc[c.domain] = (acc[c.domain] || 0) + 1;
    return acc;
  }, {});
  const abilityDelta = computeAbilityDelta(domainCards, {
    hasEquippedArmor: equippedArmorItems.length > 0,
    tier: getTierForLevel(level),
    proficiency,
    traits,
    domainCardCounts,
  });

  // Damage thresholds. Final threshold = base + character level. Fallback chain:
  //   1. Ability-set base (e.g. Bare Bones) + level — overrides armor entirely
  //   2. Equipped armor base + level
  //   3. Character manual override (hpThresholds) — already final, no level added
  //   4. Gambeson (tier 1) baseline 5/11 + level
  const armorBases = resolveArmorBases(equippedArmorItems[0]);
  const manualThresholds = character?.hpThresholds || {};
  let majorThreshold = 0;
  let severeThreshold = 0;
  if (abilityDelta.majorBaseSet != null || abilityDelta.severeBaseSet != null) {
    majorThreshold = (abilityDelta.majorBaseSet ?? 0) + level;
    severeThreshold = (abilityDelta.severeBaseSet ?? 0) + level;
  } else if (armorBases && (armorBases.major > 0 || armorBases.severe > 0)) {
    majorThreshold = armorBases.major > 0 ? armorBases.major + level : 0;
    severeThreshold = armorBases.severe > 0 ? armorBases.severe + level : 0;
  } else if (manualThresholds.major > 0 || manualThresholds.severe > 0) {
    majorThreshold = manualThresholds.major || 0;
    severeThreshold = manualThresholds.severe || 0;
  } else {
    majorThreshold = 5 + level;
    severeThreshold = 11 + level;
  }
  majorThreshold += abilityDelta.majorBonus;
  severeThreshold += abilityDelta.severeBonus;
  const massiveThreshold = severeThreshold > 0 ? severeThreshold * 2 : 0;

  // Final Armor Score: base (or ability-set base) + feature bonuses + ability
  // bonuses, capped at 12 (rulebook: Armor Score can never exceed 12).
  const armorScoreBase = abilityDelta.armorScoreSet != null
    ? abilityDelta.armorScoreSet
    : baseEffectiveArmorScore;
  const armorScore = Math.min(12, armorScoreBase + armorScoreFeatureBonus + abilityDelta.armorScoreBonus);

  // Active class Hope features with a passive component. Rogue's Dodge:
  // spend 3 Hope → +2 Evasion until an attack lands / next rest. The sheet
  // stores the active state on the character; the bonus applies while on.
  const hopeFeatureEvasion =
    character?.hopeFeatureActive && String(charClass || '').toLowerCase() === 'rogue' ? 2 : 0;

  const evasion = baseEffectiveEvasion + abilityDelta.evasionBonus + hopeFeatureEvasion;

  return { armorScore, evasion, majorThreshold, severeThreshold, massiveThreshold };
}
