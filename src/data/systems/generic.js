// Item Templates for Generic RPG - Flexible and customizable
const ITEM_TEMPLATES = {
  weapon: {
    label: 'Weapon',
    icon: 'sword',
    fields: {
      weaponType: {
        type: 'text',
        label: 'Weapon Type',
        placeholder: 'Sword, Bow, Staff, Gun, etc.',
        required: true
      },
      damage: {
        type: 'text',
        label: 'Damage',
        placeholder: '1d8, 2d6+3, 3 wounds, etc.',
        required: true
      },
      damageType: {
        type: 'text',
        label: 'Damage Type',
        placeholder: 'Slashing, Fire, Kinetic, etc.'
      },
      range: {
        type: 'text',
        label: 'Range',
        placeholder: 'Melee, 30ft, 100m, etc.'
      },
      properties: {
        type: 'text',
        label: 'Properties/Tags',
        placeholder: 'Two-handed, Finesse, Accurate, etc.'
      },
      skillUsed: {
        type: 'text',
        label: 'Skill/Attribute Used',
        placeholder: 'Melee Combat, Shooting, etc.'
      },
      rarity: {
        type: 'select',
        label: 'Rarity/Quality',
        options: [
          { value: 'common', label: 'Common' },
          { value: 'uncommon', label: 'Uncommon' },
          { value: 'rare', label: 'Rare' },
          { value: 'epic', label: 'Epic' },
          { value: 'legendary', label: 'Legendary' },
          { value: 'unique', label: 'Unique' }
        ]
      },
      cost: {
        type: 'text',
        label: 'Cost/Value',
        placeholder: '50 gold, 100 credits, etc.'
      },
      weight: {
        type: 'text',
        label: 'Weight/Encumbrance',
        placeholder: '5 lbs, 2 slots, etc.'
      },
      specialRules: {
        type: 'textarea',
        label: 'Special Rules/Abilities',
        placeholder: 'Any special game mechanics...'
      }
    }
  },
  armor: {
    label: 'Armor',
    icon: 'shield',
    fields: {
      armorType: {
        type: 'text',
        label: 'Armor Type',
        placeholder: 'Light, Medium, Heavy, Shield, etc.',
        required: true
      },
      protection: {
        type: 'text',
        label: 'Protection Value',
        placeholder: '+5 AC, 3 armor, DR 2, etc.',
        required: true
      },
      penalties: {
        type: 'text',
        label: 'Penalties/Restrictions',
        placeholder: '-2 Stealth, Max Dex +2, etc.'
      },
      coverage: {
        type: 'text',
        label: 'Coverage',
        placeholder: 'Full body, Torso, Head, etc.'
      },
      rarity: {
        type: 'select',
        label: 'Rarity/Quality',
        options: [
          { value: 'common', label: 'Common' },
          { value: 'uncommon', label: 'Uncommon' },
          { value: 'rare', label: 'Rare' },
          { value: 'epic', label: 'Epic' },
          { value: 'legendary', label: 'Legendary' },
          { value: 'unique', label: 'Unique' }
        ]
      },
      cost: {
        type: 'text',
        label: 'Cost/Value',
        placeholder: '200 gold, 500 credits, etc.'
      },
      weight: {
        type: 'text',
        label: 'Weight/Encumbrance',
        placeholder: '20 lbs, 4 slots, etc.'
      },
      specialRules: {
        type: 'textarea',
        label: 'Special Rules/Abilities',
        placeholder: 'Any special game mechanics...'
      }
    }
  },
  equipment: {
    label: 'Equipment',
    icon: 'backpack',
    fields: {
      category: {
        type: 'text',
        label: 'Category',
        placeholder: 'Potion, Tool, Gear, Consumable, etc.',
        required: true
      },
      effect: {
        type: 'textarea',
        label: 'Effect/Use',
        placeholder: 'What does this item do when used?',
        required: true
      },
      uses: {
        type: 'text',
        label: 'Uses/Charges',
        placeholder: 'Single use, 3 charges, Unlimited, etc.'
      },
      duration: {
        type: 'text',
        label: 'Duration',
        placeholder: '1 hour, Instant, Permanent, etc.'
      },
      rarity: {
        type: 'select',
        label: 'Rarity/Quality',
        options: [
          { value: 'common', label: 'Common' },
          { value: 'uncommon', label: 'Uncommon' },
          { value: 'rare', label: 'Rare' },
          { value: 'epic', label: 'Epic' },
          { value: 'legendary', label: 'Legendary' },
          { value: 'unique', label: 'Unique' }
        ]
      },
      cost: {
        type: 'text',
        label: 'Cost/Value',
        placeholder: '25 gold, 50 credits, etc.'
      },
      weight: {
        type: 'text',
        label: 'Weight/Encumbrance',
        placeholder: '1 lb, 0.5 slots, etc.'
      },
      requirements: {
        type: 'text',
        label: 'Requirements',
        placeholder: 'Attunement, Level 5+, Spellcaster, etc.'
      }
    }
  }
};

export default {
  // Metadata
  id: 'generic',
  name: 'Generic RPG',
  description: 'A flexible system for any RPG - perfect for homebrew games and lesser-known systems',
  version: '1.0.0',

  // Character Schema
  characterSchema: {
    // Core Identity
    name: {
      type: 'text',
      label: 'Character Name',
      required: true
    },
    characterClass: {
      type: 'text',
      label: 'Class/Archetype',
      required: false,
      placeholder: 'Warrior, Mage, Rogue, etc.'
    },
    level: {
      type: 'number',
      label: 'Level/Rank',
      default: 1,
      min: 1,
      max: 20
    },

    // External Links
    characterSheetLink: {
      type: 'url',
      label: 'Character Sheet Link',
      required: false,
      placeholder: 'https://...'
    },

    // Flexible Attributes (customizable array)
    attributes: {
      type: 'array',
      label: 'Attributes',
      description: 'Core stats and characteristics',
      itemSchema: {
        name: { type: 'text', label: 'Attribute Name', placeholder: 'Strength, Agility, etc.' },
        value: { type: 'number', label: 'Value', default: 10 }
      },
      default: [
        { name: 'Strength', value: 10 },
        { name: 'Dexterity', value: 10 },
        { name: 'Constitution', value: 10 },
        { name: 'Intelligence', value: 10 },
        { name: 'Wisdom', value: 10 },
        { name: 'Charisma', value: 10 }
      ]
    },

    // Flexible Skills (customizable array)
    skills: {
      type: 'array',
      label: 'Skills',
      description: 'Trained abilities and proficiencies',
      itemSchema: {
        name: { type: 'text', label: 'Skill Name', placeholder: 'Athletics, Stealth, etc.' },
        value: { type: 'number', label: 'Bonus/Rank', default: 0 }
      },
      default: []
    },

    // Flexible Abilities (customizable array)
    abilities: {
      type: 'array',
      label: 'Special Abilities/Powers',
      description: 'Unique powers, spells, or special abilities',
      itemSchema: {
        name: { type: 'text', label: 'Ability Name', placeholder: 'Fireball, Rage, etc.' },
        description: { type: 'textarea', label: 'Description', placeholder: 'Describe what this ability does...' }
      },
      default: []
    },

    // Vitals
    hp: {
      type: 'number',
      label: 'Current Hit Points',
      default: 10,
      min: 0
    },
    maxHp: {
      type: 'number',
      label: 'Max Hit Points',
      default: 10,
      min: 1
    },

    // Defenses
    armorClass: {
      type: 'number',
      label: 'Armor Class / Defense',
      default: 10,
      min: 0
    },

    // Notes
    background: {
      type: 'textarea',
      label: 'Background',
      required: false,
      placeholder: 'Character backstory, personality, appearance...'
    },
    equipment: {
      type: 'textarea',
      label: 'Equipment & Inventory',
      required: false,
      placeholder: 'Weapons, armor, items...'
    },
    playerNotes: {
      type: 'textarea',
      label: 'Player Notes',
      required: false,
      placeholder: 'Campaign notes, goals, reminders...'
    }
  },

  // Dice Roller Configuration
  diceRoller: {
    type: 'polyhedral',
    dice: [
      { name: 'd4', sides: 4, color: '#10b981' },
      { name: 'd6', sides: 6, color: '#3b82f6' },
      { name: 'd8', sides: 8, color: '#8b5cf6' },
      { name: 'd10', sides: 10, color: '#ec4899' },
      { name: 'd12', sides: 12, color: '#f59e0b' },
      { name: 'd20', sides: 20, color: '#ef4444' }
    ],
    mechanics: {
      type: 'standard',
      allowMultipleDice: true,
      allowModifiers: true,
      defaultQuantity: 1,
      defaultModifier: 0,
      maxDice: 10
    }
  },

  // Item system
  itemTemplates: ITEM_TEMPLATES,

  // External Tools
  externalTools: [
    {
      name: 'RPG Tools',
      url: 'https://donjon.bin.sh/',
      description: 'Generators and tools for various RPG systems',
      icon: 'sparkles'
    },
    {
      name: 'Roll20',
      url: 'https://roll20.net/',
      description: 'Virtual tabletop for online play',
      icon: 'sword'
    },
    {
      name: 'World Anvil',
      url: 'https://www.worldanvil.com/',
      description: 'World building and campaign management',
      icon: 'book-open'
    }
  ],

  // Theme
  theme: {
    primary: '#6366f1',      // Indigo
    secondary: '#8b5cf6',    // Purple
    accent: '#ec4899',       // Pink
    iconSet: 'generic'
  }
};

// Export individual constants for convenience
export { ITEM_TEMPLATES };
