/**
 * Portrait Generator Service
 * Generates character portraits using OpenAI gpt-image-1
 */

import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { ANCESTRIES } from '../data/systems/daggerheart';

/**
 * Visual appearance hints for Daggerheart ancestries.
 * Used to enrich image prompts so the AI knows what each fantasy race looks like.
 */
export const ANCESTRY_VISUAL_HINTS = {
  'Clank': 'a mechanical automaton made of gears, brass, and enchanted metal plates, with glowing eyes and articulated joints. NOT organic, NOT human-skinned',
  'Daemon': 'a humanoid with dark or luminous otherworldly skin bearing subtle glowing markings, faintly glowing eyes, and an aura of supernatural energy',
  'Drakona': 'a humanoid covered in reptilian scales with a draconic snout, ridged brow, fanged teeth, and a powerful tail. Clearly dragon-like, NOT elf-like',
  'Dragonborn': 'a humanoid covered in reptilian scales with a draconic snout, ridged brow, fanged teeth, and a powerful tail. Clearly dragon-like, NOT elf-like',
  'Dwarf': 'a short stocky humanoid standing about 4-5 feet tall with a thick beard, broad shoulders, and a sturdy powerful build',
  'Elf': 'a tall graceful humanoid with distinctly long pointed ears, angular features, and an ethereal quality',
  'Faerie': 'a tiny winged fey creature no larger than a hand, with iridescent dragonfly or butterfly wings and delicate fine-boned features',
  'Faun': 'a humanoid with the furry legs and hooves of a goat, small curved horns on the forehead, and pointed ears',
  'Firbolg': 'a massive 7-to-8-foot-tall gentle giant humanoid with a wide flat bovine-like nose, thick earth-toned gray-green or brown skin, a heavy muscular frame, shaggy hair, small round ears (NOT pointed), and a peaceful wise expression. Enormous and nature-connected, resembling a gentle giant more than any elf',
  'Fungril': 'a mushroom-like humanoid with a large cap-shaped head, spore-covered mottled skin, and bioluminescent patches of light across the body',
  'Galapa': 'a turtle-like humanoid with a large domed shell on the back, leathery green-brown skin, a turtle-like face with a beak, and a wise weathered expression',
  'Giant': 'an enormous humanoid standing over 10 feet tall, massively muscular, towering over everything around them',
  'Goblin': 'a small scrappy humanoid about 3 feet tall with large pointed ears, a wide mouth with sharp teeth, and mottled green or gray skin',
  'Halfling': 'a cheerful small humanoid about 3 feet tall with curly hair, large bare feet, and a round friendly face',
  'Human': 'a human with normal human features',
  'Inferis': 'a humanoid with deep reddish or charcoal-dark skin, small curved horns on the head, a pointed tail, and faintly glowing eyes hinting at infernal power',
  'Katari': 'a feline humanoid with cat-like pointed ears, visible whiskers, a long tail, and fur-covered skin with cat-like facial features',
  'Orc': 'a tall powerfully-built humanoid with prominent upward-jutting tusks, a strong jaw, thick neck, and green or gray skin',
  'Ribbet': 'a frog-like humanoid with smooth moist amphibious skin in green or blue-gray, very wide eyes on a broad flat head, wide mouth, and webbed hands',
  'Simiah': 'an ape-like humanoid with long powerful arms reaching the ground, a broad chest, dark fur, and primate facial features with a prominent brow',
};

/**
 * Download an image from a URL and convert to data URL
 * Uses backend proxy to avoid CORS issues
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<string>} Data URL (base64)
 */
async function downloadImageAsDataUrl(imageUrl) {
  try {
    const response = await fetch('/api/download-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageUrl })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Failed to download image: ${response.statusText}`);
    }

    const data = await response.json();
    return data.dataUrl;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

/**
 * Generate a portrait image using gpt-image-1 via the backend proxy
 * @param {string} prompt - Image prompt
 * @param {string} [apiKey] - Optional OpenAI API key; server uses OPENAI_API_KEY env var if omitted
 * @returns {Promise<string>} Image data URL (base64)
 */
async function generatePortraitImage(prompt, apiKey) {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, apiKey: apiKey || undefined, type: 'portrait' })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Portrait generation failed: ${response.statusText}`);
  }

  const data = await response.json();
  const imageUrl = data.imageUrl;

  // gpt-image-1 returns base64 as a data URL — skip the download round-trip
  if (imageUrl && imageUrl.startsWith('data:')) return imageUrl;

  // Download and convert to data URL so it doesn't expire
  console.log('Downloading portrait to convert to data URL...');
  const dataUrl = await downloadImageAsDataUrl(imageUrl);
  console.log('Portrait converted to data URL');

  return dataUrl;
}

/**
 * Sanitize text to remove potential image model safety triggers
 * @param {string} text - Input text
 * @returns {string} Sanitized text
 */
function sanitizePortraitText(text) {
  if (!text) return '';
  return text
    .replace(/fracture/gi, 'mark')
    .replace(/shattering/gi, 'breaking')
    .replace(/flesh/gi, 'skin')
    .replace(/blood/gi, 'crimson')
    .replace(/gore/gi, 'mess')
    .replace(/severed/gi, 'missing')
    .replace(/corpse/gi, 'fallen')
    .replace(/kill/gi, 'defeat')
    .replace(/death/gi, 'end')
    .replace(/torture/gi, 'torment');
}

/**
 * Build an image prompt for a player character portrait
 * @param {object} character - Character data with name, class, ancestry, appearanceDescription, etc.
 * @param {string} gameSystem - The game system (daggerheart, starwarsd6, etc.)
 * @returns {string} Image prompt
 */
function buildCharacterPortraitPrompt(character, gameSystem = 'daggerheart') {
  const { name, class: charClass, ancestry, appearanceDescription, backstory } = character;

  // Base style based on game system - more heroic for player characters
  let styleBase = '';
  if (gameSystem === 'starwarsd6') {
    styleBase = 'Star Wars hero character portrait, sci-fi aesthetic, heroic lighting, cinematic quality, protagonist vibes';
  } else if (gameSystem === 'dnd5e') {
    styleBase = 'Dungeons and Dragons hero portrait, detailed fantasy art style, heroic and adventurous lighting, painterly quality';
  } else {
    styleBase = 'Fantasy RPG hero portrait, detailed fantasy art style, heroic and adventurous lighting, painterly quality, protagonist vibes';
  }

  // Use appearance description if provided, fall back to backstory excerpt
  let appearance = appearanceDescription || '';
  if (!appearance && backstory) {
    // Extract first 200 chars of backstory for context
    appearance = backstory.substring(0, 200);
  }

  // Sanitize appearance text
  appearance = sanitizePortraitText(appearance);

  // Build character context
  let characterContext = name || 'an adventurer';
  if (charClass) {
    characterContext += `, a ${charClass}`;
  }

  // Enrich ancestry with visual description so the image model knows what the race looks like
  let ancestryDesc = '';
  if (ancestry) {
    const visualHint = ANCESTRY_VISUAL_HINTS[ancestry];
    if (visualHint) {
      ancestryDesc = `They are ${visualHint}.`;
    } else {
      // Fall back to the data file description if no visual hint exists
      const ancestryData = ANCESTRIES[ancestry];
      const fallbackDesc = ancestryData && typeof ancestryData === 'object' ? ancestryData.description : '';
      if (fallbackDesc) {
        ancestryDesc = `They are ${ancestry} — ${fallbackDesc}.`;
      } else {
        characterContext += ` of ${ancestry} ancestry`;
      }
    }
  }

  // Construct the full prompt — ancestry goes first so the model prioritises it
  const ancestryPrefix = ancestryDesc ? `${ancestryDesc} ` : '';
  const prompt = `${ancestryPrefix}${styleBase}. Portrait of ${characterContext}. ${appearance}. Heroic and determined expression. Head and shoulders portrait, detailed face, high quality, no text or labels.`;

  return prompt;
}

/**
 * Build an image prompt for an NPC portrait
 * @param {object} npc - NPC data with name, description, occupation, etc.
 * @param {string} gameSystem - The game system (daggerheart, starwarsd6, etc.)
 * @returns {string} Image prompt
 */
function buildNPCPortraitPrompt(npc, gameSystem = 'daggerheart') {
  const { name, description, occupation, relationship, ancestry } = npc;

  // Base style based on game system
  let styleBase = '';
  if (gameSystem === 'starwarsd6') {
    styleBase = 'Star Wars character portrait, sci-fi aesthetic, dramatic lighting, cinematic quality';
  } else {
    styleBase = 'Fantasy RPG character portrait, detailed fantasy art style, dramatic lighting, painterly quality';
  }

  // Enrich ancestry with visual description so the model renders the correct race
  // Ancestry hint goes FIRST so the model prioritises it over generic human defaults
  let ancestryDesc = '';
  if (ancestry && gameSystem === 'daggerheart') {
    const visualHint = ANCESTRY_VISUAL_HINTS[ancestry];
    if (visualHint) {
      ancestryDesc = `Subject is ${visualHint}.`;
    }
  }

  // Build character description (sanitise to avoid safety rejections)
  let characterDesc = description ? sanitizePortraitText(description) : '';

  // Add occupation context
  let occupationContext = occupation ? `, ${occupation}` : '';

  // Add mood/expression based on relationship
  let expression = 'neutral expression';
  if (relationship === 'ally') {
    expression = 'friendly and approachable expression';
  } else if (relationship === 'enemy') {
    expression = 'menacing or intense expression';
  }

  // Ancestry hint leads the prompt so the model doesn't default to human/elf
  const ancestryPrefix = ancestryDesc ? `${ancestryDesc} ` : '';
  const prompt = `${ancestryPrefix}${styleBase}. Portrait of ${name || 'a character'}${occupationContext}. ${characterDesc}. ${expression}. Head and shoulders portrait, detailed face, high quality, no text or labels.`;

  return prompt;
}

/**
 * Keywords/patterns that indicate a non-humanoid creature.
 * Used by buildAdversaryPortraitPrompt to decide between portrait vs full-body illustration.
 */
const CREATURE_KEYWORDS = [
  'ooze', 'slime', 'jelly', 'blob', 'amorphous',
  'beast', 'animal', 'insect', 'spider', 'serpent', 'snake', 'worm',
  'elemental', 'golem', 'construct', 'automaton',
  'plant', 'fungus', 'mushroom', 'vine', 'treant',
  'swarm', 'horde', 'colony',
  'spirit', 'ghost', 'wraith', 'specter', 'phantom', 'shade',
  'dragon', 'wyrm', 'drake', 'wyvern',
  'aberration', 'tentacle', 'eye', 'maw',
  'undead', 'skeleton', 'zombie',
  'demon', 'fiend',
  'wolf', 'bear', 'bat', 'rat', 'hawk', 'eagle', 'hound',
  'crab', 'scorpion', 'beetle', 'centipede',
  'fish', 'shark', 'kraken', 'leviathan', 'squid',
  'cube', 'sphere', 'orb',
  'shadow', 'mist', 'fog', 'cloud',
];

/**
 * Determine if an adversary is a non-humanoid creature based on its data.
 * @param {object} adversary - Adversary data
 * @returns {boolean} true if the adversary appears to be a creature/monster, not a humanoid
 */
function isCreatureAdversary(adversary) {
  const textToCheck = `${adversary.name || ''} ${adversary.description || ''} ${adversary.role || ''} ${adversary.type || ''}`.toLowerCase();
  return CREATURE_KEYWORDS.some(keyword => textToCheck.includes(keyword));
}

/**
 * Build an image prompt for an adversary image.
 * Unlike buildNPCPortraitPrompt, this detects whether the adversary is a humanoid
 * or a creature/monster and adjusts the prompt accordingly.
 * Creatures get full-body illustrations; humanoids get standard portraits.
 *
 * @param {object} adversary - Adversary data with name, description, role, tier, etc.
 * @param {string} gameSystem - The game system (daggerheart, starwarsd6, etc.)
 * @returns {string} Image prompt
 */
function buildAdversaryPortraitPrompt(adversary, gameSystem = 'daggerheart') {
  const { name, description, role, tier } = adversary;
  const isCreature = isCreatureAdversary(adversary);

  // Sanitize description
  const safeDesc = sanitizePortraitText(description || '');

  if (isCreature) {
    // --- Non-humanoid creature prompt ---
    // IMPORTANT: gpt-image-1 may rewrite prompts and has a strong human bias.
    // We must: (1) Lead with the creature description, (2) Never mention "human",
    // "person", "figure", "portrait", "face" etc — even negatively, (3) Describe
    // the creature positively with specific visual details so the model can't default
    // to a humanoid interpretation.
    let styleBase = '';
    if (gameSystem === 'starwarsd6') {
      styleBase = 'Sci-fi creature concept art, dramatic lighting, cinematic quality';
    } else {
      styleBase = 'Fantasy monster concept art, painterly style, dramatic lighting';
    }

    // Build a rich creature-specific description leading with what it IS
    const creatureName = name || 'a dangerous creature';
    const tierContext = tier ? `, threat level ${tier}` : '';

    return `${styleBase}. ${safeDesc || creatureName}. Full body view of the ${creatureName}${tierContext}, showing the complete creature from head to tail/base. The scene contains only this single creature in a dark atmospheric environment. No characters, no people, no adventurers in the scene — only the monster itself. Detailed creature anatomy, menacing, high quality illustration, no text or labels.`;
  } else {
    // --- Humanoid adversary prompt (similar to NPC but with enemy tone) ---
    let styleBase = '';
    if (gameSystem === 'starwarsd6') {
      styleBase = 'Star Wars villain character portrait, sci-fi aesthetic, dramatic sinister lighting, cinematic quality';
    } else {
      styleBase = 'Fantasy RPG villain portrait, detailed fantasy art style, dramatic sinister lighting, painterly quality';
    }

    const roleContext = role ? `, a ${role}` : '';
    const tierContext = tier ? ` (Tier ${tier} threat)` : '';

    return `${styleBase}. Portrait of ${name || 'a dangerous adversary'}${roleContext}${tierContext}. ${safeDesc}. Menacing and intense expression. Head and shoulders portrait, detailed face, high quality, no text or labels.`;
  }
}

/**
 * Generate an adversary portrait image.
 * Uses buildAdversaryPortraitPrompt which properly handles creatures vs humanoids.
 *
 * @param {object} adversary - Adversary data
 * @param {string} openaiKey - Optional OpenAI API key
 * @param {string} gameSystem - Game system for style
 * @param {string} campaignId - Campaign ID for storage
 * @returns {Promise<string>} Portrait URL
 */
export async function generateAdversaryPortrait(adversary, openaiKey, gameSystem = 'daggerheart', campaignId = null) {
  console.log('Building portrait prompt for adversary:', adversary.name);
  const prompt = buildAdversaryPortraitPrompt(adversary, gameSystem);
  console.log('Image prompt:', prompt);

  let dataUrl;
  try {
    dataUrl = await generatePortraitImage(prompt, openaiKey);
  } catch (error) {
    if (error.message && error.message.includes('safety system')) {
      console.warn(`Portrait generation for ${adversary.name} blocked by safety system. Retrying with simplified prompt...`);
      const safeAdversary = { ...adversary, description: '' };
      const safePrompt = buildAdversaryPortraitPrompt(safeAdversary, gameSystem);
      console.log('Safe image prompt:', safePrompt);
      dataUrl = await generatePortraitImage(safePrompt, openaiKey);
    } else {
      throw error;
    }
  }

  if (campaignId) {
    const storageUrl = await uploadPortraitToStorage(dataUrl, campaignId, `adv_${adversary.name}`);
    return storageUrl;
  }

  return dataUrl;
}

/**
 * Upload a data URL to Firebase Storage and return the download URL
 * @param {string} dataUrl - Base64 data URL
 * @param {string} campaignId - Campaign ID for storage path
 * @param {string} npcName - NPC name for filename
 * @returns {Promise<string>} Firebase Storage download URL
 */
async function uploadPortraitToStorage(dataUrl, campaignId, npcName) {
  const timestamp = Date.now();
  const safeName = (npcName || 'portrait').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  const storagePath = `campaigns/${campaignId}/portraits/${timestamp}_${safeName}.png`;
  const storageRef = ref(storage, storagePath);

  console.log('Uploading portrait to Firebase Storage...');
  await uploadString(storageRef, dataUrl, 'data_url');
  const downloadUrl = await getDownloadURL(storageRef);
  console.log('Portrait uploaded to Storage:', downloadUrl);

  return downloadUrl;
}

/**
 * Generate an NPC portrait
 * @param {object} npc - NPC data
 * @param {string} openaiKey - Optional OpenAI API key
 * @param {string} gameSystem - Game system for style
 * @param {string} campaignId - Campaign ID for storage (optional, will use data URL if not provided)
 * @returns {Promise<string>} Portrait URL (Firebase Storage URL if campaignId provided, otherwise data URL)
 */
export async function generateNPCPortrait(npc, openaiKey, gameSystem = 'daggerheart', campaignId = null) {
  // openaiKey is optional — the backend will use OPENAI_API_KEY env var if not provided

  console.log('Building portrait prompt for NPC:', npc.name);
  const prompt = buildNPCPortraitPrompt(npc, gameSystem);
  console.log('Image prompt:', prompt);

  let dataUrl;
  try {
    dataUrl = await generatePortraitImage(prompt, openaiKey);
  } catch (error) {
    // Check for safety system rejection
    if (error.message && error.message.includes('safety system')) {
      console.warn(`Portrait generation for ${npc.name} blocked by safety system. Retrying with simplified prompt...`);
      // Retry with description removed to be safe
      const safeNpc = { ...npc, description: '' };
      const safePrompt = buildNPCPortraitPrompt(safeNpc, gameSystem);
      console.log('Safe image prompt:', safePrompt);
      dataUrl = await generatePortraitImage(safePrompt, openaiKey);
    } else {
      throw error;
    }
  }

  // If campaignId provided, upload to Firebase Storage to avoid Firestore size limits
  if (campaignId) {
    const storageUrl = await uploadPortraitToStorage(dataUrl, campaignId, npc.name);
    return storageUrl;
  }

  return dataUrl;
}

/**
 * Generate a player character portrait
 * @param {object} character - Character data
 * @param {string} openaiKey - Optional OpenAI API key
 * @param {string} gameSystem - Game system for style
 * @param {string} campaignId - Campaign ID for storage (optional, will use data URL if not provided)
 * @returns {Promise<string>} Portrait URL (Firebase Storage URL if campaignId provided, otherwise data URL)
 */
export async function generateCharacterPortrait(character, openaiKey, gameSystem = 'daggerheart', campaignId = null) {
  // openaiKey is optional — the backend will use OPENAI_API_KEY env var if not provided

  console.log('Building portrait prompt for character:', character.name);
  const prompt = buildCharacterPortraitPrompt(character, gameSystem);
  console.log('Image prompt:', prompt);

  let dataUrl;
  try {
    dataUrl = await generatePortraitImage(prompt, openaiKey);
  } catch (error) {
    // Check for safety system rejection
    if (error.message && error.message.includes('safety system')) {
      console.warn(`Portrait generation for ${character.name} blocked by safety system. Retrying with simplified prompt...`);
      // Retry with appearance/backstory removed to be safe
      const safeCharacter = { ...character, appearanceDescription: '', backstory: '' };
      const safePrompt = buildCharacterPortraitPrompt(safeCharacter, gameSystem);
      console.log('Safe image prompt:', safePrompt);
      dataUrl = await generatePortraitImage(safePrompt, openaiKey);
    } else {
      throw error;
    }
  }

  // If campaignId provided, upload to Firebase Storage to avoid Firestore size limits
  if (campaignId) {
    const storageUrl = await uploadPortraitToStorage(dataUrl, campaignId, character.name);
    return storageUrl;
  }

  return dataUrl;
}

export const portraitGeneratorService = {
  generateNPCPortrait,
  generateCharacterPortrait,
  generateAdversaryPortrait,
  generateLocationPortrait,
  buildNPCPortraitPrompt,
  buildCharacterPortraitPrompt,
  buildAdversaryPortraitPrompt,
  buildLocationPortraitPrompt,
  generatePortraitImage
};

/**
 * Build an image prompt for a location portrait
 * @param {object} location - Location data with name, type, description, region, etc.
 * @param {string} gameSystem - The game system (daggerheart, starwarsd6, etc.)
 * @returns {string} Image prompt
 */
export function buildLocationPortraitPrompt(location, gameSystem = 'daggerheart') {
  const { name, type, description, region } = location;

  // Base style per game system
  let styleBase = '';
  if (gameSystem === 'starwarsd6') {
    styleBase = 'Star Wars landscape illustration, sci-fi environment, cinematic wide shot, dramatic lighting, concept art quality';
  } else {
    styleBase = 'Fantasy RPG landscape illustration, detailed fantasy environment, cinematic wide shot, dramatic lighting, painterly concept art quality';
  }

  // Map location types to visual cues
  const typeHints = {
    city: 'bustling city streets, architecture, rooftops',
    town: 'quaint town square, medieval buildings, marketplace',
    village: 'small rural village, cottages, dirt roads',
    tavern: 'cozy tavern interior, warm hearth light, wooden beams',
    inn: 'rustic inn, candlelit interior, welcoming atmosphere',
    dungeon: 'underground dungeon, stone corridors, torchlit',
    cave: 'natural cave system, stalactites, mysterious light',
    forest: 'dense ancient forest, towering trees, dappled sunlight',
    mountain: 'dramatic mountain peaks, alpine landscape',
    ruins: 'ancient crumbling ruins, overgrown stonework, mystery',
    temple: 'grand temple interior, stained glass, sacred atmosphere',
    castle: 'imposing castle, battlements, medieval fortification',
    port: 'bustling harbor, ships at dock, seaside town',
    wilderness: 'untamed wilderness, natural landscape, vast horizon',
    swamp: 'murky swamp, twisted trees, foggy waters',
    desert: 'vast desert landscape, sand dunes, harsh sun',
    underground: 'deep underground cavern, crystal formations, glowing fungi',
    other: ''
  };

  const typeHint = typeHints[type] || '';
  const regionContext = region ? `, in the ${region} region` : '';

  const prompt = `${styleBase}. ${name || 'A mysterious location'}${regionContext}. ${typeHint}. ${sanitizePortraitText(description) || ''}. Wide establishing shot, atmospheric, highly detailed, no text or labels, no people.`;

  return prompt;
}

/**
 * Generate a location portrait
 * @param {object} location - Location data
 * @param {string} openaiKey - Optional OpenAI API key
 * @param {string} gameSystem - Game system for style
 * @param {string} campaignId - Campaign ID for storage
 * @returns {Promise<string>} Portrait URL
 */
export async function generateLocationPortrait(location, openaiKey, gameSystem = 'daggerheart', campaignId = null) {
  // openaiKey is optional — the backend will use OPENAI_API_KEY env var if not provided

  console.log('Building portrait prompt for location:', location.name);
  const prompt = buildLocationPortraitPrompt(location, gameSystem);
  console.log('Image prompt:', prompt);

  let dataUrl;
  try {
    dataUrl = await generatePortraitImage(prompt, openaiKey);
  } catch (error) {
    // Check for safety system rejection
    if (error.message && error.message.includes('safety system')) {
      console.warn(`Portrait generation for ${location.name} blocked by safety system. Retrying with simplified prompt...`);
      // Retry with description removed to be safe
      const safeLocation = { ...location, description: '' };
      const safePrompt = buildLocationPortraitPrompt(safeLocation, gameSystem);
      console.log('Safe image prompt:', safePrompt);
      dataUrl = await generatePortraitImage(safePrompt, openaiKey);
    } else {
      throw error;
    }
  }

  // If campaignId provided, upload to Firebase Storage
  if (campaignId) {
    const storageUrl = await uploadPortraitToStorage(dataUrl, campaignId, `loc_${location.name}`);
    return storageUrl;
  }

  return dataUrl;
}
