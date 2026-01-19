/**
 * Official Daggerheart Items from daggerheart.org/reference
 * These can be imported into campaigns as template items
 */

// Helper to parse damage like "d8+3" into dice and modifier
const parseDamage = (str) => {
  if (!str) return { dice: 'd8', modifier: 0 };
  const match = str.match(/d(\d+)(?:\+(\d+))?/);
  if (!match) return { dice: 'd8', modifier: 0 };
  return {
    dice: `d${match[1]}`,
    modifier: parseInt(match[2] || 0)
  };
};

// ============================================
// WEAPONS
// ============================================

export const DAGGERHEART_WEAPONS = [
  // TIER 1 - Primary Physical
  {
    name: 'Broadsword',
    type: 'weapon',
    description: 'A reliable one-handed blade. +1 to attack rolls.',
    systemData: {
      classification: 'primary',
      damageType: 'physical',
      trait: 'agility',
      range: 'melee',
      burden: 'one-handed',
      damageTier1Dice: 'd8', damageTier1Modifier: 0,
      damageTier2Dice: 'd8', damageTier2Modifier: 3,
      damageTier3Dice: 'd8', damageTier3Modifier: 6,
      damageTier4Dice: 'd8', damageTier4Modifier: 9,
      features: ['reliable']
    }
  },
  {
    name: 'Longsword',
    type: 'weapon',
    description: 'A versatile two-handed sword.',
    systemData: {
      classification: 'primary',
      damageType: 'physical',
      trait: 'agility',
      range: 'melee',
      burden: 'two-handed',
      damageTier1Dice: 'd10', damageTier1Modifier: 3,
      damageTier2Dice: 'd10', damageTier2Modifier: 6,
      damageTier3Dice: 'd10', damageTier3Modifier: 9,
      damageTier4Dice: 'd10', damageTier4Modifier: 12,
      features: []
    }
  },
  {
    name: 'Battleaxe',
    type: 'weapon',
    description: 'A heavy two-handed axe.',
    systemData: {
      classification: 'primary',
      damageType: 'physical',
      trait: 'strength',
      range: 'melee',
      burden: 'two-handed',
      damageTier1Dice: 'd10', damageTier1Modifier: 3,
      damageTier2Dice: 'd10', damageTier2Modifier: 6,
      damageTier3Dice: 'd10', damageTier3Modifier: 9,
      damageTier4Dice: 'd10', damageTier4Modifier: 12,
      features: []
    }
  },
  {
    name: 'Greatsword',
    type: 'weapon',
    description: 'A massive blade. -1 to Evasion; roll extra die, discard lowest.',
    systemData: {
      classification: 'primary',
      damageType: 'physical',
      trait: 'strength',
      range: 'melee',
      burden: 'two-handed',
      damageTier1Dice: 'd10', damageTier1Modifier: 3,
      damageTier2Dice: 'd10', damageTier2Modifier: 6,
      damageTier3Dice: 'd10', damageTier3Modifier: 9,
      damageTier4Dice: 'd10', damageTier4Modifier: 12,
      features: ['massive']
    }
  },
  {
    name: 'Mace',
    type: 'weapon',
    description: 'A sturdy one-handed bludgeon.',
    systemData: {
      classification: 'primary',
      damageType: 'physical',
      trait: 'strength',
      range: 'melee',
      burden: 'one-handed',
      damageTier1Dice: 'd8', damageTier1Modifier: 1,
      damageTier2Dice: 'd8', damageTier2Modifier: 4,
      damageTier3Dice: 'd8', damageTier3Modifier: 7,
      damageTier4Dice: 'd8', damageTier4Modifier: 10,
      features: []
    }
  },
  {
    name: 'Warhammer',
    type: 'weapon',
    description: 'A heavy crushing weapon. -1 to Evasion.',
    systemData: {
      classification: 'primary',
      damageType: 'physical',
      trait: 'strength',
      range: 'melee',
      burden: 'two-handed',
      damageTier1Dice: 'd12', damageTier1Modifier: 3,
      damageTier2Dice: 'd12', damageTier2Modifier: 6,
      damageTier3Dice: 'd12', damageTier3Modifier: 9,
      damageTier4Dice: 'd12', damageTier4Modifier: 12,
      features: ['heavy']
    }
  },
  {
    name: 'Dagger',
    type: 'weapon',
    description: 'A quick one-handed blade.',
    systemData: {
      classification: 'primary',
      damageType: 'physical',
      trait: 'finesse',
      range: 'melee',
      burden: 'one-handed',
      damageTier1Dice: 'd8', damageTier1Modifier: 1,
      damageTier2Dice: 'd8', damageTier2Modifier: 4,
      damageTier3Dice: 'd8', damageTier3Modifier: 7,
      damageTier4Dice: 'd8', damageTier4Modifier: 10,
      features: []
    }
  },
  {
    name: 'Quarterstaff',
    type: 'weapon',
    description: 'A simple two-handed staff.',
    systemData: {
      classification: 'primary',
      damageType: 'physical',
      trait: 'instinct',
      range: 'melee',
      burden: 'two-handed',
      damageTier1Dice: 'd10', damageTier1Modifier: 3,
      damageTier2Dice: 'd10', damageTier2Modifier: 6,
      damageTier3Dice: 'd10', damageTier3Modifier: 9,
      damageTier4Dice: 'd10', damageTier4Modifier: 12,
      features: []
    }
  },
  {
    name: 'Cutlass',
    type: 'weapon',
    description: 'A curved one-handed blade favored by swashbucklers.',
    systemData: {
      classification: 'primary',
      damageType: 'physical',
      trait: 'presence',
      range: 'melee',
      burden: 'one-handed',
      damageTier1Dice: 'd8', damageTier1Modifier: 1,
      damageTier2Dice: 'd8', damageTier2Modifier: 4,
      damageTier3Dice: 'd8', damageTier3Modifier: 7,
      damageTier4Dice: 'd8', damageTier4Modifier: 10,
      features: []
    }
  },
  {
    name: 'Rapier',
    type: 'weapon',
    description: 'A quick thrusting blade. Mark Stress to target another creature.',
    systemData: {
      classification: 'primary',
      damageType: 'physical',
      trait: 'presence',
      range: 'melee',
      burden: 'one-handed',
      damageTier1Dice: 'd8', damageTier1Modifier: 0,
      damageTier2Dice: 'd8', damageTier2Modifier: 3,
      damageTier3Dice: 'd8', damageTier3Modifier: 6,
      damageTier4Dice: 'd8', damageTier4Modifier: 9,
      features: ['quick']
    }
  },
  {
    name: 'Halberd',
    type: 'weapon',
    description: 'A polearm with extended reach. -1 to Finesse.',
    systemData: {
      classification: 'primary',
      damageType: 'physical',
      trait: 'strength',
      range: 'very close',
      burden: 'two-handed',
      damageTier1Dice: 'd10', damageTier1Modifier: 2,
      damageTier2Dice: 'd10', damageTier2Modifier: 5,
      damageTier3Dice: 'd10', damageTier3Modifier: 8,
      damageTier4Dice: 'd10', damageTier4Modifier: 11,
      features: ['cumbersome']
    }
  },
  {
    name: 'Spear',
    type: 'weapon',
    description: 'A thrusting polearm.',
    systemData: {
      classification: 'primary',
      damageType: 'physical',
      trait: 'finesse',
      range: 'very close',
      burden: 'two-handed',
      damageTier1Dice: 'd8', damageTier1Modifier: 3,
      damageTier2Dice: 'd8', damageTier2Modifier: 6,
      damageTier3Dice: 'd8', damageTier3Modifier: 9,
      damageTier4Dice: 'd8', damageTier4Modifier: 12,
      features: []
    }
  },
  {
    name: 'Shortbow',
    type: 'weapon',
    description: 'A compact ranged weapon.',
    systemData: {
      classification: 'primary',
      damageType: 'physical',
      trait: 'agility',
      range: 'far',
      burden: 'two-handed',
      damageTier1Dice: 'd6', damageTier1Modifier: 3,
      damageTier2Dice: 'd6', damageTier2Modifier: 6,
      damageTier3Dice: 'd6', damageTier3Modifier: 9,
      damageTier4Dice: 'd6', damageTier4Modifier: 12,
      features: []
    }
  },
  {
    name: 'Crossbow',
    type: 'weapon',
    description: 'A mechanical ranged weapon.',
    systemData: {
      classification: 'primary',
      damageType: 'physical',
      trait: 'finesse',
      range: 'far',
      burden: 'one-handed',
      damageTier1Dice: 'd6', damageTier1Modifier: 1,
      damageTier2Dice: 'd6', damageTier2Modifier: 4,
      damageTier3Dice: 'd6', damageTier3Modifier: 7,
      damageTier4Dice: 'd6', damageTier4Modifier: 10,
      features: []
    }
  },
  {
    name: 'Longbow',
    type: 'weapon',
    description: 'A powerful ranged weapon. -1 to Finesse.',
    systemData: {
      classification: 'primary',
      damageType: 'physical',
      trait: 'agility',
      range: 'very far',
      burden: 'two-handed',
      damageTier1Dice: 'd8', damageTier1Modifier: 3,
      damageTier2Dice: 'd8', damageTier2Modifier: 6,
      damageTier3Dice: 'd8', damageTier3Modifier: 9,
      damageTier4Dice: 'd8', damageTier4Modifier: 12,
      features: ['cumbersome']
    }
  },
  // TIER 1 - Primary Magical
  {
    name: 'Arcane Gauntlets',
    type: 'weapon',
    description: 'Magical gauntlets that channel arcane energy.',
    systemData: {
      classification: 'primary',
      damageType: 'magical',
      trait: 'strength',
      range: 'melee',
      burden: 'two-handed',
      damageTier1Dice: 'd10', damageTier1Modifier: 3,
      damageTier2Dice: 'd10', damageTier2Modifier: 6,
      damageTier3Dice: 'd10', damageTier3Modifier: 9,
      damageTier4Dice: 'd10', damageTier4Modifier: 12,
      features: []
    }
  },
  {
    name: 'Hallowed Axe',
    type: 'weapon',
    description: 'A blessed axe that deals magical damage.',
    systemData: {
      classification: 'primary',
      damageType: 'magical',
      trait: 'strength',
      range: 'melee',
      burden: 'one-handed',
      damageTier1Dice: 'd8', damageTier1Modifier: 1,
      damageTier2Dice: 'd8', damageTier2Modifier: 4,
      damageTier3Dice: 'd8', damageTier3Modifier: 7,
      damageTier4Dice: 'd8', damageTier4Modifier: 10,
      features: []
    }
  },
  {
    name: 'Glowing Rings',
    type: 'weapon',
    description: 'Magical rings that project energy.',
    systemData: {
      classification: 'primary',
      damageType: 'magical',
      trait: 'agility',
      range: 'very close',
      burden: 'two-handed',
      damageTier1Dice: 'd10', damageTier1Modifier: 2,
      damageTier2Dice: 'd10', damageTier2Modifier: 5,
      damageTier3Dice: 'd10', damageTier3Modifier: 8,
      damageTier4Dice: 'd10', damageTier4Modifier: 11,
      features: []
    }
  },
  {
    name: 'Hand Runes',
    type: 'weapon',
    description: 'Magical runes inscribed on the hands.',
    systemData: {
      classification: 'primary',
      damageType: 'magical',
      trait: 'instinct',
      range: 'very close',
      burden: 'one-handed',
      damageTier1Dice: 'd10', damageTier1Modifier: 0,
      damageTier2Dice: 'd10', damageTier2Modifier: 3,
      damageTier3Dice: 'd10', damageTier3Modifier: 6,
      damageTier4Dice: 'd10', damageTier4Modifier: 9,
      features: []
    }
  },
  {
    name: 'Returning Blade',
    type: 'weapon',
    description: 'A magical blade that returns to your hand after throwing.',
    systemData: {
      classification: 'primary',
      damageType: 'magical',
      trait: 'finesse',
      range: 'close',
      burden: 'one-handed',
      damageTier1Dice: 'd8', damageTier1Modifier: 0,
      damageTier2Dice: 'd8', damageTier2Modifier: 3,
      damageTier3Dice: 'd8', damageTier3Modifier: 6,
      damageTier4Dice: 'd8', damageTier4Modifier: 9,
      features: []
    }
  },
  {
    name: 'Shortstaff',
    type: 'weapon',
    description: 'A compact magical staff.',
    systemData: {
      classification: 'primary',
      damageType: 'magical',
      trait: 'instinct',
      range: 'close',
      burden: 'one-handed',
      damageTier1Dice: 'd8', damageTier1Modifier: 1,
      damageTier2Dice: 'd8', damageTier2Modifier: 4,
      damageTier3Dice: 'd8', damageTier3Modifier: 7,
      damageTier4Dice: 'd8', damageTier4Modifier: 10,
      features: []
    }
  },
  {
    name: 'Dualstaff',
    type: 'weapon',
    description: 'A two-handed magical staff for ranged attacks.',
    systemData: {
      classification: 'primary',
      damageType: 'magical',
      trait: 'instinct',
      range: 'far',
      burden: 'two-handed',
      damageTier1Dice: 'd6', damageTier1Modifier: 3,
      damageTier2Dice: 'd6', damageTier2Modifier: 6,
      damageTier3Dice: 'd6', damageTier3Modifier: 9,
      damageTier4Dice: 'd6', damageTier4Modifier: 12,
      features: []
    }
  },
  {
    name: 'Scepter',
    type: 'weapon',
    description: 'A versatile magical focus. Can use Presence for melee attacks.',
    systemData: {
      classification: 'primary',
      damageType: 'magical',
      trait: 'presence',
      range: 'far',
      burden: 'one-handed',
      damageTier1Dice: 'd6', damageTier1Modifier: 0,
      damageTier2Dice: 'd6', damageTier2Modifier: 3,
      damageTier3Dice: 'd6', damageTier3Modifier: 6,
      damageTier4Dice: 'd6', damageTier4Modifier: 9,
      features: ['versatile']
    }
  },
  {
    name: 'Wand',
    type: 'weapon',
    description: 'A classic magical focus.',
    systemData: {
      classification: 'primary',
      damageType: 'magical',
      trait: 'knowledge',
      range: 'far',
      burden: 'one-handed',
      damageTier1Dice: 'd6', damageTier1Modifier: 1,
      damageTier2Dice: 'd6', damageTier2Modifier: 4,
      damageTier3Dice: 'd6', damageTier3Modifier: 7,
      damageTier4Dice: 'd6', damageTier4Modifier: 10,
      features: []
    }
  },
  {
    name: 'Greatstaff',
    type: 'weapon',
    description: 'A powerful magical staff. Roll extra die, discard lowest.',
    systemData: {
      classification: 'primary',
      damageType: 'magical',
      trait: 'knowledge',
      range: 'very far',
      burden: 'two-handed',
      damageTier1Dice: 'd6', damageTier1Modifier: 0,
      damageTier2Dice: 'd6', damageTier2Modifier: 3,
      damageTier3Dice: 'd6', damageTier3Modifier: 6,
      damageTier4Dice: 'd6', damageTier4Modifier: 9,
      features: ['powerful']
    }
  },
  // TIER 1 - Secondary Physical
  {
    name: 'Shortsword',
    type: 'weapon',
    description: 'A secondary blade. +2 to primary weapon damage when paired.',
    systemData: {
      classification: 'secondary',
      damageType: 'physical',
      trait: 'agility',
      range: 'melee',
      burden: 'one-handed',
      damageTier1Dice: 'd8', damageTier1Modifier: 0,
      damageTier2Dice: 'd8', damageTier2Modifier: 3,
      damageTier3Dice: 'd8', damageTier3Modifier: 6,
      damageTier4Dice: 'd8', damageTier4Modifier: 9,
      features: ['paired']
    }
  },
  {
    name: 'Round Shield',
    type: 'weapon',
    description: 'A defensive shield. +1 to Armor Score.',
    systemData: {
      classification: 'secondary',
      damageType: 'physical',
      trait: 'strength',
      range: 'melee',
      burden: 'one-handed',
      damageTier1Dice: 'd4', damageTier1Modifier: 0,
      damageTier2Dice: 'd4', damageTier2Modifier: 2,
      damageTier3Dice: 'd4', damageTier3Modifier: 4,
      damageTier4Dice: 'd4', damageTier4Modifier: 6,
      features: ['protective']
    }
  },
  {
    name: 'Tower Shield',
    type: 'weapon',
    description: 'A large defensive shield. +2 to Armor Score, -1 to Evasion.',
    systemData: {
      classification: 'secondary',
      damageType: 'physical',
      trait: 'strength',
      range: 'melee',
      burden: 'one-handed',
      damageTier1Dice: 'd6', damageTier1Modifier: 0,
      damageTier2Dice: 'd6', damageTier2Modifier: 2,
      damageTier3Dice: 'd6', damageTier3Modifier: 4,
      damageTier4Dice: 'd6', damageTier4Modifier: 6,
      features: ['barrier']
    }
  },
  {
    name: 'Small Dagger',
    type: 'weapon',
    description: 'A concealed blade. +2 to primary weapon damage when paired.',
    systemData: {
      classification: 'secondary',
      damageType: 'physical',
      trait: 'finesse',
      range: 'melee',
      burden: 'one-handed',
      damageTier1Dice: 'd8', damageTier1Modifier: 0,
      damageTier2Dice: 'd8', damageTier2Modifier: 3,
      damageTier3Dice: 'd8', damageTier3Modifier: 6,
      damageTier4Dice: 'd8', damageTier4Modifier: 9,
      features: ['paired']
    }
  },
  {
    name: 'Whip',
    type: 'weapon',
    description: 'A reach weapon that can push enemies back.',
    systemData: {
      classification: 'secondary',
      damageType: 'physical',
      trait: 'presence',
      range: 'very close',
      burden: 'one-handed',
      damageTier1Dice: 'd6', damageTier1Modifier: 0,
      damageTier2Dice: 'd6', damageTier2Modifier: 2,
      damageTier3Dice: 'd6', damageTier3Modifier: 4,
      damageTier4Dice: 'd6', damageTier4Modifier: 6,
      features: ['startling']
    }
  },
  {
    name: 'Grappler',
    type: 'weapon',
    description: 'A hooked weapon that can pull targets into melee.',
    systemData: {
      classification: 'secondary',
      damageType: 'physical',
      trait: 'finesse',
      range: 'close',
      burden: 'one-handed',
      damageTier1Dice: 'd6', damageTier1Modifier: 0,
      damageTier2Dice: 'd6', damageTier2Modifier: 2,
      damageTier3Dice: 'd6', damageTier3Modifier: 4,
      damageTier4Dice: 'd6', damageTier4Modifier: 6,
      features: ['hooked']
    }
  },
  {
    name: 'Hand Crossbow',
    type: 'weapon',
    description: 'A compact ranged secondary weapon.',
    systemData: {
      classification: 'secondary',
      damageType: 'physical',
      trait: 'finesse',
      range: 'far',
      burden: 'one-handed',
      damageTier1Dice: 'd6', damageTier1Modifier: 1,
      damageTier2Dice: 'd6', damageTier2Modifier: 4,
      damageTier3Dice: 'd6', damageTier3Modifier: 7,
      damageTier4Dice: 'd6', damageTier4Modifier: 10,
      features: []
    }
  }
];

// ============================================
// ARMOR
// ============================================

export const DAGGERHEART_ARMOR = [
  // TIER 1
  {
    name: 'Gambeson Armor',
    type: 'armor',
    description: 'Flexible padded armor. +1 to Evasion.',
    systemData: {
      armorScore: 3,
      armorSlots: 6,
      tier: 1,
      thresholds: { minor: 5, major: 11 },
      features: ['flexible']
    }
  },
  {
    name: 'Leather Armor',
    type: 'armor',
    description: 'Standard leather protection.',
    systemData: {
      armorScore: 3,
      armorSlots: 6,
      tier: 1,
      thresholds: { minor: 6, major: 13 },
      features: []
    }
  },
  {
    name: 'Chainmail Armor',
    type: 'armor',
    description: 'Heavy metal rings. -1 to Evasion.',
    systemData: {
      armorScore: 4,
      armorSlots: 6,
      tier: 1,
      thresholds: { minor: 7, major: 15 },
      features: ['heavy']
    }
  },
  {
    name: 'Full Plate Armor',
    type: 'armor',
    description: 'Very heavy armor. -2 to Evasion, -1 to Agility.',
    systemData: {
      armorScore: 4,
      armorSlots: 6,
      tier: 1,
      thresholds: { minor: 8, major: 17 },
      features: ['very-heavy']
    }
  },
  // TIER 2
  {
    name: 'Improved Gambeson',
    type: 'armor',
    description: 'Enhanced flexible armor. +1 to Evasion.',
    systemData: {
      armorScore: 4,
      armorSlots: 6,
      tier: 2,
      thresholds: { minor: 7, major: 16 },
      features: ['flexible']
    }
  },
  {
    name: 'Improved Leather',
    type: 'armor',
    description: 'Enhanced leather protection.',
    systemData: {
      armorScore: 4,
      armorSlots: 6,
      tier: 2,
      thresholds: { minor: 9, major: 20 },
      features: []
    }
  },
  {
    name: 'Improved Chainmail',
    type: 'armor',
    description: 'Enhanced chainmail. -1 to Evasion.',
    systemData: {
      armorScore: 5,
      armorSlots: 6,
      tier: 2,
      thresholds: { minor: 11, major: 24 },
      features: ['heavy']
    }
  },
  {
    name: 'Improved Full Plate',
    type: 'armor',
    description: 'Enhanced full plate. -2 to Evasion, -1 to Agility.',
    systemData: {
      armorScore: 5,
      armorSlots: 6,
      tier: 2,
      thresholds: { minor: 13, major: 28 },
      features: ['very-heavy']
    }
  },
  {
    name: 'Elundrian Chain',
    type: 'armor',
    description: 'Magical armor that reduces incoming magic damage by armor score.',
    systemData: {
      armorScore: 4,
      armorSlots: 6,
      tier: 2,
      thresholds: { minor: 9, major: 21 },
      features: []
    }
  },
  {
    name: 'Harrowbone Armor',
    type: 'armor',
    description: 'Roll d6 on final slot; result of 6 reduces severity.',
    systemData: {
      armorScore: 4,
      armorSlots: 6,
      tier: 2,
      thresholds: { minor: 9, major: 21 },
      features: []
    }
  },
  {
    name: 'Irontree Breastplate',
    type: 'armor',
    description: 'When marking final slot, damage thresholds increase by +2.',
    systemData: {
      armorScore: 4,
      armorSlots: 6,
      tier: 2,
      thresholds: { minor: 9, major: 20 },
      features: []
    }
  },
  {
    name: 'Rosewild Armor',
    type: 'armor',
    description: 'Mark Armor Slot instead of spending Hope.',
    systemData: {
      armorScore: 5,
      armorSlots: 6,
      tier: 2,
      thresholds: { minor: 11, major: 23 },
      features: []
    }
  },
  // TIER 3
  {
    name: 'Advanced Gambeson',
    type: 'armor',
    description: 'High-quality flexible armor. +1 to Evasion.',
    systemData: {
      armorScore: 5,
      armorSlots: 6,
      tier: 3,
      thresholds: { minor: 9, major: 23 },
      features: ['flexible']
    }
  },
  {
    name: 'Advanced Leather',
    type: 'armor',
    description: 'High-quality leather protection.',
    systemData: {
      armorScore: 5,
      armorSlots: 6,
      tier: 3,
      thresholds: { minor: 11, major: 27 },
      features: []
    }
  },
  {
    name: 'Advanced Chainmail',
    type: 'armor',
    description: 'High-quality chainmail. -1 to Evasion.',
    systemData: {
      armorScore: 6,
      armorSlots: 6,
      tier: 3,
      thresholds: { minor: 13, major: 31 },
      features: ['heavy']
    }
  },
  {
    name: 'Advanced Full Plate',
    type: 'armor',
    description: 'High-quality full plate. -2 to Evasion, -1 to Agility.',
    systemData: {
      armorScore: 6,
      armorSlots: 6,
      tier: 3,
      thresholds: { minor: 15, major: 35 },
      features: ['very-heavy']
    }
  },
  {
    name: 'Dragonscale Armor',
    type: 'armor',
    description: 'Once per rest, mark Stress instead of final HP.',
    systemData: {
      armorScore: 5,
      armorSlots: 6,
      tier: 3,
      thresholds: { minor: 11, major: 27 },
      features: []
    }
  },
  // TIER 4
  {
    name: 'Legendary Gambeson',
    type: 'armor',
    description: 'Masterwork flexible armor. +1 to Evasion.',
    systemData: {
      armorScore: 6,
      armorSlots: 6,
      tier: 4,
      thresholds: { minor: 11, major: 32 },
      features: ['flexible']
    }
  },
  {
    name: 'Legendary Leather',
    type: 'armor',
    description: 'Masterwork leather protection.',
    systemData: {
      armorScore: 6,
      armorSlots: 6,
      tier: 4,
      thresholds: { minor: 13, major: 36 },
      features: []
    }
  },
  {
    name: 'Legendary Chainmail',
    type: 'armor',
    description: 'Masterwork chainmail. -1 to Evasion.',
    systemData: {
      armorScore: 7,
      armorSlots: 6,
      tier: 4,
      thresholds: { minor: 15, major: 40 },
      features: ['heavy']
    }
  },
  {
    name: 'Legendary Full Plate',
    type: 'armor',
    description: 'Masterwork full plate. -2 to Evasion, -1 to Agility.',
    systemData: {
      armorScore: 7,
      armorSlots: 6,
      tier: 4,
      thresholds: { minor: 17, major: 44 },
      features: ['very-heavy']
    }
  },
  {
    name: 'Savior Chainmail',
    type: 'armor',
    description: 'Ultimate protection. -1 to all traits and Evasion.',
    systemData: {
      armorScore: 8,
      armorSlots: 6,
      tier: 4,
      thresholds: { minor: 18, major: 48 },
      features: []
    }
  }
];

// ============================================
// EQUIPMENT & CONSUMABLES
// ============================================

export const DAGGERHEART_EQUIPMENT = [
  // EQUIPMENT
  {
    name: 'Premium Bedroll',
    type: 'equipment',
    description: 'A comfortable bedroll for rest. During downtime, you automatically clear a Stress.',
    systemData: {
      category: 'utility',
      mechanicalEffect: 'During downtime, automatically clear 1 Stress.',
      activation: 'passive',
      uses: -1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Piper Whistle',
    type: 'equipment',
    description: 'A handcrafted whistle. Sound audible within 1-mile radius.',
    systemData: {
      category: 'utility',
      mechanicalEffect: 'Sound is audible within 1-mile radius.',
      activation: 'action',
      uses: -1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Charging Quiver',
    type: 'equipment',
    description: 'Magical arrow storage. Bonus damage equal to current tier on successful hits.',
    systemData: {
      category: 'weapon-enhancement',
      mechanicalEffect: 'Add bonus damage equal to your tier on successful ranged attacks.',
      activation: 'passive',
      uses: -1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: "Alistair's Torch",
    type: 'equipment',
    description: 'A reusable magical light source that illuminates large areas like daylight.',
    systemData: {
      category: 'utility',
      mechanicalEffect: 'Illuminates large areas like daylight. Reusable.',
      activation: 'action',
      uses: -1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Speaking Orbs',
    type: 'equipment',
    description: 'A pair of magical orbs for long-distance communication across any distance.',
    systemData: {
      category: 'utility',
      mechanicalEffect: 'Long-distance communication between paired orbs.',
      activation: 'action',
      uses: -1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Skeleton Key',
    type: 'equipment',
    description: 'Grants advantage on Finesse Rolls for opening doors.',
    systemData: {
      category: 'utility',
      mechanicalEffect: 'Advantage on Finesse Rolls for doors.',
      activation: 'passive',
      uses: -1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Gecko Gloves',
    type: 'equipment',
    description: 'Enables vertical climbing and ceiling traversal.',
    systemData: {
      category: 'utility',
      mechanicalEffect: 'Can climb vertical surfaces and traverse ceilings.',
      activation: 'passive',
      uses: -1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Ring of Silence',
    type: 'equipment',
    description: 'Spend Hope for silent footsteps until next rest.',
    systemData: {
      category: 'magic-item',
      mechanicalEffect: 'Silent footsteps until next rest.',
      activation: 'action',
      uses: -1,
      hopeCost: 1,
      stressCost: 0
    }
  },
  {
    name: 'Infinite Bag',
    type: 'equipment',
    description: 'An interdimensional bag with unlimited storage space.',
    systemData: {
      category: 'utility',
      mechanicalEffect: 'Unlimited storage space for items.',
      activation: 'passive',
      uses: -1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Hopekeeper Locket',
    type: 'equipment',
    description: 'Store excess Hope in the locket; retrieve when depleted.',
    systemData: {
      category: 'magic-item',
      mechanicalEffect: 'Store and retrieve Hope.',
      activation: 'action',
      uses: -1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  // RELICS
  {
    name: 'Stride Relic',
    type: 'equipment',
    description: '+1 bonus to your Agility. One relic per character.',
    systemData: {
      category: 'relic',
      mechanicalEffect: '+1 to Agility.',
      activation: 'passive',
      uses: -1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Bolster Relic',
    type: 'equipment',
    description: '+1 bonus to your Strength. One relic per character.',
    systemData: {
      category: 'relic',
      mechanicalEffect: '+1 to Strength.',
      activation: 'passive',
      uses: -1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Control Relic',
    type: 'equipment',
    description: '+1 bonus to your Finesse. One relic per character.',
    systemData: {
      category: 'relic',
      mechanicalEffect: '+1 to Finesse.',
      activation: 'passive',
      uses: -1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Attune Relic',
    type: 'equipment',
    description: '+1 bonus to your Instinct. One relic per character.',
    systemData: {
      category: 'relic',
      mechanicalEffect: '+1 to Instinct.',
      activation: 'passive',
      uses: -1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Charm Relic',
    type: 'equipment',
    description: '+1 bonus to your Presence. One relic per character.',
    systemData: {
      category: 'relic',
      mechanicalEffect: '+1 to Presence.',
      activation: 'passive',
      uses: -1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Enlighten Relic',
    type: 'equipment',
    description: '+1 bonus to your Knowledge. One relic per character.',
    systemData: {
      category: 'relic',
      mechanicalEffect: '+1 to Knowledge.',
      activation: 'passive',
      uses: -1,
      hopeCost: 0,
      stressCost: 0
    }
  }
];

export const DAGGERHEART_CONSUMABLES = [
  // POTIONS
  {
    name: 'Minor Health Potion',
    type: 'equipment',
    description: 'Clear 1d4 HP.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: 'Clear 1d4 HP.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Minor Stamina Potion',
    type: 'equipment',
    description: 'Clear 1d4 Stress.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: 'Clear 1d4 Stress.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Health Potion',
    type: 'equipment',
    description: 'Clear 1d4+1 HP.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: 'Clear 1d4+1 HP.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Stamina Potion',
    type: 'equipment',
    description: 'Clear 1d4+1 Stress.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: 'Clear 1d4+1 Stress.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Major Health Potion',
    type: 'equipment',
    description: 'Clear 1d4+2 HP.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: 'Clear 1d4+2 HP.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Major Stamina Potion',
    type: 'equipment',
    description: 'Clear 1d4+2 Stress.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: 'Clear 1d4+2 Stress.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Varik Leaves',
    type: 'equipment',
    description: 'Gain 2 Hope immediately.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: 'Gain 2 Hope.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Stride Potion',
    type: 'equipment',
    description: '+1 bonus to your next Agility Roll.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: '+1 to next Agility Roll.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Bolster Potion',
    type: 'equipment',
    description: '+1 bonus to your next Strength Roll.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: '+1 to next Strength Roll.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Control Potion',
    type: 'equipment',
    description: '+1 bonus to your next Finesse Roll.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: '+1 to next Finesse Roll.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Attune Potion',
    type: 'equipment',
    description: '+1 bonus to your next Instinct Roll.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: '+1 to next Instinct Roll.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Charm Potion',
    type: 'equipment',
    description: '+1 bonus to your next Presence Roll.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: '+1 to next Presence Roll.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Enlighten Potion',
    type: 'equipment',
    description: '+1 bonus to your next Knowledge Roll.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: '+1 to next Knowledge Roll.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Grindeltooth Venom',
    type: 'equipment',
    description: 'Add a d6 to your next damage roll with that weapon.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: '+d6 to next damage roll.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Vial of Moondrip',
    type: 'equipment',
    description: 'See in total darkness until your next rest.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: 'Darkvision until next rest.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Unstable Arcane Shard',
    type: 'equipment',
    description: '1d20 magic damage within Far range via Finesse Roll.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: '1d20 magic damage, Far range.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Vial of Darksmoke',
    type: 'equipment',
    description: 'Roll d6s equal to Agility, add highest to Evasion.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: 'Roll d6s equal to Agility, add highest to Evasion.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Jumping Root',
    type: 'equipment',
    description: 'Leap up to Far range without rolling.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: 'Leap up to Far range without rolling.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Feast of Xurla',
    type: 'equipment',
    description: 'Clear all HP and Stress, gain 1d4 Hope.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: 'Clear all HP/Stress, gain 1d4 Hope.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  },
  {
    name: 'Sleeping Sap',
    type: 'equipment',
    description: 'Instant full rest, clearing all Stress.',
    systemData: {
      category: 'consumable',
      mechanicalEffect: 'Instant full rest.',
      activation: 'action',
      uses: 1,
      hopeCost: 0,
      stressCost: 0
    }
  }
];

// Combined export for easy access
export const ALL_DAGGERHEART_ITEMS = [
  ...DAGGERHEART_WEAPONS,
  ...DAGGERHEART_ARMOR,
  ...DAGGERHEART_EQUIPMENT,
  ...DAGGERHEART_CONSUMABLES
];

// Get items by type
export const getItemsByType = (type) => {
  switch (type) {
    case 'weapon': return DAGGERHEART_WEAPONS;
    case 'armor': return DAGGERHEART_ARMOR;
    case 'equipment': return [...DAGGERHEART_EQUIPMENT, ...DAGGERHEART_CONSUMABLES];
    default: return ALL_DAGGERHEART_ITEMS;
  }
};
