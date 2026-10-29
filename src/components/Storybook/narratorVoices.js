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
];
export const DEFAULT_VOICE_KEY = 'wizard';

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
