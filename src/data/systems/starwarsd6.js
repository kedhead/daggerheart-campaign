// Star Wars D6 Game System Definition
// Classic West End Games D6 System
// Uses external character sheets for detailed stats

import { STARWARSD6_CAMPAIGN_FRAMES } from '../starwarsd6CampaignFrames.js';

const ATTRIBUTES = [
  'Dexterity',
  'Knowledge',
  'Mechanical',
  'Perception',
  'Strength',
  'Technical'
];

// Standard WEG 2e skill lists, keyed by lowercase attribute name.
// Used as suggestions when players add skills to their sheet.
const SKILLS_BY_ATTRIBUTE = {
  dexterity: [
    'Archaic Guns', 'Blaster', 'Blaster Artillery', 'Bowcaster', 'Bows',
    'Brawling Parry', 'Dodge', 'Firearms', 'Grenade', 'Lightsaber',
    'Melee Combat', 'Melee Parry', 'Missile Weapons', 'Pick Pocket',
    'Running', 'Thrown Weapons', 'Vehicle Blasters'
  ],
  knowledge: [
    'Alien Species', 'Bureaucracy', 'Business', 'Cultures', 'Intimidation',
    'Languages', 'Law Enforcement', 'Planetary Systems', 'Scholar',
    'Streetwise', 'Survival', 'Tactics', 'Value', 'Willpower'
  ],
  mechanical: [
    'Astrogation', 'Beast Riding', 'Capital Ship Gunnery', 'Capital Ship Piloting',
    'Capital Ship Shields', 'Communications', 'Ground Vehicle Operation',
    'Hover Vehicle Operation', 'Jet Pack Operation', 'Powersuit Operation',
    'Repulsorlift Operation', 'Sensors', 'Space Transports',
    'Starfighter Piloting', 'Starship Gunnery', 'Starship Shields',
    'Swoop Operation', 'Walker Operation'
  ],
  perception: [
    'Bargain', 'Command', 'Con', 'Forgery', 'Gambling', 'Hide',
    'Investigation', 'Persuasion', 'Search', 'Sneak'
  ],
  strength: [
    'Brawling', 'Climbing/Jumping', 'Lifting', 'Stamina', 'Swimming'
  ],
  technical: [
    'Armor Repair', 'Blaster Repair', 'Capital Ship Repair',
    'Computer Programming/Repair', 'Demolitions', 'Droid Programming',
    'Droid Repair', 'First Aid', 'Ground Vehicle Repair', 'Lightsaber Repair',
    'Medicine', 'Repulsorlift Repair', 'Security', 'Space Transports Repair',
    'Starfighter Repair', 'Starship Weapon Repair', 'Walker Repair'
  ]
};

// Wound track (WEG 2e). Stored on systemData.woundStatus as the `value`.
const WOUND_LEVELS = [
  { value: 'stunned', label: 'Stunned' },
  { value: 'wounded', label: 'Wounded' },
  { value: 'wounded2', label: 'Wounded Twice' },
  { value: 'incapacitated', label: 'Incapacitated' },
  { value: 'mortal', label: 'Mortally Wounded' }
];

// --- Dice code helpers ("3D", "4D+2", "5D+1") ---------------------------

// Parse a dice code string into { dice, pips }. Returns null if unparseable.
function parseDiceCode(code) {
  if (code == null) return null;
  const m = String(code).trim().match(/^(\d+)\s*D\s*(?:\+\s*([12]))?$/i);
  if (!m) return null;
  return { dice: parseInt(m[1], 10), pips: parseInt(m[2] || '0', 10) };
}

// Format { dice, pips } back into a canonical dice code, carrying 3 pips into a die.
function formatDiceCode({ dice = 0, pips = 0 } = {}) {
  const totalPips = dice * 3 + pips;
  const d = Math.floor(totalPips / 3);
  const p = totalPips % 3;
  return p > 0 ? `${d}D+${p}` : `${d}D`;
}

// Blank attribute block used when a character has no saved attributes yet.
function createEmptyAttributes() {
  const attrs = {};
  for (const name of ATTRIBUTES) {
    attrs[name.toLowerCase()] = { dice: '2D', skills: [] };
  }
  return attrs;
}

const SPECIES = [
  'Human',
  'Wookiee',
  'Twi\'lek',
  'Rodian',
  'Mon Calamari',
  'Bothan',
  'Trandoshan',
  'Ewok',
  'Sullustan',
  'Duros',
  'Gamorrean',
  'Ithorian'
];

const TEMPLATES = [
  'Smuggler',
  'Bounty Hunter',
  'Jedi Knight',
  'Rebel Pilot',
  'Imperial Officer',
  'Diplomat',
  'Scout',
  'Mercenary',
  'Droid',
  'Force Adept',
  'Technician',
  'Entertainer'
];

// Scale types for combat
const SCALES = [
  { value: 'character', label: 'Character' },
  { value: 'speeder', label: 'Speeder' },
  { value: 'walker', label: 'Walker' },
  { value: 'starfighter', label: 'Starfighter' },
  { value: 'capital', label: 'Capital Ship' }
];

// Availability ratings
const AVAILABILITY_RATINGS = [
  { value: '1', label: '1 - Readily Available' },
  { value: '2', label: '2 - Common' },
  { value: '3', label: '3 - Available' },
  { value: '4', label: '4 - Scarce' },
  { value: 'F', label: 'F - Black Market (Illegal)' },
  { value: 'R', label: 'R - Restricted (Military)' },
  { value: 'X', label: 'X - Rare/Unique' }
];

// Weapon categories
const WEAPON_CATEGORIES = [
  { value: 'blaster-pistol', label: 'Blaster Pistol' },
  { value: 'blaster-rifle', label: 'Blaster Rifle' },
  { value: 'heavy-weapon', label: 'Heavy Weapon' },
  { value: 'melee', label: 'Melee Weapon' },
  { value: 'lightsaber', label: 'Lightsaber' },
  { value: 'explosive', label: 'Explosive/Grenade' },
  { value: 'vehicle-weapon', label: 'Vehicle Weapon' },
  { value: 'starship-weapon', label: 'Starship Weapon' }
];

// Item Templates for Star Wars D6
const ITEM_TEMPLATES = {
  weapon: {
    label: 'Weapon',
    icon: 'sword',
    fields: {
      category: {
        type: 'select',
        label: 'Category',
        options: WEAPON_CATEGORIES,
        required: true
      },
      scale: {
        type: 'select',
        label: 'Scale',
        options: SCALES,
        required: true,
        default: 'character'
      },
      skill: {
        type: 'text',
        label: 'Skill',
        placeholder: 'Blaster, Melee Combat, Lightsaber, etc.',
        required: true
      },
      damage: {
        type: 'text',
        label: 'Damage',
        placeholder: '4D, 5D+2, 8D, etc.',
        required: true
      },
      range: {
        type: 'text',
        label: 'Range',
        placeholder: '3-10/30/120, etc.'
      },
      fireRate: {
        type: 'text',
        label: 'Fire Rate',
        placeholder: '1, 3, etc.'
      },
      ammo: {
        type: 'text',
        label: 'Ammo/Power Pack',
        placeholder: '100 shots, etc.'
      },
      availability: {
        type: 'select',
        label: 'Availability',
        options: AVAILABILITY_RATINGS,
        required: true
      },
      cost: {
        type: 'text',
        label: 'Cost',
        placeholder: '500 credits'
      }
    }
  },
  armor: {
    label: 'Armor',
    icon: 'shield',
    fields: {
      armorType: {
        type: 'select',
        label: 'Armor Type',
        options: [
          { value: 'light', label: 'Light Armor' },
          { value: 'medium', label: 'Medium Armor' },
          { value: 'heavy', label: 'Heavy Armor/Powered' },
          { value: 'helmet', label: 'Helmet Only' },
          { value: 'shield', label: 'Personal Shield' }
        ],
        required: true
      },
      physicalProtection: {
        type: 'text',
        label: 'Physical Protection',
        placeholder: '+1D, +2D, etc.',
        required: true
      },
      energyProtection: {
        type: 'text',
        label: 'Energy Protection',
        placeholder: '+1D, +2D, etc.',
        required: true
      },
      dexPenalty: {
        type: 'text',
        label: 'DEX Penalty',
        placeholder: '-1D, -2, none, etc.'
      },
      coverage: {
        type: 'text',
        label: 'Coverage',
        placeholder: 'Full body, Torso only, etc.'
      },
      availability: {
        type: 'select',
        label: 'Availability',
        options: AVAILABILITY_RATINGS,
        required: true
      },
      cost: {
        type: 'text',
        label: 'Cost',
        placeholder: '1000 credits'
      }
    }
  },
  equipment: {
    label: 'Equipment',
    icon: 'backpack',
    fields: {
      category: {
        type: 'select',
        label: 'Category',
        options: [
          { value: 'comms', label: 'Communications' },
          { value: 'sensors', label: 'Sensors & Detection' },
          { value: 'medical', label: 'Medical' },
          { value: 'survival', label: 'Survival Gear' },
          { value: 'tools', label: 'Tools' },
          { value: 'droid', label: 'Droid/Computer' },
          { value: 'security', label: 'Security' },
          { value: 'cybernetic', label: 'Cybernetic' },
          { value: 'force', label: 'Force-Related' },
          { value: 'misc', label: 'Miscellaneous' }
        ],
        required: true
      },
      gameEffect: {
        type: 'textarea',
        label: 'Game Effect',
        placeholder: 'Describe the mechanical effect...'
      },
      skillBonus: {
        type: 'text',
        label: 'Skill Bonus',
        placeholder: '+1D to Search, etc.'
      },
      availability: {
        type: 'select',
        label: 'Availability',
        options: AVAILABILITY_RATINGS,
        required: true
      },
      cost: {
        type: 'text',
        label: 'Cost',
        placeholder: '200 credits'
      }
    }
  }
};

// Game System Definition
export default {
  // System metadata
  id: 'starwarsd6',
  name: 'Star Wars D6',
  description: 'Classic West End Games D6 System - Character management with external sheet integration',
  version: '1.0.0',

  // Character schema definition (simplified - uses external sheets)
  characterSchema: {
    // Link to external character sheet
    characterSheetLink: {
      type: 'url',
      required: false,
      label: 'Character Sheet Link',
      placeholder: 'https://... (optional)'
    },
    // Template/Class
    template: {
      type: 'select',
      required: false,
      label: 'Template',
      options: TEMPLATES
    },
    // Species
    species: {
      type: 'select',
      required: false,
      label: 'Species',
      options: SPECIES
    },
    // Force Sensitive
    forceSensitive: {
      type: 'checkbox',
      required: false,
      label: 'Force Sensitive'
    },
    // Player notes for quick reference
    playerNotes: {
      type: 'textarea',
      required: false,
      label: 'Player Notes',
      placeholder: 'Quick notes about your character...'
    }
  },

  // Dice roller configuration - D6 dice pool system
  diceRoller: {
    type: 'd6-pool',
    dice: [
      {
        name: 'd6',
        sides: 6,
        icon: 'dice-6',
        color: '#FFD700' // Star Wars yellow/gold
      }
    ],
    mechanics: {
      type: 'dice-pool',
      description: 'Roll multiple D6s and sum them. Wild Die adds complications on 1s.',
      wildDie: true
    }
  },

  // Game data (kept for reference/tools view)
  attributes: ATTRIBUTES,
  skillsByAttribute: SKILLS_BY_ATTRIBUTE,
  woundLevels: WOUND_LEVELS,
  species: SPECIES,
  templates: TEMPLATES,

  // Item system
  itemTemplates: ITEM_TEMPLATES,
  scales: SCALES,
  availabilityRatings: AVAILABILITY_RATINGS,
  weaponCategories: WEAPON_CATEGORIES,

  // Campaign frame templates
  campaignFrameTemplates: STARWARSD6_CAMPAIGN_FRAMES,

  // External tools
  externalTools: [
    {
      name: 'D6 Holocron',
      url: 'http://d6holocron.com/',
      description: 'Comprehensive Star Wars D6 resource and rules reference',
      icon: 'book-open'
    },
    {
      name: 'Star Wars RPG Index',
      url: 'https://www.swrpgcommunity.com/gm-resources/gear-indexes',
      description: 'Index of Star Wars RPG books and supplements',
      icon: 'scroll-text'
    },
    {
      name: 'Rancor Pit',
      url: 'http://www.rancorpit.com/',
      description: 'Star Wars D6 fan community and resources',
      icon: 'users'
    }
  ],

  // UI theme customization - Star Wars black and yellow
  theme: {
    primary: '#000000', // Black
    secondary: '#FFD700', // Star Wars gold/yellow
    iconSet: 'sci-fi'
  }
};

// Export individual constants for convenience
export {
  ATTRIBUTES,
  SKILLS_BY_ATTRIBUTE,
  WOUND_LEVELS,
  SPECIES,
  TEMPLATES,
  ITEM_TEMPLATES,
  SCALES,
  AVAILABILITY_RATINGS,
  WEAPON_CATEGORIES,
  parseDiceCode,
  formatDiceCode,
  createEmptyAttributes
};
