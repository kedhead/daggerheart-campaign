// Passive ability effects that modify derived character stats.
//
// Only PASSIVE effects live here — abilities that always apply when the card
// is in the character's loadout. Triggered effects (mark a Stress to..., once
// per rest..., etc.) are left for the player to activate and are not modeled.
//
// Each handler receives:
//   hasEquippedArmor, tier, proficiency, traits, domainCardCounts
// and returns a partial delta:
//   {
//     armorScoreBonus, armorScoreSet,           // armor score
//     majorBaseSet, severeBaseSet,              // REPLACE the armor-derived
//                                               // base (before +level)
//     majorBonus, severeBonus,                  // stack on final thresholds
//     evasionBonus,
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
    effect: () => ({ majorBonus: 2, severeBonus: 2 }),
  },
  'Vitality': {
    applies: () => true,
    effect: () => ({ majorBonus: 2, severeBonus: 2 }),
  },
  'Blade-Touched': {
    applies: (ctx) => (ctx.domainCardCounts?.Blade ?? 0) >= 4,
    effect: () => ({ severeBonus: 4 }),
  },

  // Bone
  'Untouchable': {
    applies: () => true,
    effect: (ctx) => ({ evasionBonus: Math.floor((ctx.traits?.agility ?? 0) / 2) }),
  },

  // Splendor
  'Splendor-Touched': {
    applies: (ctx) => (ctx.domainCardCounts?.Splendor ?? 0) >= 4,
    effect: () => ({ severeBonus: 3 }),
  },

  // Valor
  'Bare Bones': {
    applies: (ctx) => !ctx.hasEquippedArmor,
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
    effect: () => ({ armorScoreBonus: 1 }),
  },
  'Rise Up': {
    applies: () => true,
    effect: (ctx) => ({ severeBonus: ctx.proficiency ?? 0 }),
  },
  'Valor-Touched': {
    applies: (ctx) => (ctx.domainCardCounts?.Valor ?? 0) >= 4,
    effect: () => ({ armorScoreBonus: 1 }),
  },
};

export function computeAbilityDelta(ownedCards, ctx) {
  const delta = {
    armorScoreBonus: 0,
    armorScoreSet: null,
    majorBaseSet: null,
    severeBaseSet: null,
    majorBonus: 0,
    severeBonus: 0,
    evasionBonus: 0,
    activeCards: [],
  };
  if (!Array.isArray(ownedCards)) return delta;
  for (const card of ownedCards) {
    const handler = ABILITY_EFFECTS[card?.name];
    if (!handler) continue;
    let active = true;
    try { active = handler.applies(ctx); } catch { active = false; }
    if (!active) continue;
    const d = handler.effect(ctx) || {};
    if (d.armorScoreSet != null) delta.armorScoreSet = d.armorScoreSet;
    if (d.majorBaseSet != null) delta.majorBaseSet = d.majorBaseSet;
    if (d.severeBaseSet != null) delta.severeBaseSet = d.severeBaseSet;
    delta.armorScoreBonus += d.armorScoreBonus || 0;
    delta.majorBonus += d.majorBonus || 0;
    delta.severeBonus += d.severeBonus || 0;
    delta.evasionBonus += d.evasionBonus || 0;
    delta.activeCards.push(card.name);
  }
  return delta;
}
