// Passive ability effects that modify derived character stats.
//
// Only PASSIVE effects live here — abilities that always apply when the card
// is in the character's loadout. Triggered effects (mark a Stress to..., once
// per rest..., etc.) are left for the player to activate and are not modeled.
//
// Each handler receives:
//   hasEquippedArmor, tier, proficiency, traits, domainCardCounts
// and returns a partial delta:
//   { armorScoreBonus, armorScoreSet, majorBonus, severeBonus, evasionBonus }

// Bare Bones (Valor L1): "enhanced damage thresholds by tier" — the Daggerheart
// tier scaling for thresholds is +2 per tier step, producing +2/+4/+6/+8.
const BARE_BONES_TIER_BONUS = { 1: 2, 2: 4, 3: 6, 4: 8 };

export const ABILITY_EFFECTS = {
  // Blade
  'Fortified Armor': {
    applies: (ctx) => ctx.hasEquippedArmor,
    effect: () => ({ majorBonus: 2, severeBonus: 2 }),
  },
  'Vitality': {
    // Permanent +2 to thresholds (HP/Stress grants handled via level-up, not here).
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
      const tierBonus = BARE_BONES_TIER_BONUS[ctx.tier] ?? 2;
      return {
        armorScoreSet: 3 + strength,
        majorBonus: tierBonus,
        severeBonus: tierBonus,
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
    delta.armorScoreBonus += d.armorScoreBonus || 0;
    delta.majorBonus += d.majorBonus || 0;
    delta.severeBonus += d.severeBonus || 0;
    delta.evasionBonus += d.evasionBonus || 0;
    delta.activeCards.push(card.name);
  }
  return delta;
}
