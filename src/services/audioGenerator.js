/**
 * Audio Generation Service
 * Uses 1min.ai API (ElevenLabs) for AI-generated sound effects and music
 */

const ONEMIN_API_URL = 'https://api.1min.ai/api/features';

/**
 * Generate a sound effect using ElevenLabs via 1min.ai
 * @param {string} prompt - Description of the sound to generate
 * @param {string} apiKey - 1min.ai API key
 * @param {object} options - Generation options
 * @returns {Promise<string>} URL or base64 of the generated audio
 */
export async function generateSoundEffect(prompt, apiKey, options = {}) {
  const {
    duration = 5,
    promptInfluence = 0.3,
    outputFormat = 'mp3_44100_128'
  } = options;

  if (!apiKey) {
    throw new Error('API key is required for audio generation');
  }

  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Sound description is required');
  }

  try {
    const response = await fetch(ONEMIN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': apiKey
      },
      body: JSON.stringify({
        type: 'TEXT_TO_SOUND',
        model: 'elevenlabs-text-to-sound',
        conversationId: `sound-${Date.now()}`,
        promptObject: {
          text: prompt,
          duration_seconds: Math.min(Math.max(duration, 0.5), 30), // Clamp between 0.5-30
          prompt_influence: promptInfluence,
          output_format: outputFormat,
          loop: false
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Extract the audio URL from the response
    if (data.aiRecord?.aiRecordDetail?.resultObject?.[0]) {
      return data.aiRecord.aiRecordDetail.resultObject[0];
    }

    // Some responses might have a different structure
    if (data.result || data.url || data.audio_url) {
      return data.result || data.url || data.audio_url;
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
 * Curated royalty-free music tracks
 * These are from sources that allow embedding (Archive.org, etc.)
 */
export const CURATED_MUSIC = {
  battle: [
    {
      id: 'battle-1',
      name: 'Epic Battle Theme',
      artist: 'Fantasy RPG Music',
      url: 'https://archive.org/download/EpicBattleMusic/epic-battle-theme.mp3',
      duration: '3:24',
      mood: 'Intense, dramatic'
    }
  ],
  exploration: [
    {
      id: 'explore-1',
      name: 'Wanderer\'s Journey',
      artist: 'Ambient Fantasy',
      url: 'https://archive.org/download/AmbientFantasyMusic/wanderers-journey.mp3',
      duration: '4:12',
      mood: 'Peaceful, adventurous'
    }
  ],
  mystery: [
    {
      id: 'mystery-1',
      name: 'Dark Secrets',
      artist: 'Dungeon Sounds',
      url: 'https://archive.org/download/DungeonAmbience/dark-secrets.mp3',
      duration: '5:00',
      mood: 'Suspenseful, eerie'
    }
  ],
  tavern: [
    {
      id: 'tavern-1',
      name: 'The Merry Inn',
      artist: 'Medieval Tavern Music',
      url: 'https://archive.org/download/MedievalTavernMusic/merry-inn.mp3',
      duration: '3:45',
      mood: 'Cheerful, festive'
    }
  ],
  tension: [
    {
      id: 'tension-1',
      name: 'Approaching Danger',
      artist: 'Cinematic Scores',
      url: 'https://archive.org/download/CinematicTension/approaching-danger.mp3',
      duration: '2:30',
      mood: 'Ominous, building'
    }
  ],
  victory: [
    {
      id: 'victory-1',
      name: 'Triumphant Heroes',
      artist: 'Epic Orchestral',
      url: 'https://archive.org/download/EpicOrchestral/triumphant-heroes.mp3',
      duration: '1:45',
      mood: 'Heroic, celebratory'
    }
  ]
};

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
  CURATED_MUSIC,
  SOUND_PRESETS
};
