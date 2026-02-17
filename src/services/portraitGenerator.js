/**
 * Portrait Generator Service
 * Generates character portraits using DALL-E
 */

import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { ANCESTRIES } from '../data/systems/daggerheart';

/**
 * Visual appearance hints for Daggerheart ancestries.
 * Used to enrich DALL-E prompts so the AI knows what each fantasy race looks like.
 */
const ANCESTRY_VISUAL_HINTS = {
  'Clank': 'a mechanical automaton made of gears, brass, and enchanted metal plates, with glowing eyes and articulated joints',
  'Dragonborn': 'a dragon-like humanoid with scaled skin, a reptilian snout, and small horns',
  'Dwarf': 'a short, stocky humanoid with a thick beard and sturdy build',
  'Elf': 'a tall, graceful humanoid with pointed ears and angular features',
  'Faerie': 'a tiny winged fey creature with iridescent butterfly or dragonfly wings, delicate features',
  'Faun': 'a humanoid with goat legs, small curved horns, and pointed ears',
  'Firbolg': 'a large, gentle giant humanoid with broad features, slightly pointed ears, and a connection to nature',
  'Fungril': 'a mushroom-like humanoid with a cap-shaped head, spore-covered skin, and bioluminescent patches',
  'Galapa': 'a turtle-like humanoid with a large shell on their back, leathery green skin, and a wise weathered face',
  'Giant': 'a very tall and muscular humanoid towering over others',
  'Goblin': 'a small, scrappy green-skinned creature with large pointed ears and sharp teeth',
  'Halfling': 'a small, cheerful humanoid with curly hair and bare feet',
  'Human': 'a human',
  'Inferis': 'a humanoid with reddish or dark skin, small horns, and faintly glowing eyes suggesting infernal heritage',
  'Katari': 'a feline humanoid with cat-like ears, whiskers, a tail, and fur-covered skin',
  'Orc': 'a tall, muscular humanoid with tusks, strong jaw, and green or gray skin',
  'Ribbet': 'a frog-like humanoid with smooth amphibious skin, wide eyes, and webbed hands',
  'Simiah': 'an ape-like humanoid with long arms, a broad chest, and primate facial features',
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
 * Generate a portrait image using DALL-E
 * @param {string} prompt - DALL-E prompt
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<string>} Image data URL (base64)
 */
async function generatePortraitImage(prompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`DALL-E API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const imageUrl = data.data[0].url;

  // Download and convert to data URL so it doesn't expire
  console.log('Downloading DALL-E portrait to convert to data URL...');
  const dataUrl = await downloadImageAsDataUrl(imageUrl);
  console.log('Portrait converted to data URL');

  return dataUrl;
}

/**
 * Sanitize text to remove potential DALL-E safety triggers
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
 * Build a DALL-E prompt for a player character portrait
 * @param {object} character - Character data with name, class, ancestry, appearanceDescription, etc.
 * @param {string} gameSystem - The game system (daggerheart, starwarsd6, etc.)
 * @returns {string} DALL-E prompt
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

  // Enrich ancestry with visual description so DALL-E knows what the race looks like
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

  // Construct the full prompt
  const prompt = `${styleBase}. Portrait of ${characterContext}. ${ancestryDesc} ${appearance}. Heroic and determined expression. Head and shoulders portrait, detailed face, high quality, no text or labels.`;

  return prompt;
}

/**
 * Build a DALL-E prompt for an NPC portrait
 * @param {object} npc - NPC data with name, description, occupation, etc.
 * @param {string} gameSystem - The game system (daggerheart, starwarsd6, etc.)
 * @returns {string} DALL-E prompt
 */
function buildNPCPortraitPrompt(npc, gameSystem = 'daggerheart') {
  const { name, description, occupation, relationship } = npc;

  // Base style based on game system
  let styleBase = '';
  if (gameSystem === 'starwarsd6') {
    styleBase = 'Star Wars character portrait, sci-fi aesthetic, dramatic lighting, cinematic quality';
  } else {
    styleBase = 'Fantasy RPG character portrait, detailed fantasy art style, dramatic lighting, painterly quality';
  }

  // Build character description
  let characterDesc = '';
  if (description) {
    // Extract physical appearance from description if present
    characterDesc = sanitizePortraitText(description);
  }

  // Add occupation context
  let occupationContext = '';
  if (occupation) {
    occupationContext = `, ${occupation}`;
  }

  // Add mood/expression based on relationship
  let expression = 'neutral expression';
  if (relationship === 'ally') {
    expression = 'friendly and approachable expression';
  } else if (relationship === 'enemy') {
    expression = 'menacing or intense expression';
  }

  // Construct the full prompt
  const prompt = `${styleBase}. Portrait of ${name || 'a character'}${occupationContext}. ${characterDesc}. ${expression}. Head and shoulders portrait, detailed face, high quality, no text or labels.`;

  return prompt;
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
 * @param {string} openaiKey - OpenAI API key for DALL-E
 * @param {string} gameSystem - Game system for style
 * @param {string} campaignId - Campaign ID for storage (optional, will use data URL if not provided)
 * @returns {Promise<string>} Portrait URL (Firebase Storage URL if campaignId provided, otherwise data URL)
 */
export async function generateNPCPortrait(npc, openaiKey, gameSystem = 'daggerheart', campaignId = null) {
  if (!openaiKey) {
    throw new Error('OpenAI API key required for portrait generation');
  }

  console.log('Building portrait prompt for NPC:', npc.name);
  const prompt = buildNPCPortraitPrompt(npc, gameSystem);
  console.log('DALL-E prompt:', prompt);

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
      console.log('Safe DALL-E prompt:', safePrompt);
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
 * @param {string} openaiKey - OpenAI API key for DALL-E
 * @param {string} gameSystem - Game system for style
 * @param {string} campaignId - Campaign ID for storage (optional, will use data URL if not provided)
 * @returns {Promise<string>} Portrait URL (Firebase Storage URL if campaignId provided, otherwise data URL)
 */
export async function generateCharacterPortrait(character, openaiKey, gameSystem = 'daggerheart', campaignId = null) {
  if (!openaiKey) {
    throw new Error('OpenAI API key required for portrait generation');
  }

  console.log('Building portrait prompt for character:', character.name);
  const prompt = buildCharacterPortraitPrompt(character, gameSystem);
  console.log('DALL-E prompt:', prompt);

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
      console.log('Safe DALL-E prompt:', safePrompt);
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
  generateLocationPortrait,
  buildNPCPortraitPrompt,
  buildCharacterPortraitPrompt,
  buildLocationPortraitPrompt,
  generatePortraitImage
};

/**
 * Build a DALL-E prompt for a location portrait
 * @param {object} location - Location data with name, type, description, region, etc.
 * @param {string} gameSystem - The game system (daggerheart, starwarsd6, etc.)
 * @returns {string} DALL-E prompt
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
 * @param {string} openaiKey - OpenAI API key for DALL-E
 * @param {string} gameSystem - Game system for style
 * @param {string} campaignId - Campaign ID for storage
 * @returns {Promise<string>} Portrait URL
 */
export async function generateLocationPortrait(location, openaiKey, gameSystem = 'daggerheart', campaignId = null) {
  if (!openaiKey) {
    throw new Error('OpenAI API key required for portrait generation');
  }

  console.log('Building portrait prompt for location:', location.name);
  const prompt = buildLocationPortraitPrompt(location, gameSystem);
  console.log('DALL-E prompt:', prompt);

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
      console.log('Safe DALL-E prompt:', safePrompt);
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
