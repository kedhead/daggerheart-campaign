// Helpers that let the campaign remember what happened in it.
//
// Most of what these answer was already sitting in the data — which session
// recaps name an NPC, which chapters put them in the spotlight, which NPCs live
// at a location — and nothing showed it. Pure (no React, no Firebase) so the
// rules about what a PLAYER may see can be tested, because the easy version of
// every one of these leaks spoilers:
//
//   · a planned session's prep would announce that an NPC "appears in
//     Session 7" before Session 7 happens;
//   · a session's dmNotes are DM-only text;
//   · draft chapters aren't published yet;
//   · hidden NPCs are hidden.

import { sessionRecapTexts } from './storyGraph';
import { isVisibleToPlayers } from './playerVisibility';

// ── Live notes ───────────────────────────────────────────────────────────────

/**
 * Finalizing a session used to batch-DELETE every live note — players' notes
 * included — the moment the recap was saved. Notes are now kept and marked
 * archived instead. Filtering archived notes out of the live feed preserves the
 * one useful thing the delete did: a session that goes live again starts clean.
 */
export function isArchivedNote(note) {
  return !!note?.archived;
}

// The live transcription panel posts its whole summary as one starred note.
// That's a page of text, not a highlight, so it stays out of the highlights.
export const TRANSCRIPTION_NOTE_PREFIX = '🎙️ **AI Transcription Notes:**';

/** The starred live notes worth keeping as a session's highlights. */
export function starredHighlights(notes = []) {
  return (notes || [])
    .filter(n => n && n.isHighlight && !isArchivedNote(n))
    .map(n => (typeof n.content === 'string' ? n.content.trim() : ''))
    .filter(text => text && !text.startsWith(TRANSCRIPTION_NOTE_PREFIX));
}

/** Starred notes join the session's highlights, without duplicating any. */
export function mergeHighlights(existing = [], additions = []) {
  const out = [];
  const seen = new Set();
  for (const h of [...(existing || []), ...(additions || [])]) {
    const text = typeof h === 'string' ? h.trim() : '';
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

// Must match WikiText's own pattern, so both agree on what a link is.
const WIKI_LINK = /\[\[([^\]]+)\]\]/g;

/**
 * Names the table deliberately linked with [[...]] that have no page yet.
 * Only explicit links count — guessing at capitalised words would offer to
 * create "The" and "Tuesday".
 *
 * @param {string[]} texts
 * @param {(name: string) => any} resolves - truthy if an entity has this name
 */
export function unresolvedLinks(texts = [], resolves = () => null) {
  const out = [];
  const seen = new Set();
  for (const text of texts) {
    if (typeof text !== 'string') continue;
    for (const m of text.matchAll(WIKI_LINK)) {
      const name = m[1].trim();
      const key = name.toLowerCase();
      if (!name || seen.has(key)) continue;
      seen.add(key);
      if (!resolves(name)) out.push(name);
    }
  }
  return out;
}

// ── Appears in ───────────────────────────────────────────────────────────────

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Newest first: by date string (YYYY-MM-DD sorts lexically), then number.
function newestFirst(a, b) {
  const d = String(b.date || '').localeCompare(String(a.date || ''));
  if (d !== 0) return d;
  return (Number(b.sessionNumber ?? b.number) || 0) - (Number(a.sessionNumber ?? a.number) || 0);
}

/**
 * Where an NPC or location shows up across the campaign.
 *
 * @param {object} entity - needs `name`; `id` for chapter spotlights
 * @param {object} opts
 * @param {'npc'|'location'} opts.kind
 * @param {boolean} opts.isDM - players see only played sessions, the public
 *   parts of their recaps, published chapters, and visible NPCs
 */
export function appearancesFor(entity, { sessions = [], chapters = [], npcs = [], kind = 'npc', isDM = false } = {}) {
  const empty = { sessions: [], chapters: [], npcsHere: [] };
  const name = typeof entity?.name === 'string' ? entity.name.trim() : '';
  // Three characters minimum, matching autoLinkText: shorter names match
  // inside ordinary words.
  if (name.length < 3) return empty;
  const mentions = new RegExp(`\\b${escapeRegex(name)}\\b`, 'i');

  const sessionHits = sessions
    .filter(s => s && s.status !== 'planned' && (isDM || isVisibleToPlayers(s)))
    .filter(s => {
      const texts = isDM
        ? sessionRecapTexts(s)
        : [s.summary, ...(Array.isArray(s.highlights) ? s.highlights : [])];
      return texts.some(t => typeof t === 'string' && mentions.test(t));
    })
    .sort(newestFirst);

  const chapterHits = entity?.id
    ? chapters
        .filter(c => c && (isDM || c.status === 'published'))
        .map(c => {
          const spot = (c.spotlights || []).find(s => s?.entityId === entity.id);
          return spot ? { chapter: c, moment: spot.moment || '' } : null;
        })
        .filter(Boolean)
        .sort((a, b) => (Number(a.chapter.chapterNumber) || 0) - (Number(b.chapter.chapterNumber) || 0))
    : [];

  const npcsHere = kind === 'location'
    ? npcs
        .filter(n => (isDM || isVisibleToPlayers(n)))
        .filter(n => typeof n?.location === 'string' && n.location.trim().toLowerCase() === name.toLowerCase())
    : [];

  return { sessions: sessionHits, chapters: chapterHits, npcsHere };
}

// ── Previously on… ───────────────────────────────────────────────────────────

/**
 * The Dashboard's "Recent Sessions": played sessions the viewer may see, most
 * recent first. It used to list every session by number — so next week's
 * planned session, prep and all, sat at the top, and players saw hidden ones.
 */
export function recentPlayedSessions(sessions = [], { isDM = false, limit = 3 } = {}) {
  return (sessions || [])
    .filter(s => s && s.status !== 'planned' && (isDM || isVisibleToPlayers(s)))
    .sort((a, b) => ((Number(b.number) || 0) - (Number(a.number) || 0)) || newestFirst(a, b))
    .slice(0, limit);
}

/** Wiki-link markup as plain prose, for places that can't render links. */
export function stripWikiLinks(text) {
  return typeof text === 'string' ? text.replace(WIKI_LINK, '$1') : '';
}

/**
 * What the table needs before the next session: the last session actually
 * played, its chapter if one's been written, the open quests, and when they
 * next meet.
 *
 * "Recent sessions" on the Dashboard used to include PLANNED sessions, so the
 * DM's prep for next week showed up as if it had happened.
 *
 * @param {string} today - YYYY-MM-DD; injected so this stays pure
 */
export function previouslyOn({ sessions = [], chapters = [], quests = [], isDM = false, today = '' } = {}) {
  const visible = (sessions || []).filter(s => s && (isDM || isVisibleToPlayers(s)));
  const played = visible.filter(s => s.status === 'completed').sort(newestFirst);
  const session = played[0] || null;

  const chapter = session
    ? (chapters || []).find(c => c?.sessionId === session.id && (isDM || c.status === 'published')) || null
    : null;

  const activeQuests = (quests || [])
    .filter(q => q && q.status === 'active' && (isDM || isVisibleToPlayers(q)))
    .slice(0, 5);

  const nextSession = visible
    .filter(s => s.status === 'planned' && typeof s.date === 'string' && s.date && (!today || s.date >= today))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0] || null;

  return { session, chapter, activeQuests, nextSession };
}
