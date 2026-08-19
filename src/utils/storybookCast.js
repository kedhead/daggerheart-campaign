// Who is allowed to appear in a storybook chapter.
//
// PURE — no React, no network. The chapter writer used to be handed the entire
// campaign roster (every character, NPC and adversary, deceased included) with
// nothing marking who was actually in the session, and nothing validated the
// entity ids it sent back. Those ids become reference PORTRAITS for the image
// model, so a character who was never mentioned would be drawn into the scene
// anyway — emphatically, since the prompt says "the characters in this scene are
// the people shown in the reference images".
//
// The cast is now chosen explicitly and enforced at both ends: the writer only
// ever sees cast entities, and anything it returns outside the cast is dropped
// before it can reach a portrait.

/** All the free text a session carries, as one searchable blob. */
export function sessionNotesText(session) {
  if (!session) return '';
  const parts = [
    session.title,
    session.summary,
    Array.isArray(session.highlights) ? session.highlights.join('\n') : session.highlights,
    session.dmNotes,
    session.liveNotesCompiled,
  ];
  return parts.filter(Boolean).join('\n');
}

const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Does `name` appear in `text` as a whole word?
 *
 * Substring matching is not good enough: a character called "Al" would match
 * "already", and "Cosmo" would match "cosmopolitan". \b alone misplaces on names
 * with punctuation, so the name is escaped and bounded on both sides. Possessives
 * still match ("Emmanita's plan" contains "Emmanita" followed by an apostrophe,
 * which is a word boundary).
 */
export function nameAppearsIn(name, text) {
  const clean = String(name || '').trim();
  if (!clean || !text) return false;
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(clean)}($|[^\\p{L}\\p{N}])`, 'iu').test(text);
}

/**
 * Entities whose name shows up in the session notes.
 *
 * Notes usually use first names, so a single-word prefix also counts — but only
 * when it is unambiguous across the whole roster, so two characters called
 * "Kael Something" and "Kael Otherthing" don't both get pulled in by "Kael".
 *
 * Deceased characters are never auto-selected. They remain selectable by hand,
 * because flashbacks and death scenes are legitimate chapters.
 */
export function mentionedEntityIds({ characters = [], npcs = [], adversaries = [] } = {}, notesText = '') {
  const all = [
    ...characters.map(e => ({ e, deceased: !!e.deceased })),
    ...npcs.map(e => ({ e, deceased: false })),
    ...adversaries.map(e => ({ e, deceased: false })),
  ].filter(({ e }) => e && e.id && e.name);

  // Count first names so an ambiguous one can be ignored.
  const firstNameCounts = new Map();
  all.forEach(({ e }) => {
    const first = String(e.name).trim().split(/\s+/)[0];
    if (first && first.length >= 3) {
      firstNameCounts.set(first.toLowerCase(), (firstNameCounts.get(first.toLowerCase()) || 0) + 1);
    }
  });

  const ids = [];
  all.forEach(({ e, deceased }) => {
    if (deceased) return;
    const full = String(e.name).trim();
    const first = full.split(/\s+/)[0];
    const firstIsUsable = first
      && first.length >= 3
      && firstNameCounts.get(first.toLowerCase()) === 1;
    if (nameAppearsIn(full, notesText) || (firstIsUsable && nameAppearsIn(first, notesText))) {
      ids.push(e.id);
    }
  });
  return ids;
}

/** Narrow each roster to the chosen cast. */
export function scopeRosters({ characters = [], npcs = [], adversaries = [] } = {}, castIds) {
  if (!Array.isArray(castIds)) return { characters, npcs, adversaries };
  const allowed = new Set(castIds);
  return {
    characters: characters.filter(c => allowed.has(c.id)),
    npcs: npcs.filter(n => allowed.has(n.id)),
    adversaries: adversaries.filter(a => allowed.has(a.id)),
  };
}

/**
 * Drop entity references the cast doesn't include.
 *
 * The load-bearing guard: this runs before the generator collects featuredIds,
 * so an out-of-cast entity can never reach the portrait map and therefore never
 * becomes a scene reference image, however the model misbehaves.
 *
 * A scene that loses all of its ids is KEPT — its caption and prompt are still
 * good, and it simply becomes an atmosphere shot, which the writer prompt
 * already treats as a valid scene.
 */
export function sanitizeChapterCast(chapterText, castIds) {
  if (!chapterText || !Array.isArray(castIds)) return { chapter: chapterText, removed: [] };
  const allowed = new Set(castIds);
  const removed = [];

  const scenes = (chapterText.scenes || []).map(scene => {
    const ids = scene.featuredEntityIds || [];
    const kept = ids.filter(id => allowed.has(id));
    ids.filter(id => !allowed.has(id)).forEach(id => removed.push(id));
    return kept.length === ids.length ? scene : { ...scene, featuredEntityIds: kept };
  });

  const spotlights = (chapterText.spotlights || []).filter(s => {
    if (s.entityId && !allowed.has(s.entityId)) { removed.push(s.entityId); return false; }
    return true;
  });

  return { chapter: { ...chapterText, scenes, spotlights }, removed };
}
