/**
 * AI for the table cinematics: intro subtitles, recap scripts, narration and
 * animated clips. Prompts and parsing live in components/Cinematics/
 * cinematicPlan.js; this file only talks to the API and Storage.
 */

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { aiService } from './aiService';
import { apiFetch } from './apiClient';
import { persistAudio, persistVideo } from './audioStorage';
import { animateStill } from './animateStill';
import { buildIntroPrompt, parseIntroSubtitles, buildRecapPrompt, parseRecapScript, parseRecapQuestion, buildStoryboardPrompt, parseStoryboard, ACCOUNT_VOICE_PREFIX } from '../components/Cinematics/cinematicPlan';
import { NARRATOR_VOICES, CHARACTER_VOICES, DEFAULT_VOICE_KEY, probeDuration } from '../components/Storybook/narratorVoices';

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

/** The shot list for the animated recap: the script's beats storyboarded into short shots and a spoken line or two. */
export async function writeStoryboard({ campaign, beats, sources, cast, characters, npcs, adversaries = [], apiKey, provider }) {
  // The writer sees only who was in the session; the whole roster is kept to catch anyone it names anyway.
  const rosters = { characters: characters || [], npcs: npcs || [], adversaries };
  const there = cast || rosters;
  const text = await aiService.generate(buildStoryboardPrompt({ campaignName: campaign?.name, beats, sources, ...there }), apiKey, provider);
  const known = [...rosters.characters, ...rosters.npcs, ...rosters.adversaries].map(e => e?.name).filter(Boolean);
  const shots = parseStoryboard(text, beats, `${Date.now().toString(36)}-`, known, { rosters, cast: there });
  if (!shots.some(s => s.camera)) throw new Error('The AI did not come back with a storyboard. Try again.');
  return shots;
}

let accountVoicesOnce = null;

/** The voices made in the DM's own ElevenLabs account: [{ id, name, category }]. Asked for once per visit. */
export function listAccountVoices() {
  if (!accountVoicesOnce) {
    accountVoicesOnce = (async () => {
      const resp = await apiFetch('/api/generate-narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'voices' })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || `Could not list the ElevenLabs voices (HTTP ${resp.status})`);
      return Array.isArray(data.voices) ? data.voices : [];
    })();
    // A failure is not remembered: the next visit asks again.
    accountVoicesOnce.catch(() => { accountVoicesOnce = null; });
  }
  return accountVoicesOnce;
}

/** Remember which of the DM's ElevenLabs voices a character speaks in, on the character. */
export async function saveCharacterVoice(campaignId, characterId, voice) {
  await updateDoc(doc(db, `campaigns/${campaignId}/characters`, characterId), { recapVoice: voice ? { id: voice.id, name: voice.name } : null });
}

/** Read `text` aloud in a narrator's or a character's voice and store the mp3. */
export async function narrate({ campaignId, text, voiceKey = DEFAULT_VOICE_KEY, fileName }) {
  // "el:<id>" is a voice from the DM's own ElevenLabs account.
  const own = String(voiceKey || '').startsWith(ACCOUNT_VOICE_PREFIX)
    ? { key: voiceKey, id: voiceKey.slice(ACCOUNT_VOICE_PREFIX.length), fallbackVoice: 'ash', style: 'Speak as a character in an animated adventure: natural, in the moment, with feeling.' }
    : null;
  const voice = own || [...NARRATOR_VOICES, ...CHARACTER_VOICES].find(v => v.key === voiceKey) || NARRATOR_VOICES[0];
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
