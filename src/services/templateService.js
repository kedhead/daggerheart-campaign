/**
 * Template Service for generating content without AI
 * Uses pre-built templates and random generators
 */

import {
  CAMPAIGN_FRAME_TEMPLATES,
  getTemplateById,
  getAvailableTemplates,
  getBlankTemplate
} from '../data/campaignFrameTemplates';

import {
  RANDOM_NAMES,
  RANDOM_OCCUPATIONS,
  RANDOM_LOCATIONS,
  LOCATION_PREFIXES,
  LOCATION_SUFFIXES,
  RANDOM_REGIONS,
  NPC_DESCRIPTIONS,
  ENCOUNTER_ENVIRONMENTS,
  ENCOUNTER_ENEMY_TYPES,
  ENCOUNTER_TACTICS,
  ENCOUNTER_REWARDS,
  TONE_FEEL_OPTIONS,
  THEME_OPTIONS,
  randomChoice,
  randomChoices
} from '../data/randomGenerators';

import {
  STARWARS_NAMES,
  STARWARS_OCCUPATIONS,
  STARWARS_LOCATIONS,
  STARWARS_LOCATION_PREFIXES,
  STARWARS_LOCATION_SUFFIXES,
  STARWARS_REGIONS,
  STARWARS_NPC_DESCRIPTIONS,
  STARWARS_ENCOUNTER_ENVIRONMENTS,
  STARWARS_ENCOUNTER_ENEMY_TYPES,
  STARWARS_ENCOUNTER_TACTICS,
  STARWARS_ENCOUNTER_REWARDS,
  STARWARS_TONE_FEEL_OPTIONS,
  STARWARS_THEME_OPTIONS
} from '../data/randomGenerators.starwars';

export const templateService = {
  /**
   * Get the appropriate template set based on game system
   * @private
   * @param {object} context - Context with campaign info
   * @returns {object} Template set
   */
  _getTemplateSet(context = {}) {
    const gameSystem = context.campaign?.gameSystem || context.gameSystem || 'daggerheart';

    if (gameSystem === 'starwarsd6') {
      return {
        names: STARWARS_NAMES,
        occupations: STARWARS_OCCUPATIONS,
        locations: STARWARS_LOCATIONS,
        locationPrefixes: STARWARS_LOCATION_PREFIXES,
        locationSuffixes: STARWARS_LOCATION_SUFFIXES,
        regions: STARWARS_REGIONS,
        npcDescriptions: STARWARS_NPC_DESCRIPTIONS,
        encounterEnvironments: STARWARS_ENCOUNTER_ENVIRONMENTS,
        encounterEnemyTypes: STARWARS_ENCOUNTER_ENEMY_TYPES,
        encounterTactics: STARWARS_ENCOUNTER_TACTICS,
        encounterRewards: STARWARS_ENCOUNTER_REWARDS,
        toneFeelOptions: STARWARS_TONE_FEEL_OPTIONS,
        themeOptions: STARWARS_THEME_OPTIONS
      };
    }

    // Default to fantasy templates for daggerheart, dnd5e, generic
    return {
      names: RANDOM_NAMES,
      occupations: RANDOM_OCCUPATIONS,
      locations: RANDOM_LOCATIONS,
      locationPrefixes: LOCATION_PREFIXES,
      locationSuffixes: LOCATION_SUFFIXES,
      regions: RANDOM_REGIONS,
      npcDescriptions: NPC_DESCRIPTIONS,
      encounterEnvironments: ENCOUNTER_ENVIRONMENTS,
      encounterEnemyTypes: ENCOUNTER_ENEMY_TYPES,
      encounterTactics: ENCOUNTER_TACTICS,
      encounterRewards: ENCOUNTER_REWARDS,
      toneFeelOptions: TONE_FEEL_OPTIONS,
      themeOptions: THEME_OPTIONS
    };
  },

  /**
   * Get all available campaign frame templates
   * @returns {array} Array of template objects
   */
  getTemplates() {
    return getAvailableTemplates();
  },

  /**
   * Load a specific campaign frame template
   * @param {string} templateId - Template ID
   * @returns {object|null} Template object
   */
  loadTemplate(templateId) {
    return getTemplateById(templateId);
  },

  /**
   * Generate a random NPC
   * @param {object} context - Optional context (relationship, occupation, location, campaign)
   * @returns {object} Generated NPC data
   */
  generateRandomNPC(context = {}) {
    const { relationship, occupation, location } = context;
    const templates = this._getTemplateSet(context);

    return {
      name: randomChoice(templates.names),
      occupation: occupation || randomChoice(templates.occupations),
      location: location || randomChoice(templates.locations),
      relationship: relationship || randomChoice(['ally', 'neutral', 'enemy']),
      description: randomChoice(templates.npcDescriptions),
      notes: '',
      firstMet: '',
      avatarUrl: ''
    };
  },

  /**
   * Generate a random Location
   * @param {object} context - Optional context (type, region, campaign)
   * @returns {object} Generated location data
   */
  generateRandomLocation(context = {}) {
    const { type, region } = context;
    const templates = this._getTemplateSet(context);
    const locationType = type || randomChoice(['city', 'town', 'village', 'dungeon', 'wilderness', 'landmark', 'other']);

    return {
      name: this._generateLocationName(locationType, templates),
      type: locationType,
      region: region || randomChoice(templates.regions),
      description: '',
      notableFeatures: '',
      secrets: '',
      inhabitants: '',
      mapUrl: ''
    };
  },

  /**
   * Generate a random Encounter
   * @param {object} context - Optional context (difficulty, partyLevel, campaign)
   * @returns {object} Generated encounter data
   */
  generateRandomEncounter(context = {}) {
    const { difficulty, partyLevel } = context;
    const templates = this._getTemplateSet(context);

    return {
      name: `${randomChoice(['Ambush', 'Skirmish', 'Battle', 'Confrontation'])} at ${randomChoice(templates.locations)}`,
      difficulty: difficulty || randomChoice(['easy', 'medium', 'hard', 'deadly']),
      partyLevel: partyLevel || 1,
      description: `The party encounters hostiles in ${randomChoice(templates.encounterEnvironments)}.`,
      enemies: randomChoice(templates.encounterEnemyTypes),
      environment: randomChoice(templates.encounterEnvironments),
      tactics: randomChoice(templates.encounterTactics),
      rewards: randomChoice(templates.encounterRewards),
      freshCutGrassLink: ''
    };
  },

  /**
   * Generate random Tone & Feel words
   * @param {number} count - Number of words to generate
   * @param {object} context - Optional context with campaign info
   * @returns {array} Array of tone/feel words
   */
  generateToneAndFeel(count = 6, context = {}) {
    const templates = this._getTemplateSet(context);
    return randomChoices(templates.toneFeelOptions, count);
  },

  /**
   * Generate random Themes
   * @param {number} count - Number of themes to generate
   * @param {object} context - Optional context with campaign info
   * @returns {array} Array of themes
   */
  generateThemes(count = 5, context = {}) {
    const templates = this._getTemplateSet(context);
    return randomChoices(templates.themeOptions, count);
  },

  /**
   * Generate a random campaign pitch
   * @param {object} context - Optional context (genre, setting, campaign)
   * @returns {string} Generated pitch
   */
  generatePitch(context = {}) {
    const gameSystem = context.campaign?.gameSystem || context.gameSystem || 'daggerheart';

    const fantasyTemplates = [
      'A tale of heroes rising to face an ancient threat.',
      'Unlikely allies must band together to prevent catastrophe.',
      'Dark forces gather as the world teeters on the brink.',
      'A journey of discovery that will change everything.',
      'When the old ways fail, new heroes must forge a new path.'
    ];

    const starwarsTemplates = [
      'A small band of rebels fights against the tyranny of the Empire.',
      'Smugglers and scoundrels caught between the Rebellion and Imperial forces.',
      'A quest across the galaxy to uncover ancient Force secrets.',
      'Bounty hunters navigate the dangerous underworld of the Outer Rim.',
      'When the Empire strikes, unlikely heroes must rise to resist.'
    ];

    const templates = gameSystem === 'starwarsd6' ? starwarsTemplates : fantasyTemplates;
    return randomChoice(templates);
  },

  /**
   * Generate random player principles
   * @param {number} count - Number of principles
   * @returns {array} Array of principles
   */
  generatePlayerPrinciples(count = 3) {
    const principles = [
      'Make it personal',
      'Embrace vulnerability',
      'Work together',
      'Take bold action',
      'Follow your character\'s truth',
      'Create connections',
      'Challenge assumptions',
      'Respect the world'
    ];

    return randomChoices(principles, count);
  },

  /**
   * Generate random GM principles
   * @param {number} count - Number of principles
   * @returns {array} Array of principles
   */
  generateGMPrinciples(count = 3) {
    const principles = [
      'Make the world feel alive',
      'Give them hard choices',
      'Show consequences',
      'Create compelling NPCs',
      'Balance danger and hope',
      'Reward creativity',
      'Build on their ideas',
      'Keep the momentum'
    ];

    return randomChoices(principles, count);
  },

  /**
   * Generate random session zero questions
   * @param {number} count - Number of questions
   * @returns {array} Array of questions
   */
  generateSessionZeroQuestions(count = 7) {
    const questions = [
      'What brought your character to this adventure?',
      'What is your character\'s greatest fear?',
      'Who do you care most about?',
      'What do you want to accomplish?',
      'What secret do you keep?',
      'How do you know the other party members?',
      'What line won\'t you cross?',
      'What is your character\'s dream?',
      'What haunts you from your past?',
      'What makes you different from others?'
    ];

    return randomChoices(questions, count);
  },

  /**
   * Generate a random inciting incident
   * @param {object} context - Optional context with campaign info
   * @returns {string} Inciting incident
   */
  generateIncitingIncident(context = {}) {
    const gameSystem = context.campaign?.gameSystem || context.gameSystem || 'daggerheart';

    const fantasyIncidents = [
      'A mysterious stranger arrives with an urgent plea for help.',
      'Someone you care about goes missing under strange circumstances.',
      'An ancient evil stirs after centuries of slumber.',
      'A powerful artifact is stolen, threatening the balance of power.',
      'War breaks out, forcing you to choose sides.',
      'A natural disaster reveals long-buried secrets.',
      'You witness a crime that puts you in danger.',
      'A prophecy names you as key to preventing catastrophe.'
    ];

    const starwarsIncidents = [
      'An Imperial Star Destroyer arrives, demanding surrender of a fugitive.',
      'Your ship is damaged and forced to land on a dangerous planet.',
      'A distress signal from a Rebel base leads you into an Imperial trap.',
      'You discover plans for a devastating Imperial superweapon.',
      'Bounty hunters capture someone you care about.',
      'A Jedi holocron reveals the location of a hidden Force artifact.',
      'The Empire blockades your homeworld, cutting off all supplies.',
      'You witness the destruction of a peaceful planet by the Empire.'
    ];

    const incidents = gameSystem === 'starwarsd6' ? starwarsIncidents : fantasyIncidents;
    return randomChoice(incidents);
  },

  // Private helper methods

  /**
   * Generate a location name based on type
   * @private
   * @param {string} type - Location type
   * @param {object} templates - Template set to use
   */
  _generateLocationName(type, templates) {
    const prefix = randomChoice(templates.locationPrefixes);
    const suffixes = templates.locationSuffixes[type] || templates.locationSuffixes.other;
    const suffix = randomChoice(suffixes);

    return `${prefix} ${suffix}`;
  }
};
