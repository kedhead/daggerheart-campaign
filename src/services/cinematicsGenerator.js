/**
 * AI for the table cinematics: intro subtitles, recap scripts, narration and
 * animated clips. Prompts and parsing live in components/Cinematics/
 * cinematicPlan.js; this file only talks to the API and Storage.
 */

import { aiService } from './aiService';
import { apiFetch } from './apiClient';
import { persistAudio, persistVideo } from './audioStorage';
import { animateStill } from './animateStill';
import { buildIntroPrompt, parseIntroSubtitles, buildRecapPrompt, parseRecapScript, parseRecapQuestion } from '../components/Cinematics/cinematicPlan';
import { NARRATOR_VOICES, DEFAULT_VOICE_KEY, probeDuration } from '../components/Storybook/narratorVoices';

/** Which text model to use: the DM's own key if they have one, else the server's. */
export function textProvider(getEffectiveKey) {
  const anthropic = getEffectiveKey?.('anthropic')?.key || null;
  const openai = getEffectiveKey?.('openai')?.key || null;
  return anthropic ? { apiKey: anthropic, provider: 'anthropic' } : { apiKey: openai, provider: openai ? 'openai' : 'anthropic' };
}

export async function writeIntroSubtitles({ entity, kind, campaign, storyNow, apiKey, provider }) {
  const text = await aiService.generate(buildIntroPrompt(entity, kind, { campaignName: campaign?.name, storyNow }), apiKey, provider);
  const subtitles = parseIntroSubtitles(text);
  if (!subtitles.length) throw new Error('The AI did not come back with any subtitles. Try again.');
  return subtitles;
}

export async function writeRecapScript({ campaign, sources, characters, apiKey, provider }) {
  const text = await aiService.generate(buildRecapPrompt({ campaignName: campaign?.name, sources, characters }), apiKey, provider);
  const beats = parseRecapScript(text);
  if (!beats.length) throw new Error('The AI did not come back with a recap. Try again.');
  return { beats, question: parseRecapQuestion(text) };
}

/** Read `text` aloud in a narrator voice and store the mp3. */
export async function narrate({ campaignId, text, voiceKey = DEFAULT_VOICE_KEY, fileName }) {
  const voice = NARRATOR_VOICES.find(v => v.key === voiceKey) || NARRATOR_VOICES[0];
  const resp = await apiFetch('/api/generate-narration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      voiceId: voice.id,
      voiceIds: voice.altIds || [],
      voiceSettings: voice.settings,
      style: voice.style,
      fallbackVoice: voice.fallbackVoice,
      apiKey: '__shared__'
    })
  });
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.error || `Narration failed (HTTP ${resp.status})`);
  }
  const { audio } = await resp.json();
  const url = await persistAudio(campaignId, audio, fileName);
  const duration = await probeDuration(url);
  return { url, duration, voiceKey: voice.key };
}

/** Animate a still into a stored clip: { url, storagePath }. */
export async function animateToClip({ campaignId, imageUrl, prompt, fileName, onStatus }) {
  const blob = await animateStill({ imageUrl, prompt, onStatus });
  return persistVideo(campaignId, blob, fileName);
}
