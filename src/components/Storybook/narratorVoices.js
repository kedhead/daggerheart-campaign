// Narrator voices, shared by the storybook Motion Comic and the table
// cinematics ("Previously on…" recaps).

// Curated narrator presets. `id` is an ElevenLabs premade voice; `style` +
// `fallbackVoice` steer the OpenAI fallback (gpt-4o-mini-tts) so the presets
// still sound distinct when ElevenLabs is unavailable.
export const NARRATOR_VOICES = [
  {
    key: 'wizard', label: '🧙 Wizened Wizard', id: 'N2lVS1w4EtoT3dr4eOWO', // Callum — raspy, weathered
    fallbackVoice: 'ash',
    style: 'Speak as a wise, ancient wizard telling an epic tale by firelight: unhurried, warm and gravelly, with gentle dramatic pauses and quiet wonder.',
  },
  {
    key: 'elder', label: '📖 Old Storyteller', id: 'pqHfZKP75CvOlQylNhV4', // Bill — aged, warm
    fallbackVoice: 'fable',
    style: 'Speak as a kindly old storyteller by the hearth: slow, warm, weathered voice with fond amusement.',
  },
  {
    key: 'herald', label: '📯 Deep Herald', id: 'onwK4e9ZLuTAKqWW03F9', // Daniel — deep British
    fallbackVoice: 'onyx',
    style: 'Speak as a solemn royal herald: deep, formal, resonant delivery with gravity and precision.',
  },
  {
    key: 'bard', label: '🎻 Warm Bard', id: 'JBFqnCBsd6RMkjVDRZzb', // George — warm narrator
    fallbackVoice: 'ballad',
    style: 'Speak as a warm travelling bard: rich, engaging storytelling voice with easy charm.',
  },
  {
    // The movie-theatre trailer voice: as deep and booming as the library
    // goes, slowed down, with the drama turned right up.
    key: 'announcer', label: '🎬 Movie Trailer Voice',
    id: 'nPczCjzI2devNBz1zQrb', // Brian — deep, resonant
    altIds: ['pNInz6obpgDQGcFmaJgB', 'onwK4e9ZLuTAKqWW03F9'], // Adam, then Daniel, if the account lacks Brian
    settings: { stability: 0.28, similarity_boost: 0.85, style: 0.8, speed: 0.86 },
    fallbackVoice: 'onyx',
    style: 'You are the classic movie-theatre trailer narrator. Speak in an extremely deep, booming, gravelly bass voice, slow and heavy with gravitas. Leave long, dramatic pauses at every ellipsis and between sentences. Ominous, epic and larger than life, every word landing like thunder.',
  },
];
// Voices for characters who speak a line in the animated recap. ElevenLabs
// premade voices, each with stand-ins in case the account lacks one, and an
// OpenAI voice and acting note for when ElevenLabs is unavailable.
export const CHARACTER_VOICES = [
  { key: 'hero', label: 'Young hero', id: 'TX3LPaxmHKxFdv7VOQHJ', altIds: ['bIHbv24MWmeRgasZH58o'], fallbackVoice: 'echo',
    style: 'Speak as a young, earnest hero in an animated adventure: energetic, a little breathless, fully in the moment.' },
  { key: 'rogue', label: 'Sly rogue', id: 'IKne3meq5aSn9XLyUdCD', altIds: ['iP95p4xoKVk53GoZ742B'], fallbackVoice: 'verse',
    style: 'Speak as a quick-witted rogue in an animated adventure: wry, casual, amused by the danger.' },
  { key: 'veteran', label: 'Gruff veteran', id: 'N2lVS1w4EtoT3dr4eOWO', altIds: ['pqHfZKP75CvOlQylNhV4'], fallbackVoice: 'ash',
    style: 'Speak as a gruff, battle-worn veteran in an animated adventure: low, gravelly, few words and all of them meant.' },
  { key: 'noble', label: 'Noble & measured', id: 'JBFqnCBsd6RMkjVDRZzb', altIds: ['onwK4e9ZLuTAKqWW03F9'], fallbackVoice: 'fable',
    style: 'Speak as a composed, well-spoken noble in an animated adventure: warm, measured, quietly certain.' },
  { key: 'heroine', label: 'Bold heroine', id: 'EXAVITQu4vr4xnSDxMaL', altIds: ['cgSgspJ2msm6clMCkdW9'], fallbackVoice: 'nova',
    style: 'Speak as a bold, confident heroine in an animated adventure: clear, quick and unafraid.' },
  { key: 'sage', label: 'Wise woman', id: 'XB0fDUnXU5powFXDhCwa', altIds: ['Xb7hH8MSUJpSbSDYk0k2'], fallbackVoice: 'shimmer',
    style: 'Speak as a wise, knowing woman in an animated adventure: calm, a little mysterious, every word chosen.' },
  { key: 'bright', label: 'Bright & cheerful', id: 'pFZP5JQG7iQjIQuC4Bku', altIds: ['XrExE9yKIg1WeP5ZdCDD'], fallbackVoice: 'coral',
    style: 'Speak as a bright, cheerful young character in an animated adventure: light, eager and delighted.' },
  { key: 'menace', label: 'Menacing', id: 'pNInz6obpgDQGcFmaJgB', altIds: ['nPczCjzI2devNBz1zQrb'], fallbackVoice: 'onyx',
    settings: { stability: 0.3, similarity_boost: 0.85, style: 0.7, speed: 0.92 },
    style: 'Speak as a menacing villain in an animated adventure: deep, slow and cold, enjoying the threat.' },
];

export const DEFAULT_VOICE_KEY = 'wizard';
// "Previously on…" wants hype, not a fireside tale.
export const RECAP_VOICE_KEY = 'announcer';

// Probe an mp3's duration client-side.
export function probeDuration(url) {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = 'metadata';
    a.onloadedmetadata = () => resolve(Number.isFinite(a.duration) ? a.duration : 5);
    a.onerror = () => resolve(5);
    a.src = url;
  });
}
