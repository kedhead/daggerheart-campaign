/**
 * Soft-delete ("trash") helpers for characters.
 *
 * Deleting a character used to remove the Firestore document outright, which
 * meant a single mis-click destroyed a sheet with no way back. Deletes now
 * stamp the document instead, so the character disappears from every view but
 * the data survives until someone deliberately empties the trash.
 *
 * Kept free of Firebase imports so it can be unit tested.
 */

/** A character is trashed once it carries a delete stamp. */
export function isTrashed(character) {
  return !!(character && (character.deletedAt || character.deleted === true));
}

/**
 * Split a raw character list into the roster and the trash.
 * Trashed characters come back newest-deleted-first.
 */
export function partitionCharacters(characters = []) {
  const active = [];
  const trashed = [];

  for (const character of characters) {
    (isTrashed(character) ? trashed : active).push(character);
  }

  trashed.sort((a, b) => String(b.deletedAt || '').localeCompare(String(a.deletedAt || '')));

  return { active, trashed };
}

/**
 * Fields written when a character is moved to the trash.
 * `deletedAt` is a client ISO string rather than serverTimestamp() so the
 * character leaves the roster immediately — a pending serverTimestamp() reads
 * back as null locally, which would flash the character back into the list.
 */
export function trashFields(user) {
  return {
    deleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: user?.uid || null,
    deletedByName: user?.displayName || user?.email || null,
  };
}

/** Human-readable "when was this deleted", e.g. "Aug 12, 2026". */
export function formatDeletedAt(deletedAt) {
  if (!deletedAt) return null;
  const date = new Date(deletedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Confirmation gate for a permanent delete: the typed text has to match the
 * character's name (case- and whitespace-insensitive).
 */
export function nameMatches(typed, name) {
  return String(typed || '').trim().toLowerCase() === String(name || '').trim().toLowerCase();
}
