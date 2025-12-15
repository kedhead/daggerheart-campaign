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
  species: SPECIES,
  templates: TEMPLATES,

  // Campaign frame templates
  campaignFrameTemplates: STARWARSD6_CAMPAIGN_FRAMES,

  // External tools
  externalTools: [
    {
      name: 'D6 Holocron',
      url: 'https://d6holocron.com/',
      description: 'Comprehensive Star Wars D6 resource and rules reference',
      icon: 'book-open'
    },
    {
      name: 'Star Wars RPG Index',
      url: 'http://www.starwarsrpgindex.com/',
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
  SPECIES,
  TEMPLATES
};
