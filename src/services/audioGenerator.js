/**
 * Audio Generation Service
 * Uses Vercel API route which connects to 1min.ai (ElevenLabs) for sound effects
 */

/**
 * Generate a sound effect using ElevenLabs via 1min.ai
 * @param {string} prompt - Description of the sound to generate
 * @param {string} _apiKey - Unused (API key is in Vercel env)
 * @param {object} options - Generation options
 * @returns {Promise<string>} URL of the generated audio
 */
export async function generateSoundEffect(prompt, _apiKey, options = {}) {
  const {
    duration = 5,
    promptInfluence = 0.3,
    outputFormat = 'mp3_44100_128'
  } = options;

  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Sound description is required');
  }

  try {
    const response = await fetch('/api/generate-sound', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        duration,
        promptInfluence,
        outputFormat
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('Sound API response:', { audioUrl: data.audioUrl, keys: Object.keys(data) });

    if (data.audioUrl) {
      return data.audioUrl;
    }

    throw new Error('No audio URL in response');
  } catch (error) {
    console.error('Sound generation error:', error);
    throw error;
  }
}

/**
 * Generate background music using AI
 * @param {string} theme - Theme/mood for the music (e.g., "epic battle", "peaceful tavern")
 * @param {string} apiKey - 1min.ai API key
 * @param {object} options - Generation options
 * @returns {Promise<string>} URL of the generated music
 */
export async function generateBackgroundMusic(theme, apiKey, options = {}) {
  const {
    duration = 30,
    promptInfluence = 0.5
  } = options;

  // Enhance the prompt for better music generation
  const musicPrompt = `Background music for ${theme}. Fantasy RPG style, loopable, instrumental only. High quality orchestral or ambient music suitable for tabletop gaming.`;

  return generateSoundEffect(musicPrompt, apiKey, {
    duration,
    promptInfluence,
    outputFormat: 'mp3_44100_192' // Higher quality for music
  });
}

/**
 * Sound effect presets for quick generation
 */
export const SOUND_PRESETS = {
  combat: [
    { prompt: 'Sword clashing against metal shield, medieval battle', duration: 2 },
    { prompt: 'Arrow flying through air and hitting wooden target', duration: 2 },
    { prompt: 'Heavy punch impact with grunt, fighting', duration: 1.5 },
    { prompt: 'Large explosion with debris, fiery blast', duration: 3 },
    { prompt: 'War horn blowing, distant battle cry', duration: 4 },
    { prompt: 'Armor clanking, knight walking on stone', duration: 3 }
  ],
  magic: [
    { prompt: 'Magical spell casting with shimmering energy, fantasy', duration: 3 },
    { prompt: 'Healing spell with warm glowing light, peaceful magic', duration: 4 },
    { prompt: 'Teleportation whoosh with ethereal chimes', duration: 2 },
    { prompt: 'Lightning bolt spell, electric crackling', duration: 2 },
    { prompt: 'Fire spell, roaring flames with magical undertone', duration: 3 },
    { prompt: 'Ice magic, crystalline freezing sounds', duration: 3 }
  ],
  nature: [
    { prompt: 'Heavy rain on forest leaves, occasional thunder', duration: 10 },
    { prompt: 'Loud thunder crack with rumbling echo', duration: 5 },
    { prompt: 'Strong wind howling through mountain pass', duration: 8 },
    { prompt: 'Forest ambience with birds singing, peaceful', duration: 15 },
    { prompt: 'Ocean waves crashing on beach, seagulls', duration: 12 },
    { prompt: 'Campfire crackling, wood burning, cozy', duration: 10 }
  ],
  ambient: [
    { prompt: 'Medieval tavern crowd, murmuring voices, clinking glasses', duration: 15 },
    { prompt: 'Dungeon dripping water, distant chains, eerie', duration: 10 },
    { prompt: 'Busy medieval marketplace, merchants calling', duration: 12 },
    { prompt: 'Creaky wooden door slowly opening, horror', duration: 3 },
    { prompt: 'Church bells ringing, echoing in distance', duration: 8 },
    { prompt: 'Heartbeat sound, tense moment, slow then fast', duration: 5 }
  ],
  creatures: [
    { prompt: 'Dragon roar, massive beast, terrifying', duration: 4 },
    { prompt: 'Wolf howling at night, lonely, distant', duration: 5 },
    { prompt: 'Monster growl, deep threatening rumble', duration: 3 },
    { prompt: 'Ghost wailing, ethereal scary moaning', duration: 4 },
    { prompt: 'Goblin cackling laugh, mischievous', duration: 2 },
    { prompt: 'Horse neighing and galloping, hooves on dirt', duration: 4 }
  ]
};

export default {
  generateSoundEffect,
  generateBackgroundMusic,
  SOUND_PRESETS
};
