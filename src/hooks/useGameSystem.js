import { useState, useEffect } from 'react';
import { getGameSystem } from '../data/systems/index.js';

/**
 * Hook to load and manage game system data
 * @param {string} systemId - The game system identifier (e.g., 'daggerheart', 'dnd5e')
 * @returns {Object} Object containing game system data and loading state
 */
export function useGameSystem(systemId = 'daggerheart') {
  const [gameSystem, setGameSystem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      setLoading(true);
      setError(null);

      const system = getGameSystem(systemId);

      if (!system) {
        throw new Error(`Game system '${systemId}' not found`);
      }

      setGameSystem(system);
    } catch (err) {
      console.error('Error loading game system:', err);
      setError(err.message);
      // Fallback to Daggerheart on error
      const fallbackSystem = getGameSystem('daggerheart');
      setGameSystem(fallbackSystem);
    } finally {
      setLoading(false);
    }
  }, [systemId]);

  return {
    gameSystem,
    loading,
    error,
    // Convenience accessors
    classes: gameSystem?.classes,
    characterSchema: gameSystem?.characterSchema,
    diceRoller: gameSystem?.diceRoller,
    externalTools: gameSystem?.externalTools
  };
}

export default useGameSystem;
