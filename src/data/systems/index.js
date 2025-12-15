// Game System Registry
// This module manages loading and accessing game system definitions

import daggerheart from './daggerheart.js';
import dnd5e from './dnd5e.js';
import starwarsd6 from './starwarsd6.js';

// Registry of all available game systems
const GAME_SYSTEMS = {
  daggerheart,
  dnd5e,
  starwarsd6
};

/**
 * Get a game system definition by ID
 * @param {string} systemId - The game system identifier (e.g., 'daggerheart', 'dnd5e')
 * @returns {Object|null} The game system definition or null if not found
 */
export function getGameSystem(systemId) {
  if (!systemId) {
    console.warn('No game system ID provided, defaulting to daggerheart');
    return GAME_SYSTEMS.daggerheart;
  }

  const system = GAME_SYSTEMS[systemId];

  if (!system) {
    console.error(`Game system '${systemId}' not found, defaulting to daggerheart`);
    return GAME_SYSTEMS.daggerheart;
  }

  return system;
}

/**
 * Get all available game systems
 * @returns {Array} Array of game system definitions
 */
export function getAllGameSystems() {
  return Object.values(GAME_SYSTEMS);
}

/**
 * Check if a game system exists
 * @param {string} systemId - The game system identifier
 * @returns {boolean} True if the system exists
 */
export function hasGameSystem(systemId) {
  return systemId in GAME_SYSTEMS;
}

/**
 * Get list of all game system IDs
 * @returns {Array<string>} Array of system IDs
 */
export function getGameSystemIds() {
  return Object.keys(GAME_SYSTEMS);
}

// Default export for convenience
export default {
  getGameSystem,
  getAllGameSystems,
  hasGameSystem,
  getGameSystemIds,
  GAME_SYSTEMS
};
