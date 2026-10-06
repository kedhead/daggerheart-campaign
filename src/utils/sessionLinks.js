// Which sessions an NPC or encounter belongs to, and when it was added — for
// the "Session" and "Added" filters on the NPC and Encounter pages.
//
// The links already existed, scattered: a session's `encounterLinks`, the
// NPCs a session plan created, an NPC's free-text "first met", and names in
// session recaps. Nothing drew them together, so finding "the NPCs from
// session 4" meant reading every card. New NPCs and encounters can also carry
// an explicit `sessionId`, set from the add/edit dialog.
//
// Pure — no React, no Firebase — so the rules can be tested, including what a
// PLAYER may infer: a planned session, a hidden session, or a session's DM
// notes must never put an NPC under a filter a player can see.

import { isVisibleToPlayers } from './playerVisibility';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Sessions this viewer can filter by. Players never see planned or hidden ones. */
export function visibleSessions(sessions = [], isDM = false) {
  return (sessions || []).filter(s => s && (isDM || (s.status !== 'planned' && isVisibleToPlayers(s))));
}

/** Newest first, labelled for a dropdown: "Session 4: The Ferry". */
export function sessionFilterOptions(sessions = [], { isDM = false } = {}) {
  return visibleSessions(sessions, isDM)
    .slice()
    .sort((a, b) =>
      (Number(b.number ?? b.sessionNumber) || 0) - (Number(a.number ?? a.sessionNumber) || 0)
      || String(b.date || '').localeCompare(String(a.date || '')))
    .map(s => {
      const n = s.number ?? s.sessionNumber;
      const title = s.title || 'Untitled session';
      const label = (n !== undefined && n !== null && n !== '') ? `Session ${n}: ${title}` : title;
      return { id: s.id, label: s.status === 'planned' ? `${label} (planned)` : label };
    });
}

function encounterIdsOf(session) {
  return String(session?.encounterLinks || '')
    .split(',')
    .map(x => x.trim().replace(/^encounter:\/\//, ''))
    .filter(Boolean);
}

function textsFor(session, isDM) {
  const highlights = Array.isArray(session.highlights) ? session.highlights : [];
  // DM notes are DM-only: a player's filter must never be built from them.
  const texts = isDM ? [session.summary, session.dmNotes, ...highlights] : [session.summary, ...highlights];
  return texts.filter(t => typeof t === 'string' && t);
}

/**
 * The ids of the sessions an NPC or encounter is linked to, for this viewer.
 *
 * @param {object} entity - an NPC or encounter
 * @param {Array} sessions
 * @param {{ kind?: 'npc'|'encounter', isDM?: boolean }} opts
 * @returns {Set<string>}
 */
export function linkedSessionIds(entity, sessions = [], { kind = 'npc', isDM = false } = {}) {
  const ids = new Set();
  if (!entity) return ids;
  const name = typeof entity.name === 'string' ? entity.name.trim() : '';
  // Three characters minimum, as everywhere else names are matched in prose.
  const mentions = name.length >= 3 ? new RegExp(`\\b${escapeRegex(name)}\\b`, 'i') : null;
  const firstMet = kind === 'npc' && typeof entity.firstMet === 'string' ? entity.firstMet.trim().toLowerCase() : '';

  for (const s of visibleSessions(sessions, isDM)) {
    if (!s.id) continue;
    if (entity.sessionId && entity.sessionId === s.id) { ids.add(s.id); continue; }
    if (kind === 'encounter' && entity.id && encounterIdsOf(s).includes(entity.id)) { ids.add(s.id); continue; }
    if (kind === 'npc' && entity.id && Array.isArray(s.npcIds) && s.npcIds.includes(entity.id)) { ids.add(s.id); continue; }
    if (firstMet && typeof s.title === 'string' && s.title.trim().toLowerCase() === firstMet) { ids.add(s.id); continue; }
    if (mentions && textsFor(s, isDM).some(t => mentions.test(t))) ids.add(s.id);
  }
  return ids;
}

/** When the entity was added, in ms, or 0 if unknown (older records). */
export function createdAtMillis(entity) {
  const c = entity?.createdAt;
  if (!c) return 0;
  if (typeof c.toMillis === 'function') return c.toMillis();
  if (typeof c.seconds === 'number') return c.seconds * 1000;
  if (c instanceof Date) return c.getTime();
  const t = Date.parse(c);
  return Number.isNaN(t) ? 0 : t;
}

export const ADDED_RANGES = [
  { id: 'any', label: 'Any time', days: null },
  { id: '7', label: 'Past week', days: 7 },
  { id: '30', label: 'Past month', days: 30 },
  { id: '90', label: 'Past 3 months', days: 90 },
];

export const SORTS = {
  newest: (a, b) => (createdAtMillis(b) - createdAtMillis(a)) || String(a.name || '').localeCompare(String(b.name || '')),
  oldest: (a, b) => (createdAtMillis(a) - createdAtMillis(b)) || String(a.name || '').localeCompare(String(b.name || '')),
  name: (a, b) => String(a.name || '').localeCompare(String(b.name || '')),
};

/**
 * Apply the Session and Added filters.
 *
 * @param {Array} list - NPCs or encounters
 * @param {object} opts
 * @param {string} opts.session - 'all', 'none' (linked to no session), or a session id
 * @param {string} opts.added - an ADDED_RANGES id
 * @param {number} opts.now - injected so this stays pure
 */
export function filterBySessionAndDate(list = [], { session = 'all', added = 'any', sessions = [], kind = 'npc', isDM = false, now = 0 } = {}) {
  const range = ADDED_RANGES.find(r => r.id === added) || ADDED_RANGES[0];
  const cutoff = range.days ? now - range.days * 24 * 60 * 60 * 1000 : null;
  return (list || []).filter(entity => {
    if (cutoff !== null) {
      const at = createdAtMillis(entity);
      // Records from before dates were stored can't be placed in a window.
      if (!at || at < cutoff) return false;
    }
    if (session === 'all') return true;
    const linked = linkedSessionIds(entity, sessions, { kind, isDM });
    return session === 'none' ? linked.size === 0 : linked.has(session);
  });
}
