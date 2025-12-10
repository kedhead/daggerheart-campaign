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

export const templateService = {
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
   * @param {object} context - Optional context (relationship, occupation, location)
   * @returns {object} Generated NPC data
   */
  generateRandomNPC(context = {}) {
    const { relationship, occupation, location } = context;

    return {
      name: randomChoice(RANDOM_NAMES),
      occupation: occupation || randomChoice(RANDOM_OCCUPATIONS),
      location: location || randomChoice(RANDOM_LOCATIONS),
      relationship: relationship || randomChoice(['ally', 'neutral', 'enemy']),
      description: randomChoice(NPC_DESCRIPTIONS),
      notes: '',
      firstMet: '',
      avatarUrl: ''
    };
  },

  /**
   * Generate a random Location
   * @param {object} context - Optional context (type, region)
   * @returns {object} Generated location data
   */
  generateRandomLocation(context = {}) {
    const { type, region } = context;
    const locationType = type || randomChoice(['city', 'town', 'village', 'dungeon', 'wilderness', 'landmark', 'other']);

    return {
      name: this._generateLocationName(locationType),
      type: locationType,
      region: region || randomChoice(RANDOM_REGIONS),
      description: '',
      notableFeatures: '',
      secrets: '',
      inhabitants: '',
      mapUrl: ''
    };
  },

  /**
   * Generate a random Encounter
   * @param {object} context - Optional context (difficulty, partyLevel)
   * @returns {object} Generated encounter data
   */
  generateRandomEncounter(context = {}) {
    const { difficulty, partyLevel } = context;

    return {
      name: `${randomChoice(['Ambush', 'Skirmish', 'Battle', 'Confrontation'])} at ${randomChoice(RANDOM_LOCATIONS)}`,
      difficulty: difficulty || randomChoice(['easy', 'medium', 'hard', 'deadly']),
      partyLevel: partyLevel || 1,
      description: `The party encounters hostiles in ${randomChoice(ENCOUNTER_ENVIRONMENTS)}.`,
      enemies: randomChoice(ENCOUNTER_ENEMY_TYPES),
      environment: randomChoice(ENCOUNTER_ENVIRONMENTS),
      tactics: randomChoice(ENCOUNTER_TACTICS),
      rewards: randomChoice(ENCOUNTER_REWARDS),
      freshCutGrassLink: ''
    };
  },

  /**
   * Generate random Tone & Feel words
   * @param {number} count - Number of words to generate
   * @returns {array} Array of tone/feel words
   */
  generateToneAndFeel(count = 6) {
    return randomChoices(TONE_FEEL_OPTIONS, count);
  },

  /**
   * Generate random Themes
   * @param {number} count - Number of themes to generate
   * @returns {array} Array of themes
   */
  generateThemes(count = 5) {
    return randomChoices(THEME_OPTIONS, count);
  },

  /**
   * Generate a random campaign pitch
   * @param {object} context - Optional context (genre, setting)
   * @returns {string} Generated pitch
   */
  generatePitch(context = {}) {
    const templates = [
      'A tale of heroes rising to face an ancient threat.',
      'Unlikely allies must band together to prevent catastrophe.',
      'Dark forces gather as the world teeters on the brink.',
      'A journey of discovery that will change everything.',
      'When the old ways fail, new heroes must forge a new path.'
    ];

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
   * @returns {string} Inciting incident
   */
  generateIncitingIncident() {
    const incidents = [
      'A mysterious stranger arrives with an urgent plea for help.',
      'Someone you care about goes missing under strange circumstances.',
      'An ancient evil stirs after centuries of slumber.',
      'A powerful artifact is stolen, threatening the balance of power.',
      'War breaks out, forcing you to choose sides.',
      'A natural disaster reveals long-buried secrets.',
      'You witness a crime that puts you in danger.',
      'A prophecy names you as key to preventing catastrophe.'
    ];

    return randomChoice(incidents);
  },

  // Private helper methods

  /**
   * Generate a location name based on type
   * @private
   */
  _generateLocationName(type) {
    const prefix = randomChoice(LOCATION_PREFIXES);
    const suffixes = LOCATION_SUFFIXES[type] || LOCATION_SUFFIXES.other;
    const suffix = randomChoice(suffixes);

    return `${prefix} ${suffix}`;
  }
};
