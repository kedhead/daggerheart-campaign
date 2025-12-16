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
