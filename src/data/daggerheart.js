// Daggerheart System Data
// BACKWARDS COMPATIBILITY LAYER
// This file re-exports from the new systems architecture
// All new code should import from src/data/systems/daggerheart.js

export {
  default as DAGGERHEART_SYSTEM,
  CLASSES,
  DOMAINS,
  ANCESTRIES,
  COMMUNITIES,
  LORE_TYPES,
  TRAIT_RANGE,
  EXTERNAL_TOOLS
} from './systems/daggerheart.js';
