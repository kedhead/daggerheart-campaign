// D&D 5e Game System Definition
// Fifth Edition Dungeons & Dragons compatible system
// Uses D&D Beyond for detailed character sheets

import { DND5E_CAMPAIGN_FRAMES } from '../dnd5eCampaignFrames.js';

const CLASSES = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];

const RACES = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'];

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
    secondary: '#2d3748', // dark gray
    iconSet: 'medieval'
  }
};

// Export individual constants for convenience
export {
  CLASSES,
  RACES
};
