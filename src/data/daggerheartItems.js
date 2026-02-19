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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'primary',
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
      tier: 1, classification: 'secondary',
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
      tier: 1, classification: 'secondary',
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
      tier: 1, classification: 'secondary',
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
      tier: 1, classification: 'secondary',
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
      tier: 1, classification: 'secondary',
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
      tier: 1, classification: 'secondary',
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
      tier: 1, classification: 'secondary',
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
  // ============================================
  // COMBAT WHEELCHAIRS (Base weapons - scale across tiers)
  // ============================================
  {
    name: 'Light-Frame Wheelchair',
    type: 'weapon',
    description: 'A light combat wheelchair for acrobatic movement. When you make an attack, you can mark a Stress to target another creature within range.',
    systemData: {
      tier: 1, classification: 'primary', damageType: 'physical', trait: 'agility',
      range: 'melee', burden: 'one-handed',
      damageTier1Dice: 'd8', damageTier1Modifier: 0,
      damageTier2Dice: 'd8', damageTier2Modifier: 3,
      damageTier3Dice: 'd8', damageTier3Modifier: 6,
      damageTier4Dice: 'd8', damageTier4Modifier: 9,
      features: ['quick']
    }
  },
  {
    name: 'Heavy-Frame Wheelchair',
    type: 'weapon',
    description: 'A heavy combat wheelchair that lends its weight to attacks. -1 to Evasion.',
    systemData: {
      tier: 1, classification: 'primary', damageType: 'physical', trait: 'strength',
      range: 'melee', burden: 'two-handed',
      damageTier1Dice: 'd12', damageTier1Modifier: 3,
      damageTier2Dice: 'd12', damageTier2Modifier: 6,
      damageTier3Dice: 'd12', damageTier3Modifier: 9,
      damageTier4Dice: 'd12', damageTier4Modifier: 12,
      features: ['heavy']
    }
  },
  {
    name: 'Arcane-Frame Wheelchair',
    type: 'weapon',
    description: 'A wheelchair attuned to magic, channeling spells through the chair. +1 to attack rolls. Use your Spellcast trait for attacks.',
    systemData: {
      tier: 1, classification: 'primary', damageType: 'magical', trait: 'instinct',
      range: 'far', burden: 'one-handed',
      damageTier1Dice: 'd6', damageTier1Modifier: 0,
      damageTier2Dice: 'd6', damageTier2Modifier: 3,
      damageTier3Dice: 'd6', damageTier3Modifier: 6,
      damageTier4Dice: 'd6', damageTier4Modifier: 9,
      features: ['reliable']
    }
  },
  // ============================================
  // TIER 2 - UNIQUE PRIMARY PHYSICAL WEAPONS
  // ============================================
  {
    name: 'Gilded Falchion', type: 'weapon',
    description: 'A gilded blade of great power. On a successful attack, roll an additional damage die and discard the lowest result.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'strength', range: 'melee', burden: 'one-handed', tier: 2,
      damageTier1Dice: 'd10', damageTier1Modifier: 4, damageTier2Dice: 'd10', damageTier2Modifier: 4, damageTier3Dice: 'd10', damageTier3Modifier: 4, damageTier4Dice: 'd10', damageTier4Modifier: 4, features: ['powerful']
    }
  },
  {
    name: 'Knuckle Blades', type: 'weapon',
    description: 'Vicious bladed knuckles. When you roll the maximum value on a damage die, roll an additional damage die.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'strength', range: 'melee', burden: 'two-handed', tier: 2,
      damageTier1Dice: 'd10', damageTier1Modifier: 6, damageTier2Dice: 'd10', damageTier2Modifier: 6, damageTier3Dice: 'd10', damageTier3Modifier: 6, damageTier4Dice: 'd10', damageTier4Modifier: 6, features: ['brutal']
    }
  },
  {
    name: 'Urok Broadsword', type: 'weapon',
    description: 'A precise Urok-forged blade. When you deal Severe damage, the target must mark an additional HP.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'finesse', range: 'melee', burden: 'one-handed', tier: 2,
      damageTier1Dice: 'd8', damageTier1Modifier: 3, damageTier2Dice: 'd8', damageTier2Modifier: 3, damageTier3Dice: 'd8', damageTier3Modifier: 3, damageTier4Dice: 'd8', damageTier4Modifier: 3, features: ['deadly']
    }
  },
  {
    name: 'Bladed Whip', type: 'weapon',
    description: 'A bladed whip. When you make an attack, you can mark a Stress to target another creature within range.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'agility', range: 'very close', burden: 'one-handed', tier: 2,
      damageTier1Dice: 'd8', damageTier1Modifier: 3, damageTier2Dice: 'd8', damageTier2Modifier: 3, damageTier3Dice: 'd8', damageTier3Modifier: 3, damageTier4Dice: 'd8', damageTier4Modifier: 3, features: ['quick']
    }
  },
  {
    name: 'Steelforged Halberd', type: 'weapon',
    description: 'A steelforged halberd. On a successful attack, the target must mark a Stress.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'strength', range: 'very close', burden: 'two-handed', tier: 2,
      damageTier1Dice: 'd8', damageTier1Modifier: 4, damageTier2Dice: 'd8', damageTier2Modifier: 4, damageTier3Dice: 'd8', damageTier3Modifier: 4, damageTier4Dice: 'd8', damageTier4Modifier: 4, features: ['scary']
    }
  },
  {
    name: 'War Scythe', type: 'weapon',
    description: 'A deadly war scythe. +1 to attack rolls.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'finesse', range: 'very close', burden: 'two-handed', tier: 2,
      damageTier1Dice: 'd8', damageTier1Modifier: 5, damageTier2Dice: 'd8', damageTier2Modifier: 5, damageTier3Dice: 'd8', damageTier3Modifier: 5, damageTier4Dice: 'd8', damageTier4Modifier: 5, features: ['reliable']
    }
  },
  {
    name: 'Blunderbuss', type: 'weapon',
    description: 'A powerful close-range firearm. After you make an attack, roll a d6. On a 1, mark a Stress to reload.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'finesse', range: 'close', burden: 'two-handed', tier: 2,
      damageTier1Dice: 'd8', damageTier1Modifier: 6, damageTier2Dice: 'd8', damageTier2Modifier: 6, damageTier3Dice: 'd8', damageTier3Modifier: 6, damageTier4Dice: 'd8', damageTier4Modifier: 6, features: ['reloading']
    }
  },
  {
    name: 'Greatbow', type: 'weapon',
    description: 'A massive bow requiring great strength. On a successful attack, roll an additional damage die and discard the lowest.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'strength', range: 'far', burden: 'two-handed', tier: 2,
      damageTier1Dice: 'd6', damageTier1Modifier: 6, damageTier2Dice: 'd6', damageTier2Modifier: 6, damageTier3Dice: 'd6', damageTier3Modifier: 6, damageTier4Dice: 'd6', damageTier4Modifier: 6, features: ['powerful']
    }
  },
  {
    name: 'Finehair Bow', type: 'weapon',
    description: 'An exquisitely crafted bow. +1 to attack rolls.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'agility', range: 'very far', burden: 'two-handed', tier: 2,
      damageTier1Dice: 'd6', damageTier1Modifier: 5, damageTier2Dice: 'd6', damageTier2Modifier: 5, damageTier3Dice: 'd6', damageTier3Modifier: 5, damageTier4Dice: 'd6', damageTier4Modifier: 5, features: ['reliable']
    }
  },
  // TIER 2 - UNIQUE PRIMARY MAGIC WEAPONS
  {
    name: 'Ego Blade', type: 'weapon',
    description: 'A blade that feeds on ego. You must have a Presence of 0 or lower to use this weapon.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'agility', range: 'melee', burden: 'one-handed', tier: 2,
      damageTier1Dice: 'd12', damageTier1Modifier: 4, damageTier2Dice: 'd12', damageTier2Modifier: 4, damageTier3Dice: 'd12', damageTier3Modifier: 4, damageTier4Dice: 'd12', damageTier4Modifier: 4, features: ['pompous']
    }
  },
  {
    name: 'Casting Sword', type: 'weapon',
    description: 'A sword that channels magic. Can also be used with Knowledge, Far, d6+3.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'strength', range: 'melee', burden: 'two-handed', tier: 2,
      damageTier1Dice: 'd10', damageTier1Modifier: 4, damageTier2Dice: 'd10', damageTier2Modifier: 4, damageTier3Dice: 'd10', damageTier3Modifier: 4, damageTier4Dice: 'd10', damageTier4Modifier: 4, features: ['versatile']
    }
  },
  {
    name: 'Devouring Dagger', type: 'weapon',
    description: 'A dagger that devours hope. On a successful attack, the target must mark a Stress.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'finesse', range: 'melee', burden: 'one-handed', tier: 2,
      damageTier1Dice: 'd8', damageTier1Modifier: 4, damageTier2Dice: 'd8', damageTier2Modifier: 4, damageTier3Dice: 'd8', damageTier3Modifier: 4, damageTier4Dice: 'd8', damageTier4Modifier: 4, features: ['scary']
    }
  },
  {
    name: 'Hammer of Exota', type: 'weapon',
    description: 'A hammer that erupts with energy. On a successful melee attack, all other adversaries within Very Close range must succeed on a reaction roll (14) or take half damage.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'instinct', range: 'melee', burden: 'two-handed', tier: 2,
      damageTier1Dice: 'd8', damageTier1Modifier: 6, damageTier2Dice: 'd8', damageTier2Modifier: 6, damageTier3Dice: 'd8', damageTier3Modifier: 6, damageTier4Dice: 'd8', damageTier4Modifier: 6, features: ['eruptive']
    }
  },
  {
    name: 'Yutari Bloodbow', type: 'weapon',
    description: 'A blood-red bow. When you roll the maximum value on a damage die, roll an additional damage die.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'finesse', range: 'far', burden: 'two-handed', tier: 2,
      damageTier1Dice: 'd6', damageTier1Modifier: 4, damageTier2Dice: 'd6', damageTier2Modifier: 4, damageTier3Dice: 'd6', damageTier3Modifier: 4, damageTier4Dice: 'd6', damageTier4Modifier: 4, features: ['brutal']
    }
  },
  {
    name: 'Elder Bow', type: 'weapon',
    description: 'An ancient magical bow. On a successful attack, roll an additional damage die and discard the lowest result.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'instinct', range: 'far', burden: 'two-handed', tier: 2,
      damageTier1Dice: 'd6', damageTier1Modifier: 4, damageTier2Dice: 'd6', damageTier2Modifier: 4, damageTier3Dice: 'd6', damageTier3Modifier: 4, damageTier4Dice: 'd6', damageTier4Modifier: 4, features: ['powerful']
    }
  },
  {
    name: 'Scepter of Elias', type: 'weapon',
    description: 'A scepter that invigorates. On a successful attack, roll a d4. On a 4, clear a Stress.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'presence', range: 'far', burden: 'one-handed', tier: 2,
      damageTier1Dice: 'd6', damageTier1Modifier: 3, damageTier2Dice: 'd6', damageTier2Modifier: 3, damageTier3Dice: 'd6', damageTier3Modifier: 3, damageTier4Dice: 'd6', damageTier4Modifier: 3, features: ['invigorating']
    }
  },
  {
    name: 'Wand of Enthrallment', type: 'weapon',
    description: 'A wand of persuasion. Before a Presence Roll, mark a Stress to gain +2 bonus to the result.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'presence', range: 'far', burden: 'one-handed', tier: 2,
      damageTier1Dice: 'd6', damageTier1Modifier: 4, damageTier2Dice: 'd6', damageTier2Modifier: 4, damageTier3Dice: 'd6', damageTier3Modifier: 4, damageTier4Dice: 'd6', damageTier4Modifier: 4, features: ['persuasive']
    }
  },
  {
    name: "Keeper's Staff", type: 'weapon',
    description: 'A staff of ancient knowledge. +1 to attack rolls.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'knowledge', range: 'far', burden: 'two-handed', tier: 2,
      damageTier1Dice: 'd6', damageTier1Modifier: 4, damageTier2Dice: 'd6', damageTier2Modifier: 4, damageTier3Dice: 'd6', damageTier3Modifier: 4, damageTier4Dice: 'd6', damageTier4Modifier: 4, features: ['reliable']
    }
  },
  // TIER 2 - UNIQUE SECONDARY WEAPONS
  {
    name: 'Spiked Shield', type: 'weapon',
    description: 'A shield with spikes. +1 to Armor Score; +1 to primary weapon damage within Melee range.',
    systemData: {
      classification: 'secondary', damageType: 'physical', trait: 'strength', range: 'melee', burden: 'one-handed', tier: 2,
      damageTier1Dice: 'd6', damageTier1Modifier: 2, damageTier2Dice: 'd6', damageTier2Modifier: 2, damageTier3Dice: 'd6', damageTier3Modifier: 2, damageTier4Dice: 'd6', damageTier4Modifier: 2, features: ['double-duty']
    }
  },
  {
    name: 'Parrying Dagger', type: 'weapon',
    description: "A dagger for defense. When attacked, roll this weapon's damage dice to potentially discard matching attacker dice.",
    systemData: {
      classification: 'secondary', damageType: 'physical', trait: 'finesse', range: 'melee', burden: 'one-handed', tier: 2,
      damageTier1Dice: 'd6', damageTier1Modifier: 2, damageTier2Dice: 'd6', damageTier2Modifier: 2, damageTier3Dice: 'd6', damageTier3Modifier: 2, damageTier4Dice: 'd6', damageTier4Modifier: 2, features: ['parry']
    }
  },
  {
    name: 'Returning Axe', type: 'weapon',
    description: 'A throwing axe that returns to your hand immediately after the attack.',
    systemData: {
      classification: 'secondary', damageType: 'physical', trait: 'agility', range: 'close', burden: 'one-handed', tier: 2,
      damageTier1Dice: 'd6', damageTier1Modifier: 4, damageTier2Dice: 'd6', damageTier2Modifier: 4, damageTier3Dice: 'd6', damageTier3Modifier: 4, damageTier4Dice: 'd6', damageTier4Modifier: 4, features: ['returning']
    }
  },
  // ============================================
  // TIER 3 - UNIQUE PRIMARY PHYSICAL WEAPONS
  // ============================================
  {
    name: 'Flickerfly Blade', type: 'weapon',
    description: 'A blade with iridescent edges. Gain a bonus to your damage rolls equal to your Agility.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'agility', range: 'melee', burden: 'one-handed', tier: 3,
      damageTier1Dice: 'd8', damageTier1Modifier: 5, damageTier2Dice: 'd8', damageTier2Modifier: 5, damageTier3Dice: 'd8', damageTier3Modifier: 5, damageTier4Dice: 'd8', damageTier4Modifier: 5, features: ['sharpwing']
    }
  },
  {
    name: 'Bravesword', type: 'weapon',
    description: 'A sword of courage. -1 to Evasion; +3 to Severe damage threshold.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'strength', range: 'melee', burden: 'two-handed', tier: 3,
      damageTier1Dice: 'd12', damageTier1Modifier: 7, damageTier2Dice: 'd12', damageTier2Modifier: 7, damageTier3Dice: 'd12', damageTier3Modifier: 7, damageTier4Dice: 'd12', damageTier4Modifier: 7, features: ['brave']
    }
  },
  {
    name: 'Hammer of Wrath', type: 'weapon',
    description: 'A hammer of devastating power. Before you attack, mark a Stress to use a d20 as your damage die.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'strength', range: 'melee', burden: 'two-handed', tier: 3,
      damageTier1Dice: 'd10', damageTier1Modifier: 7, damageTier2Dice: 'd10', damageTier2Modifier: 7, damageTier3Dice: 'd10', damageTier3Modifier: 7, damageTier4Dice: 'd10', damageTier4Modifier: 7, features: ['devastating']
    }
  },
  {
    name: 'Labrys Axe', type: 'weapon',
    description: 'A protective double-headed axe. +1 to Armor Score.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'strength', range: 'melee', burden: 'two-handed', tier: 3,
      damageTier1Dice: 'd10', damageTier1Modifier: 7, damageTier2Dice: 'd10', damageTier2Modifier: 7, damageTier3Dice: 'd10', damageTier3Modifier: 7, damageTier4Dice: 'd10', damageTier4Modifier: 7, features: ['protective']
    }
  },
  {
    name: 'Meridian Cutlass', type: 'weapon',
    description: 'A cutlass for dueling. When no other creatures are within Close range of the target, gain advantage on your attack roll.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'presence', range: 'melee', burden: 'one-handed', tier: 3,
      damageTier1Dice: 'd10', damageTier1Modifier: 5, damageTier2Dice: 'd10', damageTier2Modifier: 5, damageTier3Dice: 'd10', damageTier3Modifier: 5, damageTier4Dice: 'd10', damageTier4Modifier: 5, features: ['dueling']
    }
  },
  {
    name: 'Retractable Saber', type: 'weapon',
    description: 'A saber with a retractable blade that can be hidden in the hilt to avoid detection.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'presence', range: 'melee', burden: 'one-handed', tier: 3,
      damageTier1Dice: 'd10', damageTier1Modifier: 7, damageTier2Dice: 'd10', damageTier2Modifier: 7, damageTier3Dice: 'd10', damageTier3Modifier: 7, damageTier4Dice: 'd10', damageTier4Modifier: 7, features: ['retractable']
    }
  },
  {
    name: 'Double Flail', type: 'weapon',
    description: 'A double-headed flail. On a successful attack, roll an additional damage die and discard the lowest result.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'agility', range: 'very close', burden: 'two-handed', tier: 3,
      damageTier1Dice: 'd10', damageTier1Modifier: 8, damageTier2Dice: 'd10', damageTier2Modifier: 8, damageTier3Dice: 'd10', damageTier3Modifier: 8, damageTier4Dice: 'd10', damageTier4Modifier: 8, features: ['powerful']
    }
  },
  {
    name: 'Talon Blades', type: 'weapon',
    description: 'Razor-sharp talon blades. When you roll the maximum value on a damage die, roll an additional damage die.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'finesse', range: 'close', burden: 'two-handed', tier: 3,
      damageTier1Dice: 'd10', damageTier1Modifier: 7, damageTier2Dice: 'd10', damageTier2Modifier: 7, damageTier3Dice: 'd10', damageTier3Modifier: 7, damageTier4Dice: 'd10', damageTier4Modifier: 7, features: ['brutal']
    }
  },
  {
    name: 'Black Powder Revolver', type: 'weapon',
    description: 'A black powder revolver. After an attack, roll a d6. On a 1, mark a Stress to reload.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'finesse', range: 'far', burden: 'one-handed', tier: 3,
      damageTier1Dice: 'd6', damageTier1Modifier: 8, damageTier2Dice: 'd6', damageTier2Modifier: 8, damageTier3Dice: 'd6', damageTier3Modifier: 8, damageTier4Dice: 'd6', damageTier4Modifier: 8, features: ['reloading']
    }
  },
  {
    name: 'Spiked Bow', type: 'weapon',
    description: 'A bow with spiked limbs. Can also be used with Agility, Melee, d10+5.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'agility', range: 'very far', burden: 'two-handed', tier: 3,
      damageTier1Dice: 'd6', damageTier1Modifier: 7, damageTier2Dice: 'd6', damageTier2Modifier: 7, damageTier3Dice: 'd6', damageTier3Modifier: 7, damageTier4Dice: 'd6', damageTier4Modifier: 7, features: ['versatile']
    }
  },
  // TIER 3 - UNIQUE PRIMARY MAGIC WEAPONS
  {
    name: 'Axe of Fortunis', type: 'weapon',
    description: 'A lucky axe. On a failed attack, you can mark a Stress to reroll your attack.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'strength', range: 'melee', burden: 'two-handed', tier: 3,
      damageTier1Dice: 'd10', damageTier1Modifier: 8, damageTier2Dice: 'd10', damageTier2Modifier: 8, damageTier3Dice: 'd10', damageTier3Modifier: 8, damageTier4Dice: 'd10', damageTier4Modifier: 8, features: ['lucky']
    }
  },
  {
    name: 'Blessed Anlace', type: 'weapon',
    description: 'A blessed short blade. During downtime, automatically clear a Hit Point.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'instinct', range: 'melee', burden: 'one-handed', tier: 3,
      damageTier1Dice: 'd10', damageTier1Modifier: 6, damageTier2Dice: 'd10', damageTier2Modifier: 6, damageTier3Dice: 'd10', damageTier3Modifier: 6, damageTier4Dice: 'd10', damageTier4Modifier: 6, features: ['healing']
    }
  },
  {
    name: 'Ghostblade', type: 'weapon',
    description: 'A spectral blade. On a successful attack, you can deal physical or magic damage.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'presence', range: 'melee', burden: 'one-handed', tier: 3,
      damageTier1Dice: 'd10', damageTier1Modifier: 7, damageTier2Dice: 'd10', damageTier2Modifier: 7, damageTier3Dice: 'd10', damageTier3Modifier: 7, damageTier4Dice: 'd10', damageTier4Modifier: 7, features: ['otherworldly']
    }
  },
  {
    name: 'Runes of Ruination', type: 'weapon',
    description: 'Destructive runes. Each time you make a successful attack, you must mark a Stress.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'knowledge', range: 'very close', burden: 'one-handed', tier: 3,
      damageTier1Dice: 'd20', damageTier1Modifier: 4, damageTier2Dice: 'd20', damageTier2Modifier: 4, damageTier3Dice: 'd20', damageTier3Modifier: 4, damageTier4Dice: 'd20', damageTier4Modifier: 4, features: ['painful']
    }
  },
  {
    name: 'Widogast Pendant', type: 'weapon',
    description: 'A time-warping pendant. You choose the target of your attack after making your attack roll.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'knowledge', range: 'close', burden: 'one-handed', tier: 3,
      damageTier1Dice: 'd10', damageTier1Modifier: 5, damageTier2Dice: 'd10', damageTier2Modifier: 5, damageTier3Dice: 'd10', damageTier3Modifier: 5, damageTier4Dice: 'd10', damageTier4Modifier: 5, features: ['timebending']
    }
  },
  {
    name: 'Gilded Bow', type: 'weapon',
    description: 'A self-correcting magical bow. When you roll a 1 on a damage die, it deals 6 damage instead.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'finesse', range: 'far', burden: 'two-handed', tier: 3,
      damageTier1Dice: 'd6', damageTier1Modifier: 7, damageTier2Dice: 'd6', damageTier2Modifier: 7, damageTier3Dice: 'd6', damageTier3Modifier: 7, damageTier4Dice: 'd6', damageTier4Modifier: 7, features: ['self-correcting']
    }
  },
  {
    name: 'Firestaff', type: 'weapon',
    description: 'A staff wreathed in flame. When you roll a 6 on a damage die, the target must mark a Stress.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'instinct', range: 'far', burden: 'two-handed', tier: 3,
      damageTier1Dice: 'd6', damageTier1Modifier: 7, damageTier2Dice: 'd6', damageTier2Modifier: 7, damageTier3Dice: 'd6', damageTier3Modifier: 7, damageTier4Dice: 'd6', damageTier4Modifier: 7, features: ['burning']
    }
  },
  {
    name: 'Mage Orb', type: 'weapon',
    description: 'A powerful magical orb. On a successful attack, roll an additional damage die and discard the lowest result.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'knowledge', range: 'far', burden: 'one-handed', tier: 3,
      damageTier1Dice: 'd6', damageTier1Modifier: 7, damageTier2Dice: 'd6', damageTier2Modifier: 7, damageTier3Dice: 'd6', damageTier3Modifier: 7, damageTier4Dice: 'd6', damageTier4Modifier: 7, features: ['powerful']
    }
  },
  {
    name: "Ilmari's Rifle", type: 'weapon',
    description: 'A magical rifle. After an attack, roll a d6. On a 1, mark a Stress to reload.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'finesse', range: 'very far', burden: 'one-handed', tier: 3,
      damageTier1Dice: 'd6', damageTier1Modifier: 6, damageTier2Dice: 'd6', damageTier2Modifier: 6, damageTier3Dice: 'd6', damageTier3Modifier: 6, damageTier4Dice: 'd6', damageTier4Modifier: 6, features: ['reloading']
    }
  },
  // TIER 3 - UNIQUE SECONDARY WEAPONS
  {
    name: 'Buckler', type: 'weapon',
    description: 'A small, agile shield. When attacked, mark an Armor Slot to gain a bonus to Evasion equal to your Armor Score.',
    systemData: {
      classification: 'secondary', damageType: 'physical', trait: 'agility', range: 'melee', burden: 'one-handed', tier: 3,
      damageTier1Dice: 'd4', damageTier1Modifier: 4, damageTier2Dice: 'd4', damageTier2Modifier: 4, damageTier3Dice: 'd4', damageTier3Modifier: 4, damageTier4Dice: 'd4', damageTier4Modifier: 4, features: ['deflecting']
    }
  },
  {
    name: 'Powered Gauntlet', type: 'weapon',
    description: 'A gauntlet charged with energy. Mark a Stress to gain +1 to Proficiency on a primary weapon attack.',
    systemData: {
      classification: 'secondary', damageType: 'physical', trait: 'knowledge', range: 'close', burden: 'one-handed', tier: 3,
      damageTier1Dice: 'd6', damageTier1Modifier: 4, damageTier2Dice: 'd6', damageTier2Modifier: 4, damageTier3Dice: 'd6', damageTier3Modifier: 4, damageTier4Dice: 'd6', damageTier4Modifier: 4, features: ['charged']
    }
  },
  {
    name: 'Hand Sling', type: 'weapon',
    description: 'A versatile hand sling. Can also be used with Finesse, Close, d8+4.',
    systemData: {
      classification: 'secondary', damageType: 'physical', trait: 'finesse', range: 'very far', burden: 'one-handed', tier: 3,
      damageTier1Dice: 'd6', damageTier1Modifier: 4, damageTier2Dice: 'd6', damageTier2Modifier: 4, damageTier3Dice: 'd6', damageTier3Modifier: 4, damageTier4Dice: 'd6', damageTier4Modifier: 4, features: ['versatile']
    }
  },
  // ============================================
  // TIER 4 - UNIQUE PRIMARY PHYSICAL WEAPONS
  // ============================================
  {
    name: 'Dual-Ended Sword', type: 'weapon',
    description: 'A double-bladed sword. When you attack, mark a Stress to target another creature within range.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'agility', range: 'melee', burden: 'two-handed', tier: 4,
      damageTier1Dice: 'd10', damageTier1Modifier: 9, damageTier2Dice: 'd10', damageTier2Modifier: 9, damageTier3Dice: 'd10', damageTier3Modifier: 9, damageTier4Dice: 'd10', damageTier4Modifier: 9, features: ['quick']
    }
  },
  {
    name: 'Impact Gauntlet', type: 'weapon',
    description: 'A gauntlet of concussive force. On a successful attack, spend a Hope to knock the target back to Far range.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'strength', range: 'melee', burden: 'one-handed', tier: 4,
      damageTier1Dice: 'd10', damageTier1Modifier: 11, damageTier2Dice: 'd10', damageTier2Modifier: 11, damageTier3Dice: 'd10', damageTier3Modifier: 11, damageTier4Dice: 'd10', damageTier4Modifier: 11, features: ['concussive']
    }
  },
  {
    name: 'Sledge Axe', type: 'weapon',
    description: 'A massively destructive axe. -1 to Agility; on a successful attack, all adversaries within Very Close range must mark a Stress.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'strength', range: 'melee', burden: 'two-handed', tier: 4,
      damageTier1Dice: 'd12', damageTier1Modifier: 13, damageTier2Dice: 'd12', damageTier2Modifier: 13, damageTier3Dice: 'd12', damageTier3Modifier: 13, damageTier4Dice: 'd12', damageTier4Modifier: 13, features: ['destructive']
    }
  },
  {
    name: 'Curved Dagger', type: 'weapon',
    description: 'A serrated curved dagger. When you roll a 1 on a damage die, it deals 8 damage instead.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'finesse', range: 'melee', burden: 'one-handed', tier: 4,
      damageTier1Dice: 'd8', damageTier1Modifier: 9, damageTier2Dice: 'd8', damageTier2Modifier: 9, damageTier3Dice: 'd8', damageTier3Modifier: 9, damageTier4Dice: 'd8', damageTier4Modifier: 9, features: ['serrated']
    }
  },
  {
    name: 'Extended Polearm', type: 'weapon',
    description: "An extended polearm. This weapon's attack targets all adversaries in a line within range.",
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'finesse', range: 'very close', burden: 'two-handed', tier: 4,
      damageTier1Dice: 'd8', damageTier1Modifier: 10, damageTier2Dice: 'd8', damageTier2Modifier: 10, damageTier3Dice: 'd8', damageTier3Modifier: 10, damageTier4Dice: 'd8', damageTier4Modifier: 10, features: ['long']
    }
  },
  {
    name: 'Swinging Ropeblade', type: 'weapon',
    description: 'A rope-mounted blade. On a successful attack, spend a Hope to Restrain the target or pull them into Melee range.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'presence', range: 'close', burden: 'one-handed', tier: 4,
      damageTier1Dice: 'd8', damageTier1Modifier: 9, damageTier2Dice: 'd8', damageTier2Modifier: 9, damageTier3Dice: 'd8', damageTier3Modifier: 9, damageTier4Dice: 'd8', damageTier4Modifier: 9, features: ['grappling']
    }
  },
  {
    name: 'Ricochet Axes', type: 'weapon',
    description: 'Ricocheting throwing axes. Mark 1 or more Stress to hit that many additional targets in range.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'agility', range: 'far', burden: 'two-handed', tier: 4,
      damageTier1Dice: 'd6', damageTier1Modifier: 11, damageTier2Dice: 'd6', damageTier2Modifier: 11, damageTier3Dice: 'd6', damageTier3Modifier: 11, damageTier4Dice: 'd6', damageTier4Modifier: 11, features: ['bouncing']
    }
  },
  {
    name: 'Aantari Bow', type: 'weapon',
    description: 'An Aantari-crafted bow. +1 to attack rolls.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'finesse', range: 'far', burden: 'one-handed', tier: 4,
      damageTier1Dice: 'd6', damageTier1Modifier: 11, damageTier2Dice: 'd6', damageTier2Modifier: 11, damageTier3Dice: 'd6', damageTier3Modifier: 11, damageTier4Dice: 'd6', damageTier4Modifier: 11, features: ['reliable']
    }
  },
  {
    name: 'Hand Cannon', type: 'weapon',
    description: 'A powerful hand cannon. After an attack, roll a d6. On a 1, mark a Stress to reload.',
    systemData: {
      classification: 'primary', damageType: 'physical', trait: 'finesse', range: 'very far', burden: 'two-handed', tier: 4,
      damageTier1Dice: 'd6', damageTier1Modifier: 12, damageTier2Dice: 'd6', damageTier2Modifier: 12, damageTier3Dice: 'd6', damageTier3Modifier: 12, damageTier4Dice: 'd6', damageTier4Modifier: 12, features: ['reloading']
    }
  },
  // TIER 4 - UNIQUE PRIMARY MAGIC WEAPONS
  {
    name: 'Sword of Light & Flame', type: 'weapon',
    description: 'A blazing sword of light and flame. This weapon cuts through solid material.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'strength', range: 'melee', burden: 'two-handed', tier: 4,
      damageTier1Dice: 'd10', damageTier1Modifier: 11, damageTier2Dice: 'd10', damageTier2Modifier: 11, damageTier3Dice: 'd10', damageTier3Modifier: 11, damageTier4Dice: 'd10', damageTier4Modifier: 11, features: ['hot']
    }
  },
  {
    name: 'Siphoning Gauntlets', type: 'weapon',
    description: 'Gauntlets that siphon life force. On a successful attack, roll a d6. On a 6, clear a Hit Point or Stress.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'presence', range: 'melee', burden: 'two-handed', tier: 4,
      damageTier1Dice: 'd10', damageTier1Modifier: 9, damageTier2Dice: 'd10', damageTier2Modifier: 9, damageTier3Dice: 'd10', damageTier3Modifier: 9, damageTier4Dice: 'd10', damageTier4Modifier: 9, features: ['lifestealing']
    }
  },
  {
    name: 'Midas Scythe', type: 'weapon',
    description: 'A golden scythe. Spend a handful of gold to gain +1 to Proficiency on a damage roll.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'knowledge', range: 'melee', burden: 'one-handed', tier: 4,
      damageTier1Dice: 'd10', damageTier1Modifier: 9, damageTier2Dice: 'd10', damageTier2Modifier: 9, damageTier3Dice: 'd10', damageTier3Modifier: 9, damageTier4Dice: 'd10', damageTier4Modifier: 9, features: ['greedy']
    }
  },
  {
    name: 'Floating Bladeshards', type: 'weapon',
    description: 'Floating shards of blade. On a successful attack, roll an additional damage die and discard the lowest result.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'instinct', range: 'close', burden: 'two-handed', tier: 4,
      damageTier1Dice: 'd8', damageTier1Modifier: 9, damageTier2Dice: 'd8', damageTier2Modifier: 9, damageTier3Dice: 'd8', damageTier3Modifier: 9, damageTier4Dice: 'd8', damageTier4Modifier: 9, features: ['powerful']
    }
  },
  {
    name: 'Bloodstaff', type: 'weapon',
    description: 'A staff powered by blood. Each time you make a successful attack, you must mark a Stress.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'instinct', range: 'far', burden: 'two-handed', tier: 4,
      damageTier1Dice: 'd20', damageTier1Modifier: 7, damageTier2Dice: 'd20', damageTier2Modifier: 7, damageTier3Dice: 'd20', damageTier3Modifier: 7, damageTier4Dice: 'd20', damageTier4Modifier: 7, features: ['painful']
    }
  },
  {
    name: 'Thistlebow', type: 'weapon',
    description: 'A thorned magical bow. +1 to attack rolls.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'instinct', range: 'far', burden: 'two-handed', tier: 4,
      damageTier1Dice: 'd6', damageTier1Modifier: 13, damageTier2Dice: 'd6', damageTier2Modifier: 13, damageTier3Dice: 'd6', damageTier3Modifier: 13, damageTier4Dice: 'd6', damageTier4Modifier: 13, features: ['reliable']
    }
  },
  {
    name: 'Wand of Essek', type: 'weapon',
    description: 'A legendary wand of time magic. You choose the target of your attack after making your attack roll.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'knowledge', range: 'far', burden: 'one-handed', tier: 4,
      damageTier1Dice: 'd8', damageTier1Modifier: 13, damageTier2Dice: 'd8', damageTier2Modifier: 13, damageTier3Dice: 'd8', damageTier3Modifier: 13, damageTier4Dice: 'd8', damageTier4Modifier: 13, features: ['timebending']
    }
  },
  {
    name: 'Magus Revolver', type: 'weapon',
    description: 'A magical revolver. After an attack, roll a d6. On a 1, mark a Stress to reload.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'finesse', range: 'very far', burden: 'one-handed', tier: 4,
      damageTier1Dice: 'd6', damageTier1Modifier: 13, damageTier2Dice: 'd6', damageTier2Modifier: 13, damageTier3Dice: 'd6', damageTier3Modifier: 13, damageTier4Dice: 'd6', damageTier4Modifier: 13, features: ['reloading']
    }
  },
  {
    name: 'Fusion Gloves', type: 'weapon',
    description: 'Gloves that bond with the wearer. Gain a bonus to your damage rolls equal to your level.',
    systemData: {
      classification: 'primary', damageType: 'magical', trait: 'knowledge', range: 'very far', burden: 'two-handed', tier: 4,
      damageTier1Dice: 'd6', damageTier1Modifier: 9, damageTier2Dice: 'd6', damageTier2Modifier: 9, damageTier3Dice: 'd6', damageTier3Modifier: 9, damageTier4Dice: 'd6', damageTier4Modifier: 9, features: ['bonded']
    }
  },
  // TIER 4 - UNIQUE SECONDARY WEAPONS
  {
    name: 'Braveshield', type: 'weapon',
    description: 'A shield that protects allies. When you mark an Armor Slot, it reduces damage for you and all allies within Melee range who took the same damage.',
    systemData: {
      classification: 'secondary', damageType: 'physical', trait: 'agility', range: 'melee', burden: 'one-handed', tier: 4,
      damageTier1Dice: 'd4', damageTier1Modifier: 6, damageTier2Dice: 'd4', damageTier2Modifier: 6, damageTier3Dice: 'd4', damageTier3Modifier: 6, damageTier4Dice: 'd4', damageTier4Modifier: 6, features: ['sheltering']
    }
  },
  {
    name: 'Knuckle Claws', type: 'weapon',
    description: 'Clawed knuckle weapons. When you attack with your primary weapon, you can deal damage to another target within Melee range.',
    systemData: {
      classification: 'secondary', damageType: 'physical', trait: 'strength', range: 'melee', burden: 'one-handed', tier: 4,
      damageTier1Dice: 'd6', damageTier1Modifier: 8, damageTier2Dice: 'd6', damageTier2Modifier: 8, damageTier3Dice: 'd6', damageTier3Modifier: 8, damageTier4Dice: 'd6', damageTier4Modifier: 8, features: ['doubled-up']
    }
  },
  {
    name: 'Primer Shard', type: 'weapon',
    description: 'A targeting shard. On a successful attack, your next attack against the same target with your primary weapon automatically succeeds.',
    systemData: {
      classification: 'secondary', damageType: 'physical', trait: 'instinct', range: 'very close', burden: 'one-handed', tier: 4,
      damageTier1Dice: 'd4', damageTier1Modifier: 0, damageTier2Dice: 'd4', damageTier2Modifier: 0, damageTier3Dice: 'd4', damageTier3Modifier: 0, damageTier4Dice: 'd4', damageTier4Modifier: 0, features: ['locked-on']
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
  },
  // TIER 2 - UNIQUE ARMOR
  {
    name: 'Runetan Floating Armor', type: 'armor',
    description: 'Armor that shifts to deflect attacks. When targeted, mark an Armor Slot to give the attack roll disadvantage.',
    systemData: { armorScore: 4, armorSlots: 6, tier: 2, thresholds: { minor: 9, major: 20 }, features: ['shifting'] }
  },
  {
    name: 'Tyris Soft Armor', type: 'armor',
    description: 'Silent armor. +2 bonus to rolls you make to move silently.',
    systemData: { armorScore: 5, armorSlots: 6, tier: 2, thresholds: { minor: 8, major: 18 }, features: ['quiet'] }
  },
  // TIER 3 - UNIQUE ARMOR
  {
    name: 'Bellamoi Fine Armor', type: 'armor',
    description: 'Exquisitely gilded armor. +1 to Presence.',
    systemData: { armorScore: 5, armorSlots: 6, tier: 3, thresholds: { minor: 11, major: 27 }, features: ['gilded'] }
  },
  {
    name: 'Spiked Plate Armor', type: 'armor',
    description: 'Armor covered in spikes. On a melee attack, add d4 to damage. Cannot reduce magic damage with Armor Slots.',
    systemData: { armorScore: 5, armorSlots: 6, tier: 3, thresholds: { minor: 10, major: 25 }, features: ['sharp', 'physical'] }
  },
  {
    name: 'Bladefare Armor', type: 'armor',
    description: 'Armor specialized against physical attacks. You cannot mark an Armor Slot to reduce magic damage.',
    systemData: { armorScore: 6, armorSlots: 6, tier: 3, thresholds: { minor: 16, major: 39 }, features: ['physical'] }
  },
  {
    name: "Monett's Cloak", type: 'armor',
    description: 'A magical cloak. You cannot mark an Armor Slot to reduce physical damage.',
    systemData: { armorScore: 6, armorSlots: 6, tier: 3, thresholds: { minor: 16, major: 39 }, features: ['magic'] }
  },
  {
    name: 'Runes of Fortification', type: 'armor',
    description: 'Fortifying runes. Each time you mark an Armor Slot, you must mark a Stress.',
    systemData: { armorScore: 6, armorSlots: 6, tier: 3, thresholds: { minor: 17, major: 43 }, features: ['painful'] }
  },
  // TIER 4 - UNIQUE ARMOR
  {
    name: 'Dunamis Silkchain', type: 'armor',
    description: 'Time-slowing silkchain armor. Mark an Armor Slot to roll a d4 and add it to your Evasion against an incoming attack.',
    systemData: { armorScore: 7, armorSlots: 6, tier: 4, thresholds: { minor: 13, major: 36 }, features: ['timeslowing'] }
  },
  {
    name: 'Channeling Armor', type: 'armor',
    description: 'Armor that channels magical energy. +1 to Spellcast Rolls.',
    systemData: { armorScore: 5, armorSlots: 6, tier: 4, thresholds: { minor: 13, major: 36 }, features: ['channeling'] }
  },
  {
    name: 'Emberwoven Armor', type: 'armor',
    description: 'Armor woven with embers. When an adversary attacks you within Melee range, they mark a Stress.',
    systemData: { armorScore: 6, armorSlots: 6, tier: 4, thresholds: { minor: 13, major: 36 }, features: ['burning'] }
  },
  {
    name: 'Full Fortified Armor', type: 'armor',
    description: 'Fully fortified armor. When you mark an Armor Slot, reduce severity by two thresholds instead of one.',
    systemData: { armorScore: 4, armorSlots: 6, tier: 4, thresholds: { minor: 15, major: 40 }, features: ['fortified'] }
  },
  {
    name: 'Veritas Opal Armor', type: 'armor',
    description: 'Truth-revealing opal armor. This armor glows when another creature within Close range tells a lie.',
    systemData: { armorScore: 6, armorSlots: 6, tier: 4, thresholds: { minor: 13, major: 36 }, features: ['truthseeking'] }
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
  },
  // COMMON LOOT
  {
    name: 'Manacles', type: 'equipment', description: 'This pair of locking cuffs comes with a key.',
    systemData: { category: 'utility', rarity: 'common', mechanicalEffect: 'Restrain a creature. Target can break free with Attack Roll (16).', activation: 'action', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Arcane Cloak', type: 'equipment', description: 'A creature with a Spellcast trait wearing this cloak can adjust its color, texture, and size at will.',
    systemData: { category: 'utility', rarity: 'common', mechanicalEffect: 'Adjust cloak color, texture, and size at will. Requires Spellcast trait.', activation: 'action', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Woven Net', type: 'equipment', description: 'Make a Finesse Roll to trap a small creature. Target can break free with Attack Roll (16).',
    systemData: { category: 'utility', rarity: 'common', mechanicalEffect: 'Trap a small creature with Finesse Roll.', activation: 'action', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Fire Jar', type: 'equipment', description: 'Pour out the liquid to instantly produce fire. Contents regenerate on long rest.',
    systemData: { category: 'utility', rarity: 'common', mechanicalEffect: 'Produce fire instantly. Regenerates on long rest.', activation: 'action', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Suspended Rod', type: 'equipment', description: 'A rune-inscribed rod. When activated, it suspends in place defying gravity until deactivated.',
    systemData: { category: 'utility', rarity: 'common', mechanicalEffect: 'Suspend rod in mid-air until deactivated.', activation: 'action', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Glamour Stone', type: 'equipment', description: 'Activate to memorize an appearance. Spend a Hope to disguise yourself as that person.',
    systemData: { category: 'magic-item', rarity: 'common', mechanicalEffect: 'Memorize appearance, spend Hope to disguise.', activation: 'action', uses: -1, hopeCost: 1, stressCost: 0 }
  },
  {
    name: 'Empty Chest', type: 'equipment', description: 'This magical chest appears empty. Speak a trigger word to reveal stored items.',
    systemData: { category: 'utility', rarity: 'common', mechanicalEffect: 'Hidden magical storage activated by trigger word.', activation: 'action', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  // UNCOMMON LOOT
  {
    name: 'Companion Case', type: 'equipment', description: 'Fits a small animal companion. While inside, animal and case are immune to all damage.',
    systemData: { category: 'utility', rarity: 'uncommon', mechanicalEffect: 'Protect a small animal companion from all damage.', activation: 'passive', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Piercing Arrows', type: 'equipment', description: 'Three times per rest, add your Proficiency to a successful ranged damage roll.',
    systemData: { category: 'weapon-enhancement', rarity: 'uncommon', mechanicalEffect: '3x per rest, add Proficiency to ranged damage.', activation: 'passive', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Valorstone', type: 'equipment', description: 'Attach to featureless armor. Gains Resilient: Before marking last Armor Slot, roll d6. On 6, reduce severity.',
    systemData: { category: 'weapon-enhancement', rarity: 'uncommon', mechanicalEffect: 'Add Resilient feature to featureless armor.', activation: 'passive', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Arcane Prism', type: 'equipment', description: 'Position and activate. Allies within Close range gain +1 to Spellcast Rolls. Recharges on long rest.',
    systemData: { category: 'magic-item', rarity: 'uncommon', mechanicalEffect: '+1 to Spellcast Rolls for allies in Close range.', activation: 'action', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Homing Compasses', type: 'equipment', description: 'These two compasses point toward each other no matter how far apart they are.',
    systemData: { category: 'utility', rarity: 'uncommon', mechanicalEffect: 'Pair of compasses that always point to each other.', activation: 'passive', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Corrector Sprite', type: 'equipment', description: 'A tiny sprite that whispers advice during combat. Once per short rest, gain advantage on an attack roll.',
    systemData: { category: 'magic-item', rarity: 'uncommon', mechanicalEffect: 'Once per short rest, gain advantage on an attack roll.', activation: 'action', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Lorekeeper', type: 'equipment', description: 'Store up to three hostile creature names. Gain +1 to action rolls against stored creatures.',
    systemData: { category: 'utility', rarity: 'uncommon', mechanicalEffect: '+1 to action rolls against up to 3 stored creatures.', activation: 'passive', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Bloodstone', type: 'equipment', description: 'Attach to a featureless weapon. Gains Brutal: When you roll max on a damage die, roll an additional die.',
    systemData: { category: 'weapon-enhancement', rarity: 'uncommon', mechanicalEffect: 'Add Brutal feature to featureless weapon.', activation: 'passive', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Greatstone', type: 'equipment', description: 'Attach to a featureless weapon. Gains Powerful: On successful attack, roll extra die and discard lowest.',
    systemData: { category: 'weapon-enhancement', rarity: 'uncommon', mechanicalEffect: 'Add Powerful feature to featureless weapon.', activation: 'passive', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Glider', type: 'equipment', description: 'While falling, mark a Stress to deploy this parachute and glide safely to the ground.',
    systemData: { category: 'utility', rarity: 'uncommon', mechanicalEffect: 'Safely glide to ground when falling. Costs 1 Stress.', activation: 'action', uses: -1, hopeCost: 0, stressCost: 1 }
  },
  {
    name: 'Calming Pendant', type: 'equipment', description: 'When you would mark your last Stress, roll a d6. On 5+, do not mark it.',
    systemData: { category: 'magic-item', rarity: 'uncommon', mechanicalEffect: 'Chance to prevent marking last Stress (d6, 5+).', activation: 'passive', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Dual Flask', type: 'equipment', description: 'Holds two different liquids. Swap between them by flipping a switch.',
    systemData: { category: 'utility', rarity: 'uncommon', mechanicalEffect: 'Hold two liquids, swap between them.', activation: 'action', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  // RARE LOOT
  {
    name: 'Bag of Ficklesand', type: 'equipment', description: 'Convince the sand to change weight (Presence Roll 10). Blow in a face to make target Vulnerable (Finesse Roll 10).',
    systemData: { category: 'magic-item', rarity: 'rare', mechanicalEffect: 'Adjust weight or make target Vulnerable.', activation: 'action', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Ring of Resistance', type: 'equipment', description: 'Once per long rest, activate after a successful attack against you to halve the damage.',
    systemData: { category: 'magic-item', rarity: 'rare', mechanicalEffect: 'Once per long rest, halve damage from one attack.', activation: 'action', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Phoenix Feather', type: 'equipment', description: 'When you fall unconscious while carrying this, gain +1 to the roll to determine whether you gain a scar.',
    systemData: { category: 'magic-item', rarity: 'rare', mechanicalEffect: '+1 to scar determination roll when unconscious.', activation: 'passive', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Box of Many Goods', type: 'equipment', description: 'Once per long rest, roll d12. 1-6: empty. 7-10: one random common consumable. 11-12: two.',
    systemData: { category: 'magic-item', rarity: 'rare', mechanicalEffect: 'Once per long rest, chance to produce consumables.', activation: 'action', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Airblade Charm', type: 'equipment', description: 'Attach to a Melee weapon. Three times per rest, attack a target within Close range instead.',
    systemData: { category: 'weapon-enhancement', rarity: 'rare', mechanicalEffect: '3x per rest, extend Melee weapon to Close range.', activation: 'action', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Portal Seed', type: 'equipment', description: 'Plant to grow a portal in 24 hours. Travel to any other portal seed location. Destroyed by magic damage.',
    systemData: { category: 'magic-item', rarity: 'rare', mechanicalEffect: 'Create a portal network between planted seeds.', activation: 'action', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: "Paragon's Chain", type: 'equipment', description: 'Meditate on a principle during downtime. Once per long rest, spend Hope to roll d20 as Hope Die for aligned rolls.',
    systemData: { category: 'magic-item', rarity: 'rare', mechanicalEffect: 'Once per long rest, d20 Hope Die for principle-aligned rolls.', activation: 'action', uses: -1, hopeCost: 1, stressCost: 0 }
  },
  {
    name: 'Elusive Amulet', type: 'equipment', description: 'Once per long rest, become Hidden until you move. You remain unseen even if an adversary approaches.',
    systemData: { category: 'magic-item', rarity: 'rare', mechanicalEffect: 'Once per long rest, become Hidden until you move.', activation: 'action', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  // LEGENDARY LOOT
  {
    name: 'Honing Relic', type: 'equipment', description: '+1 bonus to an Experience of your choice. One relic per character.',
    systemData: { category: 'relic', rarity: 'legendary', mechanicalEffect: '+1 to an Experience of your choice.', activation: 'passive', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Flickerfly Pendant', type: 'equipment', description: 'Melee physical weapons gain gossamer sheen and can attack targets within Very Close range.',
    systemData: { category: 'magic-item', rarity: 'legendary', mechanicalEffect: 'Extend Melee physical weapons to Very Close range.', activation: 'passive', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Lakestrider Boots', type: 'equipment', description: 'You can walk on the surface of water as if it were soft ground.',
    systemData: { category: 'magic-item', rarity: 'legendary', mechanicalEffect: 'Walk on water.', activation: 'passive', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Clay Companion', type: 'equipment', description: 'Sculpt into a clay animal companion that behaves as that animal. Retains memory across shapes.',
    systemData: { category: 'magic-item', rarity: 'legendary', mechanicalEffect: 'Create a clay animal companion.', activation: 'action', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Shard of Memory', type: 'equipment', description: 'Once per long rest, spend 2 Hope to recall a domain card from your vault without paying its Recall Cost.',
    systemData: { category: 'magic-item', rarity: 'legendary', mechanicalEffect: 'Once per long rest, recall domain card for 2 Hope.', activation: 'action', uses: -1, hopeCost: 2, stressCost: 0 }
  },
  {
    name: 'Gem of Alacrity', type: 'equipment', description: 'Attach to a weapon to use your Agility for attacks with it.',
    systemData: { category: 'weapon-enhancement', rarity: 'legendary', mechanicalEffect: 'Use Agility for attacks with attached weapon.', activation: 'passive', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Gem of Might', type: 'equipment', description: 'Attach to a weapon to use your Strength for attacks with it.',
    systemData: { category: 'weapon-enhancement', rarity: 'legendary', mechanicalEffect: 'Use Strength for attacks with attached weapon.', activation: 'passive', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Gem of Precision', type: 'equipment', description: 'Attach to a weapon to use your Finesse for attacks with it.',
    systemData: { category: 'weapon-enhancement', rarity: 'legendary', mechanicalEffect: 'Use Finesse for attacks with attached weapon.', activation: 'passive', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Gem of Insight', type: 'equipment', description: 'Attach to a weapon to use your Instinct for attacks with it.',
    systemData: { category: 'weapon-enhancement', rarity: 'legendary', mechanicalEffect: 'Use Instinct for attacks with attached weapon.', activation: 'passive', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Gem of Audacity', type: 'equipment', description: 'Attach to a weapon to use your Presence for attacks with it.',
    systemData: { category: 'weapon-enhancement', rarity: 'legendary', mechanicalEffect: 'Use Presence for attacks with attached weapon.', activation: 'passive', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Gem of Sagacity', type: 'equipment', description: 'Attach to a weapon to use your Knowledge for attacks with it.',
    systemData: { category: 'weapon-enhancement', rarity: 'legendary', mechanicalEffect: 'Use Knowledge for attacks with attached weapon.', activation: 'passive', uses: -1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Ring of Unbreakable Resolve', type: 'equipment', description: 'Once per session, spend 4 Hope to cancel the effects of a GM Fear spend.',
    systemData: { category: 'magic-item', rarity: 'legendary', mechanicalEffect: 'Once per session, spend 4 Hope to cancel GM Fear.', activation: 'action', uses: -1, hopeCost: 4, stressCost: 0 }
  },
  {
    name: 'Belt of Unity', type: 'equipment', description: 'Once per session, spend 5 Hope to lead a Tag Team Roll with three PCs instead of two.',
    systemData: { category: 'magic-item', rarity: 'legendary', mechanicalEffect: 'Once per session, Tag Team Roll with 3 PCs for 5 Hope.', activation: 'action', uses: -1, hopeCost: 5, stressCost: 0 }
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
  },
  // COMMON CONSUMABLES
  {
    name: 'Potion of Stability', type: 'equipment', description: 'Choose one additional downtime move.',
    systemData: { category: 'consumable', rarity: 'common', mechanicalEffect: 'Choose one additional downtime move.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  // UNCOMMON CONSUMABLES
  {
    name: 'Improved Grindletooth Venom', type: 'equipment', description: 'Apply to a physical weapon to add a d8 to your next damage roll.',
    systemData: { category: 'consumable', rarity: 'uncommon', mechanicalEffect: '+d8 to next physical damage roll.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Morphing Clay', type: 'equipment', description: 'Spend a Hope to alter your face, becoming unrecognizable until next rest.',
    systemData: { category: 'consumable', rarity: 'uncommon', mechanicalEffect: 'Disguise face until next rest. Costs 1 Hope.', activation: 'action', uses: 1, hopeCost: 1, stressCost: 0 }
  },
  {
    name: 'Snap Powder', type: 'equipment', description: 'Mark a Stress and clear a HP.',
    systemData: { category: 'consumable', rarity: 'uncommon', mechanicalEffect: 'Mark 1 Stress, clear 1 HP.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 1 }
  },
  {
    name: 'Armor Stitcher', type: 'equipment', description: 'Spend any number of Hope to clear that many Armor Slots.',
    systemData: { category: 'consumable', rarity: 'uncommon', mechanicalEffect: 'Spend Hope to clear equal Armor Slots.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Gill Salve', type: 'equipment', description: 'Apply to your neck to breathe underwater for minutes equal to your level.',
    systemData: { category: 'consumable', rarity: 'uncommon', mechanicalEffect: 'Breathe underwater for [level] minutes.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Replication Parchment', type: 'equipment', description: 'Touch to another parchment to perfectly copy its contents. Becomes mundane paper after use.',
    systemData: { category: 'consumable', rarity: 'uncommon', mechanicalEffect: 'Copy a parchment perfectly.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Improved Arcane Shard', type: 'equipment', description: 'Throw at adversaries within Far range (Finesse Roll). Targets take 2d20 magic damage.',
    systemData: { category: 'consumable', rarity: 'uncommon', mechanicalEffect: '2d20 magic damage, Far range.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  // RARE CONSUMABLES
  {
    name: 'Major Stride Potion', type: 'equipment', description: '+1 bonus to your Agility until your next rest.',
    systemData: { category: 'consumable', rarity: 'rare', mechanicalEffect: '+1 to Agility until next rest.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Major Bolster Potion', type: 'equipment', description: '+1 bonus to your Strength until your next rest.',
    systemData: { category: 'consumable', rarity: 'rare', mechanicalEffect: '+1 to Strength until next rest.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Major Control Potion', type: 'equipment', description: '+1 bonus to your Finesse until your next rest.',
    systemData: { category: 'consumable', rarity: 'rare', mechanicalEffect: '+1 to Finesse until next rest.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Major Attune Potion', type: 'equipment', description: '+1 bonus to your Instinct until your next rest.',
    systemData: { category: 'consumable', rarity: 'rare', mechanicalEffect: '+1 to Instinct until next rest.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Major Charm Potion', type: 'equipment', description: '+1 bonus to your Presence until your next rest.',
    systemData: { category: 'consumable', rarity: 'rare', mechanicalEffect: '+1 to Presence until next rest.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Major Enlighten Potion', type: 'equipment', description: '+1 bonus to your Knowledge until your next rest.',
    systemData: { category: 'consumable', rarity: 'rare', mechanicalEffect: '+1 to Knowledge until next rest.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Blood of the Yorgi', type: 'equipment', description: 'Drink to teleport to a visible point within Very Far range.',
    systemData: { category: 'consumable', rarity: 'rare', mechanicalEffect: 'Teleport to visible point within Very Far range.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: "Homet's Secret Potion", type: 'equipment', description: 'After drinking, your next successful attack critically succeeds.',
    systemData: { category: 'consumable', rarity: 'rare', mechanicalEffect: 'Next successful attack is a critical success.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Redthorn Saliva', type: 'equipment', description: 'Apply to a physical weapon to add a d12 to your next damage roll.',
    systemData: { category: 'consumable', rarity: 'rare', mechanicalEffect: '+d12 to next physical damage roll.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Channelstone', type: 'equipment', description: 'Take a spell or grimoire from your vault, use it once, then return it.',
    systemData: { category: 'consumable', rarity: 'rare', mechanicalEffect: 'Use a vaulted spell once without Recall Cost.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  // LEGENDARY CONSUMABLES
  {
    name: 'Mythic Dust', type: 'equipment', description: 'Apply to a magic weapon to add a d12 to your next damage roll.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: '+d12 to next magic damage roll.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Acidpaste', type: 'equipment', description: 'This paste eats away walls and other surfaces in bright flashes.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: 'Destroy walls and surfaces.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Hopehold Flare', type: 'equipment', description: 'Allies within Close range roll d6 when spending Hope. On 6, gain effect without spending it. Lasts until end of scene.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: 'Allies in Close range may preserve Hope on use.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Major Arcane Shard', type: 'equipment', description: 'Throw at adversaries within Far range (Finesse Roll). Targets take 4d20 magic damage.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: '4d20 magic damage, Far range.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Featherbone', type: 'equipment', description: 'Control your falling speed for minutes equal to your level.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: 'Control falling speed for [level] minutes.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Circle of the Void', type: 'equipment', description: 'Mark a Stress to create an anti-magic void up to Far range. No magic inside; immune to magic damage.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: 'Create anti-magic zone up to Far range.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 1 }
  },
  {
    name: 'Sun Tree Sap', type: 'equipment', description: 'Roll d6. On 5-6: clear 2 HP. On 2-4: clear 3 Stress. On 1: gain a scar.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: 'Healing with risk. d6 determines effect.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Dripfang Poison', type: 'equipment', description: 'A creature who consumes this takes 8d10 direct magic damage.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: '8d10 direct magic damage to consumer.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Ogre Musk', type: 'equipment', description: 'Use to prevent anyone from tracking you by any means until next rest.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: 'Untrackable until next rest.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Wingsprout', type: 'equipment', description: 'Gain magic wings that allow you to fly for minutes equal to your level.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: 'Fly for [level] minutes.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Jar of Lost Voices', type: 'equipment', description: 'Open to release a deafening echo. Unprepared creatures within Far range take 6d8 magic damage.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: '6d8 magic damage within Far range.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Dragonbloom Tea', type: 'equipment', description: 'Drink to unleash a fiery breath attack against all adversaries within Close range (Instinct Roll).',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: 'Breath attack: d20 physical damage, Close range cone.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Bridge Seed', type: 'equipment', description: 'Thick vines grow from your location to a chosen point within Far range. Dissipates on next short rest.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: 'Create vine bridge up to Far range.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Bonding Honey', type: 'equipment', description: 'This honey can glue two objects together permanently.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: 'Permanently bond two objects.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Shrinking Potion', type: 'equipment', description: 'Halve your size until next rest. +2 to Agility, -1 to Proficiency.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: 'Shrink: +2 Agility, -1 Proficiency until rest.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Growing Potion', type: 'equipment', description: 'Double your size until next rest. +2 to Strength, +1 to Proficiency.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: 'Grow: +2 Strength, +1 Proficiency until rest.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Knowledge Stone', type: 'equipment', description: 'If you die while holding this, an ally can take a card from your loadout. The stone then crumbles.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: 'On death, transfer one card to an ally.', activation: 'passive', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Sweet Moss', type: 'equipment', description: 'Consume during a rest to clear 1d4 HP or 1d4 Stress.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: 'Clear 1d4 HP or 1d4 Stress during rest.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Blinding Orb', type: 'equipment', description: 'Create a flash of bright light. All targets within Close range become Vulnerable until they mark HP.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: 'Blind targets in Close range, making them Vulnerable.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Death Tea', type: 'equipment', description: 'After drinking, instantly kill target on critical success. If no crit before next long rest, you die.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: 'Critical hits kill instantly. No crit before rest = death.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
  },
  {
    name: 'Mirror of Marigold', type: 'equipment', description: 'When you take damage, spend a Hope to negate it. The mirror then shatters.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: 'Negate one damage instance. Single use.', activation: 'action', uses: 1, hopeCost: 1, stressCost: 0 }
  },
  {
    name: 'Stardrop', type: 'equipment', description: 'Summon a hailstorm of comets dealing 8d20 physical damage to all targets within Very Far range.',
    systemData: { category: 'consumable', rarity: 'legendary', mechanicalEffect: '8d20 physical damage, all targets in Very Far range.', activation: 'action', uses: 1, hopeCost: 0, stressCost: 0 }
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
