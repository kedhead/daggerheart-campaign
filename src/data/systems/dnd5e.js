// D&D 5e Game System Definition
// Fifth Edition Dungeons & Dragons compatible system
// Uses D&D Beyond for detailed character sheets

import { DND5E_CAMPAIGN_FRAMES } from '../dnd5eCampaignFrames.js';

const CLASSES = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];

const RACES = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'];

// Item rarities
const RARITIES = [
  { value: 'common', label: 'Common', color: '#9ca3af' },
  { value: 'uncommon', label: 'Uncommon', color: '#22c55e' },
  { value: 'rare', label: 'Rare', color: '#3b82f6' },
  { value: 'very-rare', label: 'Very Rare', color: '#8b5cf6' },
  { value: 'legendary', label: 'Legendary', color: '#f59e0b' },
  { value: 'artifact', label: 'Artifact', color: '#ef4444' }
];

// Weapon properties
const WEAPON_PROPERTIES = [
  'Ammunition', 'Finesse', 'Heavy', 'Light', 'Loading', 'Range',
  'Reach', 'Special', 'Thrown', 'Two-Handed', 'Versatile'
];

// Damage types
const DAMAGE_TYPES = [
  'Bludgeoning', 'Piercing', 'Slashing', 'Acid', 'Cold', 'Fire',
  'Force', 'Lightning', 'Necrotic', 'Poison', 'Psychic', 'Radiant', 'Thunder'
];

// Armor types
const ARMOR_TYPES = [
  { value: 'light', label: 'Light Armor' },
  { value: 'medium', label: 'Medium Armor' },
  { value: 'heavy', label: 'Heavy Armor' },
  { value: 'shield', label: 'Shield' }
];

// Item Templates for D&D 5e
const ITEM_TEMPLATES = {
  weapon: {
    label: 'Weapon',
    icon: 'sword',
    fields: {
      rarity: {
        type: 'select',
        label: 'Rarity',
        options: RARITIES,
        required: true
      },
      weaponType: {
        type: 'select',
        label: 'Weapon Type',
        options: [
          { value: 'simple-melee', label: 'Simple Melee' },
          { value: 'simple-ranged', label: 'Simple Ranged' },
          { value: 'martial-melee', label: 'Martial Melee' },
          { value: 'martial-ranged', label: 'Martial Ranged' }
        ],
        required: true
      },
      damageDice: {
        type: 'text',
        label: 'Damage',
        placeholder: '1d8, 2d6, etc.',
        required: true
      },
      damageType: {
        type: 'select',
        label: 'Damage Type',
        options: DAMAGE_TYPES.map(t => ({ value: t.toLowerCase(), label: t })),
        required: true
      },
      properties: {
        type: 'multiselect',
        label: 'Properties',
        options: WEAPON_PROPERTIES
      },
      range: {
        type: 'text',
        label: 'Range',
        placeholder: '20/60, 150/600, etc.'
      },
      requiresAttunement: {
        type: 'checkbox',
        label: 'Requires Attunement',
        default: false
      },
      attunementRequirements: {
        type: 'text',
        label: 'Attunement Requirements',
        placeholder: 'by a spellcaster, by a paladin, etc.'
      },
      weight: {
        type: 'number',
        label: 'Weight (lb)',
        min: 0,
        default: 0
      },
      value: {
        type: 'text',
        label: 'Value',
        placeholder: '50 gp'
      },
      magicalBonus: {
        type: 'number',
        label: 'Magical Bonus (+1, +2, +3)',
        min: 0,
        max: 3,
        default: 0
      }
    }
  },
  armor: {
    label: 'Armor',
    icon: 'shield',
    fields: {
      rarity: {
        type: 'select',
        label: 'Rarity',
        options: RARITIES,
        required: true
      },
      armorType: {
        type: 'select',
        label: 'Armor Type',
        options: ARMOR_TYPES,
        required: true
      },
      baseAC: {
        type: 'number',
        label: 'Base AC',
        min: 10,
        max: 20,
        required: true,
        default: 11
      },
      maxDexBonus: {
        type: 'number',
        label: 'Max Dex Bonus',
        min: 0,
        max: 10,
        helpText: 'Leave 0 for no limit'
      },
      strengthRequirement: {
        type: 'number',
        label: 'Strength Requirement',
        min: 0,
        max: 20,
        default: 0
      },
      stealthDisadvantage: {
        type: 'checkbox',
        label: 'Stealth Disadvantage',
        default: false
      },
      requiresAttunement: {
        type: 'checkbox',
        label: 'Requires Attunement',
        default: false
      },
      attunementRequirements: {
        type: 'text',
        label: 'Attunement Requirements',
        placeholder: 'by a cleric, by a dwarf, etc.'
      },
      weight: {
        type: 'number',
        label: 'Weight (lb)',
        min: 0,
        default: 0
      },
      value: {
        type: 'text',
        label: 'Value',
        placeholder: '500 gp'
      },
      magicalBonus: {
        type: 'number',
        label: 'Magical Bonus (+1, +2, +3)',
        min: 0,
        max: 3,
        default: 0
      }
    }
  },
  equipment: {
    label: 'Equipment',
    icon: 'backpack',
    fields: {
      rarity: {
        type: 'select',
        label: 'Rarity',
        options: RARITIES,
        required: true
      },
      category: {
        type: 'select',
        label: 'Category',
        options: [
          { value: 'wondrous', label: 'Wondrous Item' },
          { value: 'potion', label: 'Potion' },
          { value: 'scroll', label: 'Scroll' },
          { value: 'ring', label: 'Ring' },
          { value: 'rod', label: 'Rod' },
          { value: 'staff', label: 'Staff' },
          { value: 'wand', label: 'Wand' },
          { value: 'adventuring-gear', label: 'Adventuring Gear' },
          { value: 'tool', label: 'Tool' }
        ],
        required: true
      },
      requiresAttunement: {
        type: 'checkbox',
        label: 'Requires Attunement',
        default: false
      },
      attunementRequirements: {
        type: 'text',
        label: 'Attunement Requirements',
        placeholder: 'by a spellcaster, etc.'
      },
      charges: {
        type: 'number',
        label: 'Charges',
        min: -1,
        helpText: '-1 for no charges, 0+ for limited uses'
      },
      rechargeRate: {
        type: 'text',
        label: 'Recharge',
        placeholder: '1d6+1 at dawn, etc.'
      },
      weight: {
        type: 'number',
        label: 'Weight (lb)',
        min: 0,
        default: 0
      },
      value: {
        type: 'text',
        label: 'Value',
        placeholder: '100 gp'
      }
    }
  }
};

// Game System Definition
export default {
  // System metadata
  id: 'dnd5e',
  name: 'D&D 5e',
  description: 'Fifth Edition Dungeons & Dragons - Character management with D&D Beyond integration',
  version: '1.0.0',

  // Character schema definition (simplified - uses D&D Beyond for detailed stats)
  characterSchema: {
    // Link to D&D Beyond character sheet (required, like Demiplane for Daggerheart)
    dndBeyondLink: {
      type: 'url',
      required: true,
      label: 'D&D Beyond Character Link',
      placeholder: 'https://www.dndbeyond.com/characters/...'
    },
    // Player notes for quick reference
    playerNotes: {
      type: 'textarea',
      required: false,
      label: 'Player Notes',
      placeholder: 'Quick notes about your character...'
    }
  },

  // Dice roller configuration - d20 with advantage/disadvantage
  diceRoller: {
    type: 'advantage',
    dice: [
      {
        name: 'd20',
        sides: 20,
        icon: 'dice-d20',
        color: '#c53030' // D&D red
      }
    ],
    mechanics: {
      type: 'advantage-disadvantage',
      modes: ['normal', 'advantage', 'disadvantage'],
      defaultMode: 'normal',
      advantage: {
        roll: 2,
        take: 'highest',
        label: 'Advantage',
        description: 'Roll two d20s and take the higher result'
      },
      disadvantage: {
        roll: 2,
        take: 'lowest',
        label: 'Disadvantage',
        description: 'Roll two d20s and take the lower result'
      }
    }
  },

  // Game data (kept for reference/tools view)
  classes: CLASSES,
  races: RACES,

  // Item system
  itemTemplates: ITEM_TEMPLATES,
  rarities: RARITIES,
  weaponProperties: WEAPON_PROPERTIES,
  damageTypes: DAMAGE_TYPES,
  armorTypes: ARMOR_TYPES,

  // Campaign frame templates
  campaignFrameTemplates: DND5E_CAMPAIGN_FRAMES,

  // External tools
  externalTools: [
    {
      name: 'D&D Beyond',
      url: 'https://www.dndbeyond.com',
      description: 'Official D&D digital toolset and character builder',
      icon: 'book-open'
    },
    {
      name: 'Roll20',
      url: 'https://roll20.net',
      description: 'Virtual tabletop for online play',
      icon: 'gamepad-2'
    },
    {
      name: 'D&D 5e SRD',
      url: 'https://www.5esrd.com',
      description: 'System Reference Document',
      icon: 'scroll-text'
    },
    {
      name: 'Kobold Fight Club',
      url: 'https://koboldplus.club',
      description: 'Encounter builder and balancer',
      icon: 'swords'
    }
  ],

  // UI theme customization
  theme: {
    primary: '#c53030', // D&D red
    secondary: '#a0aec0', // light gray/silver
    iconSet: 'medieval'
  }
};

// Export individual constants for convenience
export {
  CLASSES,
  RACES,
  ITEM_TEMPLATES,
  RARITIES,
  WEAPON_PROPERTIES,
  DAMAGE_TYPES,
  ARMOR_TYPES
};
