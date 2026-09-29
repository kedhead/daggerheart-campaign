// Cache key for an entity's source portrait, used by ensureStyledPortrait to
// decide whether a styled portrait can be reused or must be regenerated.
//
// Kept in its own module, free of Firebase imports, so it can be unit tested —
// storybookGenerator.js pulls in the Firebase config and can't be imported by
// the node test harness.

/**
 * A stable discriminator for a source portrait.
 *
 * Storage URLs compare directly. Base64 `data:` URLs cannot be stored in
 * Firestore at all — they run to hundreds of KB and would breach the 1 MB
 * document limit — so the cache previously wrote `null` for them and then
 * compared that `null` against a live `data:…` string. The comparison could
 * never be true, so any entity with a hand-uploaded avatar had its styled
 * portrait regenerated on EVERY chapter, forever, and the cache never healed.
 *
 * Fingerprinting the bytes fixes it: stable across runs, a few dozen characters
 * long, and safe to store. djb2 is not cryptographic and doesn't need to be —
 * the only question being asked is "is this the same image as last time".
 *
 * @param {string|null} url - the entity's avatar/portrait URL, or a data URL
 * @returns {string|null} a value safe to persist and compare, or null
 */
export function sourcePortraitKey(url) {
  if (typeof url !== 'string' || !url) return null;
  if (!url.startsWith('data:')) return url;

  let hash = 5381;
  for (let i = 0; i < url.length; i += 1) {
    hash = ((hash << 5) + hash + url.charCodeAt(i)) | 0;
  }
  return `data:${url.length}:${(hash >>> 0).toString(36)}`;
}

/**
 * The key a previously cached portrait was stored under.
 *
 * `sourcePortraitUrl` is the legacy field name for the same idea. Reading it as
 * a fallback keeps every already-cached Storage-URL portrait hitting instead of
 * forcing one pointless regeneration across a whole campaign on first deploy.
 */
export function cachedPortraitKey(existing) {
  return existing?.sourcePortraitKey ?? existing?.sourcePortraitUrl ?? null;
}
