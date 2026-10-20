/**
 * Second Draft — asks the editor (api/generate-storybook, action 'revise') to
 * rewrite one chapter for the book, and shapes the result for the chapter doc.
 *
 * The draft lives on the chapter as `bookDraft`, beside the chronicle text
 * rather than over it: the Chronicle keeps the story as it was played, and
 * the book uses the draft only once the author accepts it.
 */
import { apiFetch } from './apiClient';
import { revisionContext, proseFingerprint, epilogueContext } from '../utils/bookLayout';

export async function writeSecondDraft({ bound, index, characters, npcs, sessions, threads, dialogue, gameSystem, apiKey }) {
  const ctx = revisionContext({ bound, index, characters, npcs, sessions, threads });
  const res = await apiFetch('/api/generate-storybook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'revise', ...ctx, dialogue, gameSystem, apiKey: apiKey || undefined })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Second draft failed (${res.status}).`);

  const chapter = bound[index];
  return {
    prose: data.prose,
    title: data.title && data.title !== chapter.title ? data.title : '',
    notes: data.notes || [],
    shrunk: !!data.shrunk,
    status: 'review',
    basedOn: proseFingerprint(chapter.prose),
    createdAt: new Date().toISOString()
  };
}

export async function writeEpilogue({ bound, characters, threads, guidance, gameSystem, apiKey }) {
  const res = await apiFetch('/api/generate-storybook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'epilogue', ...epilogueContext({ bound, characters, threads, guidance }), gameSystem, apiKey: apiKey || undefined })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Epilogue failed (${res.status}).`);
  return { title: data.title || 'Epilogue', prose: data.prose, createdAt: new Date().toISOString() };
}

export async function writeBlurb({ bound, characters, title, gameSystem, apiKey }) {
  const { outline, cast } = epilogueContext({ bound, characters });
  const res = await apiFetch('/api/generate-storybook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'blurb', outline, cast, title, gameSystem, apiKey: apiKey || undefined })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Blurb failed (${res.status}).`);
  return data.blurb;
}
