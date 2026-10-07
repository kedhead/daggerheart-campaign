import { getCardByName } from './daggerheartDomainCards.js';

// Passive ability effects that modify derived character stats.
//
// Only PASSIVE effects live here — abilities that always apply when the card
// is in the character's loadout. Triggered effects (mark a Stress to..., once
// per rest..., etc.) are left for the player to activate and are not modeled.
//
// Each handler receives:
//   hasEquippedArmor, tier, proficiency, traits, domainCardCounts
// `requires` is shown on the sheet when the condition isn't met, so a card
// that isn't counting says why instead of failing silently.
// and returns a partial delta:
//   {
//     armorScoreBonus, armorScoreSet,           // armor score
//     majorBaseSet, severeBaseSet,              // REPLACE the armor-derived
//                                               // base (before +level)
//     majorBonus, severeBonus,                  // stack on final thresholds
//     evasionBonus,
//     attackBonus, spellcastBonus,              // added to those rolls
//     traitBonus: { agility: 1 },               // added to a trait everywhere
//   }

// Bare Bones (Valor L1) — Daggerheart core rulebook:
//   Armor Score = 3 + Strength
//   Base thresholds by tier:
//     Tier 1: 9/19  ·  Tier 2: 11/24  ·  Tier 3: 13/31  ·  Tier 4: 15/38
// These REPLACE the armor base; the sheet then adds character level on top.
const BARE_BONES_TIER_BASES = {
  1: { major: 9, severe: 19 },
  2: { major: 11, severe: 24 },
  3: { major: 13, severe: 31 },
  4: { major: 15, severe: 38 },
};

export const ABILITY_EFFECTS = {
  // Blade
  'Fortified Armor': {
    applies: (ctx) => ctx.hasEquippedArmor,
    requires: 'needs armor equipped',
    effect: () => ({ majorBonus: 2, severeBonus: 2 }),
  },
  // Vitality: "permanently gain two of: a Stress slot, a Hit Point slot, +2
  // to your damage thresholds", then the card is vaulted for good — so its
  // effect keeps applying from the vault. The Stress/HP slots are added to the
  // tracks when the player chooses (VITALITY_CHOICES); only the threshold
  // bonus is computed here. A character who hasn't chosen yet keeps the +2
  // the sheet always gave, so nobody's numbers drop before they pick.
  'Vitality': {
    permanent: true,
    requires: 'threshold bonus not chosen',
    applies: (ctx) => !Array.isArray(ctx.vitalityChoices) || ctx.vitalityChoices.includes('thresholds'),
    effect: () => ({ majorBonus: 2, severeBonus: 2 }),
  },
  'Blade-Touched': {
    applies: (ctx) => (ctx.domainCardCounts?.Blade ?? 0) >= 4,
    requires: 'needs 4+ Blade cards in the loadout',
    effect: () => ({ severeBonus: 4, attackBonus: 2 }),
  },

  // Arcana
  'Arcana-Touched': {
    applies: (ctx) => (ctx.domainCardCounts?.Arcana ?? 0) >= 4,
    requires: 'needs 4+ Arcana cards in the loadout',
    effect: () => ({ spellcastBonus: 1 }),
  },

  // Bone
  'Bone-Touched': {
    applies: (ctx) => (ctx.domainCardCounts?.Bone ?? 0) >= 4,
    requires: 'needs 4+ Bone cards in the loadout',
    effect: () => ({ traitBonus: { agility: 1 } }),
  },
  'Untouchable': {
    applies: () => true,
    effect: (ctx) => ({ evasionBonus: Math.floor((ctx.traits?.agility ?? 0) / 2) }),
  },

  // Splendor
  'Splendor-Touched': {
    applies: (ctx) => (ctx.domainCardCounts?.Splendor ?? 0) >= 4,
    requires: 'needs 4+ Splendor cards in the loadout',
    effect: () => ({ severeBonus: 3 }),
  },

  // Valor
  'Bare Bones': {
    applies: (ctx) => !ctx.hasEquippedArmor,
    requires: 'needs no armor equipped',
    effect: (ctx) => {
      const strength = ctx.traits?.strength ?? 0;
      const bases = BARE_BONES_TIER_BASES[ctx.tier] || BARE_BONES_TIER_BASES[1];
      return {
        armorScoreSet: 3 + strength,
        majorBaseSet: bases.major,
        severeBaseSet: bases.severe,
      };
    },
  },
  'Armorer': {
    applies: (ctx) => ctx.hasEquippedArmor,
    requires: 'needs armor equipped',
    effect: () => ({ armorScoreBonus: 1 }),
  },
  'Rise Up': {
    applies: () => true,
    effect: (ctx) => ({ severeBonus: ctx.proficiency ?? 0 }),
  },
  'Valor-Touched': {
    applies: (ctx) => (ctx.domainCardCounts?.Valor ?? 0) >= 4,
    requires: 'needs 4+ Valor cards in the loadout',
    effect: () => ({ armorScoreBonus: 1 }),
  },
};

/** Vitality's options: choose two. */
export const VITALITY_CHOICES = [
  { id: 'stress', label: 'One Stress slot' },
  { id: 'hp', label: 'One Hit Point slot' },
  { id: 'thresholds', label: '+2 bonus to your damage thresholds' },
];

/**
 * Updates that apply a Vitality choice: lengthen the chosen tracks, record
 * the choice, and vault the card permanently. Null unless exactly two
 * different options are picked.
 */
export function applyVitalityChoice(character, choices) {
  const picked = [...new Set(choices || [])].filter(c => VITALITY_CHOICES.some(o => o.id === c));
  if (picked.length !== 2) return null;
  const updates = { vitalityChoices: picked };
  if (picked.includes('hp')) {
    const hp = Array.isArray(character?.hpSlots) && character.hpSlots.length ? character.hpSlots : Array(6).fill(true);
    updates.hpSlots = [...hp, true];
  }
  if (picked.includes('stress')) {
    const st = Array.isArray(character?.stressSlots) && character.stressSlots.length ? character.stressSlots : Array(6).fill(false);
    updates.stressSlots = [...st, false];
  }
  const vault = character?.vaultCards || [];
  if (!vault.includes('Vitality')) updates.vaultCards = [...vault, 'Vitality'];
  return updates;
}

/** Whether a card has a passive stat effect modelled here. */
export function hasPassiveEffect(name) {
  return Object.prototype.hasOwnProperty.call(ABILITY_EFFECTS, name);
}

/** Cards whose effect is permanent once chosen, so the vault doesn't switch it off. */
export function isPermanentEffect(name) {
  return !!ABILITY_EFFECTS[name]?.permanent;
}

// "+2 thresholds", "+1 Armor Score", "+1 Evasion" — what a card adds right now.
function summarize(d) {
  const parts = [];
  if (d.majorBaseSet != null || d.severeBaseSet != null) parts.push(`unarmored thresholds ${d.majorBaseSet ?? 0}/${d.severeBaseSet ?? 0}`);
  if (d.armorScoreSet != null) parts.push(`Armor Score ${d.armorScoreSet}`);
  const major = d.majorBonus || 0;
  const severe = d.severeBonus || 0;
  if (major && major === severe) parts.push(`+${major} thresholds`);
  else {
    if (major) parts.push(`+${major} Major`);
    if (severe) parts.push(`+${severe} Severe`);
  }
  if (d.armorScoreBonus) parts.push(`+${d.armorScoreBonus} Armor Score`);
  if (d.evasionBonus) parts.push(`+${d.evasionBonus} Evasion`);
  if (d.attackBonus) parts.push(`+${d.attackBonus} attack rolls`);
  if (d.spellcastBonus) parts.push(`+${d.spellcastBonus} Spellcast Rolls`);
  for (const [t, n] of Object.entries(d.traitBonus || {})) {
    if (n) parts.push(`+${n} ${t.charAt(0).toUpperCase()}${t.slice(1)}`);
  }
  return parts.join(', ') || 'no bonus yet';
}

export function computeAbilityDelta(ownedCards, ctx, handlers = ABILITY_EFFECTS) {
  const delta = {
    armorScoreBonus: 0,
    armorScoreSet: null,
    majorBaseSet: null,
    severeBaseSet: null,
    majorBonus: 0,
    severeBonus: 0,
    evasionBonus: 0,
    attackBonus: 0,
    spellcastBonus: 0,
    traitBonus: {},
    activeCards: [],
    // Every owned card with a passive effect: { name, active, reason, summary }.
    effects: [],
  };
  if (!Array.isArray(ownedCards)) return delta;
  for (const card of ownedCards) {
    const handler = handlers[card?.name];
    if (!handler) continue;
    let active = true;
    try { active = handler.applies(ctx); } catch { active = false; }
    if (!active) {
      delta.effects.push({ name: card.name, active: false, reason: handler.requires || 'condition not met', summary: '' });
      continue;
    }
    const d = handler.effect(ctx) || {};
    delta.effects.push({ name: card.name, active: true, reason: '', summary: summarize(d) });
    if (d.armorScoreSet != null) delta.armorScoreSet = d.armorScoreSet;
    if (d.majorBaseSet != null) delta.majorBaseSet = d.majorBaseSet;
    if (d.severeBaseSet != null) delta.severeBaseSet = d.severeBaseSet;
    delta.armorScoreBonus += d.armorScoreBonus || 0;
    delta.majorBonus += d.majorBonus || 0;
    delta.severeBonus += d.severeBonus || 0;
    delta.evasionBonus += d.evasionBonus || 0;
    delta.attackBonus += d.attackBonus || 0;
    delta.spellcastBonus += d.spellcastBonus || 0;
    for (const [t, n] of Object.entries(d.traitBonus || {})) delta.traitBonus[t] = (delta.traitBonus[t] || 0) + n;
    delta.activeCards.push(card.name);
  }
  return delta;
}

/**
 * The domain cards whose passive effects count: the loadout, plus permanent
 * cards (Vitality) wherever they are. Vault cards are inactive (SRD).
 */
export function activeLoadoutCards(character) {
  const vault = new Set((character?.vaultCards || []).filter(n => !isPermanentEffect(n)));
  return (character?.domainCards || [])
    .map(c => (typeof c === 'string' ? getCardByName(c) : (c?.name && c?.domain ? c : getCardByName(c?.name))))
    .filter(c => c && !vault.has(c.name));
}

/** Loadout cards per domain, for the "-Touched" cards (4+ from one domain). */
export function loadoutDomainCounts(cards) {
  return cards.reduce((acc, c) => { acc[c.domain] = (acc[c.domain] || 0) + 1; return acc; }, {});
}

/**
 * Roll bonuses from passive cards, for the sheets' roll buttons:
 * Blade-Touched (+2 attack rolls), Arcana-Touched (+1 Spellcast Rolls) and
 * Bone-Touched (+1 Agility). Only stat-free context is needed, so this works
 * without the item catalog.
 */
export function rollBonusesFor(character) {
  const cards = activeLoadoutCards(character);
  const d = computeAbilityDelta(cards, {
    hasEquippedArmor: false, tier: 1, proficiency: 0, traits: character?.traits || {},
    domainCardCounts: loadoutDomainCounts(cards), vitalityChoices: character?.vitalityChoices,
  });
  return { attack: d.attackBonus, spellcast: d.spellcastBonus, traits: d.traitBonus };
}

/** The character's traits with passive trait bonuses (Bone-Touched) applied. */
export function effectiveTraits(character) {
  const base = character?.traits || {};
  const { traits } = rollBonusesFor(character);
  const out = { ...base };
  for (const [t, n] of Object.entries(traits || {})) out[t] = (Number(out[t]) || 0) + n;
  return out;
}
